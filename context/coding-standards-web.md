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
  lib/socket/                 the Socket.IO client
  stores/                     Zustand stores
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
- **Zustand** for live duel session state, which arrives by socket rather than by request.
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
- Replace `ComponentName` with the actual component name.
- Use the component's actual CSS module only when custom CSS is required.
- Do not import a CSS module if the component does not use custom CSS.

Because `type Props = {}` would otherwise be rejected by `@typescript-eslint/no-empty-object-type`, that rule is configured with `allowObjectTypes: "always"` in `eslint.config.mjs`. Don't "fix" the empty `Props` type to satisfy a linter — the template wins.

## Next.js

- Server components by default.
- Only use `'use client'` when interactivity, hooks, browser APIs, or another client-only requirement is needed.
- Use dynamic routes for item, collection and other resource pages.
- Route Handlers are for genuine web-only needs (OAuth callback landing, webhooks, `robots.txt`). **They are not a proxy to the backend** — a route handler that forwards a call to NestJS adds a hop, hides errors and drifts from the contract.
- `/play/duel` is one route for the whole realtime session. Matchmaking, gameplay and result are phases rendered inside it. A route transition mid-duel risks tearing down the socket and the React tree holding session state.

## Styling

- Tailwind CSS v4 is the primary styling solution.
- Do not create `tailwind.config.ts` or `tailwind.config.js`.
- Configure Tailwind v4 through CSS and `@theme` in `src/app/globals.css`, fed from this repo's own tokens file, transcribed from `theme.md`.
- Use shadcn/ui components where applicable.
- No inline styles.
- Use CSS Modules for component-specific custom CSS when Tailwind/shadcn is insufficient.
- CSS Modules must be colocated with the component.
- Dark mode first; light mode remains supported.
- **Never hardcode a hex value.** Colours resolve from tokens, or the palette stops being swappable.

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

## Motion

- Animation is Motion's job. Custom CSS animation only where Motion cannot do it.
- Animate `transform` and `opacity` only. Never `top`, `left`, `width` or `height`.
- Never put a CSS transition on a property Motion is animating — the two fight and the result stutters.
- Reduced motion is handled **per component** with `useReducedMotion()`, never a global kill-switch. The countdown ring carries information and must keep sweeping regardless.

## Realtime

- `socket.io-client` in `src/lib/socket/`, connected once and held for the duel session.
- The handshake sends the session token and this repo's `PROTOCOL_VERSION` constant.
- Events are parsed with shared schemas on arrival. An unrecognised event is logged and ignored, never guessed at.
- The countdown is rendered from the server's start timestamp. The client never decides that time ran out — it renders the backend saying so.

## Testing

- Vitest for hooks and utilities. Components and pages are not unit tested.
- Playwright in `e2e/` for flows, including a two-browser-context duel.
