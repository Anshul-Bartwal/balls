export interface Ball{
    x:number;
    y:number;

    vx:number;
    vy:number;

    radius:number;
}

export function createBall():Ball {
    return{
        x:400,
        y:250,

        vx:200,
        vy:150,

        radius:20
    };
}