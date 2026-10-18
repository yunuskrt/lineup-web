# Manual Testing — W32 Profile Wiring

Follow it top to bottom. Each step says what to do and what you should see. If anything differs, stop and report the step number with what you saw.

**You need:**

- Your web dev server on `http://localhost:3000`, in real mode
- Your backend on `http://localhost:8080`
- Chrome, with DevTools
- A terminal

It takes about 40 minutes, most of it Part 4.

---

## Part 0 — Setup

**0.1 Backend `.env`** (in `lineup-backend`). Check these two lines:

```text
MATCH_POOL_INCLUDE_UNSCORED=true
RATE_LIMITS_ENABLED=false
```

If you change either, restart the backend (`Ctrl+C`, then `npm run start:dev`). Part 8 turns rate limits on for one test, then back off.

**0.2 Web `.env.local`** (in `lineup-web`). Check:

```text
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:8080
```

If you change it, restart `npm run dev`.

**0.3 A clean browser.** Open a new **Incognito** window and use it for Parts 2–8. Its cookies are separate from your normal window, so you start signed out.

> **Keep at least one Incognito tab open until Part 8 ends.** Chrome deletes every Incognito cookie when the last Incognito tab closes. A guest has no password, so once its cookie is gone the browser can't get back to it.

**0.4 DevTools.** Open DevTools (`Cmd+Opt+I`), go to **Network**, and type `8080` in the filter box. Keep it open; several steps check requests.

**0.5 Write down as you go:**

- every guest handle you see (`guest-xxxxxxxx`)
- the account you create in Part 6

Part 10 deletes them.

---

## Part 1 — Backend checks with curl

**1.1 A new guest has an empty profile**

```bash
rm -f /tmp/w32.jar
curl -s -c /tmp/w32.jar -H 'Origin: http://localhost:3000' -X POST http://localhost:8080/auth/guest
curl -s -b /tmp/w32.jar http://localhost:8080/profile
curl -s -b /tmp/w32.jar 'http://localhost:8080/profile/history?limit=20'
```

Expect:

- **Guest:** `"success":true`, with a `guest-…` handle. Write it down.
- **Profile:** `played`, `wins`, `losses`, `draws`, `accuracy`, `bestStreak` and `perfectClears` are all `0`, and `"favouriteClub":null`.
- **History:** `{"entries":[],"nextCursor":null}`.

**1.2 A made-up history page is refused**

```bash
curl -s -b /tmp/w32.jar 'http://localhost:8080/profile/history?cursor=0199f000-0000-7000-8000-000000000000&limit=20'
```

Expect `"code":"invalid_input"` and `"message":"That history page is not available. Start again."`. Part 5 makes the browser hit this.

**1.3 A bad limit is refused**

```bash
curl -s -b /tmp/w32.jar 'http://localhost:8080/profile/history?limit=51'
```

Expect `"code":"invalid_input"`. The limit is 1–50.

---

## Part 2 — A brand-new player

**2.1 Signed out.** Open `http://localhost:3000/profile`.

Expect:

- "No profile yet", "Play a game and your history starts here. No account needed.", **Play** and **Sign in**
- the nav shows **Sign in**
- Network: **no** `POST /auth/guest`. Opening the profile never creates a guest.

**2.2 A guest with no games.** Go to `/sign-in` and click **Continue as guest**. Write down the handle. Open `/profile`.

Expect:

- the handle, a **Guest** tag, and the upgrade strip with **Create account**
- **Duel record:** "No duels yet", with Won 0, Drawn 0 and Lost 0
- **Stats:** Solo runs 0, Perfect clears 0, Best streak 0, Accuracy **—**, Favourite club **None yet**
- **History:** "No games yet"
- no error message

**2.3 An offer you leave never appears.** Go to `/play` and click **Start solo run**. On "Pick your side", click **Quit** without picking. Open `/profile`.

Expect it to be unchanged: still "No games yet" and Solo runs 0.

---

## Part 3 — Each ending lands in history

You need to know the players. Use the **Club** filter on `/play` to get a known match, and name players from the lists below. Each club plays in only one fixture.

| Club (filter) | Match | Starting XI |
| --- | --- | --- |
| **Valdoria** | Valdoria 1–0 Ostrenia, 5 July 2006 | Álvaro Montesinos, Rubén Arteaga, Íñigo Castañeda, Héctor Galindo, Joaquín Lledó, Francisco Belmonte, Sergi Vall, Pau Ribalta, Nicolás Peñaranda, Lucas Iturbe, Dani Escobedo |
| **Yıldırımspor** | Yıldırımspor 2–1 FC Weerdam, 9 May 2012 | Onur Işıklar, Barış Kılıç, İlker Doğançay, Serkan Aydoğdu, Çağlar Yüce, Oğuzhan Şimşek, Emre Karagöz, Gökhan Erçetin, Kerem Şahin, Selim Akbaş, Hakan Tüzün |

Surnames alone work, such as "Montesinos".

**3.1 Run A: the streak rule** (quit)

1. On `/play`, set **Club** to **Valdoria** only, then click **Start solo run**. Pick **Valdoria**.
2. Name **Montesinos**, then **Arteaga**.
3. Type nothing and let the ring reach 0. A life goes and a new round starts.
4. Name **Galindo**.
5. Click **Quit**, then **Quit run**.

Expect the summary:

- "Run ended", "You named 3 of 11"
- **Accuracy 100%**
- **Best streak 2.** This is the rule W32 matches: the life lost to the clock broke the streak, so it isn't 3.
- **Missed 8**, as a count with no names

**3.2 Run B: a perfect clear**

1. Click **Change filters**. Set **Club** to **Yıldırımspor** only, start, and pick **Yıldırımspor**.
2. Name all 11 from the table, quickly.

Expect "Perfect clear", "You named 11 of 11", **3 lives left**, and best streak 11.

**3.3 Run C: lives out**

1. Click **Change filters**. Set **Club** back to **Valdoria**, start, and pick **Valdoria**.
2. Type nothing. Wait about 46 seconds for three rounds to run out.

Expect "Run over", "You named 0 of 11", and best streak 0.

**3.4 Check the profile.** Open `/profile`.

Expect:

- **Stats:**
  - Solo runs 3, Perfect clears 1, Best streak 11
  - Accuracy 100%: 14 correct of 14 judged guesses. A run with no guesses adds none.
  - Favourite club **Valdoria**: played as twice, against once for Yıldırımspor.
- **History**, newest first, each dated "Today":

| Row | Label | Match | Found |
| --- | --- | --- | --- |
| 1 | Run over | VAL 1–0 OST, Global Nations Cup semi-final, 5 July 2006 | 0 of 11 |
| 2 | Perfect clear | YLD 2–1 WEE, The Rain Final: Federation Trophy final, 9 May 2012 | 11 of 11 |
| 3 | Run ended | VAL 1–0 OST, Global Nations Cup semi-final, 5 July 2006 | 3 of 11 |

- **Duel record:** still 0 0 0. Duels are saved from backend B41.
- Network: `GET /profile` and `GET /profile/history?limit=20`, both **200**.

**3.5 Run D: an abandoned run**

1. Open a **second** Incognito tab on `/play` and leave it there. It keeps your cookie alive.
2. In the first tab, start a Valdoria run and pick **Valdoria**.
3. Close **only that game tab**: the run is abandoned mid-play.
4. Wait **2 minutes** without starting anything.
5. In the remaining tab, open `/profile`.

Expect a new top row: "Run over", 0 of 11, "Today". Solo runs is now **4**. The backend saves an abandoned run within about a minute, as lives out.

> If the row isn't there yet, wait a minute and reload. A saved run can appear late; the page never treats that as an error.

---

## Part 4 — Paging ("Show more")

A page holds 20 runs. You have 4, so you need 17 more quick runs to make 21.

**4.1 Seventeen quick runs.** For each one:

1. On `/play`, with Club still on Valdoria, click **Start solo run**.
2. Pick **Valdoria**.
3. Click **Quit**, then **Quit run**.
4. Click **Play again**, which keeps your filters, then repeat from 2.

Each run takes about 10 seconds. Count to 17.

**4.2 Open `/profile`.**

Expect:

- **Solo runs 21**
- **20 rows**, with **Show more** under them
- Network: one `GET /profile/history?limit=20`

**4.3 Click Show more.**

Expect:

- **21 rows.** The last is Run A's "Run ended", 3 of 11, and no row appears twice.
- **Show more** is gone: that was the last page.
- Network: `GET /profile/history?cursor=<uuid>&limit=20`, **200**
- Keyboard focus doesn't jump to the top while the row appears

---

## Part 5 — A refused page restarts from page one

This makes the backend refuse a page for real. Chrome serves a first page whose `nextCursor` you changed, so "Show more" sends a cursor the backend doesn't know.

**5.1 Override the first page**

1. On `/profile`, reload. In Network, find `history?limit=20`.
2. Right-click it, then **Override content**.
   - The first time, Chrome asks for a folder for overrides. Create an empty folder, such as `~/lineup-overrides`, select it, and click **Allow** in the bar at the top.
3. Chrome opens the response in **Sources → Overrides**. Press `Cmd+F`, search for `nextCursor`, and replace its value with this, keeping the quotes:

   ```text
   "0199f000-0000-7000-8000-000000000000"
   ```

4. Press `Cmd+S` to save.

**5.2 Reload `/profile`.**

Expect:

- 20 rows and **Show more**
- In Network, the `history?limit=20` row is marked as overridden (a purple dot on its icon)

**5.3 Click Show more.**

Expect:

- Network: `history?cursor=0199f000-0000-7000-8000-000000000000&limit=20` answered **400**. Its Response tab shows `"code":"invalid_input"`, "That history page is not available. Start again."
- On the page, the 20 rows stay, with **Couldn't load more games.** and **Try again** under them
- Console: one red line for the 400. That's expected.

**5.4 Turn the override off.** In **Sources → Overrides**, untick **Enable Local Overrides**.

**5.5 Click Try again.**

Expect:

- Network: a new `history?limit=20` with **no cursor**, answered 200. This is the restart from page one.
- While it runs, the button reads "Loading…". The rows stay; the page never blanks to a skeleton.
- Then **Show more** comes back.

**5.6 Click Show more.**

Expect `history?cursor=<real uuid>&limit=20` answered **200**, and 21 rows with no duplicates. Paging works again.

**5.7 Tidy up.** In **Sources → Overrides**, right-click the folder and choose **Remove folder from workspace**. Delete `~/lineup-overrides` if you like.

---

## Part 6 — Guest to account, and a different account

**6.1 Upgrade the guest.** On `/profile`, click **Create account** in the guest strip.

Expect `/sign-in` on the Create account tab, with "You're playing as guest-…. Create an account to keep your history."

**6.2 Fill it in:**

- **Handle:** `w32-test`
- **Email:** `w32-test@lineup.test`
- **Password:** `w32-password-1`

Submit.

Expect to land on `/play`, with **w32-test** in the nav.

**6.3 Open `/profile`.**

Expect:

- the handle **w32-test**, with **no** Guest tag and **no** upgrade strip
- **the same numbers as before:** Solo runs 21, Perfect clears 1, Best streak 11, Accuracy 100%, Favourite club Valdoria
- the same 20 rows plus Show more

The upgrade keeps the same user, so nothing is lost.

**6.4 Sign out.** Go to `/sign-in` and click **Sign out**.

**6.5 A new guest with one run.**

1. On `/play`, start a solo run (any club), pick a side, then Quit.
2. Write down the new guest handle from the nav.
3. Open `/profile`.

Expect a **Guest** profile with Solo runs **1** and one row.

**6.6 The guest note.** Go to `/sign-in`, on the **Sign in** tab.

Expect: "You're playing as guest-…. **Signing in to another account leaves this guest's games behind.**"

Switch to **Create account**. Expect the line to read "Create an account to keep your history." instead.

**6.7 Sign in to the other account.** Go back to the Sign in tab and sign in as `w32-test@lineup.test` with `w32-password-1`. Open `/profile`.

Expect:

- **w32-test**, with Solo runs **21**, not 22
- the history doesn't include the guest's run

The guest's game stayed with the guest; merging it in is deferred on the backend.

---

## Part 7 — Signed out elsewhere (401)

**7.1** In the same Incognito window, open a second tab on `/sign-in`. You're signed in as w32-test there too. Click **Sign out**.

**7.2** Go back to the first tab, on `/profile`, and click anywhere in the page so the tab regains focus.

Expect:

- the page switches to "No profile yet…", and the nav shows **Sign in**
- Network: `GET /profile` and `GET /profile/history` answered **401**, once each, with no retries

**7.3** Sign in again as w32-test, ready for Part 8.

---

## Part 8 — Too many requests (429)

**8.1 Turn rate limits on.** In the backend `.env`, set `RATE_LIMITS_ENABLED=true` and restart the backend.

**8.2 Use up the limit** for w32-test. `/profile` allows 120 requests a minute per user. This signs in from the terminal as the same user and sends 125:

```bash
rm -f /tmp/w32.jar
curl -s -c /tmp/w32.jar -H 'Origin: http://localhost:3000' -H 'Content-Type: application/json' \
  -d '{"email":"w32-test@lineup.test","password":"w32-password-1"}' \
  http://localhost:8080/auth/sign-in > /dev/null
for i in $(seq 1 125); do
  curl -s -o /dev/null -w '%{http_code}\n' -b /tmp/w32.jar http://localhost:8080/profile
done | sort | uniq -c
```

Expect `120 200` and `5 429`.

**8.3 See the body.** Run this within the same minute:

```bash
curl -s -D - -b /tmp/w32.jar http://localhost:8080/profile | grep -i -E 'retry-after|rate_limited'
```

Expect:

- a `Retry-After` header
- `"code":"rate_limited"`, with `retryAfterMs` set

**8.4 Reload `/profile` in the browser**, within the same minute.

Expect:

- **Couldn't load your profile**, **Too many attempts. Try again in N seconds.** (N at most 60), and **Try again**
- Network: `GET /profile` answered **429** once. It isn't retried on its own, so nothing more is sent while you wait.

**8.5** Wait N seconds, then click **Try again**.

Expect the profile to load, with the same numbers as in 6.7.

**8.6 Turn rate limits off again.** Set `RATE_LIMITS_ENABLED=false` and restart the backend.

---

## Part 9 — Mock mode

**9.1** Stop the web dev server. In `.env.local`, set `NEXT_PUBLIC_API_MODE=mock`, then run `npm run dev`. Open a **new** Incognito window: close the old one first, so the mock starts empty.

**9.2 The streak rule in the mock.** Repeat **3.1**: Club **Valdoria**, pick **Valdoria**, name Montesinos and Arteaga, let one round run out, name Galindo, then Quit.

Expect:

- the summary shows **Best streak 2** (before W32 the mock showed 3)
- Network: **no** requests to `8080`

**9.3 The profile.** Click **Change filters**, then the guest handle in the nav.

Expect:

- a Guest profile, Solo runs 1, Best streak 2, Favourite club Valdoria
- one "Run ended" row

Use the nav link rather than typing the URL: a full reload restarts the mock with an empty store.

**9.4 The guest note.** Click **Create account** in the strip, then switch to the **Sign in** tab.

Expect the same line as 6.6.

**9.5 Dev snapshots.** Open each of these. They don't use the session, so the mode doesn't matter:

| URL | Expect |
| --- | --- |
| `/profile?state=signed-out` | "No profile yet…" |
| `/profile?state=empty` | Zero stats, "No games yet" |
| `/profile?state=guest` | Guest tag, strip, rows, **Show more** |
| `/profile?state=loading-more` | Rows, then a dimmed **Loading…** button |
| `/profile?state=more-failed` | Rows, then "Couldn't load more games." and **Try again** |
| `/profile?state=end` | Rows, and no button under them |
| `/profile?state=error` | "Couldn't reach Lineup. Check your connection and try again." and **Try again** |

**9.6** Set `NEXT_PUBLIC_API_MODE=real` again and restart `npm run dev`.

---

## Part 10 — Clean up

The test users now have saved runs. A user who has played can't be deleted on its own, so their runs go first.

**10.1** Put your handles in this list:

- the curl guest from 1.1
- `w32-test`, which was the guest from 2.2
- the guest from 6.5

Then run this in `lineup-backend`:

```bash
cat <<'SQL' | npx prisma db execute --stdin
DELETE FROM game_sessions WHERE id IN (
  SELECT session_id FROM game_participants WHERE user_id IN (
    SELECT id FROM users WHERE handle IN ('guest-AAAAAAAA', 'w32-test', 'guest-BBBBBBBB')));
DELETE FROM users WHERE handle IN ('guest-AAAAAAAA', 'w32-test', 'guest-BBBBBBBB');
SQL
```

Expect "Script executed successfully." Deleting a session also deletes its rounds and guesses. Deleting a user also deletes its stats, sessions and accounts.

**10.2** Check in Prisma Studio (`npx prisma studio`): those handles are gone from **User**.

**10.3** Run `rm /tmp/w32.jar`. Close the Incognito window.

**10.4** Check that `RATE_LIMITS_ENABLED=false` in the backend `.env` and `NEXT_PUBLIC_API_MODE=real` in `.env.local`, as they were at the start.

If every step matched, run `/feature complete`.

---

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| `/play` lists no clubs, or every start says no match fits | `MATCH_POOL_INCLUDE_UNSCORED` isn't `true`, or the backend wasn't restarted |
| Best streak 3 in 3.1 | The ring hadn't reached 0 before you named Galindo. A life must be lost between the names |
| Run D never appears | You started another run during the 2 minutes. That run closed it as "Run ended" instead |
| Back to "No profile yet" after closing a tab | That was the last Incognito tab, so Chrome deleted the cookie. The old guest is unreachable; add its handle to Part 10's list and restart from 2.2 in a new Incognito window |
| 21 runs but no Show more | One quick run didn't start: you quit on "Pick your side". Check that Solo runs reads 21 |
| In 5.3, Show more loads rows instead of failing | The override didn't apply. Check that **Enable Local Overrides** is ticked, and that you saved with `Cmd+S` |
| In 5.5, the page shows the whole-page error | The override was still on when you pressed Try again. Untick it, reload `/profile`, and redo from 5.1 |
| Upgrade fails with "Too many attempts" | Rate limits are on. Set `RATE_LIMITS_ENABLED=false` and restart the backend |
| 8.2 shows only `200`s | `RATE_LIMITS_ENABLED` wasn't `true`, or the backend wasn't restarted after the change |
| The 10.1 script fails on `game_participants` | A handle in the list is misspelled, so its runs weren't deleted first |
| A Console line `[api] GET /…: bad response` | The web client's copy of the contract differs from the backend's. Send the line |
