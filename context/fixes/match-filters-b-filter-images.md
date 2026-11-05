# Fix — Match Filters B: Crests & Logos

## Status

Completed

## Goals

- **Club chips: crest + name.** Each club chip in the filter rows (Match Filters A) shows its crest from `ClubRef.crestUrl`, then the name.
  - **Size:** a 20px box (`size-5`), `object-fit: contain`, with no background behind a loaded crest.
  - **Fallback:** when `crestUrl` is null, or the image fails, the box shows a plain shield glyph in `fg-dim`. The glyph is a new path file beside `shirt.ts` and `person.ts`. The box is the same size, so chips stay aligned and nothing shifts. The short code isn't used here: at 20px it truncates ("NG…"), and the name is right beside it.
  - **"Any club":** no image.
- **Competition chips: logo + name.** Each competition chip shows `CompetitionRef.logoUrl` in the same 20px box.
  - **Fallback:** when `logoUrl` is null, or the image fails, an icon for the competition's kind, in `currentColor`. The chip's text colour carries it, `fg-muted` at rest and `fg` when pressed:
    - **Leagues** (`league`): a ball
    - **European cups** (`ucl`, `uel`): a cup
    - **International** (`world_cup`, `euro`): a globe
  - The icons are inline SVG path files, as `shirt.ts` is. They're original, simple marks that copy no competition's logo.
  - **"Any competition":** no image.
- **One shared component** for both chips, e.g. `FilterChipImage` in `src/components/play/`. It takes `src` and a `fallback` node, uses `next/image` with `unoptimized` and `alt=""` (the name is the text), and uses `useImageFallback`, so a failed URL falls back once and a new URL tries again. `ClubCrest` in the match header is unchanged.
- **Chip layout:** the image and name sit in one row with an 8px gap. The chip's height stays at today's 32px; the padding shrinks on the image side if needed so it doesn't grow. `FILTER_CHIP` keeps its border, pressed state and focus ring.
- **Loading:** images load lazily (the `next/image` default). A chip renders fully, with its fallback box, before any image arrives. `FilterSkeleton` widths are re-measured for the wider chips.
- **Mock images:**
  - `public/mock/competitions/<competition-id>.svg`, one per mock competition. Each is a flat, original emblem in two colours with no real competition's marks. Set as `logoUrl` in `src/lib/api/mock/data/competitions.ts`.
  - **One competition stays `null`** (Federation Trophy), so the kind-icon fallback shows in mock mode.
  - **Fixtures test:** every mock competition but that one has a `logoUrl`, and every `/mock/...` path still exists under `public/`.
- **Docs:**
  - **`context/docs/data-display-requirements.md` § 1 (Images)**, which the scraper reads:
    - A `logoUrl` row: the filter chip, 20×20 at 1×, 40×40 at 2×, square, `contain`, transparent. The background is `surface` (#0A0F0C) at rest and `surface-card` (#1A241E) when pressed.
    - A `crestUrl` row for the same chip.
    - A logo column in "Formats, background and fallbacks". Because many competition logos are dark, the guidance is a light or one-colour version on a transparent background.
    - The line "No other surface shows an image: not … the filters" is corrected.
  - **`context/docs/contract.md`:** `CompetitionRef.logoUrl` notes that it renders on the filter chips.
- **Contract:** `competitionRefSchema.logoUrl` becomes `imageUrlSchema.nullable()`, required, now that backend R3b always sends it. The mock already sets it on every competition. Drop the "Optional until backend R3b" comment.
- **Contrast:** any new pairing joins `CONTRAST_PAIRS`. Expected: `fg-dim` for the shield glyph on `surface`, which counts as non-text UI.

## Layout

```text
Competition   [Any competition]
              LEAGUES
              [▣ Bundesliga] [▣ LaLiga] [◍ Süper Lig] …     ▣ logo · ◍ kind icon (no logo yet)
              EUROPEAN CUPS
              [▣ Champions League] [▣ UEFA Cup / Europa League]

Club          [Any club] [▣ Arsenal] [▣ Chelsea FC] [⛉ Fulham FC] …   ⛉ shield (no crest)
```

## Out of Scope

- Logos anywhere outside the filter chips: the match header line 2, the duel lobby summary, the profile history.
- The backend column and the scraper upload (R3 Part 2, scraper S18 extension).
- Any change to `ClubCrest`, `PlayerHeadshot` or the match header.

## Open Questions

Defaults stand unless changed at load:

- **Kind icons:** a ball, a cup, a globe, one per group in fix A.
- **No-crest fallback:** a dim shield glyph rather than the short code.

## Notes

- **Source:** the same user request as Match Filters A (2026-11-04): "crest + text for club filters, logo + text for competition filters".
- **Decision (user, 2026-11-04):** real logos through the scraper, the same path as crests, with a kind icon until a logo exists.
- **Depends on:**
  - **Match Filters A:** the grouped rows, `logoUrl` in the contract, and the dependent club list. With the club list narrowed by competition, a chip row holds tens of crests rather than about 100, which keeps the image load small.
  - **Real images:** `crestUrl` already flows (backend R2, scraper S18). Backend R3 Part 2 is merged (`a266849`, 2026-11-05), but `logoUrl` stays `null` until the scraper loads `logo_key`. This fix doesn't wait for that: the kind icon covers it.
- **Licensing:** competition logos are trademarks, like crests (`project-overview.md` § Data Architecture). They're fine for development, but must be licensed or replaced before release (W35). The kind icons and mock emblems are original and carry no such risk.
- **Constraints:**
  - **UI colours** come only from tokens. The mock SVGs hold their own fills, as the mock crests do.
  - **No game logic:** images are never on the critical path, and a failed one falls back silently. It's presentation, not a game action.
  - **Code style:** `@/` imports, no `any`, single-line comments of at most 50 characters.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Mock, at 1440 and 390:**
    - every competition chip shows its emblem, and Federation Trophy shows the cup icon
    - club chips show crests
    - block one crest URL in dev tools: the shield shows with no layout shift
    - pressed chips keep a visible image and focus ring
    - no layout shift from the skeleton
  - **Real mode:** crests show for the clubs that have a `crest_key`. Competitions show kind icons until logos are loaded, then logos.

### Deviations recorded during implementation

- **Shield on a pressed chip:** lifts from `fg-dim` to `fg-muted`. `fg-dim` on `surface-card` fails 3:1 (a listed exception).
- **No new contrast pair:** `fg-dim` on `surface` was already listed; its use label now names the shield.
- **Chip height is 35px, not 32px:** that was already the height. The 20px box fits the text's line box, so no padding change.
- **Icon paths:** `src/components/play/filter-icons.ts`, not beside `shirt.ts`/`person.ts`, which sit in two folders.
- **Chip wrappers:** `ClubChipImage` and `CompetitionChipImage` sit beside `FilterChipImage` and pick each fallback.
- **Kind-icon test added:** one icon per group from `competitionGroups`, none shared across groups.
- **Contract fallout:** every `CompetitionRef` literal in tests and `samples.ts` gains `logoUrl`; the sample cup gets a mock logo.
- **Docs:** the crest fallback bullets now split filter chip (shield) from game header (short code).
- **Verified:**
  - 1177 tests, lint, `tsc` and the build are clean.
  - `/feature test`: no new tests needed. All 7 mutations were caught (schema, kind map, mock logos and paths).
  - Mock build at 1440/390/360: skeleton and loaded row heights match (307/109/78, 426/188/111, 426/209/111).
  - With images blocked, the kind icons and shield show at unchanged chip widths.
  - Real mode (backend `a266849`): `logoUrl: null` parses and every competition shows its kind icon. Premier League's six crests load.
- **Data note for the scraper:** Tottenham's navy crest is hard to see on the dark chip, as the docs warn.
