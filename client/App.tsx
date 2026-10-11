import AppWalletProvider from "./wallet/WalletProvider";
import Lobby from "./ui/Lobby";

export default function App() {
    return (
        <AppWalletProvider>
            <Lobby />
        </AppWalletProvider>
    );
}
