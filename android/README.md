# FaulkerVerse Android

An installable Android 8.0+ (API 26) landscape WebView app containing a snapshot of
the game, maps, procedural models and Babylon runtime. The startup chooser offers bundled offline play or the hosted online city.
Online mode uses the INTERNET permission; offline play needs no connection.
There is no telemetry, native JavaScript bridge or file-system access. A current Android System WebView and OpenGL ES 3-capable device are required.

## Controls

- Left pad: walk, forward/reverse, or steer while driving.
- Right joystick: hold to rotate the camera.
- Enter / exit: enter or leave your vehicle. On foot beside a stopped automobile, eject the driver and take control.
- Talk: greet a nearby resident or ask whether they need a ride. Families travel together.
- Go on/off duty: enable or disable dispatch. Start off duty and explore freely.
- Cancel fare: end the current trip without payment.
- Brake / jump: hold to brake while driving, tap to jump on foot.
- Hold to run: sprint while walking.
- Map: toggle the map; World contains weather and landmark views.

The developer HUD is disabled in the website and app. Touch inputs clear on pointer
cancellation, loss of focus, and app backgrounding. Android Back asks before exiting.
Rides/earnings remain session-only; closing/restarting the app resets the session.
The large city may take a minute to load, and phone performance varies.

## Build

Requires JDK, Android platform 35, and build-tools 35.0.0. No Gradle installation or
new framework is needed. ANDROID_HOME defaults to ~/Android/Sdk.

    python3 android/build.py --output /absolute/path/to/artifacts

The first build downloads the existing Babylon dependencies into android/vendor;
subsequent builds verify the recorded SHA-256 values. A local signing key is retained
outside the repository for later sideloaded updates. Do not commit signing material.
Build output includes FaulkerVerse-1.5.apk, its checksum, and the bundled web assets.
This is a locally signed sideload build, not a Play Store release. Future versions
must retain the signing key and increment versionCode in AndroidManifest.xml.

Install by opening the APK on Android and allowing installation from your browser
or file manager when prompted. Website changes do not automatically update this
bundled app; rebuild and install a newer APK for updates.

## Validation

SDK compilation, DEX packaging, zip alignment and APK signature verification.
Chromium mobile emulation loads the exact bundled assets with networking disabled
and checks multitouch steering/look, enter/exit, brake, pointer cancellation, focus
loss and map toggle. This does not replace an Android WebView/device test. No Android
device or emulator was connected during this build; native installation, renderer
performance and physical-device lifecycle remain unverified.

References:
- https://developer.android.com/develop/ui/views/layout/webapps/load-local-content
- https://developer.android.com/tools/apksigner
- Babylon Apache-2.0 license: vendor/LICENSE.txt
- OpenStreetMap attribution and sources: bundled assets/maps/st-louis.json

See docs/MOBILE_AND_MULTIPLAYER.md for room behavior and current multiplayer limits.

Android 1.2 adds the landmark tour and reference-guided exteriors; see docs/LOCAL_LANDMARK_REFRESH.md.

## Android 1.5 controls and collision comfort

- Movement pad now applies proportional forward/reverse throttle with a center dead zone. Steering and throttle remain independent at diagonals; keyboard driving is preserved.
- Landscape action buttons are larger. Each held action belongs to its initiating pointer, preventing another finger from releasing the brake. Cancellation and backgrounding clear input.
- Cart collision damage and occupant impact injuries are 80% lower. Existing wall rebound and the emergency threshold remain in place. At impact speed 10, damage is 11.2 cart health rather than 56.
- Rebuild and install 1.5, then choose Play offline for these bundled changes. The hosted online preview is updated separately.

## Android 1.7

Smooth cart suspension, lower arcade driving speed, reference-guided downtown
facades, mapped parking lots, Arch landscaping, river barges and a boardable
helicopter tour. See [the update guide](../docs/SMOOTH_CART_AND_RIVERFRONT.md).

## Android 1.8

Fixes the look joystick being overwritten by the follow camera while moving or
driving. Camera targeting now finishes before the held look input is applied.
Install the 1.8 APK to update bundled offline play.

## Android 1.9

Bundles the Soulard venue facades, missing venue outlines, and Broadway facade updates from the current web version.

## Android 2.0

Adds startup avatar/cart choices, more traffic and people, controllable road vehicles, original offline radio channels, fuel/food shops and collectible cash. See docs/VEHICLES_RADIO_AND_SHOPS.md for controls and session-save limits.
