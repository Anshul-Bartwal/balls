import { BallType } from "./ball";

export const BALL_TYPES: Record<
    BallType,
    {
        name: string;
        image: string;
    }
> = {
    iceball: {
        name: "Iceball",
        image: "/assets/Balls/iceball.png",
    },

    bomb: {
        name: "Bomb",
        image: "/assets/Balls/bomb.png",
    },

    daggerball: {
        name: "Daggerball",
        image: "/assets/Balls/daggerball.png",
    },

    dash: {
        name: "Dash",
        image: "/assets/Balls/dash.png",
    },

    overdrive: {
        name: "Overdrive",
        image: "/assets/Balls/overdrive.png",
    },
};