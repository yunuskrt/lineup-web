# Fix — Pro Polish D: The Cap Request, /pro and Leftovers

## Status

Completed

## Goals

The cap gate's request, `/pro`, URL leftovers and nickname search, from the Pro browser review (2026-11-12, items 14, 15, 18, 20 and 7). Web, plus an optional backend request (R15) for item 7.

- **14. `/pro` with the switch off is a real 404.** Today it shows the not-found page but answers HTTP 200.
  - `src/app/(site)/(pages)/pro/page.tsx` reads the switch on the server before rendering: real mode `GET {NEXT_PUBLIC_API_URL}/config` (revalidated every 5 minutes, the backend's own `max-age`), mock mode `MOCK_PRO_ENABLED`. If the switch is off, it calls `notFound()`, so the response is 404.
  - If the backend can't be reached, the page renders as today and the client keeps its error state with Try again. A failed fetch is never a 404.
  - `ProScreen`'s client check stays as a fallback.
- **15. Drop leftover URL parameters.**
  - Leaving a room (Cancel, Back to play) lands on `/play` with `room` removed, keeping the filters and `mode=duel`.
  - "Play a duel" from the solo cap gate and summary opens `/play/duel` without `mode=duel`. The path already says duel; `mode` is a `/play` setting.
  - `DuelGame` (`goTo`, `backToFilters`, the `ProtocolRefused` back link) and `SoloGame` (`playDuel`). A small pure helper strips the parameter so it can be tested.
- **18. `/pro`'s checkout line.** "Checkout comes with payments." reads like a note to developers.
  - It becomes "Pro isn't on sale yet." (`GetProButton`). Get Pro stays disabled until payments.
- **20. No refused start at the cap.** Opening `/play/solo` at the cap sends a start that the server refuses (403 in the console).
  - For a plain timed run (no `match`, no `practice`), `useSoloRun` asks `GET /solo/allowance` first. If it shows the cap, the run goes straight to the cap gate without a start request, with the cap line from that allowance.
  - Picked and practice runs still go straight to the start: for Free the server's `pro_required` answer wins over the cap (R13, R14), and that gate must stay.
  - The server stays authoritative: if the allowance says there are runs left, the start goes ahead, and a `daily_cap` refusal is still handled as today.
- **7. Nickname search off.** The archive promises nickname search, but no match on ingest has a nickname, so "istanbul" finds nothing.
  - **Web:** the total line becomes "{total} matches. Search by club, competition or season." (`archiveTotalLine`), and the mock's search words drop the nickname (`archiveWords` in `src/lib/api/mock/archive.ts`). Rows still show a nickname when one exists.
  - **Backend (R15, optional, any order):** the archive search stops matching the nickname, so a nickname never produces a hit the copy no longer promises. See `context/docs/backend-requests.md` § R15. The web part doesn't wait for it. **Done** (2026-11-13, backend `cad41b7`).

## Notes

- **Source:** the Pro browser review (2026-11-12), items 7, 14, 15, 18 and 20. Item 9 (the disabled Start's style at the cap) was not chosen.
- **Order:** any; independent of A, B and C. R15 can be asked and built at any time.
- **Hard constraints:** 1 and 16 (the server decides the cap and the tier; the allowance only spares a request the server would refuse).
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; secrets stay server-side (the `/pro` check uses the public `NEXT_PUBLIC_API_URL`).
- **Tests (pure):** the parameter-stripping helper; `archiveTotalLine`'s new copy; the mock search no longer matching a nickname ("mudbath" → 0); the cap-first decision ("a plain run, capped: no start", "picked or practice: start anyway"), extracted as a pure helper.
- **Docs:**
  - `context/docs/contract.md`: the search rule without the nickname. Done with R15 (2026-11-13).
  - `context/design.md` § Page shape, `/archive` row: the new total line.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Live, Free (switch on), at the cap:** `/play/solo` shows the cap gate with no 403 in the console (the network tab shows only `GET /solo/allowance`); Play a duel opens `/play/duel` with no `mode`.
  - **Live, rooms:** Cancel in a waiting room lands on `/play` with no `room` parameter.
  - **Live, switch off:** `curl -I http://localhost:3000/pro` answers 404. Switch on: `/pro` answers 200 with the table, and "Pro isn't on sale yet."
  - `/archive`: the new total line; after R15, a nickname search finds nothing on any database.

**Deviations recorded during implementation**

- 14: the check is `isProSwitchOff()` in `src/lib/api/pro-switch.ts`, with the body read by a pure `isSwitchOffIn()` (tested). The build lists `/pro` with a 5-minute revalidate.
- 14, found live: after a switch flip, the first `/pro` request can still get the cached answer (Next serves it once while it refetches), then 404 holds. `ProScreen`'s client check covers that one stale render.
- 15: a refused join keeps `room`, so `/play` shows the code again (`theme.md` § Lobby, "Join refused": "the code kept in the box"). `keepsJoinCode(state)` in `duel-session.ts` decides; every other exit drops `room`.
- 15: one helper, `withoutParams(params, names)` in `filters.ts`. `SoloGame`'s Play a duel drops `match`, `practice` and `mode` with it, replacing the `withPractice`/`withMode` chain.
- 20: the allowance read uses `soloAllowanceQuery`, the same query `useSoloAllowance` runs (fresh, `staleTime: 0`), so the cap gate's line and the check share one request. A failed read lets the start go. The gate is fed a client-built `daily_cap` error (`dailyCapErrorOf`), so the gate, its actions and Retry stay as they are. The decision is `isCappedBeforeStart`.
- 18: JSX needs `&apos;` for "isn't" (lint rule, as elsewhere in the repo).
- Docs: `context/docs/pro-features.md` dropped "or nickname" from the archive line as well.
