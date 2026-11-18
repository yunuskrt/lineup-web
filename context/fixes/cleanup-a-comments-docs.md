# Fix — Cleanup A: Comments and Docs

## Status

Completed

## Goals

Phase 1 of `context/docs/code-cleanup-guide.md`, batch cleanup-a. Items approved by the user on 2026-11-17 (merged report, items 1–9). **Nothing changes at runtime:** comments and docs only.

- **1.** [src/lib/archive.ts:124](src/lib/archive.ts#L124): the comment "Null when every filter is on Any" describes `activeFiltersLabel`, so it moves above that function. "The filter groups not left on Any" stays on `activeFilterValues`.
- **2.** [src/styles/classes.ts:136](src/styles/classes.ts#L136): the two-line comment on `FILTER_SEARCH` becomes one line, at most 75 characters (for example `// 16px on phones stops iOS zoom; room for the search icon`).
- **3.** [src/lib/sound-cues.ts:59](src/lib/sound-cues.ts#L59): the two-line comment on `revealCue` becomes one line, at most 75 characters.
- **4.** ~~`.env.example` lacks the mock variables.~~ Dropped: see the deviations.
- **5.** [context/coding-standards-web.md](context/coding-standards-web.md) Structure, Data Fetching and Realtime describe the real layout:
  - the socket client is in `src/lib/api/socket/`, not `src/lib/socket/`;
  - live duel state comes from a reducer hook (`useDuel` over `lib/duel-session.ts`), not Zustand, and there is no `src/stores/`;
  - the rest of those sections stays.
- **6.** Same file, Styling: "Use shadcn/ui components where applicable" names the real kit: Base UI parts copied from neobrutalism.dev (shadcn-style) into `src/components/ui/`.
- **7.** [.claude/agents/README.md](.claude/agents/README.md): one line for `convention-auditor.md`.
- **8.** `coding-standards-web.md` Styling, under "No inline styles": a one-line exception. A run-time value (`DuelRecord`'s shares) or a Motion animation value (`CountdownRing`'s arc opacity) may use `style=`; nothing static may.
- **9.** [src/lib/api/pro-switch.ts:16](src/lib/api/pro-switch.ts#L16): a one-line comment saying that a non-JSON or error body falls into `catch`, which reads as "switch on".

## Out of Scope

- `context/project-overview.md` (stale status and stack): it must stay identical in all repos.
- Any code change: batch cleanup-b.

## Notes

- **Source:** `/cleanup check` and the `code-scanner` agent, merged at step 1.3 of the guide.
- **Constraints:** comments single-line and at most 75 characters; `context/project-overview.md` and `context/todo.md` untouched.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - B5 isn't needed for visuals (no runtime change), but run it on `/play` once as a guard;
  - `git diff` shows only comment lines in `src/`, with no other change.

- **Deviations recorded during implementation:**
  - **Item 4 dropped at spec time:** `.env.example` already documents `NEXT_PUBLIC_MOCK_TIER` and `NEXT_PUBLIC_MOCK_PRO_ENABLED` as commented-out lines. The `/cleanup check` comparison matched only uncommented lines.
  - **Item 3 wording:** the first one-liner dropped "snapshot" and lost the meaning; it reads `// A reveal with the match, or several at once, is a resume snapshot` (fixed in review).
  - **Item 9 kept as a comment (user, 2026-11-18):** four `/code-review` rounds turned it into a code change (an `ok` check, the shared transport, a `revalidate` option), and each fix drew new findings. All of it was reverted: `pro-switch.ts`, `transport.ts` and their tests match `main`, and item 9 is the one header line `// Server only: a failed fetch or a bad body keeps the split on, not a 404`. The code on `main` already does that, and its tests already cover it. No finding was a user-facing bug.
  - **Follow-ups, not this batch (phase 2 refactor candidates):** `/config` is read in two places (`pro-switch.ts` and `api-client.ts`'s `getConfig`), and its max-age in two constants (`CONFIG_REVALIDATE_SECONDS`, `use-pro.ts`'s `APP_CONFIG_STALE_TIME_MS`). `/pro` gets no drift log. A non-ok reply with a success body would read as off; the backend never sends one.
  - **Item 8 wording:** the exception is general ("a value known only at run time, or a Motion animation value"), with `DuelRecord` and `CountdownRing` as examples, so a new run-time value needs no doc edit. `marquee.tsx`'s static `style=` is fixed in cleanup-b.
  - **`.claude/agents/ui-reviewer.md` (outside the items):** its tools line escaped the underscores (`mcp\_\_playwright\_\_*`), so it had no browser tools. It now lists the Playwright tools by name, and a re-test on 2026-11-18 loaded and shot `/pro`. B5 still runs in the main session, because the agent has no shell for the hash and pixel compare.
  - **`.claude/agents/README.md`:** the list is alphabetical, and the `ui-reviewer` line says it reviews in a Playwright browser.
  - **`ui-reviewer` tools:** `browser_run_code_unsafe` and `browser_evaluate` were removed again (they run arbitrary code; a reviewer doesn't need them).
  - **`coding-standards-web.md` Realtime:** "shared schemas" → "this repo's own schemas (`src/lib/api/schemas/`)", as no code is shared between repos.
  - **Guide B5:** no pixel-count threshold. A differing shot is re-taken up to 3 times, and passes if any re-take matches the baseline (a one-off artifact, as `/pro` showed here: a 14 px edge difference on the nav's Play button, gone on all three re-takes). If it still differs, only text anti-aliasing passes; anything else stops the batch, matching the hard stop.
  - **Guide B7 scope (user, 2026-11-18):** B7 fixes only findings inside the batch's goals; anything else becomes a follow-up note, after item 9's loop.
  - **Open, other repos:** `project-overview.md`'s Tech Stack still names Zustand and shadcn/ui, while `coding-standards-web.md` now says no store library and the Base UI kit. The stack file wins for this repo (`coding-standards.md`). The overview must change in all four repos together.
