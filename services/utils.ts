import { AnchorProvider, Program, Wallet } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import idl from '../idl.json'

export const getAnchorProgram = (connection: Connection, wallet: Wallet) => {
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' })
    const program = new Program(idl as any, new PublicKey(idl.metadata.address), provider)
    return program
}