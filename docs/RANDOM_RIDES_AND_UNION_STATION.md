# Random rides and Union Station

RideDispatch replaces the fixed circular itinerary. Each assignment randomly picks
from named downtown hotels, restaurants and venues. Pickups must be at least 25
world units from both the cart and the previous drop-off. Drop-offs must be at least
40 units from pickup and cannot reuse the previous drop-off name. The last eight
assigned stop names are avoided for pickup when eligible alternatives exist.
There is no deterministic route order between sessions. Fares follow trip distance.
With no eligible pair, dispatch waits and retries rather than violating separation.

The catalog derives from bundled named buildings and existing downtown attractions,
snaps to mapped roads, rejects blocked/off-road points, and deduplicates names and
near-identical curb locations. This is an arcade curb-location approximation, not
verified hotel driveway or restaurant entrance data. Function-key destinations use
the original fixed landmark list independently of the randomized ride catalog.

The St. Louis Wheel is a procedural 42-gondola observation wheel, with white spokes,
enclosed cabins that remain upright, A-frame supports and nighttime rim lighting.
It uses OSM node 7863293647 at 38.627755, -90.2095768, the local 30% map scale, and a
north/south-oriented wheel plane that clears adjacent mapped buildings. A revolution
is compressed to two minutes for visible movement. World → View Ferris wheel frames
it; it is scenery and does not provide passenger boarding.

Sources:
- https://www.thestlouiswheel.com/st-louis-wheel (200 feet, 42 enclosed gondolas)
- https://www.openstreetmap.org/node/7863293647 (placement; ODbL attribution)
- https://www.stlouisunionstation.com/history-of-union-station (230-foot clock tower)

Union Station has a sandstone-colored facade profile and a clock tower with four
dials, cornice and red pyramidal roof. Its tower base is selected inside the mapped
station footprint. This is an architectural approximation, not a surveyed model.

Facade detail now applies to buildings throughout the region, while dedicated
landmarks retain their own treatments. Mapped wall/roof colors now affect materials;
skillion and round roofs are supported, and shaped roofs have usable texture UVs.
Most bundled buildings lack color, height or facade records. Their style remains a
fallback; this update does not claim exact real-world replicas of all buildings.
Authentic individual facades and missing massing require additional reference data.

Checks: 2,000 randomized assignments, 20 complete gameplay rides and exact fare
payments, safe catalog locations, separated next pickups, wheel motion/upright
cabins, station tower, rendered-building styles, browser errors and screenshots.
No commits, pushes, PRs, or production changes.
