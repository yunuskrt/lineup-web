# Redesign C2 — Filters, Practice and Room Code

## Status

Not Started

## Goals

The second part of redesign stage C: the controls inside the `/play` board. Depends on C1. **Behaviour, copy, validation, URL syncing and accessible names don't change.** Every control here is neobrutalism.dev, accepted 2026-11-15 (guide § 5).

- **`FilterPanel` rows**, as in `play/00-page-a`:
  - a label column beside its controls from `md`, stacked on phones, rows divided by `rule` lines inside the filters section;
  - the competition and club **chips** keep `FILTER_CHIP` and its pressed state, with the logo or crest inside;
  - the "Any competition" / "Any club" chips, the competition groups, the club hint, "No club matches that name." and "N more" lines are unchanged.
- **Club search:** the accepted [Input](https://www.neobrutalism.dev/docs/input) with a Lucide `Search` icon inside it. White, 2px ink, `rounded-md`, the same field style as the guess box; 16px text on phones so iOS doesn't zoom.
- **Season range:** two neobrutalism.dev [Select](https://www.neobrutalism.dev/docs/select)s, built on Base UI's Select (already installed), copied into `src/components/ui/select.tsx` and adjusted to our theme:
  - **the trigger:** white, 2px ink, a chevron, the chosen season;
  - **the popup:** a 2px ink outline, the hard shadow, the highlighted item in lavender, a check on the chosen one;
  - "From" and "to" stay visible labels; "to" only offers seasons from "From" on, and moving "From" past "to" pushes "to" along, as today;
  - keyboard, focus and screen-reader behaviour come from Base UI.
- **`FilterSkeleton`:** the same shapes as the new rows (chips, the search field, two selects), so nothing shifts when the options load.
- **`PracticeToggle`:** the accepted `ui/checkbox` with its label "Practice: no clock, no lives, not saved". Locked for Free through `ProLock`, unchanged.
- **`RoomControls`:**
  - **Create room:** the secondary Button, or the locked `ProLock` button for Free, with "Pro hosts rooms. Anyone can join.";
  - **the code:** the neobrutalism.dev [Input OTP](https://www.neobrutalism.dev/docs/input-otp) with **6 boxes**, one character each (decided 2026-11-15), copied into `src/components/ui/input-otp.tsx` (open question 1);
  - typing and pasting go through `roomCodeInput` (uppercase, letters and digits, 6 at most), so a pasted code fills every box;
  - **Join** is enabled only for a valid code (`isRoomCode`), and Enter submits;
  - the look-alike hint ("Room codes don't use 0, O, 1, I or L."), the prefill from `?room=`, "Creating…" / "Joining…" and the session error all stay;
  - one accessible name for the whole code ("Room code"), not six.

## Out of Scope

- The board, the sections and the mode cards (C1).
- The room's waiting screen after Create (stage E).

## Open Questions

1. **A new package for Input OTP.** neobrutalism.dev's Input OTP is built on the `input-otp` package (MIT; 1.5.0, from 2026-08). It's not installed. **Default: add `input-otp@1.5.0`, pinned**, as A2 pinned Base UI. It handles paste, caret, mobile keyboards and screen readers in one field. The alternative is six plain inputs of our own: no new package, but more focus and paste code to write and test.

## Notes

- **References:** `context/screenshots/play/00-page-a` (outlined dropdown rows), guide § 5 (`FilterPanel`, `PracticeToggle`, `RoomControls`).
- **Contrast:** check the select popup's highlighted lavender row (`on-accent` on `brand` is tested) and the OTP boxes' ink on white.
- **Check:**
  - competition pick and clear, club search with "No club matches" and "N more", club chips;
  - season selects with the keyboard, "From" past "to";
  - the skeleton, then the loaded rows (no shift);
  - practice on and off, locked for Free;
  - the room code: typing, pasting `k7qm2x`, a look-alike, an invalid code, the `?room=` prefill, Enter, Create room locked for Free;
  - 320px and `lg`.
- **Dev server:** the dev cache is off since C1 (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- **With C2 done, stage C is complete.** The next collection is stage D (`/`, guide § 6).
