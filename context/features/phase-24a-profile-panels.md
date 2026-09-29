# Phase W24a — Profile Panels

## Status

Completed

## Goals

- Add `src/types/profile-screen.ts`, the presentational profile view. It renders what `/profile` looks like and decides nothing:
  - `ProfileScreenView` is a union on `status`:
    - `loading`
    - `signedOut`
    - `error`, with `message: string`
    - `ready`, with `profile: Profile`, `history: HistoryEntry[]` and `more: HistoryMoreState`
  - `HistoryMoreState` is `'idle' | 'loading' | 'failed' | 'end'`. It drives the "Show more" control under the list.
  - `HistoryTone` is `'win' | 'loss' | 'draw' | 'clear' | 'neutral'`. It picks the row's colour, which is always paired with a text label.
- Create `src/lib/profile.ts`, pure and tested in `src/lib/profile.test.ts`:
  - `duelRecord(stats)` returns `{ wins, draws, losses, total }`. `recordShares(stats)` returns each share as a 0–1 fraction for the record bar. With no duels, every share is 0 and nothing divides by zero.
  - `duelCountLabel(total)` reads "No duels yet", "1 duel" or "22 duels". It sits in the record panel's header.
  - `soloRunCount(stats)` returns `played` minus the duel total, floored at 0. The contract counts every game in `played` (see Notes).
  - `historyOutcomeLabel(entry)`:
    - Solo reuses `summaryTitle`: "Perfect clear", "Run over" or "Run ended".
    - Duel reads "Win", "Loss", "Draw" or "Forfeit win".
  - `historyTone(entry)`:
    - `win` and `forfeit_win` map to `win`, `loss` to `loss`, `draw` to `draw`.
    - `perfect_clear` maps to `clear`. `lives_out` and `quit` map to `neutral`.
  - `playedAtLabel(playedAt, now)` reads "Today" or "Yesterday" by the viewer's calendar day. An older date in the current year reads like "12 Sep". An earlier year reads like "12 Sep 2025". The format is fixed to `en-GB`.
  - `accuracyStat(stats)` reads "—" when `played` is 0 and uses `accuracyLabel` otherwise. `favouriteClubStat(stats)` reads the club name, or "None yet".
- Create `src/components/profile/`, one component per concern:
  - `ProfileView.tsx` renders one `ProfileScreenView` and is the only thing the page mounts.
  - `ProfileHeader.tsx` shows the handle as the `h1`, plus a "Guest" tag beside it when `user.isGuest`.
  - `GuestUpgrade.tsx` renders for guests only:
    - A bordered strip with the detail "You're playing as a guest. Create an account to keep your history on any device. Nothing you've played is lost."
    - One primary action, "Create account", linking to `/sign-in?mode=sign-up`. W18b's form already routes a guest into the upgrade.
  - `DuelRecord.tsx` is the lead panel:
    - Its header row reads "Duel record" on the left and `duelCountLabel` on the right.
    - Won, Drawn and Lost are Archivo tabular numerals at 48px, with small labels under them. Won is in `you`, Drawn in `fg` and Lost in `danger`. 64px stays reserved for the countdown.
    - A single record bar sits at the panel's foot, split by `recordShares`: wins in `you`, draws halved into `you` and `opponent`, losses in `danger`. The bar is `aria-hidden`, since the counts already say it in text.
    - With no duels, the bar is an empty `line` track and the numerals read 0.
  - `ProfileStats.tsx` is a `dl` of Solo runs, Perfect clears, Best streak, Accuracy and Favourite club:
    - Each row puts its label on the left and its value on the right, split by `line` dividers.
    - Values are in `fg`, in the display face and tabular. Favourite club wraps rather than overflows.
  - `HistoryList.tsx` is an `h2` "History" over a bordered `ol`, newest first, with `line` dividers between rows. Each `HistoryRow.tsx` has one fixed height per breakpoint, so the skeleton rows match it exactly. It shows:
    - A mode tag, "Solo" or "Duel".
    - The outcome label, coloured by tone.
    - The scoreline with short names (`scoreline(match, 'shortName')`), which never wraps.
    - `matchSubtitle(match)` (the nickname first, when there is one), truncated to one line, with a `title` holding the full text.
    - Found as "7 of 11". Lives left as three compact shirt pips, from `lg` up only.
    - `playedAtLabel`.
  - `HistoryMore.tsx` has one state per `more` value:
    - `idle`: a secondary "Show more" button, centred from `sm` up and full width on phones.
    - `loading`: the same button, disabled, reading "Loading…".
    - `failed`: "Couldn't load more games." in `role="alert"`, with "Try again".
    - `end`: renders nothing.
    - A persistent sr-only `role="status"` announces appended rows.
  - `ProfileSkeleton.tsx` holds the header bar, both panels (numerals, bar and stat rows) and three history rows as flat `skeleton-fill` blocks, at the real sizes for each breakpoint. No shimmer (`theme.md` § Loading).
  - `ProfileNotice.tsx` serves the whole-page states:
    - **Signed out:** the `h1` is "No profile yet" and the detail is "Play a game and your history starts here. No account needed." One primary "Play" links to `/play`, with "Sign in" as a text link.
    - **Error:** "Couldn't load your profile", the message in `role="alert"`, and "Try again".
  - **Empty history:** in place of the list, "No games yet" with "Your solo runs and duels will be listed here." and one primary "Play" to `/play`. Both panels still show, at zero.
- Compact pips: extract the shirt path from `src/components/game/Lives.tsx` so a static, non-animated pip row can reuse it. The history row must not import the animated `Lives`, and it keeps `Lives` itself unchanged in behaviour.
- Add `src/lib/dev/profile-states.ts` with `PROFILE_STATES`, reachable at `/profile?state=…`:
  - The snapshots are `loading`, `signed-out`, `error`, `empty`, `guest`, `populated`, `loading-more`, `more-failed` and `end` (plus `loading-guest`, see Notes).
  - `guest` and `populated` use the prototype's numbers: 14 won, 2 drawn, 6 lost, 12 solo runs, 1 perfect clear, a best streak of 7, 64% accuracy, and Northgate United as the favourite club.
  - `populated` has 20 mixed entries covering every outcome in both modes, spread over today, yesterday, this year and last year.
  - Sample entries are built in `src/lib/dev/samples.ts` from the fictional fixture clubs (`NGU`, `RSO`, `KMC` and others).
  - `profile-states.test.ts` checks that:
    - Every snapshot parses against the view's contract pieces (`profileSchema`, `historyEntrySchema`).
    - `populated` covers all seven outcomes.
    - Only `guest` has `isGuest: true`.
- Update `src/app/(site)/(pages)/profile/page.tsx`:
  - With a dev-only `?state=` (`devOnlyParam`), it renders `ProfileView` from `PROFILE_STATES`. An unknown state falls back to `populated`.
  - Without one, it keeps the current placeholder heading until W24b.

## Layout

`/profile` is **stat-led**: the numbers are the narrative (`design.md` § Page shape). It keeps the existing site nav and inline footer, unchanged.

The prototypes in `context/screenshots/` set the composition:

| Breakpoint                | Prototype                                         | Composition                                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop, `lg+` (1440)     | `profile-screen-desktop.png`                      | Header, then the guest strip with its button on the right. **Duel record and stats side by side**: record about 7/12, stats about 5/12, equal height, with the bar at the record panel's foot. History full width below, one line per row, lives pips shown. "Show more" centred |
| Tablet, `sm`–`lg` (834)   | `profile-screen-tablet.png`                       | The strip keeps its button on the right. The record spans the full width. The stats form a two-column `dl` grid, with Favourite club spanning both columns. History rows stay one line, with no pips. "Show more" centred                                                          |
| Phone, below `sm` (390)   | `profile-screen-mobile.png`                       | Everything stacks. The strip's button goes full width under the text. The three numerals share one row, centred in their thirds. The stats form one column. Each history row takes two lines: tag, outcome and scoreline, then the date on the right; the subtitle, then the found count on the right. "Show more" goes full width |

```text
lg+                                           below sm
┌──────────────────────────────────────┐      ┌──────────────────┐
│ floodlit_fan [Guest]                 │      │ floodlit_fan [G] │
│ ┌ strip text ········· [Create acc] ┐│      │ ┌ strip text ───┐│
│ └───────────────────────────────────┘│      │ │[Create account]│
│ ┌ Duel record  22 duels ┐┌ stats ───┐│      │ └───────────────┘│
│ │ 14     2      6       ││ Solo  12 ││      │ ┌ record ───────┐│
│ │ Won    Drawn  Lost    ││ Clear  1 ││      │ │ 14   2    6   ││
│ │                       ││ Streak 7 ││      │ │ ██████▒░░░░   ││
│ │ ████████████▒░░░░░░   ││ Acc  64% ││      │ └───────────────┘│
│ └───────────────────────┘└──────────┘│      │ ┌ stats ────────┐│
│ History                              │      │ History          │
│ ┌ Solo Clear NGU 3–2 RSO  …  11 of 11┐│     │ Solo Clear NGU…  │
│ └────────────────────────────────────┘│     │ subtitle 11 of 11│
│             [Show more]              │      │ [  Show more   ] │
└──────────────────────────────────────┘      └──────────────────┘
```

- Panels (the guest strip, record, stats and history list) are `surface-raised` with a 1px `line` border and the 12px panel radius. No shadows.
- There is one primary action per view: "Create account" for a guest, "Play" in the empty and signed-out states, and none on a populated account page, where the nav CTA already covers it.
- No horizontal scroll at 390. Long handles and club names wrap, or truncate with a `title`.

### Adopted from the prototypes

- The two-panel top row, the header-row count on the record panel ("22 duels"), and the bar anchored to the panel's foot.
- Outcome colours on the record numerals and the outcome labels.
- Per-breakpoint history rows: one line on desktop and tablet, two lines on phones. Lives pips only on desktop.
- The guest strip's button on the right from `sm` up, and full width on phones. The same for "Show more".

### Overruled by `theme.md` and `design.md`

| Prototype shows                                                                                              | Built instead, and why                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| All-caps labels, tags, buttons and headings; an uppercased handle                                           | Sentence case, matching every other page. The handle is shown exactly as the player wrote it                                                   |
| Monospace scorelines                                                                                         | Archivo with tabular figures. Numerals are Archivo (`theme.md` § Typography)                                                                   |
| Filler labels: "Competitive ledger • Duel record", "Tactical breakdown", "Solo • Duel", "Displaying recent fixtures", "Recent ledgers", "6 recent" | Just "Duel record" and "History". A structural label must carry information, and middle-dot meta joins are out                                 |
| "63.6% win share / 27.3% loss share" under the bar                                                          | Dropped. The counts carry the meaning, and a second derived figure competes with them                                                          |
| Colour-coded stat values: perfect clears in turf, best streak in amber                                      | Stat values stay in `fg`. Colour is kept for outcomes and identity, so it keeps meaning something                                              |
| Round dot pips in the history                                                                               | The shirt pip from W11 (`theme.md` § Signature components: a football-native mark)                                                             |
| "Draw • Split" label                                                                                        | "Draw". The amber and blue treatment already says it's shared                                                                                  |
| A scoreline wrapping to two lines on desktop                                                                | The scoreline never wraps; the subtitle truncates instead                                                                                      |
| A "Match archive" tag in the nav, and an "ARCHIVE-ID // 0x4829-FL" footer tag                               | The nav and footer stay as built in W08. The prototype's chrome is not in scope                                                                |
| The Guest tag pushed to the right edge on phones                                                             | The tag sits beside the handle at every width                                                                                                  |
| An info icon in the guest strip                                                                             | No icon. The sentence is the message                                                                                                            |
| Tablet and phone subtitles abbreviated ("Continental semi-final, 2005")                                     | The same `matchSubtitle` everywhere, truncated. No second, shorter format to maintain                                                          |

## Out of Scope

- The profile and history queries, pagination, and the page wiring → W24b.
- Recording duel results in the mock and making lifetime accuracy honest → W24b.
- Pro stats: per-club and per-era breakdowns, most-missed players (`monetization.md`, deferred).
- Editing the handle inline. `design.md` asks for it, but the contract has no rename endpoint.
- Crest images. `crestUrl` is null in the fixtures, and images carry a licensing risk.
- A per-row link to a past summary. The contract has no endpoint for it.

## Notes

- Scope: every profile state as a static, presentational view with a `?state=` snapshot, like W21a, W22a and W23a did. Nothing here calls the API client.
- Depends on: W05a (`Profile`, `UserStats`, `HistoryEntry`), W11 (the shirt pip), W18b (the sign-up upgrade path), W21a (`summaryTitle`, `scoreline`, `matchSubtitle`, `accuracyLabel`, the stat scale).
- Prototypes: `context/screenshots/profile-screen-desktop.png`, `profile-screen-tablet.png` and `profile-screen-mobile.png`, made from `context/docs/prompt-profile-screen.md`.
  - They are a reference for composition and feel, not a spec (`design.md` § Scope). The UI doesn't have to match them pixel for pixel.
  - Where they disagree with `theme.md` or `design.md`, those win, as tabled above.
  - Their sample rows differ from `populated`, and that's fine: the fixtures decide the data.
- `played` counts every game, solo and duel, so solo runs are derived as `played − (wins + draws + losses)`. It's display arithmetic, not a rule. If B14 splits the counts, the helper goes away.
- Constraints:
  - Colours come from tokens only. Win, loss and draw reuse the terminal-card treatment from `theme.md` § Duel — terminal, and every colour is paired with a label.
  - Motion goes through Motion only. This page needs none beyond what the shared buttons already have.
  - `@/` imports, single-line comments of at most 50 characters, dark mode only.
- Deviations recorded during implementation:
  - The `loading` view carries `isGuest`, so the skeleton holds the guest strip's space. The session loads before the profile. This added a tenth snapshot, `loading-guest`.
  - `playedAtLabel` uses fixed English month names rather than `Intl`. Some ICU builds give "Sept", which would make the label depend on the engine.
  - Dates render after hydration through `useToday` (`src/hooks/use-today.ts`, a `useSyncExternalStore` with a null server snapshot). The server can't know the viewer's time zone. Snapshots are built at render by `src/components/dev/ProfileStatePreview.tsx`, like `CanvasStatePreview`.
  - With no duels, the record numerals are `fg-dim` rather than amber and red; coloured zeros read as a result. "None yet" for the favourite club is muted too.
  - The "Draw" label carries a small amber and blue swatch, so the shared outcome keeps both colours next to its text label.
  - "Show more" in its loading state uses `aria-disabled` rather than `disabled`, because a disabled button drops keyboard focus mid-page.
  - The stats panel's heading is an sr-only "Stats". The visible panel has no header, so no filler label.
  - The shirt path moved to `src/components/game/shirt.ts`. The static pip row is `src/components/profile/LivesLeft.tsx`.
  - Class strings shared between the panels and their skeleton live in `src/components/profile/styles.ts`, so the two can't drift apart.
  - On phones, the scoreline truncates rather than wrapping if a line overflows. It never wraps at any width.
  - `DuelRecord` and `RecordShares` types were added to `src/types/profile-screen.ts` for the helpers' return values.
- Verification:
  - `npm test` covers `profile.test.ts` and `profile-states.test.ts`.
  - Click every `/profile?state=` snapshot at 1440, 834 and 390, side by side with the matching prototype. Check the composition, no layout shift from `loading` to `populated`, no horizontal scroll, keyboard focus order, and that a production build ignores `?state=`.
  - `npm run build`.

## History
