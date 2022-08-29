import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import type { AppProps } from 'next/app';
import type { FC } from 'react';
import React, { useMemo } from 'react';
import Link from 'next/link';

// Use require instead of import since order matters
require('@solana/wallet-adapter-react-ui/styles.css');
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter()
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                  <div className='bg-zinc-900 text-zinc-300 h-screen'>
                    <div className='flex justify-between bg-gray-900 mb-10'>
                        <div className='flex justify-start items-center'>
                            <Link href='/'>
                                <a className='ml-10 lg:ml-52 mr-10 hover:underline'>initiate pay</a>
                            </Link>
                            <Link href='/state'>
                                <a className='hover:underline'>pull back or accept payment</a>
                            </Link>
                        </div>
                        <div className='flex justify-end'>
                            <WalletMultiButton />
                            <WalletDisconnectButton />
                        </div>
                    </div>
                    <div className='ml-10 lg:ml-52'>
                        <Component {...pageProps} />
                    </div>
                  </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;
