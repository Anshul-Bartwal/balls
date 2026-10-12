import type { BallType } from "../game/ball";
import { BALL_TYPES } from "../game/ballTypes";
import { ABILITY_NAME, ABILITY_COOLDOWN } from "../game/abilities";

const ALL = Object.keys(BALL_TYPES) as BallType[];
const vals = Object.values(BALL_TYPES);
const MAX = {
    hp: Math.max(...vals.map(v => v.maxHealth)),
    dmg: Math.max(...vals.map(v => v.damage)),
    mass: Math.max(...vals.map(v => v.mass)),
};

function Stat({ label, pct }: { label: string; pct: number }) {
    return (
        <div className="stat">
            <span>{label}</span>
            <div className="track"><div className="fill" style={{ width: `${pct * 100}%` }} /></div>
        </div>
    );
}

interface Props { owned: BallType[]; selected: BallType; onSelect: (t: BallType) => void }

export default function BallCards({ owned, selected, onSelect }: Props) {
    return (
        <div className="cards">
            {ALL.map((t) => {
                const s = BALL_TYPES[t];
                const has = owned.includes(t);
                return (
                    <button
                        key={t}
                        disabled={!has}
                        onClick={() => onSelect(t)}
                        className={`card ${has && t === selected ? "active" : ""} ${has ? "" : "locked"}`}
                    >
                        <div className="card-img">
                            <img src={s.image} alt={s.name} />
                            {!has && <span className="lock">LOCKED</span>}
                        </div>
                        <div className="card-name">{s.name}</div>
                        <Stat label="HP" pct={s.maxHealth / MAX.hp} />
                        <Stat label="DMG" pct={s.damage / MAX.dmg} />
                        <Stat label="MASS" pct={s.mass / MAX.mass} />
                        <span className="chip">{ABILITY_NAME[t]} · {ABILITY_COOLDOWN[t]}s</span>
                    </button>
                );
            })}
        </div>
    );
}
