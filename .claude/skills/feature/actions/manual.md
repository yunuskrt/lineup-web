# Manual Action

Writes a step-by-step manual-testing guide for a feature, or runs one and reports the results.

| Usage | Does |
| --- | --- |
| `/feature manual` | Writes the guide for the feature in current-feature.md |
| `/feature manual <spec> [<spec>…]` | Writes one guide for the named specs in `context/features/` or `context/fixes/` (e.g. two phases tested together) |
| `/feature manual run [<file>]` | Follows a guide and reports. Default: the current feature's guide |

## File name

`context/docs/<id>-manual-testing.md`, where `<id>` is:

- the phase id from the spec's H1, lowercased: `W32` → `w32`, `W26a` → `w26a`
- for a fix: `fix-<kebab-name>`
- for several specs: their ids joined in build order: `w27-w28`

If the file exists, show what would change and ask before overwriting.

## Writing a guide

1. **Find the scope.** Read current-feature.md, or the named specs: Goals, Notes, deviations and Out of Scope. With no feature loaded and no spec named, error: "Load a feature or name a spec: /feature manual <spec>".
2. **Verify before you write.** Every expected output must come from the code or a live call, never from memory:
   - the diff (`git diff main`) and the components, copy and error messages it touches
   - the backend contract (its OpenAPI document, if it's running), status codes and limits
   - `.env.local` and the backend `.env`: which mode the developer's servers run in
   - test data with known answers (fixtures, seeded XIs), so steps can name real players and matches
   - dev-only switches (`?state=`, `?scenario=`) and whether they work in the build being tested
3. **Choose the methodology** for each goal: browser clicks, DevTools Network checks, curl, the database (Prisma Studio or one SQL command), mock mode. Prefer the cheapest path that proves the goal end to end.
4. **Ask before writing** (with `AskUserQuestion`) when a goal has no clean manual path or a costly one. Give a recommended option first. Typical cases:
   - a state that's hard to reach by hand (an error the server rarely sends, a second page of data)
   - a step that would restart or reconfigure the developer's servers
   - a choice between the developer's own servers and separate test ports
5. **Never ask the developer to edit code.** Changing an env setting is fine, as long as the guide restores it in its clean-up part.
6. **Write it for the developer,** short and concise:
   - **Header:** title `# Manual Testing — <ID> <Title>`, then the line "Follow it top to bottom. Each step says what to do and what you should see. If anything differs, stop and report the step number with what you saw." Then **You need** and a time estimate.
   - **Part 0 — Setup:** env checks, a clean browser (Incognito), DevTools filters, and a list of what to write down (handles, accounts) for clean-up.
   - **Parts** ordered so each builds the state the next one needs. Number steps `N.M`. Each step gives the action, then **Expect:** bullets with the exact copy, the requests and their status codes, and the numbers.
   - **Tables** for anything looked up: known answers, expected rows, URLs.
   - **A clean-up part:** delete only the test data, in a safe order (foreign keys), then restore every setting the guide changed.
   - **Troubleshooting:** a table from what you see to the likely cause.
7. **Build in the known traps:**
   - Closing the last Incognito tab deletes its cookies. A guest can't sign back in.
   - Cookies on localhost are shared across ports, so two apps on different ports share a session.
   - The developer's dev server mode comes from `.env.local`.
   - `?state=` is dev-only, so a production build ignores it.
   - The mock store is in memory: a full reload empties it.
   - Rate limits can block repeated sign-ups or guests. Say which setting turns them off for testing.
8. **Check it:** `npx prettier --check` on the file. Don't commit; `/feature complete` includes it.
9. **Report:**
   - start with a "Written for:" line
   - give the file path and a table of its parts
   - list every setting change or restart the guide asks for

## Running a guide (`run`)

1. **Read the whole guide.** Don't edit it during the run. A wrong step is a finding for the report.
2. **List the steps you can't follow as written,** then ask once with `AskUserQuestion`, before starting. Offer an equivalent, test ports, or a skip for each. Typical cases:
   - DevTools-only UI, such as response overrides. Playwright `route` can usually do the same job.
   - restarting, reconfiguring or stopping the developer's servers. Never do this without asking.
   - anything needing the developer's own accounts or devices
3. **Run it in order:**
   - **Browser:** Playwright, with a fresh context (`clearCookies`) for Incognito.
   - **Terminal:** Bash. Keep cookie jars and files in the scratchpad.
   - **Evidence:** record the actual text, requests and status codes for each step.
   - **Fast states:** when a state passes too quickly to sample, slow the response (delay, don't change it) and recheck.
4. **Clean up:**
   - Look at the target rows before deleting, and delete only what the run created.
   - Restore every setting, stop any server you started, and close the browser.
   - Name anything you left, such as data from the developer's own runs.
5. **Report:**
   - a table: Step, Result (✅ pass, ❌ fail, ⏭ skipped), What I saw
   - then the findings: bugs, wrong or unclear steps in the guide, and observations, each with a suggested fix
   - Don't fix anything without being asked.
