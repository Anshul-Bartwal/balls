import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { BallType } from "../game/ball";
import { HTTP_URL } from "../game/serverUrl";

/** Balls the connected wallet owns (display only; the server re-checks at join). */
export function useOwnedBalls(): { owned: BallType[]; connected: boolean; loading: boolean } {
    const { connected, publicKey } = useWallet();
    const [owned, setOwned] = useState<BallType[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!connected || !publicKey) { setOwned([]); return; }
        let cancel = false;
        setLoading(true);
        fetch(`${HTTP_URL}/owned?wallet=${publicKey.toBase58()}`)
            .then(r => r.json())
            .then(d => { if (!cancel) setOwned(d.owned); })
            .catch(() => { if (!cancel) setOwned([]); })
            .finally(() => { if (!cancel) setLoading(false); });
        return () => { cancel = true; };
    }, [connected, publicKey]);

    return { owned, connected, loading };
}
