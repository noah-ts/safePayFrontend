import { BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { LAMPORTS_PER_SOL, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { InitiatePayParams } from '../types';
import { getAnchorProgram } from '../utils';

export const getInitiatePayTransaction = async ({
    id,
    connection,
    wallet,
    amount,
    walletToWithdrawFrom,
    applicationState,
    applicationBump,
    escrowWalletState,
    escrowWalletBump,
    userSending,
    userReceiving,
    mintOfTokenBeingSent
}: InitiatePayParams) => {
    try {
        const program = getAnchorProgram(connection, wallet)
        const transaction = await program.methods
            .initiate(new BN(amount * LAMPORTS_PER_SOL), applicationBump, escrowWalletBump, id)
            .accounts({
                walletToWithdrawFrom,

                applicationState,
                escrowWalletState,
                userSending,
                userReceiving,
                mintOfTokenBeingSent,

                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID
            })
            .transaction()

        return { program, transaction }
    } catch (error) {
        console.error('Error getting initiate pay transaction: ', error)
    }
}