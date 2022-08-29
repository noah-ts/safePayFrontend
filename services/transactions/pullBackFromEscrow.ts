import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { PullBackFromEscrowParams } from '../types';
import { getAnchorProgram } from '../utils';

export const getPullBackFromEscrowTransaction = async ({
    id,
    connection,
    wallet,
    refundWallet,
    applicationState,
    escrowWalletState,
    userSending,
    userReceiving,
    mintOfTokenBeingSent
}: PullBackFromEscrowParams) => {
    const program = getAnchorProgram(connection, wallet)
    return await program.methods
        .pullBack(id)
        .accounts({
            refundWallet,

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