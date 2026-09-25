## Lineup — Design

⚽ **Where things go.** `theme.md` decides what they look like.

---

## 📌 Scope

`theme.md` owns color, type, motion, states and contrast. **It wins every conflict.**

This file owns the layer above that: page shape per route, what chrome each route carries, and the interaction patterns that repeat across the app. Two rules, one file each — if you find yourself picking a color here, it belongs in `theme.md`.

**Provenance.** The structural decisions below were drawn from studying two live products that solve a near-identical problem — `lichess.org/tv` (a spectator view built around one live board) and `fotmob.com/lineup-builder` (an editable football XI on a pitch). Structure only; no color, type or motion value from either was adopted. Where a finding is a warning rather than a pattern, it's in **Do not build** at the bottom.

**Prototypes.** Screens may be prototyped in an external design tool (Lovable, v0 and the like) and saved as screenshots in `context/screenshots/`. A screenshot is a **reference for composition and feel, not a spec** — implementation does not have to replicate it. Where it disagrees with `theme.md` or this file, those win: tokens over any colour in the image, borders over shadows, tight corners, no chrome on game routes. Never port code or values from the design tool, and never build a feature because it appears in a screenshot — scope comes from the phase spec.

---

## 🧭 Page shape per route

The two references converged on the same skeleton: **one dominant spatial object, plus a control rail.** Lichess runs it passive — spectate, no chrome, no footer. FotMob runs it active — edit, drag, persist, full site chrome.

The game routes want FotMob's posture with lichess's restraint.

| Route                       | Shape                                                        | Nav                       | Footer             |
| --------------------------- | ------------------------------------------------------------ | ------------------------- | ------------------ |
| `/`                         | **Statement fold** — one line fills the viewport, Play below | Wordmark left, CTA right  | Closing statement  |
| `/play`                     | **Diptych** — solo and duel side by side, filters beneath    | Wordmark left, CTA right  | Single inline line |
| `/play/solo`, `/play/duel`  | **Canvas** — the squad grid is the composition               | **None** — quit chip only | **None**           |
| `/profile`                  | **Stat-led** — the numbers are the narrative                 | Wordmark left, CTA right  | Single inline line |
| `/leaderboard` _(post-MVP)_ | **Index** — the page is the list                             | Wordmark left, CTA right  | Single inline line |

### Game routes carry no chrome

`/play/solo` and `/play/duel` ship **no nav and no footer**. Not a reduced nav — none.

During a 15-second round every pixel that isn't the clock, the grid or the input is competing with the thing the player is trying to do. Lichess's spectator view has zero `<footer>` elements on the page and that is the correct instinct for an application view. The only persistent affordance is a single quit control, placed away from the input.

This also protects the architecture: `/play/duel` is one route for the entire realtime session, and site chrome is exactly the kind of thing that tempts a route transition mid-duel.

### The home page owes the references nothing

`/` is a marketing surface. Both studied sources were application views and have nothing to teach it beyond restraint. Lead with the statement — _Know the XI. Beat the Clock._ — and close on one, rather than a sitemap footer.

**Avoid the four-column link footer with a social row.** It is the most recognizable templated footer on the web, and on a product with six routes it is filler pretending to be structure.

---

## 🧩 Layout patterns

### The canvas is the fold

On game routes the squad grid starts at the top of the viewport. No page heading above it, no breadcrumb, no section label. The match header (partially masked per `theme.md` § Lobby) sits _inside_ the canvas card, not above it as page furniture.

### Control rail, not a toolbar

Filters, mode toggles and saved lineups live in a rail beside the canvas — never in a bar above it. A horizontal toolbar pushes the canvas down and costs vertical space the squad grid needs on a phone. On narrow viewports the rail collapses **below** the canvas, never into a hamburger: these controls are primary, not navigation.

### Build the pitch, don't ship an image

Both references draw their field in CSS and inline SVG — midfield line, center circle, goal boxes. No raster asset. Do the same: the pitch must recolor with the palette, scale to any viewport, and cost nothing to load.

**Markings are one shade off the surface, never white.** `pitch-600` on `pitch-950` per `theme.md`. FotMob draws its lines only ~4% lighter than its field and that restraint is the single most tasteful thing on the page — the markings orient you without competing with the players.

### Empty slots are drawn, not absent

Unrevealed slots are outlined shapes in formation, not blank space. The player must always see how much is left — that residual count _is_ the tension. `theme.md` § Signature components specifies the treatment.

---

## 🖱 Interaction patterns

### Direct manipulation over dialogs

FotMob's lineup title is an inline `<input>` styled to look like a heading — click the text, type, done. No edit button, no modal.

Apply to anything the player names: saved lineup titles, profile handle. A modal for a single text field is friction pretending to be safety.

### Gate the canvas, don't hide it

Before a team is chosen, FotMob renders the full pitch and dims it behind an overlay rather than showing an empty state. The player sees what they're about to get.

Use this for pre-match, matchmaking and reconnecting: the grid stays visible and inert, the overlay carries the reason and the action. Never replace the canvas with a spinner — the player loses their place.

### Every wait has a known shape

A squad is always 11 slots; a lobby row is always crest + name. So loading is a skeleton of the real thing. Treatment is in `theme.md` § Loading; the structural rule is that **the skeleton and the loaded state must occupy identical space**, so nothing shifts at the moment the player starts reading.

### One primary action per view

`/` has Play. A duel round has the input. A result screen has Play again. Two adjacent primary buttons of equal weight means the design hasn't decided, and this app never has two equally important things to do at once.

---

## 🏷 Token architecture

`theme.md` defines the primitives. As the component set grows past them, name derived tokens for the **component and state**, not the value:

```
--squad-slot-empty-border
--squad-slot-filled-background
--ring-stroke-critical
--turn-indicator-you
```

Not `--green-2`, not `--border-light`. A value-named token gets reused somewhere it doesn't belong within a week, and then the palette isn't swappable any more — which is a stated project requirement.

Primitives live in each client repo's own tokens file, transcribed from `theme.md`; component tokens resolve from them. Never hard-code a hex outside that file.

Nothing crosses the repo boundary — `--squad-slot-empty-border` is a CSS custom property on web and a NativeWind theme key on mobile, defined independently in each. What the two share is the spec in `theme.md`, not a file.

---

## 🚫 Do not build

Observed in the studied sources. Each one is a real trap, not a style preference.

| Pattern                                            | Why not                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Animating `top` / `left` / `width` / `height`      | FotMob re-flows its 11 players this way, 22 declarations of it. Eleven nodes animating layout at once drops frames. Use `translate`          |
| Global `prefers-reduced-motion` kill-switch        | Lichess disables every animation and transition site-wide. Here that stops the countdown ring — players lose lives to a clock they can't see |
| `transition: all`                                  | Transitions a property you didn't intend the moment someone adds one. Name the properties                                                    |
| A CSS transition on a property Motion is animating | The two fight and the result stutters. Motion owns the property or CSS does — never both on one element                                      |
| Four-column link footer + social row               | The most recognizable templated footer there is. Six routes don't need a sitemap                                                             |
| Site chrome on game routes                         | Competes with the clock; invites a route transition that would tear down the socket                                                          |
| Drop shadows for elevation                         | Invisible on a near-black surface — they read as dirt. `theme.md` uses borders and background lifts                                          |
| Pill radius everywhere                             | Reads as a consumer social app. `theme.md` keeps corners tight; sports and data interfaces feel sharp                                        |
| Green/red as the player-identity pair              | The most common colorblind pair. `theme.md` chooses amber/blue deliberately — this one is non-negotiable                                     |
| Shimmer sweep on skeletons                         | On near-black it reads as a rendering artifact and competes with the ring                                                                    |
| A spinner on an empty panel                        | Every wait in this app has a known shape. Skeleton it                                                                                        |

---

⚽ **Lineup — Know the XI. Beat the Clock.**
