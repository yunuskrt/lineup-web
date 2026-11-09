# Landing Page Improvements

How `/` should grow from a statement fold and a rules strip into a page that shows what Lineup holds and how a turn plays. Written 2026-11-09. **Nothing here is built yet**: this is the reference for the specs that will implement it.

**Scope.** Within the current Floodlight theme (`theme.md`), type and design language. No new tokens beyond component tokens named per `design.md` § Token architecture, no new fonts, no restyle of other routes. A full redesign comes later, so every section below is described by **what it shows and why**, not by colour or exact type, and the content comes from an endpoint, so the redesign only replaces the presentation.

**Hard limits.** No Three.js (or any WebGL scene). No layout that breaks or scrolls sideways at any width down to 320px. No game logic in the client (HC 7), no `memorability_score` (HC 20).

---

## 1. Decisions

Settled with the user on 2026-11-09.

| # | Question | Decision |
| --- | --- | --- |
| 1 | Where do the numbers come from? | **A new public backend endpoint** (§ 7, request R7), cached. The numbers grow with the pool; no constants to keep in step |
| 2 | Community activity (games played, players online)? | **Not yet.** Early numbers are small and read as an empty game. Dataset numbers only |
| 3 | Show how a turn plays? | **A scripted, non-interactive demo turn, on a real famous XI**, built from the real game components. **Refined 2026-11-09:** Real Madrid's XI from Real Madrid 2–3 Barcelona (La Liga, 23 April 2017). The demo reveals Bale, Cristiano Ronaldo, Benzema, Modrić and Kroos, and its wrong guess is Lionel Messi (Barcelona's XI). The mock uses a fictional XI |
| 4 | Crests and logos? | **Yes:** competition logos and a row of club crests, the same assets `/play` already shows |

**What decision 3 requires.** A real XI on a public page is that match's answer key, and HC 2 says a playable squad never reaches the client. So **the showcase match is taken out of the playable pool**: the backend's selector never serves it, and only the showcase field of the endpoint sends it. One match of 1,925 is a small price for this. The XI is read from the database. It is never typed by hand or recalled from memory (HC 4).

---

## 2. Page structure

Top to bottom. Nav and footer stay as they are today (`design.md` § Page shape: wordmark left, CTA right; the closing statement).

| # | Section | Job | Status |
| --- | --- | --- | --- |
| 1 | **Fold** | The statement, one line of what the game is, Play. On wide screens, the demo turn beside it | Changed |
| 2 | **The archive** | Four big numbers: matches, players, clubs and national teams, seasons | New |
| 3 | **How it plays** | The 11 / 15 / 3 rules strip, unchanged | Kept |
| 4 | **Two ways to play** | Solo and Duel side by side, with Play a friend under Duel | New |
| 5 | **What's inside** | Competition logos, the most-played clubs' crests, four highlight numbers | New |
| 6 | **Closing** | The footer statement, plus a last Play link | Kept, one link added |

**Why this order.** The fold says what it is and shows it moving. The archive says it's real and big. The rules say how it works, the modes say how to play it, and what's inside says what to expect. Every section answers the question the one above it raises, and none repeats another.

**One primary action per view** (`design.md`). Play is the only primary button on the fold. Section 4's links and section 6's link are secondary in weight: they sit lower on the page, so they are never in the same view as the fold's Play.

### Wide (lg and up)

```text
┌──────────────────────────────────────────────────────────────┐
│ LINEUP                                        Account  [Play]│
├──────────────────────────────────────────────────────────────┤
│                                    ┌───────────────────────┐ │
│  KNOW THE XI.                      │ RMA 2–6 BAR · La Liga │ │
│  BEAT THE CLOCK.                   │   pitch, 11 slots     │ │
│                                    │   ○  ●  ○  ●  ○       │ │
│  You get one team from a real      │      ring  "Xav|"     │ │
│  match. Name its starting eleven…  │                  [ ❚❚]│ │
│  [ Play ]                          └───────────────────────┘ │
│  No sign-up needed. Sign in        Barcelona's XI, 2 May 2009│
├──────────────────────────────────────────────────────────────┤
│  1,925          3,787          100              26           │
│  real matches   players        clubs & nations  seasons      │
│  2000–01 to 2025–26                                          │
├──────────────────────────────────────────────────────────────┤
│  11  Starters to name…   15  Seconds a turn…   3  Lives…     │
├──────────────────────────────────────────────────────────────┤
│  Solo                          │  Duel                       │
│  Your filters, your pace…      │  Live 1v1, shared XI…       │
│  Play solo                     │  Find a duel · Play a friend│
├──────────────────────────────────────────────────────────────┤
│  [UCL][PL][LaLiga][WC][EURO]…   (logos, wrapping)            │
│  (crest)(crest)(crest)…         (most-played clubs, wrapping)│
│  56 finals · 53 shootouts · 84 extra times · 5,348 goals     │
├──────────────────────────────────────────────────────────────┤
│  ELEVEN NAMES. FIFTEEN SECONDS.                 Play         │
└──────────────────────────────────────────────────────────────┘
```

The wireframe shows placement only. The `·` separators stand for layout, not copy: section 5's highlights are four separate figures, each a number with a label.

### Phone (below sm)

```text
┌──────────────────────┐
│ LINEUP        [Play] │
├──────────────────────┤
│ KNOW THE XI.         │
│ BEAT THE CLOCK.      │
│ You get one team…    │
│ [ Play ]             │
│ No sign-up needed…   │
│ ┌──────────────────┐ │
│ │ demo, full width │ │
│ └──────────────────┘ │
├──────────────────────┤
│ 1,925     3,787      │
│ matches   players    │
│ 100       26         │
│ clubs     seasons    │
├──────────────────────┤
│ rules strip          │
│ Solo / Duel stacked  │
│ logos, crests wrap   │
│ highlights 2 × 2     │
└──────────────────────┘
```

The statement and Play stay **above the demo** on phones, so the first screen still has the action. The fold no longer forces full height on phones: the top of the demo should show, as a cue to scroll.

---

## 3. What the page shows

Values are from the scraper's `data/dataset/manifest.json` and the dataset files on 2026-11-09, for scale only. The page always renders what the endpoint returns.

### The archive (section 2)

| Number | Today | Counted as |
| --- | --- | --- |
| Real matches | 1,925 | Matches the selector can serve (gate-passed, not excluded) |
| Players | 3,787 | Distinct players in those matches' XIs |
| Clubs and national teams | 100 (53 + 47) | Distinct sides in those matches; the label may say "clubs and nations" |
| Seasons | 26 | The era range, shown as "2000–01 to 2025–26" under the row |

Count **what is playable**, the way `/catalog/filter-options` lists "only what the pool can serve". Never raw table rows. Exact figures with thousands separators and tabular numerals, never rounded to "1,900+": exact reads as real.

### What's inside (section 5)

| Item | Today | Source |
| --- | --- | --- |
| Competition logos | 11 | The pool's competitions, as `/play` groups them: leagues, European cups, international |
| Club crests | top 12 by playable matches | Ranked by data, not a hand-picked list, so the strip stays true as the pool grows. National teams are left out of this row |
| Finals | 56 | Matches whose stage is `Final` |
| Penalty shootouts | 53 | `shootout_home` set |
| Extra time | 84 | `extra_time` true |
| Goals | 5,348 | Sum of both sides' goals |

Pre-release, crests carry the same trademark question as everywhere else in the app (`project-overview.md` § Data Architecture). The landing page adds no new licensing decision: if crests ever have to go, they go here too, and the row falls back to club names.

### Left out on purpose

| Idea | Why not |
| --- | --- |
| Games played, players online | Decision 2. Revisit once totals are worth showing |
| Derby count (358 today) | The schema has no rivalry flag; counting by club pairs would put the scraper's group rules into the backend. Add it once a flag exists |
| Most-started players (Cristiano Ronaldo, 160 starts) | Trivia that doubles as a hint at answers |
| Most common formation | True but dull; nothing a player acts on |
| Difficulty or memorability | HC 20 |
| Testimonials, user counts, "as seen in" | Nothing real to show; never invented |

---

## 4. The demo turn

The one moving thing on the page: one solo turn on Real Madrid's XI, replayed with the game's own components (`SquadGrid`, `RevealCard`, `CountdownRing` and the match header). The point is to show, in about 20 seconds, what "name the XI against the clock" means.

**The match (user, 2026-11-09):** Real Madrid 2–3 Barcelona, La Liga Matchday 33, 23 April 2017, Real Madrid's XI (home, 4-3-3). All 11 photos are in the dataset. The demo reveals Gareth Bale, Cristiano Ronaldo, Karim Benzema, Luka Modrić and Toni Kroos, in that order. Its wrong guess is Lionel Messi, who started for Barcelona. The pick is a backend constant (§ 7), so changing it later needs no web change. This replaces the 2009 Barcelona XI first suggested.

### The script (one loop)

1. The match header and the empty formation show, with the ring full.
2. A name is typed letter by letter into a read-only copy of the guess input. At 3 letters the suggestion row appears, exactly as in play.
3. The reveal lands: the slot fills with the turf flash, and the card springs in over 320ms. The ring resets, because in solo a new name starts the next round at once.
4. Steps 2 and 3 repeat for 5 players in about 20 seconds. Once, a typed name is not in this XI: the input shakes and the "Not in this XI" toast shows, which teaches the no-penalty rule.
5. A 3-second hold on "5 of 11 named", then a fade to step 1.

The ring sweeps **linearly**, at the real 15-second rate (`theme.md` § Motion). Reveals land before it runs out, so the demo never shows a life lost, and it never misstates the time.

**Tuned step lengths** (Landing B, 2026-11-09; `MOTION_DURATION_MS` in `src/styles/motion.ts`):

| Step | Length |
| --- | --- |
| Start, before the first name | 1,200ms |
| Each guess: wait, then type 3 letters | 450ms + 3 × 110ms |
| Suggestion row shown (highlighted halfway) | 700ms |
| Picked: the full name in the input | 250ms |
| Pending, with the spinner | 300ms |
| After a reveal / after the miss | 1,470ms / 1,000ms |
| Hold, then fade | 3,000ms, then 240ms |

One loop is 24.97s (5 reveals of 3.5s, a 3.03s miss). The longest round is 6.53s, the one holding the miss, well inside the 15s.

### Rules

- **Presentation only.** A fixed timeline in the client, with no matcher, no lives accounting and no outcome logic. It plays back events, the way a recorded match would.
- **The demo can't be clicked into a game.** It is not an input, and its input field is read-only and hidden from assistive tech. Play is the way in. A real match can't be launched from the landing page anyway: exact match selection is a Pro feature.
- **Pause control.** The demo loops for longer than 5 seconds, so it needs a visible pause button (WCAG 2.2.2). It sits in the demo's corner, in the same style as the quit and sound chips.
- **It runs only when seen.** It is paused while scrolled out of view and while the tab is hidden, and it starts when it first enters view.
- **No sound.** The game's cues never play on `/`.
- **Reduced motion:** one still frame, with 5 slots filled, the ring at rest and no typing. The ring keeps sweeping in play because it carries information there. In a demo it carries none, so here it stops.
- **Screen readers** get one sentence ("A turn being played: five of Real Madrid's starting eleven named against the clock") and none of the frames.
- **Caption** under the demo: the match, the side and the date, so it's clear this is a real game.

---

## 5. Motion and interaction

Lead with the one orchestrated moment, the demo, and keep everything else still.

| Element | Motion | Reduced motion |
| --- | --- | --- |
| Demo turn | § 4 | One still frame |
| Archive numbers | A single count-up the first time the row enters view, about 800ms, ease-out, with tabular numerals so nothing jitters | The final value at once |
| Highlights | None | — |
| Crests and logos | None; a hover shows the club or competition name as a tooltip, and the same name is the image's `alt` | — |
| Mode links, closing link | The existing link and button hover styles | — |
| Sections | **No fade-up on scroll.** Entrance animations on every section are the most generic pattern there is, and they delay reading | — |

- Motion animates `transform` and `opacity` only, and reads `useMotionPolicy` the way the game components do (W26a). Never a global kill switch.
- Durations and easings come from `motion.ts`; none are invented for this page.
- **The numbers render as their final value on the server.** The count-up only enhances them after hydration, so no-JS, crawlers and screen readers all get the real figure. The animated digits are `aria-hidden`, beside a visually hidden final value.
- **No marquee.** An auto-scrolling crest belt would need its own pause control, and it would compete with the demo. The crests wrap instead.
- No parallax, no scroll-jacking, no cursor effects, no canvas or WebGL, and no video.

---

## 6. Responsive and performance

| Width | Fold | Archive | Modes | Inside |
| --- | --- | --- | --- | --- |
| < 640px | Stacked: statement, Play, then the demo at full width | 2 × 2 | Stacked | Logos and crests wrap; highlights 2 × 2 |
| 640–1023px | Stacked, with the demo at most about 560px wide | 4 in a row | Side by side | Highlights 4 in a row |
| ≥ 1024px | Two columns: statement left, demo right | 4 in a row | Side by side | As above |

- Check it at 320, 375, 768, 1024 and 1440px. Nothing may scroll sideways: the crest and logo rows wrap (`flex-wrap`), and long numbers stay within their cell.
- The demo keeps a fixed aspect ratio, so nothing shifts as it loads (`design.md` § Every wait has a known shape).
- **LCP stays the `<h1>` text.** The demo is a client island loaded after the fold text, so it never blocks the statement. Its 11 headshots are the 128px WebP already in the bucket.
- The fold's text stays server-rendered. The overview is fetched on the client (§ 8), so the sections that show it, the demo and the count-up are client components.

---

## 7. Backend request (R7)

When this is specced, the request below goes into `backend-requests.md` as **R7** (the rematch request, if it comes, takes the next number). It is client-agnostic: mobile's home can read the same endpoint.

**`GET /catalog/overview`**, public (like `filter-options`), rate-limited as `catalog`, and cacheable (`Cache-Control: public`, about an hour). No migration.

```text
CatalogOverview {
  counts:     { matches, players, clubs, nationalTeams, seasons }   // playable pool only
  era:        EraRange                                              // as filter-options
  highlights: { finals, shootouts, extraTime, goals }
  competitions: CompetitionRef[]                                    // with logoUrl
  topClubs:   ClubRef[]                                             // ≤ 12, clubs only, by playable matches
  showcase:   Showcase | null
}

Showcase {
  match:   MatchInPlay                      // identity (R4) + side + formation
  players: RevealedPlayer[11]               // directoryKey included
  demo:    { reveals: slot[], miss: { name, imageUrl, directoryKey } | null }
}
```

The full field list is in `backend-requests.md` § R7, which supersedes this sketch.

- **The showcase match is a backend constant** (its slug, side, reveal order and miss). The **match selector excludes it**, so it is never served as a solo run or a duel. That exclusion is what makes sending its XI safe (§ 1). A test asserts that the selector never returns it.
- `showcase` is `null` if the constant names a match that isn't loaded. The web then renders the fold without the demo.
- Counts are computed from the selector's candidates, so they match what Play can actually serve, and they leave out the showcase.

---

## 8. Loading, failure and the mock

- **A client fetch, like `/play`'s filter options** (`useCatalogOverview`, one-hour `staleTime`). The `ApiClient` is browser-side (credentials, one mock store per tab), so server rendering would need a second transport. While loading, the sections show skeletons of their final size. *Changed 2026-11-09 from "server-rendered with revalidation".*
- **If the endpoint fails**, the archive and inside sections are left out and the rest renders. Never zeros, never "something went wrong" on a marketing page, and never a skeleton left spinning.
- **The mock adapter** gains `CatalogApi.getOverview`. Its showcase uses a **fictional XI** from the mock fixtures, as every mock squad does, and its counts come from the mock dataset. A `?scenario=overviewDown` covers the failure path.
- Metadata: the static description stays; counts in it would need server data (later, if wanted).

---

## 9. Implementation split

The fix files are in `context/fixes/`, and the backend request is `backend-requests.md` § R7:

1. **Landing A (web, mock)** (`landing-a-sections.md`): the contract, the sections, the numbers and their count-up, and the showcase as a still frame.
2. **Landing B (web, mock)** (`landing-b-demo-turn.md`): the demo turn's timeline, pause, in-view and reduced motion.
3. **R7 (backend):** `/catalog/overview`, the showcase constant and the selector exclusion. It can be built any time before step 4.
4. **Landing C (web, wiring)** (`landing-c-wiring.md`): the real endpoint, checked against the numbers R7 reports.

**Docs to update when it's built** (not now):
- `design.md` § Page shape: the `/` row becomes "Statement fold with the demo turn, then the archive, rules, modes and what's inside".
- `theme.md`: a short Landing entry for the demo's reduced-motion still frame, and the rule that it stops its ring.
- `contract.md` § catalog: the `CatalogOverview` and `Showcase` shapes.
