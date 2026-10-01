# Fix — Pitch Match Header & Player Images

## Status

Completed

## Goals

- Replace the pitch card's match header (`MatchHeader` in `src/components/game/MatchHeader.tsx`). Today it reads "Yıldırımspor / Home XI in a 4-1-4-1". It becomes the full match, during play and at the end:

  ```text
  [YLD crest] Yıldırımspor  2–1  FC Weerdam [WEE crest]
  Federation Trophy   9 May 2012
  ```

  - **Line 1:** home crest, home name, home score, an en dash, away score, away name, away crest. The scoreline stays centred: each side's name truncates rather than pushing it off-centre.
  - **Line 2:** the competition name and the match date (`matchDateLabel`), in 14px `fg-muted`. They are separate items with a gap between them, with no middle dot.
  - **Found count:** "5/11" stays at the right edge, as today.
  - **Phones** (below `sm`): line 1 uses `shortName`, as in `YLD 2–1 WEE`, and keeps the crests. The room reserved for the quit chip stays.
  - **One fixed height**, shared with the skeleton, so nothing shifts when the match arrives.
  - **No swap at the end.** The header no longer changes when the run ends: it already shows the whole match. The `identity` prop goes.
  - **No formation or "Home XI" line.** That subtitle is gone.
- **The named team is emphasised, with no tag:**
  - **Named side:** its crest sits in a 2px `fg` ring, and its name is `fg`.
  - **Other side:** its name is `fg-muted`, and its crest has no ring.
  - **Screen readers:** a hidden line says "You're naming Yıldırımspor's starting XI."
  - The emphasis uses no amber, because amber means "you" in a duel, and both duel players name the same XI.
- **Club crests:** a new `ClubCrest` component.
  - **Image:** the crest renders from `crestUrl` at 32px, or 40px from `sm`.
  - **Fallback:** when `crestUrl` is null or the image fails to load, the same box shows `shortName` as text on `surface-card`. It's the same size, so nothing shifts.
- **Found players show only an image and a name.** Today a found slot shows initials, the position and the name, as in "OŞ MF / Oğuzhan Şimşek". It becomes:

  ```text
  {headshot}
  Oğuzhan Şimşek
  ```

  - **Headshot:** a new `PlayerHeadshot` component draws a round headshot from `imageUrl`.
  - **Fallback:** when `imageUrl` is null or the image fails, the same disc shows the player's initials (`initials()`) in `fg-muted` on `surface-raised`.
  - **Removed:** the initials badge and the position label leave found slots.
  - **Name:** Inter Medium, `fg`, clamped to two lines, as today.
  - **Screen readers:** the hidden text keeps the position, the name and, in a duel, who named them.
  - **Duel finder cue:** in a duel, the headshot gets a 2px ring in `you` or `opponent` for whoever named the player. That replaces the coloured initials badge. Solo slots have no ring.
  - **Unchanged:** the reveal spring, the `turf` flash and the already-found pulse.
- **Unfound slots:** the same size and shape as a found slot.
  - **Disc:** an empty headshot disc, outlined in `marking`, with a person glyph in `fg-dim`.
  - **Label:** the position label (GK, DF, MF or FW) in `fg-dim`, as today.
  - **Hidden:** no name and no hint.
- **Missed slots** (run end, when the server sends the list): the headshot (or initials) at reduced opacity, with the name in `fg-muted`, on the unfound slot's outline.
- **Slot size:**
  - **Containers from 560px:** slots grow to `h-24` (96px), with a 40px disc.
  - **Smaller containers:** slots stay `h-14` (56px), with a 20px disc.
  - **Why the small size stays at 56px:** the densest mock formation, 4-1-2-1-2, gives about 62px between lines on a 390px phone, so a taller slot would overlap.
  - **Same box everywhere:** the loading skeleton uses the same box. Widths are unchanged.
- **Contract** (the backend later transcribes this; see Notes):
  - **In-play match:** `maskedMatchSchema` is replaced by `matchInPlaySchema` in `src/lib/api/schemas/match.ts`. It is `matchIdentitySchema` extended with `side` and `formation`. `MaskedMatch` becomes `MatchInPlay`, and the named team is `match[match.side]`.
  - **Where it's used:** `soloSessionSchema.match` and `duelSessionSchema.match` become `matchInPlaySchema`. The summary and result keep `match: matchIdentitySchema`, unchanged.
  - **Image URLs:** a new `imageUrlSchema` in `src/lib/api/schemas/common.ts` accepts an absolute `http(s)` URL or a root-relative path (`/mock/...`). It replaces `webUrlSchema` on `clubRefSchema.crestUrl` and `revealedPlayerSchema.imageUrl`. It rejects protocol-relative `//host`, `data:`, `javascript:` and bare relative paths.
- **Mock data and adapters:**
  - **Crests:** every club in `CLUBS` gets `crestUrl: '/mock/crests/<club-id>.svg'`.
  - **Players:** `mockPlayerSchema` gains `imageUrl: imageUrlSchema.nullable()`, and every entry in `players.ts` sets it.
    - Most players point to one of the headshot placeholders below.
    - At least one player per fixture side is `null`, so the fallback shows in every match. Gökhan Erçetin is one of them, matching the screenshot.
  - **Adapters:** the engine's `toRevealed` and the solo `missedPlayers` read the player's `imageUrl` instead of hardcoding `null`. `maskedMatchFor` becomes `matchInPlayFor`.
  - **Dev samples:** `src/lib/dev/samples.ts` and the `?state=` snapshots move to `MatchInPlay`, with crests and headshots, keeping one null image in the sample XI.
- **Placeholder images** (generated in this fix; real URLs replace them when the backend serves them):
  - **Crests:** `public/mock/crests/<club-id>.svg`, one per club: `club-northgate`, `club-riverton`, `club-kingsmere`, `club-real-solvara`, `club-castellmar`, `club-yildirimspor`, `club-weerdam`, `nat-valdoria`, `nat-ostrenia`, `nat-kaltmark`, `nat-serevia`. Each is a flat shield in two club colours with the short code. No real club's crest is copied or imitated.
  - **Headshots:** `public/mock/players/headshot-1.svg` to `headshot-6.svg`, neutral head-and-shoulders silhouettes in varied muted tones. They are assigned to players deterministically, so a reload never reshuffles them.
- **Rendering:** both image components use `next/image` with `unoptimized`.
  - **Why `unoptimized`:** clients fetch images straight from the CDN, and nothing proxies them (`project-overview.md` § Data Architecture). SVG sources are unoptimised by Next anyway.
  - **Size:** explicit `width` and `height` at the rendered size.
  - **Alt text:** `alt=""`, since the name or short code beside the image is the text.
  - **Fallback:** a failed load falls back once and resets when `src` changes, through a small shared hook (`useImageFallback`).
- Update `context/theme.md` and `context/design.md` in the same fix:
  - `theme.md` § Lobby & matchmaking, "Match retrieved": "Match header in full: both crests and names, the score, the competition and the date. The named side is emphasised: its crest is ringed in `bone`, and the other side's name is `muted`."
  - `theme.md` § Loading, "Match header": "Two crest blocks and two bars, at the scoreline and context line heights."
  - `theme.md` § Signature components:
    - "Found-player card": "headshot (initials when there is none) and the name. In a duel, the headshot is ringed in the finder's colour."
    - "Squad grid": "unrevealed slots show an empty headshot disc and the position."
  - `design.md` § The canvas is the fold: "(partially masked per `theme.md` § Lobby)" becomes "(shown in full per `theme.md` § Lobby)".
- Tests:
  - **`imageUrlSchema`:** accepts an `https` URL and a root-relative path, and rejects the cases listed above.
  - **`matchInPlaySchema`:** the solo and duel session schemas parse a mock session.
  - **Header helper:** a new pure helper in `src/lib/match-header.ts` gives each side's display name (full or short), its score, whether it's the named side, and the line 2 items. It also produces the "You're naming…" text. It gets its own test.
  - **Fixtures test:**
    - Every club has a `crestUrl`.
    - Every fixture side has at least one player with an image and one without.
    - Every `/mock/...` path in the data exists under `public/`.
  - **Contrast:** any new colour pairing joins `CONTRAST_PAIRS`, such as `fg` as the crest ring and `fg-muted` initials on `surface-raised`.

## Layout

At `sm` and up, inside the pitch card:

```text
┌────────────────────────────────────────────────────────────┐
│        (◯YLD) Yıldırımspor  2–1  FC Weerdam [WEE]     5/11 │  ◯ = fg ring, named side
│               Federation Trophy   9 May 2012               │  away name in fg-muted
├────────────────────────────────────────────────────────────┤
│                         ┌──────┐                           │
│                         │ (◉)  │   found: headshot + name  │
│                         │Hakan │                           │
│                         │Tüzün │                           │
│                         └──────┘                           │
│        ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│        │ ( )  │  │ (GE) │  │ ( )  │  │ ( )  │  GE = no image│
│        │  MF  │  │Gökhan│  │  MF  │  │  MF  │  ( ) = unfound│
│        └──────┘  └──────┘  └──────┘  └──────┘              │
└────────────────────────────────────────────────────────────┘
```

Phones:

```text
┌──────────────────────────────────┐
│ [YLD] YLD 2–1 WEE [WEE]  5/11 [Q]│  quit chip keeps its corner
│  Federation Trophy  9 May 2012   │
├──────────────────────────────────┤
│  56px slots, 20px disc, 2 lines  │
└──────────────────────────────────┘
```

## Out of Scope

- Crests and headshots anywhere else: the lobby, the run summary panel, the duel result panel and profile history.
- The summary and result contracts (`soloSummarySchema`, `duelResultSchema`). They already carry the full `MatchIdentity`.
- Real image hosting: the bucket, the CDN, licence checks, and any `next.config` image hosts. Those belong to B23, B24, W27 and W35.
- The match nickname and stage. The header shows the competition and date only, during play and at the end.
- Any change to slot positions in `src/lib/formation.ts`, or to reveal, pulse and flash motion.
- The control rail, gates, the quit dialog and `GuessInput`.

## Open Questions

Defaults stand unless changed at load:

- **Named-side emphasis colour.** Default: a `fg` (bone) ring on the named crest, with the other side's name in `fg-muted`. The user chose "emphasis, no tag" without a colour; amber was avoided because it means "you" in a duel.
- **Duel finder cue on headshots.** Default: a 2px `you` or `opponent` ring on the headshot. The screen-reader text already names the finder, so the cue isn't colour alone.
- **Missed slots at run end.** Default: the headshot at reduced opacity, with the name in `fg-muted`.
- **Full radius on headshots.** Default: headshot discs, the initials fallback and the empty disc are fully round. `theme.md` limits full radius to badges, and these are treated as badges. Crests stay inside a `sm` box.

## Notes

- Source: a user request on 2026-10-01 to enrich the gameplay pitch with club crests, player images and the full match in the header. The design references are `context/screenshots/pitch-match-desktop.png`, `pitch-match-tablet.png` and `pitch-match-mobile.png`. They're composition only: `theme.md` and `design.md` win any conflict, and the screenshots' amber "Naming this XI" tag, dashed slot outlines and purple placeholder discs are not adopted.
- Decisions taken when this doc was written:
  - **The full match shows during play** (user decision). This reverses `theme.md`'s "partially masked … competition and date hidden until the end", which is updated in this fix. `project-overview.md` § Singleplayer still says the summary reveals the match "in full"; that stays true, so the shared spec isn't edited.
  - **The score is visible from the first round**, as part of the full header.
  - **Placeholder images are generated SVGs** (user decision), to be replaced by real URLs from the backend later.
  - **Named side: emphasis only, no tag** (user decision).
- Contract and repos:
  - **Web leads the contract here.** The web app is built against the mock before the backend exists (`project-overview.md` § Status), so this repo's schemas lead.
  - **Backend follow-up:** B33 (solo endpoints) and B38/B39 (duel orchestration and events) must send `matchInPlaySchema` for the session's match, and absolute CDN URLs for images.
  - **No version bump:** `PROTOCOL_VERSION` doesn't exist yet (W30), and nothing has shipped, so no bump is needed.
  - **`imageUrlSchema` is looser than the backend needs to be.** The root-relative branch exists for mock assets in `public/`. Real data will always send absolute URLs; tighten the schema at W27 if the root-relative branch is never used outside the mock.
- Constraints:
  - **The squad is never sent ahead of play.** Images arrive only with revealed or missed players, so this adds no leak. Images are never on the critical path: a slot or header renders fully before any image loads, and a failed image falls back silently to text, which is presentation and not a game action.
  - **Colours:** UI colours come only from tokens. The SVG placeholders under `public/mock/` hold their own fills, because they're content standing in for real crests and photos. No component reads a colour from them, and they're never referenced outside the mock data.
  - **Motion:** opacity and transform only. Reveal motion is unchanged, and no new `MotionEffect` is expected.
  - **Code style:** `@/` imports, single-line comments of at most 50 characters, no `any`.
- Verification:
  - `npm test`, `npm run lint`, `npm run build`.
  - In the browser at 1440, 834 and 390:
    - **Solo `?state=`:** `idle`, `correct`, `already-found`, `life-lost`, `run-over-pro`, `perfect-clear`.
    - **Duel `?state=`:** `idle`, `their-reveal`, the lobby steps, and `result-win`.
    - **What to check:** the header names, scores, crests and emphasis; found, unfound and missed slots; the initials fallback; the duel finder rings.
  - **No overlap:** no two slots overlap at 390 in any mock formation, and especially 4-1-2-1-2.
  - **Broken image:** block one headshot URL in dev tools. The slot falls back to initials with no layout shift.
  - **Loading:** the skeleton header and slots match the loaded sizes exactly (`?state=loading`).
  - **Full live solo run off the mock:** the header is complete from the first round, and headshots appear on reveal.

**Deviations recorded during implementation**

- Slot sizes gained a middle tier: from a 480px pitch, 80px slots with a 32px disc. A tablet pitch (536px at 834) was getting phone slots. All tiers measured: no overlaps in any formation, tightest gap 6px at 390.
- On phones the found count moves to line 2, beside the competition and date. On line 1, beside the quit chip, it squeezed the short codes to one letter.
- The scoreline is centred in the space left of the found count, not across the whole card.
- Initials in the 20px phone disc use 12px text, the smallest step on the type scale, rather than shrinking off-scale.
- The null-image players are the slot-7 player of every fixture side (20 players, Gökhan Erçetin among them), so every XI shows the fallback.
- Headshots are assigned by player order in `players.ts` (`headshot-1` to `-6` in turn), set as literal paths in the data.
- The dev sample clubs' short names became `NGU` and `RSO` (were `Northgate` and `Solvara`), so the phone header reads like the real data.
- `webUrlSchema` is no longer exported: `imageUrlSchema` is its only user.
- The empty disc's person glyph is a new `person.ts` path, mirroring `shirt.ts`.
- No new `CONTRAST_PAIRS`: the ring (`fg` on `surface-raised`), the initials and crest fallback (`fg-muted` on `surface-raised` and `surface-card`) and the glyph (`fg-dim` on `surface`) are already covered.
- The old "masks the match" test became a guard that the in-play match never carries a squad player's id or name.

## History
