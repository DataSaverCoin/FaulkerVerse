# Downtown-wide facade rollout

Expands the approved hotel/Ballpark Village texture pilot to every ordinary building
whose footprint centroid is within 700 world units of the downtown origin (roughly
2.33 km at the map's 0.3 scale). The original source contains 1,598 records in this
area: 1,594 receive detailed facades and four named landmark records retain their
existing custom treatments. Clipping and building parts make rendered counts differ.

Use-specific profiles cover brick buildings, glass towers, stone buildings, historic
civic buildings, warehouses, and parking garages. Garages get open horizontal bays
rather than hotel windows. Warehouses and garages do not get hotel entrance overlays.
Signs remain limited to the hotel/village profiles to avoid citywide label clutter.
Shared textures and spatially merged frontage meshes limit runtime overhead.

Hyatt Regency at the Arch (OSM 108704347) previously had the default three-floor
height, with zero recorded levels. Its runtime representation now uses 18 floors
and an approximate 18.9-unit height, cream panels, window bands and an inset roof
cornice. This is a stylized correction, not a measured architectural reconstruction.
The original bundled map and footprint/clearance geometry are unchanged.

Drury Plaza at the Arch (OSM 108704344) keeps its existing ten-floor main block,
with warm historic brick, stone window trim, frontage and an inset cornice. The
separate Drury at Union Station retains its brick hotel treatment. No adjacent
building is relabeled as part of Drury without mapped evidence.

References:
- https://www.hyatt.com/hyatt-regency/en-US/stlrs-hyatt-regency-st-louis-at-the-arch
- https://assets.hyatt.com/content/dam/hyatt/hyattdam/documents/2023/05/01/1719/Hyatt-Regency-St-Louis-Arch-Floor-Plan-English.pdf
- https://www.druryhotels.com/historic-renovations-st-louis-arch

Building heights elsewhere remain based on bundled data, including fallback heights
where source information is absent. This rollout improves appearance; it is not a
survey of every downtown building's actual height or historic facade.

Implementation: `DowntownFacades.js` selects/draws shared profiles;
`StLouisBuildings.js` applies the Hyatt correction, hotel cornices and batched
frontage. Existing road clearance, river bridges and special venue models remain.
