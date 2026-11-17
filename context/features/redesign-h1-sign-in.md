# Redesign H1 — Sign In

## Status

Completed

## Goals

The first part of redesign stage H (`/sign-in`, `context/docs/ui-redesign-references.md` § 10). **Behaviour, copy, the auth hooks and forms, validation, the guest flow, redirects and accessible names don't change.**

- **The page** (`sign-in/00-page-a`, `00-page-b`, layout only):
  - **desktop (from `md`):** one card with a 2px ink outline and the hard shadow, split in two (open question 1): a flat **lavender panel** with "Know the XI. Guess the Squad." in `TYPE_DISPLAY` sizes that fit, and the **form side** on mint (`bg-block-mint`) (open question 2);
  - **phone:** the panel hides; the form side alone on its mint block, full width, as `00-page-b`;
  - the heading ("Sign in", "Create account", "Signed in") in `TYPE_TITLE` at the top of the form side;
  - no pattern, shapes or illustration in the panel; text on lavender and mint uses `on-accent` (tested pairs).
- **`ModeSwitch`** (decided 2026-11-16, neobrutalism.dev Tabs look): two options in one outlined white pill, the active one filled (lavender, `on-accent`); they stay **links** with `aria-current="page"` inside the "Account" nav, not a tab list.
- **`SignInForm`, `SignUpForm`, `AuthField`** (decided, neobrutalism.dev Input + Label): white fields with a 2px ink outline and **no shadow** (open question 3), the label above in Inter 600, the hint muted, the error under the field in danger text; the submit is the large primary Button, full width on phones, with its busy label (open question 4).
- **Form-level error** (decided, neobrutalism.dev Alert): `ui/alert` in the warning tone with a Lucide `TriangleAlert`, keeping `role="alert"` and the copy.
- **`ContinueAsGuest`** (decided, reuse A2): under a 2px ink rule, "No account needed to play." and the secondary Button, with "Continuing…" and its error as today.
- **The guest line** ("You're playing as … Create an account to keep your history.") stays above the switch, as today.
- **`SignedInPanel`** (decided, reuse F1): the form side shows the Avatar with the handle's letter (decorative), "You're playing as …", then **Play** (large primary) and **Sign out** (secondary), with "Signing out…" and its error.
- **`AuthSkeleton`:** the card and form side follow at the same heights for each mode; the panel shows its tagline while loading (it doesn't depend on the session).
- **Session error** (decided, reuse A3): `StateNotice` with Try again, inside the form side.

## Out of Scope

- Social sign-in, password reset or any new field: not in the product.
- The nav and footer (A3). New motion.

## Open Questions

1. **A box on this page.** `/play` and `/profile` lost their box; both references are a card. **Default: the card**, as sign-in is one focused task. The alternative is the open page, with the panel as a full-width band above the form.
2. **Colours.** **Default: a lavender panel and the form side on mint**, as `00-page-a`. The alternative is the form side on white.
3. **Field shadows.** `00-page-b` gives its fields hard shadows. **Default: flat fields**, as everywhere else; only buttons carry shadows.
4. **Submit colour.** The references use butter. **Default: our lavender primary.** The alternative is butter on this page only.

## Notes

- **References:** `context/screenshots/sign-in/00-page-a`, `00-page-b`, and their lines in `context/screenshots/notes.md`.
- **Contrast:** labels, hints and errors on mint need checking: `fg-muted` and `danger-text` on `block-mint` may need a tested pair in `src/styles/contrast.ts`, or the hint and error go to `on-accent` with an icon.
- **New copy:** only the tagline in the panel, which is the site's tagline.
- **Check:** `/sign-in` and `/sign-in?mode=sign-up` as a new visitor, a guest and a signed-in account; field errors and the form error; "Continuing…"; the session error; loading; 320, 768 and 1280px; keyboard order (switch, fields, submit, guest); the focus on the first invalid field.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then H2.

- **Deviations recorded during implementation:**
  - **Page layout (user, 2026-11-17):** after seeing the card, the user asked for no box and no tagline panel, matching the other pages. The page is the open column (`BOARD`) with ruled sections: the header (title and the guest line), the switch and form (kept to 448px inside a full-width section, so the rules run the column), then Continue as guest. Open questions 1 and 2 are settled that way: no card, no lavender panel, no mint block.
  - **Open questions 3 and 4:** defaults: flat fields; the lavender primary submit.
  - **Errors:** field, guest and sign-out errors share `AuthError`: danger text with a red `CircleAlert`, so colour isn't the only cue (on cream, danger text passes; the mint workaround is gone).
  - **Mode switch:** each option sizes to its label (`flex-auto`, one line): at 320 equal halves wrapped "Create account" onto two lines.
  - **Signed-in Avatar** is mint, as on the profile header.
  - **`AUTH_FORM`** in `auth/styles.ts` holds the form width for the panel and its skeleton.
  - **Skeleton:** sections like the page; matches the loaded height at 320, 375 and 1280 in both modes (524 / 641px on phones, 568 / 685 on desktop). It still assumes a new visitor, as before.
