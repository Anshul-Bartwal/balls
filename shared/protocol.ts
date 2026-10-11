import type { BallType } from "../client/game/ball";

export type Phase = "aiming" | "playing" | "over";

export interface BallSnap {
    x: number; y: number; radius: number; type: BallType;
    health: number; maxHealth: number; alive: boolean;
    hitCooldown: number; abilityCd: number; slow: number; boost: number;
}
export interface ProjSnap { x: number; y: number; radius: number }

// Client -> Server (inputs only; the client never reports results)
export type ClientMsg =
    | { t: "join"; ball: BallType }
    | { t: "angle"; angle: number }
    | { t: "ready" }
    | { t: "ability" }
    | { t: "rematch" };

// Server -> Client
export type ServerMsg =
    | { t: "waiting" }
    | { t: "matched"; you: 0 | 1 }
    | {
        t: "state";
        phase: Phase;
        balls: BallSnap[];          // index 0 = player 0, index 1 = player 1
        projectiles: ProjSnap[];
        myAngle: number;            // opponent's aim is hidden until launch
        myReady: boolean;
        oppReady: boolean;
        winner: 0 | 1 | "draw" | null;
    }
    | { t: "opponent_left" };
