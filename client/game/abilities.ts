import type { Ball, BallType } from "./ball";
import { BALL_TYPES } from "./ballTypes";
import { dealDamage } from "./combat";
import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";

export interface Projectile {
    x: number; y: number; vx: number; vy: number;
    radius: number; life: number; owner: Ball;
}

export const ABILITY_COOLDOWN: Record<BallType, number> = {
    iceball: 4, bomb: 5, daggerball: 3, dash: 3, overdrive: 8,
};
export const ABILITY_NAME: Record<BallType, string> = {
    iceball: "Frost", bomb: "Blast", daggerball: "Dagger", dash: "Dash", overdrive: "Overdrive",
};

/** Movement speed multiplier from status effects. */
export function timeScale(b: Ball): number {
    if (b.slow > 0) return 0.4;
    if (b.boost > 0) return b.boostScale;
    return 1;
}

export function tryAbility(user: Ball, target: Ball, projectiles: Projectile[]): boolean {
    if (!user.alive || user.abilityCd > 0) return false;
    const dx = target.x - user.x, dy = target.y - user.y;
    const dist = Math.hypot(dx, dy) || 1;

    switch (user.type) {
        case "iceball": // frost nova: slow enemy within 250px
            if (target.alive && dist <= 250) target.slow = 2.5;
            break;
        case "bomb": // blast: damage + knockback within 140px
            if (target.alive && dist <= 140) {
                dealDamage(target, 20 * user.damage);
                target.vx += (dx / dist) * 400;
                target.vy += (dy / dist) * 400;
            }
            break;
        case "daggerball": // dagger aimed at enemy
            projectiles.push({
                x: user.x, y: user.y,
                vx: (dx / dist) * 700, vy: (dy / dist) * 700,
                radius: 6, life: 2, owner: user,
            });
            break;
        case "dash":
            user.boost = 0.5; user.boostScale = 2.2;
            break;
        case "overdrive":
            user.boost = 3; user.boostScale = 1.5;
            user.damage = BALL_TYPES.overdrive.damage * 2;
            break;
    }
    user.abilityCd = ABILITY_COOLDOWN[user.type];
    return true;
}

export function updateAbilities(balls: Ball[], projectiles: Projectile[], dt: number): void {
    for (const b of balls) {
        b.abilityCd = Math.max(0, b.abilityCd - dt);
        b.slow = Math.max(0, b.slow - dt);
        b.boost = Math.max(0, b.boost - dt);
        if (b.type === "overdrive" && b.boost <= 0) b.damage = BALL_TYPES.overdrive.damage;
    }
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        let remove = p.life <= 0 || p.x < 0 || p.y < 0 || p.x > ARENA_WIDTH || p.y > ARENA_HEIGHT;
        if (!remove) {
            for (const b of balls) {
                if (b === p.owner || !b.alive) continue;
                if (Math.hypot(b.x - p.x, b.y - p.y) <= b.radius + p.radius) {
                    dealDamage(b, 15 * p.owner.damage);
                    remove = true;
                    break;
                }
            }
        }
        if (remove) projectiles.splice(i, 1);
    }
}
