import type { BallType } from "./ball";

export const BALL_TYPES: Record<
    BallType,
    {
        name: string;
        image: string;
        maxHealth: number;
        damage: number; // outgoing damage multiplier
        mass: number;
    }
> = {
    iceball:   { name: "Iceball",    image: "/assets/Balls/iceball.png",   maxHealth: 100, damage: 1.0, mass: 1.0 },
    bomb:      { name: "Bomb",       image: "/assets/Balls/bomb.png",      maxHealth: 90,  damage: 1.3, mass: 1.2 },
    daggerball:{ name: "Daggerball", image: "/assets/Balls/daggerball.png",maxHealth: 80,  damage: 1.4, mass: 0.9 },
    dash:      { name: "Dash",       image: "/assets/Balls/dash.png",      maxHealth: 100, damage: 1.0, mass: 1.0 },
    overdrive: { name: "Overdrive",  image: "/assets/Balls/overdrive.png", maxHealth: 110, damage: 1.1, mass: 1.0 },
};
