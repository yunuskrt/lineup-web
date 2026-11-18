# Fix — Refactor C: Shared Guess Feedback

## Status

Completed

## Goals

Phase 2 of `context/docs/code-cleanup-guide.md`, batch refactor-c. Item approved by the user on 2026-11-18 (refactor-scanner report, item 1). **Solo and duel apply a guess's feedback through one function; reducer output is unchanged.**

- `src/lib/feedback.ts` (it already owns `guessFeedback`) exports:
  - `withToast(state, message)`: bumps `toast.id` and sets the message, generic over any state with a `toast` field;
  - `applyFeedback(state, feedback)`: the toast, the `shakeKey` bump and the `pulse` key bump, in today's order.
- `src/lib/solo-run.ts` and `src/lib/duel-session.ts` drop their local `withToast` and their copied feedback block, and call these. The duel's `clearKey` bump stays in its `resolveGuess`.
- The other `withToast` calls (`solo-run.ts` on an auth error, `duel-session.ts` on a failure) use the shared one.

## Out of Scope

- Any change to which feedback a verdict gives (`guessFeedback` stays as is). The hooks.

## Notes

- **Source:** `refactor-scanner` report, step 2.1 of the guide. Why it matters: `theme.md` says solo and duel give the two no-penalty verdicts identically, on the same two channels.
- **Constraints:** no `any`; the generic types keep each reducer's state type.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - `solo-run.test.ts` and `duel-session.test.ts` pass unchanged; new `feedback.test.ts` cases for `withToast` and `applyFeedback` (toast only, shake only, pulse only, none);
  - B5: `?state=already-found` and `?state=not-in-xi` on `/play/solo` and `/play/duel` (frozen-clock rule).
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **Pulse key (review):** `applyFeedback` counts the pulse on from `next`, like the shake, so every step builds on the one before.
  - **Tests:** seven new cases in `feedback.test.ts`, two of them the real two-channel verdicts (not in XI: toast and shake; already named: toast and pulse); `solo-run.test.ts` and `duel-session.test.ts` are unchanged and pass. `ToastState` and `FeedbackState` live in `src/types/feedback.ts` (review), and the fixture uses `FeedbackState` from there.
  - **Comment (review):** it says each step builds on the one before, not that the order matters.
  - **Follow-ups, not this batch (review):**
    - solo clears its input through `use-solo-run.ts` calling `guessFeedback` again and `SoloGame` clearing it; duel uses the reducer's `clearKey`. A `clearKey` in `applyFeedback` would end the split (hooks were out of scope).
    - `/dev/feedback` (`FeedbackPreview`) and `/dev/guess` (`GuessPreview`) still map feedback with their own code instead of `applyFeedback`.
    - `FeedbackState`'s three fields are still declared by hand in `types/solo-run.ts`, `types/duel-session.ts` and `types/canvas.ts`; those state types could be built from it.
