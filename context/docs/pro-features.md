# Pro Features

What Pro adds over Free, and what each feature needs before it can be built. Planned, not specced yet (2026-11-10). `project-overview.md` § Free vs Pro is the source; this file adds the detail.

## The switch: `PRO_ENABLED`

One backend environment variable decides whether the Free/Pro split exists.

| Value | Where | Effect |
| --- | --- | --- |
| `false` | Production at launch | No split. Every user and every guest is Pro. The app never mentions Pro, prices or locks |
| `true` | Development now, production later | The real split. Free users get the Free side; paying users get Pro |

- **Build and test everything with `true`.** Flipping production to `true` later must need no code change.
- **The backend decides the tier** (Hard Constraint 16). It sends each user's effective `tier` (already in `User`) and tells the web whether Pro is on sale (a new flag; name decided in the backend spec). The web has no switch of its own.
- **Guests can be Pro**, for example after a mobile purchase before signing up. Upgrading a guest to an account keeps the tier, as it keeps the history.
- **Payments** (Stripe, App Store and Play billing, RevenueCat) are handled separately. Development needs only a way to make a user Pro by hand, such as setting the tier in the database.
- **The web's mock mode copies the backend:** it can show both the split and the all-Pro state without the backend. It replaces today's `NEXT_PUBLIC_MOCK_TIER`.

## Rules every Pro feature follows

- **Never an advantage in a duel** (Hard Constraint 15). Every feature below is solo, except #7, which only decides who can open a room.
- **The squad never reaches the client** (Hard Constraint 2), so no Pro feature may show a lineup before it is played.
- **`memorability_score` is never shown** (Hard Constraint 20): no sorting, filtering or labelling by it.
- **A locked feature is visible, not hidden**, when the split is on: the control is shown locked with one line saying Pro unlocks it, as the post-game reveal does today. With the split off, locks never appear.

## At a glance

| # | Feature | Free | Pro | Today |
| --- | --- | --- | --- | --- |
| 1 | Exact match selection | Random match from filters | Pick the exact fixture | Not built |
| 2 | Archive browse & search | — | Browse and search every match | Not built |
| 3 | Solo runs | Daily cap | Unlimited | No cap: unlimited for everyone |
| 5 | Practice mode | — | No lives, no timer | Not built |
| 7 | Private rooms | Join only | Host and join | Built, everyone can host |
| — | Post-game review | Missed count only | Every player missed | Built; real mode always shows Free |

## 1. Exact match selection

The main Pro feature: "I want to play Istanbul 2005 right now."

- **Free:** solo picks a random match from the filters, as today.
- **Pro:** the player chooses one specific match and starts a solo run on it. Side pick, the 15s loop, lives and the summary are unchanged.
- **Solo only.** A duel never uses a chosen match (Pro-only duel matches are rejected in `monetization.md`).
- **Backend:** solo start accepts a match id instead of filters, refuses it for Free, and checks that the match is in the pool. The squad stays on the server as usual.
- **Web:** a "Play this match" action from the archive (#2) leads to the same side pick and game.
- **Open:** can a Pro player replay a match they have already played? Does a chosen-match run count toward stats like any other run?

## 2. Archive browse & search

The way into #1.

- **Free:** none. The archive entry point is shown locked.
- **Pro:** a list of every pool match, with search (club, competition, season, match nickname) and filters.
- **What a match shows:** both clubs and crests, the score, the competition, the date and its stage. **Never the starting XI** (Hard Constraint 2), and never its memorability.
- **Backend:** a paged, searchable match list endpoint, Pro only. It reuses the catalog data the filters already use.
- **Web:** a new archive route under the site shell (nav and footer), list rows with known-shape skeletons, and each row opening #1.
- **Open:** the route (`/archive`?), the sort order (newest first?), and whether Free sees a short locked preview or only the locked entry point.

## 3. Solo daily cap

- **Free:** a fixed number of solo runs per day. Duels are never capped (`monetization.md` § Rejected).
- **Pro:** unlimited.
- **The backend counts and refuses.** The web only shows what the backend says: runs left today, and a clear message plus "Play a duel" when the cap is reached. Never a dead end.
- **Backend:** count runs per user per day, refuse a new solo start past the cap with its own error reason, and send the runs left with the session or profile.
- **Web:** runs left on `/play`, the refusal state, and the summary's "Play again" honouring the cap.
- **Open:** the cap (3? 5?), when a run counts (match offered, or side chosen), when the day resets (UTC midnight, or the player's time zone), and whether quitting early still counts.

## 5. Practice mode

- **Free:** none.
- **Pro:** a solo run with no lives and no 15s clock. It ends when all 11 are named or the player quits.
- **The server still validates every guess** (Hard Constraint 1). Only the clock and the lives are switched off, in the backend's rules engine; the client does not fake them.
- **Backend:** a practice flag on solo start, a rules-engine variant with no timer and no life loss, and a summary without lives.
- **Web:** a practice choice on `/play`, the game canvas without the ring and the lives card, and the summary marked "Practice".
- **Open:** does a practice run count in history, stats and the daily cap? (Suggested: kept in history, marked practice, excluded from stats and the cap.) Can practice be combined with #1?

## 7. Private rooms: hosting

- **Free:** can join any room with its code.
- **Pro:** can also create rooms.
- **Built today:** create, join, the waiting room and the duel, for everyone. Only the gate is missing.
- **Backend:** `room:create` refuses a Free user with its own reason. Joining is unchanged.
- **Web:** "Create room" shown locked for Free, with one line saying Pro hosts rooms. Code entry and Join stay open.
- **Fair by design:** hosting decides only who opens a room. Inside the duel both players have identical rules.
- **Open:** if a host's Pro ends while their room is open, the room stays open until it is used or expires (suggested).

## Post-game review (built)

- **Free:** the summary shows how many players were missed, and the reveal button is locked.
- **Pro:** the button fills the pitch with every missed player.
- **Left to do:** nothing on the web. The backend still writes every user as `free`, so real mode always shows the locked button until the backend resolves the tier.

## Order of work

1. **Backend:** the tier and the switch: a stored tier per user and guest, the effective tier, and the on-sale flag. Every feature depends on this.
2. **Web:** read the tier and the flag; mock mode copies both states.
3. **Then each feature, backend first, then web:** #7 (smallest), #3, #2 and #1 together, then #5.
4. **Mobile** follows on the same contract.

The trial in `monetization.md` (7 days, or 3 free exact-match picks) belongs with the payments work, not with these phases.

## Dropped

Saved filter presets, Pro stats breakdowns, league and season packs, cosmetics, and all ads (user, 2026-11-10). Ads may be reconsidered after launch.
