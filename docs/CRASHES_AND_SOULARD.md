# Cart spawning, crashes and medical respawns

The 1.4 crash/escape behavior supersedes the original immediate-damage behavior below. See [Crash safety and routes](CRASH_SAFETY_AND_ROUTES.md).

- **Spawn cart** (always visible during normal play) or **G** supplies a fresh cart nearby and seats the player. It reuses the existing cart so ride dispatch, audio and multiplayer presence retain their references. A two-second cooldown prevents accidental repeated taps. Spawning cancels the current fare.
- Fast cart contacts knock sidewalk pedestrians down for seven seconds. This is a non-graphic arcade animation; they stand back up.
- Swept wall impacts and traffic contacts damage the cart and driver. Wrecked carts stop; use Spawn cart for a replacement. Traffic cars crumple and stop for eight seconds, then recover. Nearby crossing traffic can collide too.
- Traffic can hit a player on foot. At zero health, movement and teleport actions stop and the medical respawn screen opens. Tap its button to respawn with full health outside the nearest mapped medical landmark. Five seconds of protection allow time to move away from traffic.
- Interrupted fares are canceled without a payout. Hospitals are exterior respawn locations, with no interior treatment simulation.

## New landmark exteriors

Original procedural textures and facade geometry preserve the existing road-cleared map footprints:

- Concentra Urgent Care, Market Street; SLU Hospital South Campus.
- St. Louis City Justice Center (city jail): pale stone paneling, tall green glass, masonry piers and entrance signage.
- Stadium East and West garages: nine concrete deck bands, grille openings, parking signage and yellow entry bollard textures. The garage interiors remain solid map buildings.
- Tin Roof, 1000 Clark, mapped to Cupples building OSM 238253086 using POI 3513706209: red brick, window hoods, cornice brackets and ground-floor music-joint signs.
- Soulard starter set: Carson’s, Social Bar & Grill, Great Grizzly Bear and Big Daddy’s. Brick palettes, stone window hoods, paneled pub fronts, awnings and signs distinguish each building.

These are stylized, phone-friendly interpretations, not photogrammetric replicas. Open **Landmarks**, choose a site, then **Visit** or **City view** to inspect them.

## References

- Concentra location: https://www.concentra.com/urgent-care-centers/missouri/st-louis/market-street-urgent-care
- City Justice Center: https://www.stlouis-mo.gov/government/departments/public-safety/corrections/city-justice-center.cfm
- Tin Roof: https://tinroofstlouis.com/tin-roof/
- Tin Roof building association: https://www.openstreetmap.org/node/3513706209
- Soulard neighborhood businesses: https://www.soulard.org/explore/restaurants/
- Great Grizzly Bear: https://greatgrizzlystl.com/
- Carson’s: https://www.carsonssportsbar.com/about-us/
- Garage exterior reference: https://www.parkme.com/lot/89860/stadium-east-saint-louis-mo

## Multiplayer scope

Existing multiplayer shares player/cart presence. NPC traffic, pedestrian knockdowns, damage and respawn state are still simulated locally; this update does not implement authoritative shared crashes or PvP damage. Medical respawns and cart summons appear to other players as position changes.
