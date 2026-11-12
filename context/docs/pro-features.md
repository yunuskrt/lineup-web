# Pro Features

What Pro adds over Free, and the plan that builds it. Decided 2026-11-10; specced, not built. `project-overview.md` § Free vs Pro is the source; this file adds the detail and the order.

## The switch: `PRO_ENABLED`

One backend environment variable decides whether the Free/Pro split exists.

| Value | Where | Effect |
| --- | --- | --- |
| `false` | Production at launch, and the default when unset | No split. Every user and every guest is Pro. The app never mentions Pro, prices or locks |
| `true` | Development now, production later | The real split. Free users get the Free side; paying users get Pro |

- **Build and test everything with `true`.** Flipping production to `true` later needs no code change, only a restart.
- **The backend decides the tier** (Hard Constraint 16): a stored tier per user, and the effective tier `PRO_ENABLED ? stored : 'pro'` in every `User` it sends. A public `GET /config` tells the web whether the split is on. The web has no switch of its own.
- **Guests can be Pro**, and upgrading a guest keeps the tier, as it keeps the history.
- **Payments** (Stripe, App Store and Play billing, RevenueCat) are handled separately. Development makes a user Pro with a backend script: `npm run user:tier -- <email or handle> pro`.
- **The web's mock copies the backend:** `NEXT_PUBLIC_MOCK_PRO_ENABLED` (unset = on) and `NEXT_PUBLIC_MOCK_TIER` (the stored tier). Mock only, never read in real mode.

## Rules every Pro feature follows

- **Never an advantage in a duel** (Hard Constraint 15). Every feature is solo, except #7, which only decides who can open a room.
- **The squad never reaches the client** (Hard Constraint 2), so the archive never shows a lineup.
- **`memorability_score` is never shown** (Hard Constraint 20): no sorting, filtering or labelling by it.
- **A refusal names its reason:** `forbidden` with `reason: 'pro_required'` or `'daily_cap'`.
- **A locked feature is visible, not hidden,** while the split is on: the control drawn locked, one line saying Pro unlocks it, and **See Pro** linking to `/pro`. With the split off, no lock and no `/pro` exist.

## At a glance

| # | Feature | Free | Pro | Today |
| --- | --- | --- | --- | --- |
| 1 | Exact match selection | Random match from filters | Pick any match from the archive | **Done**: R13, Pro E |
| 2 | Archive browse & search | Locked page | Browse and search every match | **Done**: R12, Pro D |
| 3 | Solo runs | 5 a day, reset at UTC midnight | Unlimited | **Done**: R11, Pro C |
| 5 | Practice mode | Locked | No lives, no clock, not saved | **Done**: R14, Pro F |
| 7 | Private rooms | Join only | Host and join | **Done**: R10, Pro B |
| — | Post-game review | Missed count only | Every player missed | **Done**: real since R9 and Pro A |

## The features, decided

### 1. Exact match selection

- Pro plays the exact match picked from the archive. Side pick, the loop and the summary are today's.
- `POST /solo/sessions` takes an optional `matchId` (the filters are then ignored). It must be in the pool.
- Replays are allowed, and the run counts in stats and history. Solo only.

### 2. Archive browse & search

- `/archive`: every pool match, newest first, 20 at a time. Search by club, competition, season or nickname (normalized, every word must match), plus the `/play` filters.
- A row shows the date, the competition, the stage, both clubs, the score and the nickname. Never the XI.
- While the split is on it needs Pro; while it's off it's public.

### 3. Solo daily cap

- Free: 5 runs per UTC day. A run counts when its side is picked; quitting doesn't give it back. Practice never counts.
- `GET /solo/allowance` gives `{ limit, used, resetsAt }`. The web shows "3 of 5 solo runs left today", and at 0 offers Play a duel and See Pro.
- Duels are never capped.

### 5. Practice mode

- Pro, solo: no lives, no 15s clock. It ends on all 11 or quit. The server still validates every guess.
- **Not saved at all:** no history, no stats, no cap. Idle runs are dropped after 30 minutes.
- Combines with #1: practise a picked match.

### 7. Private rooms: hosting

- With the split on, `room:create` refuses Free (`pro_required`). Joining is open to everyone.
- An open room stays open if its host's Pro ends.

### Post-game review (built)

- Already gated by the server (`missed` is `null` for Free). R9 makes the tier real, so it works in real mode for the first time.

## The build plan

Six backend requests (`context/docs/backend-requests.md` § R9–R14) and six web specs (`context/features/pro-a-…` to `pro-f-…`), in this order. Each step is the backend request first, then its web spec. **The step-by-step guide, with the env variables and the checks, is `context/docs/pro-features-runbook.md`.**

| Step | Backend | Web | Needs |
| --- | --- | --- | --- |
| 1 | R9: the tier, the switch, `GET /config`, `reason` (**done**, `fcf2079`) | `pro-a-switch.md`: config, `ProLock`, `/pro`, mock switch (**done**) | — |
| 2 | R10: `room:create` gate (**done**, `d7d53ca`) | `pro-b-room-hosting.md` (**done**) | 1 |
| 3 | R11: daily cap, `GET /solo/allowance` (**done**, `35f1ce3`) | `pro-c-solo-cap.md` (**done**) | 1 |
| 4 | R12: `GET /catalog/matches` (**done**, `6a1431e`) | `pro-d-archive.md` (**done**) | 1 |
| 5 | R13: `matchId` on solo start (**done**, `7533e97`) | `pro-e-exact-match.md` (**done**) | 4 |
| 6 | R14: practice (**done**, `c8c2e51`) | `pro-f-practice.md` (**done**) | 1, 5 |

**Every Pro feature is built** (2026-11-12): #1, #2, #3, #5 and #7, behind the one `PRO_ENABLED` switch. What's left is the runbook's final check with the switch on and off, then payments (`GetProButton` is the hook point).

- **The backend may run ahead:** R9 to R14 depend only on the requests above them, so its session can do them back to back while the web follows.
- **Mobile** follows later on the same contract.
- The trial in `monetization.md` (7 days, or 3 free exact-match picks) belongs with the payments work.

## Dropped

Saved filter presets, Pro stats breakdowns, league and season packs, cosmetics, and all ads (user, 2026-11-10). Ads may be reconsidered after launch.
