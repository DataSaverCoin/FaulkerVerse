# iPhone browser light mode

The reported browser reload occurs during the 20% city-construction stage. Memory
or GPU resource pressure is a working diagnosis, not a confirmed iOS crash-log result.

`engine/RenderProfile.js` chooses light graphics automatically for iPhone/iPad,
including iPads advertising a desktop Mac user agent with touch support.
`?quality=lite` forces it on any browser; `?quality=full` is a diagnostic override.
Android and desktop retain the existing default profile.

Light mode starts with antialiasing disabled and hardware scaling 1.75 before city
construction. It generates landmark facade textures at 256 rather than 1024 pixels
per side (one sixteenth of the pixel count per texture), limits pavement labels to
16, and uses 80 traffic vehicles / 30 pedestrians. It omits the extra corridor
facade geometry and decorative parking-lot details. Core building footprints,
roads, landmark visits, Ferris wheel and helicopter ride systems remain.

Building construction yields every 32 records; temporary building mesh groups
are merged and released after eight meshes instead of retaining them all until
city construction ends. Major construction stages also yield to the browser.

Validation uses the exact game assets in Chromium with an iPhone user agent,
3x device scale, touch and a landscape viewport. It checks successful startup,
profile limits, landmark arrival, boarding/return for both rides, and JavaScript
errors. Device-profile selection also covers desktop, Android and iPad UA modes.
This does not emulate iOS memory limits or verify native iPhone WebKit. Physical
phone testing is still needed. If the page reloads again, obtain the model/iOS
version and use Apple's Web Inspector memory/CPU timelines to locate the next
startup bottleneck before reducing additional gameplay.
