# Fix — Conventions C: Auth

## Status

Not Started

## Goals

Phase 3 of `context/docs/code-cleanup-guide.md`, batch conventions-c. Items approved by the user on 2026-11-19 (convention-auditor report, "Approve all"). **Mechanical: design and behaviour don't change.** Folder: `components/auth`.

- **19.** `AuthError.tsx`: template (`AuthErrorProps` → `Props`). Importers: SignedInPanel, AuthField, ContinueAsGuest.
- **20.** `AuthField.tsx`: template; `type AuthFieldConfig` stays named. Importer: AuthForm (mixed).
- **21.** `AuthForm.tsx`: template with the generic: `type Props<S extends z.ZodType>`, `const AuthForm = <S extends z.ZodType,>(props: Props<S>) => …` (generic props keep `props`). Importers: SignInForm, SignUpForm.
- **22.** `AuthPanel.tsx`: split Header → `auth/auth-panel/Header.tsx`; template. Importer: `sign-in/page.tsx`.
- **23.** `AuthSkeleton.tsx`: split FieldSkeleton → `auth/auth-skeleton/FieldSkeleton.tsx`; template. Importer: AuthPanel.
- **24.** `ContinueAsGuest.tsx`: template (Props none). Importer: AuthPanel.
- **25.** `ModeSwitch.tsx`: template. Importer: AuthPanel.
- **26.** `SignedInPanel.tsx`: template. Importer: AuthPanel.
- **27.** `SignInForm.tsx`: template (Props none); `SIGN_IN_FIELDS` stays named. Importer: AuthPanel.
- **28.** `SignUpForm.tsx`: template (Props none); `SIGN_UP_FIELDS` stays named. Importer: AuthPanel.

## Out of Scope

- Anything beyond the template, the splits and their imports: no renames (e.g. `ArchiveSkeletonRows` keeps its name), no copy, class or logic changes.
- Other folders' files, except updating their imports of a component changed here.

## Notes

- **Source:** `convention-auditor` report, step 3.1 of the guide; numbers are its item numbers.
- **Rules:**
  - **The template** (`coding-standards-web.md`): `import React from 'react'` (after `'use client'` when present), `type Props = {…}` (even empty), `const Name = ({…}: Props) => {…}`, `export default Name`. Non-component exports (constants, types) stay named beside the default.
  - **A split moves code unchanged** into `<parent-kebab>/<Name>.tsx` beside the parent. No change to copy, classes, markup order, ARIA, refs, hooks or behaviour.
  - **Decisions (guide, user 2026-11-19):** shared class constants of split parts go to a sibling `styles.ts` in the new subfolder; exported props types that other files import stay exported with a local `type Props = <thatType>`; union or generic props keep a single `props` parameter; single-line `{/* … */}` JSX comments stay.
  - **Importers:** every file importing a changed component switches from `import { X }` to `import X` (mixed: `import X, { CONST } from …`). Importers outside the batch are edited here too; their own batch converts them later.
- **Verification:**
  - `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`;
  - a search finds no named import left for a component this batch made default;
  - B5: `/sign-in` and `/sign-in?mode=sign-up` at 320, 768 and 1280; by hand: sign up, sign in, continue as guest and a field error in mock mode.
- **B7 scope:** only findings inside these goals are fixed; anything else is a follow-up note.
