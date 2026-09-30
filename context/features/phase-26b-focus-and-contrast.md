# Phase W26b — Focus & Contrast

## Status

Not Started

## Goals

- Contrast helpers in a new `src/styles/contrast.ts`:
  - `relativeLuminance(hex)` and `contrastRatio(a, b)`, per WCAG 2.2.
  - `CONTRAST_PAIRS`: every foreground and background pair the app ships, named by role token (see Contrast), each with its required minimum.
- `src/styles/contrast.test.ts` reads the hex values from `src/styles/tokens.css` and the role map from `src/styles/theme.css`, and checks every pair against its minimum. A palette swap that breaks a pair fails the suite.
- Contrast fixes, where text uses a role below its minimum:
  - The lobby's "vs" in `src/components/duel/LobbyPanel.tsx` goes from `text-fg-dim` to `text-fg-muted`. It's 14px body text, and `dim` is for large text and non-text only.
  - Any other usage the audit turns up is fixed at the usage, never by editing a token. A failing primitive is raised as a question, because `theme.md` owns the palette.
- One tab order at every width:
  - The quit chip sits before the canvas in the DOM on phones too, and CSS places it in the header row. Today it comes after the canvas below `sm` and before it from `sm` up (`src/components/game/GameCanvas.tsx`).
- A keyboard walk of every route (see Focus), with each gap fixed in the component that owns it. Expected gaps to check first:
  - `/sign-in`: a failed submit moves focus to the first invalid field, and the error is linked with `aria-describedby`.
  - `QuitDialog`: Escape cancels, and focus returns to the quit chip.
  - A gate that closes with focus inside hands focus back (W15). Check it across solo side-pick, the lobby steps, the empty-pool widen and the reconnect gate.
  - The profile's "Show more" keeps focus through loading and failure (W24b).
- A guard in `src/styles/classes.test.ts`: every shared interactive class (`PRIMARY_BUTTON`, `SECONDARY_BUTTON`, `CHOICE_BUTTON`, `TEXT_LINK`, `TEXT_INPUT`, the quit chip and filter chip) carries a `focus-visible` outline.

## Contrast

Minimums from WCAG 2.2 and `context/theme.md` § Contrast: 4.5 for body text, 3 for large text (24px, or 19px bold) and non-text UI.

| Foreground                           | Backgrounds                                           | Minimum | Use                                   |
| ------------------------------------ | ----------------------------------------------------- | ------- | ------------------------------------- |
| `fg`, `fg-muted`                     | `surface`, `surface-raised`, `surface-card`           | 4.5     | All body text                         |
| `you`, `opponent`, `found`, `danger` | `surface`, `surface-raised`, `surface-card`           | 4.5     | Handles, tags, error text             |
| `warning`                            | `surface-raised`, `surface-card`                      | 4.5     | The cooldown line, reconnect copy     |
| `on-accent`                          | `brand`, `found`, `warning`, `opponent`               | 4.5     | Buttons, turn chips, win cards        |
| `fg-dim`                             | `surface`, `surface-raised`, `surface-card`           | 3       | Large numerals, pips, disabled input  |
| `line`, `marking`                    | `surface`                                             | —       | Recorded, not asserted: decorative    |

## Focus

Walk each route with Tab, Shift+Tab, Enter, Space, the arrow keys and Escape, at 1440 and 390:

| Route            | Expect                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `/`              | Wordmark, CTA, Play, footer; a visible ring on each                                             |
| `/sign-in`       | Mode switch, fields in reading order, submit, guest; errors announced and focus sent to them    |
| `/play`          | Mode radios move with the arrow keys; filter chips; era selects; Start                          |
| `/play/solo`     | Quit, then the side-pick gate; the guess field once live; the quit dialog traps and returns     |
| `/play/duel`     | Lobby steps in order; the gate never strands focus; the result title, then Play again           |
| `/profile`       | Header, stats, history, Show more; the guest upgrade link                                       |
| Protocol refused | The heading on arrival, then Reload, then Back to Play                                          |

## Out of Scope

- Reduced motion → W26a.
- Screen-reader copy rewrites. Existing announcements stay unless the walk finds one missing or wrong.
- A skip link. The site nav has two stops and game routes carry no chrome (`design.md`).

## Open Questions

Defaults stand unless changed at load:

- **`dim` on unrevealed slot labels.** `theme.md` names `dim` for unrevealed slots, but the labels are 12px text. Default: keep. They're `aria-hidden` placeholders for an empty slot, the grid is labelled for screen readers, and WCAG exempts incidental text. Record the exception.
- **`dim` placeholder text** in the guess field and auth fields. `theme.md` names `dim` for placeholders. Default: keep. Each field has a visible label, so the placeholder never carries the name.

## Notes

- Scope: focus order, focus visibility and colour contrast across every route. W26a covers motion.
- Depends on: W26a, so the walk runs on the final motion behaviour; W08–W25 for the routes.
- Constraints:
  - Tokens only. **Never hardcode a colour**, and never change a token value; `theme.md` owns the palette.
  - One primary action per view (`design.md`). A focus fix never adds a second.
  - Unit tests run in Node with no network; reading the repo's CSS files is fine.
  - `@/` imports, single-line comments of at most 50 characters.
- Verification:
  - `npm test`: the contrast suite and the focus-ring guard.
  - The keyboard walk in the browser at 1440 and 390, with each finding and fix recorded under Notes.
  - `npm run build`.

## History
