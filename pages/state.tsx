import { BN } from '@project-serum/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { FormEvent, useMemo, useState } from 'react'
import { getCompleteGrantTransaction } from '../services/transactions/completeGrant'
import { getPullBackFromEscrowTransaction } from '../services/transactions/pullBackFromEscrow'
import { customGetOrCreateAssociatedTokenAccount, getAnchorProgram, getApplicationStatePda, getPdaParams } from '../services/utils'

const State = () => {
    const { connection } = useConnection()
    const wallet = useWallet()

    const [safePayState, setSafePayState] = useState<{
        amountTokens: BN,
        applicationStateBump: number,
        escrowWalletStateBump: number,
        escrowWallet: PublicKey,
        mintOfTokenBeingSent: PublicKey,
        userSending: PublicKey,
        userReceiving: PublicKey
    } | null>(null)

    const [applicationStatePubkey, setApplicationStatePubkey] = useState<PublicKey | null>(null)
    const [signature, setSignature] = useState('')

    const [inputValues, setInputValues] = useState({
        mintOfTokenBeingSent: '',
        userSending: '',
        userReceiving: ''
    })

    const actionType = useMemo(() => {
        if (!wallet || !wallet.publicKey || !safePayState) return null
        if (wallet.publicKey.toString() === safePayState.userSending.toString()) return 'pullBack'
        if (wallet.publicKey.toString() === safePayState.userReceiving.toString()) return 'completeGrant'
        return 'unknown'
    }, [wallet, safePayState])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!wallet || !wallet.publicKey) {
            alert('Please connect your wallet')
            return
        }

        const { userSending, userReceiving, mintOfTokenBeingSent } = inputValues

        const applicationState = await getApplicationStatePda(new PublicKey(userSending), new PublicKey(userReceiving), new PublicKey(mintOfTokenBeingSent))
        if (!applicationState) {
            alert('Error finding application state')
            return
        }
        setApplicationStatePubkey(applicationState)
        const program = getAnchorProgram(connection, wallet as any)
        const state = await program.account.state.fetch(applicationState)
        setSafePayState(state as any)
    }

    const handleClick = async () => {
        if (!wallet || !wallet.publicKey || !safePayState || !applicationStatePubkey) {
            return
        }

        const walletATA = await customGetOrCreateAssociatedTokenAccount(connection, wallet.publicKey, safePayState.mintOfTokenBeingSent, wallet.publicKey, wallet.sendTransaction)
        if (!walletATA) {
            alert('Error getting or creating associated token address')
            return
        }

        let transaction: Transaction | null = null

        if (actionType === 'pullBack') {
            transaction = await getPullBackFromEscrowTransaction({
                connection,
                wallet: wallet as any,
                refundWallet: walletATA.address,
                applicationState: applicationStatePubkey,
                escrowWalletState: safePayState.escrowWallet,
                userSending: safePayState.userSending,
                userReceiving: safePayState.userReceiving,
                mintOfTokenBeingSent: safePayState.mintOfTokenBeingSent
            })
        } else if (actionType === 'completeGrant') {
            transaction = await getCompleteGrantTransaction({
                connection,
                wallet: wallet as any,
                walletToDepositTo: walletATA.address,
                applicationState: applicationStatePubkey,
                escrowWalletState: safePayState.escrowWallet,
                userSending: safePayState.userSending,
                userReceiving: safePayState.userReceiving,
                mintOfTokenBeingSent: safePayState.mintOfTokenBeingSent
            })
        }

        if (!transaction) return

        try {
            const signature = await wallet.sendTransaction(transaction, connection, { preflightCommitment: 'confirmed' })
            setSignature(signature)
        } catch (error) {
            console.error('Error sending transaction to pull back or accept payment: ', error)
        }
    }
    
    return (
        <>
            <div className='mb-6'>
                <h2 className='text-xl'>receive tokens from friend or pull back your tokens from escrow</h2>
            </div>
            <form className='flex flex-col pr-10' onSubmit={handleSubmit}>
                <input
                    name='mintOfTokenBeingSent'
                    placeholder='mint'
                    value={inputValues.mintOfTokenBeingSent}
                    onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
                    className='p-2 mb-2 text-zinc-300 bg-zinc-800'
                />
                <input
                    name='userSending'
                    placeholder="sender"
                    value={inputValues.userSending}
                    onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
                    className='p-2 mb-2 text-zinc-300 bg-zinc-800'
                />
                <input
                    name='userReceiving'
                    placeholder="receiver"
                    value={inputValues.userReceiving}
                    onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
                    className='p-2 mb-6 text-zinc-300 bg-zinc-800'
                />
                <div>
                    <button type='submit' className='p-2 bg-gray-900 hover:bg-gray-800 font-bold text-xl'>submit</button>
                </div>
            </form>
            <div className='my-10 bg-zinc-800'></div>
            {safePayState && wallet && wallet.publicKey && (
                <div>
                    <p className='text-lg'>congrats, below is your application state</p>
                    <p className='text-lg'>
                        {actionType === 'pullBack' && 'now you can pull back your tokens from escrow'}
                        {actionType === 'completeGrant' && 'now you can accept payment'}
                    </p>
                    <pre>{JSON.stringify(safePayState, null, 2)}</pre>
                    <button className='mt-6 p-2 bg-gray-900 hover:bg-gray-800 font-bold text-xl' onClick={handleClick}>
                        {actionType === 'pullBack' && 'pull back from escrow'}
                        {actionType === 'completeGrant' && 'accept payment'}
                    </button>
                    {signature && (
                        <div>
                            <p className='text-lg'>success, signature is below</p>
                            <p>{signature}</p>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default State