# Smooth cart driving and riverfront update — Android 1.7

## Driving

The cart no longer adds a sine-wave vertical motion on flat roads. Four tire samples
now drive a smoothed support plane, rather than instantly snapping the body to the
highest sample. Pitch and roll follow the surface; teleports snap to the destination.
Throttle, steering and collisions share bounded substeps, including after an app
resume or slow frame. Forward speed is now 8 world units/second (previously 20),
reverse is 3, acceleration 5.5 and braking 12. The existing 80% collision damage
reduction remains. Real obstacle impacts still rebound; smooth roads do not.

## Architecture and riverfront

- **Busch Stadium:** raised brick arcade piers, arched reveals, limestone coping,
  green entrance awnings and steel concourse girders around the mapped exterior.
  The existing open bowl, seating tiers, baseball field and scoreboard remain.
- **Stifel Theatre:** dedicated limestone facade, eight-column portico, capitals,
  granite-style terrace, entry steps, relief panels and two stylized bear sculptures.
- **Washington Avenue and Market Street:** detect every mapped adjacent frontage.
  The current bundled map identifies 122 buildings. Stifel, Union Station and the
  courthouse retain their dedicated treatments; 119 receive additional projecting
  cornices, piers, window sills, storefront mullions or exposed garage decks.
  Washington's named limestone/terra-cotta lofts receive a distinct facade family.
- **Parking:** 215 surface-lot polygons from OpenStreetMap are bundled locally,
  with painted bays and some parked cars. Existing mapped garages gain slab edges
  and parking signs. This does not add driveable garage interiors.
- **Arch grounds:** tapered triangular-section steel Arch, north and south ponds,
  curved pond walks, tree-lined approaches, benches, low museum entrance and broad
  river-facing steps. The ponds block walking/driving through their water.
- **Riverfront:** a stationary heliport barge with a supported gangway and deck;
  18 cargo barges in three tow groups; 14 floodwall segments with original colorful
  murals inspired by Paint Louis. Cargo barges are scenery, not controllable boats.

## Helicopter ride

Use **World > Landmarks > Riverfront helicopter rides > Visit**, or follow the map's
helicopter boarding marker. Stand in the boarding circle and press **E / Enter-exit**.
The helicopter takes off, follows an 82-second sightseeing route above the Arch and
city, and lands automatically. The same button returns early to the saved boarding
position. Ground movement and cart summoning are disabled during the flight.
**Back to avatar**, visiting another landmark, or viewing the train/wheel also ends
the flight safely. This is a guided ride; there are no pilot controls or ticket payments.

## Street residents

Five fictional adults use the existing sidewalk/conversation/ride-offer systems:
three people experiencing homelessness (with travel backpacks), and two adult sex
workers. Conversations are non-explicit; there are no sexual acts, solicitation
mechanics, or changes to the existing child/family groups. These are fictional
characters, not claims about identifiable people at the real locations.

## References and fidelity

The additions are locally generated game geometry and original procedural art,
not imported photographs or scanned buildings. Reference photographs informed
materials, facade rhythm and recognizable architectural features. Unnamed corridor
buildings remain approximations; this is not an individually photo-matched survey
of every storefront. The park is a compressed interpretive layout, not a surveyed
reconstruction. No reference photos are redistributed in the APK.

- [Stifel Theatre history](https://www.stifeltheatre.com/about-us/history) and
  [official exterior photograph in the venue brochure](https://www.stifeltheatre.com/assets/doc/Website-Corporate-Printable-Stifel-670f949013.pdf): limestone frontage, eight columns, bears and entrance terrace.
- [Busch Stadium precast fabricator photographs](https://www.internationalconcrete.com/busch-stadium): red brick arches, cream coping and green steel/awnings.
- [Built St. Louis — Washington Avenue](https://www.builtstlouis.net/washington/9b.html)
  and [American Planning Association corridor photographs](https://www.planning.org/greatplaces/streets/2011/washingtonavenue.htm): masonry window bays, piers, cornices and storefront rhythm.
- [NPS park map and museum entrance photo](https://www.nps.gov/jeff/planyourvisit/maps.htm)
  and [NPS landscape description](https://home.nps.gov/jeff/planyourvisit/the-significance-of-the-gateway-arch-landscape.htm): paired ponds, tree-lined circulation and grand staircase.
- [St. Louis Downtown Heliport](https://www.stlouisdowntownairport.com/stlheliport/)
  and [Gateway Helicopter Tours](https://www.gatewayhelicoptertours.com/): riverfront barge-based sightseeing departure.
- Parking polygons: OpenStreetMap contributors, ODbL-1.0, retrieved through
  Overpass on September 15, 2026; source and attribution are embedded in
  `assets/maps/corridor-parking.json`.

## Delivery

Android 1.7 / versionCode 8 bundles the update for **Play offline**. The online
preview is a separate snapshot and has not been updated by this task. Source changes
remain uncommitted on `feature/smooth-cart-riverfront`, alongside pre-existing owner
work. No production changes or Git publication.
