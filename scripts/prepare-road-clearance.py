"""Offline map preparation. Requires Shapely 2.x; runtime has no Python dependency."""
import hashlib
import json
from pathlib import Path
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1]
source = root / 'assets/maps/st-louis.json'
data = json.loads(source.read_text())
# Conservative mitered corridor includes the widened pavement and sidewalk.
corridors = unary_union([LineString(r['points']).buffer(r['width'] * 1.35 / 2 + .85,
    cap_style=2, join_style=2, mitre_limit=2) for r in data['roads'] if len(r['points']) > 1])
result = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'buildings': {}, 'buildingParts': {}}
checked = changed = removed = 0
for kind in ('buildings', 'buildingParts'):
    for i, building in enumerate(data.get(kind, [])):
        original = Polygon(building['points']).buffer(0)
        if original.is_empty:
            result[kind][str(i)] = []
            continue
        if not original.intersects(corridors):
            continue
        trimmed = original.difference(corridors)
        pieces = list(trimmed.geoms) if hasattr(trimmed, 'geoms') else [trimmed]
        pieces = [p for p in pieces if p.geom_type == 'Polygon' and p.area >= .5]
        # Split interior holes into triangles only where necessary; buildings must not cap a road.
        from shapely.ops import triangulate
        polygons = []
        for p in pieces:
            polygons.extend([t for t in triangulate(p) if p.covers(t)] if p.interiors else [p])
        result[kind][str(i)] = [list(p.exterior.coords) for p in polygons]
        for p in polygons:
            assert p.intersection(corridors).area < 1e-7
            checked += 1
        changed += 1
        removed += not polygons
# Keep the mapped stadium opening, trimming only the outer facade footprint.
stadium = Polygon(data['stadium']['points']).buffer(0).difference(corridors)
if hasattr(stadium, 'geoms'): stadium = max(stadium.geoms, key=lambda p:p.area)
assert stadium.intersection(corridors).area < 1e-7
result['stadium'] = list(stadium.exterior.coords)
result['audit'] = {'adjustedRecords': changed, 'removedRecords': removed, 'verifiedPieces': checked,
                   'clearance': .85, 'roadWidthMultiplier': 1.35}
(root / 'assets/maps/road-clearance.json').write_text(json.dumps(result, separators=(',', ':'))+'\n')
print(json.dumps(result['audit']))
