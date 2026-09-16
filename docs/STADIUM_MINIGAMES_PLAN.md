# Stadium mini-games: proposed next phase

## Shared flow

While **off duty**, walk to a stadium entrance and choose **Watch**, **Play**, or **Back to city**. If a fare is active, finish or cancel it before entering. Park the current vehicle safely and preserve its fuel, damage, radio, and location. Returning restores the player at a clear entrance, with camera and touch controls reset.

Load a small stadium interior only while visiting. Pause local city simulation during the visit; multiplayer presence should indicate “inside stadium.” Dispose the interior on exit. This keeps phone memory manageable instead of running four stadium games alongside the whole city.

Watch and Play use the same match simulation. Watch offers broadcast, stands, and follow-ball cameras with pause, speed, and exit controls. Play adds a few large touch buttons and keyboard equivalents. Use fictional teams and original audio initially.

## Venue proposals

| Venue | First playable mini-game | Watch mode | Typical session |
| --- | --- | --- | --- |
| Busch Stadium | Batting challenge: aim and time a swing against 10 pitches; later add pitching and 3-inning games | Simulated innings with hits, outs, runners, and a scoreboard | 2–4 minutes |
| CITYPARK | Penalty shootout: aim, shot power, and keeper dive | AI shootout; later a small-sided match | 2–3 minutes |
| Enterprise Center | Hockey shootout: skate, aim, shoot; choose goalie or shooter | AI shootout with rink-side cameras | 2–3 minutes |
| The Dome | Quarterback challenge: choose a receiver, aim, release before pressure arrives | AI drives with downs, yards, touchdowns, and a game clock | 3–5 minutes |

## Recommended build order

1. **Busch batting challenge + shared entrance flow.** A visible ball, consistent pitch timing, strike/hit detection, fair scoring, restart, and safe city return. Add a simple AI batter for Watch.
2. CITYPARK penalties, reusing ball flight, aim UI, scoreboards, and match lifecycle.
3. Enterprise hockey shootout, adding puck friction and skating.
4. Dome quarterback challenge, adding receivers, routes, and catches.
5. Expand only the most enjoyable prototypes into short full matches.

## Economy proposal

First practice and Watch sessions are free. Award small, capped skill bonuses for completed Play sessions; no wager, entry fee, or payment implementation in this phase. Suggested starting cap: $25 per venue per in-game day. Freeze hunger and thirst inside the mini-game so a player is not penalized for watching. Decide persistence before adding large rewards—the city wallet currently resets with the session.

Other later jobs: food deliveries, stadium event shuttles, parcel runs, and timed sightseeing tours. Reuse the existing fare wallet and pickup/drop-off system.

## Acceptance checks for the first prototype

- Entry refuses an active fare and explains how to go off duty.
- Watch and Play work with keyboard, Android touch, and iPhone browser controls.
- Scoring is tied to simulated ball contact, not frame rate.
- Retry does not duplicate rewards; unfinished sessions earn nothing.
- Exit, interruption, and death/recovery restore a safe city state.
- Loading and leaving repeatedly does not grow mesh counts, listeners, or memory.
- City input cannot move the parked vehicle while inside.

This is a design proposal. The four sports games are not implemented by the current city update.
