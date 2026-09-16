# FaulkerVerse 1.4 — safe escape, street routes and Android HUD

## Crashes

A collision damages the cart and can injure the driver, but impact damage alone cannot kill an occupant. Severe damage (55% cart condition or less) disables the cart and begins a timed emergency:

1. **Smoke: 12 seconds.** Stop and evacuate.
2. **Fire: another 12 seconds.** The driver and rider can still escape.
3. **Explosion.** Occupants still aboard, or a player within 3.5 world units, can die. A burned chassis remains until replacement.

These are active simulation seconds; background/resume and unusually long frames do not consume the entire escape window at once.

Tap **Evacuate everyone** or **Enter/exit** (keyboard **E**) to put the driver and current fare's rider at separate, collision-free positions at least six world units from the cart. Escaped riders remain visible briefly. Evacuation cancels the fare without payment. **Spawn cart** is disabled while the hazardous cart remains occupied; once everyone is out, it can replace the cart immediately, before or after the explosion. Replacement clears the old hazard and resets cart condition.

Traffic can still injure pedestrians on foot, and medical respawning remains available after death. Multiplayer continues to share positions; hazards, NPCs and health are local simulation state.

## Suggested street routes

A yellow emissive street ribbon leads to the pickup. After boarding, it turns blue and leads to the destination. The same route appears on the minimap. The player may ignore it without penalty; after traveling away, it recalculates from the new location. Routing uses the map's street graph, including all 88 ride stops. It does not draw a straight shortcut through buildings if no connected route exists.

The route is guidance on the game's bidirectional road graph, not a simulation of real-world navigation restrictions. It does not control steering. Cancellation, emergencies and completed fares clear the ribbon.

## Android wallet and map

Tap **− Wallet** or **Mini map** to replace wallet details with the live map in the upper-left panel. **+ Wallet** brings the wallet back. The docked map shows N/E/S/W, a player heading pointer, the colored route, and the camera-relative pickup/drop-off arrow and distance. The existing mobile Mini map button operates this same panel. Thumb controls and evacuation remain accessible.

## Implementation

- `world/CartEmergency.js`: smoke, fire, explosion, safe evacuation and pooled visual effects.
- `world/PlayerLife.js`, `entities/GolfCart.js`, `world/GameplaySession.js`: nonfatal impact damage, emergency exits and replacement guards.
- `world/RideSystem.js`: visibly seated rider and standing pose after exit/drop-off.
- `world/RideRoute.js`: shortest-path street routing and one emissive pavement mesh.
- `ui/GameplayHUD.js`, `ui/DowntownHUD.js`, `ui/TouchControls.js`, `css/style.css`: map docking, heading/compass and emergency controls.
- `android/`: app version 1.4 (version code 5).
