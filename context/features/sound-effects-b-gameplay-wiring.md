# Sound Effects B — Gameplay Wiring

## Status

Not Started

## Goals

- `src/lib/sound-cues.ts`, pure and unit tested:
  - `soundCuesFor(prev, next)` takes two `CanvasView`s and returns the cues that change caused. Cues come only from state the server has already sent:

    | Change from `prev` to `next`                                | Cue             |
    | ----------------------------------------------------------- | --------------- |
    | `found` grows by one, no `foundBy` or `foundBy: 'you'`      | `correctNew`    |
    | `found` grows by one, `foundBy: 'opponent'`                 | `theirReveal`   |
    | `shakeKey` rises                                            | `notInXi`       |
    | `pulse.key` changes                                         | `alreadyNamed`  |
    | `lifeLostKey` rises                                         | `lifeLost`      |
    | Duel: `opponent.lives` falls                                | `theirLifeLost` |
    | Duel: `turn` goes from `opponent` to `you`                  | `turnToYou`     |
    | Duel: `lobby.step` goes from `searching` to `paired`        | `opponentFound` |
    | Duel: `end` arrives, `win` or `forfeit_win`                 | `resultWin`     |
    | Duel: `end` arrives, `draw`                                 | `resultDraw`    |
    | Duel: `end` arrives, `loss`, or `endReason: connectionLost` | `resultLoss`    |
    | Solo: summary arrives, `perfect_clear`                      | `perfectClear`  |
    | Solo: summary arrives, `lives_out`                          | `runOver`       |

  - Silent cases, each with a test:
    - `found` jumping by more than one. That's a resume snapshot (W31a `matchReady`), not a reveal.
    - A solo `quit`: the player chose to leave.
    - The ended-away gate (W31b): the player wasn't there.
    - A match switch: `match` going from one match to another.
- `clockCueFor(seconds, owner)`, pure and unit tested:

  | Seconds shown | Your turn / solo        | Opponent's turn      |
  | ------------- | ----------------------- | -------------------- |
  | 15            | —                       | —                    |
  | 14 → 6        | `tick`                  | `tick` at half gain  |
  | 5 → 1         | `finalBeep` for that second | `tick` at half gain |
  | 0             | —                       | —                    |

  - Nothing plays at 0 on the clock. `lifeLost` comes only from the server's life-lost event, because a guess inside the 400ms grace window can still land after the ring reaches 0.
- `useGameSounds(view)` in `src/hooks/use-game-sounds.ts`, called once in `GameCanvas` for both modes:
  - It keeps the previous view in a ref and plays `soundCuesFor(prev, view)`. The first view after mount is only recorded, so a reload or resume never chimes.
  - The clock follows exactly what `CountdownRing` shows: the same server clock and `displaySeconds`, on the same tick. It plays when the shown second changes, the ring is running and `isFrozen` is false.
    - A skipped second (a throttled background tab) plays only the current one, never a burst.
    - Mounting mid-round starts from the current second.
  - Spacing: `turnToYou` and the result stings wait 300ms after any other cue from the same change. That lets the last reveal or whistle land first, e.g. the 11th name then the draw sting. Event cues play at once.
- Mock mode needs no changes. The scripted mock opponent drives the same views, so every cue can be heard without the backend.

## Out of Scope

- Engine, cue sounds, mute toggle, `theme.md` section, `/dev/sound` → Sound Effects A.
- Sounds outside `/play/solo` and `/play/duel`, such as the home page, `/play` and profile.
- Sounds for the rate-limit gate, the reconnect overlay, the opponent reconnecting chip, or protocol refused. Those states are visual only.
- Any change to reducers, events or the socket client. Cues read the views that exist today.

## Open Questions

Defaults stand unless changed at load:

- **`turnToYou` on the first turn.** Default: no, it plays only on a handover from the opponent. The first turn has no handover, and a resume would play it falsely.
- **Ticks under a gate.** Default: they follow the ring. If the ring is sweeping behind the reconnecting overlay ("your clock shown still running", `theme.md` § System), it ticks. With no round, it's silent.
- **`opponentFound` in a background tab.** Default: it plays. That's its main use. No browser notification.

## Notes

- Scope: firing the Sound Effects A cues from solo and duel state.
- Depends on:
  - Sound Effects A: engine, `useSound`, `SOUND_CUES`.
  - W20–W23 and W29–W31: the loops and views it reads.
- Constraints:
  - **No game logic.** Every cue is a reaction to a view the server has already shaped. A cue never anticipates a verdict, a life or a turn, and the clock never decides anything: 0 on the ring is silent.
  - The two no-penalty outcomes stay distinct by ear as well as by eye: `alreadyNamed` with the grid pulse, `notInXi` with the input shake (`theme.md` § States).
  - Muted means silent everywhere. `useSound().play` is the only path to the speaker.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- Verification:
  - `npm test`: `soundCuesFor` covers every row and every silent case; `clockCueFor` covers both owners at 15, 14, 6, 5, 3, 1 and 0.
  - In the browser, mock mode:
    - Solo: a correct name, a miss, an already-named, ticks to 6, beeps 5 → 1, a lost life, then a run over. A second run ends in a perfect clear.
    - Duel: pairing chime, the opponent's reveal and the turn-to-you, the opponent's ticks quieter with no beeps, their life lost, each result.
    - Mute mid-round: silence at once; unmute resumes on the next second.
  - Real mode, two browsers: a reload mid-duel resumes without a chime burst, and the result sting plays once on each side.
  - `npm run build`.
