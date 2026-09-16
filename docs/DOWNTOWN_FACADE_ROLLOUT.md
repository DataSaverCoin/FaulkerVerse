# Downtown hotel and Ballpark Village texture pilot

This pilot has now been expanded; see [Downtown-wide rollout](DOWNTOWN_WIDE_FACADES.md).

`world/DowntownFacades.js` defines six reusable facade styles: historic stone,
standard stone, brick hotel, modern hotel, village brick, and village glass.
Textures include four window bays across two floors, blinds, subtle surface
variation, mortar/panel joints, trim, sills and glazing. Street-level overlays
add entrances and colored canopy bands. Named sites receive facade signage.
A separate repeating roof membrane texture applies to this batch.

Selection uses mapped hotel types and names within 700 world units of downtown,
plus explicit OSM site IDs for Ballpark Village, Live! By Loews, the PwC Pennant
Building, One Cardinal Way and two village pavilions. Union Station and the Laurel
mixed-use building are selected explicitly. Building parts inherit their parent's
facade profile. Garages, ballrooms, residential former hotels, and unrelated city
buildings keep their existing material selection.

This is a stylized texture pass. It does not replace building models, change source
heights, or claim exact photographic matches. Previous footprint clearance remains
in force; street-front overlays extend only 0.025 units beyond the facade and signs
0.05 units, within the 0.85-unit road clearance. Existing landmark models and copper
roof material selection are retained. Review this batch before a citywide rollout.

Textures are generated deterministically with the browser canvas. Shared materials
and spatial batching avoid creating a unique high-resolution texture per building.
There are no new runtime dependencies or image-network requests.

Files:
- `world/DowntownFacades.js`: site selection, texture drawing and facade UVs/frontage.
- `world/StLouisMaterials.js`: registration and scoped material selection.
- `world/StLouisBuildings.js`: profile inheritance, batched frontage and site signage.

Location references for mixed-use hotel sites:
- https://www.hilton.com/en/hotels/stlcuqq-st-louis-union-station-hotel/hotel-location/
- https://www.hilton.com/en/hotels/stlwaes-embassy-suites-st-louis-downtown/hotel-location/
