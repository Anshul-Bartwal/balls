import type { BallType } from "../game/ball";
import { BALL_TYPES } from "../game/ballTypes";
import { ABILITY_NAME, ABILITY_COOLDOWN } from "../game/abilities";

interface Props {
    owned: BallType[];
    selected: BallType;
    onSelect: (t: BallType) => void;
}

export default function BallCards({ owned, selected, onSelect }: Props) {
    if (owned.length === 0) return <p>Connect a wallet to see your balls.</p>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {owned.map((t) => {
                const s = BALL_TYPES[t];
                const active = t === selected;
                return (
                    <button
                        key={t}
                        onClick={() => onSelect(t)}
                        style={{
                            width: 150, padding: 10, borderRadius: 10, cursor: "pointer", textAlign: "left",
                            background: "#14141c", color: "#eee",
                            border: active ? "2px solid #4fc3f7" : "2px solid #333",
                        }}
                    >
                        <img src={s.image} alt={s.name} style={{ width: "100%", height: 90, objectFit: "contain" }} />
                        <div style={{ fontWeight: 700, margin: "6px 0" }}>{s.name}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                            HP {s.maxHealth}<br />
                            DMG x{s.damage}<br />
                            Mass {s.mass}<br />
                            {ABILITY_NAME[t]} ({ABILITY_COOLDOWN[t]}s)
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
