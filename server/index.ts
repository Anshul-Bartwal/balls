import http from "http";
import { WebSocketServer } from "ws";
import { Matchmaker } from "./matchmaking/Matchmaker";
import { BALL_TYPES } from "../client/game/ballTypes";
import type { ClientMsg } from "../shared/protocol";

const PORT = Number(process.env.PORT || process.env.SERVER_PORT) || 8080;

// HTTP server so hosts (Render/Railway/Fly) have a health check; WebSocket shares the port.
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("BALLS server ok");
});
const wss = new WebSocketServer({ server });
const matchmaker = new Matchmaker();

wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
        let msg: ClientMsg;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        if (!msg || typeof msg.t !== "string") return;

        if (msg.t === "join") {
            if (msg.ball in BALL_TYPES) matchmaker.join(ws, msg.ball);
            return;
        }
        matchmaker.handle(ws, msg);
    });
    ws.on("close", () => matchmaker.leave(ws));
    ws.on("error", () => matchmaker.leave(ws));
});

server.listen(PORT, "0.0.0.0", () => console.log(`BALLS server listening on port ${PORT}`));
