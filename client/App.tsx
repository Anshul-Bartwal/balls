import { useState } from "react";
import GameCanvas from "./game/GameCanvas";
import { BallType } from "./game/ball";
import { BALL_TYPES } from "./game/ballTypes";

function App() {
  const [selectedBall, setSelectedBall] = useState<BallType>("iceball");
  return (
        <div className="min-h-screen bg-gray-600 flex items-center justify-center">
            <h2 className="text-white">Select Ball</h2>

            <select
                value={selectedBall}
                onChange={(e) =>
                    setSelectedBall(e.target.value as BallType)
                    // console.log("hi")
                }
            >
                {Object.entries(BALL_TYPES).map(
                    ([type, ball]) => (
                        <option key={type} value={type}>
                            {ball.name}
                        </option>
                    )
                )}
            </select>

            <GameCanvas selectedBall={selectedBall} />
        </div>
    );
}

export default App;