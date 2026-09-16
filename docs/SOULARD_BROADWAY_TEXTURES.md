# Soulard and Broadway facade pass

Adds named brick-and-stone pub facades, storefront glass, awnings, cornices and signs for 24 venues in the bundled Soulard-area OSM data. This includes Pieces, the brewery Biergarten, and nearby Trueman's. These are stylized treatments, not photo surveys or a guarantee of current business occupancy.

The venue supplement supplies 14 missing OSM building outlines. Outlines were clipped against the same widened road/sidewalk buffers used by the main map and checked against existing buildings. Existing buildings retain their footprints and heights; missing outlines use mapped floor counts, defaulting to two floors where absent. Source building indices refer to the existing st-louis.json ordering and must be regenerated if that dataset is replaced. Geometry sources: OpenStreetMap way records and relation 8869242; data © OpenStreetMap contributors, ODbL.

North and South Broadway frontage buildings throughout the playable three-mile map receive shared masonry textures and full-mode cornice/storefront details. Glass towers, garages and dedicated landmark treatments remain specialized. East Broadway across the river is outside this pass. Corridor coverage uses wall-edge midpoints within the road half-width plus five world units; buildings farther behind the frontage are not classified as Broadway.

Light mode retains venue textures at 256 pixels and Broadway textures with correctly scaled UVs; extra corridor geometry remains disabled. Venue names are available through the existing landmark visit control.

Verification: actual game startup, venue-match audit, Broadway coverage and both rides in Chromium light/full profiles; offline polygon road-clearance/overlap checks. Physical iPhone/Android visual performance still needs device testing. Changes to the web preview do not update already-installed Android APKs.
