# Phase W01 — Repo & Scaffold

## Status

Not Started

## Goals

- Add Prettier: `prettier` + `eslint-config-prettier` as devDependencies, a `.prettierrc` and `.prettierignore` at repo root.
- Wire Prettier to ESLint so formatting rules don't fight lint rules: append `eslint-config-prettier` last in `eslint.config.mjs`.
- Add `format` and `format:check` scripts to `package.json`.
- Confirm strict TypeScript in `tsconfig.json` (`strict: true` already set) and the `@/*` → `./src/*` alias resolve correctly; leave the Create-Next-App config otherwise intact.
- Clear the Create-Next-App boilerplate: delete the sample SVGs in `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) and the sample favicon; reduce `src/app/page.tsx` to a minimal placeholder (no `next/image` logos, no template marketing copy); trim any boilerplate marketing markup so nothing references the deleted assets.
- **Preserve the Tailwind CSS pipeline in `src/app/globals.css` — do not break it.** Keep `@import "tailwindcss";` and the `@theme` block mechanism intact and the build green. Real token values land in W02/W03; W01 only removes dead boilerplate, it does not rewire the theme.
- Confirm `AGENTS.md`'s regenerated `next dev` block is committed rather than left as an uncommitted diff.

## Notes

- Scope: this phase only finishes the toolchain and strips boilerplate. The Next.js App Router project, strict TS, the `@/` alias and the ESLint flat config already exist from the initial Create-Next-App commit — **do not re-scaffold them**. The genuine gaps are Prettier and removing the CNA boilerplate (sample SVGs, logo-laden `page.tsx`, sample favicon). No tokens, no theme, no components, no routes here — those are W02+.
- **Tailwind guardrail:** `globals.css` currently holds `@import "tailwindcss";` plus a `@theme inline` block wired to `--font-geist-sans`/`--font-geist-mono` from `layout.tsx`. If boilerplate fonts are touched in `layout.tsx`, keep `globals.css` consistent so no `@theme` variable dangles and the Tailwind build stays green. When in doubt, leave the Tailwind config alone — breaking it blocks every later phase. Verify with `npm run build` after any edit to `globals.css` or `layout.tsx`.
- Depends on: none (W01–W26 build against a mock adapter, no backend).
- Constraints (from `coding-standards.md`): strict TS, no `any`; internal imports use the `@/` alias, never `./`/`../`; SCREAMING_SNAKE_CASE constants, PascalCase components. Prettier config must not conflict with the ESLint config — `eslint-config-prettier` goes last. Per `AGENTS.md`, this Next.js version has breaking changes; read the relevant guide under `node_modules/next/dist/docs/` before touching config, and commit the auto-generated `AGENTS.md` block with the work.
- Constraints (from `CLAUDE.md`): dark-mode only at MVP; never hardcode a colour (not exercised yet, but keep globals free of stray hex).
- Verification: `npm run lint` passes, `npm run format:check` passes, `npm run build` passes cleanly. `npm run dev` serves the default page at http://localhost:3000.

## History
