# Fix — Gameplay Visuals A: Scoreboard Logo

## Status

Completed

## Goals

- **Scoreboard line two: logo + competition + date.** `MatchHeader`'s second line shows `match.competition.logoUrl` in a 20px box before the competition name, then the date, as today.
  - **Size:** a 20px box (`size-5`), `object-fit: contain`. That's the line's own height (`h-5`), so the header keeps its `h-16` / `sm:h-18` box and nothing below it moves.
  - **Gap:** 6px (`gap-1.5`) between the logo and the name. The 12px gap (`gap-3`) to the date stays.
  - **Truncation:** the logo never shrinks (`shrink-0`). The name still truncates first, and the date still never truncates.
  - **Fallback:** when `logoUrl` is null, or the image fails, the competition's kind icon in `currentColor` (`fg-muted` on this line), the same icon as the filter chips.
- **One shared logo component.** Move the logo-or-kind-icon pair out of the filter code so the scoreboard, the filter chips and the side-pick card (Gameplay Visuals B) draw one thing:
  - **`src/components/game/CompetitionLogo.tsx`:** takes a `CompetitionRef`. It draws the logo with `next/image` (`unoptimized`, `alt=""`, 40×40 source for 2× screens), falls back with `useImageFallback`, and is `aria-hidden` (the name is the text). The box size comes from a `className`.
  - **`src/components/game/competition-kind.ts`:** `COMPETITION_KIND_PATH` moves here from `src/components/play/filter-icons.ts`, and its test moves with it. `SHIELD_PATH` stays in `filter-icons.ts`; it's the club chip's own fallback.
  - **`CompetitionChipImage`** renders `CompetitionLogo` in its 20px box. The chips look and measure exactly as before.
- **Skeleton:** the header skeleton's line two gains a 20px block before its bar, so the loaded line doesn't shift sideways.
- **Docs:**
  - **`context/docs/data-display-requirements.md` § 1:** the `logoUrl` row also lists the scoreboard. It's the same 20×20 box (40×40 at 2×), on `surface-raised` (#121A15). Correct the line "`logoUrl` shows only on the filter chips, not in the game header".
  - **`context/docs/contract.md`:** `CompetitionRef.logoUrl` renders on the filter chips and the scoreboard.

## Layout

```text
        [crest] Chelsea FC   2 – 0   Fenerbahçe [crest]
              [▣] Champions League   8 April 2008          ▣ 20px logo, or the kind icon
```

Phones keep today's arrangement: short club names on line one, and the found count beside line two.

## Out of Scope

- The side-pick card (Gameplay Visuals B) and the summary (Gameplay Visuals C).
- The duel lobby's match header, and the profile's history rows.
- Any change to `ClubCrest`.

## Notes

- **Source:** user request (2026-11-06), screenshot `context/screenshots/gameplay-scoreboard.png`: "add the competition logo image to scoreboard".
- **No backend change.** `MatchInPlay.competition.logoUrl` already flows (backend R3b, `a266849`). It is `null` on real data until the scraper uploads logos, so real mode shows the kind icon meanwhile. The mock has a logo on every competition but Federation Trophy.
- **Order:** the first of three gameplay-visuals fixes, and the only one that waits on nothing. Do it first: B reuses `CompetitionLogo`.
- **Constraints:**
  - Colours come from tokens only.
  - Images are presentation and never on the critical path: a failed logo falls back silently.
  - `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440, 390 and 360:**
    - the logo sits before the competition name and the date still shows
    - Federation Trophy shows the cup icon
    - blocking a logo URL shows the kind icon with no shift
    - the header height and the pitch position are unchanged
    - the skeleton's line two matches the loaded one
  - **`/dev/canvas` snapshots:** a long competition name still truncates before the date on phones.
  - **Real mode:** every competition shows its kind icon until logos are loaded.
