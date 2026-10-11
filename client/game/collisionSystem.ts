import type { Ball } from "./ball";
import { ARENA_HEIGHT,ARENA_WIDTH } from "./arena";
import { applyCollisionDamage } from "./combat";

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

// Elastic ball-ball collision (momentum + kinetic energy conserved), then damage.
export function handleBallCollisions(a:Ball,b:Ball):void{
    if(!a.alive || !b.alive) return;

    const dx=b.x-a.x;
    const dy=b.y-a.y;
    const minDist=a.radius+b.radius;
    const distSq=dx*dx+dy*dy;
    if(distSq>=minDist*minDist) return;

    const dist=Math.sqrt(distSq)||0.0001;
    const nx=dx/dist;
    const ny=dy/dist;

    // push apart so they don't stay overlapped
    const overlap=minDist-dist;
    const invA=1/a.mass, invB=1/b.mass;
    const sum=invA+invB;
    a.x-=nx*overlap*(invA/sum);
    a.y-=ny*overlap*(invA/sum);
    b.x+=nx*overlap*(invB/sum);
    b.y+=ny*overlap*(invB/sum);

    // closing speed along the normal
    const impact=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
    if(impact<=0) return; // already separating

    const j=(2*impact)/sum; // e = 1 (elastic)
    a.vx-=j*invA*nx;
    a.vy-=j*invA*ny;
    b.vx+=j*invB*nx;
    b.vy+=j*invB*ny;

    applyCollisionDamage(a,b,impact);
}
