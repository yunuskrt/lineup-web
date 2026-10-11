# Manual Testing — W27 Real API Client & W28 Auth Wiring

Follow it top to bottom. Each step says what to do and what you should see. If anything differs, stop and report the step number with what you saw.

**You need:** both repos, a terminal for each, and Chrome (or any browser with DevTools).

---

## Part 1 — Backend checks with curl

These prove the backend behaves the way the web client expects.

**1.1 Start the backend** (skip if it's already running on 8080):

```bash
cd lineup-backend
npm run start:dev
```

```bash
curl -s http://localhost:8080/api/auth/ok
```

Expect `{"ok":true}`.

**1.2 CORS lets the web app in**

```bash
curl -s -o /dev/null -D - -X OPTIONS \
  -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' \
  http://localhost:8080/auth/sign-in | grep -i '^access-control'
```

Expect `Access-Control-Allow-Origin: http://localhost:3000` and `Access-Control-Allow-Credentials: true`.

**1.3 …but not from `127.0.0.1`.** Run the same command with `Origin: http://127.0.0.1:3000`.

Expect **no** `Access-Control-Allow-Origin` line. This is why you always open the app on `localhost`.

**1.4 Guest, cookie, session, profile**

```bash
rm -f /tmp/w28.jar
curl -s -c /tmp/w28.jar -H 'Origin: http://localhost:3000' -X POST http://localhost:8080/auth/guest
curl -s -b /tmp/w28.jar http://localhost:8080/auth/session
curl -s -b /tmp/w28.jar http://localhost:8080/profile
curl -s -b /tmp/w28.jar 'http://localhost:8080/profile/history?limit=20'
```

Expect:

- **Guest and session:** `"success":true`, a handle like `guest-k3f9x0ab`, `"isGuest":true` and `"emailVerified":false`. Note the handle; you'll delete it in Part 6.
- **Profile:** all stats `0`, and `"favouriteClub":null`.
- **History:** `{"entries":[],"nextCursor":null}`.

**1.5 No cookie gives a 401**

```bash
curl -s http://localhost:8080/profile
```

Expect `"code":"unauthorized"` and `"message":"Sign in or continue as a guest first."`. This is the response that signs the web player out (W28).

**1.6 A route that isn't built yet**

```bash
curl -s http://localhost:8080/catalog/filter-options
```

Expect `"code":"not_found"`. `/play` shows this until B25b.

**1.7 The handle rule**

```bash
curl -s -H 'content-type: application/json' \
  -d '{"email":"x@lineup.test","password":"correct-horse","handle":"two words"}' \
  http://localhost:8080/auth/sign-up
```

Expect `"code":"invalid_input"`. No user is created.

---

## Part 2 — Run the web app in real mode

**2.1 Stop the web dev server** (Ctrl+C in its terminal).

**2.2 Create `.env.local`:**

```bash
cd lineup-web
cp .env.example .env.local
```

Then set `NEXT_PUBLIC_API_MODE=real` in `.env.local`. Leave `NEXT_PUBLIC_API_URL=http://localhost:8080`.

**2.3 Check that a bad config stops the app (W27)**

1. Change the URL to `http://localhost:8080/`, with a trailing slash.
2. Run `npm run dev` and open http://localhost:3000.
3. Expect an error page: `NEXT_PUBLIC_API_URL must be an origin, with no path or trailing slash.`
4. Stop the server, remove the slash, and run `npm run dev` again.

> Every change to `.env.local` needs a dev server restart.

**2.4 Open the app**

1. Open a **private window** at **http://localhost:3000** (not `127.0.0.1`).
2. Open DevTools → **Network**, and filter it by `8080`.
3. Keep the **Console** tab visible too.

---

## Part 3 — W27 in the browser

**3.1 Continue as guest.** Go to `/sign-in` and click **Continue as guest**.

Expect:

- you land on `/play`, and the nav shows `guest-xxxxxxxx`
- Network shows `POST /auth/guest`: 200

**3.2 Unbuilt routes.** On `/play`, under Match filters, expect "Not found." with **Try again**, and **Start solo run** disabled.

- Network shows `GET /catalog/filter-options`: 404, **once**. A 404 is never retried.

**3.3 The cookie survives a reload.** Press Cmd+R. Expect the nav to still show the same `guest-…`.

- Click any `8080` request. Its Request Headers include `Cookie: lineup.session_token=…`.

**3.4 Profile.** Click your handle in the nav. Expect:

- your handle as the heading, with a "Guest" label
- the guest strip with **Create account**
- every stat at 0, and "No games yet"

**3.5 Duel.** Open `/play/duel`. Expect "Couldn't start the duel" with "Not found.". The duel loads filter options before it connects, so this is the expected result for now.

**3.6 Console.** Expect no CORS errors, and no lines starting with `[api]`. An `[api]` line means the backend and the web client disagree on a response shape; report it with the paths it prints. The only expected red lines are the 404 and 401 statuses and `favicon.ico`.

---

## Part 4 — W28 in the browser

**4.1 The handle rule on the form.** Go to `/sign-in?mode=sign-up` and enter:

- Handle `two words`
- any email
- a password of 8 or more characters

Click **Create account**. Expect:

- "Use letters, digits, _ . or - only." under Handle
- focus moves to Handle
- **no** request in Network

Then try the handle `ab`. Expect "Use 3 to 24 characters."

**4.2 A wrong password keeps the guest.** Go to `/sign-in` and enter any email with the password `wrong-pass-1`. Expect:

- "Email or password is incorrect."
- the page still says "You're playing as guest-…", and the nav still shows the guest
- Network shows `POST /auth/sign-in`: 401

**4.3 Upgrade the guest.** Go to `/sign-in?mode=sign-up` and enter:

- a handle such as `w28-test`
- an email. Use your Resend account's address if you want to receive the mail.
- a password of 8 or more characters

Click **Create account**. Expect:

- you land on `/play`, and the nav shows `w28-test`
- in Network, `POST /auth/upgrade` is 200. Its response has the **same `id`** as the guest, `"isGuest":false` and `"emailVerified":false`.
- on `/profile`, the guest strip is gone. There's no "confirm your email" message; that's by design (W28 Open Questions 1).

**4.4 Optional: the verification mail.** Click the link in the mail. Expect:

- you land on `localhost:3000/profile`
- after a reload, `GET /auth/session` returns `"emailVerified":true`
- nothing else on the page changes

**4.5 Sign out and sign in again.**

1. Go to `/sign-in` and click **Sign out**. The form comes back.
2. Sign in with the account you just made.

Expect `/play`, with your handle in the nav.

**4.6 A lost session signs you out.**

1. Open `/profile` while signed in.
2. In the backend terminal, run `npm run db:studio`.
3. Open the **Session** model, delete every row whose `userId` is yours, and save.
4. Back in the browser, **without reloading**, click **Play** in the nav, then your handle.

Expect:

- the nav switches to **Sign in**
- `/profile` shows "No profile yet…" with **Play** and **Sign in**, and no error and no Try again
- Network shows `GET /profile` and `GET /profile/history` answering 401, **once each**

**4.7 Backend down.** Stop the backend with Ctrl+C.

1. On `/play`, click **Try again**. After a few seconds, expect "Couldn't reach Lineup. Check your connection and try again." Network shows `filter-options` failing **3 times**, which is 1 try and 2 retries.
2. On `/sign-in`, try to sign in. Expect the same message, with **1** request: actions are never retried.

Then start the backend again.

---

## Part 5 — Mock mode still works

1. Stop the web dev server.
2. Set `NEXT_PUBLIC_API_MODE=mock` in `.env.local`, or delete the file.
3. Run `npm run dev`, and open a fresh private window.

Expect:

- **Network:** no requests to `8080` at all.
- **Guest:** **Continue as guest** puts `guest-xxxxxxxx` in the nav.
- **Solo:** `/play` loads its filters, and **Start solo run** opens a working game.
- **Wrong password:** sign in with the password `wrong-password`. Expect "Email or password is incorrect.", and you stay the guest.
- **Duel:** `/play/duel?scenario=youReconnect` plays the scripted duel and shows the reconnect gate.

---

## Part 6 — Clean up

1. In Prisma Studio, open the **User** model. Delete:
   - the curl guest from Part 1
   - the guest from Part 3, if it wasn't upgraded
   - `w28-test`

   Their sessions and accounts are deleted with them.
2. Run `rm /tmp/w28.jar`.
3. Leave `.env.local` on `mock`, or delete it.

If every step matched, run `/todo done`, then `/feature complete`.

---

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| A CORS error in the Console | The app is open on `127.0.0.1`, or the backend's `WEB_APP_URL` isn't exactly `http://localhost:3000` |
| A `guest-…` handle, but no `8080` requests | The dev server wasn't restarted after editing `.env.local` |
| An error page naming `NEXT_PUBLIC_API_URL` | The value is missing, has a trailing slash or path, or isn't `http(s)` |
| `403` "Request refused." | The request came from an origin other than `http://localhost:3000` |
| Every request fails with the "Couldn't reach Lineup" message | The backend isn't running, or isn't on 8080 |
| The guest is gone after a reload | You're on `127.0.0.1`, or the browser blocks cookies for `localhost` |
| A Console line `[api] GET /…: bad response` | The web client's copy of the contract differs from the backend's. Send the line. |
