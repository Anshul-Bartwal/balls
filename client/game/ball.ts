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
