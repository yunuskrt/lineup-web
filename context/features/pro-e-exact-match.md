# Pro E: Exact Match Selection

## Status

Completed

## Goals

Pro picks one match from the archive and plays it as a solo run: "I want to play Istanbul 2005 right now." Needs **Pro D** and backend **R13** on `main`.

- **The contract, transcribed from R13:**
  - `soloStartRequestSchema = filtersSchema.extend({ matchId: idSchema.optional() })`.
  - `SoloApi.findMatch(filters)` becomes `findMatch(request)`. Every caller still sends the filters; only a picked run adds `matchId`.
  - New refusals: `forbidden` + `pro_required`, and `not_found` ("That match isn't in the game.").
- **The archive rows become playable** (open only): each row gains **Play**, a secondary button going to `/play/solo?match=<id>`. A session is ensured first (a guest), as Start does.
- **`/play`, Solo selected:** a line under Start, "Or pick the exact match from the archive", linking to `/archive`. With the lock on it's still shown: the archive page carries the lock.
- **`/play/solo?match=<id>`:**
  - The run starts with `matchId` (and the default filters). The side pick card shows that match, and the run is today's.
  - **`not_found`:** a gate, "That match isn't in the game any more.", with **Back to the archive**.
  - **`pro_required`:** a gate, "Picking a match is part of Pro.", with See Pro and Back to play.
- **The summary of a picked run:** **Play it again** (the same match, a new run) as the primary action, and **Back to the archive**. A random run's summary is unchanged.
- **The mock:** `findMatch` with `matchId` offers that fixture; it refuses an effective-`free` user with `pro_required`, and answers `not_found` for an unknown id.
- **Dev snapshots:** `?state=solo-match-not-found` and `solo-match-locked`; a picked run's summary.
- **Tests (pure):**
  - The start request built with and without `matchId`.
  - The URL helper reading `?match=`.
  - The solo run's two new failures.
  - The summary actions for a picked run and a random one.
  - The mock: the exact fixture is offered; both refusals.
- **Docs:**
  - `context/docs/contract.md`: `SoloStartRequest`, the two refusals.
  - `context/theme.md` § Solo: a "Picked match" row (the summary actions).
  - `context/docs/pro-features.md`: #1 marked done.

## Layout

```text
/archive row (open)

12 May 2005  [UCL] Champions League · Final                [ Play ]
(crest) AC Milan  3–3  Liverpool (crest)   Miracle of Istanbul

/play, Solo

[ Start solo run ]
Or pick the exact match from the archive
```

## Out of Scope

- **Duels and rooms never take a picked match** (`monetization.md` § Rejected).
- **Practice on a picked match:** F adds it.

## Open Questions

Defaults stand unless changed at load:

- **A picked run's summary** leads with Play it again, then Back to the archive.
- **The `/play` line shows while locked;** the archive page explains the lock.

## Notes

- **Source:** user request (2026-11-10), item #1, the main Pro feature (`monetization.md`).
- **Order:** fifth of six. Needs D.
- **Hard constraints:**
  - **2:** the offer is still `MatchIdentity`; the squad loads only on the server after the side pick.
  - **15:** solo only.
  - **16:** the server refuses Free.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters.
- **Deviations recorded during implementation:**
  - **The Play button** sits in its own column from `sm`, and at the end of the second line on phones. Its accessible name names the match ("Play AC Milan v Liverpool FC, 25 May 2005"). While a guest is being made, that row reads "Starting…" and the other Play buttons wait; a failure shows the error above the list instead of failing silently.
  - **The Pro gate** reads "Picking a match is part of Pro" with "A random match from your filters is still free."; **Back to play** is the primary (it drops `?match=`) and See Pro is a link. `CanvasGateView.seePro` now also shows without a secondary link.
  - **The not-found gate** adds "Pick another one from the archive." under its title.
  - **The run remembers its pick:** the `finding` event carries `matchId` into `SoloRunState.pickedMatchId`, so the gates and the summary know the run was picked. Play it again reuses `?match=`; leaving for `/play` or a duel drops it.
  - **`resultActionsLayout` takes an options object** (`isPrivate`, `hostAccess`, `isSoloCapped`, `isPicked`): a fourth flag made the positional call unreadable.
  - **Back to the archive goes to plain `/archive`:** the archive's earlier search and filters aren't restored.
  - **The `/play` line is hidden at the daily cap,** where Play a duel and See Pro already lead on; otherwise it shows, locked or not.
  - **Two small fixes found here:** gate titles now balance (no word alone on the last line), and nav links never wrap (since Pro D's Archive link, "Sign in" wrapped at 320).
  - **The mock** refuses a Free pick before the daily cap, as R13 does, and answers `not_found` for an unknown id or the showcase.
  - **The mock checks ran as unit tests, not in a browser:** the 3000 server stays in real mode, so the mock's exact fixture, Pro refusal (before the cap), `not_found` and switch-off rules are covered in `src/lib/api/mock/api-client.test.ts`, and the same screens were checked live against the backend.
  - **Checked live** (2026-11-12, 3000 against 8080, ingest database, `PRO_ENABLED=true`): Free guest `guest-weicsaf3` saw the `/play` line, the Pro gate on a `?match=` link (Back to play went to `/play` with the pick dropped) and the archive locked with no Play. After the tier script made it Pro: Play on AC Milan 3–3 Liverpool FC sent the filters plus `matchId`, the side pick showed that match, a run named Maldini, the summary led with Play it again and Back to the archive, Play it again offered the same match, a uuid not in the game showed the not-found gate and Back to the archive opened `/archive`, and the run appears in the profile history ("MIL 3–3 LIV, Champions League final, 25 May 2005"). Snapshots clean at 320, 390 and 1440.
  - **Checked live with `PRO_ENABLED=false`** (ingest): a signed-out visitor searched "milan 2005", pressed Play on AC Milan 3–3 Liverpool FC, got a guest and that match on the side pick, played a run, and its summary offered Play it again and Back to the archive; "Pro" appeared nowhere.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, Pro:** Play on a row → that exact match on the side pick → a run → Play it again gives the same match.
  - **Mock, Free, switch on:** `/play/solo?match=<id>` shows the locked gate; the archive shows no Play (it's locked).
  - **Mock:** an unknown id shows the not-found gate.
  - **Real, ingest, Pro:** play "Miracle of Istanbul" from the archive; it appears in the profile history like any run.
  - **Real, `PRO_ENABLED=false`:** a fresh guest picks and plays a match.
