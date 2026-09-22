# Spec Action

Turns a phase into one or more ready-to-implement spec files in `context/features/`.
Writes only spec files — never implements the phase, never edits todo.md.

Usage: `/todo spec` (current phase) or `/todo spec <phase-number>`.

## Selecting the phase

1. If a phase number was given, use that line in todo.md
   - Not found → error and show the valid range
   - Already `- [x]` → say it's complete and ask whether to spec it anyway before writing anything
2. If no number was given, use the current phase (first `- [ ]` line)
   - If every line is `- [x]`, report "All phases complete" and stop
3. If the phase line carries a 🟡 marker, run the `/todo remaining` inspection first and scope the specs to what's actually left, noting the already-done parts under Notes

## Deciding one spec or several

Break the phase into concrete deliverables (schema/migrations, scripts, lib modules, server actions, routes, components, tests). Split into multiple specs when any of these hold:

- Deliverables span layers that are separately buildable and verifiable (e.g. schema + ingestion script + UI)
- A later deliverable only makes sense once an earlier one exists (a real dependency, not just a preference)
- More than roughly 8 deliverables, or the work clearly exceeds one focused branch/commit
- Distinct verification stories — one part is proven by `npm test`, another only in the browser

Keep it as one spec when the deliverables are a single coherent unit built and verified together. Prefer fewer specs; do not split just to produce more files. Two to four specs is the normal ceiling for a phase — if it looks like more, say so and ask before writing.

Each spec must be independently implementable in order, and each must end in a state where `npm run build` passes.

## File naming

`context/features/phase-<NN>-<kebab-title>.md` for a single spec, e.g. `phase-02-core-entity-schema.md`.
Split specs get a letter suffix in build order: `phase-13a-draft-pool-queries.md`, `phase-13b-draft-screen.md`.
If a target file already exists, show what would change and ask before overwriting.

## Spec file structure

Mirror `context/current-feature.md` so the file can be moved into it verbatim when work starts:

```markdown
# Phase <N><letter?> — <Title>

## Status

Not Started

## Goals

- <deliverable — concrete file paths, models, routes, or components>
- <one bullet per deliverable, in build order>

## Notes

- Scope: <what this spec covers, and for split specs what it explicitly does not>
- Depends on: <previous spec or phase, or "none">
- Constraints: <the hard constraints and coding standards that actually bite here>
- Verification: <how to prove it works — `npm test`, `npm run build`, what to click in the browser>

## History
```

- Leave `## History` empty — it is filled in when the phase completes
- Goals bullets are deliverables, not narration; name real paths (`src/lib/db/queries.ts`, `prisma/schema.prisma`)
- Carry over the relevant hard constraints from `context/project-overview.md` and the rules from `context/coding-standards.md` that apply to this phase; do not restate the whole standard

## Reporting

Report the files created, one line each with its scope, the intended build order, and remind that implementation starts by copying the first spec into `context/current-feature.md` per the workflow in `context/ai-interaction.md`.
