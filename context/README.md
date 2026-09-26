# Context

These are the context files referenced by the `CLAUDE.md` file. The eight files listed first are loaded into the AI's memory on startup, along with `AGENTS.md` from the repo root. Everything else is fed to the AI on demand via commands like `/feature` and `/todo`.

Loaded on startup:

- `project-overview.md` - Full project spec including features, data models, tech stack and UI/UX
- `coding-standards.md` - Code conventions, patterns and rules for the AI to follow, shared by all three repos
- `ai-interaction.md` - Workflow and communication guidelines for working with the AI
- `current-feature.md` - Living document tracking the feature currently being worked on, plus the history of completed ones
- `monetization.md` - Monetization, pro/free features, subscription details, revenue options
- `theme.md` - The palette and visual direction
- `design.md` - Page shape per route, chrome, layout and interaction patterns; `theme.md` wins any conflict
- `todo.md` - Ordered roadmap of build phases and open decisions, used with the `/todo` command

Read on demand:

- `coding-standards-web.md` - The Next.js-specific rules, read alongside `coding-standards.md`
- `docs/` - Reference documentation for the engines and designs the phases were built against
- `features/` - Feature spec files used with the `/feature` command. A spec may reference other project files (context docs, screenshots, existing source) where that helps; references are optional and decided per spec when it is written
- `screenshots/` - UI screenshots used as visual references for the UI phases. Prototypes from external design tools land here; they guide composition and feel but are not a spec — implementation need not replicate them, and `theme.md` and `design.md` win any conflict (see `design.md` § Scope)
- `research/` - Research files used with the `/research` command to generate documentation; created the first time `/research` runs

Outside this folder, `AGENTS.md` in the repo root points the AI at the bundled Next.js docs, so it avoids deprecated APIs.
