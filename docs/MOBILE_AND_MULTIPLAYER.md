# Mobile city update

- Start on the road beside Union Station's moving train, with the cart alongside.
- Close third-person camera targets the scaled avatar's upper body. Driving pulls
  back slightly. Parked and moving carts sample the pavement under all four tires.
- Left joystick moves/steers; right joystick continuously orbits while held.
  Mini map stays available independently of the collapsed map.
- The purple ring and sign beside the Ferris wheel mark its boarding area, also
  shown on the map. Walk in, or stop your cart there, and press E / Enter-exit.
  The same control gets off and returns to the saved ground position.
- World > Multiplayer: enter the same case-sensitive room name and Join room.
  Up to eight players share visible avatars and driven carts. No account required.
  Leave returns to solo; stale peers expire after 12 seconds. Service restart clears
  rooms. This is an initial presence multiplayer mode: traffic, weather, wheel phase,
  passengers, money and physics remain local. Remote players do not collide.
- The Python preview server handles same-origin JSON updates, validates finite
  coordinates, limits message/room sizes and uses opaque session tokens. It is a
  small development server, without accounts, persistence or anti-cheat.
- Android 1.1 / versionCode 2 offers Play offline (bundled assets) or Play online
  (the BeepBoop public preview). Online requires connectivity and the host running.
  The selected owner preview uses HTTP, so room traffic is unencrypted. No secrets
  or personal information should be entered into room names. No native JS bridge.

Local preview: http://104.187.83.156/previews/faulkerverse-downtown/
External HTTP 200 on 2026-09-15 from Israel, Romania and Turkey:
https://check-host.net/check-report/4b9368eek692

Changes remain uncommitted on feature/ride-ferris-wheel alongside prior owner work.
Production was not changed.
