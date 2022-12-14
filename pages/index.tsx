import type { NextPage } from 'next'
import { FormEvent, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor';
import { getInitiatePayTransaction } from '../services/transactions/initiatePay'
import { customGetOrCreateAssociatedTokenAccount, getPdaParams } from '../services/utils'

function delay(t: number, v?: any) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

const Home: NextPage = () => {
  const { connection } = useConnection()
  const wallet = useWallet()

  const [id, setId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [safePayState, setSafePayState] = useState<{
    amountTokens: BN,
    applicationStateBump: number,
    escrowWalletStateBump: number,
    escrowWallet: PublicKey,
    mintOfTokenBeingSent: PublicKey,
    userSending: PublicKey,
    userReceiving: PublicKey
  } | null>(null)

  const [inputValues, setInputValues] = useState({
    mintOfTokenBeingSent: '',
    userReceiving: '',
    amount: ''
  })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!wallet || !wallet.publicKey) {
      alert('Please connect your wallet')
      return
    }

    const { amount, userReceiving: userReceivingString, mintOfTokenBeingSent: mintOfTokenBeingSentString } = inputValues
    const userReceiving = new PublicKey(userReceivingString)
    const mintOfTokenBeingSent = new PublicKey(mintOfTokenBeingSentString)

    const pdaParams = await getPdaParams(wallet.publicKey, userReceiving, mintOfTokenBeingSent)
    if (!pdaParams) {
      alert('Error getting pda params!')
      return
    }
    const { applicationState, applicationBump, escrowWalletState, escrowWalletBump, id } = pdaParams
    setId(id)

    const walletToWithdrawFromATA = await customGetOrCreateAssociatedTokenAccount(connection, wallet.publicKey, mintOfTokenBeingSent, wallet.publicKey, wallet.sendTransaction)
    if (!walletToWithdrawFromATA) {
      alert('Error getting or creating associated token address')
      return
    }

    const res = await getInitiatePayTransaction({
      id: new BN(id),
      connection,
      wallet: wallet as any,
      amount: Number(amount),
      walletToWithdrawFrom: walletToWithdrawFromATA.address,
      applicationState,
      applicationBump,
      escrowWalletState,
      escrowWalletBump,
      userSending: wallet.publicKey,
      userReceiving,
      mintOfTokenBeingSent
    })
    if (!res) {
      alert('Error getting initiate pay transaction')
      return
    }
    const { program, transaction } = res

    try {
      await wallet.sendTransaction(transaction, connection, { preflightCommitment: 'finalized' })
    } catch (error) {
      console.error('Error sending transaction initate pay: ', error)
    }
    
    setIsLoading(true)
    // this is to give time to solana blockchain
    await delay(2000)
    const state = await program.account.state.fetch(applicationState)
    setSafePayState(state as any)
    setIsLoading(false)
  }

  const info = (
    <div className='pr-4'>
      <div>this program is on devnet</div>
      <div>
          built by {' '}
          <a
              href='https://twitter.com/noahhh_ts'
              className='hover:underline'
              target='_blank'
              rel='noreferrer'
          >
              noah
          </a>
      </div>
      <div>
          heavily borrowed from this {' '}
          <a
              href='https://betterprogramming.pub/using-pdas-and-spl-token-in-anchor-and-solana-df05c57ccd04'
              className='hover:underline'
              target='_blank'
              rel='noreferrer'
          >
              blog
          </a>
      </div>
    </div>
  )

  return (
    <>
      <div className='mb-6'>
        <div className='flex justify-between'>
          <div className='mb-6'>
            <h1 className='text-3xl font-bold'>safe pay solana program</h1>
            <h2 className='text-xl'>send tokens to a friend safely</h2>
          </div>
          {info}
        </div>
        <ol className='list-decimal'>
          <li>send tokens to escrow wallet</li>
          <li>your friend approves the transfer and receives tokens from escrow wallet</li>
          <li>or you can cancel the transfer and receive tokens back from the escrow wallet</li>
        </ol>
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
          name='userReceiving'
          placeholder='receiver'
          value={inputValues.userReceiving}
          onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
          className='p-2 mb-2 text-zinc-300 bg-zinc-800'
        />
        <input
          name='amount'
          placeholder='amount'
          value={inputValues.amount}
          onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
          className='p-2 mb-6 text-zinc-300 bg-zinc-800'
        />
        <div>
          <button
            type='submit'
            className='p-2 bg-gray-900 hover:bg-gray-800 font-bold text-xl'
            disabled={isLoading}
          >
            submit
          </button>
        </div>
      </form>
      <div className='my-10 bg-zinc-800'></div>
      {isLoading && <div>loading...</div>}
      {safePayState && (
        <div>
          <p className='text-lg'>below is your application state</p>
          <p className='text-lg'>unique id (SAVE IT!): {id}</p>
          <pre>{JSON.stringify(safePayState, null, 2)}</pre>
        </div>
      )}
    </>
  )
}

export default Home
