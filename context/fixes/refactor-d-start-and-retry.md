# Fix — Refactor D: Start Navigation and Retry Notice

## Status

Completed

## Goals

Phase 2 of `context/docs/code-cleanup-guide.md`, batch refactor-d. Items approved by the user on 2026-11-18 (refactor-scanner report, items 4 and 5). **Same DOM, copy, classes, focus and flow.**

- **4a. One "guest first, then go" hook:** `src/hooks/use-start-navigation.ts` exports `useStartNavigation()`, returning `{ go(href): Promise<boolean>, isBusy, error }` (`true` once navigation starts, `false` when the session call failed).
  - `src/hooks/use-room-entry.ts` is **deleted**; `CreateRoom` and `JoinRoom` call `go(withQuery('/play/duel', …))`.
  - `components/play/PlayStart.tsx` and `components/archive/ArchiveScreen.tsx` (both places) use it, keeping their own clean-up on `false` (`setWarning(null)`; `setPicked(null)` and `setWarnedMatch(null)`).
- **4b. One start error line:** `src/components/play/StartError.tsx` renders today's `<p role="alert" className="text-14 text-danger-text">{authErrorMessageOf(error)}</p>`, or nothing without an error. `CreateRoom`, `JoinRoom` and `PlayStart` use it; each keeps its own show condition (for example `error && !isBusy`) unless it's identical everywhere.
- **5. One retry notice:** `src/components/shell/RetryNotice.tsx` wraps `StateNotice` with `tone="error"`, `icon={TriangleAlert}` and the `SECONDARY_BUTTON` "Try again" button; props `message`, `onRetry`, optional `title` and `titleLevel`.
  - Used by `play/FiltersStep.tsx`, `auth/AuthPanel.tsx`, `pro/ProScreen.tsx`, `profile/ProfileNotice.tsx` and `archive/ArchiveView.tsx`.
  - `profile/HistoryMore.tsx` keeps its compact variant.

## Out of Scope

- `ArchiveScreen`'s derived error message, if it isn't the same element. Any copy or class change.

## Notes

- **Source:** `refactor-scanner` report, step 2.1 of the guide.
- **Constraints:** new components follow the component template in `coding-standards-web.md` (`import React`, `type Props`, arrow const, default export); `@/` imports; comments at most 75 characters.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - B5 on `/play` (all three steps, the join row), `/archive`, `/sign-in`, `/pro` and `/profile`, including each page's error state where a `?state=` or mock scenario reaches it;
  - by hand in mock mode: Start a solo run, Create a room, Join by code and Play from the archive each make a guest and navigate; a forced auth error shows the same line.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.

- **Deviations recorded during implementation:**
  - **4a, `ArchiveScreen`:** it has one `start` function, not two places; the scanner counted its setup lines and that function. Its error stays a derived string passed to `ArchiveView` (out of scope).
  - **4b:** the show condition was `error && !isBusy` at all three sites, so it moved into `StartError` (`isBusy` prop), as the goal allows when identical.
  - **New files follow the template:** `StartError` and `RetryNotice` are the first components with `import React`, `type Props`, an arrow const and a default export. `useStartNavigation` is a hook, so it keeps a named export.
  - **B5 reach:** the filters, sign-in and `/pro` error notices have no `?state=` or mock scenario, so B5 covered `RetryNotice` through `archive?state=error` (no title) and `profile?state=error` (with title). The hand checks ran through the app (guest first, then clicks), as a fresh load locks Create room and `archive?state=open` is a static snapshot.
  - **Review fixes:** one `react` import in `RetryNotice`; `ArchiveScreen`'s comment that repeated the hook's removed; `RetryNotice`'s import in `ArchiveView` moved beside the other components.
