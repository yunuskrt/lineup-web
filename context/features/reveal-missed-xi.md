# Reveal the Missed XI

## Status

Completed

## Goals

- **A Reveal control on the solo summary.** It sits in the rail, between the "Named in order" list and the actions. It's a secondary button: Play again stays the one primary action (`design.md` § One primary action per view).
  - **Label:** "Reveal the full XI".
  - **Pro** (the summary's `missed` is a list): the button works. Clicking it fills the pitch's empty slots with the missed players.
  - **Free** (the summary's `missed` is `null`): the same button, locked. Under it, a 12px `fg-muted` caption reads "Pro shows every player you missed." There's no link, because Pro can't be bought yet.
  - **Nothing missed** (`missedCount` is 0, a perfect clear): no control at all.
  - **The server decides which one shows.** The web reads only whether `missed` is a list or `null`, and never looks at the user's tier (Hard Constraint 16).
- **Before the click, Pro's missed players stay hidden.** Today the pitch shows them as soon as the summary arrives. Now the empty slots stay drawn as empty until the player reveals, so the player first sees what they missed as a count.
- **What the reveal shows:** the existing `missed` slot treatment (`SquadSlot` state `missed`): headshot at 60% opacity, name in `fg-muted`, on `surface`. The named list doesn't change.
- **Motion: one by one.**
  - The missed slots appear in squad order (by `slot`, goalkeeper first), 60ms apart. Each one fades in and scales from 0.96 to 1 over 240ms, `easeOut`.
  - Transform and opacity only (`theme.md` § Motion).
  - **A new motion effect,** `missedReveal`, set to `drop` under reduced motion. With reduced motion, every missed slot appears at once, with no fade or scale.
  - **Constants:** `missedReveal: 240` in `MOTION_DURATION_MS`, and `MISSED_REVEAL_STAGGER_MS = 60`. The `motion.test.ts` checks are extended to cover them.
- **One-way.**
  - After the click, the button is replaced by a 14px `fg-muted` line: "Showing the 7 you missed." (the count is `missedCount`; one player reads "Showing the 1 you missed.").
  - The pitch stays revealed until Play again or Change filters starts a new run.
  - Focus moves to that line (`tabIndex={-1}`), so keyboard focus isn't lost when the button goes. The line is also a polite live region, so screen readers hear it.
- **State, in the solo reducer.**
  - `SoloRunState` gains `isMissedRevealed: boolean`, set by a `missedRevealed` event.
  - The event only applies while the run is over and the summary carries a `missed` list. Otherwise it changes nothing.
  - It resets with the run (`finding` starts from `INITIAL_SOLO_RUN`).
  - `SoloEndView`'s ready branch gains `isMissedRevealed`. `GameCanvas` passes `missed` to `SquadGrid` only when it's true.
  - This is presentation: it decides nothing about the game.
  - **Tests (reducer, pure):**
    - the reveal applies after the summary
    - it's ignored with no `missed` list, or before the run is over
    - it resets on a new run
    - the canvas's `missed` follows the flag
- **Locked button, accessibly.**
  - It uses `aria-disabled="true"`, not `disabled`, so it stays in the tab order. Clicking it does nothing.
  - `aria-describedby` points at the caption, so a screen reader hears why it's locked.
  - Its text is `fg-muted`, and its border doesn't turn `brand` on hover.
- **Rail fit and skeleton.**
  - The control is about 40px tall, plus the caption when locked. From `lg`, the rail's size containment (Gameplay Visuals C) still holds, so the named list scrolls if needed, and the outcome, control and actions stay put.
  - `SummarySkeleton` gains a 40px bar for the control above the actions. A perfect clear has no control, so the list's box grows into that space when it loads. From `lg` the actions are pinned and don't move.
- **Mock.**
  - The solo mock already returns `missed` only to a Pro identity.
  - **A mock-only switch** so the Pro flow can be played in the browser: `NEXT_PUBLIC_MOCK_TIER=pro` makes the mock's new identities Pro. It's read only by the mock adapter and does nothing in real mode. Free is the default.
- **Dev:**
  - The `/dev/canvas` states:
    - `run-over` shows the locked control.
    - `run-over-pro` shows the working button, with the pitch's missed slots still empty.
    - A new `run-over-pro-revealed` shows the revealed pitch and the "Showing the 7 you missed." line.
  - Clicking the button in `run-over-pro` plays the staggered reveal.
- **Docs:**
  - **`context/theme.md`:**
    - § Solo: a "Missed revealed (Pro)" row.
    - § Motion: the `missedReveal` row (240ms, 60ms stagger, `easeOut`).
    - The mobile repo transcribes both later.
  - **`context/docs/data-display-requirements.md` § 1:** the missed `imageUrl` row says the slot shows after the player reveals.
  - **`context/docs/contract.md`:** `SoloSummary.missed` notes that the web shows it only after the player reveals.

## Layout

Pro, before and after (rail, lg):

```text
┌ Run over ─────────────── ▪ ▪ ▫ ┐      ┌ Run over ─────────────── ▪ ▪ ▫ ┐
│ You named 4 of 11.             │      │ You named 4 of 11.             │
└────────────────────────────────┘      └────────────────────────────────┘
Named in order                          Named in order
┌ 1  Petr Čech             2.1s ┐       ┌ 1  Petr Čech             2.1s ┐
  …                                       …
[     Reveal the full XI     ]          Showing the 7 you missed.
[         Play again         ]          [         Play again         ]
         Change filters                          Change filters
```

Free:

```text
[     Reveal the full XI     ]   ← locked, fg-muted
Pro shows every player you missed.
[         Play again         ]
```

## Out of Scope

- **Duels** (user, 2026-11-06: solo only for now). `DuelResult` has no `missed` list; adding one is a later backend and web pair.
- **A Pro purchase or upgrade link** from the locked button. Monetization is deferred (`monetization.md` § Sequencing).
- **Real-mode Pro.** The backend writes every user as `free` (`toContractUser`), so real mode always shows the locked button. A `users.tier` column is a later backend request, at the Pro phase.
- A "Missed" list in the rail, or tapping single slots to reveal them one by one.
- Hiding the revealed players again.

## Open Questions

Defaults stand unless changed at load:

- **The mock tier switch** as an env var (`NEXT_PUBLIC_MOCK_TIER`) rather than a dev query parameter.
- **The locked caption's wording:** "Pro shows every player you missed."

## Notes

- **Deviations recorded during implementation:**
  - **The control is its own component,** `MissedReveal` in `src/components/game/`, placed by `RunSummary`. The locked state has its own class (`LOCKED_BUTTON`), not a `SECONDARY_BUTTON` variant, so no hover or disabled styles fight it.
  - **The "Showing the N you missed." line keeps the button's 40px height,** so the actions don't move when it replaces the button.
  - **The mock tier switch is a `MockApiOptions.tier` option,** set from `MOCK_TIER` in `src/lib/api/config.ts`. All three mock sign-in paths (guest, sign in, sign up) use it. `.env.example` documents `NEXT_PUBLIC_MOCK_TIER`, commented out.
  - **`/dev/canvas` reveals locally.** `CanvasStatePreview` flips the snapshot's `isMissedRevealed`, since a snapshot has no run to dispatch to.
  - **The canvas's `missed` comes from `missedOnPitch(end)`** in `src/lib/summary.ts`, so the "follows the flag" check is a pure test there, not in the reducer suite.
- **Source:** user request (2026-11-06): "At the end of the solo game, there should be an option to reveal all … see the complete squad and may find out the missing players."
- **Decisions (user, 2026-11-06):**
  - **Who:** Pro only.
  - **Where:** the rail, under the list.
  - **Shows:** the pitch slots fill.
  - **Duel:** solo only for now.
  - **Free sees:** a locked button with a caption.
  - **Backend:** no change. Mock-only verification until Pro exists.
  - **Motion:** one by one.
  - **After:** one-way.
- **No backend change.**
  - `toSoloSummary` already sends `missed` only to Pro (`lineup-backend/src/solo/solo-views.ts`), resolved from the session, never the client.
  - This matches the Free vs Pro table in `project-overview.md` ("Post-game review: missed count only / Full XI + every player missed"), so that table doesn't change.
- **Hard Constraint 2 holds.** `missed` is sent only after the run is over, when no guess can land, and only to Pro. Hiding it until the click is presentation.
- **Real mode today:** every user is free, so real mode shows only the locked control. The working reveal can be seen on the mock (with the tier switch) and in `/dev/canvas`.
- **Constraints:**
  - Colours come from tokens only.
  - Motion animates transform and opacity only.
  - The tier is never asserted by the client.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, free (default), at 1440, 390 and 360:** the locked button and caption show; clicking does nothing; a perfect clear shows no control.
  - **Mock with `NEXT_PUBLIC_MOCK_TIER=pro`:**
    - The empty slots stay empty until the click.
    - The missed players then appear one by one in squad order.
    - The line replaces the button and takes focus.
    - Play again starts a new run with an empty pitch.
  - **Reduced motion (emulated):** all missed slots appear at once.
  - **Keyboard:** the locked button is reachable and reads its caption. Enter and Space reveal on Pro. Focus lands on the line.
  - **Rail at 1024×700:** the outcome, the control and the actions stay visible; the list scrolls.
  - **Real mode:** the summary shows the locked control.
