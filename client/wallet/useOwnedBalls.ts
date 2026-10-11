import { useWallet } from "@solana/wallet-adapter-react";
import type { BallType } from "../game/ball";
import { BALL_TYPES } from "../game/ballTypes";

/**
 * Balls the connected wallet owns.
 * STUB: returns every ball type once a wallet is connected.
 * TODO: replace with an on-chain lookup (see solana_app_integration.md / program/balls).
 */
export function useOwnedBalls(): { owned: BallType[]; connected: boolean } {
    const { connected } = useWallet();
    const owned = connected ? (Object.keys(BALL_TYPES) as BallType[]) : [];
    return { owned, connected };
}
