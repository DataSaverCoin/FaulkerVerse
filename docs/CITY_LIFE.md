# Avatar, traffic and Union Station shuttle

The player uses a locally generated articulated avatar styled from the owner's
**second** supplied turnaround (black turquoise/gold graphic tee, shorts, white
sneakers, brown cropped hair and beard). The graphic is an approximation drawn in
canvas. This is a stylized character, not a photographic likeness or a scanned 3D
head. No copy of the private reference photo is served by the preview. The previous
Corey assets remain in place. PersonAvatar replaces the visible player mesh and ride
passenger capsule; the player capsule remains invisible for positioning. Walk/run
limb motion and a visible seated driving pose are procedural.

CityTraffic creates exactly 500 shared-geometry vehicles: 100 each of sedans, pickups, delivery trucks,
bicycles and motorcycles
on the largest connected road network within 800 world units of downtown. Cars use
lane offsets, randomly select outgoing connected edges, brake for vehicles and the
player/cart, and reserve junctions while turning. They stop for red and amber lights.
The player/cart has solid traffic collision checks. Existing road surface sampling
sets each vehicle's height, including bridge decks. The bundled roads lack reliable
one-way metadata: this first simulation treats streets as bidirectional. It is an
arcade traffic model, not a full driving-law or traffic-flow simulation.

There are 36 selected signalized intersections with marked crossing approaches.
Signals alternate east/west and north/south green (14 seconds), amber (3 seconds),
and an all-red clearance interval (1 second). Vehicles committed to a junction may
clear it when the phase changes. Crosswalks are markings; walkers stay on safe sidewalk spans and do not cross
streets. Player fines for running red lights are not implemented. Static signs/markings
and lamp groups are batched to avoid hundreds of extra draw calls.

The two-car MetroLink-style shuttle runs on the locally bundled OSM way 28453520,
an above-ground approach near Union Station. It pauses and reverses at each end.
Its vertical placement is simplified onto a raised viaduct so the existing rendered
highways can pass beneath it. It is scenery, not a rideable train, and does not model
the real station's tunnel or service timetable. **F7** moves the player to a nearby
road and frames the train for eight seconds, cancelling F8 overview. A clickable
View train button provides the same action. Function keys suppress browser defaults.

Rail source: https://www.openstreetmap.org/way/28453520
Data attribution: © OpenStreetMap contributors, ODbL 1.0.
The source was fetched once for development; no Overpass request occurs during play.

Files: PersonAvatar.js, TrafficVehicle.js, TrafficNetwork.js, TrafficSignals.js,
CityTraffic.js, StationTrain.js; integrations in Player.js, GolfCart.js,
RideSystem.js, GameplaySession.js, DowntownMap.js, Engine.js and DowntownHUD.js.

Validation covers population counts, a 60-second traffic/walking simulation,
sampled road and sidewalk containment, F8→F7, weather controls, day/night visibility,
six seats, driver alignment, browser errors and screenshots. Original reference files and
credentials are not needed to reproduce the runtime assets.

## Expanded world

500 pedestrian agents use twelve shared posed meshes, six shirt colors, varied
paces and pauses. They walk back and forth on vetted downtown sidewalk spans;
paths are sampled against buildings and road surfaces. Walkers have no collision
response with one another. Sidewalk shoulders are now 0.7 world units wide, inside
the existing 0.85-unit building setback.

Vehicles within 220 units and walkers within 140 units are drawn; distant agents
continue simulating at a lower update frequency. A spatial hash replaces quadratic
traffic neighbor scans. These are total city populations, not 1,000 visible meshes
on every screen. Performance still depends on browser/GPU and the base city scene.

The cart is a procedural E-Z-GO Express 6-inspired model with two forward-facing
rows and a rear-facing row, long canopy, windscreen, lights and rear foot platform.
Six physical seats do not increase the existing one-passenger ride job capacity.
A three-circle collision footprint accounts for the longer chassis and rear step.

World controls expose time of day and clear/cloudy/rain/storm/fog/snow/hail modes.
Automatic mode changes weather every 90 seconds; a day lasts 20 real minutes.
Sun, cratered moon, stars, drifting clouds, wind-driven local precipitation and
wet-road highlights are visual simulations. Lightning flashes are opt-in.
No live weather API, disaster simulation, snow accumulation or thunder audio is
used. Particle count is capped at 1,000 and precipitation follows the player.

## Road lighting

Every non-degenerate bundled road polyline receives regularly spaced light pools
(18 world units maximum), including bridges and roads outside the downtown traffic
simulation. Shared lamp posts/heads are batched by 200-unit cells. At intersections
where a shoulder post would sit in a lane or building, fixtures hang from an overhead
wire instead. These cosmetic fixtures do not add collision obstacles.

A baked radial illumination texture supplies warm light to road and sidewalk
surfaces. It fades on at dusk and off after dawn with the existing weather clock.
This gives the entire road network pavement lighting without thousands of live
lights. It does not cast streetlight shadows or illuminate building interiors.
Four live spotlights provide moving pavement beams for the cart and three nearest
visible traffic vehicles. All 500 vehicles, including bicycles and motorcycles,
have emissive white headlights and red tail lamps; the six-seat cart has rear lamps.

Validation: full mapped-road coverage, pavement UV availability, noon lights off,
midnight lights on, vehicle lamp materials, browser errors, and matched night
screenshots with/without illumination. No production changes or publication.
