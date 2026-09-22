## Lineup — Theme

⚽ **"Floodlight"** — night football, 2000s archive, a clock running down.

---

## 📌 Direction

Three things the theme has to do, in priority order:

1. **Make 15 seconds feel like 15 seconds.** The countdown is the emotional core. Everything else is background.
2. **Make "you" and "your opponent" unmistakable at a glance** — in a 1v1 with a shared answer pool, confusing the two is the worst possible failure.
3. **Feel like the 2000s without being a pastiche.** Cream instead of white, condensed type, no skeuomorphic leather or VHS scanlines.
   **Dark only at MVP.** No light mode. The tension doesn't survive a white background, and a second theme doubles the token work for pages nobody lingers on. Revisit if `/`, `/pro` and the archive become real marketing surfaces.

---

## 🎨 Color

### Surfaces

| Token       | Hex       | Use                                                                                            |
| ----------- | --------- | ---------------------------------------------------------------------------------------------- |
| `pitch-950` | `#0A0F0C` | App background. Near-black with a green cast — a pitch under floodlights, not a gray dashboard |
| `pitch-900` | `#121A15` | Raised surface, panels                                                                         |
| `pitch-800` | `#1A241E` | Cards, player chips, input fields                                                              |
| `pitch-700` | `#27352C` | Borders, dividers                                                                              |
| `pitch-600` | `#2F4036` | Pitch markings, empty slot outlines                                                            |

### Text

| Token   | Hex       | Use                                                                      |
| ------- | --------- | ------------------------------------------------------------------------ |
| `bone`  | `#F2EFE6` | Primary text. Cream, not `#FFF` — warmer, easier at speed, quietly retro |
| `muted` | `#9BA79E` | Labels, metadata, secondary                                              |
| `dim`   | `#5F6D64` | Placeholders, disabled, unrevealed slots                                 |

### Semantic

| Token        | Hex       | Use                                         |
| ------------ | --------- | ------------------------------------------- |
| `floodlight` | `#FFC043` | Brand, primary CTA, **and "you"** in a duel |
| `away`       | `#4C9AFF` | **Your opponent** in a duel                 |
| `turf`       | `#5FE388` | Correct, newly found player                 |
| `ember`      | `#FF8A3D` | Timer warning (7–4s)                        |
| `red-card`   | `#FF4A4A` | Life lost, timer critical (3–0s), forfeit   |

### Three rules that make the palette work

**Amber vs blue for player identity, never red vs green.** Red/green is the single most common colorblind pair — roughly 8% of men would lose the most important distinction in the app. Amber/blue is the safest high-contrast pair there is. Still pair it with position and label, never color alone.

**The timer escalates through three colors, never two.** `bone` → `ember` → `red-card`. A two-stage escalation reads as "fine / panic"; three stages give the player a middle state to react to, which is where the tension actually lives.

**The surface ramp is one hue.** Every `pitch-*` value sits at hue **158°** in OKLCH (measured spread: 156.5–158.8°), with chroma rising as it lightens — `0.010` at `950` up to `0.028` at `600`. That relationship is what makes the greens read as _a pitch under floodlights_ rather than gray, and it is why the palette is swappable: change the one hue and the whole ramp moves together, coherently.

| Token       | OKLCH                    | Chroma  |
| ----------- | ------------------------ | ------- |
| `pitch-950` | `oklch(16.2% 0.010 158)` | lowest  |
| `pitch-900` | `oklch(20.8% 0.015 158)` |         |
| `pitch-800` | `oklch(24.8% 0.018 158)` |         |
| `pitch-700` | `oklch(31.3% 0.025 158)` |         |
| `pitch-600` | `oklch(35.3% 0.028 158)` | highest |

Keep the hex values as the shipped source; the OKLCH column is the _rule_ they follow. When a future palette swap happens, derive the new ramp from a single hue the same way — never hand-pick five unrelated darks.

**Note the deliberate text split:** `bone` sits at hue 91° (warm cream, off the surface family — it's the one thing that reads _lit_), while `muted` and `dim` sit at 153–157°, inside the surface family. Primary text stands apart; secondary text belongs to the pitch. Preserve that split in any palette swap.

```css
:root {
  --pitch-950: #0a0f0c;
  --pitch-900: #121a15;
  --pitch-800: #1a241e;
  --pitch-700: #27352c;
  --pitch-600: #2f4036;
  --bone: #f2efe6;
  --muted: #9ba79e;
  --dim: #5f6d64;
  --floodlight: #ffc043;
  --away: #4c9aff;
  --turf: #5fe388;
  --ember: #ff8a3d;
  --red-card: #ff4a4a;
}
```

---

## 🔤 Typography

| Role         | Face                                 | Notes                                  |
| ------------ | ------------------------------------ | -------------------------------------- |
| Display      | **Archivo Expanded** / Archivo Black | Match header, scoreline, result screen |
| Numerals     | **Archivo**, tabular figures         | Countdown, lives, score                |
| UI & body    | **Inter**                            | Everything else                        |
| Player names | **Inter Medium**                     | The most-repeated element in the app   |

> ⚠️ **Check Latin Extended-A coverage before committing to any display face.** Your player names include İbrahimović, Şahin, Özil, Łukasz, Čech. Anton and Bebas Neue — the two most common "sports display" picks — have incomplete coverage and will fall back mid-name, which looks broken. Archivo and Inter both cover it fully.

**Tabular figures are mandatory on the countdown.** `font-variant-numeric: tabular-nums`. Without it the number jitters horizontally every tick as glyph widths change, and a jittering clock reads as a bug.

**Scale** (1.25 ratio): 12 · 14 · 16 · 20 · 24 · 32 · 48 · 64
The 64 is the countdown. Nothing else gets it.

---

## 📐 Form

| Token     | Value                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Space     | 4px base — `4 8 12 16 24 32 48 64`                                                                                       |
| Radius    | `sm` 4px (chips, inputs) · `md` 8px (cards) · `lg` 12px (panels) · `full` (badges only)                                  |
| Border    | 1px `pitch-700`                                                                                                          |
| Elevation | **Borders and background lifts, not shadows.** Drop shadows are invisible on a near-black background — they read as dirt |

Keep corners tight. Sports and data interfaces feel sharp; pill-shaped everything reads as a consumer social app.

---

## 🎬 Motion

| Event                | Duration | Easing                        |
| -------------------- | -------- | ----------------------------- |
| Countdown ring sweep | 15000ms  | **`linear` — non-negotiable** |
| Player reveal card   | 320ms    | spring                        |
| Turn handover        | 240ms    | ease-out                      |
| Life lost            | 480ms    | shake + `red-card` flash      |
| Timer color shift    | 200ms    | ease                          |

**The ring must sweep linearly.** Any easing makes the visual position of the ring disagree with the seconds remaining — the player sees the ring slow down while the clock keeps ticking. Easing a progress indicator is a lie about time, and in a game where the clock decides lives, it's a fairness bug, not a style choice.

Respect `prefers-reduced-motion`: drop the shake and the spring, keep the ring (it carries information, not decoration).

**Reduced-motion is a scalpel, never a kill-switch.** The obvious implementation —

```css
/* Do NOT ship this. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

— is common in production codebases and it would **stop the countdown ring**. A player who has reduced motion enabled would lose lives to a clock they cannot see running.

Opt out **per component** instead. Animation is Motion's job here, so read the preference with Motion's `useReducedMotion()` and branch the variant — drop the shake, drop the spring, keep the sweep:

```tsx
const reduced = useReducedMotion();
// The ring ignores `reduced` entirely — it carries information.
// Everything decorative checks it.
```

**Animate `transform` and `opacity` only.** Never `top`, `left`, `width`, `height` or any other layout property. This matters most on the squad grid: eleven slots re-flowing at once through layout properties will drop frames on mid-range phones, and the reveal is the moment the game has to feel good. Position slots with `x` / `y` (Motion animates these as `transform`), never with grid or absolute offsets.

---

## 🔀 States

The duel screen is almost never at rest. These are the conditions it can actually be in — each one gets a decided treatment before anything is built.

**Two rules across every table below.** State is **server-pushed, never client-inferred** — the client renders what the server says it is, including the timer state. And every state must be reachable in dev without playing a real game; build a `?state=` override on day one or you will never see half of these before a user does.

### Duel — your turn

| State         | Trigger                          | Ring                             | Numeral     | Squad grid                                     | Input                       | Feedback                                   |
| ------------- | -------------------------------- | -------------------------------- | ----------- | ---------------------------------------------- | --------------------------- | ------------------------------------------ |
| Idle          | Turn starts                      | `bone`, sweeping                 | 64px `bone` | Unfound slots `pitch-600` outline              | Focused, live               | —                                          |
| Warning       | 7s left                          | `ember`                          | `ember`     | unchanged                                      | live                        | —                                          |
| Critical      | 3s left                          | `red-card`, 1s pulse             | `red-card`  | unchanged                                      | live                        | —                                          |
| Pending       | Guess submitted, awaiting server | **keeps sweeping**               | unchanged   | unchanged                                      | Locked, 16px spinner inline | —                                          |
| Correct, new  | Server confirms unfound player   | Freezes, then resets on handover | —           | Slot fills, `turf` flash → settles `pitch-800` | Clears, locks               | Name card springs in, 320ms                |
| Already found | Name is in the found-pool        | **keeps sweeping**               | unchanged   | **Existing slot pulses once, `muted`**         | Clears, stays live          | Toast: "Already named"                     |
| Not in XI     | Name isn't in the squad          | **keeps sweeping**               | unchanged   | **unchanged**                                  | Shake 240ms, text stays     | Toast: "Not in this XI"                    |
| Life lost     | Timer hits 0                     | Resets                           | —           | unchanged                                      | Locks                       | Pip empties, `red-card` screen flash 480ms |

> The two no-penalty outcomes must be told apart instantly. **Already-found speaks through the grid; not-in-XI speaks through the input.** Same rules, different channel — without that split, players read both as "the app didn't accept my answer" and assume it's broken.

### Duel — their turn

| State                 | Trigger                     | Treatment                                                                                                               |
| --------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Waiting               | Handover                    | Your ring dims to `dim` and stops. Their ring is the live one, in `away`. Grid read-only, input hidden                  |
| Their reveal          | Opponent names a new player | Slot fills in `away`-tinted `turf`, same 320ms spring. You watch the pool shrink — this is the tension                  |
| Their life lost       | Their timer expires         | Their pip empties. No screen flash; it isn't your loss                                                                  |
| Opponent disconnected | Socket drops                | `away` badge → `ember`, "Reconnecting, 18s". **Their clock keeps running** — say so explicitly, or it reads as a freeze |
| Opponent forfeited    | Reconnect window closes     | Straight to result, "Opponent left"                                                                                     |

### Duel — terminal

| State       | Trigger             | Treatment                                                                                                              |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Win         | Opponent at 0 lives | `floodlight` result card, match identity revealed in full                                                              |
| Loss        | You at 0 lives      | `pitch-800` card, `red-card` accent, same reveal — never hide the answers from the loser                               |
| Draw        | All 11 named        | Both colors present, neither dominant. Full XI already visible; the card names the match. Rare and should feel like it |
| Forfeit win | Opponent left       | Win card, marked as a forfeit. Doesn't count toward streaks                                                            |

### Solo

| State                     | Trigger            | Treatment                                                                            |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| Idle / warning / critical | as duel            | Identical. One ring, `floodlight` throughout                                         |
| Correct, new              | Valid unfound name | Slot fills, **next round starts immediately** — no handover pause                    |
| Already found / not in XI | as duel            | Identical, same two channels                                                         |
| Life lost                 | Timer hits 0       | Pip empties, flash, next round starts                                                |
| Perfect clear             | All 11 named       | `turf` takeover, lives remaining shown prominently. The solo counterpart of the draw |
| Run over                  | Lives at 0         | Summary: named vs missed, time per round, accuracy, streak                           |
| Quit confirm              | Quit tapped        | Modal. Mid-run quits are common — make it one tap to cancel, never a double confirm  |

### Lobby & matchmaking

| State                   | Trigger             | Treatment                                                                                                        |
| ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Searching               | Queue entered       | Ambient, low-tension. Do not use the countdown ring here — the ring means "you are losing time"                  |
| Opponent found          | Pair made           | Brief beat, both handles shown, then straight to filters                                                         |
| Filters — you submitted | You confirm         | Your panel locks, `floodlight` check. Opponent's panel shows waiting                                             |
| Filters — coin flip     | Both submitted      | **Name whose filters won, explicitly.** Without this, the player whose filters lost assumes the app ignored them |
| Match retrieved         | Squad resolved      | Match header, partially masked. Team side shown; competition and date hidden until the end                       |
| No opponent             | Queue timeout       | Offer solo with the same filters. Never a dead end                                                               |
| Cancelled               | You leave the queue | Back to `/play`, filters preserved                                                                               |

### System

| State               | Trigger                      | Treatment                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Protocol refused    | Client on version < N-1      | Full-screen upgrade prompt. Mobile-only in practice; still needs a design       |
| Empty filter result | No match passes both gates   | Name which filter is too narrow, offer to widen it. Never "no results"          |
| You reconnecting    | Your socket drops mid-duel   | Overlay, countdown to forfeit, **your clock shown still running**               |
| Connection lost     | Reconnect failed             | Result screen, marked as a forfeit                                              |
| Rate limited        | Guess spam trips the limiter | Input locks briefly with a reason. Not silent — silent lockouts read as a crash |

### Loading

Every wait in this app has a **known shape** — a squad is always 11 slots, a lobby row is always crest + name + rating. So loading is a skeleton of the real thing, never a centered spinner on an empty panel.

| Surface                  | Treatment                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Squad grid loading       | 11 `pitch-800` slot shapes on `pitch-950`, in formation. The layout never shifts on arrival |
| Lobby / list rows        | `pitch-800` circle + bar pairs at real row height                                           |
| Match header             | Two `pitch-800` bars at title and subtitle heights                                          |
| Inline (guess submitted) | 16px spinner **inside** the locked input — the only place a spinner is correct              |

Skeletons are flat `pitch-800` blocks. **No shimmer sweep** — a moving highlight on a near-black surface reads as a rendering artifact, and it competes with the ring for attention. If a wait needs to feel alive, pulse opacity `1 → 0.6 → 1` over 1.6s, `ease-in-out`.

**The skeleton must match the final layout exactly.** A skeleton that is the wrong size causes a layout shift at the moment the player is trying to read the squad — worse than no skeleton at all.

---

## 🧩 Signature components

These are bespoke — no library ships them, and they carry the whole feel.

- **Countdown ring** — 64px numeral inside a stroked circle. Three-stage color escalation. Linear sweep.
- **Lives** — three shapes, filled in player color, emptied to `dim`. Not hearts; a football-native mark (shirt, ball, or a simple pip) reads better here.
- **Found-player card** — the reveal moment. `turf` flash on entry, then settles to `pitch-800` with `bone` name. This is the component to prototype first.
- **Squad grid** — 11 slots. Unrevealed slots are `pitch-600` outlines on `pitch-950`, not empty space, so the player always sees how much is left.
- **Turn indicator** — the amber/blue pair, always visible, never subtle.

---

## 🛠 Implementation

**This document is the source of truth for the palette.** There is no shared token package — the client repos do not depend on each other. Each one holds its own tokens file transcribed from the tables above: web consumes it through Tailwind's `@theme`, mobile through NativeWind.

Within a repo, that file is the only place a hex value appears, so a palette swap stays a one-file change. Across repos, a palette change means editing this document and then both transcriptions. That is the accepted cost of the split — and it is why the values below are written out in full here rather than left to live in code.

**Share tokens, not components.** The web countdown ring and the native one are different implementations of the same spec, in different repos. That is intended: a single component tree for web and native produces an app that feels wrong on both.

```js
// tokens/colors.js — identical file in each client repo, transcribed from this document
export const colors = {
  pitch: {
    950: '#0A0F0C',
    900: '#121A15',
    800: '#1A241E',
    700: '#27352C',
    600: '#2F4036',
  },
  bone: '#F2EFE6',
  muted: '#9BA79E',
  dim: '#5F6D64',
  floodlight: '#FFC043',
  away: '#4C9AFF',
  turf: '#5FE388',
  ember: '#FF8A3D',
  redCard: '#FF4A4A',
};
```

---

## ✅ Contrast

All checked against `pitch-950` (#0A0F0C):

| Pair                        | Ratio   | Verdict                         |
| --------------------------- | ------- | ------------------------------- |
| `bone` on `pitch-950`       | ~16.5:1 | AAA                             |
| `muted` on `pitch-950`      | ~8.6:1  | AAA                             |
| `dim` on `pitch-950`        | ~3.6:1  | Large text and non-text UI only |
| `floodlight` on `pitch-950` | ~11.4:1 | AAA                             |
| `turf` on `pitch-950`       | ~11.9:1 | AAA                             |
| `away` on `pitch-950`       | ~7.2:1  | AA                              |
| `red-card` on `pitch-950`   | ~6.1:1  | AA                              |

Text **on** `floodlight` or `turf` must be `pitch-950`, never `bone`.

---

⚽ **Lineup — Know the XI. Beat the Clock.**
