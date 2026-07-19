# FaulkerVerse

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

## Build Information

Run `./generate-build-info.sh` before packaging or deploying the game. The script
reads the current Git branch and short commit hash and writes them to
`engine/build-info.generated.js`, which is displayed in both the browser console
and Developer HUD. Detached CI builds use `GITHUB_HEAD_REF` or `GITHUB_REF_NAME`
when available. Direct local launches use the checked-in development fallback.
