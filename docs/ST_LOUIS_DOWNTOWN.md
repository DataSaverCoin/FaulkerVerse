# Saint Louis five-mile region preview

The existing Babylon world now has a circular exploration radius of 8,046.72
geographic metres (five miles) around longitude -90.196, latitude 38.629.
The established 30% distance compression remains: the playable radius is
2,414.016 world units. This is a ten-mile geographic diameter, not a five-mile
wide square. A gold boundary marks the edge; player and cart collision enforce it.

## Map and driving

The bundled `assets/maps/st-louis.json` contains 7,131 OSM street ways/fragments,
8,303 building footprints, and 13 Mississippi River centerline ways, downloaded
2026-09-14. Coordinates use a local equirectangular projection with 111,320
metres per degree and the origin latitude cosine. OpenStreetMap data is ©
OpenStreetMap contributors, https://www.openstreetmap.org/copyright, ODbL 1.0.
The derived snapshot remains ODbL; this does not change the game code license.
Small buildings under 20 square world units are omitted to keep this prototype
manageable. Buildings use estimated heights where OSM has none.

Roads extend into the surrounding neighborhoods; spatial indexes limit local
building and bridge collision queries. Road triangles and building meshes are
batched in 200-unit cells. Roads follow the rendered terrain. OSM-tagged bridges
cross a simplified river channel; carts and pedestrians cannot enter open water.
Interchanges and bridge elevations remain simplified, without multilayer traffic,
traffic rules, interiors, or route guidance.

**Data coverage limitation:** eastern outer map tiles could not all be downloaded
because the provider reached its bandwidth limit and alternate requests were
unavailable. The full circle is explorable, but some outer Illinois streets and
buildings are absent. Detail is most complete west of longitude -90.1715. The HUD
identifies limited street detail in the eastern outer and northeastern areas. Empty space must not
be interpreted as a complete real-world map.

## Geology

`world/RegionalGeology.js` adds gently rolling western uplands, a carved riverbed,
sandy banks, and 24 layered limestone outcrops with loess-colored caps, placed
clear of streets and buildings. Outcrops block walking/driving. Terrain height
queries interpolate the exact ground triangles, so the cart and player follow
the rendered hills. The HUD describes the surrounding stylized landform.

These are illustrative landforms and materials, **not surveyed elevations,
actual outcrop locations, or mapped geological unit boundaries**. Mississippi
channel width is simplified; centerlines come from OSM. The downtown grade is
preserved. Geological background references from Missouri DNR:

- Limestone: https://dnr.mo.gov/document-search/limestone-pub2902/pub2902
- Mississippi/Missouri alluvium: https://dnr.mo.gov/document-search/groundwater-provinces-missouri-mississippi-missouri-river-alluvium-groundwater-province-pub2997/pub2997
- Cahokia quadrangle surficial materials (loess uplands and river alluvium): https://info.mo.gov/dnr/DNR_GIS/geology/mapindex/OFM-10-0564-GS.pdf

## Controls

- WASD: walk/drive; E: enter/exit; Space: jump/brake.
- F1–F3: original downtown stops.
- F4: South Grand; F5: West End/Lindell; F6: North Grand.
- M: collapse map. Map button: switch local follow view / full five-mile region.
- F8: whole-region camera overview; reload to restore the gameplay camera.

The nine-stop ride cycle keeps pickup, drop-off and fare payment. Keyboard/mouse
remain required; mobile layout does not imply touch controls.

## Local preview and source

Route: `/previews/faulkerverse-downtown/`.
Service: `faulkerverse-downtown-preview.service`, loopback port 8098.
Runtime: `/home/cfaulk/dev/beepboop-console/var/faulkerverse-downtown-preview`.
Source feature branch: `feature/five-mile-geology` (uncommitted working changes,
based on `2c6beb5`, including the prior downtown work).

Source publication awaits current-diff approval; no commit, push or PR is made
by this update. Only the local downtown runtime is refreshed after testing.
Original FaulkerVerse and Skyward previews remain separate. No production access.

Browser validation covers startup, keyboard walking/driving, cart entry/exit,
braking, fares, all stop clearances, exact radius, terrain/mesh agreement,
hill driving, outcrop/water/boundary collisions, bridge driving, outer-region
driving, F5, map zoom/collapse, overview and desktop/mobile rendering. Headless
software rendering does not establish performance on the owner's graphics hardware.

## Bumper response and printed street names

Cart collisions now use `entities/CartBumper.js`: short swept movement steps keep
walls solid, while a damped outward impulse and gentle turn let a cart rebound
and continue along an obstacle under throttle. This also respects rocks, river
edges and the circular boundary. Braking still stops the cart; exiting or using a
landmark jump clears residual recoil. This is an arcade response, not rigid-body
vehicle physics or a simulation of collisions with other moving vehicles.

`ui/StreetLabels.js` joins contiguous street fragments by name and prints upright,
road-aligned names with dark outlines. Labels abbreviate common street suffixes
and directions. Straight-run fitting, viewport clipping, one name per street per
view and overlap checks limit clutter. Streets with insufficient visible length
are omitted at that scale; local view shows more names than the regional view.

These refinements are on `feature/bumper-cart-street-labels`, still uncommitted.


## Riverfront access and geometry correction

Concave building roofs are triangulated inside their outlines. Winding is normalized
for correct lighting, and every foundation corner reaches its terrain height instead
of sharing a floating horizontal base. All 8,303 bundled building outlines pass the
roof-area check. Very complex interiors and courtyards still follow the available
single-ring footprints rather than detailed architectural models.

Road joins share their edge positions through bends. Asphalt has a consistent
separation from the ground and sidewalks, with reduced specular glare. The player
and cart sample the rendered pavement triangles; the cart's wheel contact offset
places its tires on that surface. Overpasses and regional terrain remain stylized,
not surveyed road grades or a complete multilayer road system.

The river channel now leaves a dry corridor along Leonor K. Sullivan Boulevard.
The same variable channel width controls water collision and river rendering.
Missing named riverfront road sections were recovered from the previously downloaded
OSM snapshot, yielding 21 named riverfront ways. This free-play route does not simulate
temporary road restrictions. Actual-world availability is not represented by the game.

The entire riverfront road centerline passes 1,646 clearance samples. A continuous
cart-controller drive from the south end past the Arch to north of Eads Bridge
completed without sticking; ray tests confirm the rendered pavement agrees with
vehicle height sampling. Current source branch: `feature/riverfront-road-building-fixes`.
Changes remain uncommitted; no production changes were made.


## St. Louis architectural detail

The importer now retains 110 downtown building parts and architectural metadata
from the existing OSM snapshot. Met Square includes its tall setbacks and copper
roof sections; the Old Courthouse includes its dome and lantern. Procedural brick,
stone, glass, warehouse and classical facades add windows and masonry without
external image downloads. Roof geometry stays inside the mapped outlines.

Busch Stadium uses its mapped outer ring and inner field opening, with stepped
seating and a brick exterior. It is a simplified landmark model. Parent footprints
that duplicate detailed parts are suppressed, and parent blocks inside the stadium
are omitted. The stadium collision ring leaves its inner field open.

Road and sidewalk widths were reduced to stop oversized pavement spilling into
nearby plots. An identical set of 13,174 edge samples found 1,565 building intrusions
before and 237 after. Remaining source-map intersections, courtyards outside the
stadium, and detailed facades throughout the five-mile area are not fully resolved.
This is stylized architecture, not a photogrammetric reconstruction.

Geometry validation covers 8,413 outlines/parts, facade UVs, finite mesh positions,
landmark heights, the open stadium field and all ride-stop clearances. Changes are
uncommitted on `feature/stl-building-architecture`; production was not changed.

Architectural references:
- https://home.nps.gov/jeff/planyourvisit/old-courthouse-architecture.htm
- https://www.nps.gov/jeff/blogs/copper-leaves-from-the-dome.htm
- https://www.onemetropolitansquare.com/welcome.html
- https://kwamebuildinggroup.com/wp-content/uploads/2017/10/st.-louis-cardinals-busch-stadium.pdf


## Gateway Arch duplicate correction

The September architecture import included 32 unnamed OSM Arch segments
(ways 1419494392–1419494423). Rendering these as generic building parts produced
windowed steps alongside the dedicated steel Arch. The map now records those
IDs under arch.buildingPartIds; StLouisBuildings excludes them from generic
facade generation. Other architectural parts remain intact. The dedicated
Gateway Arch mesh remains the single visible Arch. Feature branch:
feature/gateway-arch-duplicate-fix; changes remain uncommitted.
