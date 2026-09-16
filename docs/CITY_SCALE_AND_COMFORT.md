# City scale, navigation and ambience

The player cart model and its three-point collision footprint are reduced to 35%
of their previous dimensions. Driver seating and headlight beam positions follow
the smaller cart. All road vehicles, the walking avatar and ride passengers now use the same shared ACTOR_SCALE. Pedestrians retain their 90% size variation within that shared scale. Traffic collision widths, lengths, obstacle clearances and headlight height follow it. Exiting the cart retains the smaller avatar scale.

The regional roads and building geometry are filtered to a three-mile radius after
road-clearance processing, preserving clearance indices. Boundary-crossing roads
are excluded; the river and terrain backdrop can remain visible outside the play
boundary. Ride stops use the smaller boundary. Train viewing resolves its named
location instead of relying on an index in the old larger stop list.

The ride HUD now includes a camera-relative directional arrow, target name and
straight-line distance in map meters. It switches between pickup and drop-off;
it is a bearing indicator, not turn-by-turn road routing.

Streetlight geometry is grouped into daytime and nighttime instances. Three of
each ten fixtures remain in daylight; the other seven reappear when nighttime
illumination begins and hide again when it ends.

Original synthesized background music begins after user interaction, has an on/off
button, and is muted while the page is hidden. No music downloads are needed.

Camera follow distance is now 5.5 (previously 8), with a 2-unit speed pullback (previously 4). Engine sound is about one fifth of its previous gain and is only created while occupied and moving. Stopping or exiting fades it out and disposes the oscillator. Ride notification cues no longer start the engine. Browser Web Audio tests cover stationary throttle, forward/reverse, unoccupied movement, ride cues and exit.
