import React, { useState } from 'react';

// --- MOCK DATA (Week 2 Assets) ---
const MOCK_BALLS = [
  {
    id: "classic-neon", name: "Classic Neon", rarity: "Common", color: "#00ffcc",
    stats: { speed: 45, bounciness: 50, weight: 40, control: 60 },
    ability: "Quick Dash", pos: { top: '60%', left: '45%' }
  },
  {
    id: "magma-core", name: "Magma Core", rarity: "Epic", color: "#ff4500",
    stats: { speed: 75, bounciness: 85, weight: 80, control: 40 },
    ability: "Explosive Bounce", pos: { top: '50%', left: '60%' }
  },
  {
    id: "frost-byte", name: "Frost Byte", rarity: "Rare", color: "#0088ff",
    stats: { speed: 60, bounciness: 70, weight: 55, control: 65 },
    ability: "Ice Shield", pos: { top: '35%', left: '65%' }
  },
  {
    id: "solana-eclipse", name: "Solana Eclipse", rarity: "Legendary", color: "#9945FF",
    stats: { speed: 95, bounciness: 90, weight: 70, control: 90 },
    ability: "Gravity Warp", pos: { top: '25%', left: '35%' }
  }
];

// --- COMPONENTS ---

// 1. The Floating Data Card
const DataCard = ({ ball }) => (
  <div style={{
    position: 'absolute',
    top: '-160px', left: '60px', // Offset from the ball center
    width: '240px',
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    border: `1px solid ${ball.color}`,
    borderRadius: '12px',
    padding: '12px',
    color: '#FFF',
    fontFamily: 'sans-serif',
    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 10px ${ball.color}40`,
    zIndex: 10,
    pointerEvents: 'none' // Let clicks pass through to the grid
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${ball.color}60`, paddingBottom: '6px', marginBottom: '8px' }}>
      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>BALL: {ball.name}</span>
      <span style={{ fontSize: '10px', color: ball.color }}>({ball.rarity})</span>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
      {Object.entries(ball.stats).map(([stat, val]) => (
        <div key={stat} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: '70px', color: '#AAA', textTransform: 'uppercase' }}>{stat}</span>
          <span style={{ width: '25px', textAlign: 'right', marginRight: '8px' }}>{val}</span>
          <div style={{ flex: 1, height: '4px', backgroundColor: '#333', borderRadius: '2px' }}>
            <div style={{ width: `${val}%`, height: '100%', backgroundColor: ball.color, boxShadow: `0 0 5px ${ball.color}` }} />
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: '10px', fontSize: '10px', color: ball.color }}>
      ⚡ {ball.ability}
    </div>
  </div>
);

// 2. The 2D Ball Sprite with Floor Shadow
const BallEntity = ({ ball }) => (
  <div style={{
    position: 'absolute',
    top: ball.pos.top,
    left: ball.pos.left,
    transform: 'translate(-50%, -50%)',
    zIndex: 5
  }}>
    {/* Floor Shadow (Simulates depth) */}
    <div style={{
      position: 'absolute',
      bottom: '-15px', left: '50%', transform: 'translateX(-50%)',
      width: '60px', height: '20px',
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: '50%',
      boxShadow: `0 0 15px ${ball.color}60`,
      filter: 'blur(4px)'
    }} />

    {/* The Ball Sphere (Faux 3D using radial gradient) */}
    <div style={{
      width: '50px', height: '50px',
      borderRadius: '50%',
      background: `radial-gradient(circle at 30% 30%, #FFF, ${ball.color} 40%, #000 90%)`,
      boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.5), 0 0 20px ${ball.color}80`,
      position: 'relative'
    }}>
      {/* Show Data Card next to the ball */}
      <DataCard ball={ball} />
    </div>
  </div>
);

// 3. Bottom Left Roster UI
const RosterPanel = () => (
  <div style={{
    position: 'absolute', bottom: '20px', left: '20px',
    backgroundColor: 'rgba(15, 15, 20, 0.9)',
    border: '1px solid #333', borderRadius: '12px',
    padding: '16px', color: '#FFF', fontFamily: 'sans-serif', zIndex: 20
  }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#CCC' }}>ACTIVE PLAYER ASSET ROSTER (WEEK 2)</h3>
    <div style={{ display: 'flex', gap: '12px' }}>
      {MOCK_BALLS.map(ball => (
        <div key={ball.id} style={{
          width: '80px', height: '100px',
          border: `1px solid ${ball.color}60`, borderRadius: '8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#111'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', marginBottom: '8px',
            background: `radial-gradient(circle at 30% 30%, #FFF, ${ball.color} 40%, #000)`
          }} />
          <span style={{ fontSize: '10px', textAlign: 'center' }}>{ball.name}</span>
        </div>
      ))}
    </div>
  </div>
);

// 4. Main Arena Layout
export default function Arena2D() {
  return (
    <div style={{
      position: 'relative', width: '100vw', height: '100vh',
      backgroundColor: '#0a0a0f', overflow: 'hidden'
    }}>
      {/* Top Header */}
      <div style={{
        position: 'absolute', top: '0', left: '0', right: '0',
        padding: '16px', display: 'flex', justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF', fontFamily: 'sans-serif', zIndex: 20
      }}>
        <div style={{ fontWeight: 'bold' }}>BALL SOL</div>
        <div style={{ letterSpacing: '2px' }}>ARENA [BETA]</div>
        <div style={{ backgroundColor: '#222', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
          Solana Wallet Connected
        </div>
      </div>

      {/* Faux 3D Perspective Grid Background */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '-50%', width: '200%', height: '200%',
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.2) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(600px) rotateX(60deg)', // Tilts the grid to look like a floor
        transformOrigin: 'top center',
        zIndex: 1
      }}>
        {/* Glow effect at the horizon line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '150px',
          background: 'linear-gradient(to bottom, #0a0a0f, transparent)'
        }} />
      </div>

      {/* Render Balls */}
      {MOCK_BALLS.map(ball => <BallEntity key={ball.id} ball={ball} />)}

      {/* Roster UI */}
      <RosterPanel />
    </div>
  );
}