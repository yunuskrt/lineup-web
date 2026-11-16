# Redesign E1 — Duel Lobby, Room and Versus

## Status

Completed

## Goals

The first part of redesign stage E (`/play/duel`, `context/docs/ui-redesign-references.md` § 7): the lobby steps in `LobbyPanel`, shown inside the game's `CanvasGate` (the peach panel from B3). **Behaviour, copy, the lobby reducer, the socket flow, timers and accessible names don't change.** The gate titles from `lib/lobby.ts` ("Finding an opponent", "Waiting for your friend", "Opponent found", "Your filters won"…) stay as they are.

- **Searching** (decided 2026-11-16, no reference):
  - our notice look: a Lucide `Users` icon in an outlined tile (`ICON_TILE`), the you / opponent colour bars under it (`ACTOR_BAR`, yours filled, the opponent's dim and pulsing, as today), and **Cancel** as the secondary Button;
  - no countdown, ambient only; the pulse keeps `lobbyPulse` and drops on reduced motion. `joining` uses the same panel.
- **Room waiting** (`duel/02-versus-a`, `04-room-code-b`, layout only):
  - **the code card:** a dashed 2px ink outline on white, a small "Room code" label, the code in **6 large read-only boxes** in `TYPE_ROOM_CODE` (the same box look as the join field from C2), so it reads aloud one character at a time (open question 2);
  - the boxes are display only (not an input); the whole code keeps today's single accessible name ("Room code K 7 Q M 2 X") and stays selectable;
  - **Copy code** and **Copy link** as secondary Buttons with Lucide `Copy` / `Link` icons; "Copied" confirms in place with a `Check`, and the refused-clipboard line stays;
  - the room's filter summary, the quiet "Closes in 9:41" line and **Cancel** (now the secondary Button, not an underlined link) stay. No countdown clock.
- **Opponent found** (`duel/02-versus-a`, layout only):
  - two **player cards**, each filled with its owner's colour (`you` blue, `opponent` orange), 2px ink outline, the hard shadow, a Lucide `User` icon in a white outlined tile, the handle (truncated) and the "You" / "Opponent" label;
  - a tilted butter **"VS" sticker** between them (`Badge`, sticker variant), decorative (`aria-hidden`); screen readers keep today's "vs";
  - side by side from `sm` (you left, opponent right); stacked on phones (open question 1). Position and label say who's who, not colour alone.
- **Filters and the coin flip** (decided 2026-11-16, reusing C1 / C2):
  - each **filter card** is white with a 2px ink outline and the hard shadow, its owner's `ACTOR_BAR` on top, the title, and the summary rows in the C2 row look;
  - **locked in:** a sticker `Badge` in the owner's colour with a `Check` ("Locked in"), replacing today's coloured border; **Lock in filters** stays the primary Button; the opponent's "Choosing…" and "Hidden until the coin flip." stay;
  - **the coin flip:** the winning set's card with both colour bars (the winner's longer, as today) and a tilted **"Used"** sticker in the winner's colour; the gate title still names whose filters won.
- **Room expired and no opponent:** today's actions, with the underlined text links (**Back to play**, **Search again**) becoming secondary Buttons beside the primary one, as B1 did for the game's actions.

## Out of Scope

- The result panel, the reconnect chip and overlay, and the join-refused message (E2).
- The game board during a duel (stage B).
- The lobby's timings, the coin-flip spring and new motion.

## Open Questions

1. **The versus layout on phones.** `02-versus-a` stacks the opponent on top, VS, then you. **Default: side by side from `sm`; on phones, stacked in reading order (you, VS, opponent)**, so the visual order matches what a screen reader hears. The alternative is the reference's order (opponent on top) with the reading order unchanged.
2. **The room code.** `04-room-code-b` shows one big string. **Default: 6 large read-only boxes**, matching the join field and easy to read aloud. The alternative is one large string in `TYPE_ROOM_CODE`, tracked out.

## Notes

- **References:** `context/screenshots/duel/02-versus-a`, `04-room-code-a`, `04-room-code-b`, and their lines in `context/screenshots/notes.md`.
- **Contrast:** text on the `you` and `opponent` fills uses `on-accent` (tested pairs). The "VS" sticker is ink on butter (tested).
- **New copy:** only the "Room code" label on the code card and the "Used" sticker. Everything else is today's copy.
- **Check:** every lobby step through `/play/duel?state=` (searching, joining, roomWaiting, roomExpired, paired, filters before and after each lock, coinFlip for you and for them, noOpponent); Copy code / Copy link and a refused clipboard; keyboard through each step; 320px and `lg`.
- **Dev server:** the dev cache is off (`next.config.ts`), so `npm run build` can run while the user's dev server is up.
- Then E2.

- **Deviations recorded during implementation:**
  - **Open questions:** both defaults, as the user gave no other answer: versus side by side from `sm` and stacked in reading order on phones (you, VS, opponent); the room code in 6 read-only boxes.
  - **Fluid code boxes:** fixed 48–56px boxes overflowed the code card at 320px, so each box is square (`aspect-square`), shares the width (`flex-1`) and stops at 56px (`max-w-14`): 32px at 320, 39px at 360, 56px at `lg`. The code text is 20px on phones, 28px from `sm`.
  - **`CODE_BOX`:** one class in `classes.ts` for a character box, used by the C2 join field (`ui/input-otp`) and the room code, so the two always match.
  - **Copy buttons:** stacked below 360px (two side by side wrapped "Copy code" onto two lines); the icons don't shrink, and the labels don't wrap.
  - **Narrow gates stack their actions:** in "No one joined" and "No opponent found" the primary and secondary Buttons are full width, one above the other, not side by side as the spec said: the narrow gate wrapped both labels.
  - **The "Room code" label is `aria-hidden`:** the code's own accessible name already starts with "Room code", so readers don't hear it twice.
  - **The VS sticker** is the sticker `Badge` at 20px; readers hear the `sr-only` "vs" as before.
  - **Locked in** sits in the old status row's 32px height, so locking in doesn't shift the card; the old coloured border and the hand-drawn check icon are gone (Lucide `Check`).
  - **Review fixes:** the winner's longer bar merges its width with `cn` (it relied on CSS order), and the copy button's icon is typed `LucideIcon`.
  - **Initial focus:** the gate still focuses its first control on open, so "Copy code" shows the focus ring when the room screen appears, as before.
