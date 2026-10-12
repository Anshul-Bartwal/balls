import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { BallType } from "../game/ball";
import { BALL_TYPES } from "../game/ballTypes";
import { useOwnedBalls } from "../wallet/useOwnedBalls";
import BallCards from "./BallCards";
import OnlineGame from "../game/OnlineGame";
import "../src/theme.css";

export default function Lobby() {
    const { owned, connected, loading } = useOwnedBalls();
    const [selected, setSelected] = useState<BallType>("iceball");
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (owned.length && !owned.includes(selected)) setSelected(owned[0]);
        if (!connected) setPlaying(false);
    }, [owned, connected, selected]);

    const canPlay = connected && owned.includes(selected);

    return (
        <div className="app">
            <header className="topbar">
                <div className="logo">BALLS</div>
                <WalletMultiButton />
            </header>

            <main className="main">
                {playing ? (
                    <OnlineGame selectedBall={selected} onLeave={() => setPlaying(false)} />
                ) : (
                    <>
                        <section className="hero">
                            <h1>Aim. Launch. Smash.</h1>
                            <p>Pick a ball you own, set your angle, and knock your opponent out.</p>
                        </section>

                        <section className="how">
                            <div><b>1 · Aim</b>Choose your launch angle in secret.</div>
                            <div><b>2 · Ready</b>Both players press Ready to launch.</div>
                            <div><b>3 · Fight</b>Press Space to use your ball's ability.</div>
                        </section>

                        <h2>Your balls</h2>
                        {!connected && <div className="notice">Connect your Phantom wallet (Devnet) to load your balls.</div>}
                        {connected && loading && <div className="notice">Checking your wallet…</div>}
                        {connected && !loading && owned.length === 0 && (
                            <div className="notice">No balls in this wallet yet. Ask for a devnet mint to get started.</div>
                        )}
                        <BallCards owned={owned} selected={selected} onSelect={setSelected} />

                        <div className="actionbar">
                            <div>Selected: <b>{owned.includes(selected) ? BALL_TYPES[selected].name : "—"}</b></div>
                            <button className="btn primary" disabled={!canPlay} onClick={() => setPlaying(true)}>
                                Find match
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
