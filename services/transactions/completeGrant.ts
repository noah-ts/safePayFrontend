import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { CompleteGrantParams } from '../types';
import { getAnchorProgram } from '../utils';

export const getCompleteGrantTransaction = async ({
    id,
    connection,
    wallet,
    walletToDepositTo,
    applicationState,
    escrowWalletState,
    userSending,
    userReceiving,
    mintOfTokenBeingSent
}: CompleteGrantParams) => {
    const program = getAnchorProgram(connection, wallet)
    return await program.methods
        .completeGrant(id)
        .accounts({
            walletToDepositTo,

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