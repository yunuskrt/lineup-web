# Sound Effects A — Cue Engine

## Status

Completed

## Goals

- A **Sound** section in `context/theme.md`, after § Motion. It's the canonical cue table (below), so the mobile app can transcribe the same sounds. It names the design rule: every cue doubles a visual cue that already exists, and the game stays fully playable muted.
- `src/styles/sound.ts`: the cue table as data, transcribed from `theme.md`:
  - `SoundCue`: one name per cue (see Cues).
  - `SOUND_CUES: Record<SoundCue, CueSpec>`. Each entry gives the notes or noise layers (wave, frequency, start and length in ms), the attack and decay envelope, and the gain. These are the only sound values in the repo, the way `tokens.css` is for hex values.
  - `finalBeepFor(seconds)`: returns the beep for 5 → 1. Pitch rises one step a second, and gain rises from 3 s on (`CRITICAL_SECONDS`).
- `src/lib/sound/`: the engine, synthesized with Web Audio. No audio files, no licence risk, nothing to load:
  - One lazily created `AudioContext` with a master gain node. `play(cue, options?)` takes an optional gain scale, which is how the opponent's quieter cues are made.
  - An unlock step that calls `resume()` on the first `pointerdown` or `keydown`. Browsers allow audio only after a gesture. Until then, `play` does nothing and nothing is queued.
  - It never throws. A missing `AudioContext` (old browser, test env) makes every call a no-op.
  - Cue rendering is a pure function from `CueSpec` to scheduled nodes, unit tested with a fake context.
- Mute state:
  - Sound is **on by default**.
  - The player's choice is kept in `localStorage` under `lineup.sound`. Every read and write is wrapped in try/catch, so blocked storage falls back to on.
  - It's read only after mount, so server markup always matches.
  - `useSound()` in `src/hooks/use-sound.ts` returns `{ isMuted, toggleMuted, play }`, and `play` respects mute.
- `SoundToggle`, `src/components/game/SoundToggle.tsx`:
  - A 32 px icon button in the rail with an inline SVG speaker, and a slashed speaker when muted. No icon library.
  - It's `aria-pressed`, with the label "Mute sounds" or "Unmute sounds".
  - It uses the existing focus ring and tokens only.
  - It's placed in the rail, away from the guess input, and shown in every canvas state, including the lobby, result and summary.
- `context/design.md` § Game routes carry no chrome: it allows the sound toggle as the second persistent control, next to quit.
- `/dev/sound`: a preview route, like `/dev/ring`. It has one button per cue, a "Final 5" button that plays 5 → 1 one second apart, and the toggle. It's the only way to hear every cue without playing.

## Cues

From the approved "Floodlight" set. Lengths are the audible length, and gains are relative to the master gain of 1.

| Cue              | Event                              | Sound                                                     | Length  | Gain   |
| ---------------- | ---------------------------------- | --------------------------------------------------------- | ------- | ------ |
| `correctNew`     | You name a new player              | Bright two-note rising chime, E5 → B5                      | ~250ms  | 0.5    |
| `theirReveal`    | Opponent names a new player        | The same chime an octave lower, E4 → B4                    | ~250ms  | 0.35   |
| `notInXi`        | Name isn't in the XI               | Soft, low, falling "thunk", 220 → 140 Hz                   | ~150ms  | 0.35   |
| `alreadyNamed`   | Name is already in the found pool  | Neutral soft blip, ~520 Hz                                 | ~90ms   | 0.25   |
| `tick`           | Each second, 14 → 6                | Quiet woody tick                                           | ~30ms   | 0.15   |
| `finalBeep`      | Each second, 5 → 1                 | Sharp beep, A5 B5 C6 D6 E6; louder from 3 s                | ~80ms   | 0.3 → 0.45 |
| `lifeLost`       | You lose a life                    | Short referee whistle: high tone, fast vibrato, breath noise | ~450ms | 0.4    |
| `theirLifeLost`  | Opponent loses a life              | The same whistle, shorter and quieter                      | ~300ms  | 0.25   |
| `turnToYou`      | The turn passes to you             | Soft whoosh, band-passed noise sweeping up                 | ~240ms  | 0.2    |
| `opponentFound`  | Matchmaking pairs you              | Two quick rising notes, G5 → D6                            | ~300ms  | 0.4    |
| `resultWin`      | Duel win or forfeit win            | Rising major arpeggio, C5 E5 G5 C6                         | ~700ms  | 0.45   |
| `resultDraw`     | Duel draw                          | Two notes together, G4 + D5, neither resolving             | ~600ms  | 0.4    |
| `resultLoss`     | Duel loss, connection lost         | Falling minor phrase, C5 A4 F4, softer                     | ~700ms  | 0.35   |
| `perfectClear`   | Solo: all 11 named                 | The win arpeggio with a longer shimmering tail             | ~900ms  | 0.45   |
| `runOver`        | Solo: lives at 0                   | The loss phrase                                            | ~700ms  | 0.35   |

- The `lifeLost` length matches the 480ms red flash. `turnToYou` matches the 240ms turn handover in `theme.md` § Motion.
- The opponent's turn plays `tick` at half gain, and never `finalBeep` (wired in B).

## Out of Scope

- When each cue fires, and any change to the solo or duel screens beyond adding the toggle → Sound Effects B.
- A volume slider, or a separate ticks toggle. Mute only; the OS sets the volume.
- Audio files, music or voice.
- Haptics. That's mobile.
- Changing `todo.md`. This feature isn't a todo phase.

## Open Questions

Defaults stand unless changed at load:

- **Toggle position in the rail.** Default: the right end of the clock card's label row, so it's visible in every state and far from the input.
- **Exact timbres.** The table fixes the shape, not the waveform. Default: tune by ear in `/dev/sound`, and record any value that changes in `theme.md` and in this spec.

## Notes

- Scope: the sound engine, the mute state and toggle, the cue table and its `/dev/sound` preview. Nothing plays during a game yet.
- Depends on: W10 (countdown stages), W16 (game canvas and rail), W26a (the policy pattern this mirrors).
- Decisions made at spec time (asked in English and Turkish):
  - Set: "Floodlight", approved over "Subtle" and "Stadium".
  - Source: synthesized with Web Audio. Chosen over CC0 files, for the same reason the pitch is drawn in SVG.
  - Opponent's turn: quieter ticks, no final beeps.
  - Extras included: the already-named blip, result stings, the opponent-found cue and the turn-to-you cue.
  - Default on, mute toggle only, recorded in `theme.md`.
- Constraints:
  - **Sound is presentation, never logic.** No cue decides anything, and no cue fires from a client-side guess at the outcome. Nothing lives here that wiring could mistake for game state.
  - Never the only channel. Every cue pairs with a visual cue that `theme.md` § States already specifies.
  - Reduced motion does not affect sound. Motion and sound are separate preferences.
  - Tokens only for the toggle, `@/` imports, no `any`, single-line comments of at most 50 characters.
- Verification:
  - `npm test`: cue rendering with a fake context, the mute store's storage fallbacks, and `finalBeepFor` for 5 → 1.
  - In the browser at 1440 and 390:
    - `/dev/sound`: every cue plays; mute silences them; the choice survives a reload.
    - Before any click, nothing plays and the console stays clean.
    - The toggle is visible and reachable by keyboard on `/play/solo` and `/play/duel` in each state.
  - `npm run build`.
- **Deviations recorded during implementation**
  - The toggle sits **beside Quit**, not in the clock card's label row (user's choice at start). The label row is under the gate in the lobby and replaced on the result and summary, so it couldn't be in every state. From `sm` it's left of Quit in the top row; on phones it's stacked under Quit in the header corner, so the header loses no width.
  - The toggle is 28px from `sm` (Quit's height) and 24px on phones, not 32px. That keeps the controls row one height. 24px still meets WCAG 2.5.8, and the phone stack fits the 56px overlay.
  - It has a fixed label "Mute sounds" with `aria-pressed`, rather than a label that flips. Flipping both would read "Unmute sounds, pressed", a double negative.
  - `AudioContext` is created inside the first gesture, not lazily on the first `play`. Creating it earlier logs Chrome's autoplay warning. The unlock listeners stay for good, since Safari can suspend the context again.
  - `useSound().play` takes a cue name or a `CueSpec`, so `finalBeepFor(seconds)` beeps play through the same muted path.
  - Timbres as built, in `src/styles/sound.ts`:
    - chimes and phrases: triangle waves
    - `tick`: a 1000 Hz sine plus a band-passed noise click
    - `finalBeep`: a sine plus a square at 0.15 layer gain
    - whistle: 2900 Hz with ±120 Hz vibrato at 28 Hz, plus band-passed noise at 3000 Hz
    - `perfectClear`'s shimmer: an E6 sine with slow vibrato
    - They're not yet tuned by ear; tune them in `/dev/sound`.
  - `design.md`'s route table now reads "quit and sound chips only" for the game routes, beside the § Game routes carry no chrome change.
  - Review fixes:
    - **`/play` also installs the unlock listener** (`useSoundUnlock()` in `PlayScreen`). The duel lobby queues on mount, so the Start click on `/play` was the only gesture before a pairing. Without this, `opponentFound` would play silently. Checked in the browser: no context before the click, and it's running in the lobby with no click there.
    - `OPPONENT_TICK_GAIN` (0.5) moved from `/dev/sound` into `sound.ts`, so the opponent's half gain is a sound value B can reuse.
    - The phone overlay no longer renders an empty Quit wrapper on the result and summary.
