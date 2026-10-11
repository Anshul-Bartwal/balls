import { BALL_TYPES } from "./ballTypes";

export type BallType =
    | "iceball"
    | "bomb"
    | "daggerball"
    | "overdrive"
    | "dash";

export interface Ball{
    x:number;
    y:number;

    vx:number;
    vy:number;

    radius:number;
    mass:number;

    health:number;
    maxHealth:number;
    damage:number;       // outgoing damage multiplier
    alive:boolean;
    hitCooldown:number;  // seconds of damage immunity left

    type:BallType;
}

export function createBall(type: BallType="iceball", x=400, y=250):Ball {
    const s = BALL_TYPES[type];
    return{
        x,
        y,

        vx:200,
        vy:150,

        radius:20,
        mass:s.mass,

        health:s.maxHealth,
        maxHealth:s.maxHealth,
        damage:s.damage,
        alive:true,
        hitCooldown:0,

        type
    };
}

export function launchBall(
        ball:Ball,
        angle:number,
        speed:number
    ):void{

        ball.vx=Math.cos(angle)*speed;
        ball.vy=Math.sin(angle)*speed;
}

export function stopBall(ball:Ball):void {
    ball.vx=0;
    ball.vy=0;
}
