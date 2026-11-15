# Redesign A1 — Theme

## Status

Completed

## Goals

The first part of redesign stage A (`context/docs/ui-redesign-references.md`): the new palette, type roles and shape tokens go live **app-wide**, through the existing role layer. No new packages. Page layouts and the bespoke game pieces keep their current design until their own stage; this phase only makes sure nothing becomes hard to read on the new light background.

- **Light, not dark.** `globals.css` `color-scheme` becomes `light`. The `--pitch-*` and Floodlight primitives in `tokens.css` are replaced by the chosen palettes (`context/screenshots/notes.md` § Palette), named by colour, not by role:
  - palette a: `--cream #fefae0`, `--peach-cream #faedcd`, `--sage-pale #e9edc9`, `--sage #ccd5ae`, `--caramel #d4a373`
  - palette b: `--lavender #c4b5fd`, `--mint #a7e3c4`, `--butter #ffd972`, `--coral #ff9f8a`
  - palette c: `--duel-blue #7fb2f5`, `--duel-orange #ff9e6d`
  - palette d: `--status-green #4caf6e`, `--status-amber #ffb938`, `--status-red #f0564a`
  - ink: `--ink #1f1b16`, plus `--white #ffffff`
- **The role layer (`theme.css`) is remapped.** Every component keeps using the same role names, so the whole app changes from here.

  | Role | Value | Notes |
  | --- | --- | --- |
  | `surface` | cream | Page background |
  | `surface-raised` | peach-cream | Raised panels, the rail |
  | `surface-card` | white | Cards, inputs, dialogs (open question 1) |
  | `surface-sage` (new) | sage-pale | Soft panels |
  | `line` | ink | **Outlines**: buttons, inputs, cards, chips |
  | `rule` (new) | `color-mix(in oklch, var(--ink) 18%, var(--cream))` | Quiet dividers between rows, where a 2px ink line would be heavy |
  | `marking` | sage | Pitch lines until stage B redraws the pitch |
  | `fg` | ink | Text |
  | `fg-muted` | `#5e554c` | ≥ 6:1 on every surface |
  | `fg-dim` | `#8a7f73` | ≥ 3.2:1; large text, placeholders and disabled only, as today |
  | `on-accent` | ink | Text on every pastel fill (≥ 5:1 on all of them) |
  | `brand` | lavender | Primary buttons and brand fills (open question 2) |
  | `you` / `opponent` | duel-blue / duel-orange | **Fills only** |
  | `found` / `warning` / `danger` | status green / amber / red | **Fills only** |
  | `block-lavender`, `block-mint`, `block-butter`, `block-coral`, `accent-caramel` (new) | palette b and caramel | Coloured blocks and sections for the page stages |
  | `focus` (new) | ink | The focus ring |
  | `skeleton-fill` | sage-pale | |
  | `gate-scrim` | `color-mix(in oklch, var(--ink) 40%, transparent)` | |

- **Readable text shades for the coloured roles.** The pastel fills are only about 2:1 on cream, so they can't be text. New roles carry the same hue, darkened to ≥ 4.5:1 on cream, peach-cream, white and sage-pale (measured):

  | New role | Value | For |
  | --- | --- | --- |
  | `you-text` | `#0c64d7` | Text in your colour |
  | `opponent-text` | `#bc3f00` | Text in the opponent's colour |
  | `found-text` | `#317649` | Correct-answer text |
  | `warning-text` | `#915e00` | Cooldown and reconnect text |
  | `danger-text` | `#cf1a0c` | Errors, life-lost text |

  Every `text-you`, `text-opponent`, `text-found`, `text-warning` and `text-danger` in the app (18 files today) moves to its `-text` role. Fills (`bg-*`) and outlines keep the pastel roles.
- **Shape tokens.**
  - `--border-width: 2px` (was 1px); outlines use it.
  - **Hard offset shadow:** `--shadow-offset: 4px` and `--shadow-offset-sm: 2px`, solid ink, no blur. Tailwind `@theme`: `--shadow-hard` and `--shadow-hard-sm`.
  - **Radius:** `sm 6px`, `md 10px`, `lg 16px`, `full` (open question 3).
- **Type roles.** Archivo (headings, numbers) and Inter (text) are already loaded; Archivo already has its width axis. The roles from `notes.md` § Fonts become shared class constants in `src/styles/classes.ts`:

  | Constant | Archivo weight | Width | Size |
  | --- | --- | --- | --- |
  | `TYPE_DISPLAY` | 800 | 112, 125 from `md` | 34px, 72px from `md`, line height 1 |
  | `TYPE_TITLE` | 800 | 112 | 30px, 40px from `md` |
  | `TYPE_SECTION` | 800 | 112 | 24px, 28px from `md` |
  | `TYPE_CARD_TITLE` | 800 | 112 | 20px |
  | `TYPE_TITLE_LONG` | 700 | 100 | 20px, for titles over ~20 characters |
  | `TYPE_NUMBER` | 900 | 125, `tabular-nums`, `slashed-zero` | set per use |
  | `TYPE_STICKER` | 800 | 112, uppercase | 12px |

  Width uses Tailwind's `font-stretch-*` utilities. New size tokens: 28, 30, 34, 40, 72 (the 12–64 scale stays). Body text stays Inter 16px, line height 1.5.
- **Shared classes restyled** (`classes.ts`), so the existing buttons and inputs take the neo-brutal look everywhere at once:
  - `PRIMARY_BUTTON` / `PRIMARY_BUTTON_LARGE`: `brand` fill, 2px `line` outline, `shadow-hard`; on press it moves by the offset and loses the shadow. Ink text.
  - `SECONDARY_BUTTON` / `SECONDARY_BUTTON_LARGE`: `surface-card` fill, same outline, shadow and press.
  - `TEXT_INPUT`, `FILTER_SEARCH`, `FILTER_SELECT`: `surface-card`, 2px outline, no shadow; `aria-invalid` uses `danger`.
  - `FILTER_CHIP`: outlined pill; pressed = `brand` fill.
  - `QUIT_CHIP`, `SOUND_TOGGLE`, `DOT_BUTTON`, `DEV_PREVIEW_BUTTON`, `NAV_LINK`, `TEXT_LINK`: outline and colour updates only.
  - `FOCUS_RING`: `outline-focus` (ink). Lavender is under 2:1 on cream and fails as a focus ring (WCAG 2.4.13).
  - Where a press moves an element, `prefers-reduced-motion` keeps the shadow change and drops the shift.
- **Readability pass, app-wide.** Every route is checked on the light theme (desktop and 375px):
  - nothing unreadable, no invisible borders, no dark-only leftovers;
  - **in scope:** colour, outline and text-shade fixes;
  - **out of scope:** layout changes and the redesign of game pieces (stage B and later).
- **The clock's three stages stay distinct.** In a duel, the opponent's normal stage (orange) sits close to the warning stage (amber). Until stage B redraws the ring, the stages keep today's other cues (the numeral, the critical pulse), and the ring's stroke reads `warning` and `danger` unchanged. Stage B owns the final fix.
- **Contrast suite** (`src/styles/contrast.ts` and its test):
  - **Text pairs:**
    - `fg` and `fg-muted` on every surface: ≥ 4.5;
    - the five `-text` roles on every surface: ≥ 4.5;
    - `on-accent` on `brand`, the duel fills, the status fills and the four blocks: ≥ 4.5.
  - **Non-text:** `line` and `focus` against every surface: ≥ 3 (WCAG 1.4.11).
  - The exceptions list is re-checked; anything no longer needed is removed.
- **`/dev/theme`** shows the new primitives, roles, `-text` shades, shape tokens (outline, shadow, radius) and each type role with real copy ("Know the XI. Beat the Clock.", "Perfect clear", `İbrahimović Şahin Özil Łukasz Čech 0123456789`, a 15 and a 3–3 in `TYPE_NUMBER`).

## Out of Scope

- New packages and neobrutalism.dev components (A2).
- Nav, footer, wordmark, `ProLock`, empty and error states (A3).
- Any page layout, or the pitch, ring, lives, slots, scoreboard and reveal designs (stage B and later).
- Motion.

## Open Questions

1. **Cards: white or peach-cream?** Default white (`#ffffff`), as in `moodboard/brutal-01`; peach-cream is softer but close to the page.
2. **Primary button colour.** Default lavender (palette b). Butter or mint are the alternatives.
3. **Corner radius.** Default 10px (`md`), between neobrutalism.dev's 5px and the moodboard's rounder cards.

## Notes

- **References:**
  - `context/docs/ui-redesign-references.md` (Stage A);
  - `context/screenshots/notes.md` (Palette, Fonts, per-image notes);
  - `context/theme.md` § Rules (linear clock, three stages, colourblind-safe pair, colour never alone).
- **Measured values:** the `-text` shades were derived by darkening each fill's hue until it reaches ≥ 4.5:1 against cream, peach-cream, white and sage-pale. Ink on cream is 16.3:1.
- **Rollout decision (2026-11-15):** the foundations go live app-wide, not on `/dev` only; a mixed look between stages is accepted, because nothing deploys until the redesign ends.
- **Read first:** `AGENTS.md`. Check the Next.js docs in `node_modules/next/dist/docs/` before touching `layout.tsx` or fonts.
- **Deviations recorded during implementation:**
  - **No `--border-width` token:** the old token was never used. The 2px outlines are Tailwind `border-2` in the shared classes.
  - **Widths:** "112" is Tailwind's `font-stretch-semi-expanded` (112.5%); "125" is `font-stretch-expanded`.
  - **Track strokes:** the readability pass found three tracks drawn in `line`, which became ink and hid their progress arc: the clock ring, the guess spinner and the home rule marks. They now use `rule`.
  - **Empty lives:** in `Lives` and the profile's `LivesLeft`, an empty shirt uses `fill-rule`, so an absence reads lighter than a life. Tiled lives get an ink border when filled and a `rule` border when empty, instead of the owner colour.
  - **Low-contrast `brand` uses replaced:**
    - the sign-in tab underline: `border-fg`;
    - the selected mode card on `/play`: a `bg-brand` fill;
    - the side-pick card hover: `bg-surface-raised`;
    - the practice checkbox: `accent-fg`;
    - the `/pro` table's Pro heading: `text-fg`;
    - the profile row focus: `outline-focus`.
  - **Contrast suite:**
    - the empty-pip exception is removed, because `fg-dim` on white now passes 3:1 and is a required pair;
    - the "theme.md verdicts against pitch-950" test is removed (theme.md no longer has verdicts), and the pairs cover it.
  - **Review fixes (non-text contrast, WCAG 1.4.11):**
    - filled shirts (`Lives`, `LivesLeft`) get an ink stroke, because the pastel fills are only about 2:1 on cards;
    - the selected `/play` mode card gets `shadow-hard`, so it isn't marked by lavender alone.
  - **Left for A3:** the nav's Play link (`NavCta`) keeps its own classes; it's restyled with the nav.
