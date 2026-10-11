import { useEffect, useRef, useState } from "react";
import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import type { BallType } from "./ball";
import { BALL_TYPES } from "./ballTypes";
import { ABILITY_NAME } from "./abilities";
import type { ClientMsg, ServerMsg } from "../../shared/protocol";

type StateMsg = Extract<ServerMsg, { t: "state" }>;
type Status = "connecting" | "waiting" | "matched" | "left" | "error";

const WS_URL: string =
    (import.meta as any).env?.VITE_WS_URL ??
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8080`;

export default function OnlineGame({ selectedBall }: { selectedBall: BallType }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const snapRef = useRef<StateMsg | null>(null);
    const youRef = useRef<0 | 1>(0);
    const angleRef = useRef(15);

    const [status, setStatus] = useState<Status>("connecting");
    const [view, setView] = useState({ phase: "aiming", myReady: false, winner: null as StateMsg["winner"] });
    const [angle, setAngle] = useState(15);

    const send = (m: ClientMsg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(m));
    };

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => send({ t: "join", ball: selectedBall });
        ws.onerror = () => setStatus("error");
        ws.onclose = () => setStatus(s => (s === "left" ? s : "error"));
        ws.onmessage = (e) => {
            const m: ServerMsg = JSON.parse(e.data);
            if (m.t === "waiting") setStatus("waiting");
            else if (m.t === "matched") { youRef.current = m.you; setStatus("matched"); }
            else if (m.t === "opponent_left") setStatus("left");
            else if (m.t === "state") {
                snapRef.current = m;
                if (m.phase === "aiming") { angleRef.current = m.myAngle; setAngle(m.myAngle); }
                setView(v =>
                    v.phase === m.phase && v.myReady === m.myReady && v.winner === m.winner
                        ? v : { phase: m.phase, myReady: m.myReady, winner: m.winner });
            }
        };
        return () => ws.close();
    }, [selectedBall]);

    // Space = ability
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Space") { e.preventDefault(); send({ t: "ability" }); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Render loop: draws the latest server snapshot
    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        const images: Partial<Record<BallType, HTMLImageElement>> = {};
        const img = (t: BallType) => {
            if (!images[t]) { const i = new Image(); i.src = BALL_TYPES[t].image; images[t] = i; }
            return images[t]!;
        };
        let raf = 0;
        const draw = () => {
            raf = requestAnimationFrame(draw);
            ctx.fillStyle = "#0a0a0f";
            ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1;
            for (let x = 40; x < ARENA_WIDTH; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ARENA_HEIGHT); ctx.stroke(); }
            for (let y = 40; y < ARENA_HEIGHT; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ARENA_WIDTH, y); ctx.stroke(); }
            ctx.strokeStyle = "#f4f4f5"; ctx.lineWidth = 8;
            ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

            const s = snapRef.current;
            if (!s) return;
            const you = youRef.current;

            s.balls.forEach((b, i) => {
                if (!b.alive) return;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius + 14, 0, Math.PI * 2);
                ctx.fillStyle =
                    b.hitCooldown > 0 ? "rgba(255,60,60,0.35)" :
                    b.slow > 0 ? "rgba(80,160,255,0.4)" :
                    b.boost > 0 ? "rgba(255,160,0,0.4)" : "rgba(255,255,255,0.1)";
                ctx.fill();

                const im = img(b.type), size = b.radius * 4;
                if (im.complete && im.naturalWidth > 0) ctx.drawImage(im, b.x - size / 2, b.y - size / 2, size, size);

                const w = b.radius * 2, pct = b.health / b.maxHealth, y = b.y - b.radius - 14;
                ctx.fillStyle = "#222"; ctx.fillRect(b.x - b.radius, y, w, 5);
                ctx.fillStyle = pct > 0.5 ? "#4caf50" : pct > 0.25 ? "#ffc107" : "#f44336";
                ctx.fillRect(b.x - b.radius, y, w * pct, 5);

                if (s.phase === "playing" && i === you) {
                    const ready = b.abilityCd <= 0;
                    ctx.font = "11px sans-serif"; ctx.textAlign = "center";
                    ctx.fillStyle = ready ? "#7CFC00" : "#aaa";
                    ctx.fillText(`${ABILITY_NAME[b.type]} [Space] ${ready ? "READY" : b.abilityCd.toFixed(1) + "s"}`, b.x, y - 6);
                }
                if (s.phase === "aiming" && i === you) {
                    const a = (angleRef.current * Math.PI) / 180;
                    ctx.strokeStyle = "#4fc3f7"; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(b.x, b.y);
                    ctx.lineTo(b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70); ctx.stroke();
                }
            });

            ctx.fillStyle = "#ffd54f";
            for (const p of s.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }

            if (s.phase === "over") {
                ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
                ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = "bold 48px sans-serif";
                ctx.fillText(s.winner === "draw" ? "DRAW" : s.winner === you ? "YOU WIN" : "YOU LOSE", ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
            }
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    const msg =
        status === "connecting" ? "Connecting..." :
        status === "waiting" ? "Waiting for an opponent..." :
        status === "left" ? "Opponent left. Refresh to find a new match." :
        status === "error" ? "Cannot reach server (is it running on :8080?)" : "";

    return (
        <div>
            <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} />
            <div style={{ marginTop: 8 }}>
                {msg && <div>{msg}</div>}
                {status === "matched" && view.phase === "aiming" && (
                    <>
                        <label>
                            Angle: {angle}°{" "}
                            <input type="range" min={0} max={359} value={angle} disabled={view.myReady}
                                onChange={(e) => { const v = Number(e.target.value); angleRef.current = v; setAngle(v); send({ t: "angle", angle: v }); }} />
                        </label>{" "}
                        <button disabled={view.myReady} onClick={() => send({ t: "ready" })}>
                            {view.myReady ? "Waiting for opponent..." : "Ready"}
                        </button>
                    </>
                )}
                {status === "matched" && view.phase === "over" && (
                    <button onClick={() => send({ t: "rematch" })}>Rematch</button>
                )}
            </div>
        </div>
    );
}
