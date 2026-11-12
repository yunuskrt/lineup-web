# Fix — Pro Polish B: Focus, Links and Busy States

## Status

Not Started

## Goals

Keyboard and link details from the Pro browser review (2026-11-12, items 3, 4, 5, 17 and 24). Web only.

- **3. Focus back after "Practise now?" on `/play`.** After Cancel, focus falls to the page body instead of the Start practice button. On the archive it already returns to the Practise button.
  - `PlayStart` returns focus to its Start button when the warning closes without starting (Cancel, Escape).
- **4. Focus after "Play a duel" at the daily cap.** On `/play` at 0 runs left, "Play a duel" switches to Duel and the button disappears, so focus falls to the body.
  - After the switch, focus moves to the Start button, now "Find an opponent".
  - `PlayScreen` holds a ref to `PlayStart`'s button. React 19 passes `ref` as a prop.
- **5. Focus after "Clear search" on `/archive`.** Focus falls to the body when the empty state goes.
  - After Clear search (and Clear filters), focus moves to the search box.
  - `ArchiveScreen` or `ArchiveView` keeps a ref to the input.
- **17. The room gate's See Pro becomes a link.** On `/play/duel?room=create`, See Pro is a button; everywhere else it's a link.
  - The `pro_required` room gate uses `seePro: true` (the gate's link, as the solo gates do) instead of a secondary button. Back to play stays the primary.
  - Leaving the page has to leave the socket. First check that `useDuel`'s unmount cleanup (`stopLobby`) leaves the room or queue. If it doesn't, the link's click calls `leave()` before navigating.
  - `DuelGame`'s `isProRequired` branch in `handleGateSecondaryAction` goes if nothing uses it.
- **24. Archive Practise busy state: verify first.** The review said Practise shows no "Starting…" while a guest is made; the code sets one (`ArchiveRow` `starting === kind`).
  - Reproduce on a fresh signed-out visitor (switch off), where a guest has to be made. Fix only if it fails, and record what was found either way.

## Notes

- **Source:** the Pro browser review (2026-11-12), items 3, 4, 5, 17 and 24.
- **Order:** any; independent of A, C and D.
- **Constraints:** tokens only; `@/` imports; no `any`; comments of at most 50 characters; focus rings stay visible (`FOCUS_RING`).
- **Tests:** focus is component behaviour, checked in the browser. The room gate's view (`roomFailedGate` in `src/lib/duel-session.ts`) has a pure test: `seePro: true`, no secondary label.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Keyboard, in the browser:** each of 3, 4 and 5 leaves focus on the named control (check `document.activeElement`).
  - **Live, Free (switch on):** `/play/duel?room=create` shows See Pro as a link, and following it leaves the room (no waiting room left behind; a second create from another tab still works).
  - Snapshot `room-pro-required` at 320 and 1440.
