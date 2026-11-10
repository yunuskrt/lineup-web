# Pro Features: The Build Runbook

Follow this from top to bottom. At the end, all five Pro features (#1, #2, #3, #5, #7) work, and the `PRO_ENABLED` switch turns the Free/Pro split on and off.

- **What each feature does:** `context/docs/pro-features.md`
- **The backend requests:** `context/docs/backend-requests.md` § R9–R14
- **The web specs:** `context/features/pro-a-switch.md` to `pro-f-practice.md`

---

## 1. Know the pieces

### Two Claude sessions

| Session | Repo | Does |
| --- | --- | --- |
| **Backend session** | `lineup-backend` | Builds R9–R14. You paste each request's prompt into it |
| **Web session** (this one) | `lineup-web` | Builds Pro A–F. You run the `/feature` commands here |

The scraper session is used only once, in step 0.

### Two servers, always run by you

| Server | Port | Command | Restart it when |
| --- | --- | --- | --- |
| Backend | 8080 | `npm run start:dev` in `lineup-backend` | `.env` changes, or a request was just merged |
| Web | 3000 | `npm run dev` in `lineup-web` | `.env.local` changes |

Claude never starts, stops or restarts them. When a check needs a change, Claude asks you and waits.

### The environment variables

| File | Variable | Values | Who reads it |
| --- | --- | --- | --- |
| `lineup-backend/.env` | `PRO_ENABLED` | `true`: the split is on. `false` or unset: everyone is Pro | The backend. **Exists from step 1** |
| `lineup-backend/.env` | `DATABASE_URL` | Dev branch, or ingest (real data) | The backend |
| `lineup-web/.env.local` | `NEXT_PUBLIC_API_MODE` | `real`: talk to 8080. `mock`: no backend | The web |
| `lineup-web/.env.local` | `NEXT_PUBLIC_MOCK_PRO_ENABLED` | Unset or `true`: the split on. `false`: everyone Pro | The mock only. **Exists from step 1** |
| `lineup-web/.env.local` | `NEXT_PUBLIC_MOCK_TIER` | `free` (default) or `pro` | The mock only |

- **The rule while building:** keep `PRO_ENABLED=true` and leave the two mock variables unset. Switch a value only for a check, then put it back.
- **Never set the mock variables in production.** Real mode ignores them.

### Two test players

- **A Free player:** open a private browser window and play. A fresh guest starts Free while the split is on.
- **A Pro player:** sign in (or play as a guest), read the handle on `/profile`, then in `lineup-backend` run `npm run user:tier -- <handle> pro`. Reload the page. It exists from step 1.

### Which database

- **Steps 1, 2, 3 and 6:** either database works. The dev branch is faster.
- **Steps 4 and 5:** use **ingest**, so the archive has real matches to search (about 1,900).

---

## 2. The routine for every step

Each step pairs one backend request with one web spec. Do them in this order, every time.

1. **Backend session:** paste the step's prompt, copied from the step below ("Paste into the backend session"). The same text is in `backend-requests.md`, under each request's "Prompt for the backend session".
2. **Backend session:** let it work through `/feature load`, `start`, `review`, `test` and `complete`. Answer its questions. **Wait until it has merged to `main` and pushed.**
3. **Copy its report.** That's the commit, the names, and anything that "differs from this request".
4. **Web session:** paste the report with "R? is done". Claude marks the request Done in `backend-requests.md`. **If the report differs from the request,** Claude updates the web spec first and tells you what changed.
5. **Restart the backend** on `main`, if the backend session didn't. Check `PRO_ENABLED=true` in its `.env`.
6. **Web session:** `/feature load <spec>`, then `/feature start`. Claude builds on the mock first.
7. **Web session:** `/feature review`, then `/feature test`. During testing Claude asks you to:
   - switch the web to real mode (`NEXT_PUBLIC_API_MODE=real`, restart the web);
   - make a player Pro with the tier script;
   - set `PRO_ENABLED=false`, restart the backend, and **set it back to `true`** after that check.
8. **Do your own checks** from the step's list below.
9. **Web session:** `/feature complete`. It commits, merges and pushes.

**Never start a web spec before its backend report has arrived.** The backend session can start the next request while the web is still on the current one; it doesn't wait for the web.

---

## 3. The steps

### Step 0: Before you start (once)

1. **Web session:** say "commit the specs". This commits the specs, the requests and the `project-overview.md` edits.
2. **Scraper session:** paste this. The file must be identical in every repo.

   ```text
   Copy ../lineup-web/context/project-overview.md over context/project-overview.md (it must be identical in every repo; the web added the PRO_ENABLED paragraph, the 5-a-day solo cap, practice not saved, and the /archive and /pro routes). No code changes. Commit and push to main.
   ```
3. Make sure both servers start as they do today.

### Step 1: The tier and the switch

| | |
| --- | --- |
| **Backend** | § R9: `PRO_ENABLED`, `users.tier`, the effective tier, `GET /config`, `reason`, the tier script. It also copies `project-overview.md` |
| **Web** | `pro-a-switch`: the config, `ProLock`, `/pro`, the profile plan line, the mock switch |
| **Needs** | Nothing. **Every later step needs this one** |

**Paste into the backend session,** right after step 0.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R9 and `../lineup-web/context/docs/pro-features.md`. Write R9 up as one backend feature spec: a `PRO_ENABLED` env var (stringbool, default `false`), a `users.tier` column (default `free`), a pure `effectiveTier(stored, proEnabled)` used by every `User` the API returns (replacing the hard-coded `'free'` in `toContractUser`), a public `GET /config` returning `{ proEnabled }`, an optional `reason` (`pro_required` | `daily_cap`) on `forbidden` errors, and a dev script `npm run user:tier -- <email or handle> <free|pro>`. Gates read the tier fresh from the database per request. Copy `../lineup-web/context/project-overview.md` over this repo's copy. No `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R9 "Report in the Built note", plus anything that differs from the request.
```

**When the backend session reports R9 done:**

1. Add `PRO_ENABLED=true` to `lineup-backend/.env`, and restart the backend.
2. Open `http://localhost:8080/config`. It should show `"proEnabled": true`.
3. Make your Pro player with `npm run user:tier -- <handle> pro`.
4. Paste the report here, then run the web routine.

**Your checks, with `PRO_ENABLED=true`:**

- **Free player:** a solo run's summary shows "Reveal the full XI" locked, with See Pro. `/pro` shows the table and a disabled Get Pro. `/profile` says "Free plan · See Pro".
- **Pro player:** the reveal works, `/pro` says "You have Pro.", and `/profile` says "Pro".

**Your checks, with `PRO_ENABLED=false`** (restart the backend, then put it back to `true`):

- A fresh guest's reveal works, `/pro` is not found, and the word "Pro" appears nowhere.

### Step 2: Pro-only room hosting (#7)

| | |
| --- | --- |
| **Backend** | § R10: `room:create` refuses Free |
| **Web** | `pro-b-room-hosting`: the locked Create room, the refusal gate, the locked New room |
| **Needs** | Step 1 |

**Paste into the backend session,** as soon as the backend session has finished R9. It doesn't wait for the web.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R10. Gate `room:create` on the effective tier from R9: Free gets `forbidden` with `reason: 'pro_required'` and the message "Hosting a room needs Pro. Anyone can join one.", read fresh from the database at the command. `room:join` is unchanged, and an open room survives its host dropping to Free. Tests as listed, including a Pro creator and a Free joiner in the two-client harness. No migration, no `PROTOCOL_VERSION` bump. When it's merged to `main` and pushed, give me everything listed in § R10 "Report in the Built note", plus anything that differs from the request.
```

**Your checks, with `PRO_ENABLED=true`, in two browsers (one normal, one private):**

- **Free:** on `/play`, Duel, "Create room" is locked with "Pro hosts rooms. Anyone can join." Join still works.
- **Pro creates and Free joins** with the code; they play to the result. Afterwards the Free player sees New room locked; the Pro player sees it working.

**With `PRO_ENABLED=false`:** a fresh guest creates a room.

### Step 3: The solo daily cap (#3)

| | |
| --- | --- |
| **Backend** | § R11: 5 runs per UTC day for Free, `GET /solo/allowance` |
| **Web** | `pro-c-solo-cap`: the runs-left line, the 0-left state, the refusal gate |
| **Needs** | Step 1 |

**Paste into the backend session,** as soon as the backend session has finished R10.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R11. Add a solo daily cap for Free users (effective tier from R9): 5 runs per UTC day, counted when a side is picked (including a run in play), never for Pro or with `PRO_ENABLED=false`. `POST /solo/sessions` and the side pick refuse past the cap with `forbidden`, `reason: 'daily_cap'`, and `retryAfterMs` to the next UTC midnight; the side pick counts atomically. Add `GET /solo/allowance` returning `{ limit, used, resetsAt }` (`limit` null when unlimited). Practice runs (R14, later) never count. Tests as listed. No `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R11 "Report in the Built note", plus anything that differs from the request.
```

**Your checks, with `PRO_ENABLED=true`:**

- **Free:** "5 of 5 solo runs left today" under Start. Start a run, pick a side, quit. Do it five times; the number drops each time.
- **After the fifth:** Start is disabled, the line says when it resets, and **Play a duel** switches to Duel. Opening `/play/solo` directly shows the same message.
- **Getting a match offer without picking a side** doesn't use a run.
- **Pro:** no line, and a sixth run works. Duels are never limited.

**With `PRO_ENABLED=false`:** no line, and six runs in a row work.

The count resets at UTC midnight. To test with the same guest again before then, use a new private window (a new guest).

### Step 4: The archive (#2)

| | |
| --- | --- |
| **Backend** | § R12: `GET /catalog/matches` |
| **Web** | `pro-d-archive`: `/archive`, search, filters, Show more, the lock |
| **Needs** | Step 1. **Use the ingest database** |

**Paste into the backend session,** as soon as the backend session has finished R11.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R12. Add `GET /catalog/matches`: a paged, searchable list of the playable pool (showcase excluded) as `MatchIdentity` entries, newest first, with `q`, `competitionId`, `clubId`, `from`, `to`, `cursor` and `limit`, returning `{ entries, nextCursor, total }`. Search normalizes like guesses and needs every word to match. With `PRO_ENABLED=true` it needs a Pro session (Free gets `forbidden` + `reason: 'pro_required'`); with the switch off it's public. No lineups, players or memorability scores. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R12 "Report in the Built note", plus anything that differs from the request.
```

**Before testing:** point the backend's `DATABASE_URL` at ingest and restart it.

**Your checks, with `PRO_ENABLED=true`:**

- **Pro:** "Archive" in the nav opens about 1,900 matches, newest first.
  - Search "istanbul", "atletico" (no accent) and "milan 2005"; each finds the right matches.
  - The filters narrow the list. Show more loads the next 20.
  - A reload keeps the search and the filters.
  - **No row shows a player or a lineup.**
- **Free:** the page shows the lock, and no list.

**With `PRO_ENABLED=false`:** the archive opens for a signed-out visitor.

### Step 5: Exact match selection (#1)

| | |
| --- | --- |
| **Backend** | § R13: `matchId` on the solo start |
| **Web** | `pro-e-exact-match`: Play on archive rows, the `/play` link, the gates, Play it again |
| **Needs** | Step 4. **Use the ingest database** |

**Paste into the backend session,** as soon as the backend session has finished R12. R13 needs R12.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R13. Let `POST /solo/sessions` take an optional `matchId` alongside the filters (ignored when it's set): Pro only (`forbidden` + `reason: 'pro_required'` for Free), the match must be in the playable pool (`not_found` otherwise, the showcase included), and everything after is today's solo run, counted in stats. Replays are allowed; duels never take a `matchId`. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. When it's merged to `main` and pushed, give me everything listed in § R13 "Report in the Built note", plus anything that differs from the request.
```

**Your checks, with `PRO_ENABLED=true`:**

- **Pro:** in the archive, Play on a match (for example the Miracle of Istanbul). The side pick shows exactly that match; play it.
  - The summary offers **Play it again**, and it gives the same match.
  - The run shows in the profile history.
- **On `/play`, Solo:** "Or pick the exact match from the archive" leads to the archive.
- **Free:** opening a `/play/solo?match=…` link shows "Picking a match is part of Pro."

**With `PRO_ENABLED=false`:** a fresh guest picks and plays a match.

### Step 6: Practice mode (#5)

| | |
| --- | --- |
| **Backend** | § R14: practice, not saved |
| **Web** | `pro-f-practice`: the checkbox, Practice on archive rows, the canvas without ring or lives, the summary |
| **Needs** | Steps 1 and 5 |

**Paste into the backend session,** as soon as the backend session has finished R13. R14 needs R13.

```text
Read `../lineup-web/context/docs/backend-requests.md` § R14. Add practice mode to solo: an optional `practice: boolean` on the start body (combines with R13's `matchId`; Pro only, `forbidden` + `reason: 'pro_required'` for Free). The rules engine runs it with no round clock and no life loss, ending on all 11 or quit; guesses are validated as usual. `SoloSession` and `SoloSummary` gain `practice: boolean`; `round` stays null and `lives` 3. A practice run is never saved (no rows, no history, no stats) and never counts toward the daily cap. Drop idle practice runs after 30 minutes. Tests as listed. No migration, no `PROTOCOL_VERSION` bump. Ask me anything unclear before `/feature load`. When it's merged to `main` and pushed, give me everything listed in § R14 "Report in the Built note", plus anything that differs from the request.
```

**Your checks, with `PRO_ENABLED=true`:**

- **Pro:** on `/play`, Solo, tick "Practice", then **Start practice**.
  - No ring and no lives; a "Practice" tag in their place.
  - Wait more than 15 seconds: nothing is lost, and no clock sounds play.
  - Wrong and right guesses still work. Name players until you quit.
  - The summary is tagged Practice, with **Practise again**.
- **After it:** the profile history and stats are unchanged, and the solo runs-left count is unchanged.
- **Practice** on an archive row practises that match.
- **Free:** the checkbox is locked.

**With `PRO_ENABLED=false`:** a fresh guest can practise.

### Step 7: The final check, both ways

Run every step's checks once more in one sitting, so nothing later broke anything earlier.

**`PRO_ENABLED=true`, a fresh Free guest:**

| Feature | Expect |
| --- | --- |
| Post-game reveal | Locked, See Pro |
| Create room | Locked; Join works |
| Solo runs | "N of 5 left", stops at 0 |
| Archive | Locked page |
| Pick a match | Locked gate |
| Practice | Locked checkbox |
| `/pro`, profile | The table; "Free plan · See Pro" |

**After `npm run user:tier -- <handle> pro` and a reload:** all of the above open, with no runs-left line, and `/pro` says "You have Pro."

**`PRO_ENABLED=false`, a fresh guest:** everything is open, `/pro` is not found, and the word "Pro" appears nowhere.

**Then set `PRO_ENABLED` back to `true`** for development.

When every row passes, all five Pro features are done.

---

## 4. If something looks wrong

| You see | Likely cause | Do this |
| --- | --- | --- |
| Everyone is Free, or everyone is Pro, whatever the switch | The backend wasn't restarted after `.env` changed | Restart the backend |
| The web still shows the old switch value | The browser keeps `/config` for up to 5 minutes | Hard-reload, or wait 5 minutes |
| A player made Pro still looks Free | The page holds the old session | Reload the page |
| The mock doesn't change after editing `.env.local` | `npm run dev` reads it only at start | Restart the web |
| The archive is nearly empty | The backend is on the dev database | Switch `DATABASE_URL` to ingest and restart |
| The backend report names a field differently from the spec | The backend built it differently | Paste the report here; Claude updates the spec before `/feature start` |
| A web check fails on real mode only | The web's copy of the contract is wrong | Tell Claude; the backend is right (`coding-standards.md` § The Contract) |

---

## 5. At launch, and later

- **Production at launch:** set `PRO_ENABLED=false` on the backend (or leave it unset). Everyone is Pro, and nothing mentions Pro. The web needs no setting.
- **To start selling Pro later:**
  1. Wire payments into `GetProButton` on `/pro`.
  2. Make purchases set the stored tier.
  3. Set `PRO_ENABLED=true` on the production backend and restart it.

  No other code change is needed.
- **Mobile** builds the same features later, against the same backend.
