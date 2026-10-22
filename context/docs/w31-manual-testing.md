# Manual Testing — W31 Duel Wiring (W31a + W31b)

Follow it top to bottom. Each step says what to do and what you should see. If anything differs, stop and report the step number with what you saw.

**You need:**

- Your web dev server on `http://localhost:3000`, in real mode
- Your backend on `http://localhost:8080`, in its own terminal: Parts 9 and 10 restart it
- Chrome, with two separate identities: **Window A** is an Incognito window, **Window B** is a Guest window
- A terminal in `lineup-web` for Part 10
- The answer table at the end of this guide

It takes about an hour. W31a is two players duelling on the real server (Parts 1–3, 5, 8, 10, 11). W31b is your own connection dropping (Parts 4, 6, 7, 9).

---

## Part 0 — Setup

**0.1 Backend `.env`** (in `lineup-backend`). Check:

```text
WEB_APP_URL="http://localhost:3000"
RATE_LIMITS_ENABLED=false
```

If you change either, restart the backend.

**0.2 Web `.env.local`.** Check:

```text
NEXT_PUBLIC_API_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:8080
```

If you change it, restart `npm run dev`.

**0.3 Two identities.** Two Incognito windows share one cookie jar, so they'd be the same player, and the second would take the first's seat. Use:

- **Window A:** File → New Incognito Window.
- **Window B:** profile icon (top right) → **Guest**.

Open `http://localhost:3000` in both, never `127.0.0.1`. Open a **second tab** in each window and keep it open to the end: closing a window's last tab deletes its guest.

**0.4 DevTools in both windows** (F12) → **Network**. The filter `socket.io` shows the socket: a few polling rows, then one **websocket** row. Click it and open **Messages** to see frames. Offline mode (Parts 4, 6 and 7) is the throttling menu at the top of the Network panel: **No throttling** → **Offline**. It applies only to that tab.

**0.5 Write down** the two handles (`guest-xxxxxxxx`) when step 1.2 shows them. Part 12 deletes them.

---

## Part 1 — Pairing and the coin flip

**1.1** In Window A: `/play`, choose **Duel**, click **Find an opponent**.

Expect:

- **Finding an opponent**, "You'll be matched with the next player who's searching." and **Cancel**

**1.2** In Window B, do the same.

Expect, in both windows within a second or two:

- **Opponent found**, "Filters are next.", with both handles: write them down
- Then **Lock in your filters**, "A coin flip picks one set, and the match uses it whole." and **Lock in filters**

**1.3** Click **Lock in filters** in both.

Expect:

- The coin flip names the **same** winner on both sides: one window reads **Your filters won**, the other **guest-xxxxxxxx's filters won**, with "The match comes from these filters."
- About 2 s later, the match: the header shows both clubs, the score, the competition and the date. The ringed crest is the club you're naming.
- The window whose filters **lost** has **Your turn** and a live input; the other shows **Their turn**. Both rings count down from 15.

Find the club you're naming in the answer table.

---

## Part 2 — Play

Use the window whose turn it is as **X**, the other as **Y**.

**2.1 A wrong name.** In X, type `Nobody Atall` and press Enter.

Expect:

- X: the toast **Not in this XI**, the input shakes, the text stays. Still **Your turn**; the clock keeps running.
- Y: nothing changes.

**2.2 A correct name.** In X, clear the input, type the first name from the table and press Enter.

Expect:

- Both: the slot fills with that name.
- The turn passes: Y now has **Your turn** and a fresh 15 s ring; X shows **Their turn**.

**2.3 A name already found.** In Y, type the same name.

Expect:

- Y: the toast **Already named**, and that slot pulses once. The turn stays with Y; the clock keeps running.

**2.4 A correct name back.** In Y, type the second name from the table.

Expect: the turn passes back to X, and both see two slots filled.

**2.5 A round runs out.** In X, type nothing. Watch the ring reach 0.

Expect, about half a second after 0:

- X loses a life: one pip empties in the Lives card, with a red flash on X's screen only.
- The turn passes to Y in both windows.

---

## Part 3 — Reload mid-duel

**3.1** While it's **X's turn**, reload **Y** (Cmd+R).

Expect:

- Y comes back in a second or two on the **same** duel: the same filled slots, lives and turn, with **no gate** and no "Finding an opponent".
- X: the Lives card briefly shows **Reconnecting, 20s** (`ember`), then it clears.
- Y's websocket **Messages**: after the handshake, `42["disconnected",{"status":"connected",…}]` then `42["matchReady",…]`. The page's `queue:enter` is answered `430[{"success":false,"error":{"code":"forbidden","message":"You're already in a duel.",…}}]`, and nothing shows on screen.

---

## Part 4 — Your connection drops, and comes back

**4.1** On **Y's turn**, set **Window X**'s DevTools to **Offline**.

Expect, 10 to 15 s later (the heartbeat notices then):

- X: an overlay **Reconnecting**, "The clock keeps running. If you're not back in 20s, you forfeit the duel.", counting down. The input is locked.
- Y: the Lives card shows **Reconnecting, 20s**, counting down, with "Your turn. Your opponent is reconnecting." Y can still play.

**4.2** Before X's countdown reaches about 10, set X back to **No throttling**.

Expect, within about 5 s:

- X: the overlay clears and the duel goes on, with the right turn and lives.
- Y: the chip clears.
- X's new websocket **Messages**: `disconnected` `connected`, then `matchReady`.

> If X shows **Duel connection closed** instead, you stayed offline too long. Click **Try again** and carry on.

---

## Part 5 — Endings

**5.1 Forfeit.** In the window whose turn it **isn't**, click **Quit**, then **Forfeit** in "Forfeit this duel?".

Expect:

- The forfeiter: **You left**, "You left the duel.", a **Forfeit** mark, and **Play again**.
- The other: **Opponent left**, "guest-xxxxxxxx left the duel." and **Forfeit**.

Click **Play again** in both. They pair again (Part 1), so lock in filters in both.

**5.2 Draw.** Name all 11 players from the table, alternating: the player on turn names the next unnamed one.

Expect, after the 11th:

- Both: **Draw**, "All eleven named. Neither side lost." with all 11 slots filled.

Click **Play again** in both, and lock in filters.

**5.3 Out of lives.** Type nothing in either window. Lives go one at a time, every 15.4 s.

Expect, after about 80 s:

- The player who ran out: **You lost**, "You ran out of lives."
- The other: **You won**, "guest-xxxxxxxx ran out of lives."

Click **Play again** in both, and lock in filters.

---

## Part 6 — Away too long

**6.1** Once the match starts, set **Window A** to **Offline** and leave it.

Expect:

- 10 to 15 s later: A shows the **Reconnecting** overlay; B shows the **Reconnecting, 20s** chip.
- About 17 s after A's overlay appeared: A shows **Duel connection closed**, "Couldn't reach Lineup. Check your connection and try again." and **Try again**.
- When B's chip reaches 0: B shows **Opponent left**, "guest-xxxxxxxx left the duel."

**6.2** Set A back to **No throttling**, then click **Try again** in A.

Expect, within about 3 s:

- **The duel ended while you were away**, "Checking the result…"
- Then "You lost. N of 11 named.", **Play again** and **View profile**.
- A's new websocket **Messages**: **no** `queue:enter` frame. The page didn't join the queue.

**6.3** Click **View profile**.

Expect: `/profile`, whose history lists this duel first: **Duel**, **Loss**.

---

## Part 7 — Drops in the lobby

**7.1 While searching.** Put Window B on `http://localhost:3000/` (home). In Window A: `/play` → **Duel** → **Find an opponent**. Set A to **Offline** for 20 s, then back to **No throttling**.

Expect:

- A shows **Finding an opponent** the whole time, with no gate.
- Then in B: `/play` → **Duel** → **Find an opponent**. Both pair: **Opponent found**. A rejoined the queue by itself.

**7.2 During filters.** With both on **Lock in your filters**, set A to **Offline**.

Expect:

- B, 5 to 15 s later: **The match was called off**, "Your opponent left." and **Search again**.

Set A back to **No throttling**.

Expect:

- A: **The match was called off**, "Your connection dropped before the match started." and **Search again**.

Click **Search again** in both. They pair again; lock in filters in both.

---

## Part 8 — The opponent closes their tab

**8.1** Once the match starts, in **Window B** close the **duel tab** only. The second tab from 0.3 keeps B's guest.

Expect, in A:

- The Lives card: **Reconnecting, 20s**, counting down. If it's A's turn, A's clock keeps running.
- When it reaches 0: **Opponent left**, "guest-xxxxxxxx left the duel."

**8.2** In Window B's other tab, open `http://localhost:3000/play/duel`. In A, click **Play again**. Both pair; lock in filters in both.

---

## Part 9 — The backend restarts mid-duel

**9.1** Once the match starts, in the backend terminal press `Ctrl+C`, then start it again at once with `npm run start:dev`.

Expect:

- Both windows: the **Reconnecting** overlay, straight away.
- About a second after the backend logs "Nest application successfully started": **The duel ended while you were away**, "Checking the result…"
- About 2 s later: "We couldn't find its result in your history." with **Play again** and **View profile**. A duel the server never finished is never saved.

> If the backend takes longer than about 15 s to start, the windows show **Duel connection closed** first. Click **Try again** in each: the same ended state follows.

---

## Part 10 — Rate limits

**10.1** In `lineup-backend/.env`, set `RATE_LIMITS_ENABLED=true` and restart the backend. Put Window A on `/play` (not the duel page).

**10.2** In Window A's DevTools: **Application** → **Cookies** → `http://localhost:3000` → copy the **Value** of `lineup.session_token`.

**10.3** In a terminal in `lineup-web`, paste the value between the quotes and run:

```bash
COOKIE='lineup.session_token=PASTE_VALUE_HERE'
TOKEN=$(curl -s -H "Cookie: $COOKIE" http://localhost:8080/auth/token | node -e "let s='';process.stdin.on('data',(d)=>(s+=d)).on('end',()=>console.log(JSON.parse(s).data.token))")
TOKEN=$TOKEN node -e "
const { io } = require('socket.io-client');
const s = io('http://localhost:8080', { auth: { token: process.env.TOKEN, protocolVersion: 1 }, reconnection: false });
s.on('connect_error', (e) => { console.log('refused', e.message); process.exit(1); });
s.on('connect', async () => {
  for (let i = 1; i <= 10; i++) {
    const enter = await s.timeout(5000).emitWithAck('queue:enter');
    const leave = await s.timeout(5000).emitWithAck('queue:leave');
    console.log(i, enter.success, leave.success);
  }
  s.close();
});"
```

Expect: ten lines, `1 true true` to `10 true true`. That spends A's 10 queue entries for this minute.

**10.4** At once, in Window A: **Duel** → **Find an opponent**.

Expect:

- **Couldn't join the queue**, "Too many attempts. Try again in N seconds.", counting down, with **no** Try again button
- When it ends: "Too many attempts. You can try again now." and **Try again**

**10.5** Click **Try again**.

Expect: **Finding an opponent**. Click **Cancel**.

**10.6** Set `RATE_LIMITS_ENABLED=false` again and restart the backend.

---

## Part 11 — Profile

**11.1** Open `/profile` in both windows.

Expect, in each:

- **Duel record** counts every duel that window finished: the forfeit (5.1), the draw (5.2), the lives (5.3), the away loss or win (6), and the closed tab (8). The restart in Part 9 and the called-off room in 7.2 add nothing.
- The history lists each as **Duel**, with **Win**, **Loss**, **Draw** or **Forfeit win** as each window saw it, newest first.

---

## Part 12 — Clean up

**12.1** Put your two handles in both lists, then run this in `lineup-backend`:

```bash
echo "DELETE FROM game_sessions WHERE id IN (SELECT session_id FROM game_participants WHERE user_id IN (SELECT id FROM users WHERE handle IN ('guest-AAAAAAAA', 'guest-BBBBBBBB'))); DELETE FROM users WHERE handle IN ('guest-AAAAAAAA', 'guest-BBBBBBBB');" | npx prisma db execute --stdin
```

Expect "Script executed successfully." The duels go first: a user with games can't be deleted.

**12.2** Close both windows.

**12.3** Check that `RATE_LIMITS_ENABLED=false` is back, and the backend is running.

If every step matched, run `/feature complete`.

---

## Troubleshooting

| What you see | Likely cause |
| --- | --- |
| Both windows show the same handle, or one says "You're connected somewhere else." | Both windows share cookies. Window B must be a Guest window, not a second Incognito window |
| The duel page resumes an old duel instead of searching | A duel from an earlier step is still running. Quit → Forfeit, then Play again |
| **No opponent found** | Nobody searched for 60 s. Click **Search again** and start the other window |
| No overlay in Part 4 or 6 | Offline was set in the other window's DevTools, or 15 s haven't passed yet |
| **Duel connection closed** during Part 4 | You stayed offline past Socket.IO's last attempt (about 17 s after the overlay). Click **Try again** |
| "Too many attempts" outside Part 10 | `RATE_LIMITS_ENABLED` is still `true` |
| Part 10.3 prints `refused unauthorized` or `TypeError` | The cookie value was copied wrong, or Window A has no guest yet: play Part 1 first |
| Part 10.4 starts searching | More than a minute passed since 10.3. Run 10.3 again, then 10.4 straight away |
| A Console line `[api] socket …: bad response` | The web's copy of a socket payload differs from the backend's. Send the line |

---

## Answer table

The seeded matches. Find your match by the header's clubs and date; the ringed crest is the club you're naming.

| Match | You're naming | Starting XI |
| --- | --- | --- |
| NGU v RIV, 3 May 2003 | Northgate United | Gareth Pennock, Dean Harlow, Stuart Fenwick, Ciarán O'Donovan, Rhys Harlow, Liam Ashworth, Jasper van der Linde, Kieran Moss, Kofi Addo-Mensah, Wes Tolland, Brandon Keele |
| NGU v RIV, 3 May 2003 | Riverton Athletic | Mikkel Ravn, Glen Hartigan, Samuel Okafor, Lewis Carbery, Neil Stroud, Diego Ferreira, Aaron Whitlock, Jamie Rourke, Paddy Quinlan, Marlon Beckford, Tyrese Holloway |
| RSO v NGU, 25 May 2005 | Real Solvara | Álvaro Montesinos, Rubén Arteaga, Mateus de Almeida, Íñigo Castañeda, Joaquín Lledó, Francisco Belmonte, Sergi Vall, Tavinho, Christophe Delacroix-Morel, Lucas Iturbe, Nicolás Peñaranda |
| RSO v NGU, 25 May 2005 | Northgate United | Gareth Pennock, Dean Harlow, Stuart Fenwick, Ciarán O'Donovan, Rhys Harlow, Liam Ashworth, Jasper van der Linde, Callum Reddish, Kofi Addo-Mensah, Wes Tolland, Andrei Voicu |
| VAL v OST, 5 July 2006 | Valdoria | Álvaro Montesinos, Rubén Arteaga, Íñigo Castañeda, Héctor Galindo, Joaquín Lledó, Francisco Belmonte, Sergi Vall, Pau Ribalta, Nicolás Peñaranda, Lucas Iturbe, Dani Escobedo |
| VAL v OST, 5 July 2006 | Ostrenia | Łukasz Wróbel, Tomáš Hrubeč, Pavel Sedláček, Andrzej Kołodziej, Jakub Černý, Mariusz Pająk, Ondřej Vlček, Grzegorz Żmuda, Radek Novotný, Kamil Szczęsny, Viktor Dragan |
| ACA v RSO, 17 January 2010 | Atlético Castellmar | Iván Carrasco, Borja Linares, Óscar Belloch, Guillermo Sauret, Andreu Pineda, Diego Ferreira, Tavo, Marc Rovira, Aitor Zubeldia, Ramón Echarri, Kwabena Asante |
| ACA v RSO, 17 January 2010 | Real Solvara | Álvaro Montesinos, Mateus de Almeida, Héctor Galindo, Íñigo Castañeda, Yannick Obiang, Francisco Belmonte, Tavinho, Christophe Delacroix-Morel, Nicolás Peñaranda, Dani Escobedo, Jonas Friedl |
| YLD v WEE, 9 May 2012 | Yıldırımspor | Onur Işıklar, Barış Kılıç, İlker Doğançay, Serkan Aydoğdu, Çağlar Yüce, Oğuzhan Şimşek, Emre Karagöz, Gökhan Erçetin, Kerem Şahin, Selim Akbaş, Hakan Tüzün |
| YLD v WEE, 9 May 2012 | FC Weerdam | Bram Oosterhuis, Thijs Mulder, Ruud Kessels, Sander de Groot, Niels Brouwer, Jasper van der Linde, Daan Verhoef, Luuk Hendriks, Mohamed Bakkali, Stefan Jansma, Eskil Bjørnsen |
| KAL v SRV, 14 June 2012 | Kaltmark | Henrik Sølvberg, Anton Weiss-Roeder, Magnus Lindqvist, Tobias Kranz, Jens Aalund, Oskar Brekke, Lukas Förster, Frederik Holm, Espen Dahl, Eskil Bjørnsen, Niklas Brandt |
| KAL v SRV, 14 June 2012 | Serevia | Dragan Petković, Nemanja Kovačić, Luka Babić, Stefan Ilić, Miloš Radonjić, Nikola Vuković, Marko Đurić, Ivan Brajković, Aleksandar Zec, Dušan Lalić, Petar Savić |
| KMC v NGU, 24 May 2015 | Kingsmere City | Tom Ellery, Callum Price, Jordan Achebe, Matt Coyle, Ryan Sutcliffe, Harvey Lomax, Ben Oduya, Sami Haddad, Joel Kirkbride, Nathan Brightwell, Andre Mensah |
| KMC v NGU, 24 May 2015 | Northgate United | Matthias Kühn, Owen Price, Kyle Dunmore, Ibrahim Sarr, Declan Farrow, Luca Benedetti, Sean Pritchard, Tariq Bello, Christophe Delacroix-Morel, Jake Rowntree, Emeka Nwosu |
| NGU v RSO, 7 May 2019 | Northgate United | Matthias Kühn, Owen Price, Ibrahim Sarr, Kyle Dunmore, Alfie Barraclough, Sean Pritchard, Tariq Bello, Luca Benedetti, Emeka Nwosu, Jake Rowntree, Oğuzhan Şimşek |
| NGU v RSO, 7 May 2019 | Real Solvara | Pau Soler, Álex Mirabet, Yannick Obiang, Ignasi Ferrer, Carlos Úbeda, Toni Garrido, Julen Aranburu, Tiago Brandão, Mateo Llorente, Adrián Sotelo, Samuel Ekwueme |
| OST v KAL, 18 December 2022 | Ostrenia | Szymon Kapusta, Filip Horáček, Bartosz Zieliński, Michał Kądziela, Vojtěch Kalina, Dominik Šťastný, Paweł Grabowski, Adam Chmelař, Wiktor Łęcki, Kacper Nowicki, Patryk Ślusarz |
| OST v KAL, 18 December 2022 | Kaltmark | Henrik Sølvberg, Anton Weiss-Roeder, Mads Kjærgaard, Leon Hartwig, Sindre Aas, Lukas Förster, Jonas Friedl, Elias Nordahl, Theo Brandstetter, Niklas Brandt, Aksel Strand |
| RSO v ACA, 21 April 2024 | Real Solvara | Pau Soler, Álex Mirabet, Ignasi Ferrer, Nahuel Ibáñez, Julen Aranburu, Tiago Brandão, Mateo Llorente, Bruno Casares, Eneko Larrañaga, Samuel Ekwueme, Rayan Belkacem |
| RSO v ACA, 21 April 2024 | Atlético Castellmar | Unai Etxeberria, Pol Manresa, Hugo Sáez, Gerard Cortina, Sékou Diabaté, Jan Oriol, Iker Lasa, Adri Palau, Thiago Veloso, Lucas Morán, Youssef Amrani |
