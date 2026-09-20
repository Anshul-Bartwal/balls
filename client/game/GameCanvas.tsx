import { ARENA_WIDTH, ARENA_HEIGHT } from "./arena";
import { GameLoop } from "./gameloop";

import { useRef,useEffect } from "react";
export default function GameCanvas() {
    const canvasRef=useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        const canvas=canvasRef.current;
        if (!canvas) return;

        const ctx=canvas.getContext("2d");
        

        if (!ctx) return;
        let frame=0
        const render = () => {
            ctx.clearRect(
                0,
                0,
                ARENA_WIDTH,
                ARENA_HEIGHT
            )
            
            
        };

        ctx.fillStyle="#18181b";
        ctx.fillRect(
            0,
            0,
            ARENA_WIDTH,
            ARENA_HEIGHT
        );

        //ARENA BORDER
        ctx.strokeStyle="#ffffff";
        ctx.lineWidth=4;
        ctx.strokeRect(
            0,
            0,
            ARENA_WIDTH,
            ARENA_HEIGHT
        );

        const gameloop = new GameLoop(() => {
            render()
        });

        gameloop.start();

        return (() => {
            gameloop.stop();
        })
    },[]);


    return (
        <canvas
            ref={canvasRef}
            width={ARENA_WIDTH}
            height={ARENA_HEIGHT}
        />

    )
}