import http from "http";
import crypto from "crypto";
import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import { Matchmaker } from "./matchmaking/Matchmaker";
import { BALL_TYPES } from "../client/game/ballTypes";
import { verifyLogin, getOwnedBalls, isValidWallet } from "./auth/wallet";
import type { ClientMsg, ServerMsg } from "../shared/protocol";

const PORT = Number(process.env.PORT || process.env.SERVER_PORT) || 8080;

const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const url = new URL(req.url || "/", "http://localhost");

    // Display-only ownership lookup for the lobby UI (the server re-checks at join).
    if (url.pathname === "/owned") {
        const w = url.searchParams.get("wallet") || "";
        if (!isValidWallet(w)) { res.writeHead(400); res.end("bad wallet"); return; }
        const owned = await getOwnedBalls(w);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ owned }));
        return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("BALLS server ok");
});

const wss = new WebSocketServer({ server });
const matchmaker = new Matchmaker();
const reply = (ws: WebSocket, m: ServerMsg) => { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(m)); };

wss.on("connection", (ws) => {
    const nonce = crypto.randomBytes(16).toString("hex");
    let wallet: string | null = null;
    reply(ws, { t: "challenge", nonce });

    ws.on("message", async (raw) => {
        let msg: ClientMsg;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        if (!msg || typeof msg.t !== "string") return;

        if (msg.t === "auth") {
            if (wallet) return;
            if (!verifyLogin(msg.pubkey, msg.signature, nonce)) {
                reply(ws, { t: "error", message: "Wallet signature invalid" });
                return;
            }
            wallet = msg.pubkey;
            reply(ws, { t: "authed", wallet, owned: await getOwnedBalls(wallet) });
            return;
        }

        if (!wallet) { reply(ws, { t: "error", message: "Login required" }); return; }

        if (msg.t === "join") {
            if (!(msg.ball in BALL_TYPES)) return;
            const owned = await getOwnedBalls(wallet); // authoritative check
            if (!owned.includes(msg.ball)) {
                reply(ws, { t: "error", message: "You don't own that ball" });
                return;
            }
            if (ws.readyState === ws.OPEN) matchmaker.join(ws, msg.ball);
            return;
        }
        matchmaker.handle(ws, msg);
    });
    ws.on("close", () => matchmaker.leave(ws));
    ws.on("error", () => matchmaker.leave(ws));
});

server.listen(PORT, "0.0.0.0", () => console.log(`BALLS server listening on port ${PORT}`));
