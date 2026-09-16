# Intersection traffic update

## Behavior

- Traffic follows the bundled OSM one-way directions and retains short links between road nodes. Discarding those links previously created artificial dead ends.
- 715 signal locations replace the old 36-location cap. Four staggered timing groups keep neighboring crossings from all changing together. Red/amber/green lamps and the driving rules use the same timing.
- Nearby nodes describing one intersection share a reservation. A driver waits for a green light, its turn in the queue, and room on the exit road before entering.
- Reservations remain until the vehicle clears the crossing. Shape points on the approach no longer keep a cleared crossing locked.
- Movement is capped at stop lines and following distances, including the slower updates used for distant traffic. A footprint check prevents movement/turns into another vehicle.
- An ambient vehicle waiting at least 90 seconds can recirculate onto a clear road only when more than 240 world units from the player. Taken/parked player vehicles are excluded. This fallback releases all old reservations and preserves the population count; it is recorded in the traffic audit as a recovery, not counted as normal driving progress.

## Coverage

The existing ambient-traffic area remains within 800 world units of the downtown origin. The selected connected city-street network has 8,723 nodes and 1,081 junction nodes, grouped into 876 intersection tests. Roads outside that ambient area remain part of the playable map. AI cars/bikes no longer use stacked freeway/ramp geometry; the player can still drive on those roads.

## Validation

Use the task artifacts for the final JSON results. The isolated audit tests representative incoming directions for every intersection group, using the actual browser map's cleared building footprints, road surfaces, elevations, and service obstacles. A separate 650-vehicle city soak tests ongoing traffic and reports waits, violations, footprint overlaps, and recoveries. These are automated simulations; they are not a claim that every possible player-created blockage has been eliminated.
