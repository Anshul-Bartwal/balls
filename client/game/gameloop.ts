export type GameUpdate = (deltatime:number) => (void)

export class GameLoop{
    private animationFrameId: number | null = null;
    private previousTime = 0;

    constructor(
        private readonly update: GameUpdate
    ) {}

    start(): void{
        this.previousTime=performance.now();
        const loop=(currentTime: number) => {
            const deltatime=(currentTime-this.previousTime)/1000;
            this.previousTime=currentTime;

            this.update(deltatime);

            this.animationFrameId=requestAnimationFrame(loop);
        }
        this.animationFrameId=requestAnimationFrame(loop);
    }

    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }


}