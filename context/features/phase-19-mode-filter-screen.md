# Phase W19 — Mode & Filter Screen

## Status

Completed

## Goals

- Add filter helpers in `src/lib/filters.ts`, with tests in `src/lib/filters.test.ts`:
  - `filtersFromParams(params, options): Filters` reads `competition` and `club` (repeatable keys) and `from` and `to` (season start years).
    - Drops ids that aren't in `options`.
    - Clamps the era into `options.era`, and resets a range where `from` is after `to`.
    - Missing params fall back to the defaults: empty arrays (any competition, any club) and the full `options.era`.
  - `filtersToParams(filters, options): URLSearchParams` is the reverse. It leaves out every value that equals its default, so the default filters give a bare URL.
  - `playModeFrom(param): PlayMode` reads `?mode=`. It accepts `'solo' | 'duel'`, and anything else is `'solo'`.
  - `seasonLabel(start)`: `2004` → `2004–05`, `2025` → `2025–26` (en dash).
  - `PlayMode` goes in `src/types/play.ts`. `CanvasMode` isn't reused, because it belongs to the canvas types.
- Add `useFilterOptions()` in `src/hooks/use-filter-options.ts`. It's a TanStack query over `catalog.getFilterOptions()` through `unwrap`. The catalog is static data, so it has a long stale time.
- Add `useEnsureSession()` to `src/hooks/use-auth.ts`. It returns an async function that resolves the session through `queryClient.ensureQueryData` on the session query. If the session is `null`, it runs `continueAsGuest` and writes the result, exactly as the guest button does. It reports its own pending and error state.
- Replace the placeholder `src/app/(site)/(pages)/play/page.tsx`:
  - It stays a server page with `metadata.title: 'Play'`.
  - It awaits `searchParams` and passes the raw values to a client `PlayScreen`.
- Create the play components in `src/components/play/`:
  - `PlayScreen.tsx` (client) owns the mode and filter state. It starts from the params, and once the options load it runs `filtersFromParams`. Each change is written back to the URL with `window.history.replaceState`, so toggling a filter never round-trips to the server and never adds a history entry. Check `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md` for how the native History API syncs with `useSearchParams` first.
  - `ModeChoice.tsx` is the diptych: Solo and Duel as two panels side by side, stacked below `sm`. They form one radio group (native radio inputs), so choosing a mode is a selection, not a navigation. Each panel carries one line on what the mode is. Duel's line says your filters go into a coin flip with your opponent's.
  - `FilterPanel.tsx` goes beneath the diptych and holds three groups:
    - Competition: toggle chips (`aria-pressed`), one per option, plus an "Any competition" chip that's pressed when none is selected and clears the group.
    - Club: the same chips, with "Any club".
    - Era: two native `<select>`s, From and To, labelled with `seasonLabel`. The To list only offers seasons from From onwards, and raising From past To moves To up with it.
  - `PlayStart.tsx` holds the one primary button, labelled "Start solo run" or "Find an opponent" by mode. On click it awaits `useEnsureSession()`, then runs `router.push` to `/play/solo?<filters>` or `/play/duel?<filters>`, using `filtersToParams`. While pending it reads "Starting…" and is disabled. A failure shows `authErrorMessageOf(error)` in one `role="alert"` line.
  - `FilterSkeleton.tsx` is shown while the options load. It uses flat `bg-skeleton-fill` bars at the measured heights of the chip rows and selects, so the panel doesn't shift when they arrive.

## States

| Condition            | Diptych      | Filters                                               | Start button                          |
| -------------------- | ------------ | ----------------------------------------------------- | ------------------------------------- |
| Options loading      | Interactive  | `FilterSkeleton`                                      | Disabled                              |
| Options failed       | Interactive  | Alert line and a secondary "Try again" (`refetch`)    | Disabled                              |
| Ready, defaults      | Solo checked | "Any" chips pressed, full era                         | "Start solo run"                      |
| Ready, narrowed      | as chosen    | Chosen chips pressed, "Any" released                  | Label follows mode                    |
| Starting, no session | unchanged    | unchanged                                             | "Starting…", disabled, guest created  |
| Starting, has session| unchanged    | unchanged                                             | Navigates straight away               |
| Guest creation failed| unchanged    | unchanged                                             | Re-enabled, alert line under it       |

## Open Questions

Defaults stand unless changed at `/feature start`.

- **Where the filters live:**
  - Default: in the URL. Reloading keeps them, the link can be shared, and W22 and W25 can send a player back to `/play` with their filters intact ("Cancelled → back to `/play`, filters preserved", and the empty-pool "widen it" action).
  - Alternative: also remember the last filters in `localStorage` for the next visit. Saved presets are a Pro feature, so this is left out until that line is drawn.
- **Era control:**
  - Default: two native selects. They're accessible without effort and need no new dependency.
  - Alternative: a dual-thumb shadcn/ui Slider, which means setting up shadcn and Radix for one control.
- **When the guest is created:**
  - Default: when the player presses start, so someone who only browses `/play` doesn't create an identity.
  - Alternative: when `/play` loads, so the nav shows a guest handle straight away.

## Out of Scope

- **Calling `findMatch`, or any empty-pool check.** The client can't know the pool. W20 starts the run from the URL filters, and W25 names the too-narrow filter.
- **The duel lobby and submitting filters over the socket** → W22. This phase only carries the duel preferences to `/play/duel` in the URL.
- **Creating a guest on a direct visit to `/play/solo` or `/play/duel`** → W20 and W22, reusing `useEnsureSession`.
- **A searchable club list.** The mock has 11 clubs and nations, so chips fit. Revisit when the real list arrives (W27).
- **Anything Pro:** exact match selection, saved presets, archive browse.
- **Entrance motion** → W26 if it's wanted.

## Notes

- Scope: the `/play` route, meaning mode choice, filter preferences and the hand-off into a game route, plus creating a guest on the way in.
- Depends on: W18a (session hooks, `unwrap`, `authErrorMessageOf`), W06b/W07b (`catalog.getFilterOptions` on the fixtures) and W08 (`(pages)` layout, `NavCta` already hidden on `/play`).
- Mock data (`src/lib/api/mock/data/`): 6 competitions (2 leagues, UCL, UEL, World Cup, Euro), 11 clubs and nations, and 10 matches with season starts from 2002 to 2023. `getFilterOptions` doesn't need a session, so the options load before any guest exists.
- References:
  - `context/design.md` § Page shape per route (diptych, filters beneath) and § One primary action per view.
  - `context/project-overview.md` § B) Filters & Match Selection, and Hard Constraints 12, 19 and 20.
  - `context/theme.md` § Loading and § Lobby & matchmaking (filters preserved on cancel).
- Constraints:
  - **No difficulty control of any kind.** `memorability_score` is never exposed (Hard Constraint 20).
  - **Empty selection means "any".** This matches the contract and the mock's `pool.ts`, where an empty `competitionIds` or `clubIds` passes everything.
  - **Guest play has no sign-up wall** (Hard Constraint 12). Starting a game never sends a signed-out player to `/sign-in`.
  - **One primary action per view.** The start button is the only `bg-brand` element. Chips, panels and "Try again" are not brand-filled, and a checked mode panel shows selection with a `border-brand` outline, not a fill.
  - **Filters come from the catalog only.** No competition, club or year is hardcoded in a component.
  - **Colours come from role utilities only.** No hex, tight corners, borders instead of shadows, and labels in sentence case, not all caps.
  - Visible `FOCUS_RING` on every chip, radio panel, select and button, with tab order following the visual order.
  - `@/` imports and named exports. The page stays a server component, and clients are used only where hooks need them. Don't install shadcn/ui.
- Verification:
  - `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass. The new tests cover the parse, the round trip, dropping unknown ids, clamping the era, swapped ranges, omitting defaults and the season label.
  - Searching for `#[0-9a-fA-F]{3,6}` under `src/` still matches only `tokens.css`.
  - In the browser (`npm run dev`):
    - `/play` shows Solo checked, the "Any" chips pressed and the full era.
    - Toggling filters updates the URL without adding a history entry. After a reload, the same filters and mode are restored.
    - A hand-edited URL with an unknown club id and `from=1990` loads as that club dropped and the era clamped.
    - Signed out, start creates a guest: the nav shows "Guest N" and the browser lands on `/play/solo?...` with the filters in the query. As a signed-in player, start doesn't create a guest.
    - Duel mode relabels the button, and start lands on `/play/duel?...`.
    - The skeleton-to-filters swap doesn't shift the layout. Use a temporary mock delay, then revert it.
  - At 375, 834 and 1440 wide there's no horizontal scroll, and the diptych stacks below `sm`.
  - Keyboard: arrow keys move between the two mode radios, chips toggle with Space and Enter, and focus rings are visible throughout.
- **Deviations recorded during implementation**
  - **The page doesn't pass params as props.** It calls `await connection()` so it renders per request, and `PlayScreen` reads `useSearchParams()`. With props, going back from `/play/solo` showed the URL's filters but the default state, because Next restores the page with its original props after `replaceState`. `useSearchParams` follows the real URL.
  - **`queryClient.query` instead of `ensureQueryData`:** `ensureQueryData` is deprecated in TanStack Query 5.104. `useEnsureSession` is a mutation, so `mutateAsync`, `isPending` and `error` are the function and state the goal asked for.
  - **Three helpers added to `src/lib/filters.ts`, with tests:**
    - `toggleId` keeps selected ids in catalog order, so URLs stay stable.
    - `withMode` adds `mode=duel` and leaves solo out as the default.
    - `withQuery` builds `path?query`, or just the path when the query is empty.
    - Also `seasonsIn`, which lists the options for each select.
  - **`PlayStart` wraps `router.push` in `useTransition`,** so "Starting…" holds until the game route renders instead of flashing back to the start label.
  - **Skeleton chip widths are the measured widths of the mock catalog's chips,** in px. Only then do the rows wrap the same way. The start button sits at the same y before and after loading: 866 at 1440, 890 at 834 and 1407 at 375. The select is 37px tall, so the era bar is `h-9.25`. Revisit the widths when the real catalog arrives (W27).
  - **Design choices:**
    - The mode names are set in the condensed display face, in upper case, like the home statement.
    - A thin bar above each name marks who plays: one amber for Solo, amber and blue for Duel. The bars are square, since `theme.md` keeps full radius for badges.
    - The filter groups are ruled rows with the label in the left column, the same row style as the home rules strip.
    - The filter section is capped at `max-w-4xl` to keep the chip lines short.
  - **Copy:**
    - Solo: "Just you and the clock. You pick home or away, and the run lasts until your lives are gone."
    - Duel: "Take turns with a live opponent on the same XI. Your filters and theirs go into a coin flip, and one set is used."
    - Section heading "Match filters", with the line "Choose where the match comes from. Leave a group on Any to include all of it."
  - **Catalog errors reuse `authErrorMessageOf`.** It maps any `ApiError`, not only auth ones.
  - **Tested with temporary mock patches, since reverted:**
    - A 3s delay on `getFilterOptions`: no layout shift.
    - A failure switch: the alert shows, start stays disabled, and "Try again" recovers. The alert takes about 13s because of the default retries plus the 3s delay on each attempt.
    - A 1.5s delay on `continueAsGuest`: "Starting…" shows and the button is disabled.
  - **Filters stay editable while starting.** The destination is fixed at click time, so a change made during the brief guest creation isn't carried over.
  - **Open Questions:** every default stands: filters in the URL, native selects, and the guest created on start.
  - **Review fix: the filter panel shows whenever the options have data,** and the error only when there's none. The shared client refetches on window focus once the options go stale. A failed refetch keeps the data but flags an error, and it used to swap the loaded filters for "Try again". `AuthPanel` from W18b checks in the same error-first order for the session; that's left as is.
  - **Review nit:** the id lists in `filters.ts` use `option` throughout, instead of mixing it with `o`.
  - **Tests:** 18 in `filters.test.ts`. They include one showing filters parsed from any URL always pass the contract's `filtersSchema`, and one where clamping turns a range backwards.

## History
