# UI Redesign: Reference Screenshot Guide

What to collect for the new Lineup UI, where to find it, what to type, and where to save it. Follow it top to bottom.

**What's decided:** a **light, pastel** UI in the **Matchday Sticker** direction (see § 1), **Lucide** icons, a few **football doodles**, and animation added at the end with Motion.

**What doesn't change:** the gameplay, the features, the copy and the sounds. Every screen behaves as `context/theme.md` § States describes; only the look changes.

---

## How to use this guide

We build in **stages**. You collect one stage's references, I build that stage, you review it in the browser, we fix it, then we move to the next stage.

```text
collect a stage → tell me "<stage> ready" → I write the spec and build it
→ you review it in the browser → we fix it → next stage
```

| Stage | Sections | Say | Why this order |
| --- | --- | --- | --- |
| ✅ Moodboard | § 1 | — | Done: Matchday Sticker |
| **A. Foundations** | § 2 Foundations + § 3 Layout | "foundations ready" | Every page is built from these parts. Getting them right once is the cheapest fix of the redesign |
| **B. Game screen** | § 4 | "game ready" | The core of the product and the hardest screen. The home page demo reuses its pieces |
| **C. Play** | § 5 | "play ready" | The step right before a game |
| **D. Home** | § 6 | "home ready" | Its demo is made from the game screen's pieces, which exist by then |
| **E. Duel** | § 7 | "duel ready" | The lobby, rooms and result, on top of the game screen |
| **F. Profile** | § 8 | "profile ready" | |
| **G. Archive** | § 9 | "archive ready" | |
| **H. The rest** | § 10 Sign in + § 11 Pro + § 12 System | "rest ready" | Small pages, collected together |

**Rules for every stage:**

1. **Read § 0 once** before stage A: the websites, how to save, and how to name files.
2. **Collect only the current stage.** Don't jump ahead; what we learn from one stage sharpens the searches for the next.
3. **Must items are enough to start.** **Nice** items help, but I can build without them.
4. **Write `notes.md` lines as you go:** what you liked about each image (§ 14).
5. When the stage's ✋ line comes, stop and tell me.

A reference doesn't have to be about football. A banking app's card or a recipe app's list is fine if its **look** is right.

---

## § 0. Before you start

### 0.1 Where to save

Everything goes in `context/screenshots/`, one folder per section:

```text
context/screenshots/
  _old/          the previous design (ignore it)
  moodboard/     § 1 (done)
  foundations/   § 2
  layout/        § 3
  game/          § 4
  play/          § 5
  landing/       § 6
  duel/          § 7
  profile/       § 8
  archive/       § 9
  sign-in/       § 10
  pro/           § 11
  system/        § 12
  extra/         anything you love that fits nowhere else
  notes.md       your notes: what you liked, palette hex codes, font names, motion links
```

Create a folder when you first need it.

### 0.2 How to name files

`<number>-<what>-<letter>.png`. The number and the name come from each item below; the letter counts the variants you saved.

```text
game/05-timer-a.png
game/05-timer-b.png
game/05-timer-c.png
```

PNG, JPG and WEBP are all fine. **2 to 4 variants per item** is ideal. One great image beats five average ones.

### 0.3 How to save an image (Mac)

| You want | Do this |
| --- | --- |
| An image as it is | Right-click → **Save Image As…** |
| Part of the screen | **⌘ Cmd + ⇧ Shift + 4**, then drag a box. It lands on the Desktop |
| One window | **⌘ Cmd + ⇧ Shift + 4**, then press **Space**, then click the window |
| A whole long web page | In Chrome: **⌘ Cmd + ⌥ Option + I** → **⌘ Cmd + ⇧ Shift + P** → type `full size screenshot` → Enter |
| A phone-sized view of a website | In Chrome: **⌘ Cmd + ⌥ Option + I**, click the phone icon at the top left of the panel, pick "iPhone 14 Pro", then take a screenshot |

Then rename the file and move it into its folder.

### 0.4 The websites

All of these are free to browse. Some ask you to sign up with an email; none need a card.

| Website | Good for | Notes |
| --- | --- | --- |
| [neobrutalism.dev](https://www.neobrutalism.dev) | **Components in exactly our style** | Free, built on shadcn/ui (our base). Open "Components" in the menu; each page shows a live preview. Screenshot the preview |
| [Dribbble](https://dribbble.com) | **The best source for app screens and components** | Search "Shots". Filter by colour: after searching, open **Filters** → **Color** and pick a pastel |
| [Pinterest](https://www.pinterest.com) | Whole screens, colours, style boards | Free account needed. Click a pin, then "More like this" below it finds similar ones |
| [Behance](https://www.behance.net) | Full case studies, many screens of one app | Search, then filter by "UI/UX". One project often shows the desktop and the phone together |
| [21st.dev](https://21st.dev) | Real, live React components | Press **⌘ Cmd + K** to search. Most are soft, not brutal: use them for **layout** and pick ones with outlines when you can |
| [Uiverse](https://uiverse.io) | Buttons, toggles, checkboxes, loaders | Search `brutalist` together with the element: `brutalist button`, `brutalist input` |
| [Land-book](https://land-book.com) | Whole landing pages | Filter by style and colour |
| [Lapa Ninja](https://www.lapa.ninja) | Landing pages, by category | Categories at the top: "Game", "Sport", "App", "Education" |
| [One Page Love](https://onepagelove.com) | One-page sites | Good for the landing page's sections |
| [Godly](https://godly.website) and [Awwwards](https://www.awwwards.com) | Bold, award-winning sites | Good for motion links later. If Godly's link fails, search "godly website inspiration" |
| [shadcn/ui Blocks](https://ui.shadcn.com/blocks) | Clean app layouts (sign-in, dashboards, sidebars) | Layout only; the look comes from neobrutalism.dev |
| [Mobbin](https://mobbin.com) | Real app screens | **Very limited free plan.** Use it only if it shows what you need |
| [App Store](https://apps.apple.com) and [Google Play](https://play.google.com) | Real apps' screenshots | Search an app (FotMob, Duolingo, Chess.com) and save its screenshots |
| [Coolors](https://coolors.co/palettes/trending) | Colour palettes | Search `pastel`. Copy the hex codes into `notes.md` |
| [Realtime Colors](https://www.realtimecolors.com) | Seeing a palette on a real page | Optional: try a palette, then screenshot it |
| [Google Fonts](https://fonts.google.com) and [Fontshare](https://www.fontshare.com) | Free fonts | Write down names; no screenshots needed (see § 2.2) |
| [Google Stitch](https://stitch.withgoogle.com) | **Optional:** free AI-generated screens from a prompt | Needs a Google account; daily limits apply. Prompts are in § 13 |

**Real products worth screenshotting directly:**
- **In our style:** [Gumroad](https://gumroad.com).
- **Football:** [FotMob](https://www.fotmob.com), [Sofascore](https://www.sofascore.com), [Fantasy Premier League](https://fantasy.premierleague.com).
- **Games:** [Duolingo](https://www.duolingo.com), [Chess.com](https://www.chess.com), [Kahoot](https://kahoot.com), [Wordle](https://www.nytimes.com/games/wordle).

The football and game products are soft, not brutal: save them for **layout**, and write "layout only" in `notes.md`.

### 0.5 Search tips

- **Add a style word to almost every search** (see § 1's table): `neubrutalism`, `neo brutalism`, `bold outline`, `hard shadow`, `sticker`.
- **If a style search returns nothing useful,** drop the style word and search the plain term. A good layout in another style is still useful: save it and write "layout only".
- **Add a device word** to get the right size: `mobile app`, `web app`, `dashboard`, `landing page`.
- **On Dribbble, add `ui`** to every search, or you get logos and illustrations.
- **Capture both sizes when you can.** If a design shows desktop and phone, save both: `-a-desktop.png` and `-a-mobile.png`.

### 0.6 Rules for references

- They are **references only.** I build every screen in code; nothing you save is shipped in the app.
- Never save anything showing passwords or personal data.
- Club crests, player photos and brand logos in a reference are fine to look at. We never copy them.

---

## § 1. Moodboard ✅ done

Collected in `moodboard/`.

### Chosen direction: Matchday Sticker

Picked on 2026-11-14 from `brutal-01`, `brutal-02`, `other-01` and `other-02`:

- **Base:** a warm cream background, with white or pastel surfaces.
- **Colour blocks:** lavender, mint, butter yellow and coral, flat and soft. A lime pop like `other-01` is allowed as an accent.
- **Lines and depth:** thick dark outlines (about 2px) and **hard offset shadows** (a solid block shifted down-right, not a blur).
- **Type:** chunky, wide headings like `other-02` ("Live the Fantasy Football Dream!"), with a plain, readable text face.
- **Stickers:** small tilted tags ("Your turn", "Found", "Pro", "Practice") like the "NEW" and "PLAYING" tags in `brutal-02`.
- **Doodles:** a few black line doodles (a ball, a boot, motion lines, smileys) like `other-01`. Only on the landing page, empty states and 404.
- **Not this:** `game-01`'s flat clip-art objects.

**Style words for your searches:**

| Add | When |
| --- | --- |
| `neubrutalism` or `neo brutalism` | Almost always. It's the name of this style |
| `bold outline` and `hard shadow` | Buttons, cards, inputs, chips |
| `sticker` and `retro` | Tags, badges, the turn indicator, results |
| `cream` or `beige` | When the background comes back pure white or grey |
| `doodle` | Doodles, empty states, 404 |

The searches below already include these words. The plain terms after them are the fallback.

---

# Stage A — Foundations

Collect § 2 and § 3, then stop.

## § 2. Foundations

The building blocks every page shares.

### 2.1 Colour palette — **Must**
- **Need:** 2 or 3 palettes in the Matchday Sticker spirit. Each needs:
  - a cream background and an ink colour for text and outlines;
  - three or four pastel blocks;
  - a green (correct), an amber (warning) and a red or coral (critical, life lost).
- **The duel pair:** two colours clearly different for **you** and **your opponent**, never red against green. Lavender against butter yellow, for example, works. Coral against mint does not.
- **Save to:** `foundations/01-palette-a.png`, and paste the **hex codes** into `notes.md`.
- **Search:**
  - Coolors: open "Trending" and search `pastel`
  - Pinterest: `neubrutalism color palette`, `neo brutalism colors`, `pastel retro color palette`
  - Dribbble: `neubrutalism color palette`
- **Look for:** soft, not washed out. Text on every block must stay easy to read.

### 2.2 Typography — **Must**
- **Need:** the names of 2 fonts: a **chunky, wide one** for headings and big numbers (like `other-02`), and a **plain one** for text. No screenshots are needed; write the names in `notes.md`.
- **Try these first:**
  - Headings, on Fontshare: Clash Display, Cabinet Grotesk.
  - Headings, on Google Fonts: Bricolage Grotesque, Unbounded, Archivo (its Expanded and Black styles), Space Grotesk.
  - Text, on Fontshare: Satoshi, General Sans.
  - Text, on Google Fonts: DM Sans, Inter.
- **How to test a font:** in its preview box, type `İbrahimović Şahin Özil Łukasz Čech 0123456789`. If any letter looks different from the rest, or shows as a box, skip the font: our player names need these letters.
- **Optional:** Pinterest `neubrutalism typography`, `chunky font poster`.

### 2.3 Big numbers — **Nice**
- **Need:** large, chunky numerals, for the clock and scores.
- **Save to:** `foundations/03-numerals-a.png`
- **Search:** Pinterest `chunky numbers typography`, `retro scoreboard numbers`; Dribbble `neubrutalism numbers`, `big numbers ui`

### 2.4 Buttons — **Must**
- **Need:** primary, secondary, quiet, disabled, icon button, a large call-to-action, and the **pressed** state (the shadow shrinks as the button moves down).
- **Save to:** `foundations/04-buttons-a.png`
- **Search:**
  - neobrutalism.dev: Button
  - Uiverse: `brutalist button`
  - Dribbble: `neubrutalism buttons`, `neo brutalism ui kit`
  - Fallback: Dribbble `button styles ui kit`

### 2.5 Inputs and form controls — **Must**
- **Need:**
  - a text input with a label and an error;
  - a search box;
  - a checkbox and a toggle switch;
  - a segmented control (two or three options in one pill).
- **Save to:** `foundations/05-inputs-a.png`
- **Search:**
  - neobrutalism.dev: Input, Checkbox, Switch, Tabs
  - Uiverse: `brutalist input`, `brutalist toggle`, `brutalist checkbox`
  - Dribbble: `neubrutalism form`, `neo brutalism input`

### 2.6 Cards and surfaces — **Must**
- **Need:** how cards sit on the page: outline weight, shadow offset, corner roundness, padding, and a card on a coloured block.
- **Save to:** `foundations/06-cards-a.png`
- **Search:** neobrutalism.dev Card; Dribbble `neubrutalism card`, `neo brutalism cards pastel`; Pinterest `neubrutalism card ui`

### 2.7 Chips, tags and stickers — **Must**
- **Need:** rounded chips, including ones with a small logo inside, and **tilted sticker tags**. These become the filter chips, the "Pro", "Practice" and "Friend" tags, and "Your turn".
- **Save to:** `foundations/07-chips-a.png`
- **Search:**
  - neobrutalism.dev: Badge
  - Dribbble: `neubrutalism badges`, `sticker tags ui`, `retro sticker labels`
  - Pinterest: `sticker label design retro`

### 2.8 Icons in use — **Nice**
- **Icon set:** Lucide is decided; browse [lucide.dev](https://lucide.dev) to see the style. Nothing to save there.
- **Need:** icons used well in this style: inside outlined buttons, in a nav, beside stats.
- **Save to:** `foundations/08-icons-a.png`
- **Search:** Dribbble `neubrutalism icons`, `icon button outline hard shadow`

### 2.9 Avatars and initials — **Must**
- **Need:** round avatars with an outline, including **initials** when there's no photo, plus an empty placeholder. Used for players and for your profile.
- **Save to:** `foundations/09-avatars-a.png`
- **Search:** neobrutalism.dev Avatar; Dribbble `neubrutalism avatar`, `avatar initials ui`

### 2.10 Logo and wordmark — **Nice**
- **Need:** wordmark styles you like for the "Lineup" name.
- **Save to:** `foundations/10-wordmark-a.png`
- **Search:** Pinterest `neubrutalism logo`, `chunky wordmark logo`, `sticker logo design`; Dribbble `bold wordmark sport`

### 2.11 Doodles — **Nice**
- **Decided:** black line doodles like `moodboard/other-01` (a ball, a boot, motion lines, smileys), not flat illustrations.
- **Need:** doodle sets whose line weight and mood you like, for the landing page, empty states and 404.
- **Save to:** `foundations/11-doodles-a.png`
- **Search:** Dribbble `football doodle`, `sport doodle line icons`, `hand drawn doodle ui`; Pinterest `football doodle line art`, `hand drawn sport doodles`

## § 3. Layout (shared across pages)

### `SiteNav` — the top bar on site pages — **Must**
- **Today:** the wordmark on the left; Archive, your account and a Play button on the right. Below a certain width, the account becomes a person icon.
- **Need:** a desktop header and its phone version (with a menu if it has one).
- **Save to:** `layout/01-header-desktop-a.png`, `layout/02-header-mobile-a.png`
- **Search:**
  - Dribbble: `neubrutalism navbar`, `neubrutalism website header`, `neubrutalism mobile menu`
  - neobrutalism.dev: Menubar, Sheet (for the phone menu)
  - Gumroad: its top bar

### `SiteFooter` — **Must**
- **Today:** one short line, and on `/` a closing statement with a Play button.
- **Need:** small, tidy footers. Not the big four-column ones.
- **Save to:** `layout/03-footer-a.png`
- **Search:** Dribbble `neubrutalism footer`, `minimal footer website`; 21st.dev `footer`

### Page title area — **Nice**
- **Need:** how a page opens: a title, a short line and maybe an action.
- **Save to:** `layout/04-page-title-a.png`
- **Search:** Dribbble `neubrutalism page header`, `neubrutalism dashboard`

### `QuitDialog` and other dialogs — **Must**
- **Today:** "Quit this run?", "Forfeit this duel?", "Practise now?", each with a confirm and a cancel.
- **Save to:** `layout/05-dialog-a.png`
- **Search:** neobrutalism.dev Dialog; Dribbble `neubrutalism modal`, `neo brutalism dialog`

### `FeedbackToast` — small messages — **Must**
- **Today:** "Already named" and "Not in this XI".
- **Save to:** `layout/06-toast-a.png`
- **Search:** neobrutalism.dev Sonner; Dribbble `neubrutalism toast`, `neubrutalism notification`

### Loading placeholders (skeletons) — **Nice**
- **Save to:** `layout/07-skeleton-a.png`
- **Search:** neobrutalism.dev Skeleton; Dribbble `skeleton loading ui`

### `ProLock` — a locked Pro feature — **Must**
- **Today:** the feature is shown but locked, with a short line and a "See Pro" link. It applies to Create room, Practice, the archive, the missed-XI reveal and picking a match.
- **Save to:** `layout/08-locked-a.png`
- **Search:** Dribbble `neubrutalism premium`, `neubrutalism pricing card`, `locked feature ui`, `upgrade to pro card`

### Empty and error states — **Must**
- **Today:** "No match fits. Try fewer words…", "Couldn't load…" with Try again. Never a dead end.
- **Save to:** `layout/09-empty-state-a.png`, `layout/10-error-state-a.png`
- **Search:** Dribbble `neubrutalism empty state`, `doodle empty state`, `error state ui`

> ✋ **End of stage A.** Tell me **"foundations ready"**. I build the palette, type, components and layout with a `/dev` preview page; you review it before stage B.

---

# Stage B — The game screen

## § 4. The game screen `/play/solo` and `/play/duel`

The most important screen. Solo and duel share it: the scoreboard, the 11 slots, the clock, the lives and the guess box. **Collect the most here.**

- **Whole screen (Must, desktop and phone):** game and quiz screens, and football lineup screens.
- **Save to:** `game/00-desktop-a.png`, `game/00-mobile-a.png`
- **Search:**
  - Dribbble: `neubrutalism game ui`, `neubrutalism quiz app`, `neo brutalism mobile game`
  - Fallback: Dribbble `quiz game screen ui`, `football lineup app ui`, `soccer formation ui`
  - Pinterest: `neubrutalism app ui`, `football lineup ui`, `quiz app game screen`
  - Real apps, layout only: FotMob (a match's "Lineup" tab), Sofascore lineups, Fantasy Premier League ("Pick Team"), Duolingo (a lesson screen)

### Components

#### `MatchHeader` — the scoreboard — **Must**
- **Today:** both crests and names, the score, the competition and the date; the side you're naming is emphasised.
- **Save to:** `game/01-scoreboard-a.png`
- **Search:** Dribbble `neubrutalism scoreboard`, `retro scoreboard ui`, `match score card ui`; Real, layout only: the FotMob and Sofascore match header

#### `SquadGrid` and `Pitch` — the 11 slots in formation — **Must**
- **Today:** a drawn pitch with 11 slots placed by position (goalkeeper, defenders, midfielders, forwards).
- **Need:** a flat pitch drawn with outlines, in a pastel green or mint.
- **Save to:** `game/02-pitch-a.png`
- **Search:**
  - Dribbble: `football pitch outline illustration`, `flat football pitch`, `soccer formation ui`
  - Pinterest: `football pitch line art`, `football tactics board flat`
  - Real, layout only: FotMob lineups, Fantasy Premier League

#### `SquadSlot` — one slot, empty and found — **Must**
- **Today:** empty, it shows a position (DF, MF…); found, it shows the photo or initials and the name. In a duel it carries the finder's colour.
- **Save to:** `game/03-slot-a.png`
- **Search:** Dribbble `neubrutalism profile card`, `sticker player card`, `fantasy football player card`, `avatar with name label`

#### `RevealCard` — the moment a player is found — **Must**
- **Save to:** `game/04-reveal-a.png`
- **Search:** Dribbble `neubrutalism success`, `achievement sticker ui`, `correct answer ui`
- **Motion links:** if you see an animation you love, paste its link into `notes.md` under "Motion".

#### `CountdownRing` — the 15-second clock — **Must**
- **Today:** a ring plus a big number. It changes through three stages: normal, warning (7 s) and critical (3 s).
- **Save to:** `game/05-timer-a.png`
- **Search:** Dribbble `neubrutalism timer`, `neubrutalism progress`, `countdown timer ui`, `circular progress timer`

#### `Lives` and `LivesCard` — three lives — **Must**
- **Today:** three small shirts that empty as lives go. In a duel, the card switches between you and your opponent.
- **Save to:** `game/06-lives-a.png`
- **Search:** Dribbble `neubrutalism game hud`, `retro game lives ui`, `hearts counter ui`

#### Turn indicator — you vs your opponent — **Must**
- **Need:** a very clear "your turn / their turn", with two colours that never get confused. A sticker tag is a good fit.
- **Save to:** `game/07-turn-a.png`
- **Search:** Dribbble `neubrutalism versus`, `player vs player ui`, `turn indicator game`, `sticker badge ui`

#### `GuessInput` and `SuggestionList` — the guess box — **Must**
- **Today:** type a name; up to 5 suggestions with photo and name appear; already-named rows are dimmed. A "Not in this XI" guess shakes the box.
- **Save to:** `game/08-guess-a.png`
- **Search:** neobrutalism.dev Combobox, Command; Dribbble `neubrutalism search`, `neubrutalism autocomplete`, `search autocomplete ui`

#### Answer feedback — **Must**
- **Today:** "Already named" pulses the slot; "Not in this XI" shakes the input. They must look different.
- **Save to:** `game/09-feedback-a.png`
- **Search:** Dribbble `neubrutalism quiz`, `quiz feedback correct wrong`, `wrong answer ui`

#### `LifeLostFlash` — losing a life — **Nice**
- **Save to:** `game/10-life-lost-a.png`
- **Search:** Dribbble `neubrutalism game over`, `life lost game ui`

#### `CanvasGate` and `SidePickCard` — the overlay and "pick your side" — **Must**
- **Today:** the pitch is dimmed with a card on top: pick the home or away team, or a message with actions ("Back to play", "See Pro").
- **Save to:** `game/11-overlay-a.png`, `game/12-pick-side-a.png`
- **Search:** Dribbble `neubrutalism choose option`, `choose team ui`, `team selection card`, `match card ui`

#### `PracticeCard` — practice runs (no clock, no lives) — **Nice**
- **Save to:** `game/13-info-card-a.png`
- **Search:** neobrutalism.dev Alert; Dribbble `neubrutalism info card`

#### `QuitChip` and `SoundToggle` — the only controls during a game — **Must**
- **Save to:** `game/14-controls-a.png`
- **Search:** Dribbble `neubrutalism icon buttons`, `game pause button ui`

#### `RunSummary` — the end of a solo run — **Must**
- **Today:** named vs missed, accuracy, streak, time per round; "Perfect clear" when all 11 are named; Play again.
- **Save to:** `game/15-results-a.png`
- **Search:** Dribbble `neubrutalism results`, `neubrutalism stats card`, `quiz results screen`; Real, layout only: the Duolingo lesson-complete screen, the Wordle stats

#### `NamedOrder` — the list of players in the order you named them — **Must**
- **Save to:** `game/16-named-list-a.png`
- **Search:** Dribbble `neubrutalism list`, `neubrutalism leaderboard`, `ranked list ui`

#### `MissedReveal` — Pro: show the players you missed — **Nice**
- **Save to:** `game/17-reveal-missed-a.png`
- **Search:** Dribbble `reveal answers ui`, `show answers button quiz`

> ✋ **End of stage B.** Tell me **"game ready"**.

---

# Stage C — Play

## § 5. Page: Play `/play`

Where you choose Solo or Duel and set the filters before starting.

- **Whole page (Must):** game setup and settings screens.
- **Save to:** `play/00-page-a.png`
- **Search:** Dribbble `neubrutalism settings`, `neubrutalism onboarding`, `game setup screen ui`, `quiz settings ui`

### Components

#### `ModeChoice` — Solo or Duel — **Must**
- **Need:** two big selectable cards, one picked.
- **Save to:** `play/01-mode-cards-a.png`
- **Search:** neobrutalism.dev Radio Group; Dribbble `neubrutalism selection cards`, `selectable cards ui`, `radio card ui`

#### `FilterPanel` — competition, club and seasons — **Must**
- **Today:**
  - one competition, chosen from logo chips;
  - clubs, with a search and chips;
  - a season range ("from" and "to").
- **Save to:** `play/02-filters-a.png`, `play/03-range-a.png`
- **Search:**
  - neobrutalism.dev: Combobox, Select, Slider, Badge
  - Dribbble: `neubrutalism filter`, `filter chips ui`, `range slider ui`, `year range selector`
  - Pinterest: `filter ui design app`

#### `PracticeToggle` — "Practice: no clock, no lives, not saved" — **Nice**
- **Save to:** `play/04-toggle-a.png`
- **Search:** neobrutalism.dev Switch, Checkbox; Dribbble `settings toggle row ui`

#### `SoloAllowanceNote` — "3 of 5 solo runs left today" — **Must**
- **Need:** a small, friendly usage meter or line.
- **Save to:** `play/05-usage-a.png`
- **Search:** neobrutalism.dev Progress; Dribbble `neubrutalism progress bar`, `credits remaining ui`, `daily limit progress`

#### `PlayStart` — the Start button — **Must**
- **Save to:** `play/06-start-a.png`
- **Search:** Uiverse `brutalist button`; Dribbble `neubrutalism cta button`, `play button ui game`

#### `RoomControls` — Create room, or type a code and Join — **Must**
- **Save to:** `play/07-join-code-a.png`
- **Search:** neobrutalism.dev Input OTP; Dribbble `join with code ui`, `enter invite code`

> ✋ **End of stage C.** Tell me **"play ready"**.

---

# Stage D — Home

## § 6. Page: Home `/`

The marketing page: the statement, a live demo turn, then the sections.

- **Whole-page references (Must):** 2 to 4 full landing pages you love. Use the full-page screenshot trick from § 0.3.
- **Save to:** `landing/00-page-a.png`
- **Search:**
  - Dribbble: `neubrutalism landing page`, `neo brutalism website pastel`, `neubrutalism game landing`
  - Pinterest: `neubrutalism website`, `neubrutalism landing page pastel`
  - Gumroad: its home page
  - Land-book and Lapa Ninja: categories "Game", "Sport", "App"; search `brutalism`, `game`, `football`

### Components

#### `HomeFold` — the first screen: statement, Play button, demo beside it — **Must**
- **Save to:** `landing/01-hero-a.png`
- **Search:** Dribbble `neubrutalism hero section`, `neubrutalism hero sticker`, `hero section app demo`

#### `ShowcaseFrame` — the demo turn inside a frame — **Must**
- **Today:** a small live game (scoreboard, pitch, the typed guess) shown in a frame.
- **Need:** products shown in an outlined browser or phone frame, or floating cards.
- **Save to:** `landing/02-demo-frame-a.png`
- **Search:** Dribbble `neubrutalism browser mockup`, `neubrutalism app preview`, `app preview floating cards`

#### `HomeArchive` — the archive tiles — **Must**
- **Today:** numbers about the match pool (how many matches, competitions, eras), with logos.
- **Save to:** `landing/03-stats-tiles-a.png`
- **Search:** Dribbble `neubrutalism bento`, `neubrutalism stats section`, `bento grid features`

#### `HomeRules` — "how it plays" — **Must**
- **Today:** three big numbers with a line each (11 starters to name, 15 seconds a turn, 3 lives), each with a small game mark.
- **Save to:** `landing/04-how-it-works-a.png`
- **Search:** Dribbble `neubrutalism features section`, `neubrutalism how it works`, `3 steps section ui`

#### `HomeModes` — Solo and Duel panels — **Must**
- **Today:** two panels side by side, each with a button ("Play solo", "Find a duel", "Play a friend").
- **Save to:** `landing/05-modes-a.png`
- **Search:** Dribbble `neubrutalism two cards`, `game mode selection ui`, `two option cards website`

#### `HomeInside` — competitions and clubs inside — **Nice**
- **Today:** competition logos and club crests with counts.
- **Save to:** `landing/06-logo-wall-a.png`
- **Search:** neobrutalism.dev Marquee; Dribbble `neubrutalism marquee`, `logo wall section`

#### Closing call to action — **Nice**
- **Save to:** `landing/07-cta-a.png`
- **Search:** Dribbble `neubrutalism cta section`, `neubrutalism footer cta`

> ✋ **End of stage D.** Tell me **"home ready"**.

---

# Stage E — Duel

## § 7. Duel extras `/play/duel`

The duel uses the game screen from § 4, plus these.

#### `LobbyPanel`: searching for an opponent — **Must**
- **Save to:** `duel/01-searching-a.png`
- **Search:** Dribbble `neubrutalism loading screen`, `matchmaking screen ui`, `searching for opponent`

#### Opponent found — **Must**
- **Need:** both players shown together (a "versus" moment).
- **Save to:** `duel/02-versus-a.png`
- **Search:** Dribbble `neubrutalism versus`, `vs screen game ui`, `versus card ui`

#### Filters and the coin flip — **Must**
- **Today:** both players' filters are shown; one is picked at random, and the screen says whose won.
- **Save to:** `duel/03-coin-flip-a.png`
- **Search:** Dribbble `neubrutalism comparison`, `coin flip ui`, `comparison cards ui`

#### Room waiting — a private room's code — **Must**
- **Today:** a big 6-character code, Copy code and Copy link, and "Closes in 9:41".
- **Save to:** `duel/04-room-code-a.png`
- **Search:** Dribbble `neubrutalism invite`, `room code game lobby`, `invite friends code screen`, `share link ui`

#### Join refused — **Nice**
- **Today:** a wrong, full or own code, said plainly.
- **Save to:** `duel/05-join-error-a.png`
- **Search:** neobrutalism.dev Alert; Dribbble `invalid code ui`

#### `ReconnectChip` and the reconnecting overlay — **Must**
- **Today:** "Reconnecting, 18s" for the opponent, and a countdown overlay for you.
- **Save to:** `duel/06-reconnecting-a.png`
- **Search:** Dribbble `reconnecting ui`, `connection lost ui`, `offline banner ui`

#### `DuelResultPanel` — win, loss, draw, forfeit — **Must**
- **Save to:** `duel/07-result-a.png`
- **Search:** Dribbble `neubrutalism win screen`, `victory screen ui`, `win lose screen game`

> ✋ **End of stage E.** Tell me **"duel ready"**.

---

# Stage F — Profile

## § 8. Page: Profile `/profile`

- **Whole page (Must, desktop and phone):** profile and stats pages.
- **Save to:** `profile/00-page-a.png`
- **Search:** Dribbble `neubrutalism profile`, `neubrutalism dashboard`, `user profile stats page`; Real, layout only: a Chess.com profile, a Duolingo profile

### Components

#### `ProfileHeader` and `ProfilePlan` — **Must**
- **Today:** the handle, and the plan line ("You're on Pro." or "You're on the Free plan. See Pro").
- **Save to:** `profile/01-header-a.png`
- **Search:** Dribbble `neubrutalism profile header`, `user card with badge`

#### `GuestUpgrade` — **Must**
- **Today:** "You're playing as a guest. Create an account to keep your history on any device. Nothing you've played is lost."
- **Save to:** `profile/02-upgrade-a.png`
- **Search:** neobrutalism.dev Alert; Dribbble `neubrutalism banner`, `create account prompt ui`

#### `DuelRecord` — won, drawn, lost — **Must**
- **Save to:** `profile/03-record-a.png`
- **Search:** Dribbble `neubrutalism stats`, `win loss stats ui`, `stacked bar stats card`

#### `ProfileStats` — solo runs, perfect clears, best streak, accuracy, favourite club — **Must**
- **Save to:** `profile/04-stats-a.png`
- **Search:** Dribbble `neubrutalism stat cards`, `neubrutalism kpi`, `stats cards dashboard`

#### `HistoryList`, `HistoryRow` and `HistoryMore` — past games — **Must**
- **Today:** each row has the mode, the result, the score, the match, how many were named, the lives left and when. Show more loads more.
- **Save to:** `profile/05-history-a.png`
- **Search:** neobrutalism.dev Table; Dribbble `neubrutalism table`, `neubrutalism list`, `match history ui`; Real, layout only: Chess.com game history

> ✋ **End of stage F.** Tell me **"profile ready"**.

---

# Stage G — Archive

## § 9. Page: Archive `/archive` (Pro)

- **Whole page (Must):** search pages with results lists.
- **Save to:** `archive/00-page-a.png`
- **Search:** Dribbble `neubrutalism search results`, `neubrutalism list view`, `search results page filters`; Real, layout only: FotMob fixtures, Sofascore results

### Components

#### Search box — **Must**
- **Save to:** `archive/01-search-a.png`
- **Search:** Uiverse `brutalist input`; Dribbble `neubrutalism search bar`

#### `ArchiveFilters` — filters behind a button — **Must**
- **Save to:** `archive/02-filters-a.png`
- **Search:** neobrutalism.dev Popover, Sheet, Drawer; Dribbble `neubrutalism filter`, `filter drawer ui`

#### `ArchiveRow` — one match — **Must**
- **Today:** the date, both teams with crests, the score, the competition and stage, then Play and Practise.
- **Save to:** `archive/03-row-a.png`
- **Search:** Dribbble `neubrutalism list item`, `fixtures list ui`, `match list ui`; Real, layout only: FotMob, Sofascore

#### Locked archive (Free) — **Nice**
- Uses the § 3 `ProLock` references. Save page-level examples only if you find something special: `archive/04-locked-a.png`.

> ✋ **End of stage G.** Tell me **"archive ready"**.

---

# Stage H — The rest

## § 10. Page: Sign in `/sign-in`

- **Whole page (Must):** sign-in pages you like, with or without a doodle beside the form.
- **Save to:** `sign-in/00-page-a.png`
- **Search:** Dribbble `neubrutalism login`, `neubrutalism sign up`; Pinterest `neubrutalism login page`; Gumroad: its log-in page

### Components

#### `ModeSwitch` — Sign in or Sign up — **Nice**
- **Save to:** `sign-in/01-switch-a.png`
- **Search:** neobrutalism.dev Tabs; Dribbble `login signup tabs`

#### `SignInForm` and `SignUpForm` (`AuthForm`, `AuthField`) — **Must**
- **Need:** fields with labels, an error under a field, and a busy submit button.
- **Save to:** `sign-in/02-form-a.png`
- **Search:** Dribbble `neubrutalism form`, `form validation error ui`

#### `ContinueAsGuest` — **Must**
- **Need:** a clear second option ("Play as a guest") beside the main form.
- **Save to:** `sign-in/03-guest-a.png`
- **Search:** Dribbble `continue as guest login`, `login options ui`

#### `SignedInPanel` — when you're already signed in — **Nice**
- **Save to:** `sign-in/04-signed-in-a.png`
- **Search:** Dribbble `neubrutalism account card`, `signed in state ui`

## § 11. Page: Pro `/pro`

- **Today:** "Lineup Pro", one line, a Free vs Pro table, then Get Pro (or "You have Pro.").
- **Save to:** `pro/01-pricing-a.png`
- **Search:** Dribbble `neubrutalism pricing`, `neubrutalism comparison table`, `free vs pro comparison`; Gumroad: its pricing page

## § 12. System states

| Item | Today | Save to | Search |
| --- | --- | --- | --- |
| Not found (404) — **Must** | The built-in page | `system/01-404-a.png` | Dribbble `neubrutalism 404`, `doodle 404 page` |
| Update required — **Nice** | "Update Lineup to keep playing" | `system/02-update-a.png` | Dribbble `app update required screen` |
| Rate limited — **Nice** | Input locked briefly, with a reason | `system/03-rate-limit-a.png` | Dribbble `too many attempts ui`, `cooldown ui` |
| Empty filter result — **Nice** | "No match in those seasons" and "Include every season" | `system/04-no-results-a.png` | Dribbble `neubrutalism no results`, `doodle no results` |

> ✋ **End of stage H.** Tell me **"rest ready"**.

---

## § 13. Optional: AI mockups with Google Stitch

Use it in any stage, for that stage's screen. Free AI screens are a quick way to see ideas; they're references, like the rest. Open [stitch.withgoogle.com](https://stitch.withgoogle.com), paste a prompt, then screenshot what you like into the matching folder as `ai-01.png`, `ai-02.png` and so on.

Start each prompt with the **style line**:

```text
Neubrutalism UI on a warm cream background. Flat pastel blocks in lavender, mint, butter yellow and coral, thick black 2px outlines, hard offset shadows, rounded corners, chunky wide headings, small tilted sticker tags, a few black line football doodles, Lucide-style line icons. A football trivia game called "Lineup".
```

| Stage | Screen | Prompt (after the style line) | Save to |
| --- | --- | --- | --- |
| B | Game (desktop) | `Football quiz game screen, desktop. A scoreboard header (two crests, score 3–3, "Champions League final, 25 May 2005"). A football pitch with 11 player slots in a 4-4-2 formation, some revealed with names and initials, others empty showing their position. A side panel with a 15-second circular countdown, three lives as small shirts, a "Your turn" sticker, and a guess input with autocomplete suggestions.` | `game/ai-01.png` |
| B | Game (phone) | The same prompt, ending with `, mobile phone layout` | `game/ai-02.png` |
| B | Results | `Quiz results card: "Run ended", 7 of 11 named, accuracy, best streak, time per round, the list of named players in order, and buttons Play again and Back to play.` | `game/ai-03.png` |
| C | Play | `Game setup page. Two big selectable cards, Solo and Duel. Below: filters with competition chips with logos, a club search with chips, a season range. A large Start button with "3 of 5 solo runs left today" under it.` | `play/ai-01.png` |
| D | Home | `Landing page. Headline "Know the XI. Beat the Clock." with a Play button, and beside it a small live game preview in an outlined browser frame. Then sections: match archive stats with competition logos, three rules (name the starting eleven, 15 seconds per turn, three lives), and two mode cards: Solo and Duel.` | `landing/ai-01.png` |
| E | Duel lobby | `Online 1v1 matchmaking screen: "Finding an opponent…", then a versus card with both player names, then a private room screen with a big 6-character code, Copy code and Copy link buttons, and "Closes in 9:41".` | `duel/ai-01.png` |
| F | Profile | `Player profile page: handle and plan badge, a won/drawn/lost record with a bar, stat cards (solo runs, perfect clears, best streak, accuracy, favourite club), and a match history list.` | `profile/ai-01.png` |
| G | Archive | `Searchable match archive: a search box, a Filters button, and a list of football matches (date, two teams with crests, score, competition and stage), each with Play and Practise buttons.` | `archive/ai-01.png` |

---

## § 14. Besides screenshots

Write these in `context/screenshots/notes.md` as you go:

| What | Why I need it |
| --- | --- |
| **Palette hex codes** (§ 2.1) | Exact colours, not guessed from an image |
| **Font names** (§ 2.2) | So I load the fonts you chose |
| **Motion links:** Dribbble shots, 21st.dev components or sites whose animation you love | Motion comes last; the links tell me what "feels right" |
| **One line per image you want to explain:** "game/05-timer-b: love the thick ring", "landing/00-page-c: layout only" | So I copy the right part of each reference |
| **Anything you dislike** | Just as useful as what you like |

---

## Checklist

- [x] § 1 Moodboard (Matchday Sticker chosen)
- [ ] **Stage A:** § 2 Foundations (palette hex and font names in `notes.md`) and § 3 Layout → "foundations ready"
- [ ] **Stage B:** § 4 Game screen (desktop **and** phone) → "game ready"
- [ ] **Stage C:** § 5 Play → "play ready"
- [ ] **Stage D:** § 6 Home → "home ready"
- [ ] **Stage E:** § 7 Duel → "duel ready"
- [ ] **Stage F:** § 8 Profile → "profile ready"
- [ ] **Stage G:** § 9 Archive → "archive ready"
- [ ] **Stage H:** § 10 Sign in, § 11 Pro and § 12 System → "rest ready"
