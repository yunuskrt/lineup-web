# Guess Suggestions B: Real Directory and Revalidation

## Status

Not Started

## Goals

- **Real suggestions from `GET /catalog/players`** (backend R5), on top of Guess Suggestions A.
  - **Needs:** R5 on the backend's `main` and Guess Suggestions A merged.
- **Transcribe what the backend built.**
  - Read R5's Built note in `context/docs/backend-requests.md` and the backend's OpenAPI.
  - Change `directoryPlayerSchema` and `playerDirectorySchema` wherever they differ from A's transcription.
  - Record any difference as a deviation.
- **One cheap check per match.**
  - **Revalidate this call only.** The transport sends every request with `cache: 'no-store'` (`src/lib/api/http/transport.ts`). The directory call alone uses `cache: 'no-cache'`, through a per-request option on the transport. Every other call stays `no-store`.
  - **How the check works:** with `no-cache`, the browser keeps the response with its `ETag`, sends `If-None-Match` on the next call, and turns a 304 into the cached 200 body. The web needs no ETag code of its own.
  - **When:** the hook from A already refetches on every game mount, so that's one check per match: ~300 bytes when nothing changed, and the full directory once after players change.
  - **Credentials:** the transport stays credentialed. The response is `Cache-Control: private`, so only this browser keeps it.
- **Failure stays quiet.** A 401 goes through the normal session-loss path. Any other error, or a schema mismatch, means no suggestions for that match, and the game is unaffected.
- **Measure and record** (Notes, under deviations):
  - the directory's compressed and raw size on the real database;
  - the time to parse it and build the index, once (`performance.now`);
  - the longest `suggest` call while typing.
- **Tests:**
  - **Transport:** only the directory call asks for `no-cache`.
  - **The HTTP adapter:** it parses a real-shaped payload, and it returns a schema error on a bad one.
- **Docs:**
  - **`context/docs/contract.md`:** call 8 matches what was built, including its caching.
  - **`context/docs/backend-requests.md`:** mark R5 Done.

## Out of Scope

- Anything in A's UI or search, unless real data shows a problem. Record it as a deviation, or open a fix.
- A service worker or IndexedDB copy of the directory. The browser's HTTP cache is enough.
- Mobile.

## Open Questions

Defaults stand unless changed at load:

- **Revalidating at every game mount,** including Play again within the same session: one ~300-byte check each time.

## Notes

- **Source:** the split decided with the user (2026-11-06). A builds the popup on the mock; B wires the real directory once backend R5 exists.
- **Freshness (user, 2026-11-06):** checked once per match with an ETag. A player added mid-match appears from the next match; typing that name still works in the current one, because the server matches it.
- **Verification:**
  - `npm test`, `npm run lint`, `npm run build`.
  - **Real mode (3000 against 8080), DevTools Network:**
    - The first game gets `/catalog/players` as a 200, compressed (`content-encoding`).
    - Play again gets a 304.
    - **Typing sends no request at all.**
    - Image requests per new query are only for rows in view (≤5 before scrolling).
  - **Real names:**
    - Turkish and accented names are found from their plain spelling (`ibrahimovic`, `sahin`, `ozil`).
    - A player without a photo shows initials.
    - An alias-only match, such as a nickname, shows the player.
  - **Duel, two browsers:** both get suggestions on their own turn, and each other's finds are marked "Named".
  - **Backend down or 500 on the directory:** no suggestions, and the solo run plays normally.
