import { WebSocket } from "ws";
import { Match } from "../game/Match";
import type { Player } from "../game/Match";
import type { ClientMsg } from "../../shared/protocol";

export class Matchmaker {
    private queue: Player[] = [];
    private sessions = new Map<WebSocket, { match: Match; idx: 0 | 1 }>();

    join(ws: WebSocket, ball: Player["ball"]) {
        if (this.sessions.has(ws) || this.queue.some(p => p.ws === ws)) return;
        this.queue = this.queue.filter(p => p.ws.readyState === WebSocket.OPEN);
        this.queue.push({ ws, ball });

        if (this.queue.length < 2) {
            ws.send(JSON.stringify({ t: "waiting" }));
            return;
        }
        const p0 = this.queue.shift()!;
        const p1 = this.queue.shift()!;
        const match: Match = new Match([p0, p1], () => {
            this.sessions.delete(p0.ws);
            this.sessions.delete(p1.ws);
        });
        this.sessions.set(p0.ws, { match, idx: 0 });
        this.sessions.set(p1.ws, { match, idx: 1 });
        match.send0(0, { t: "matched", you: 0 });
        match.send0(1, { t: "matched", you: 1 });
    }

    handle(ws: WebSocket, msg: ClientMsg) {
        const s = this.sessions.get(ws);
        if (s) s.match.handle(s.idx, msg);
    }

    leave(ws: WebSocket) {
        this.queue = this.queue.filter(p => p.ws !== ws);
        const s = this.sessions.get(ws);
        if (s) s.match.playerLeft(s.idx);
    }
}
