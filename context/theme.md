## Lineup — Sound and Screen States

⚽ **What the game sounds like, and how every screen behaves.**

---

## 📌 Scope

This file keeps two things through the UI redesign:

- **§ Sound** is the sound spec, unchanged.
- **§ Rules** and **§ States** are a behaviour reference. They say what each screen does in every condition, and what it says. They do not say what it looks like.

The look is open: colours, type, layout, components, icons and motion come from the new UI design docs. Where a state below names a role ("your colour", "the warning stage", "a correct-answer highlight"), the design decides the value; the behaviour behind it stays.

---

## 🔊 Sound

**Every sound doubles something the player can already see.** A sound is never the only channel: the reveal, the shake, the pulse, the life display and the clock all stand on their own, and the game is fully playable muted. Sound is presentation, like the clock. No cue decides anything, and none fires from a client-side guess at an outcome.

**Synthesized, not recorded.** The sounds are built in code (Web Audio on web): no files, no licence risk, nothing to load. The table below is the spec; each client renders it with its own runtime.

| Cue             | Event                             | Sound                                                        | Length | Gain       |
| --------------- | --------------------------------- | ------------------------------------------------------------ | ------ | ---------- |
| `correctNew`    | You name a new player             | Bright two-note rising chime, E5 → B5                        | 250ms  | 0.5        |
| `theirReveal`   | Opponent names a new player       | The same chime an octave lower, E4 → B4                      | 250ms  | 0.35       |
| `notInXi`       | Name isn't in the XI              | Soft, low, falling "thunk", 220 → 140 Hz                     | 150ms  | 0.35       |
| `alreadyNamed`  | Name is already in the found pool | Neutral soft blip, 520 Hz                                    | 90ms   | 0.25       |
| `tick`          | Each second, 14 → 6               | Quiet woody tick                                             | 30ms   | 0.15       |
| `finalBeep`     | Each second, 5 → 1                | Sharp beep, A5 B5 C6 D6 E6; louder from 3 s                  | 80ms   | 0.3 → 0.45 |
| `lifeLost`      | You lose a life                   | Short referee whistle: high tone, fast vibrato, breath noise | 450ms  | 0.4        |
| `theirLifeLost` | Opponent loses a life             | The same whistle, shorter and quieter                        | 300ms  | 0.25       |
| `turnToYou`     | The turn passes to you            | Soft whoosh, band-passed noise sweeping up                   | 240ms  | 0.2        |
| `opponentFound` | Matchmaking pairs you             | Two quick rising notes, G5 → D6                              | 300ms  | 0.4        |
| `resultWin`     | Duel win or forfeit win           | Rising major arpeggio, C5 E5 G5 C6                           | 700ms  | 0.45       |
| `resultDraw`    | Duel draw                         | Two notes together, G4 + D5, neither resolving               | 600ms  | 0.4        |
| `resultLoss`    | Duel loss, connection lost        | Falling minor phrase, C5 A4 F4, softer                       | 700ms  | 0.35       |
| `perfectClear`  | Solo: all 11 named                | The win arpeggio with a longer shimmering tail               | 900ms  | 0.45       |
| `runOver`       | Solo: lives at 0                  | The loss phrase                                              | 700ms  | 0.35       |

Gains are relative to a master gain of 1. `lifeLost` lands with the life-lost flash, and `turnToYou` with the turn handover.

**Three rules that make the sounds work**

- **Urgency belongs to your own clock.** On the opponent's turn their clock ticks at half gain and never beeps. The final-five beeps are yours alone.
- **The clock never whistles.** Nothing plays when the clock reaches 0. The whistle comes from the server's life-lost event, because a guess inside the grace window can still land.
- **The two no-penalty verdicts sound different**, just as they look different: `alreadyNamed` is a level blip, while `notInXi` falls.

**On by default, one mute toggle**, remembered on the device. There is no volume slider; the OS sets the volume. Reduced motion does not affect sound.

---

## ⚖️ Rules

These hold in any design. They protect fairness and access, not a look.

- **The clock shows time honestly.** It is drawn from the server's timestamp, and its visual progress is linear, never eased. Easing makes the clock disagree with the seconds left, and in a game where the clock costs lives, that is a fairness bug.
- **The clock escalates through three stages, never two:** normal, then warning (7–4s), then critical (3–0s). A middle stage gives the player something to react to.
- **You and your opponent are unmistakable at a glance.** Each has their own identity colour, and the pair is colourblind-safe: never red against green. Colour is never the only cue; position and label say it too.
- **Reduced motion is applied per component, never as a global switch.** It drops decorative motion (the shake, the spring) and never stops the clock, which carries information. A player with reduced motion must still see their time running.
- **The squad always shows all eleven slots.** Unrevealed slots are drawn as empty slots, with their position, so the player always sees how many are left.
- **Whose turn it is is always visible**, named by label as well as colour.
- **In a duel, a found player is marked with the finder's colour.**
- **Every wait has a known shape.** A placeholder takes the exact size of what loads into it, so nothing shifts as the player starts reading.

---

## 🔀 States

The duel screen is almost never at rest. These are the conditions it can actually be in.

**Two rules across every table below.** State is **server-pushed, never client-inferred**: the client renders what the server says it is, including the timer state. And every state must be reachable in dev without playing a real game, through a `?state=` override.

### Duel — your turn

| State         | Trigger                          | Clock                            | Squad grid                                            | Input                                                                                          | Feedback                         |
| ------------- | -------------------------------- | -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------- |
| Idle          | Turn starts                      | Yours, normal stage, running     | Unfound slots drawn empty                             | Focused, live                                                                                  | —                                |
| Suggesting    | 3+ letters typed, matches found  | **keeps running**                | unchanged                                             | Live; up to 5 suggestion rows, then it scrolls; photo + name; already-named rows dimmed        | — (no motion, no sound)          |
| Warning       | 7s left                          | Warning stage                    | unchanged                                             | live                                                                                           | —                                |
| Critical      | 3s left                          | Critical stage, pulsing each second | unchanged                                          | live                                                                                           | —                                |
| Pending       | Guess submitted, awaiting server | **keeps running**                | unchanged                                             | Locked, with a pending indicator inside it                                                     | —                                |
| Correct, new  | Server confirms unfound player   | Stops, then resets on handover   | Slot fills with a correct-answer highlight, then settles | Clears, locks                                                                               | The found-player card appears    |
| Already found | Name is in the found-pool        | **keeps running**                | **The existing slot pulses once**                     | Clears, stays live                                                                             | Toast: "Already named"           |
| Not in XI     | Name isn't in the squad          | **keeps running**                | **unchanged**                                         | Shakes, text stays                                                                             | Toast: "Not in this XI"          |
| Life lost     | Timer hits 0                     | Resets                           | unchanged                                             | Locks                                                                                          | A life empties, life-lost flash  |

> The two no-penalty outcomes must be told apart instantly. **Already-found speaks through the grid; not-in-XI speaks through the input.** Same rules, different channel — without that split, players read both as "the app didn't accept my answer" and assume it's broken.

### Duel — their turn

| State                 | Trigger                     | Behaviour                                                                                                                       |
| --------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Waiting               | Handover                    | The one clock switches to theirs, in the opponent's colour, and the lives display switches to them. Grid read-only, input hidden |
| Their reveal          | Opponent names a new player | The slot fills, marked in the opponent's colour, with the same reveal as yours. You watch the pool shrink — this is the tension |
| Their life lost       | Their timer expires         | Their life empties. No screen flash; it isn't your loss                                                                         |
| Opponent disconnected | Socket drops                | A "Reconnecting, 18s" warning by their lives, and their indicator shows it. **Their clock keeps running** — say so explicitly, or it reads as a freeze |
| Opponent forfeited    | Reconnect window closes     | Straight to result, "Opponent left"                                                                                             |

### Duel — terminal

| State       | Trigger             | Behaviour                                                                                                    |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Win         | Opponent at 0 lives | A win card in your colour, match identity revealed in full                                                   |
| Loss        | You at 0 lives      | A neutral card with a loss accent, same reveal — never hide the answers from the loser                       |
| Draw        | All 11 named        | Both player colours present, neither dominant. Full XI already visible; the card names the match. Rare and should feel like it |
| Forfeit win | Opponent left       | Win card, marked as a forfeit. Doesn't count toward streaks                                                  |

### Solo

| State                     | Trigger            | Behaviour                                                                            |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| Idle / warning / critical | as duel            | Identical. One clock, always yours                                                   |
| Correct, new              | Valid unfound name | Slot fills, **next round starts immediately** — no handover pause                    |
| Already found / not in XI | as duel            | Identical, same two channels                                                         |
| Suggesting                | as duel            | Identical, the same suggestion list                                                  |
| Life lost                 | Timer hits 0       | A life empties, life-lost flash, next round starts                                   |
| Perfect clear             | All 11 named       | A correct-answer takeover, lives remaining shown prominently. The solo counterpart of the draw |
| Run over                  | Lives at 0         | Summary: named vs missed, time per round, accuracy, streak                           |
| Missed revealed (Pro)     | Reveal the full XI | Missed slots fill one by one, goalkeeper first, in a dimmed missed style; the button becomes "Showing the N you missed." Reduced motion: all at once. Free sees the button locked, with "Pro shows every player you missed." |
| Daily cap reached         | Free, 5 runs today, switch on | On `/play`, Start is disabled; "You've played your 5 solo runs today. More at 01:00." (the reset in local time) with Play a duel and See Pro. With runs left, a quiet "3 of 5 solo runs left today" instead. A refused run gates the game with the same line: Play a duel, Back to play, See Pro. The summary of the fifth run swaps Play again for Play a duel. Unlimited shows nothing. Never a dead end |
| Picked match              | A run from the archive (`?match=`) | The side pick shows that match; the run is today's. Its summary leads with **Play it again** (the same match, a new run) and **Back to the archive**. A match no longer in the game gates the game: "That match isn't in the game any more", Back to the archive. Free with a picked link: "Picking a match is part of Pro", "A random match from your filters is still free." (at the cap, the cap line in its place), Back to play and See Pro |
| Practice                  | Pro starts a practice run (the session says `practice`) | No clock and no lives display: a "Practice" panel in their place ("No clock and no lives. Name all eleven, or quit when you like. This run isn't saved."), from the side pick on. The input stays live and no clock or whistle sounds play; the guess cues stay. Quit asks "End this practice run?" ("You'll see the summary. Practice runs aren't saved.", End practice, Keep practising). The summary keeps its title with a "Practice" tag where the lives were, finds past a minute read as minutes (1:14), and the actions are **Practise again** and **Back to play** (**Back to the archive** for a picked match). On step 1 of `/play` a **Practice** mode card beside Solo and Duel (shown locked for Free, with "Practice is part of Pro: no clock, no lives, not saved." and See Pro) makes Start read "Start practice" and hides the cap line. Practising over a run left in play asks first. After 30 idle minutes: "This practice run has closed", Back to play. Free with a practice link: "Practice is part of Pro", "A timed run from your filters is still free." (at the cap, the cap line in its place), Back to play and See Pro |
| Quit confirm              | Quit tapped        | A confirm dialog. Mid-run quits are common — make it one tap to cancel, never a double confirm |

### Play setup

`/play` is three steps on one route: **1 Mode**, **2 Filters**, **3 Start**. The step is in the URL (`?step=filters`, `?step=start`), so Back and Forward move between steps and a reload keeps the place.

| State          | Trigger                          | Behaviour                                                                                                                       |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Mode           | `/play` with no step             | Solo, Duel and Practice cards; **nothing picked on a fresh visit**. Next stays disabled until a card is picked. Solo shows the runs-left or cap line here too |
| Join by code   | Duel picked, on step 1           | "Have a room code?" with the code box and Join. Joining skips the filters: the creator's set applies                           |
| Filters        | Next from Mode                   | The filters, with Back and Next. Any is a valid choice, so Next is live once they load                                          |
| Start          | Next from Filters                | A summary (mode, competition, club, era) with Edit mode and Edit filters, then Start with its label, the cap line and the archive line. Duel adds Create room under Start |
| Step indicator | Always                           | Three numbered steps; the current one is marked, filled ones show a check and their choice. A step opens once every earlier one is filled |
| Fallback       | A later step with no mode        | Step 1, nothing picked                                                                                                          |
| Entry links    | Where the player comes from      | A fresh start (nav, home fold, footer, 404, profile, after sign-in) opens step 1. The home page's Play solo and Find a duel open step 2; Play a friend opens step 1 at the join row. Back to play from a game, gate, queue or result opens step 3 with the choices kept; Change filters opens step 2 |

### Lobby & matchmaking

| State                   | Trigger             | Behaviour                                                                                                        |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Searching               | Queue entered       | Ambient, low-tension. No countdown clock here — the clock means "you are losing time"                            |
| Opponent found          | Pair made           | Brief beat, both handles shown, then straight to filters                                                         |
| Filters — you submitted | You confirm         | Your filters lock with a confirmation mark. The opponent's show waiting                                          |
| Filters — coin flip     | Both submitted      | **Name whose filters won, explicitly.** Without this, the player whose filters lost assumes the app ignored them |
| Match retrieved         | Squad resolved      | Match header in full: both crests and names, the score, the competition and the date. The named side is emphasised and the other side is muted |
| No opponent             | Queue timeout       | Offer solo with the same filters. Never a dead end                                                               |
| Cancelled               | You leave the queue | Back to step 3 of `/play`, mode and filters preserved                                                            |
| Room waiting            | Your room is open   | The code is the most prominent thing, easy to read aloud. Copy code and Copy link confirm in place ("Copied"). A quiet "Closes in 9:41" and the room's filters. **No countdown clock**: nothing is lost while you wait |
| Room filters            | A friend joins      | The coin-flip result, named for the room: "Playing your room" or "Playing {creator}'s room". No coin-flip wording |
| Joining                 | A code is sent      | "Joining room K7QM2X…" with an ambient waiting state and Cancel                                                  |
| Join refused            | Wrong, full or own  | Say which, and Back to play: step 1 of `/play`, Duel picked, the code kept in the box. Never "something went wrong" |
| Hosting locked          | Free, split on      | Create room shown locked, with "Pro hosts rooms. Anyone can join." and See Pro; the code box and Join stay live. A refused create says "Hosting a room needs Pro", with Back to play and See Pro. After a room game, Back to play leads and New room is locked |
| Room expired            | 10 minutes, no one  | "No one joined", Create a new room. Never a dead end                                                             |

### System

| State               | Trigger                      | Behaviour                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Protocol refused    | Client on version < N-1      | Full-screen upgrade prompt. Mobile-only in practice; still needs a design       |
| Empty filter result | No match passes both gates   | Name which filter is too narrow, offer to widen it. Never "no results"          |
| You reconnecting    | Your socket drops mid-duel   | Overlay, countdown to forfeit, **your clock shown still running**               |
| Connection lost     | Reconnect failed             | Result screen, marked as a forfeit                                              |
| Rate limited        | Guess spam trips the limiter | Input locks briefly with a reason. Not silent — silent lockouts read as a crash |

### Pro lock

While the backend's `PRO_ENABLED` is on, a Pro feature a Free player can't use is **shown locked, never hidden**. With the switch off, no lock, no price and no word "Pro" appear anywhere.

| State   | Trigger                              | Behaviour                                                                    |
| ------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Pending | The switch or the session is loading | The control shown locked, no caption, so no lock flashes in or out           |
| Locked  | Switch on, Free (or no session yet)  | The control shown locked and inert, with a short caption and **See Pro**     |
| Open    | Switch off, or Pro                   | The real control, as if no lock existed                                      |

### Landing demo

The showcase on `/` plays one solo turn on a loop. It is presentation, not a game: the reveals and the wrong guess come from the response. **It has no countdown clock** (user, 2026-11-10): the game's clock is untouched.

| State          | Trigger                          | Behaviour                                                                                  |
| -------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| Playing        | At least half in view, tab shown | Typing into the input, the suggestion row, reveals, one "Not in this XI" shake              |
| Paused         | Pause, out of view, tab hidden   | Everything stops where it was. A Pause / Play control is the demo's only control           |
| Reduced motion | `prefers-reduced-motion`         | One still frame: the demo's reveals filled, the input empty, no control                    |
| Sound          | Always                           | None. The game's cues never play on `/`                                                    |

### Loading

Every wait in this app has a **known shape** — a squad is always 11 slots, a list row always has the same parts. So loading is a placeholder of the real thing, never a spinner on an empty panel.

| Surface                  | Behaviour                                                              |
| ------------------------ | ---------------------------------------------------------------------- |
| Squad grid loading       | 11 slot placeholders in formation. The layout never shifts on arrival  |
| Lobby / list rows        | Placeholder rows at the real row height                                |
| Match header             | Placeholders for the crests, the scoreline and the context line        |
| Inline (guess submitted) | A pending indicator **inside** the locked input — the only spinner     |

---

⚽ **Lineup — Know the XI. Guess the Squad.**
