# Redesign A3 — Layout

## Status

Completed

## Goals

The last part of redesign stage A: the shared layout pieces every page uses. Depends on A1 and A2.

- **Wordmark.** "Lineup" in Archivo 900, width 125 (no wordmark reference was collected; `ui-redesign-references.md` § 2.10).
- **`SiteNav`.** Layout from `layout/01-header-desktop-a` and `02-header-mobile-a`: wordmark on the left, then the links, with plenty of space and a cream bar. In the new style:
  - a 2px ink rule under the bar;
  - Archive and the account as text links, with the current page marked by an underline bar (from the reference's active link), not colour alone;
  - **Play** as the primary `Button` (`brand`, hard shadow).
  - **Below `sm`:** see open question 1. Today Archive, the account icon and Play fit at 320px.
  - Behaviour unchanged: what shows for guests, signed-in users and Pro, the account icon below `sm`, and the Archive entry rules from Pro D.
- **`SiteFooter`.** One quiet line, as in `layout/03-footer-a`, above a `rule` divider. On `/` it keeps its closing statement and Play button, restyled with `TYPE_SECTION` and the primary Button. Copy unchanged.
- **`ProLock`.** Composed from the A2 pieces: the real control shown locked (neutral Button styling, `aria-disabled`, dimmed), a lavender "Pro" `Badge` with a Lucide `Lock` icon, the caption in `fg-muted`, and **See Pro** as a text link. Its three states don't change: Pending (locked, no caption), Locked, Open. With the switch off, nothing changes on screen (theme.md § Pro lock). It covers every current use: Create room, practice, archive, missed reveal, picked match.
- **Empty and error states** on the A2 `Empty` component, with the layout from `layout/09-empty-state-a` and `10-error-state-a`:
  - a Lucide icon in a 48px outlined tile on a block colour, where the references have illustrations;
  - the title in `TYPE_CARD_TITLE`, one `fg-muted` line, and the action as a Button;
  - **copy and actions unchanged.**

  It applies to the current empty and error blocks:
  - the archive's "No match fits" and "Couldn't load";
  - profile notices and the history "Show more" error;
  - the play screen's filter errors;
  - the auth panel's error;
  - the `/pro` error.
- **`QuitChip` and `SoundToggle`** (the only controls on game routes) use the icon Button style: Lucide `X` with the "Quit" label, and Lucide `Volume2` / `VolumeX`. Accessible names unchanged.

## Out of Scope

- Page content and layouts (stages B–H).
- `/pro`'s Free vs Pro table: `layout/08-locked-a` is kept as its reference for stage H.

## Open Questions

1. **Phone menu.** The header reference collapses the links into a menu button. Lineup has only three items, and today all of them fit at 320px with Play visible. **Default: keep them inline** (Play stays one tap away). The alternative is the reference's menu button opening the A2 `Sheet`, with Play still shown outside it.

## Notes

- **References:** `context/screenshots/layout/*`, and the per-image notes in `context/screenshots/notes.md`.
- No illustrations anywhere (decided 2026-11-14).
- With A3 done, stage A is complete. Tell the user, and the next collection is stage B (the game screen, § 4 of the guide).
- **Deviations recorded during implementation:**
  - **Phone menu:** the default kept. Archive, account and Play stay inline at 320px with no overflow, so `sheet.tsx` isn't added.
  - **`StateNotice`** (`src/components/shell/StateNotice.tsx`): a shared wrapper on `Empty` that takes a tone, an icon, a title, a message and the actions. The tones are:
    - **error:** a coral tile with `TriangleAlert`, and the message is `role="alert"`;
    - **empty:** a butter tile;
    - **info:** a mint tile.
  - **`EmptyTitle` gains `level`.** The `/pro` and profile notices are the page itself, so their title stays an `h1`.
  - **Notices without a title** show the message as the main line, in `text-fg`. Error messages lose the red `danger-text`; the coral tile and `role="alert"` carry the error instead.
  - **Notices are centred** in a dashed box; they were left-aligned before. Copy and actions are unchanged.
  - **The profile's signed-out notice also moved** ("No profile yet", an info tone), because it's an empty state.
  - **`ProLock`:**
    - the Pro badge sits in the caption line, not inside the button, so the button's accessible name doesn't change and Pending stays bare;
    - the badge is `aria-hidden`, since the caption says it;
    - the locked control is the secondary variant with no shadow, muted text and `cursor-not-allowed`; it never hovers or presses.
  - **`NavAccount` marks `/profile` as the current page** (`aria-current`), which is new. On phones the link is the icon (the handle is screen-reader only), so it shows no underline there.
  - **The Quit icon shows only from `sm`.** At 320px the wider chip covered the away crest in the match header.
  - **Footer:** the statement uses `TYPE_SECTION` in sentence case; it was uppercase and expanded. The divider is `rule`.
  - **Wordmark:** weight 900 (was 700), still uppercase at width 125.
  - **Checked live:**
    - after Clear search on `/archive`, focus still lands in the search box (Pro Polish B);
    - the profile error notice keeps its `h1` and alert;
    - there's no horizontal overflow at 320px.
