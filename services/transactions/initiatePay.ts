import { BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { InitiatePayParams } from '../types';
import { getAnchorProgram } from '../utils';

export const getInitiatePayTransaction = async ({
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
    const program = getAnchorProgram(connection, wallet)
    return await program.methods
        .initiate(new BN(amount), applicationBump, escrowWalletBump)
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
}