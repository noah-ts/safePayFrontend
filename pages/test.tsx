import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { getAnchorProgram } from '../services/utils'

const Test = () => {
    const { connection } = useConnection()
    const wallet = useWallet()
    const [state, setState] = useState<any>(null)

    useEffect(() => {
        fetchState()
    }, [])

    const fetchState = async () => {
        const program = getAnchorProgram(connection, wallet as any)
        const state = await program.account.state.fetch('Dy19Yba64ZYM2DUukgkkUHvq8Bsv4fsbYBjpSLdea5LE')
        setState(state)
    }

    return (
        <div>
            <h1>state</h1>
            {state && <pre>{JSON.stringify(state, null, 2)}</pre>}
        </div>
    )
}

export default Test