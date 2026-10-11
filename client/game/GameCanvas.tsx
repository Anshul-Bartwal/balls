import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import { GameLoop } from "./gameloop";

import { BallType,createBall, launchBall } from "./ball";
import type { Ball } from "./ball";
import { updateBall } from "./physics";

import { handleWallCollision, handleBallCollisions } from "./collisionSystem";
import { updateCombat, checkWinner, drawHealthBar } from "./combat";
import type { MatchResult } from "./combat";
import { tryAbility, updateAbilities, timeScale, ABILITY_NAME } from "./abilities";
import type { Projectile } from "./abilities";

import { useRef, useEffect, useState } from "react";
import { BALL_TYPES } from "./ballTypes";

const LAUNCH_SPEED = 500;
const toRad = (deg: number) => (deg * Math.PI) / 180;

interface GameCanvasProps {
    selectedBall: BallType;
}
export default function GameCanvas({
    selectedBall,
}: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [angles, setAngles] = useState<[number, number]>([15, 190]); // degrees
    const [phase, setPhase] = useState<"aiming" | "playing" | "over">("aiming");

    // refs so the game loop always reads the latest values without re-running the effect
    const anglesRef = useRef(angles);
    anglesRef.current = angles;
    const startRef = useRef<() => void>(() => {});

    const opponent: BallType = selectedBall === "dash" ? "bomb" : "dash";

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const images: Partial<Record<BallType, HTMLImageElement>> = {};
        for (const t of [selectedBall, opponent]) {
            const img = new Image();
            img.src = BALL_TYPES[t].image;
            images[t] = img;
        }

        let balls: Ball[] = [];
        let projectiles: Projectile[] = [];
        let trails: Array<Array<{ x: number; y: number; radius: number }>> = [];
        let result: MatchResult = { status: "playing" };
        let phaseLocal: "aiming" | "playing" | "over" = "aiming";

        const setPhaseBoth = (p: typeof phaseLocal) => { phaseLocal = p; setPhase(p); };

        const reset = () => {
            balls = [
                createBall(selectedBall, 200, 300),
                createBall(opponent, 600, 300),
            ];
            for (const b of balls) { b.vx = 0; b.vy = 0; }
            projectiles = [];
            trails = balls.map(() => []);
            result = { status: "playing" };
            setPhaseBoth("aiming");
        };
        reset();

        // Ready button: launch both balls at their chosen angles
        startRef.current = () => {
            if (phaseLocal !== "aiming") return;
            launchBall(balls[0], toRad(anglesRef.current[0]), LAUNCH_SPEED);
            launchBall(balls[1], toRad(anglesRef.current[1]), LAUNCH_SPEED);
            setPhaseBoth("playing");
        };

        // P1: Space, P2: Enter
        const onKey = (e: KeyboardEvent) => {
            if (phaseLocal !== "playing") return;
            if (e.code === "Space") { e.preventDefault(); tryAbility(balls[0], balls[1], projectiles); }
            if (e.code === "Enter") { e.preventDefault(); tryAbility(balls[1], balls[0], projectiles); }
        };
        window.addEventListener("keydown", onKey);

        const onClick = () => { if (phaseLocal === "over") reset(); };
        canvas.addEventListener("click", onClick);

        const drawHud = (ball: Ball, key: string) => {
            if (!ball.alive) return;
            const ready = ball.abilityCd <= 0;
            ctx.font = "11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = ready ? "#7CFC00" : "#aaa";
            ctx.fillText(
                `${ABILITY_NAME[ball.type]} [${key}] ${ready ? "READY" : ball.abilityCd.toFixed(1) + "s"}`,
                ball.x, ball.y - ball.radius - 20
            );
        };

        const render = () => {
            ctx.fillStyle = "rgba(10, 10, 15, 0.42)";
            ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            for (let x = 40; x < ARENA_WIDTH; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_HEIGHT); ctx.stroke();
            }
            for (let y = 40; y < ARENA_HEIGHT; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_WIDTH, y); ctx.stroke();
            }

            ctx.strokeStyle = "#f4f4f5";
            ctx.lineWidth = 8;
            ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            balls.forEach((ball, i) => {
                if (!ball.alive) return;

                const trail = trails[i];
                trail.push({ x: ball.x, y: ball.y, radius: ball.radius });
                if (trail.length > 18) trail.shift();
                trail.forEach((point, index) => {
                    const alpha = (index + 1) / trail.length;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.radius + 8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.12})`;
                    ctx.fill();
                });

                // glow colour shows state: red = hit, blue = slowed, orange = boosted
                const glowRadius = ball.radius + 14 + Math.sin(performance.now() / 140) * 2;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle =
                    ball.hitCooldown > 0 ? "rgba(255, 60, 60, 0.35)" :
                    ball.slow > 0 ? "rgba(80, 160, 255, 0.4)" :
                    ball.boost > 0 ? "rgba(255, 160, 0, 0.4)" :
                    "rgba(255, 255, 255, 0.1)";
                ctx.fill();

                const img = images[ball.type];
                const imageSize = ball.radius * 4;
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, ball.x - imageSize / 2, ball.y - imageSize / 2, imageSize, imageSize);
                }

                drawHealthBar(ctx, ball);
                if (phaseLocal === "playing") drawHud(ball, i === 0 ? "Space" : "Enter");

                // aim arrow
                if (phaseLocal === "aiming") {
                    const a = toRad(anglesRef.current[i]);
                    const len = 70;
                    const ex = ball.x + Math.cos(a) * len, ey = ball.y + Math.sin(a) * len;
                    ctx.strokeStyle = i === 0 ? "#4fc3f7" : "#ff8a65";
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ex, ey); ctx.stroke();
                    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2);
                    ctx.fillStyle = ctx.strokeStyle; ctx.fill();
                }
            });

            ctx.fillStyle = "#ffd54f";
            for (const p of projectiles) {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
            }

            if (phaseLocal === "over") {
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "bold 48px sans-serif";
                const msg = result.status === "won" ? `${BALL_TYPES[result.winner.type].name} WINS` : "DRAW";
                ctx.fillText(msg, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
                ctx.font = "20px sans-serif";
                ctx.fillText("Click to restart", ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 40);
            }
        };

        const gameloop = new GameLoop((rawDt) => {
            const dt = Math.min(rawDt, 0.05);
            if (phaseLocal === "playing") {
                for (const b of balls) {
                    if (!b.alive) continue;
                    updateBall(b, dt * timeScale(b));
                    handleWallCollision(b);
                }
                handleBallCollisions(balls[0], balls[1]);
                updateCombat(balls, dt);
                updateAbilities(balls, projectiles, dt);
                result = checkWinner(balls);
                if (result.status !== "playing") setPhaseBoth("over");
            }
            render();
        });
        gameloop.start();

        return () => {
            gameloop.stop();
            window.removeEventListener("keydown", onKey);
            canvas.removeEventListener("click", onClick);
        };
    }, [selectedBall, opponent]);

    const slider = (i: 0 | 1, label: string, color: string) => (
        <label style={{ color, display: "block", margin: "4px 0" }}>
            {label} angle: {angles[i]}°
            <input
                type="range" min={0} max={359} value={angles[i]}
                disabled={phase !== "aiming"}
                style={{ marginLeft: 8, verticalAlign: "middle" }}
                onChange={(e) => {
                    const v = Number(e.target.value);
                    setAngles(prev => (i === 0 ? [v, prev[1]] : [prev[0], v]));
                }}
            />
        </label>
    );

    return (
        <div>
            <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} />
            <div style={{ marginTop: 8 }}>
                {slider(0, `P1 ${BALL_TYPES[selectedBall].name}`, "#4fc3f7")}
                {slider(1, `P2 ${BALL_TYPES[opponent].name}`, "#ff8a65")}
                <button disabled={phase !== "aiming"} onClick={() => startRef.current()}>
                    Ready
                </button>
                <span style={{ marginLeft: 12, color: "#aaa" }}>
                    Abilities: P1 = Space, P2 = Enter
                </span>
            </div>
        </div>
    );
}
