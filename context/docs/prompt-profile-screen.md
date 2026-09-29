# Prototype Prompt — Profile Screen

Paste everything below the line into the design tool. Save the three results in `context/screenshots/` as `profile-desktop.png`, `profile-tablet.png` and `profile-mobile.png`. They are a reference, not a spec (see `design.md` § Scope). Scope and copy come from `context/features/phase-24a-profile-panels.md`.

---

Design a single page for **Lineup**, a football trivia game. Tagline: _Know the XI. Beat the Clock._

## What the game is

Players are shown one team from a real historical match and must name its **starting XI**, which is 11 players, from memory. Each round has a 15-second clock and each player has 3 lives. They play two ways:

- **Solo.** A run ends when they lose all 3 lives ("Run over"), name all 11 ("Perfect clear"), or quit ("Run ended").
- **Duel.** Two players take turns against each other, naming from the same XI. A duel ends in a **Win**, a **Loss**, a **Draw** (all 11 named) or a **Forfeit win** (the opponent left).

Guests can play without signing up. Their history is real and is kept when they create an account.

## The page

Design **`/profile`**, a player's record: their history, their duel win/draw/loss record, and a few stats.

The page is **stat-led: the numbers are the narrative.** Someone opening it wants to see how they're doing at a glance, then scroll back through what they've played. Think of a well-set sports results page, not an app dashboard.

The state to design is a **guest who has played 34 games** (22 duels and 12 solo runs). There are more games than fit on one page, so a "Show more" control sits at the end of the list.

## Mood

"Floodlight": night football, a 2000s archive. It's calmer than the game screen: nothing here is on a clock, so the page is quiet, sharp and legible. The background is near-black with a green cast, like a pitch under floodlights, not a grey dashboard. Text is warm cream, never pure white. Retro without pastiche: no leather textures, no VHS scanlines, no neon glow.

## Layout

- **Site nav:** wordmark "Lineup" on the left. On the right, the player's handle as a small link and a "Play" button in amber. No other nav links.
- **Footer:** a single inline line of small muted text. No multi-column link footer, no social icons.
- **Header:** the player's handle, **floodlit_fan**, as the page heading, with a small "Guest" tag beside it. No avatar photo.
- **Guest strip:** directly under the header, a quiet bordered strip:
  - Text: "You're playing as a guest. Create an account to keep your history on any device. Nothing you've played is lost."
  - One amber button, "Create account".
  - This is the **only primary action** on the page.
- **Duel record:** the lead of the page, and the one element allowed to be bold.
  - Three large numbers with small labels: **Won 14**, **Drawn 2**, **Lost 6**.
  - Under them, one horizontal record bar split in proportion: wins in amber, draws half amber and half blue, losses in red.
  - The numbers carry the meaning; the bar only illustrates them.
- **Stats:** a compact label-and-value list beside or under the record:

  | Label          | Value            |
  | -------------- | ---------------- |
  | Solo runs      | 12               |
  | Perfect clears | 1                |
  | Best streak    | 7                |
  | Accuracy       | 64%              |
  | Favourite club | Northgate United |

- **History:** a section heading "History", then a list, newest first, separated by thin divider lines rather than boxed in cards. Every row is the same height. Each row shows:
  - A small mode tag: "Solo" or "Duel".
  - The outcome label, coloured by outcome (see Palette) and always written in words.
  - The scoreline with short club codes, like `NGU 3–2 RSO`.
  - Under the scoreline, the match context in muted text.
  - Found count ("6 of 11"), lives left (three small pips, not hearts) and when it was played.
- **Show more:** a plain secondary button, "Show more", at the end of the list.

Everything is **left aligned**. There's no page-wide card wrapping everything, and no hero banner.

## History rows (use exactly these, in this order)

Today is 29 September 2026.

| Mode | Outcome       | Scoreline     | Match context                                                                  | Found    | Lives | Played      |
| ---- | ------------- | ------------- | ------------------------------------------------------------------------------ | -------- | ----- | ----------- |
| Duel | Win           | `NGU 3–2 RSO` | The Comeback at Northgate: Continental Champions Cup semi-final, 3 May 2005 | 6 of 11  | 2     | Today       |
| Solo | Perfect clear | `KMC 1–0 RIV` | Crown League matchday 38, 13 May 2012                                          | 11 of 11 | 1     | Today       |
| Duel | Loss          | `YLD 2–2 ACA` | The Mudbath Derby: Liga Meridiana matchday 19, 17 January 2010                 | 4 of 11  | 0     | Yesterday   |
| Duel | Forfeit win   | `WEE 0–1 NGU` | Continental Champions Cup group stage, 22 October 2014                         | 3 of 11  | 3     | Yesterday   |
| Solo | Run over      | `VAL 4–3 SRV` | The Night of the Six: Global Nations Cup semi-final, 5 July 2006               | 7 of 11  | 0     | 12 Sep      |
| Duel | Draw          | `OST 1–1 VAL` | The Rain Final: Continental Nations Championship final, 1 July 2012            | 11 of 11 | 1     | 8 Sep       |
| Solo | Run ended     | `RSO 2–0 NGU` | Continental Champions Cup final, 25 May 2019                                   | 5 of 11  | 2     | 30 Aug      |
| Duel | Loss          | `RIV 1–3 KMC` | The Final-Day Swing: Crown League matchday 38, 19 May 2024                     | 2 of 11  | 0     | 14 Dec 2025 |

All clubs, competitions and matches are fictional. Don't replace them with real ones.

## Responsive

Design **three versions of the same page, in the same state**, shown side by side:

- **Desktop, 1440 × 900.** Content in a centred column about 1150px wide. The duel record and the stats list sit side by side above the fold, the record taking the larger share. History runs full width below, and the page scrolls vertically.
- **Tablet, 834 × 1194 (portrait).** The record spans the full width. The stats become a two-column list under it. History is below.
- **Mobile, 390 × 844.** Everything stacks: header, guest strip, record numbers and bar, stats list, then history. The three record numbers stay on one row. Each history row wraps to two or three lines, but all rows keep the same height. **Never scroll sideways.** Long club names and handles wrap or truncate cleanly.

## Palette (use exactly these)

| Role                                   | Hex       |
| -------------------------------------- | --------- |
| App background                         | `#0A0F0C` |
| Raised panels, guest strip             | `#121A15` |
| Cards, tags                            | `#1A241E` |
| Borders, dividers, empty bar track     | `#27352C` |
| Subtle outlines                        | `#2F4036` |
| Primary text (cream)                   | `#F2EFE6` |
| Secondary text, labels, match context  | `#9BA79E` |
| Placeholder, disabled, empty life pips | `#5F6D64` |
| Brand, primary button, **wins**        | `#FFC043` |
| Opponent blue, half of a **draw**      | `#4C9AFF` |
| **Perfect clear**                      | `#5FE388` |
| **Loss**                               | `#FF4A4A` |

- "Run over" and "Run ended" are neutral: secondary text colour, no accent.
- "Forfeit win" uses the win colour.
- A draw shows amber and blue together, with neither dominant.
- Text on amber or green must be `#0A0F0C`, never cream.
- Never tell outcomes apart by colour alone; the label always says it.

## Type

- **Archivo** (expanded or black weight) for the handle heading and the record numbers.
- **Archivo with tabular figures** for every number: the record, stats, found counts and scorelines.
- **Inter** for everything else.
- Type scale: 12 · 14 · 16 · 20 · 24 · 32 · 48. The record numbers are 48 at most. Nothing on this page is 64; that size belongs to the game's countdown.

## Form rules

- 4px spacing grid. Corners are tight: 4px on tags and buttons, 8px on cards, 12px on panels. Full rounding only on the tiny life pips. No pill-shaped buttons.
- **No drop shadows.** Separate layers with 1px borders and slightly lighter backgrounds.
- No gradients, no glassmorphism, no glow, no charts beyond the single record bar.
- No all-caps eyebrow labels above sections. No "01 / 02 / 03" numbering. No arrows appended to buttons. Don't join metadata with middle dots; use commas as in the match context above.

## Optional: state switcher

If the tool supports interactivity, add a small, clearly separate dev switcher that shows these states on the same page:

- **Account:** the same page with no "Guest" tag and no guest strip.
- **Empty:** a new player. The record reads 0 / 0 / 0 with an empty bar track and "No duels yet.". Accuracy reads "—" and Favourite club reads "None yet". In place of the list, "No games yet" and "Your solo runs and duels will be listed here.", with one amber "Play" button.
- **Signed out:** no header, record or history. The heading is "No profile yet" and the text is "Play a game and your history starts here. No account needed.", with one amber "Play" button and a "Sign in" text link.
- **Loading:** flat dark-green skeleton blocks in the exact shape and size of the header, record numbers, bar, stats and three history rows. No shimmer; at most a slow opacity pulse. Nothing may shift when the real content arrives.
- **Loading more:** the "Show more" button disabled, reading "Loading…".
- **Load more failed:** "Couldn't load more games." in red under the list, with a "Try again" button.
