# Redesign G1 — Archive Page and Rows

## Status

Completed

## Goals

Redesign stage G (`/archive`, `context/docs/ui-redesign-references.md` § 9), in one part. **Behaviour, copy, `lib/archive.ts` behaviour, search, filters, paging, Show more focus, the Pro rules, the row's three widths (phone, `sm`, `xl`) and accessible names don't change.**

- **The page** (decided 2026-11-16, reuse C1 / F):
  - an open page with ruled sections and no box, as `/play` and `/profile` since `context/fixes/play-profile-layout.md`: header, then the controls (search and filters), then the results; ink rules between them (`BOARD_SECTION`);
  - the page keeps its wider column (`SITE_CONTAINER`, up to 1152px) for the one-line `xl` row (open question 1).
- **Header** (decided, reuse F1):
  - "Archive" in `TYPE_TITLE`, with the count line ("12,345 matches. Search by club, competition or season.") or the locked line below, as today;
  - a **"Pro"** sticker `Badge` beside the title only while the Free/Pro split is on (`showsPro`); with the switch off, no word "Pro".
- **Search box** (decided, neobrutalism.dev Input from C2): the club search's look: white, 2px ink outline, a Lucide `Search` icon inside (`FILTER_SEARCH`), 16px on phones so iOS doesn't zoom; same label, limits and submit as today.
- **`ArchiveFilters`** (decided, reuse C1 / C2):
  - stays a fold-out panel on the page with the same `FilterPanel`;
  - the button is the secondary Button with a Lucide `SlidersHorizontal` icon, "Filters" / "Hide filters", and a small **count sticker** when filters are on (the number of groups not on Any); the active line beside it stays;
  - the open panel sits under a 2px ink rule instead of the old 1px bottom border.
- **`ArchiveRow`** (`archive/03-row-a`, `03-row-b`, `03-row-c`, layout only):
  - the list is white (`bg-surface-card`) in a 2px ink outline with 2px ink rules between rows, as the profile history (F2);
  - **teams and score:** home name and crest, a centred score in `TYPE_NUMBER`, crest and away name, as `03-row-a` / `03-row-c`; names in Archivo bold, mixed case (open question 3); crests hidden below `sm`, as Pro Polish C decided for 320 (open question 4);
  - **meta:** date, competition logo and event, and the nickname, as today; from `xl` the date and event stack in a left column, as `03-row-a`, with the actions on the right (open question 5);
  - **Play and Practise** become small secondary Buttons (white, 2px ink outline, the press shadow), sized to keep the row heights; Practise keeps its Pro rules and "Starting…";
  - the row heights stay (phone, `sm`, `xl`); it stays a `ul` of `li`.
- **Play error:** the line above the list becomes `ui/alert` in the warning tone, keeping its `role="alert"` and copy.
- **No results and error** (decided, reuse A3): `StateNotice` with its icon tile, Clear search / Clear filters or Try again, as today.
- **Locked** (decided, reuse A3): the header with the locked line, then `ProLock` ("Browse the archive", "The archive is part of Pro.", See Pro) inside the dashed `ui/empty` box with a Lucide `Archive` icon tile, so the page isn't bare. Pending keeps its quiet state.
- **Show more** (decided, reuse F2): `HistoryMore` as today, under the list.
- **`ArchiveSkeleton`:** the list and rows follow the new look at the same heights; the refreshing list keeps its dimmed state.

## Out of Scope

- Grouping by competition (`03-row-c`): our list is newest first, and one page of rows would split groups.
- A "latest result" hero (`03-row-a`): a new feature.
- `/play`, `/profile` and the game screen. New motion.

## Open Questions

1. **Page width.** **Default: the wider site column (up to 1152px)**, as the `xl` row needs it. The alternative is the 896px column of `/play` and `/profile`, with the one-line row starting later.
2. **Grouping by competition.** **Default: no grouping**; the competition stays in each row (see Out of Scope).
3. **Team names.** **Default: Archivo bold, mixed case**, as uppercase is kept for stickers. The alternative is `03-row-a`'s uppercase scoreboard names.
4. **Crests on phones.** **Default: hidden below `sm`**, as today, so the row fits at 320. The alternative is 20px crests on phones, with names cut sooner.
5. **The `xl` meta column.** **Default: the date and event stacked on the left, actions on the right**, as `03-row-a`. The alternative is today's order (date left, event after the teams).

## Notes

- **References:** `context/screenshots/archive/03-row-a`, `03-row-b`, `03-row-c`, and their lines in `context/screenshots/notes.md`.
- **Contrast:** sticker text uses `on-accent` on its fill (tested pairs in `src/styles/contrast.ts`).
- **New copy:** only the filter count, a number. Everything else is today's copy.
- **Tests (pure):** the active filter count, if it's a new helper in `lib/archive.ts`.
- **Check:** `/archive?state=` `open`, `long`, `refreshing`, `loading`, `empty`, `error`, `locked`, `pending`; the filters open and closed with a count; Play and Practise, "Starting…" and the disabled rows; the play error; Show more; 320, 640, 1024 and 1280px (the three row layouts); keyboard order; screen-reader names for the rows and buttons; loading and loaded heights. The split-on states need `NEXT_PUBLIC_MOCK_TIER=free` (the user's step).
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then stage H (§ 10 Sign in, § 11 Pro, § 12 System).

- **Deviations recorded during implementation:**
  - **Open questions:** all five defaults: the wide site column; no grouping; Archivo bold, mixed-case names; crests hidden below `sm`; the `xl` meta stacked on the left.
  - **The `xl` meta column:** the event (logo and name) on the first line, the date and nickname on the second; the standalone `xl` date is gone, so one `<time>` serves every width and the reading order is teams, score, date, event at all widths.
  - **Search box:** `TEXT_INPUT` with a 20px `Search` icon (`pl-11`), not the small `FILTER_SEARCH`: it's the page's main search, 16px at every width.
  - **Filters panel rule:** no extra 2px rule above the open panel; `FilterPanel` already draws its own row rule there and the two doubled up.
  - **Filter count:** `activeFilterCount` in `lib/archive.ts` (tested), sharing its filter list with `activeFiltersLabel`; the sticker is hidden from readers, as the active line beside the button names the filters.
  - **Crest fallback:** `ClubCrest` takes `fallbackFill` (`card` by default, `raised` in archive rows): the white short-name tile vanished on the white list. Other callers are unchanged.
  - **Play and Practise:** a local small-button class (2px outline, white, the small hard shadow, a 2px press), 30px tall like before, so the row heights hold (104 / 80 / 64px).
  - **Header Pro sticker** follows `showsPro`; the dev `locked` state runs with the split off, so it shows the lock without the sticker. The real locked page has the split on.
  - **Not checked in the browser:** "Starting…" and the play-error Alert: the dev states pass no starting row or error. Both keep their logic; the Alert keeps `role="alert"`.
