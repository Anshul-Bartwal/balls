import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";
import { BALL_TYPES } from "../../client/game/ballTypes";
import { BALL_MINTS as FILE_MINTS } from "../../shared/ballMints";
import type { BallType } from "../../client/game/ball";

// Mint addresses: env var BALL_MINTS (JSON) wins, so no commit/redeploy is needed after minting.
function loadMints(): Partial<Record<BallType, string>> {
    if (process.env.BALL_MINTS) {
        try { return JSON.parse(process.env.BALL_MINTS); }
        catch { console.error("BALL_MINTS env var is not valid JSON"); }
    }
    return FILE_MINTS;
}
const BALL_MINTS = loadMints();

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const connection = new Connection(process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com", "confirmed");

export const loginMessage = (nonce: string) => `BALLS login\nnonce:${nonce}`;

export function isValidWallet(w: string): boolean {
    try { new PublicKey(w); return true; } catch { return false; }
}

/** Verifies the wallet signed our one-time nonce (proves control of the wallet). */
export function verifyLogin(pubkey: string, signatureB64: string, nonce: string): boolean {
    try {
        return nacl.sign.detached.verify(
            new TextEncoder().encode(loginMessage(nonce)),
            Buffer.from(signatureB64, "base64"),
            new PublicKey(pubkey).toBytes()
        );
    } catch { return false; }
}

/** Ball types whose mint the wallet holds (>= 1 token). Server-side source of truth. */
export async function getOwnedBalls(wallet: string): Promise<BallType[]> {
    const all = Object.keys(BALL_TYPES) as BallType[];
    if (process.env.DEV_ALLOW_ALL_BALLS === "1") return all; // testing only
    try {
        const res = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), { programId: TOKEN_PROGRAM });
        const held = new Set<string>();
        for (const { account } of res.value) {
            const info = account.data.parsed.info;
            if (Number(info.tokenAmount.amount) > 0) held.add(info.mint);
        }
        return all.filter(t => BALL_MINTS[t] && held.has(BALL_MINTS[t]));
    } catch (e) {
        console.error("ownership lookup failed", e);
        return [];
    }
}
