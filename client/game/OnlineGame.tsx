import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import type { BallType } from "./ball";
import { BALL_TYPES } from "./ballTypes";
import { ABILITY_NAME } from "./abilities";
import { WS_URL } from "./serverUrl";
import type { BallSnap, ClientMsg, ServerMsg } from "../../shared/protocol";

type StateMsg = Extract<ServerMsg, { t: "state" }>;
type Status = "connecting" | "signing" | "waiting" | "matched" | "left" | "error";

const INTERP_DELAY = 100; // ms: render slightly in the past to blend between snapshots
type Snap = { t: number; s: StateMsg };

function sample(buf: Snap[]): StateMsg | null {
    if (buf.length === 0) return null;
    const last = buf[buf.length - 1];
    const rt = performance.now() - INTERP_DELAY;
    if (buf.length === 1 || rt >= last.t) return last.s;
    if (rt <= buf[0].t) return buf[0].s;
    let i = buf.length - 2;
    while (i > 0 && buf[i].t > rt) i--;
    const a = buf[i], b = buf[i + 1];
    if (a.s.phase !== b.s.phase || b.t - a.t > 200) return b.s;
    const k = (rt - a.t) / (b.t - a.t);
    const lerp = (p: number, q: number) => p + (q - p) * k;
    return {
        ...b.s,
        balls: b.s.balls.map((bb, j) => ({ ...bb, x: lerp(a.s.balls[j].x, bb.x), y: lerp(a.s.balls[j].y, bb.y) })),
        projectiles:
            a.s.projectiles.length === b.s.projectiles.length
                ? b.s.projectiles.map((pb, j) => ({ ...pb, x: lerp(a.s.projectiles[j].x, pb.x), y: lerp(a.s.projectiles[j].y, pb.y) }))
                : b.s.projectiles,
    };
}

function HudBar({ label, ball, right }: { label: string; ball: BallSnap; right?: boolean }) {
    const pct = Math.max(0, (ball.health / ball.maxHealth) * 100);
    return (
        <div className={`hud-player ${right ? "right" : ""}`}>
            <div className="hud-name">{label}</div>
            <div className="bar"><div className={`bar-fill ${pct < 25 ? "low" : pct < 50 ? "mid" : ""}`} style={{ width: `${pct}%` }} /></div>
            <div className="hud-hp">{Math.ceil(ball.health)} / {ball.maxHealth}</div>
        </div>
    );
}

function Panel({ title, text, spinner, kind, children }: { title: string; text?: string; spinner?: boolean; kind?: string; children?: ReactNode }) {
    return (
        <div className="panel">
            {spinner && <div className="spinner" />}
            <h3 className={kind}>{title}</h3>
            {text && <p>{text}</p>}
            <div className="row">{children}</div>
        </div>
    );
}

export default function OnlineGame({ selectedBall, onLeave }: { selectedBall: BallType; onLeave?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const bufRef = useRef<Snap[]>([]);
    const { publicKey, signMessage } = useWallet();
    const signRef = useRef(signMessage);
    signRef.current = signMessage;
    const pubRef = useRef(publicKey?.toBase58());
    pubRef.current = publicKey?.toBase58();
    const youRef = useRef<0 | 1>(0);
    const angleRef = useRef(15);

    const [status, setStatus] = useState<Status>("connecting");
    const [errorMsg, setErrorMsg] = useState("");
    const [view, setView] = useState({ phase: "aiming", myReady: false, winner: null as StateMsg["winner"] });
    const [angle, setAngle] = useState(15);
    const [you, setYou] = useState<0 | 1>(0);
    const [rematchSent, setRematchSent] = useState(false);
    const [hud, setHud] = useState<BallSnap[] | null>(null);

    const send = (m: ClientMsg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(m));
    };

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onerror = () => { if (wsRef.current === ws) setStatus("error"); };
        ws.onclose = () => { if (wsRef.current === ws) setStatus(s => (s === "left" ? s : "error")); };
        ws.onmessage = (e) => {
            const m: ServerMsg = JSON.parse(e.data);
            if (m.t === "challenge") {
                const sign = signRef.current, pk = pubRef.current;
                if (!sign || !pk) { setErrorMsg("Connect a wallet that supports message signing"); return; }
                setStatus("signing");
                sign(new TextEncoder().encode(`BALLS login\nnonce:${m.nonce}`))
                    .then(sig => send({ t: "auth", pubkey: pk, signature: btoa(String.fromCharCode(...sig)) }))
                    .catch(() => setErrorMsg("Signature rejected"));
            }
            else if (m.t === "authed") send({ t: "join", ball: selectedBall });
            else if (m.t === "error") setErrorMsg(m.message);
            else if (m.t === "waiting") setStatus("waiting");
            else if (m.t === "matched") { youRef.current = m.you; setYou(m.you); setStatus("matched"); }
            else if (m.t === "opponent_left") setStatus("left");
            else if (m.t === "state") {
                bufRef.current.push({ t: performance.now(), s: m });
                if (bufRef.current.length > 30) bufRef.current.shift();
                if (m.phase === "aiming") { angleRef.current = m.myAngle; setAngle(m.myAngle); }
                if (m.phase !== "over") setRematchSent(false);
                setView(v =>
                    v.phase === m.phase && v.myReady === m.myReady && v.winner === m.winner
                        ? v : { phase: m.phase, myReady: m.myReady, winner: m.winner });
            }
        };
        return () => { ws.onclose = null; ws.onerror = null; ws.close(); };
    }, [selectedBall]);

    // Space = ability
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Space") { e.preventDefault(); send({ t: "ability" }); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // HUD refresh (10 Hz) from the latest snapshot
    useEffect(() => {
        const id = setInterval(() => {
            const last = bufRef.current[bufRef.current.length - 1];
            if (last) setHud(last.s.balls);
        }, 100);
        return () => clearInterval(id);
    }, []);

    // Canvas render loop (interpolated snapshots)
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

            const s = sample(bufRef.current);
            if (!s) return;
            const me = youRef.current;

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

                if (i === me) { // marker so you know which ball is yours
                    ctx.fillStyle = "#4fc3f7"; ctx.beginPath();
                    ctx.moveTo(b.x, y - 6); ctx.lineTo(b.x - 5, y - 14); ctx.lineTo(b.x + 5, y - 14); ctx.fill();
                }
                if (s.phase === "aiming" && i === me) {
                    const a = (angleRef.current * Math.PI) / 180;
                    ctx.strokeStyle = "#4fc3f7"; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(b.x, b.y);
                    ctx.lineTo(b.x + Math.cos(a) * 70, b.y + Math.sin(a) * 70); ctx.stroke();
                }
            });

            ctx.fillStyle = "#ffd54f";
            for (const p of s.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    const meB = hud?.[you], oppB = hud?.[1 - you];
    const back = onLeave && <button className="btn" onClick={onLeave}>Back to lobby</button>;

    let overlay: ReactNode = null;
    if (errorMsg) overlay = <Panel title="Can't start" text={errorMsg}>{back}</Panel>;
    else if (status === "connecting") overlay = <Panel spinner title="Connecting…" text="Reaching the game server (it may be waking up, up to a minute)." />;
    else if (status === "signing") overlay = <Panel spinner title="Sign in" text="Approve the login signature in Phantom. It's free and sends no transaction." />;
    else if (status === "waiting") overlay = <Panel spinner title="Finding opponent…" text="Waiting for another player to join.">{onLeave && <button className="btn" onClick={onLeave}>Cancel</button>}</Panel>;
    else if (status === "left") overlay = <Panel title="Opponent left" text="They disconnected.">{back}</Panel>;
    else if (status === "error") overlay = <Panel title="Connection lost" text="Can't reach the server.">{back}</Panel>;
    else if (view.phase === "over") {
        const kind = view.winner === "draw" ? "draw" : view.winner === you ? "win" : "lose";
        overlay = (
            <Panel title={kind === "win" ? "VICTORY" : kind === "lose" ? "DEFEAT" : "DRAW"} kind={kind}
                text={rematchSent ? "Waiting for your opponent to accept…" : "Good fight."}>
                <button className="btn primary" disabled={rematchSent} onClick={() => { setRematchSent(true); send({ t: "rematch" }); }}>Rematch</button>
                {back}
            </Panel>
        );
    }

    const abilityReady = !!meB && meB.abilityCd <= 0;

    return (
        <div className="game">
            <div className="game-top">
                {onLeave && <button className="btn ghost" onClick={onLeave}>← Leave</button>}
                {status === "matched" && meB && oppB && (
                    <div className="hud">
                        <HudBar label={`You · ${BALL_TYPES[meB.type].name}`} ball={meB} />
                        <div className="vs">VS</div>
                        <HudBar label={`Opponent · ${BALL_TYPES[oppB.type].name}`} ball={oppB} right />
                    </div>
                )}
            </div>

            <div className="arena">
                <canvas ref={canvasRef} width={ARENA_WIDTH} height={ARENA_HEIGHT} />
                {overlay && <div className="overlay">{overlay}</div>}
            </div>

            <div className="controls">
                {status === "matched" && view.phase === "aiming" && (
                    <div className="aim">
                        <div className="hint">Set your launch angle. Your opponent can't see it. Press Ready when set.</div>
                        <span className="deg">{angle}°</span>
                        <input type="range" min={0} max={359} value={angle} disabled={view.myReady}
                            onChange={(e) => { const v = Number(e.target.value); angleRef.current = v; setAngle(v); send({ t: "angle", angle: v }); }} />
                        <button className="btn primary" disabled={view.myReady} onClick={() => send({ t: "ready" })}>
                            {view.myReady ? "Waiting for opponent…" : "Ready"}
                        </button>
                    </div>
                )}
                {status === "matched" && view.phase === "playing" && meB && (
                    <button className="btn ability" disabled={!abilityReady} onClick={() => send({ t: "ability" })}>
                        {ABILITY_NAME[meB.type]} [Space] {abilityReady ? "READY" : meB.abilityCd.toFixed(1) + "s"}
                    </button>
                )}
            </div>
        </div>
    );
}
