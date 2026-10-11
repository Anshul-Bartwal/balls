import { WebSocketServer } from "ws";
import { Matchmaker } from "./matchmaking/Matchmaker";
import { BALL_TYPES } from "../client/game/ballTypes";
import type { ClientMsg } from "../shared/protocol";

const PORT = Number(process.env.SERVER_PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });
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

console.log(`BALLS server listening on ws://localhost:${PORT}`);
