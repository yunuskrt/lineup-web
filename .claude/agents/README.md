# Custom Subagents

Custom Claude Code subagents used in the course for automated code analysis and review. These files go in your project's `.claude/agents/` folder.

- `code-scanner.md` - Scans the codebase for security, performance and code quality issues
- `convention-auditor.md` - Read-only audit of one component per file, the component template, export style and comment length
- `refactor-scanner.md` - Identifies code that can be broken up or refactored
- `ui-reviewer.md` - Reviews the UI/UX in a Playwright browser and gives feedback on design and usability
