# Fix — Landing D: Fold Demo Without the Clock

## Status

Not Started

## Goals

- **The fold's demo loses its countdown ring** (user, 2026-11-10). The band under the pitch keeps only the guess input and its toast.
  - **The input is centred** in the band, at most `max-w-sm` wide from `sm`, and full width on phones. The "Not in this XI" toast stays directly above it, also centred.
  - **The frame is rebalanced** now that the ring's 144–192px is gone: the pitch grows from `h-72 sm:h-80` to `h-80 sm:h-96`, so on wide screens the frame stays about as tall as the fold's text column. The skeleton and the still frame keep the same height as the demo (`design.md` § Every wait has a known shape).
  - The reduced-motion still frame and the loading skeleton follow the same layout: no ring, the input centred.
- **The ring's driving code goes with it.** Nothing in the demo needs a round any more:
  - `DemoFrame.roundStartMs`, `longestRoundMs` and their tests are removed from `src/lib/landing-demo.ts`;
  - `useDemoPlayback` drops `round`, `ringMode`, `clockAtZero` and `isTicking`, and keeps the frame loop, pause, in-view and tab-visibility logic;
  - `ShowcaseFrame` stops importing `CountdownRing` and `UNSTARTED_ROUND`. `CountdownRing` itself is unchanged; the game still uses it.
- **Three more players are found:** Ramos, Navas and Marcelo, after Kroos, in that order.
  - **Real data needs backend R8** (`context/docs/backend-requests.md` § R8): the showcase constant gains `sergio-ramos`, `keylor-navas` and `marcelo`. No contract change, since `demo.reveals` already allows 1–11 slots.
  - **The mock mirrors it:** `MOCK_SHOWCASE.reveals` gains three more Northgate players (the goalkeeper and two defenders: `pl-matthias-kuhn`, `pl-ibrahim-sarr`, `pl-alfie-barraclough`), so the mock plays 8 reveals too.
  - **The web needs no other change for it:** the timeline plays whatever `demo.reveals` holds, and the screen-reader sentence counts them ("eight of Real Madrid's starting eleven").
  - **The loop grows** to about 35.5s: 8 reveals of 3.5s, the 3.03s miss after the second, the start, the hold and the fade. The miss stays after the second reveal.
- **Tests:**
  - `landing-demo.test.ts`: the step order with 8 reveals (miss after the second); the frame no longer carries a round; the `sameFrame` field guard updated.
  - `overview.test.ts`: the mock showcase reveals the 8 players in order, and its miss is still from the other XI.
  - `landing.test.ts`: the sentence reads "eight of Northgate United's starting eleven".
- **Checks:**
  - `/dev/landing?state=ready`, `still`, `demo-paused`, `loading` and `&at=` frames: no ring, input centred, frame height unchanged between still, demo and skeleton (measure it).
  - 320, 375, 768, 1024 and 1440px: no sideways scroll; the suggestion row above the centred input stays inside the frame.
  - **Real data, after R8 is live on ingest:** the demo reveals Bale, Cristiano Ronaldo, (Messi miss), Benzema, Modrić, Kroos, Ramos, Navas and Marcelo, with photos. Ask the user to switch the backend to ingest; never switch it yourself.
- **Docs:**
  - `context/theme.md` § Landing demo: the ring rows go (no ring in the demo; reduced motion is the still frame without one).
  - `context/docs/landing-page-improvements.md` § 4: no ring, 8 reveals, the new loop length.
  - `context/docs/backend-requests.md` § R8: the web's check, once done.

## Layout

```text
Before                                After
┌───────────────────────────┐         ┌───────────────────────────┐
│ RMA 2–3 BAR · LaLiga  5/11│         │ RMA 2–3 BAR · LaLiga  8/11│
│                           │         │                           │
│   pitch (h-80)            │         │   pitch (h-96)            │
│                           │         │                           │
├───────────────────────────┤         │                           │
│ ( 15 )   GUESS A PLAYER   │         ├───────────────────────────┤
│  ring    [ Name a player ]│         │      Not in this XI       │
└───────────────────────────┘         │    [ Name a player… ]     │
 Real Madrid's XI…   PAUSE            └───────────────────────────┘
                                       Real Madrid's XI…   PAUSE
```

## Out of Scope

- The game's own countdown ring (`CountdownRing`, the solo and duel rails): unchanged.
- Sections 2–6: Landing E.
- Any other change to the demo's script (what's typed, the miss, the hold).

## Open Questions

Defaults stand unless changed at load:

- **Reveal order:** Ramos, Navas, Marcelo after Kroos, as the user listed them.
- **The input's width:** `max-w-sm` (384px) from `sm`.

## Notes

- **Source:** user request (2026-11-10): "Remove the clock, center the input, adjust the demo accordingly. Add 3 more players to be found: Ramos, Navas, Marcelo."
- **Order:** backend R8 first (a one-line constant change), then Landing D, then Landing E. D can be built on the mock before R8; its real-data check waits for R8.
- **Slots in the showcase XI** (ingest, checked 2026-11-10): Keylor Navas 0 (GK), Sergio Ramos 2 (DF), Marcelo 4 (DF).
