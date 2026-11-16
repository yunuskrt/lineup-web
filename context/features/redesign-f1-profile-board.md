# Redesign F1 — Profile Board and Header

## Status

Completed

## Goals

The first part of redesign stage F (`/profile`, `context/docs/ui-redesign-references.md` § 8): the page frame, the header, the guest prompt, the notices and the skeleton's frame. **Behaviour, copy, the profile hooks, paging, the Pro switch rule and accessible names don't change.**

- **One board** (`profile/00-page-a`, `00-page-b`, layout only):
  - the ready page sits on one `BOARD` (peach, 2px ink outline, the hard shadow), split into `BOARD_SECTION`s with ink rules running edge to edge, as `/play` (C1); no separate `PROFILE_PANEL` cards any more;
  - sections in order: **header**, the **guest prompt** (guests only), the **record and stats** (F2), **history** (F2);
  - the board is wide enough for the record and stats side by side from `lg` (open question 1).
- **`ProfileHeader` + `ProfilePlan`** (decided 2026-11-16, neobrutalism.dev Avatar):
  - the `ui/avatar` at `lg` with the handle's first letter as initials on a pastel fill, decorative (`aria-hidden`): the h1 already names the handle;
  - the handle in `TYPE_TITLE`, wrapping, never truncated (as today);
  - beside it, sticker `Badge`s: **"Guest"** for a guest, and **"Pro"** or **"Free"** only while the Free/Pro split is on (`showsPro`). With the switch off, no badge, no price and no word "Pro" (theme.md § Pro lock);
  - the plan line keeps today's copy ("You're on Pro." / "You're on the Free plan."); **See Pro** becomes the secondary Button.
- **`GuestUpgrade`** (decided 2026-11-16, neobrutalism.dev Alert):
  - `ui/alert` in the `neutral` tone with a Lucide `UserRound` icon and today's line;
  - **Create account** stays the primary Button, beside the line from `sm`, below it on phones;
  - no live role: it's on the page from the start, not an announcement.
- **`ProfileNotice`** (decided 2026-11-16, reuse A3):
  - signed out and error keep `StateNotice` with its Lucide icon tile and today's copy;
  - the signed-out **Sign in** text link becomes the secondary Button beside **Play**, as B1 did for the game's actions.
- **`ProfileSkeleton`:** the frame follows the board (the same `BOARD` and sections, an avatar circle, the title bar, badge-sized bars, and the guest prompt's height for guests), so nothing shifts when the page arrives. The F2 sections' placeholders are F2's.

## Out of Scope

- `DuelRecord`, `ProfileStats`, the history list, its empty state and their placeholders (F2).
- The nav and footer (A3).
- New motion. The skeleton keeps `skeletonPulse`.

## Open Questions

1. **Board width.** `BOARD` stops at `max-w-4xl` (896px), the `/play` width. **Default: the same width**, with the record and stats side by side from `lg`. The alternative is a wider profile board (`max-w-5xl`).
2. **Avatar fill.** **Default: one fixed pastel (`bg-block-mint`)** for everyone, so no colour means anything. The alternative is a fill picked from the handle; it adds variety but could be read as a tier or a team.

## Notes

- **References:** `context/screenshots/profile/00-page-a`, `00-page-b`, and their lines in `context/screenshots/notes.md`.
- **Contrast:** initials and badge text use `on-accent` on the pastel fills (tested pairs in `src/styles/contrast.ts`).
- **New copy:** only the "Pro" / "Free" badges. Everything else is today's copy.
- **Check:** `/profile?state=` `populated`, `guest`, `empty`, `loading`, `loading-guest`, `signed-out`, `error`; the plan line and badges with the split on (`NEXT_PUBLIC_MOCK_TIER=free` in `.env.local`, the user's step) and off; a long handle at 320px; keyboard order (header, Create account, then F2's controls); loading and loaded heights.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then F2.

- **Deviations recorded during implementation:**
  - **Open questions:** both defaults: the `/play` board width (`max-w-4xl`) and one fixed mint avatar (`bg-block-mint` on `ui/avatar`, no new tone).
  - **Guest prompt in the header section**, not its own: a 70px prompt in a section padded 32px top and bottom left a gap, and with the header it reads as one identity block.
  - **Phone header stacks:** the avatar sits above the handle below `sm`, and the handle is 24px there (30 from `sm`, 40 from `md`): at 320 a 12-character handle broke mid-word. `leading-tight` comes after the sizes, as `cn` drops it.
  - **Badge tones:** Guest `butter`, Pro `brand`, Free `neutral`, all tilted stickers.
  - **`handleInitial`** in `lib/profile.ts` (tested): the first code point, upper-cased without the locale, so server and browser agree.
  - **`PROFILE_FIGURES`** in `profile/styles.ts`: the record and stats section, shared with the skeleton.
  - **Sign in** is the large secondary Button, matching Play beside it.
  - **Skeleton:** the guest prompt's placeholder matches at 320, `sm` and `md`; around 375 the text wraps one line shorter, a 21px shift.
  - **Not checked:** the Pro / Free badges and plan line with the split on need `NEXT_PUBLIC_MOCK_TIER=free` (the user's step).
  - **Mixed look until F2:** the record, stats and history keep their old cards inside the board.
