# Context

These are the context files referenced by the `CLAUDE.md` file. Only the five root-level files listed first are loaded into the AI's memory on startup. Everything else is fed to the AI on demand via commands like `/feature` and `/todo`.

Loaded on startup:

- `project-overview.md` - Full project spec including features, data models, tech stack and UI/UX
- `coding-standards.md` - Code conventions, patterns and rules for the AI to follow
- `ai-interaction.md` - Workflow and communication guidelines for working with the AI
- `current-feature.md` - Living document tracking the feature currently being worked on, plus the history of completed ones
- `AGENTS.md` - Up to date Next.js search to avoid deprecations
- `todo.md` - Ordered roadmap of build phases and open decisions, used with the `/todo` command
- `theme.md` - The palette and visual direction
- `monetiazation.md` - Monetization, pro/free features, subscription details, revenue options
- `docs/` - Reference documentation for the engines and designs the phases were built against
- `features/` - Feature spec files used with the `/feature` command. A spec may reference other project files (context docs, screenshots, existing source) where that helps; references are optional and decided per spec when it is written
- `research/` - Research files used with the `/research` command to generate documentation
- `screenshots/` - UI screenshots used as visual references for the UI phases. Prototypes from external design tools land here; they guide composition and feel but are not a spec — implementation need not replicate them, and `theme.md` and `design.md` win any conflict (see `design.md` § Scope)
