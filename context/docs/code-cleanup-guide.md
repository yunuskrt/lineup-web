# Code Cleanup Guide

A step-by-step runbook to clean up, refactor and convention-check `lineup-web` **without losing any design or behaviour**. Follow the steps in order:
- **⌨️ Type in chat:** the exact message to send to Claude;
- **🖥️ Terminal:** a command you run yourself;
- **⏸️ Wait:** what you get back before going on.

Nothing in the code changes until you approve it.

---

## Decisions (user, 2026-11-17)

| Topic | Decision |
| --- | --- |
| Component template | The full template from `coding-standards-web.md`: `import React from 'react'`, `type Props = {}`, `const X = ({}: Props) => {…}`, `export default X`. ESLint ignores the unused `React` name. Non-component exports (constants, types) stay named, beside the default. |
| One component per file | Everywhere except `src/components/ui/`, `src/components/dev/` and `src/app/dev/`. |
| Exempt files | Keep their several components; each one still uses arrow const + `Props`. They keep **named** exports, as a file can have only one default. |
| Split files | Go in a subfolder named after the parent: `duel/LobbyPanel.tsx` stays, and its parts go to `duel/lobby-panel/Searching.tsx`… |
| Comments | One line, at most **75 characters** (was 50). |

## Tools

| Tool | How to call it | Used in |
| --- | --- | --- |
| `/cleanup` skill | `/cleanup check` | 1.1 |
| `code-scanner` agent | "Use the code-scanner agent …" | 1.2 |
| `refactor-scanner` agent | "Use the refactor-scanner agent …" | 2.1 |
| `convention-auditor` agent | "Use the convention-auditor agent …" | 3.1 |
| `ui-reviewer` agent | "Use the ui-reviewer agent …" | every batch, step B5 |
| `/code-review` skill | `/code-review medium` | every batch, step B6 |
| `/feature` skill | `/feature load …`, `start`, `review`, `test`, `complete` | every batch |

**Never use `/simplify` or `/cleanup run`:** both change code without the approval step.

---

## Phase 0: Baseline (once)

**0.1 Save the guide**
- ⌨️ `Commit the cleanup guide and the convention-auditor agent to main and push.`
- ⏸️ A commit hash.

**0.2 Mock mode (your step)**
- 🖥️ In `.env.local`, set `NEXT_PUBLIC_API_MODE=mock` and leave the other lines as they are.
- 🖥️ Stop `npm run dev` (Ctrl+C) and start it again: `npm run dev`.
- ⌨️ `Mock mode is on.`

**0.3 Green checks and a tag**
- ⌨️ `Phase 0.3: run lint, tsc, test and build, then tag main as pre-cleanup and push the tag.`
- ⏸️ Four passes and the tag. If anything fails, stop: it gets fixed first.

**0.4 Baseline screenshots**
- ⌨️ `Phase 0.4: take the baseline screenshots.`
- ⏸️ Claude saves them to `context/screenshots/_baseline/` (kept out of git through `.git/info/exclude`):
  - **pages at 320, 768 and 1280px:**
    - `/`;
    - `/play`, `/play?mode=solo&step=filters`, `/play?mode=duel&step=start`;
    - `/profile`, `/archive`, `/sign-in`, `/sign-in?mode=sign-up`, `/pro`, `/nope` (404);
  - **profile and archive dev states at 320 and 1280px:** every `/profile?state=…` (10) and `/archive?state=…` (8);
  - **game states at 320 and 1280px:** every state linked from `/dev/canvas` (75);
  - **dev previews at 1280px:** every page under `/dev/` (13);
  - **conditions:** reduced motion on (`prefers-reduced-motion: reduce`), full-page shots, mock API. Every comparison must use the same conditions.

**0.5 Rules commit**
- ⌨️ `Phase 0.5: write the rules changes.`
- ⏸️ A diff for you to review:
  - comments to 75 characters in `coding-standards.md`;
  - the exemptions and the split-folder rule in `coding-standards-web.md`;
  - `/cleanup`'s comment rule to 75;
  - ESLint ignoring the `React` import.
- ⌨️ `Commit and push it.`

---

## The batch loop (B1–B9)

Every approved batch in phases 1–3 goes through these steps. `<spec>` is the fix file Claude writes for the batch, for example `context/fixes/cleanup-a-unused.md`.

| Step | You do | You get |
| --- | --- | --- |
| **B1** | ⌨️ `/feature load <spec>` | The goals |
| **B2** | ⌨️ `/feature start` | A branch, and the changes made |
| **B3** | ⌨️ `/feature review` | Goals met, and any issues |
| **B4** | ⌨️ `/feature test` | Unit tests for changed `lib/` code, with `npm test` green |
| **B5** | ⌨️ `Use the ui-reviewer agent to compare the routes this batch touched against context/screenshots/_baseline/ at the same widths, with reduced motion on and full-page shots, Tab through each page, and report every difference.` | "No differences", or a list |
| **B6** | ⌨️ `/code-review medium` | Findings ranked by severity, or none |
| **B7** | Only if B5 or B6 found something: ⌨️ `Fix items <numbers>.` Then repeat B5 and B6. | A clean B5 and B6 |
| **B8** | Look at one or two touched pages yourself in the browser | Your OK |
| **B9** | ⌨️ `/feature complete` | Merged into `main`, pushed, branch deleted |

**Hard stop:** any visual difference in B5 that you didn't ask for means the batch doesn't complete.

---

## Phase 1: Cleanup

**1.1**
- ⌨️ `/cleanup check`
- ⏸️ A numbered housekeeping report.

**1.2**
- ⌨️ `Use the code-scanner agent on src/ with the report format in context/docs/code-cleanup-guide.md.`
- ⏸️ A numbered report with severities.

**1.3**
- ⌨️ `Merge the reports from 1.1 and 1.2 into one numbered list with a batch plan.`
- ⏸️ One list, grouped into batches.

**1.4**
- ⌨️ `Approve <numbers>.` (or `Approve all.`)
- ⏸️ Claude writes `context/fixes/cleanup-a-….md` (more files if there are several batches).

**1.5**
- Run the **batch loop** for each cleanup spec, in order.

---

## Phase 2: Refactor and shorten

**2.1**
- ⌨️ `Use the refactor-scanner agent on src/ with the report format in context/docs/code-cleanup-guide.md.`
- ⏸️ A numbered report: each duplication, the helper it proposes, the call sites and the risk.

**2.2**
- ⌨️ `Approve <numbers>.`
- ⏸️ Claude writes `context/fixes/refactor-a-….md`, `refactor-b-….md`…

**2.3**
- Run the **batch loop** for each refactor spec.
- **Rule:** behaviour-preserving only. No change to copy, classes, layout, motion or accessible names.

---

## Phase 3: Conventions

**3.1**
- ⌨️ `Use the convention-auditor agent on src/.`
- ⏸️ A numbered report per file: extra components, template gaps, export style, comments, and a batch plan.

**3.2**
- ⌨️ `Approve <numbers>.`
- ⏸️ One spec per batch, in this order:

| Batch | Folder | `.tsx` files |
| --- | --- | --- |
| conventions-a | `components/shell`, `components/providers` | 9 |
| conventions-b | `components/home` | 9 |
| conventions-c | `components/auth` | 10 |
| conventions-d | `components/profile` | 13 |
| conventions-e | `components/archive`, `components/pro` | 10 |
| conventions-f | `components/pitch` | 5 |
| conventions-g | `components/play` | 14 |
| conventions-h | `components/duel` | 1 (LobbyPanel, 15 parts) |
| conventions-i | `components/game` | 26 |
| conventions-j | `components/ui`, `components/dev`: template only, no split | 31 |
| conventions-k | `src/app` pages and layouts | — |

**3.3**
- Run the **batch loop** for each spec, in order.
- **The work is mechanical:**
  - move each component to its own file, unchanged;
  - convert it to the template;
  - update every import;
  - keep `'use client'` as the first line.

---

## Finish

**F.1**
- ⌨️ `Use the convention-auditor agent on src/ again.`
- ⏸️ No High findings.

**F.2**
- ⌨️ `Use the ui-reviewer agent to compare every baseline route against context/screenshots/_baseline/.`
- ⏸️ No differences.

**F.3 (your step)**
- 🖥️ Set `NEXT_PUBLIC_API_MODE` in `.env.local` back to what it was, and restart `npm run dev`.

**F.4**
- ⌨️ `Delete context/screenshots/_baseline/ and the pre-cleanup tag.` (Optional: keep the tag as a restore point.)
