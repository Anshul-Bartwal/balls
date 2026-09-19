# BALL//BREAK

> **A competitive physics arena built for Solana.**

BALL//BREAK is a web-based multiplayer physics combat game where two players control balls inside an arena and fight using momentum, ricochets, collisions, and tactical abilities.

The game is designed around a simple idea:

**Easy to understand. Difficult to master.**

Players choose the direction and power of their movement/attack, then physics takes over. Walls, opponents, momentum, abilities, and positioning create the combat.

Solana provides the competitive infrastructure around the game — wallet identity, on-chain match information, rewards/settlement, and verifiable records — without putting real-time gameplay physics on the blockchain.

---

# ⚠️ PROJECT STATUS

**This project is currently in development.**

Some parts described below are planned architecture and are **not necessarily implemented yet**.

### Current goal

Build a playable vertical slice:

```text
Browser
  ↓
2 Players
  ↓
Physics Arena
  ↓
Combat
  ↓
Abilities
  ↓
Match Result
  ↓
Solana Integration
```

### Development priority

1. Make the game fun.
2. Make multiplayer work.
3. Integrate Solana.
4. Make match results verifiable.
5. Polish the experience.

Do **not** start by building the entire blockchain economy.

---

# 🎮 GAME CONCEPT

Two players enter a physics-based arena.

Each player controls a ball.

Players don't have traditional WASD movement.

Instead, gameplay revolves around:

* Direction
* Force / power
* Momentum
* Wall ricochets
* Enemy collisions
* Abilities
* Positioning
* Timing

Example:

```text
                 WALL
        ┌─────────────────────┐
        │                     │
        │        ↗            │
        │      ↗              │
        │    ●                │
        │                     │
        │                ●    │
        │                     │
        └─────────────────────┘
```

A good player should be able to use the arena itself as a weapon.

---

# 🧠 CORE GAMEPLAY LOOP

```text
JOIN MATCH
    ↓
AIM
    ↓
CHOOSE POWER
    ↓
LAUNCH / MOVE
    ↓
COLLIDE
    ↓
GAIN MOMENTUM / RESOURCES
    ↓
USE ABILITY
    ↓
RICHOCHET / ATTACK
    ↓
REDUCE ENEMY HP
    ↓
ENEMY DIES
    ↓
MATCH RESULT
```

The core gameplay should remain understandable even if the blockchain is completely hidden.

---

# ⚔️ CORE MECHANICS

## Balls

Each player controls one ball.

A ball has properties such as:

```text
position
velocity
mass
radius
health
collision count
ability state
```

---

## Physics

The game uses 2D physics.

Important interactions:

* Wall collisions
* Player collisions
* Velocity
* Impulse
* Friction
* Bounce
* Projectile collisions
* Ability effects

Physics should be deterministic wherever possible.

---

# 💥 ABILITIES

Initial ability set:

### DASH

Instantly changes the ball's velocity.

```text
● ───────→
       DASH
          ↗
```

---

### DAGGER

Allows the player to fire a projectile after satisfying the required resource/collision condition.

---

### SHIELD

Absorbs or reduces an incoming attack.

---

### OVERDRIVE

A comeback mechanic activated under specific conditions such as low health.

Possible effects:

* Increased velocity
* Stronger collision
* Reduced ability cooldown

Exact balancing is still TBD.

---

# 🧩 SOLANA ROLE

Solana should **not** run the game's frame-by-frame physics.

The game runs off-chain because real-time gameplay requires low latency.

Instead:

```text
                    BALL//BREAK

             ┌──────────────────┐
             │   WEB GAME       │
             │                  │
             │ Phaser           │
             │ Matter.js        │
             └────────┬─────────┘
                      │
                      │ WebSocket
                      ▼
             ┌──────────────────┐
             │ GAME SERVER      │
             │                  │
             │ Matchmaking      │
             │ Game State       │
             │ Physics          │
             │ Anti-cheat       │
             └────────┬─────────┘
                      │
                Match Result
                      │
                      ▼
             ┌──────────────────┐
             │ SOLANA PROGRAM   │
             │                  │
             │ Match            │
             │ Rewards          │
             │ Settlement       │
             │ Verification     │
             └────────┬─────────┘
                      │
                      ▼
                   SOLANA
```

### Solana handles

* Wallet identity
* Transactions
* On-chain match records
* Program-controlled funds where applicable
* Rewards
* Tournament infrastructure
* Verifiable settlement

### Solana does NOT handle

* 60 FPS rendering
* Ball movement
* Collision detection every frame
* WebSocket communication
* Matchmaking
* UI

---

# 💰 ECONOMY / RANKED MODE

The long-term concept includes a ranked mode where players can use SOL-based entry mechanisms and receive rewards according to the match/tournament rules.

**Important:** real-money wagering introduces legal and regulatory requirements and is NOT assumed to be legal simply because the game is skill-based.

For development and hackathon demonstrations:

```text
USE DEVNET / TEST ASSETS
```

Do not implement real-money wagering in production without obtaining appropriate legal advice and designing the system for the relevant jurisdiction.

The technical architecture should remain compatible with a non-custodial, program-controlled settlement model.

---

# 🔐 SECURITY PRINCIPLES

## Never trust the client

The client must never be authoritative for important game state.

The client should send things like:

```text
angle
power
ability
input
```

It should NOT simply tell the server:

```text
"I won"
"I have 500 HP"
"Enemy died"
```

---

## Server-authoritative gameplay

Planned architecture:

```text
CLIENT
  ↓
Player Input
  ↓
SERVER
  ↓
Authoritative Game State
  ↓
Match Result
```

The server determines the actual game state.

---

# 🎥 REPLAYS

A major planned feature is recording player inputs.

Example:

```json
{
  "timestamp": 1.24,
  "player": "A",
  "action": "launch",
  "angle": 73,
  "power": 0.82
}
```

A complete match can then be reproduced from:

```text
initial state
+
random seed
+
player inputs
```

This enables:

* Replays
* Debugging
* Cheat investigation
* Match verification

---

# 🎲 RANDOMNESS

Random gameplay events should use deterministic or verifiable randomness wherever possible.

For example:

```text
Match Seed
    ↓
Deterministic RNG
    ↓
 ┌─────────────┐
 │ Event       │
 │ Spawn       │
 │ Ability     │
 └─────────────┘
```

The objective is to prevent arbitrary rerolls or hidden manipulation.

---

# 🌐 WEB-FIRST

BALL//BREAK is intentionally a browser game.

A player should eventually be able to:

```text
Open website
    ↓
Connect wallet
    ↓
Find match
    ↓
Play
```

No separate game launcher should be required.

This also makes hackathon judging and onboarding easier.

---

# 🛠️ TECHNOLOGY STACK

## Frontend

### React

Used for:

* Application UI
* Menus
* Lobby
* Wallet interface
* Player profiles
* Matchmaking UI

### TypeScript

Primary language for the web application and shared types.

---

## Game Engine

### Phaser

Phaser handles:

* Game loop
* Rendering
* Input
* Game scenes
* Sprites
* Game objects

Phaser is responsible for the **game layer**, not the blockchain.

---

## Physics

### Matter.js

Matter.js handles:

* Collision detection
* Velocity
* Forces
* Bodies
* Mass
* Friction
* Bounce

---

## Multiplayer

### Node.js

Backend runtime.

### WebSockets

Used for real-time communication between players and the game server.

---

## Blockchain

### Solana

Used for:

* Wallets
* Transactions
* On-chain state
* Rewards
* Match records
* Settlement

### Anchor

Framework for developing the Solana program.

---

# 📁 PROJECT STRUCTURE

Current target structure:

```text
ball-break/
│
├── client/
│   ├── game/
│   │   ├── Arena.ts
│   │   ├── Ball.ts
│   │   ├── Physics.ts
│   │   ├── Abilities.ts
│   │   └── CollisionSystem.ts
│   │
│   ├── ui/
│   │   ├── HUD.tsx
│   │   ├── Lobby.tsx
│   │   ├── Matchmaking.tsx
│   │   └── Wallet.tsx
│   │
│   └── wallet/
│
├── server/
│   ├── matchmaking/
│   ├── game/
│   │   ├── Match.ts
│   │   ├── Physics.ts
│   │   └── Replay.ts
│   │
│   └── websocket/
│
├── programs/
│   └── ball_break/
│       ├── player.rs
│       ├── match.rs
│       ├── tournament.rs
│       └── rewards.rs
│
├── shared/
│   ├── types.ts
│   ├── constants.ts
│   └── protocol.ts
│
└── README.md
```

---

# 📦 DIRECTORY RESPONSIBILITIES

## `apps/web`

Everything the player interacts with.

```text
game/
```

Actual game.

```text
components/
```

React UI.

```text
wallet/
```

Solana wallet connection and transaction UI.

```text
pages/
```

Application screens.

---

## `apps/server`

Authoritative backend.

Responsible for:

* Matchmaking
* Match creation
* WebSocket connections
* Game state
* Physics simulation
* Match lifecycle
* Replay data

---

## `programs/ball_break`

Solana program.

Responsible for blockchain state and instructions.

Possible future instructions:

```text
create_match()
join_match()
lock_entry()
settle_match()
record_result()
claim_reward()
```

Exact instructions should only be implemented when required.

---

## `packages/shared`

Anything that needs to be understood by both frontend and backend.

Examples:

```text
PlayerState
MatchState
Ability
InputEvent
GameEvent
```

Do not duplicate these definitions between client and server.

---

## `docs`

Longer technical documentation.

If you change an important architectural decision, update the relevant document.

---

# 🧑‍💻 DEVELOPMENT PRINCIPLES

## 1. Gameplay first

Don't build blockchain features before there is a playable game.

Priority:

```text
FUN GAME
    ↓
MULTIPLAYER
    ↓
SOLANA
    ↓
VERIFICATION
    ↓
POLISH
```

---

## 2. Keep the game modular

Do not put everything inside one giant file.

Bad:

```text
Game.ts
```

containing:

```text
physics
rendering
abilities
networking
wallet
UI
matchmaking
```

Good:

```text
Ball.ts
PhysicsSystem.ts
AbilitySystem.ts
Match.ts
NetworkClient.ts
Wallet.ts
```

---

## 3. Don't put game physics on-chain

Never attempt to execute every frame of the game on Solana.

Blockchain is for:

```text
ownership
settlement
verification
rewards
```

The game is for:

```text
physics
rendering
real-time interaction
```

---

# 🔄 MATCH LIFECYCLE

Target architecture:

```text
                 MATCHMAKING
                     │
                     ▼
              MATCH CREATED
                     │
                     ▼
              PLAYERS JOIN
                     │
                     ▼
               MATCH START
                     │
                     ▼
              GAMEPLAY LOOP
                     │
                     ▼
                PLAYER DIES
                     │
                     ▼
             MATCH RESULT
                     │
                     ▼
             RESULT VERIFIED
                     │
                     ▼
             SOLANA SETTLEMENT
                     │
                     ▼
              MATCH COMPLETE
```

---

# 🧱 DEVELOPMENT PHASES

## Phase 1 — Physics Prototype

Goal:

```text
☐ Arena
☐ Ball
☐ Movement
☐ Wall collision
☐ Camera
```

No multiplayer.

No Solana.

---

## Phase 2 — Combat

```text
☐ Two balls
☐ Player collision
☐ HP
☐ Damage
☐ Death
☐ Dash
☐ Dagger
☐ Shield
```

---

## Phase 3 — Multiplayer

```text
☐ WebSocket server
☐ Lobby
☐ Match creation
☐ Player synchronization
☐ Server-authoritative state
☐ Disconnect handling
```

---

## Phase 4 — Solana

```text
☐ Wallet connection
☐ Devnet configuration
☐ Basic transaction
☐ Match account
☐ Match lifecycle
☐ Settlement prototype
```

---

## Phase 5 — Verification

```text
☐ Match seed
☐ Input recording
☐ Replay
☐ Result hash
☐ On-chain result record
```

---

## Phase 6 — Polish

```text
☐ UI
☐ Animations
☐ Sound
☐ Particles
☐ Matchmaking UX
☐ Loading states
☐ Error handling
☐ Mobile wallet flow
```

---

# 🤖 USING AI ON THIS PROJECT

AI tools are allowed and expected to be useful for development.

However:

**Do not blindly accept generated code.**

Before asking an AI to modify the project, give it:

1. This README
2. The relevant source files
3. The current task
4. Existing errors/tests
5. Architectural constraints

A good prompt:

```text
You are working on BALL//BREAK.

Read README.md first.

Current architecture:
- React + TypeScript
- Phaser
- Matter.js
- Node.js WebSocket server
- Solana + Anchor

Current task:
Implement wall collision for the player ball.

Constraints:
- Do not modify the Solana program.
- Do not introduce a new physics library.
- Keep physics code inside game/physics/.
- Use existing shared types.
- Explain any architectural changes before making them.

First inspect the relevant files.
Then implement the smallest change required.
```

---

# 🚨 IMPORTANT AI RULE

AI must not assume that planned features are already implemented.

For example, this README may describe:

```text
Solana settlement
```

while the current branch only has:

```text
ball bouncing
```

Always inspect the actual code before implementing something.

---

# 🌿 GIT WORKFLOW

Do not work directly on `main`.

Create a branch:

```bash
git checkout -b feature/physics
```

Examples:

```text
feature/physics
feature/abilities
feature/multiplayer
feature/wallet
feature/solana-match
fix/collision
fix/websocket
```

Then:

```bash
git add .
git commit -m "feat: add wall collision"
git push origin feature/physics
```

Open a Pull Request.

---

# 📝 COMMIT STYLE

Use:

```text
feat: add player dash
fix: prevent ball tunneling
feat: add websocket matchmaking
feat: connect Solana wallet
fix: handle player disconnect
docs: update multiplayer architecture
```

Keep commits small and understandable.

---

# 🔐 ENVIRONMENT VARIABLES

Never commit private keys, wallet seed phrases, or secrets.

Use:

```text
.env
```

and commit only:

```text
.env.example
```

Example:

```env
VITE_SOLANA_RPC_URL=
VITE_SOLANA_NETWORK=devnet

SERVER_PORT=
DATABASE_URL=

PROGRAM_ID=
```

**NEVER put a private key in the frontend.**

---

# 🧪 TESTING

Every major system should eventually have tests.

Important areas:

```text
Physics
Abilities
Match state
Replay determinism
WebSocket protocol
Solana instructions
Settlement logic
```

Particularly important:

### Replay determinism

Given:

```text
same initial state
+
same seed
+
same inputs
```

the result should be identical.

```text
Replay A
    =
Replay B
```

---

# 🚧 CURRENT NON-GOALS

Do NOT build these during the first MVP:

* 3D graphics
* Mobile app
* NFT marketplace
* DAO
* Governance token
* Complex tokenomics
* Dozens of abilities
* AI opponents
* Huge open world
* On-chain frame-by-frame physics
* Custodial user wallets

If the core game isn't fun, these features don't matter.

---

# 🏆 DEFINITION OF MVP

The MVP is complete when:

```text
A player can:

1. Open the website
2. Connect a wallet
3. Join a match
4. Play against another player
5. Control their ball
6. Bounce off walls
7. Damage the opponent
8. Use at least one ability
9. Kill the opponent
10. Receive a match result
11. Verify the match/result through Solana
```

Everything else is secondary.

---

# 🗺️ HIGH-LEVEL ARCHITECTURE

```text
                         PLAYER
                            │
                            ▼
                    ┌───────────────┐
                    │    Browser    │
                    │               │
                    │ React         │
                    │ Phaser        │
                    │ Matter.js     │
                    │ Wallet        │
                    └───────┬───────┘
                            │
                     WebSocket / HTTP
                            │
                            ▼
                    ┌───────────────┐
                    │ Game Server   │
                    │               │
                    │ Matchmaking   │
                    │ Game State    │
                    │ Physics      │
                    │ Anti-cheat   │
                    │ Replay       │
                    └───────┬───────┘
                            │
                     Verified Result
                            │
                            ▼
                    ┌───────────────┐
                    │ Solana        │
                    │ Program       │
                    │               │
                    │ Match State   │
                    │ Settlement    │
                    │ Rewards      │
                    └───────┬───────┘
                            │
                            ▼
                         SOLANA
```

---

# 🚀 FIRST TASK

Do NOT start with Solana.

The first implementation target is:

```text
Create a React + TypeScript web project.

Add Phaser.

Create a game scene.

Add Matter.js.

Create a rectangular arena.

Create one ball.

Allow the player to aim and launch the ball.

Make the ball collide with and bounce off the arena walls.
```

Once this works, commit it:

```bash
git commit -m "feat: create physics prototype"
```

Then move to the next milestone.

---

# 📌 PROJECT RULE

> **Build the smallest working version first.**

BALL//BREAK should become a good game before it becomes a complicated blockchain application.

**Physics first.
Multiplayer second.
Solana third.
Polish last.**
