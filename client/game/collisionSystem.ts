import type { Ball } from "./ball";
import { ARENA_HEIGHT,ARENA_WIDTH } from "./arena";

export function handleWallCollision(ball:Ball):void{
    //left wall
    if(ball.x - ball.radius <=0){
        ball.x=ball.radius;
        ball.vx*=-1;
    }

    //rightwall
    if(ball.x + ball.radius >=ARENA_WIDTH){
        ball.x=ARENA_WIDTH-ball.radius;
        ball.vx*=-1;
    }

    //lowerwall
    if(ball.y + ball.radius >=ARENA_HEIGHT){
        ball.y=ARENA_HEIGHT-ball.radius;
        ball.vy*=-1;
    }

    //upperwall
    if(ball.y - ball.radius <=0){
        ball.y=ball.radius;
        ball.vy*=-1;
    }

}