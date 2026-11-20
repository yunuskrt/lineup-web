# Coding Standards — Web (Next.js)

For `lineup-web`. Read alongside `coding-standards.md`, which always applies.

This repo renders the game and transmits input. It has **no database access, no Prisma, no football provider calls and no game logic.**

## Structure

```text
src/
  app/[route]/page.tsx        pages
  components/[feature]/       components
  hooks/                      custom hooks
  lib/api/                    the API client — the only place fetch() appears
  lib/api/socket/             the Socket.IO duel client
  types/[feature].ts          repo-local types
  styles/                     globals.css, theme
```

## The API Client

Everything the app knows about the backend lives in `src/lib/api/`.

- One typed `ApiClient` interface in `src/lib/api/client.ts`, grouped by domain (`auth`, `catalog`, `solo`, `profile`), plus a `DuelClient` in `src/lib/api/duel-client.ts` for the realtime duel. Every call returns data parsed with this repo's own Zod schemas in `src/lib/api/schemas/`.
- Those schemas are this repo's transcription of the backend contract. When the backend changes, they change here too — there is no shared package to update once.
- **No component ever calls `fetch` directly.** A component that builds its own URL is a component that cannot be mocked, retried or re-pointed.
- The client is defined as an **interface with two implementations**: a mock one and the real one. The mock is what the whole UI is built against before the backend exists; going live swaps the implementation and nothing else.
- Base URL comes from `NEXT_PUBLIC_API_URL`. Never hardcoded.
- Requests that need a session send `credentials: 'include'` — the session cookie is scoped to the shared parent domain.

## Data Fetching

- **TanStack Query** for all server data — caching, retries, invalidation and loading states.
- **A reducer hook** for live duel session state, which arrives by socket rather than by request: `useDuel` over the pure reducer in `src/lib/duel-session.ts`. No store library.
- Server Components may fetch for marketing and SEO surfaces (`/`). Authenticated game data is fetched client-side, because the session cookie and the socket both live in the browser.
- **Server Actions are not used for game logic.** They are a web-only transport; the same logic has to serve mobile, so it lives behind the API client instead.
- Never poll for state the socket already pushes.

## React

- Functional components only; no class components.
- Use hooks for state and side effects.
- Keep components focused on one responsibility.
- Extract reusable logic into custom hooks.
- Avoid unnecessary client components.

### Component and Page Structure

Every React component and Next.js page must follow this basic structure:

```tsx
import React from 'react'
import styles from './test-component.module.css'

type Props = {}

const TestComponent = ({}: Props) => {
  return (
    ...
  )
}

export default TestComponent
```

The following must exist in every component/page:

```tsx
import React from 'react';

type Props = {};

const ComponentName = ({}: Props) => {};
```

- Keep the `Props` type even when the component currently has no props.
- In a client component, `'use client'` stays the first line and `import React from 'react'` follows it. In every file `React` is the first import, and any other `react` names join it: `import React, { useState, type ReactNode } from 'react'`.
- `'use client'` stays only on files that need it (hooks, events, browser APIs, `motion` components); a split part with plain markup only drops it. It marks a client boundary, so a file that only client components import needs none, and a split part never gains a directive its parent didn't have (`FilterPanel`, `ModeChoice`).
- **One component per file.** A component used only by its parent moves into a subfolder named after the parent in kebab-case: `duel/LobbyPanel.tsx` stays, and its parts go to `duel/lobby-panel/Searching.tsx`, `duel/lobby-panel/RoomWaiting.tsx`… A component other files also use stays top-level in the folder as its own file (`pro/ProLockButton.tsx`).
- **Exempt:** `src/components/ui/` (copied kit parts such as `Card`, `CardHeader`), `src/components/dev/` and `src/app/dev/` may keep several components in one file. Each still follows the template (arrow const and a props type) but uses **named** exports, as a file can have only one default. A bare `Props` can't repeat in one file, so where a file holds several components each names its own `<Name>Props`; a single-component file uses `Props`.
- Non-component exports (constants, types) stay named exports, beside the component's default export.
- **Props types other files import** (`ResultActionsProps`, `NamedOrderProps`, `MarkProps`) stay exported under their name, and the file adds `type Props = <thatType>`.
- **Union or generic props** keep a single `props` parameter instead of destructuring, as destructuring a union loses narrowing (`NamedOrder`, `SquadSlot`, `FilterPanel`, `ProfileNotice`). A generic component carries its parameter on the arrow: `const AuthForm = <S extends z.ZodType>(props: Props<S>) => …`.
- **Split parts share class constants** through a sibling `styles.ts` in the parts' subfolder (`duel/lobby-panel/styles.ts`), never by importing them back from the parent. Shared values that aren't classes (a transition, a stage config) go to a sibling `shared.ts`, and a value only one file uses stays in that file. Constants two parents share go to the folder's own `styles.ts` or `shared.ts` (`play/styles.ts`, `game/styles.ts`). A hook one part uses moves with that part; a hook two files share goes to `src/hooks/` (`use-seconds-left.ts`). A file left with no component after a split moves its constants into that subfolder and is deleted.
- **JSX comments:** single-line `{/* … */}` are fine inside markup; the 75-character limit still applies.
- Replace `ComponentName` with the actual component name.
- Use the component's actual CSS module only when custom CSS is required.
- Do not import a CSS module if the component does not use custom CSS.

Because `type Props = {}` would otherwise be rejected by `@typescript-eslint/no-empty-object-type`, that rule is configured with `allowObjectTypes: "always"` in `eslint.config.mjs`. The `react-jsx` transform doesn't need `import React`, so `@typescript-eslint/no-unused-vars` ignores that one name (`varsIgnorePattern: "^React$"`). Don't "fix" the empty `Props` type or drop the `React` import to satisfy a linter — the template wins.

## Next.js

- Server components by default.
- Only use `'use client'` when interactivity, hooks, browser APIs, or another client-only requirement is needed.
- Use dynamic routes for item, collection and other resource pages.
- Route Handlers are for genuine web-only needs (OAuth callback landing, webhooks, `robots.txt`). **They are not a proxy to the backend** — a route handler that forwards a call to NestJS adds a hop, hides errors and drifts from the contract.
- `/play/duel` is one route for the whole realtime session. Matchmaking, gameplay and result are phases rendered inside it. A route transition mid-duel risks tearing down the socket and the React tree holding session state.

## Styling

- Tailwind CSS v4 is the primary styling solution.
- Do not create `tailwind.config.ts` or `tailwind.config.js`.
- Configure Tailwind v4 through CSS and `@theme` in `src/app/globals.css`.
- Use the kit in `src/components/ui/` where applicable: Base UI parts copied from neobrutalism.dev (shadcn-style) and restyled to the theme.
- No inline styles. Exception: a value known only at run time, or a Motion animation value, may use `style=` (for example `DuelRecord`'s shares, `CountdownRing`'s arc opacity). Anything static goes in classes.
- Use CSS Modules for component-specific custom CSS when Tailwind and the kit are insufficient.
- CSS Modules must be colocated with the component.

Example v4 configuration:

```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

### CSS Module Naming

For a component:

```text
src/components/test/TestComponent.tsx
src/components/test/test-component.module.css
```

Use:

```tsx
import styles from './test-component.module.css';
```

CSS module filenames must use:

```text
<component-name>.module.css
```

with kebab-case.

- Do not create a CSS module unless custom styles are actually needed.
- Prefer Tailwind for layout, spacing, colors, responsive behavior, and common styling.

## Realtime

- `socket.io-client` in `src/lib/api/socket/`, connected once and held for the duel session.
- The handshake sends the session token and this repo's `PROTOCOL_VERSION` constant.
- Events are parsed on arrival with this repo's own schemas (`src/lib/api/schemas/`). An unrecognised event is logged and ignored, never guessed at.
- The countdown is rendered from the server's start timestamp. The client never decides that time ran out — it renders the backend saying so.

## Testing

- Vitest for hooks and utilities. Components and pages are not unit tested.
- Playwright in `e2e/` for flows, including a two-browser-context duel.
