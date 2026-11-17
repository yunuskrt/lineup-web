# Fix — Play Steps A: Mode, Filters and Start as Three Steps

## Status

Completed

## Goals

From the user's review (2026-11-17): on `/play`, choosing a mode and choosing filters share one view. Split them into **three steps on the same route**: **1 Mode**, **2 Filters**, **3 Start**. The player can move between steps and starts the game once every step is filled. Web only. The game routes, the server's checks, the filters' behaviour and today's copy (except where named) don't change. **No box:** the page stays the open column (`BOARD`) with ink rules, like `/profile`, `/archive` and `/sign-in`.

- **Steps in the URL.** A new `step` param: absent = Mode, `filters`, `start`.
  - Moving to another step **pushes** a history entry, so the browser's Back and Forward move between steps. Mode picks and filter edits still **replace** the entry, as today.
  - The page's state holds the truth for mode, practice and filters. After Back or Forward, the page rewrites that entry with its state and keeps the entry's step, so a reload never loses a choice.
  - `filters` or `start` with no mode in the URL falls back to Mode, by replacing the entry.
- **Mode is written explicitly.** `mode=solo` or `mode=duel`; `practice=1` still means a solo practice run. On `/play`, a missing mode means **nothing is picked**. An old `?practice=1` link with no `mode` still picks Practice. The game routes still read a missing mode as solo.
- **The step indicator** at the top of the column: a `nav` named "Play steps" holding an ordered list of three steps. The numbers are earned, as this is a sequence.
  - Each step shows its number disc and name. A filled step also shows its choice below the name from `sm`: the mode's name, or "Your filters".
  - The current step has `aria-current="step"` and a filled lavender disc. A filled step shows a `Check` in its disc. A step that can't be reached yet (no mode) is disabled.
  - Filled and current steps are buttons that go to that step. It fits one line at 320.
- **Focus on a step change** moves to the new step's heading (`tabIndex={-1}`) and scrolls it into view. A Back or Forward does the same.
- **Step 1, Mode** (heading "Choose a mode", `TYPE_TITLE`):
  - `ModeChoice` as today: Solo, Duel, Practice. The locked and pending Practice states stay. **Nothing is selected on a fresh `/play`.**
  - A practice link that the player can't use falls back to Solo selected, as today.
  - **Join by code** (decided 2026-11-17): while Duel is selected, a "Have a room code?" row sits under the cards, with the 6-box code input, Join, the look-alike hint and the session error. Joining skips the filters, as the creator's set applies. It passes whatever filters the URL holds, as today, and keeps the `play-a-friend` id as its anchor.
  - The solo runs-left or cap line shows under the cards while Solo is selected, so a capped player learns it before the filters.
  - **Next: filters**, a large primary button, stays disabled until a mode is picked.
- **Step 2, Filters** (heading "Choose filters"):
  - Today's filters section: the line "Choose where the match comes from. Leave a group on Any to include all of it.", then `FilterPanel`, or the error with Try again, or `FilterSkeleton`.
  - **Back** (secondary) and **Next: start** (large primary). Next is enabled once the filters have loaded, as Any is always a valid choice.
- **Step 3, Start** (heading "Ready to play"):
  - **A summary** as ruled rows:
    - **Mode** shows Solo, Duel or Practice;
    - **Competition**, **Club** and **Era** come from `filterSummary` (`lib/lobby.ts`), as the lobby shows them;
    - each group has an **Edit** link-button back to its step ("Edit mode", "Edit filters");
    - while the filters load, the rows keep their height.
  - **Start**: `PlayStart` as today, with its label ("Start solo run", "Start practice", "Find an opponent"), the runs-left or cap line with Play a duel, the "pick the exact match from the archive" line for solo, and the open-run warning for practice.
  - **Duel:** **Create room** sits under Start (decided 2026-11-17), in a "Play a friend" section with "or" between them. It shows the Pro lock and its caption "Pro hosts rooms. Anyone can join." for Free. Joining isn't here.
  - **Back** (secondary) returns to Filters.
- **`RoomControls` splits** into `JoinRoom` (step 1) and `CreateRoom` (step 3). Their logic and copy stay. They share the guest-first `go` helper.
- **`PlayScreen`** holds the step state and renders one step at a time. Each step is its own component under `src/components/play/`.

## Out of Scope

- The links that open `/play` and the step each one lands on: **Play Steps B**.
- New motion between steps. New copy beyond the step names, headings, Next and Back labels, and "Have a room code?".
- Game routes, the lobby, archive picks (`?match=`) and room share links (`/play/duel?room=`), which skip `/play`.

## Notes

- **Source:** the user's review, 2026-11-17. The user's answers:
  - the stepper approach;
  - Join on step 1 and Create on step 3;
  - nothing preselected;
  - a summary with Edit on step 3.
- **Hard constraints:** 15, 16 and 19. Practice and hosting stay Pro by the server's check (R10, R14), and the duel coin flip is unchanged.
- **Pure helpers (tested)** in `lib/play-steps.ts`:
  - `PlayStep`;
  - `playStepFrom(params)`, which falls back to Mode without a mode;
  - `withStep`;
  - `modeOptionFrom(params)`: `ModeOption | null`, where practice wins over a missing mode.
  - `withMode` gains the explicit `solo`; check its callers in `DuelGame` and `SoloGame` still drop or keep it as they did.
- **Next's `useSearchParams`** follows native `pushState` and `popstate`. Read `node_modules/next/dist/docs/` on that before using it for the step. Today's `PlayScreen` snapshots the params once (they go stale after `replaceState`), so only the step should read the live URL.
- **Design:**
  - tokens and `src/styles/classes.ts` roles only, with `cn` for any class conflict;
  - no box or card wrapper around a step;
  - the step indicator is the one new piece, and it should stay quiet: ink outline discs, no rail of colour.
  - The layout of the steps is open to the implementation, within the open-column rule.
- **Constraints:** `@/` imports; no `any`; comments of at most 50 characters.
- **Docs:** `context/theme.md` gets a "Play setup" table under § States (the three steps, what fills each, Back and Forward, the fallbacks). Its Practice row says "on step 1 of `/play`".
- **Verification:**
  - a fresh `/play`;
  - each mode through the three steps, with Back and Forward in the browser;
  - Edit from the summary;
  - a reload on each step;
  - `?step=start` with no mode;
  - join from step 1 and create from step 3;
  - Practice switch off, locked (`NEXT_PUBLIC_MOCK_TIER=free`, the user's step) and pending;
  - the cap line on steps 1 and 3;
  - the filters error and loading;
  - keyboard order and the focus after each step change;
  - 320, 768 and 1280px; `npm run build`.

- **Deviations recorded during implementation:**
  - **Filled and reachable steps:** Filters counts as filled only once the player has reached it (Any loads valid but unchosen), so Start opens only after Filters was seen. Every reachable step (all earlier ones filled) is a button, not only filled and current ones, so Edit mode then Start in the indicator works.
  - **Create room** sits in its own "Play a friend" section under Start, with an ink rule between them instead of "or".
  - **Back on step 3** shares Start's row (`PlayStart` `leading`). On phones Back is `px-4` and the large primary `px-6` (`STEP_BACK`, `STEP_NEXT` in `play/styles.ts`), so Back and "Find an opponent" fit one row at 320.
  - **"Have a room code?"** is plain 16px semibold, not the uppercase label: it's a question.
  - **URL tidy:** once the filters load, the page writes its state to the URL, which drops unknown filter ids and a prefilled `room` code (the code stays in the box).
  - **Helpers:** `playStepFrom(params, hasMode?)` takes the page's pick; also `withModeOption`, `isStepFilled`, `isStepReachable`, `MODE_OPTION_NAMES`, `PLAY_STEP_NAMES`. `playModeFrom` went (only `/play` used it); `withMode` always writes the mode. `useRoomEntry` (`hooks/use-room-entry.ts`) is the shared guest-first `go`. `ModeChoice` takes a null pick and `isLegendHidden`.
  - **Scroll on a step change** brings the step indicator into view, with the focused heading under it, rather than the heading alone at the top edge. Standing on Filters or Start also counts Filters as seen, so a reload or Forward onto a later step keeps the indicator right.
  - **Not checked in the browser:** the cap line (real-API mode is unlimited) and Practice locked or pending (`NEXT_PUBLIC_MOCK_TIER=free`, the user's step); Create room wasn't clicked, to avoid opening a real room.
