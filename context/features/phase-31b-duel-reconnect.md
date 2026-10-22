# Phase W31b — Duel Reconnect

## Status

Completed

## Goals

- **The adapter reports its own transport.**
  - **`DuelClient.onConnection(handler: (status: 'dropped' | 'restored') => void): Unsubscribe`**, for a drop Socket.IO will retry, and for the reconnect that follows.
  - **Socket** (`src/lib/api/socket/duel-client.ts`):
    - `dropped` on a `disconnect` whose reason is a network drop. Not `io server disconnect` (a takeover, which W30 closes), and not `io client disconnect`.
    - `restored` on every `connect` after the first.
    - The server never sends your own `reconnecting` (handoff §6), so this is the only source.
  - **Mock:**
    - The `youDisconnect` and `youReconnect` scenarios fire `dropped` and `restored` instead of the server-style `disconnected` `reconnecting`, which the real server never sends.
    - `youReconnect` then sends `disconnected` `connected` and `matchReady`, as the server does on a return.
- **Your reconnecting state, mid-duel.**
  - `dropped` while live sets `yourConnection` to `reconnecting`, with a deadline of `serverClock.now() + RECONNECT_WINDOW_MS`.
  - `RECONNECT_WINDOW_MS` is 20 000, the server's window (handoff §7). The deadline is presentation only.
  - W25b's overlay shows it, with the countdown to forfeit and your clock still running.
  - The server's `disconnected` `connected`, then `matchReady`, clear it.
- **No resume means the duel is over.**
  - On `restored` while live, wait `RESUME_WAIT_MS` for `matchReady`; the server sends it straight after the handshake.
  - If none comes, the duel ended while you were away: the window closed, or the clock finished it.
  - Read the result from `GET /profile/history`: the newest entry whose `match.id` is this duel's.
  - Show it as Open Questions 1 decides, with **Play again**.
  - If no entry matches, say the duel ended and offer Play again. The backend saves a duel about 100 ms after `finished`, so read once more after a short wait before giving up.
- **Try again after a mid-duel close resumes, never queues.**
  - "Duel connection closed" from a network give-up while live is W30's `connection` step.
  - Its Try again reconnects **without** `queue:enter`, then waits for `matchReady` as above.
  - A takeover's Try again does the same, since the server hands a duel in play to the newest socket.
- **A drop in the lobby** (Open Questions 2):
  - **Searching:** the server dropped you from the queue. On `restored`, enter the queue again; the `queued` event resets the search.
  - **Paired, filters or the flip:** the server ended the room and told only the opponent. On `restored`, show the called-off gate from W31a, whose action searches again.
- **Tests:**
  - **Socket client** (`socket/duel-client.test.ts`):
    - a network drop reports `dropped`, then `restored` on reconnect
    - a takeover or `disconnect()` reports neither
  - **`duel-session.test.ts`:**
    - `dropped` while live sets the deadline
    - `dropped` in the lobby changes nothing until `restored`
    - `restored` in each lobby phase
    - a `matchReady` within the wait clears the overlay
    - the ended-away state from a history entry, and from none
  - **The resume wait** in `use-duel`: no `queue:enter` on a resume, and the ended-away state after the wait.
  - **Mock:** `youReconnect` sends `dropped`, `restored`, `disconnected` `connected`, then `matchReady`.
- **Docs:** `context/docs/mock-to-backend-map.md` marks your own reconnect live from W31b.

## States after W31b

| Situation | Screen |
| --- | --- |
| Your connection drops mid-duel | Overlay: "Reconnecting", a 20 s countdown, your clock still running |
| It comes back within 20 s | The overlay clears; the duel goes on from the server's state |
| It comes back after 20 s | The ended-away state (Open Questions 1) |
| It never comes back | "Duel connection closed"; Try again resumes or shows the ended-away state |
| A drop while searching | Silent; the search starts again on reconnect |
| A drop during filters or the flip | "The match was called off", with Search again |

## Open Questions

Both settled at `/feature load`, each as recommended.

1. **A duel that ended while you were away.** History has the outcome, the match, the found count and your lives, but not the found players or the opponent's lives.
   - **Recommended: a gate, "The duel ended while you were away".** It names the outcome from history ("You lost", "You won") and offers **Play again**, with the profile as the quieter link. It shows only what the server said.
   - **Rebuild the result card** from history plus the last state seen. It looks complete, but the found pool and the opponent's lives may be stale. `theme.md` says state is server-pushed, never inferred.
2. **A drop in the lobby.**
   - **Recommended: as in the goals.** Searching re-enters the queue silently; later phases show the called-off gate.
   - **Show a gate for every lobby drop.** It's simpler, but a two-second blip while searching would stop the search.

## Out of Scope

- **A local "offline" banner** outside the duel route.
- **Changing Socket.IO's attempts.** W30's 5 attempts take about 20 s, close to the window. If the browser run shows they end well before it, tune them and record the value.
- **Duel analytics events:** W33.

## Notes

- Scope: your own connection during a duel and after one, on top of W31a. Nothing here changes a payload.
- Depends on: W31a (the authoritative `matchReady`, the called-off gate), W30 (`onClose`, the reconnect policy), W25b (the reconnecting overlay, the `connectionLost` result), W32 (`getHistory`).
- **Backend context:** `context/docs/w31-duel-handoff.md`, mainly §6:
  - "The server never sends your own `disconnected` `reconnecting`." The web shows it from Socket.IO's own events.
  - "Coming back after the window, or after the duel ended while you were away: there is no `matchReady` and no replay." The result is read from `GET /profile/history`.
  - "Skip the automatic `queue:enter` on a resumed connection."
- **What the backend does on a drop** (`duel.gateway.ts`, `matchmaking.service.ts` at `f056b66`):
  - A queued player is dropped from the queue.
  - A pre-match room ends, and only the other player is told.
  - A duel in play keeps its clock, and the seat waits 20 s.
- **Mid-duel reconnects (`theme.md` § System):**
  - "You reconnecting": an overlay, the countdown to forfeit, and your clock shown still running.
  - "Connection lost": the result, marked as a forfeit. W25b built this for the mock. In real mode a lost connection can't receive the result, so the ended-away state reads it from history once the player is back.
- Constraints:
  - **No game logic in the client.** The 20 s countdown is presentation. The server decides the forfeit; the web never ends a duel itself.
  - **Never invent state.** The overlay rests on a real transport drop. The result after a return comes only from the server, through history.
  - **Never fail silently.** A drop, a called-off room and an ended duel each get a screen that says so.
  - No `any`; `@/` imports; single-line comments of at most 50 characters; no hardcoded colours.
- Verification:
  - `npm test`, `npm run lint`, `npm run format:check` and `npm run build` pass.
  - **Real mode,** two identities (a normal window and an Incognito window).
    - **Drop mid-duel:** DevTools → Network → Offline in one window. It shows the overlay and countdown; the other shows the `ember` chip. Online within 20 s: both clear and play goes on.
    - **Check first that Offline closes an open WebSocket** in this Chrome; older versions left it open. If it doesn't, find another way to cut one window's connection and record it.
    - **Away too long:** Offline for over 20 s, then Online. The dropped window shows the ended-away state with "You lost"; the other shows the forfeit win.
    - **Backend restart mid-duel:** the in-memory duel is gone. Both windows reconnect, get no `matchReady`, and show the ended state. Record what history shows here: a duel the server never finished has no entry.
    - **Drop while searching:** Offline, then Online. The search goes on, and a second player can still pair.
    - **Drop during filters:** the dropped window shows the called-off gate; the other shows "Your opponent left."
  - **Mock mode:** `?scenario=youDisconnect` and `?scenario=youReconnect`.
  - **Manual testing:** one guide for W31a and W31b together, `context/docs/w31-manual-testing.md`, written after this phase with `/feature manual`. It covers W31a's two-player flows (pairing, play, endings, reload, opponent leaving, rate limits, profile) as well as this phase's reconnects.

**Deviations recorded during implementation**

- **The history entry is found by id, not by match.** The backend's history `id` is the duel's `sessionId` (`history.service.ts`, `toEntry`), so `awayResultOf(entries, sessionId)` needs no match or time rule.
  - The mock now gives each duel its own id (`duel-N`) and records its history entry under it, as the server does.
  - A history read takes the newest 10 entries, twice, 1 s apart. A failed read, a 401 included (through `failureOf`), counts as no entry.
- **The state:**
  - `resume` (`'connecting' | 'waiting' | null`), `isRequeueing`, `away` (`AwayResult`) and a new phase `endedAway`.
  - The events are `connectionDropped` (its deadline is set in `use-duel` from `serverClock.now()`), `connectionRestored`, `resuming`, `resumeMissed` and `awayResultRead`.
  - `RECONNECT_WINDOW_MS`, `RESUME_WAIT_MS`, `AWAY_HISTORY_RETRY_MS` and `AWAY_HISTORY_LIMIT` live in `duel-session.ts`. The mock keeps its own window constant.
- **A return is waited on only when the page was reconnecting or resuming.** Polling can deliver `connect` and `matchReady` in one batch, so `matchReady` may land before `connect()` resolves. Without the guard, the late `connectionRestored` would start a wait that ends the duel by mistake.
- **`failed` clears `yourConnection`, `resume` and `isRequeueing`,** so "Duel connection closed" is never hidden under the reconnecting overlay.
- **Try again resumes whenever the duel is live** (`canResume`), for every step but lock and forfeit. A resume whose connect fails is also retried as a resume.
- **The socket client reports `dropped` for every disconnect but a takeover.** A disconnect of our own never reaches the listener, because `drop()` detaches first, so no separate `io client disconnect` check was kept.
- **The copy:**
  - The title is "The duel ended while you were away".
  - While history is read: "Checking the result…".
  - Once read, the outcome line plus "N of 11 named.": "You won.", "You won: your opponent left.", "You lost." or "It's a draw.".
  - With no entry: "We couldn't find its result in your history." The first wording, "Its result isn't in your history yet. Your profile will show it.", was changed after the restart run: a duel the server never finished is never saved.
  - The actions are Play again, with View profile as the quieter link. `DuelGame` sends the secondary action to `/profile` only in this state; elsewhere it still goes back to the filters.
  - A drop during filters or the flip: "The match was called off", "Your connection dropped before the match started.", Search again.
- **The mock plays the server's way:**
  - `youDisconnect`: dropped at 1 s. A wrapped emitter means a dropped socket hears nothing, rounds included. The mock forfeits you unheard when the window closes, then comes back 2 s later with no snapshot.
  - `youReconnect`: dropped, then back after 5 s with `disconnected` `connected` and `matchReady`.
  - The return is scheduled from inside the forfeit, after `finish()`, because `finish` clears every timer.
- **Left in place: W25b's `connectionLost` result** (`isConnectionLost`). It's reached only by a `disconnected` `forfeited` event, which the real server never sends to the player who dropped. The contract type still carries the status, and the `?state=` snapshots use it.
- **No hook test for `use-duel`'s resume wait.** The repo has no renderer for hooks. The reducer tests cover each decision (no resume from the lobby, the wait only once connected, ended away after a miss), and the browser runs cover the timers.
- **Socket.IO's attempts were not tuned.** It gave up 28.2 s after going offline, and the server forfeited at 30.8 s, 2.6 s later. Close enough to the window.
- **Tests:** 999 in total, 33 new:
  - `duel-session.test.ts`, 23: your own transport (12), ended away (7), `awayResultOf` (2), and the too-late return through the mock and its history (rewritten)
  - `socket/duel-client.test.ts`, 7: dropped for three reasons, then restored; never the first connect; neither for a takeover or a disconnect; unsubscribe
  - the mock, 3 net new: no server event while away, the unheard forfeit and return, the snapshot on `youReconnect`, no changes after `disconnect`, and the history id
- **Checked in the browser, in real mode:**
  - **Setup:**
    - The developer's servers: 3000 (dev, real mode) and the 8080 backend.
    - Two browser contexts, each a fresh guest.
    - The drops used Playwright's `setOffline`. It does close an open WebSocket; both sides notice through the heartbeat, after about 11 s.
  - **Short drop:**
    - At 11.1 s, the dropped page showed "Reconnecting", "The clock keeps running. If you're not back in 20s, you forfeit the duel." The other page showed "Reconnecting, 20s" at the same moment.
    - Back online, it reconnected in 5.0 s and got `disconnected`, then `matchReady`. Both overlays cleared, with the right turn and lives.
  - **Away too long:**
    - The overlay came at 10.9 s. Socket.IO gave up at 28.2 s: "Duel connection closed", "Couldn't reach Lineup.", Try again.
    - The opponent got `forfeit_win` at 30.8 s.
    - Back online, Try again reconnected with no `queue:enter`. 2.9 s later: "The duel ended while you were away", "You lost. 0 of 11 named.", Play again, View profile.
  - **Drop while searching:** the page stayed on "Finding an opponent", with no gate. Afterwards a second player paired with it, so it was back in the queue.
  - **Drop during filters:** the other page showed "The match was called off", "Your opponent left." 7.2 s later. The dropped page showed "Your connection dropped before the match started." Search again on both paired them again.
  - **Backend restart mid-duel:**
    - Run on test ports: a real-mode `next start` on 3200, against a second backend on 8081.
    - Both pages showed "Reconnecting". About 1 s after the backend was back, both showed the ended-away state, then the no-entry line: a duel cut by a restart is never saved.
  - **Console:** only the favicon 404 and the refused polling requests while offline.
  - **Not checked in the browser:** mock mode and its `?scenario=`. The developer's 3000 runs in real mode. The scenarios are covered by the mock tests and by the reducer test that drives `youDisconnect` to the history result.
  - **Clean up:**
    - Both test guests (`guest-tyxp7ahc`, `guest-dxzyiqup`) and their 2 saved duels were deleted, sessions first. The counts are back to 11 users and 6 sessions.
    - The test servers were stopped, and `.next` was rebuilt with the default env.
- **Review:**
  - **Every goal is met,** with the deviations above. Two goals were met differently, both recorded: the history entry is matched by id rather than by `match.id`, and the resume wait is tested through the reducer and the browser, not a hook test.
  - **Bug fixed: Try again could loop after a lost session.**
    - A reconnect whose token call gets a 401 clears the session (W28's rule). The closed gate's Try again then resumed, but `resume()` doesn't establish a session, so every Try again failed the same way.
    - `canResume` is now false when the failure is `unauthorized`. Try again then starts fresh: `ensureSession` makes a new guest and the search starts again, as in W30. The seat belonged to the lost session anyway.
    - Test: "starts fresh, not resumes, once the session is lost". 1000 tests in total.
  - **Checked, no change needed:**
    - A `matchReady` before the late `connectionRestored` (one polling batch) leaves nothing waiting: the return guard needs `resume` or `yourConnection`, and `matchReady` cleared both.
    - A drop while a gate is up (a failed forfeit) shows the overlay, then the server's `matchReady` clears both.
    - A history read still in flight when Play again restarts can only dispatch `awayResultRead`, which the reducer ignores outside `endedAway`.
    - The ended-away state shows no clock, no turn, a locked input and no forfeit; Quit goes back to the filters.
    - A second drop while the re-queue is in flight is cleared by `queued` or by `failed`.
  - **Left as is: an old run isn't cancelled by `restart()` or `resume()`,** as since W22b. Every late dispatch it can make is guarded by phase.
  - **No scope creep.** The `DuelGame` secondary action and `canResume` are what the ended-away gate and the resume need.
- **`/feature test`:** no new tests were needed; 1000 in total.
  - **Already covered:** every helper the phase added or changed is tested: the reducer events, `canResume`, `awayResultOf`, the gate copy, the socket client's `onConnection` and the mock scenarios.
  - **Not unit-tested, by design:** `use-duel`'s timers and history read, and `DuelGame`'s secondary action. They're hook and component code, with no renderer in the repo, and the browser runs cover them.
  - **`awayResultOf` simplified:** it finds the entry by id, then checks `mode` once. The old double check meant the first half could be removed with no test noticing.
  - **Mutation checks,** each restored afterwards; every one fails a test:
    - reducer: the return guard; `isLive` excluding `endedAway`; `failed` clearing your connection; no resume after a lost session; a miss only while waiting; a resume only when live; no clock when ended away; a duel-only history match; the re-queue on a return; Play again from the ended-away gate
    - socket client: no `restored` on the first connect; `dropped` reported at all
    - mock: silent while away; the snapshot on a return; the history id being the duel id
- **Manual testing:** the guide is `context/docs/w31-manual-testing.md`. It covers W31a and W31b in one pass, as decided at W31a.
  - **Two identities:** an Incognito window and a Chrome Guest window. Two Incognito windows share cookies.
  - **Your 8080 backend restarts twice:** mid-duel (Part 9), and with `RATE_LIMITS_ENABLED=true` for the rate limit (Part 10), whose terminal script spends 10 queue entries. Part 10 turns the limit off again.
  - **The answer table** lists all ten seeded matches with both XIs, from the database.
  - **Mock mode was left out** by choice.
- **`/feature manual run`:** every step passed. No app bugs found; three wording issues in the guide, not fixed (left for the developer).
  - **How it was run:**
    - Playwright played both windows, with two browser contexts for Incognito and Guest.
    - DevTools Offline was replaced by `setOffline`, and the Messages panel by frame listeners.
    - Parts 1–8 and 11 ran on the developer's 3000 and 8080.
    - Parts 9 and 10 ran on test ports, chosen by the developer: a real-mode build on 3200, against a backend on 8081. The rate limit was turned on with an env variable on the command line, not by editing `.env`.
  - **Results:**
    - **1:** "Opponent found" with both handles; the same flip winner on both sides; the flip's loser named first.
    - **2:** "Not in this XI" kept the text, with nothing sent to the opponent; "Already named"; a life lost 15.6 s after the turn began.
    - **3:** the reload resumed with no gate; frames `disconnected`, `matchReady`, then `430` "You're already in a duel."
    - **4:** the overlay at 10.6 s; the opponent read "Your turn. Your opponent is reconnecting."; back in 4.6 s.
    - **5:** "You left" / "Opponent left" with Forfeit; "Draw" with 11 slots; out of lives after 78 s, with lives going 15.3 to 15.5 s apart.
    - **6:** the overlay at 10.7 s, "Duel connection closed" at 29.2 s, the opponent's "Opponent left" at 30.7 s. Try again sent no command, then "You lost. 0 of 11 named." The profile listed "Duel | Loss" first.
    - **7:** a silent re-queue, then paired; called off on both sides, with each side's copy.
    - **8:** the chip 0.2 s after the tab closed, and "Opponent left" at 20.6 s.
    - **9:** "Reconnecting" at once; the ended-away state about 6 s later; then "We couldn't find its result in your history."
    - **10:** "Try again in 60 seconds", 57 after 3 s, no Try again until 61 s, then "You can try again now."; Try again went back to searching.
    - **11:** A: 6 duels, 3 won, 1 drawn, 2 lost. B: 2 won, 1 drawn, 3 lost. Each history row matched.
  - **Guide issues** (wording only):
    - **3.1** says "while it's X's turn", but after 2.5 it's Y's turn. The run had Y name a third player first.
    - **4.1** says "on Y's turn", but after 3.1 it's X's turn. The run had X name a fourth player first.
    - **5.1** assumes the Parts 1–4 duel is still running. After a pause it ends on the clock, and Part 11 then counts one more duel. Both happened here: Part 5 started with a fresh duel.
  - **Observations:**
    - The turn label is shown in capitals ("YOUR TURN").
    - In Part 9 the ended-away state came about 6 s after the stop: start-up plus Socket.IO's backoff.
    - One extra duel on the test backend ended on the clock before the restart, and was cleaned up.
  - **Clean up:**
    - The run's guests (`guest-t7ubgl7m`, `guest-k85ko94c`) and their 7 duels were deleted with the guide's SQL. The counts are back to 11 users and 6 sessions.
    - The test servers were stopped, `.next` was rebuilt with the default env, and the browser was closed.
    - Two older guests not created by this run (`guest-nlndlwgg`, `guest-y2alu5yv`) were left.

## History
