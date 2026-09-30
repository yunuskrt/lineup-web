# Start Action

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run /feature load first"
3. Set Status to "In Progress"
4. Create and checkout the branch (derive name from H1 heading): `fix/<name>` when the loaded spec lives in `context/fixes/`, otherwise `feature/<name>`
5. If the feature builds or reshapes a user-facing screen or page (not a `/dev/*` preview, not a lone component), load the `frontend-design` skill before implementing:
   - `context/theme.md` and `context/design.md` are the brief and win every conflict — skip the skill's token-system pass, use it for layout, copy and a "templated tells" check
   - Record any design decision it drives under the spec's Notes, like any other deviation
6. List the goals, then implement them one by one
