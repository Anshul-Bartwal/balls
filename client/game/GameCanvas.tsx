import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import { GameLoop } from "./gameloop";

import { BallType,createBall, launchBall } from "./ball";
import type { Ball } from "./ball";
import { updateBall } from "./physics";

import { handleWallCollision, handleBallCollisions } from "./collisionSystem";
import { updateCombat, checkWinner, drawHealthBar } from "./combat";
import type { MatchResult } from "./combat";

import { useRef, useEffect } from "react";
import { BALL_TYPES } from "./ballTypes";
interface GameCanvasProps {
    selectedBall: BallType;
}
export default function GameCanvas({
    selectedBall,
}: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const opponent: BallType = selectedBall === "dash" ? "bomb" : "dash";

        const images: Partial<Record<BallType, HTMLImageElement>> = {};
        for (const t of [selectedBall, opponent]) {
            const img = new Image();
            img.src = BALL_TYPES[t].image;
            images[t] = img;
        }

        let balls: Ball[] = [];
        let trails: Array<Array<{ x: number; y: number; radius: number }>> = [];
        let result: MatchResult = { status: "playing" };

        const reset = () => {
            balls = [
                createBall(selectedBall, 200, 300),
                createBall(opponent, 600, 300),
            ];
            launchBall(balls[0], Math.PI / 12, 500);
            launchBall(balls[1], Math.PI + Math.PI / 10, 450);
            trails = balls.map(() => []);
            result = { status: "playing" };
        };
        reset();

        const render = () => {
            ctx.fillStyle = "rgba(10, 10, 15, 0.42)";
            ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;

            for (let x = 40; x < ARENA_WIDTH; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, ARENA_HEIGHT);
                ctx.stroke();
            }

            for (let y = 40; y < ARENA_HEIGHT; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(ARENA_WIDTH, y);
                ctx.stroke();
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

                const glowRadius = ball.radius + 14 + Math.sin(performance.now() / 140) * 2;
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
                ctx.fillStyle = ball.hitCooldown > 0 ? "rgba(255, 60, 60, 0.35)" : "rgba(255, 255, 255, 0.1)";
                ctx.fill();

                const img = images[ball.type];
                const imageSize = ball.radius * 4;
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, ball.x - imageSize / 2, ball.y - imageSize / 2, imageSize, imageSize);
                }

                drawHealthBar(ctx, ball);
            });

            if (result.status !== "playing") {
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.textAlign = "center";
                ctx.font = "bold 48px sans-serif";
                const msg = result.status === "won"
                    ? `${BALL_TYPES[result.winner.type].name} WINS`
                    : "DRAW";
                ctx.fillText(msg, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
                ctx.font = "20px sans-serif";
                ctx.fillText("Click to restart", ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 40);
            }
        };

        const gameloop = new GameLoop((rawDt) => {
            const deltatime = Math.min(rawDt, 0.05); // avoid huge steps after tab switch
            if (result.status === "playing") {
                for (const b of balls) {
                    if (!b.alive) continue;
                    updateBall(b, deltatime);
                    handleWallCollision(b);
                }
                handleBallCollisions(balls[0], balls[1]);
                updateCombat(balls, deltatime);
                result = checkWinner(balls);
            }
            render();
        });

        const onClick = () => {
            if (result.status !== "playing") reset();
        };
        canvas.addEventListener("click", onClick);

        gameloop.start();

        return () => {
            gameloop.stop();
            canvas.removeEventListener("click", onClick);
        };
    }, [selectedBall]);

    return <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} />;
}
