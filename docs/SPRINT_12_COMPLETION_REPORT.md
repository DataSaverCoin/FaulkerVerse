# Sprint 12.1 Completion Report

## Summary

Sprint 12.1 makes `TerrainManager.getHeightAt(x, z)` the canonical elevation
query and integrates the Sprint 12 prototype city block with that API. Roads,
parking surfaces, sidewalks, curbs, road markings, and lawn panels are now
tessellated meshes whose vertices follow the procedural terrain. Their visible
meshes are also their collision meshes, eliminating the separate flat collision
planes that allowed geometry and ground height to disagree.

Buildings now sample their complete footprints. Each building is placed above
the highest sampled point and receives a foundation down to the lowest sampled
point, preventing both terrain clipping and floating corners. Street furniture,
trees, the player, the golf cart, vehicle exits, passengers, and ride markers all
derive their placement from the same terrain API.

## Files Changed

- `terrain/TerrainManager.js` — adds `getHeightAt(x, z)`, routes terrain sampling
  through it, and retains `getHeight()` as a compatibility alias.
- `world/PrototypeCityBlock.js` — creates terrain-conforming streets and details,
  uses matching visible/collision meshes, adds conforming curbs, grounds props,
  and generates terrain-aware building foundations.
- `entities/GolfCart.js` — uses the canonical height query for driving and exits.
- `player/Player.js` — uses the canonical height query for grounding and jumping.
- `world/RideSystem.js` — uses the canonical height query for passengers, pickup
  markers, and destination markers.
- `engine/Version.js` and `engine/build-info.generated.js` — identify the build as
  version 0.12.1 / Sprint 12.1 and record the feature branch build metadata.

## Architectural Decisions

- Terrain remains the single elevation authority. Authored city surfaces sample
  it rather than introducing a second road-height or city-height system.
- `getHeight()` remains available only to avoid breaking external integrations;
  updated engine and gameplay code uses `getHeightAt()`.
- Roads and sidewalks use moderately tessellated custom meshes. This is simpler
  than terrain deformation, follows the existing procedural terrain closely,
  and lets the rendered mesh itself own collision.
- Building foundations handle sloped footprints without modifying the procedural
  terrain or adding a new world-generation subsystem.
- Existing ride states, wallet deposits, player/vehicle ownership, camera, HUD,
  audio, and update orchestration are unchanged.

## Testing Performed

- Ran `node --check` for every JavaScript file in the repository.
- Ran `git diff --check`.
- Ran a headless ride-state simulation through five complete rides, including
  assigned, pickup, onboard, destination, completed, and next-ride states.
- Confirmed the five simulated fares produce the expected `$98` wallet balance.
- Checked that updated runtime systems contain no calls to the legacy
  `.getHeight()` API.
- Regenerated build metadata with `./generate-build-info.sh`.

## Known Limitations

- The city remains a handcrafted prototype made from BabylonJS primitives.
- Conforming surfaces sample terrain on an approximately three-meter grid. This
  matches the current smooth terrain, but sharper future terrain will require a
  denser grid or authored terrain-flattening zones.
- Foundations are simple rectangular concrete volumes and are not architectural
  facade meshes.
- Automated browser screenshot tooling is not installed in the current build
  environment, so final visual inspection must also be performed in a browser.

## Recommended Sprint 13 Priorities

1. Replace the most visible building and street primitives with optimized modular
   GLB assets while retaining terrain-aware placement.
2. Add a small browser smoke-test harness for spawn, enter/exit, and ride-loop
   validation.
3. Move ride route coordinates into a data file and add landmark names to HUD
   objectives.
4. Add surface metadata only if future gameplay needs material-specific traction,
   footsteps, or audio; keep elevation owned by `TerrainManager`.
