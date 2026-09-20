import { Ball } from './ball'

export function updateBall (
    ball:Ball,
    deltatime:number,
): void{
    ball.x+=ball.vx*deltatime;
    ball.y+=ball.vy*deltatime;
}