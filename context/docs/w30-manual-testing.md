# Manual Testing — W30 Socket Client

Follow it top to bottom. Each step says what to do and what you should see. If anything differs, stop and report the step number with what you saw.

**You need:**

- Your web dev server on `http://localhost:3000`, in real mode
- Your backend on `http://localhost:8080`, in its own terminal: several steps stop and restart it
- Chrome, with DevTools
- A terminal in `lineup-web`

It takes about 30 minutes.

> **Every duel ends at a gate for now.** The backend refuses every duel command ("Duels aren't open yet.") until it builds matchmaking and the duel (B37–B41). W30 is the connection: the token, the version check, takeovers and reconnects.

---

## Part 0 — Setup

**0.1 Backend `.env`** (in `lineup-backend`). Check:

```text
WEB_APP_URL="http://localhost:3000"
RATE_LIMITS_ENABLED=false
```

The socket accepts only the `WEB_APP_URL` origin. With rate limits off, `GET /auth/token` (30 a minute) can't block a reconnect test. If you change either, restart the backend.

**0.2 Web `.env.local`.** Check:

```text
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:8080
```

If you change it, restart `npm run dev`.

**0.3 A clean browser.** Open a new **Incognito** window on `http://localhost:3000`, never `127.0.0.1`. Keep at least one Incognito tab open until Part 7 ends: closing the last one deletes the guest's cookie.

**0.4 DevTools → Network.** You'll use two filters:

- `auth/` shows the auth calls, such as `/auth/token`
- `socket.io` shows the socket: a few polling requests, then one row of type **websocket**. Click that row and open **Messages** to see the frames.

The socket uses the backend's port, so a plain `8080` filter shows both.

**0.5 Write down** every handle you see (`guest-xxxxxxxx`, and the account in Part 3). Part 9 deletes them.

---

## Part 1 — Backend checks from the terminal

**1.1 A token for a session, none without one**

```bash
rm -f /tmp/w30.jar
curl -s -c /tmp/w30.jar -H 'Origin: http://localhost:3000' -X POST http://localhost:8080/auth/guest
curl -s -b /tmp/w30.jar http://localhost:8080/auth/token
curl -s http://localhost:8080/auth/token
```

Expect:

- **Guest:** `"success":true` and a handle. Write it down.
- **With the cookie:** `"token":"…"`, a long string, and `"expiresAt"` about 5 minutes ahead in epoch milliseconds.
- **Without the cookie:** `"code":"unauthorized"`, "Sign in or continue as a guest first."

**1.2 An out-of-date build is refused, and so is a bad token.** Run this from `lineup-web`; it uses the app's own `socket.io-client`:

```bash
for v in 0 1; do node -e "
const { io } = require('socket.io-client');
const s = io('http://localhost:8080', { auth: { token: 'not-a-token', protocolVersion: $v }, reconnection: false });
s.on('connect_error', (e) => { console.log(e.message, JSON.stringify(e.data)); s.close(); });
s.on('connect', () => { console.log('connected'); s.close(); });
"; done
```

Expect two lines:

1. `protocol_refused {"success":false,"error":{"code":"protocol_refused","message":"This version of Lineup is out of date. Update to keep playing.",…}}`. Version 0 is refused before the token is even looked at.
2. `unauthorized {"success":false,"error":{"code":"unauthorized",…}}`. Version 1 passes, and the bad token is refused.

Each refusal arrives as `connect_error` with the envelope in `data`. That's what the web reads; Part 8 shows the update page it leads to.

---

## Part 2 — A guest connects

**2.1** Go to `/play`, choose **Duel**, and click **Find an opponent**.

Expect, within a couple of seconds:

- **Gate:** **Couldn't join the queue**, **Duels aren't open yet.** and **Try again**
- **The `auth/` filter,** in this order: `POST /auth/guest` 200 (if you had no session), `GET /auth/token` **200**
- **The `socket.io` filter:** polling requests, then a **websocket** row with status **101**

**2.2 The frames.** Open the websocket row → **Messages**. Ignore the `2` / `3` heartbeat frames.

Expect:

| Direction | Frame | Meaning |
| --- | --- | --- |
| ↑ sent | `40{"token":"eyJ…","protocolVersion":1}` | The handshake: a token and the version, nothing else about you |
| ↓ received | `40{"sid":"…"}` | Accepted |
| ↑ sent | `420["queue:enter"]` | The command, with **no** payload |
| ↓ received | `430[{"success":false,"error":{"code":"forbidden","message":"Duels aren't open yet.",…}}]` | The server's refusal, answering the command |

**2.3 Try again.** Click **Try again**.

Expect a new `GET /auth/token` 200 (a **fresh** token every time), a new websocket row, and the same gate.

---

## Part 3 — A registered user connects

**3.1** Go to `/sign-in`, then **Create account**:

- **Handle:** `w30-test`
- **Email:** `w30-test@lineup.test`
- **Password:** `w30-password-1`

This upgrades the guest from Part 2, so you're now **w30-test**.

**3.2** Go to `/play`, choose **Duel**, and click **Find an opponent**.

Expect the same as 2.1 and 2.2: `GET /auth/token` 200, the handshake with `"protocolVersion":1`, then **Couldn't join the queue**, **Duels aren't open yet.** The token is the account's; the frame still carries nothing but the token and version.

---

## Part 4 — Another tab takes over

**4.1** Keep tab A on the duel gate from 3.2. Open tab B in the same Incognito window and go to `http://localhost:3000/play/duel`.

Expect:

- **Tab B:** connects and shows **Couldn't join the queue**, **Duels aren't open yet.**
- **Tab A:** switches to **Duel connection closed**, **You're connected somewhere else.** and **Try again**. In tab A's Messages, the last frames are `42["error",{"code":"forbidden","message":"You're connected somewhere else.",…}]` then a close.

**4.2 No reconnect by itself.** Watch tab A's Network for 20 seconds.

Expect **no** new `GET /auth/token` and **no** new websocket. The tabs don't fight over the connection.

**4.3 Take it back.** In tab A, click **Try again**.

Expect tab A to connect again (one new token, one new websocket) and show **Duels aren't open yet.** Tab B now shows **Duel connection closed**, **You're connected somewhere else.**

**4.4** Close tab B. Keep tab A.

---

## Part 5 — The backend restarts

**5.1** In tab A's Network, filter on `8080`, which shows the token calls and the socket together. In the backend terminal, press `Ctrl+C`, then start it again at once with `npm run start:dev`.

**5.2** Wait until the backend logs "Nest application successfully started".

Expect, in tab A:

- **The gate doesn't change** while the backend is down. The reconnect is silent.
- Failed `socket.io` polling requests while it's down. That's Socket.IO retrying, about every 1 to 5 seconds.
- Once it's back: a new `GET /auth/token` **200**, then a new websocket row whose first sent frame is the handshake with the new token.

> Socket.IO gives up after 5 attempts, about 20 seconds. If your backend takes longer than that to start, you'll see Part 7's result instead. Click **Try again**, and redo Part 5 when the backend is warm.

---

## Part 6 — The session is gone on reconnect

**6.1** In tab A (signed in as w30-test, on the duel gate), open tab C on `/sign-in` and click **Sign out**. Close tab C.

Tab A is still connected: signing out doesn't close the socket.

**6.2** Restart the backend as in 5.1.

Expect, in tab A, once the backend is back:

- `GET /auth/token` answered **401**
- **Duel connection closed**, **Sign in or continue as a guest first.** and **Try again**
- The "You" label in the Lives card goes back to **You**: the page dropped the old session

**6.3** Click **Try again**.

Expect `GET /auth/session`, then `POST /auth/guest` (a **new** guest; write it down), then a fresh token and **Duels aren't open yet.**

---

## Part 7 — The backend stays down

**7.1** In tab A, on the duel gate, stop the backend with `Ctrl+C`. Leave it stopped.

Expect:

- For about 20 seconds, nothing on screen changes. Network shows failed `socket.io` polling requests: Socket.IO's 5 attempts.
- Then **Duel connection closed**, **Couldn't reach Lineup. Check your connection and try again.** and **Try again**
- No more attempts after that

**7.2** Start the backend again, wait for "Nest application successfully started", then click **Try again**.

Expect the duel to connect again and show **Duels aren't open yet.**

---

## Part 8 — Mock mode

**8.1** Stop the web dev server. In `.env.local`, set `NEXT_PUBLIC_API_MODE=mock`, then run `npm run dev`. Use a **new** Incognito window: close the old one first.

**8.2 The update page.** Open `http://localhost:3000/play/duel?scenario=protocolRefused`.

Expect:

- **Update Lineup to keep playing**
- "This version is out of date, so the duel server turned it away. Reload to get the latest version."
- **Reload** and **Back to Play**, and no retry gate

This is what a real out-of-date build shows after 1.2's refusal.

**8.3 The takeover.** Open `http://localhost:3000/play/duel?scenario=connectedElsewhere`.

Expect **Finding an opponent** for about 2 seconds, then **Duel connection closed**, **You're connected somewhere else.** and **Try again**. Try again repeats the same story; the scenario always takes over.

**8.4 A normal mock duel.** Open `http://localhost:3000/play/duel`.

Expect:

- Network shows **no** requests to `8080` and no `socket.io` rows
- **Finding an opponent**, then **Opponent found**, then the filter step with **Lock in filters**
- Lock in. The coin flip names whose filters won, then the match starts.

**8.5** Set `NEXT_PUBLIC_API_MODE=real` again, and restart `npm run dev`.

---

## Part 9 — Clean up

Duels are refused, so none of the test users has a game. Each can be deleted directly.

**9.1** Put your handles in the list:

- the curl guest from 1.1
- `w30-test`, which was the guest from Part 2
- the guest from 6.3

Then run this in `lineup-backend`:

```bash
echo "DELETE FROM users WHERE handle IN ('guest-AAAAAAAA', 'w30-test', 'guest-BBBBBBBB');" | npx prisma db execute --stdin
```

Expect "Script executed successfully." Deleting a user also deletes its sessions and accounts.

**9.2** Run `rm /tmp/w30.jar`. Close the Incognito window.

**9.3** Check that `.env.local` is back on `real`, and the backend is running.

If every step matched, run `/feature complete`.

---

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| "Live duels aren't connected yet." | The dev server still runs the old build. Restart `npm run dev` |
| **Couldn't start the duel** with "Couldn't reach Lineup…" at once | The backend isn't running, or the page is open on `127.0.0.1`. The socket accepts only `WEB_APP_URL` |
| A CORS error for `socket.io` in the Console | The backend's `WEB_APP_URL` isn't exactly `http://localhost:3000` |
| "Too many attempts. Try again in N seconds." on the duel gate | `GET /auth/token` hit its limit. Set `RATE_LIMITS_ENABLED=false` and restart the backend |
| In 4.1 tab A doesn't change | Tab B didn't connect: check it shows "Duels aren't open yet." |
| In Part 5 the page shows "Couldn't reach Lineup…" | The backend took longer than ~20 s to start. Click Try again and redo Part 5 |
| In 6.2 the gate stays on "Duels aren't open yet." | Signing out didn't reach the backend, or the backend wasn't restarted. The 401 only happens on the reconnect's token call |
| 1.2 prints "Cannot find module 'socket.io-client'" | Run it from `lineup-web`, after `npm install` |
| A Console line `[api] socket …: bad response` | The web's copy of a socket payload differs from the backend's. Send the line |
