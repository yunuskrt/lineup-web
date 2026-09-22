# Lineup

Know the XI. Beat the Clock.

## Architecture

Three separate repositories, one backend:

| Repo             | Stack             | Role                                                    | Deploys to          |
| ---------------- | ----------------- | ------------------------------------------------------- | ------------------- |
| `lineup-backend` | NestJS            | REST, auth, Socket.IO, Prisma, rules engine, ingestion  | Railway / Fly.io    |
| `lineup-web`     | Next.js           | Browser client — renders and transmits input            | Vercel              |
| `lineup-mobile`  | Expo React Native | iOS + Android client — renders and transmits input      | EAS → both stores   |

Both clients talk to the same backend, so a browser player and a mobile player share one matchmaking pool.

**No code is shared between repos.** No package, no submodule, no cross-repo import. Each repo owns its own validations, components, types, tokens and helpers, and must build with the other two deleted. What the three agree on is the backend's API contract, and the backend defines it — documented via OpenAPI, transcribed by hand into each client.

Build order: **web → backend → mobile.**

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md
- @context/monetization.md
- @context/theme.md
- @context/design.md
- @AGENTS.md

`project-overview.md` is the shared spec and must stay identical in all three repos. When it changes, it changes everywhere.

Each repo carries its own `current-feature.md` and the section of `todo.md` that belongs to it.

@context/todo.md is for developer-side use. **Do not modify the project context based on this file.**

## Commands

Ports are fixed so the web app and backend can run side by side.

**`lineup-backend`** — http://localhost:3001

- **Dev server**: `npm run start:dev`
- **Build**: `npm run build`
- **Test**: `npm run test`
- **Lint**: `npm run lint`
- **Migrate**: `npx prisma migrate dev`

**`lineup-web`** — http://localhost:3000

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Production server**: `npm run start`
- **Lint**: `npm run lint`

**`lineup-mobile`**

- **Dev server**: `npx expo start`
- **Lint**: `npm run lint`

**IMPORTANT:** Be careful about all of below while implementation:

- **Do not add 'co-authored by Claude'** statement to any commit messages
- History entries in `current-feature.md` file not exceed 75 characters
- For the first MVP, only dark-mode
- Design the theme such that the color palette to be changeable afterwards easily, and light theme also may easily be applied
- Do not edit todo.md file unless you told so via prompt or skill
- Animations via Motion (web) / Reanimated (mobile), custom css will not be used unless necessary
- No game logic in any client — the backend is authoritative, always
- Never hardcode a colour; resolve it from tokens
