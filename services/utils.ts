import { AnchorProvider, BN, Program, Wallet } from '@project-serum/anchor'
import { Account, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAccount, getAssociatedTokenAddress, TokenAccountNotFoundError, TokenInvalidAccountOwnerError, TokenInvalidMintError, TokenInvalidOwnerError, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { SendTransactionOptions } from '@solana/wallet-adapter-base'
import { Commitment, Connection, PublicKey, Transaction, TransactionSignature } from '@solana/web3.js'
import idl from '../idl.json'

const programId = new PublicKey(idl.metadata.address)

export const getAnchorProgram = (connection: Connection, wallet: Wallet) => {
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' })
    const program = new Program(idl as any, programId, provider)
    return program
}

export const getApplicationStatePda = async (userSending: PublicKey, userReceiving: PublicKey, mint: PublicKey, id: BN) => {
    try {
        const idBuffer = id.toArrayLike(Buffer, 'le', 8)
        const [applicationState] = await PublicKey.findProgramAddress(
            [Buffer.from("safe_pay_noah_state"), userSending.toBuffer(), userReceiving.toBuffer(), mint.toBuffer(), idBuffer], programId,
        )

        return applicationState
    } catch (error) {
        console.error('Error getting application state pda: ', error)
    }
}

export const getPdaParams = async (userSending: PublicKey, userReceiving: PublicKey, mint: PublicKey) => {
    const id = parseInt((Date.now() / 1000).toString())
    const idBN = new BN(id)
    const idBuffer = idBN.toArrayLike(Buffer, 'le', 8)
    try {
        const [applicationState, applicationBump] = await PublicKey.findProgramAddress(
            [Buffer.from("safe_pay_noah_state"), userSending.toBuffer(), userReceiving.toBuffer(), mint.toBuffer(), idBuffer], programId,
        );
        const [escrowWalletState, escrowWalletBump] = await PublicKey.findProgramAddress(
            [Buffer.from("safe_pay_noah_wallet"), userSending.toBuffer(), userReceiving.toBuffer(), mint.toBuffer(), idBuffer], programId,
        );
        return {
            id,
            escrowWalletState,
            escrowWalletBump,
            applicationState,
            applicationBump
        }
    } catch (error) {
        console.error('Error getting pda params: ', error)
    }
}

export const customGetOrCreateAssociatedTokenAccount = async (
    connection: Connection,
    payerPublicKey: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    sendTransaction: (transaction: Transaction, connection: Connection, options?: SendTransactionOptions) => Promise<TransactionSignature>,
    allowOwnerOffCurve = false,
    commitment?: Commitment,
    programId = TOKEN_PROGRAM_ID,
    associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) => {
    try {
        const associatedToken = await getAssociatedTokenAddress(
            mint,
            owner,
            allowOwnerOffCurve,
            programId,
            associatedTokenProgramId
        );
    
        // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
        // Sadly we can't do this atomically.
        let account: Account;
        try {
            account = await getAccount(connection, associatedToken, commitment, programId);
        } catch (error: unknown) {
            // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
            // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
            // TokenInvalidAccountOwnerError in this code path.
            if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
                // As this isn't atomic, it's possible others can create associated accounts meanwhile.
                try {
                    const transaction = new Transaction().add(
                        createAssociatedTokenAccountInstruction(
                            payerPublicKey,
                            associatedToken,
                            owner,
                            mint,
                            programId,
                            associatedTokenProgramId
                        )
                    );
    
                    await sendTransaction(transaction, connection)
                } catch (error: unknown) {
                    // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
                    // instruction error if the associated account exists already.
                }
    
                // Now this should always succeed
                account = await getAccount(connection, associatedToken, commitment, programId);
            } else {
                throw error;
            }
        }
    
        if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
        if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();
    
        return account
    } catch (error) {
        console.error('Error getting or creating associated token address: ', error)
    }
}