import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import default styling for the wallet modal
import '@solana/wallet-adapter-react-ui/styles.css';

// 1. The Game HUD with the Connect Button
function GameHUD() {
  const { publicKey, connected } = useWallet();

  return (
    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <WalletMultiButton />
      {connected && (
        <p style={{ 
            color: '#fff', 
            fontSize: '14px', 
            backgroundColor: 'rgba(0, 0, 0, 0.6)', 
            padding: '4px 8px', 
            borderRadius: '4px',
            marginTop: '8px'
        }}>
          Player: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
        </p>
      )}
    </div>
  );
}

// 2. Placeholder for your actual game (e.g., your Canvas element)
function GameCanvas() {
    const { connected } = useWallet();

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: '#1a1a1a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'sans-serif'
        }}>
            {connected ? (
                <h2>Game is unlocked! (Render your Balls game canvas here)</h2>
            ) : (
                <h2>Please connect your wallet to play.</h2>
            )}
        </div>
    );
}

// 3. Main App Component wrapping everything in Solana Contexts
export default function App() {
  // Set to 'mainnet-beta' when you are ready to launch
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
            
          {/* Main Game Container */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <GameHUD />
            <GameCanvas />
          </div>

        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}