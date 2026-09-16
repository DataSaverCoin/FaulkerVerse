# FaulkerVerse

> Open-world third-person RPG built with Babylon.js.

## Current Gameplay

![Sprint 9 - First Playable Build](screenshots/latest.png)

---

## Current Status

**Latest Build**
- Sprint: 9.4
- Branch: `master`
- Status: 🟢 Playable

### Completed

- ✅ Third-person camera
- ✅ Procedural terrain
- ✅ Trees, rocks, and environment spawning
- ✅ Waterways and lakes
- ✅ Mixamo character
- ✅ Developer HUD
- ✅ Boot diagnostics
- ✅ Animation state machine

FaulkerVerse is a custom third-person game engine built with Babylon.js.

The project is being developed incrementally using sprint-based milestones, with each sprint producing a stable checkpoint before moving on to the next feature set.

---

# Engine Architecture

```
Engine
│
├── World
│   ├── Scene
│   ├── Lighting
│   ├── Ground
│   └── Camera
│
├── Player
│
├── Input
│
├── CameraController
│
└── UI
```

### Design Goals

- Single source of truth for player movement.
- Camera follows the player.
- Character follows the player.
- Player never follows the camera.
- Modular systems with clear ownership.
- Configuration-driven engine behavior.
- Complete replacement files during development.

---

# Sprint Progress

## Sprint 9.1 — Build Identification

Completed

- Centralized Sprint 9.1 version metadata
- Generated Git branch, commit, and UTC build timestamp
- Build details displayed in the Developer HUD and startup log

Before packaging or deploying the game, refresh the generated build
information from the repository root:

```sh
./generate-build-info.sh
```

The game remains directly runnable as ES modules; the generated file is
committed so a fresh checkout does not require a build step.

---

## Sprint 1 — Engine Foundation

Completed

- Engine bootstrap
- Babylon.js integration
- Scene creation
- Lighting
- Ground
- Project structure

---

## Sprint 2 — Player

Completed

- Player entity
- Capsule placeholder
- Keyboard movement
- Run modifier
- Player rotation

---

## Sprint 3 — Camera Foundation

Completed

- Camera subsystem
- Camera configuration
- Camera controller architecture
- Camera update pipeline

---

## Sprint 4 — Perspective

Completed

- Third-person camera
- CameraController owns camera follow behavior
- ArcRotateCamera integration
- Mouse orbit
- Mouse wheel zoom
- Configuration-driven camera settings
- Camera smoothing foundation
- Stable Engine → CameraController → Camera update pipeline

### Current Limitations

- Camera is still an orbit camera.
- Movement is world-relative.
- Camera does not yet automatically stay behind the player.
- No camera collision.
- No shoulder offset.
- Placeholder capsule instead of animated character.

---

# Sprint 5 Goals

- Camera-relative movement
- Player rotation follows movement direction
- Character GLB import
- Animation controller
- Idle animation
- Walk animation
- Run animation

---

# Long-Term Roadmap

- Terrain streaming
- Vegetation
- Buildings
- Roads
- NPCs
- Vehicles
- Inventory
- Quests
- Save / Load
- Multiplayer investigation

---

# Development Workflow

Each sprint follows the same process:

1. Upload the current project ZIP.
2. Read the complete project before making changes.
3. Preserve the existing architecture unless a deliberate architectural change is approved.
4. Return complete replacement files only.
5. Verify functionality.
6. Commit and tag the sprint.

## Free roam and street rides

Start off duty. **Go on duty** enables automatic dispatch; **Go off duty** stops future dispatch and cancels an uncollected pickup. Finish an onboard fare to get paid, or use **Cancel fare** to end it without payment. Street ride offers work while off duty too.

On foot, approach a stopped sedan, pickup or delivery truck and press **E / Enter-exit** to eject its adult driver and take control. The car uses WASD/steering, brakes, collisions, damage and the existing follow camera. Stop before exiting. Taken vehicles remain parked; return to them or the golf cart, or use **G / Spawn cart** for a replacement. Vehicle changes require finishing or canceling an active fare. Bicycles and motorcycles remain traffic-only.

There are **100 sidewalk residents**: 70 adults, 10 children, 10 toddlers and 10 babies in strollers. Approach and press **F / Talk** to greet them. Stop your vehicle beside someone and choose **Do you need a ride?** They may decline; accepted rides use the existing destination marker and pay on arrival. Guardians handle family offers; four-person families need the six-seat cart. Ride offers have a one-minute cooldown after a response.

Vehicle takeovers, resident locations and earnings are session-only. Driver ejection is a short procedural animation; police/wanted levels, persistent car ownership and free-form spoken dialogue are not implemented.
