import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import { GameLoop } from "./gameloop";

import { createBall, launchBall } from "./ball";
import { updateBall } from "./physics";

import { handleWallCollision } from "./collisionSystem";

import { useRef, useEffect } from "react";

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const ball = createBall();
        launchBall(ball, Math.PI / 6, 500);

        const trail: Array<{ x: number; y: number; alpha: number; radius: number }> = [];

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

            trail.push({
                x: ball.x,
                y: ball.y,
                alpha: 1,
                radius: ball.radius,
            });

            if (trail.length > 18) {
                trail.shift();
            }

            trail.forEach((point, index) => {
                const alpha = (index + 1) / trail.length;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.radius + 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.12})`;
                ctx.fill();
            });

            ctx.strokeStyle = "#f4f4f5";
            ctx.lineWidth = 8;
            ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            const glowRadius = ball.radius + 14 + Math.sin(performance.now() / 140) * 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 26;
            ctx.shadowColor = "#ffffff";
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.arc(
                ball.x - ball.radius * 0.38,
                ball.y - ball.radius * 0.38,
                ball.radius * 0.35,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
            ctx.fill();
        };

        const gameloop = new GameLoop((deltatime) => {
            updateBall(ball, deltatime);
            handleWallCollision(ball);
            render();
        });

        gameloop.start();

        return () => {
            gameloop.stop();
        };
    }, []);

    return <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} />;
}
