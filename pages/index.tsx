import type { NextPage } from 'next'
import { useState } from 'react'

const Home: NextPage = () => {
  const [inputValues, setInputValues] = useState({
    mintOfTokenBeingSent: '',
    userReceiving: '',
    amount: ''
  })

  return (
    <>
      <div className='mb-10'>
        <div className='mb-10'>
          <h1 className='text-3xl font-bold'>safe pay solana program</h1>
          <h2 className='text-xl'>send tokens to a friend safely</h2>
        </div>
        <ol className='list-decimal'>
          <li>send tokens to escrow wallet</li>
          <li>your friend approves the transfer and receives tokens from escrow wallet</li>
          <li>or you can cancel the transfer and receive tokens back from the escrow wallet</li>
        </ol>
      </div>
      <div className='flex flex-col pr-10'>
        <input
          name='mintOfTokenBeingSent'
          placeholder='mint address of the token'
          value={inputValues.mintOfTokenBeingSent}
          onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
          className='p-2 mb-2 text-zinc-300 bg-zinc-800'
        />
        <input
          name='userReceiving'
          placeholder='wallet to send to'
          value={inputValues.userReceiving}
          onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
          className='p-2 mb-2 text-zinc-300 bg-zinc-800'
        />
        <input
          name='amount'
          placeholder='amount - no decimals sorry :)'
          value={inputValues.amount}
          onChange={e => setInputValues(v => ({ ...v, [e.target.name]: e.target.value }))}
          className='p-2 mb-10 text-zinc-300 bg-zinc-800'
        />
        <button className='w-24 p-2 bg-gray-900 hover:bg-gray-800 font-bold text-xl'>submit</button>
      </div>
    </>
  )
}

export default Home
