# Redesign A2 — Components

## Status

Not Started

## Goals

The second part of redesign stage A: bring in the neobrutalism.dev components the user accepted, restyled to the A1 tokens, and show them all on one dev page. Depends on A1.

- **New packages** (user, 2026-11-15: "use them as-is"):
  - `@base-ui/react`: the accessible primitives neobrutalism.dev is built on;
  - `class-variance-authority`;
  - `clsx` and `tailwind-merge`, for a `cn` helper in `src/lib/utils.ts`;
  - `lucide-react`: icons, decided in the guide.

  Exact versions are pinned in `package.json`.
- **Components** copied from the neobrutalism.dev registry (`https://www.neobrutalism.dev/r/<name>.json`) into `src/components/ui/`, licence MIT:

  | File | From | Notes |
  | --- | --- | --- |
  | `button.tsx` | Button | Variants mapped to our roles: default = `brand`, neutral = `surface-card` |
  | `input.tsx`, `label.tsx` | Input, Label | |
  | `checkbox.tsx`, `switch.tsx` | Checkbox, Switch | |
  | `tabs.tsx` | Tabs | Our segmented control |
  | `card.tsx` | Card | |
  | `badge.tsx` | Badge | Plus a `sticker` variant: tilted −3°, `TYPE_STICKER`, `shadow-hard-sm`, per `moodboard/brutal-02` |
  | `avatar.tsx` | Avatar | Photo or initials (bold Inter) in the same outlined circle, on a pastel fill |
  | `dialog.tsx`, `alert-dialog.tsx` | Dialog, Alert Dialog | |
  | `skeleton.tsx` | Skeleton | |
  | `empty.tsx` | Empty | Used by A3 |
  | `sheet.tsx` | Sheet | Used by A3, only if the phone menu is kept (A3, open question 1) |

  **Every component is adapted to our setup, not run through the shadcn installer:**
  - its theme names (`main`, `border`, `shadow`, `rounded-base`, `boxShadowX`…) are mapped onto the A1 roles and tokens;
  - imports use `@/`;
  - focus uses `FOCUS_RING` (ink);
  - no dark-mode variants;
  - all copy comes from the call site.
- **Tag tints** for Badge, sampled from `foundations/07-chips-a`:

  | Role | Tint |
  | --- | --- |
  | `tag-green` | `#e1fae7` |
  | `tag-amber` | `#fff4ee` |
  | `tag-red` | `#fdefee` |
  | `tag-blue` | `#e5f3fe` |
  | `tag-purple` | `#efeaff` |
  | `tag-yellow` | `#fcf5db` |
  | `tag-grey` | `#f1f1f1` |

  Tags carry the 2px ink outline and ink text: the reference's coloured-on-tint text is too faint at 12–14px.
- **One look, two paths.** The A1 shared classes (`PRIMARY_BUTTON`, `SECONDARY_BUTTON`, `TEXT_INPUT`…) are rebuilt from the components' variant functions, so existing call sites and the new components can never drift apart. Call sites move to the components in their own page's stage, not here.
- **Wired in now, where an equivalent already exists:**
  - **`QuitDialog` moves onto `alert-dialog.tsx`.** It covers quit, forfeit, and "Practise now?" on `/play` and the archive. Behaviour stays exactly as today:
    - the safe choice ("Keep playing", or its `dismissLabel`) is first and takes focus;
    - Escape dismisses;
    - the confirm button shows its pending label and both buttons lock while pending;
    - the clock keeps running behind it;
    - after a confirmed quit, focus goes to the summary, as fixed in Pro Polish B;
    - copy unchanged.
  - **Skeletons** (`*Skeleton.tsx`, 9 files) use `skeleton.tsx`. Their shapes and sizes don't change ("every wait has a known shape").
- **`FeedbackToast` keeps its mechanism.** It's an inline status line in a fixed 32px slot, not a floating toast, and its timing belongs to gameplay. It takes the neobrutalism.dev Toast's look (outline, `surface-card`, `shadow-hard-sm`). The Base UI toast manager isn't added, because nothing would use it.
- **`/dev/components`** (new) shows every component above in each state, using real app copy:
  - **Button:** default, neutral, disabled, pending, icon, large, pressed.
  - **Input:** empty, filled, error with message, read-only.
  - **Checkbox and Switch:** checked, unchecked, disabled.
  - **Tabs** with 2 and 3 options.
  - **Card:** on cream and on each block colour.
  - **Badge:** every tag tint, plus the stickers "Your turn" (blue and orange), "Found", "Pro" and "Practice".
  - **Avatar:** photo, initials, empty; and you and opponent fills.
  - **Dialogs:** each `QuitDialog` copy.
  - **Skeleton** and **Empty**.
- **Accessibility checks:**
  - every interactive component is reachable and operable by keyboard;
  - the focus ring is visible on cream and on every fill;
  - each dialog traps focus and returns it on close;
  - the existing focus and contrast test suites stay green.

## Out of Scope

- Moving pages onto the components (each page's stage).
- Nav, footer, `ProLock`, empty and error states (A3).
- Motion beyond each component's built-in transitions. Those respect reduced motion.

## Open Questions

1. **Sticker tilt.** Default −3°; a small alternation (−3°, +2°) when several sit together.

## Notes

- **Deviation from the project spec, agreed by the user (2026-11-15):** `project-overview.md` names "shadcn/ui, unstyled Radix primitives". neobrutalism.dev has moved to **Base UI**, so the primitives are Base UI. Record it under "Deviations recorded during implementation". `project-overview.md` itself is shared by four repos and isn't edited here.
- **Found while writing this spec:** the app had no shadcn/ui, no Radix and no `components/ui` before this phase; every component was hand-built.
- **Before copying:** check each registry file against our Tailwind v4 setup (neobrutalism.dev's docs don't state the Tailwind version), and read its Base UI imports against the installed version.
- **References:** `context/docs/ui-redesign-references.md` §§ 2.4–2.9 and § 3; `context/screenshots/notes.md`.
