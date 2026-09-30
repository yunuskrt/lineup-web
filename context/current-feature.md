# Current Feature

<!-- Feature Name -->

## Status

<!-- Not Started|In Progress|Completed -->

Not Started

## Goals

<!-- Goals & requirements -->

## Notes

<!-- Any extra notes -->

## History

<!-- Keep this updated. Earliest to latest -->

- W01 Repo & Scaffold: prettier, cleared CNA boilerplate.
- W02a Design Tokens: tokens.css primitives, motion.ts constants.
- W02b Domain Types & Schemas: zod schemas, z.infer types.
- W03 Theme Setup: role layer, Tailwind @theme, Inter + Archivo.
- W04 Theme Preview Route: /dev/theme palette, type, spacing, radius.
- W05a REST Contract: result envelope, schemas, ApiClient interface.
- W05b Duel Contract: duel schemas, event map, DuelClient interface.
- W06a Mock Engine: vitest, normalize, matcher, clock, rules core.
- W06b Mock REST Adapter: store, ApiClient impl, env-flag registry.
- W06c Mock Duel Adapter: emitter, scripted opponent, scenarios.
- W07a Fixture Dataset: fictional XIs, schemas, loader, pool selector.
- W07b Adapters on Fixtures: solo and duel mocks on dataset, seed removed.
- W08 App Shell & Layout: route groups, nav, footers, no-chrome game frame.
- W09 Pitch & Squad Grid: SVG pitch, formation layout, 11-slot grid.
- W10 Countdown Ring: pure timing helpers, linear SVG ring, /dev/ring.
- W11 Lives & Turn Indicator: shirt pips, red flash, turn pair, /dev/lives.
- W12 Reveal Card: initials badge, spring-in, turf flash, /dev/reveal.
- W13 Guess Input: live/pending/locked, shake, inline spinner, /dev/guess.
- W14 Feedback Channels: grid pulse, verdict mapping, toast, /dev/feedback.
- W15 Skeletons & Overlays: skeleton grid, canvas gate, /dev/loading.
- W16 Game Canvas Shell: canvas + rail, match header, ?state= snapshots.
- W17 Home Page: statement fold, rules strip, footer line, /sign-in stub.
- W18a Session Layer: TanStack Query, auth hooks, unwrap, mock rejections.
- W18b Auth Screens: /sign-in forms, guest and upgrade, nav account.
- W19 Mode & Filter Screen: /play diptych, URL filters, guest on start.
- W20 Solo Loop (Mock): side-pick gate, 15s loop, sync at 0, quit dialog.
- W21a Summary Panel: rail summary, turf takeover, missed slots, snapshots.
- W21b Summary Wiring: summary fetch, quit to summary, play again, focus.
- W22a Lobby Panels: lobby gate steps, filter cards, coin flip, snapshots.
- W22b Lobby Wiring: lobby reducer, queue hook, flip beat, match handoff.
- W23a Duel Result Panel: result card, tally, reconnect badge, snapshots.
- W23b Duel Loop Wiring: turns, guesses, forfeit dialog, result, replay.
- W24a Profile Panels: record, stats, history rows, guest strip, snapshots.
- W24b Profile Wiring: shared mock store, profile hooks, paging, upgrade.
- W25a Empty Pool & Rate Limit: widen gate, cooldown input, ?scenario=.
- W25b Connection States: reconnect gate, disconnected result, update page.
- W26a Reduced Motion: motion policy, useMotionPolicy, kill-switch guard.
