import { useMemo } from "react";
import type { ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// Devnet only. Phantom/Solflare etc. are auto-detected (Wallet Standard).
export default function AppWalletProvider({ children }: { children: ReactNode }) {
    const endpoint = useMemo(
        () => (import.meta as any).env?.VITE_SOLANA_RPC_URL || clusterApiUrl("devnet"),
        []
    );
    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
