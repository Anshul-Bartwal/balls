import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { BallType } from "../game/ball";
import { useOwnedBalls } from "../game/useOwnedBalls";
import BallCards from "./BallCards";
import OnlineGame from "../game/OnlineGame";

export default function Lobby() {
    const { owned, connected } = useOwnedBalls();
    const [selected, setSelected] = useState<BallType>("iceball");
    const [playing, setPlaying] = useState(false);

    // keep selection valid if wallet/ownership changes
    useEffect(() => {
        if (owned.length && !owned.includes(selected)) setSelected(owned[0]);
        if (!connected) setPlaying(false);
    }, [owned, connected, selected]);

    return (
        <div style={{ padding: 16 }}>
            <WalletMultiButton />
            {!playing ? (
                <>
                    <h2>Your balls</h2>
                    <BallCards owned={owned} selected={selected} onSelect={setSelected} />
                    <button
                        style={{ marginTop: 16 }}
                        disabled={!connected || !owned.includes(selected)}
                        onClick={() => setPlaying(true)}
                    >
                        Find match
                    </button>
                </>
            ) : (
                <OnlineGame selectedBall={selected} />
            )}
        </div>
    );
}
