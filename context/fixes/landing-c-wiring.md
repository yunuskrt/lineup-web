# Fix — Landing C: Real Overview

## Status

Not Started

## Goals

- **`/` reads the real `GET /catalog/overview`.**
  - **Needs:** backend R7 on `main`, its Built note in `context/docs/backend-requests.md` § R7, and Landing A and B merged.
- **Transcribe what the backend built.**
  - Read R7's Built note and the backend's `context/api-contract.md`.
  - Check A's schemas against them: every field name, the 12-club cap, the 11 players, the reveals and the miss.
  - Change anything that differs, and record it as a deviation.
- **Real-mode checks** (3000 against 8080), against the Built note's numbers:
  - **Archive:** every count matches the Built note. Matches should be one less than the dataset's 1,925, because the showcase is excluded.
  - **Inside:** the competitions, the `topClubs` order and the highlights match it.
  - **Showcase:** "Real Madrid's XI, 23 April 2017", with Real Madrid 2–3 Barcelona in the header and Real Madrid's crest ringed.
    - The demo reveals Bale, Cristiano Ronaldo, Benzema, Modrić and Kroos in that order, with their photos.
    - "Mes" shows Lionel Messi and gets "Not in this XI".
  - **The match is out of the pool:** filter solo to La Liga 2016-17 with Real Madrid, and start several runs. The showcase match never comes up. (The backend's test is the real guarantee; this is a sanity check.)
  - **Failure:** with the backend stopped, `/` shows the fold, rules and modes, and no archive, inside or showcase. Start it again and reload: everything returns.
- **Responsive and performance check on real data:**
  - 320, 375, 768, 1024 and 1440px: no sideways scroll; the real competition names and the 12 crests wrap cleanly.
  - The LCP element is the `<h1>` (Chrome DevTools, Performance panel).
  - The reduced-motion still frame shows the 5 Real Madrid players.
- **Docs:**
  - `context/docs/backend-requests.md`: R7 marked Done in the table, with anything the real-mode check finds under its Built note.
  - `context/docs/contract.md`: matches what was built.

## Out of Scope

- Anything in A's or B's UI, unless the real data shows a problem. Record it as a deviation, or open a fix.
- Mobile's home.

## Open Questions

Defaults stand unless changed at load:

- **None yet.** Anything R7's Built note changes from the request is decided at load.

## Notes

- **Source:** the split decided on 2026-11-09. A and B build on the mock; C wires them once backend R7 exists.
- **Order:** last. Landing A → Landing B → backend R7 → Landing C.
