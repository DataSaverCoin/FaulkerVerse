# Web startup visibility and cache revalidation

The reported screenshot showed the game overlays but a black scene. A fresh
browser did not reproduce a JavaScript exception; the precise cause on the
owner's browser is not confirmed.

The loading screen now exists in the HTML before modules execute, gets a paint
opportunity before city construction, and stays until scene resources are ready
and a frame has rendered. Startup errors retain a visible message.

The local preview uses scripts/preview-server.py to serve Cache-Control:
no-cache, must-revalidate on both fresh responses and 304 responses. This keeps
module files revalidated across updates. Existing clients should use Ctrl+Shift+R
once to discard any files retained under the previous caching policy.

Only the dedicated downtown preview service was changed. The previously delivered
Android APK has not been rebuilt for this web-only repair.

The loading overlay now shows an accessible progress bar with explicit engine, city, avatar, city-life, graphics and first-frame milestones. Percentages represent stages, not byte download counts. Each stage yields to the browser for painting. 100% is shown only after scene readiness and a rendered frame. Deferred Babylon scripts allow the initial loading UI to appear during engine downloads.

Confirmed subsequent owner error: StationTrain.create failed when the late union-station-rail.json request timed out, aborting Engine.initializeGameplay at 70%. StationTrain now embeds the same small route data (including ODbL attribution); its JSON remains the source reference. This removes the late request entirely while retaining the train. Regression browser testing blocks the former JSON URL and checks full startup plus two train cars.
