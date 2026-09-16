# Landmark appearance and road clearance

The local downtown scene now uses dedicated procedural models for Busch Stadium,
The Dome at America's Center, and Enterprise Center. These are stylized exterior
approximations, not surveyed architectural models. Geometry remains within the
bundled site outlines. All textures are drawn locally and need no image service.

- Busch: red brick arcades, green steel, lower outfield stands, mapped field with
  mowing stripes and a diamond, scoreboard and floodlights.
- Dome: masonry piers and bands, arched glazing, broad pale ribbed roof and sign.
- Enterprise: concrete panels, blue-green glazing, low curved metal roof and green sign.

References:
- https://www.enterprisecenter.com/about-us
- https://www.enterprisecenter.com/assets/doc/Info-Packet-for-Arena-Spaces-0237567003.pdf
- https://explorestlouis.com/press-release/exterior-design-dome-americas-center/
- https://www.internationalconcrete.com/busch-stadium

## Road clearance

`assets/maps/st-louis.json` remains the source map. `scripts/prepare-road-clearance.py`
creates `assets/maps/road-clearance.json`, subtracting widened road corridors plus
0.85 world units of clearance from buildings and building parts. The adjusted
outlines are used for both rendering and collision. The stadium exterior is also
trimmed. Nine tiny/fully overlapped records are omitted from rendering, not deleted
from the source map. The output contains a source SHA256 and an audit summary.

Rebuild with Python and Shapely 2.x in an isolated environment:

```
python3 -m venv /tmp/faulkerverse-geometry-env
/tmp/faulkerverse-geometry-env/bin/pip install 'shapely>=2,<3'
/tmp/faulkerverse-geometry-env/bin/python scripts/prepare-road-clearance.py
```

Regenerate after changing the map, road widths, or sidewalk clearance.

## River bridges

Mapped road paths crossing the modeled river receive bridge support, including
crossings lacking a bridge tag. Pavement and vehicle height use the same elevation
function, with approaches settling toward dry terrain. Visible deck slabs, side
parapets and piers follow the crossing. These are generic bridges, not replicas of
each named St. Louis bridge. No new road alignment is invented across the river.
