import { WebSocket } from "ws";
import { createBall, launchBall } from "../../client/game/ball";
import type { Ball, BallType } from "../../client/game/ball";
import { updateBall } from "../../client/game/physics";
import { handleWallCollision, handleBallCollisions } from "../../client/game/collisionSystem";
import { updateCombat, checkWinner } from "../../client/game/combat";
import { tryAbility, updateAbilities, timeScale } from "../../client/game/abilities";
import type { Projectile } from "../../client/game/abilities";
import type { ClientMsg, Phase, ServerMsg } from "../../shared/protocol";

const TICK_MS = 1000 / 60;
const LAUNCH_SPEED = 500;

export interface Player { ws: WebSocket; ball: BallType }

export class Match {
    private balls: Ball[] = [];
    private projectiles: Projectile[] = [];
    private phase: Phase = "aiming";
    private angles = [15, 190];
    private ready = [false, false];
    private rematch = [false, false];
    private winner: 0 | 1 | "draw" | null = null;
    private ticks = 0;
    private timer: ReturnType<typeof setInterval>;
    private ended = false;

    constructor(private players: [Player, Player], private onEnd: () => void) {
        this.reset();
        this.timer = setInterval(() => this.tick(), TICK_MS);
    }

    private reset() {
        this.balls = [
            createBall(this.players[0].ball, 200, 300),
            createBall(this.players[1].ball, 600, 300),
        ];
        for (const b of this.balls) { b.vx = 0; b.vy = 0; }
        this.projectiles = [];
        this.angles = [15, 190];
        this.ready = [false, false];
        this.rematch = [false, false];
        this.winner = null;
        this.phase = "aiming";
        this.broadcast();
    }

    handle(idx: 0 | 1, msg: ClientMsg) {
        switch (msg.t) {
            case "angle":
                if (this.phase === "aiming" && !this.ready[idx] && Number.isFinite(msg.angle)) {
                    this.angles[idx] = ((msg.angle % 360) + 360) % 360;
                }
                break;
            case "ready":
                if (this.phase !== "aiming") return;
                this.ready[idx] = true;
                if (this.ready[0] && this.ready[1]) this.launch();
                else this.broadcast();
                break;
            case "ability":
                if (this.phase === "playing") {
                    tryAbility(this.balls[idx], this.balls[1 - idx], this.projectiles);
                }
                break;
            case "rematch":
                if (this.phase !== "over") return;
                this.rematch[idx] = true;
                if (this.rematch[0] && this.rematch[1]) this.reset();
                break;
        }
    }

    private launch() {
        for (const i of [0, 1]) {
            launchBall(this.balls[i], (this.angles[i] * Math.PI) / 180, LAUNCH_SPEED);
        }
        this.phase = "playing";
        this.broadcast();
    }

    private tick() {
        if (this.phase !== "playing") return;
        const dt = 1 / 60;
        for (const b of this.balls) {
            if (!b.alive) continue;
            updateBall(b, dt * timeScale(b));
            handleWallCollision(b);
        }
        handleBallCollisions(this.balls[0], this.balls[1]);
        updateCombat(this.balls, dt);
        updateAbilities(this.balls, this.projectiles, dt);

        const r = checkWinner(this.balls);
        if (r.status !== "playing") {
            this.phase = "over";
            this.winner = r.status === "draw" ? "draw" : (this.balls[0] === r.winner ? 0 : 1);
            this.broadcast();
            return;
        }
        if (++this.ticks % 2 === 0) this.broadcast(); // 30 Hz snapshots
    }

    private send(i: 0 | 1, msg: ServerMsg) {
        const ws = this.players[i].ws;
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    }

    private broadcast() {
        const balls = this.balls.map(b => ({
            x: b.x, y: b.y, radius: b.radius, type: b.type,
            health: b.health, maxHealth: b.maxHealth, alive: b.alive,
            hitCooldown: b.hitCooldown, abilityCd: b.abilityCd, slow: b.slow, boost: b.boost,
        }));
        const projectiles = this.projectiles.map(p => ({ x: p.x, y: p.y, radius: p.radius }));
        for (const i of [0, 1] as const) {
            this.send(i, {
                t: "state", phase: this.phase, balls, projectiles,
                myAngle: this.angles[i], myReady: this.ready[i], oppReady: this.ready[1 - i],
                winner: this.winner,
            });
        }
    }

    send0(i: 0 | 1, msg: ServerMsg) { this.send(i, msg); }

    playerLeft(idx: 0 | 1) {
        this.send((1 - idx) as 0 | 1, { t: "opponent_left" });
        this.destroy();
    }

    destroy() {
        if (this.ended) return;
        this.ended = true;
        clearInterval(this.timer);
        this.onEnd();
    }
}
