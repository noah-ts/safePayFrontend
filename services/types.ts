import { BN, Wallet } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'

type CommonParams = {
    id: BN
    connection: Connection
    wallet: Wallet

    applicationState: PublicKey
    escrowWalletState: PublicKey
    userSending: PublicKey
    userReceiving: PublicKey
    mintOfTokenBeingSent: PublicKey
}

export type InitiatePayParams = CommonParams & {
    amount: number
    applicationBump: number
    escrowWalletBump: number

    walletToWithdrawFrom: PublicKey
}

export type PullBackFromEscrowParams = CommonParams & {
    refundWallet: PublicKey
}

export type CompleteGrantParams = CommonParams & {
    walletToDepositTo: PublicKey
}