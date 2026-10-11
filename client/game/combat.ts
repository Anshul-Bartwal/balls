import type { Ball } from "./ball";

// Health -> damage -> elimination -> win. Pure logic (server-portable).
export const COMBAT = {
    MIN_IMPACT: 150,    // px/s closing speed below which no damage
    DAMAGE_SCALE: 0.04, // health per px/s of impact
    HIT_COOLDOWN: 0.4,  // seconds of immunity after a hit
};

export function applyCollisionDamage(a: Ball, b: Ball, impact: number): void {
    if (!a.alive || !b.alive || impact < COMBAT.MIN_IMPACT) return;
    const total = a.mass + b.mass;
    dealDamage(a, impact * COMBAT.DAMAGE_SCALE * b.damage * (2 * b.mass) / total);
    dealDamage(b, impact * COMBAT.DAMAGE_SCALE * a.damage * (2 * a.mass) / total);
}

export function dealDamage(t: Ball, amount: number): void {
    if (t.hitCooldown > 0) return;
    t.health = Math.max(0, t.health - amount);
    t.hitCooldown = COMBAT.HIT_COOLDOWN;
    if (t.health <= 0) t.alive = false;
}

export function updateCombat(balls: Ball[], dt: number): void {
    for (const b of balls) b.hitCooldown = Math.max(0, b.hitCooldown - dt);
}

export type MatchResult =
    | { status: "playing" }
    | { status: "won"; winner: Ball }
    | { status: "draw" };

export function checkWinner(balls: Ball[]): MatchResult {
    const alive = balls.filter(b => b.alive);
    if (alive.length > 1) return { status: "playing" };
    if (alive.length === 1) return { status: "won", winner: alive[0] };
    return { status: "draw" };
}

export function drawHealthBar(ctx: CanvasRenderingContext2D, b: Ball): void {
    if (!b.alive) return;
    const w = b.radius * 2, h = 5, x = b.x - b.radius, y = b.y - b.radius - 14;
    const pct = b.health / b.maxHealth;
    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = pct > 0.5 ? "#4caf50" : pct > 0.25 ? "#ffc107" : "#f44336";
    ctx.fillRect(x, y, w * pct, h);
}
