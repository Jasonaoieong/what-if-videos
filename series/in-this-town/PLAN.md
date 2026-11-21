# "In This Town" — Ep 1: "The Town Where Rain Is Money"
Vertical 1080x1920, 30 fps, ~55 s. Blocky avatars (6-part block body, cylinder head, decal face), stud-textured baseplate town.
Rendered with the repo's Three.js + Playwright + ffmpeg pipeline (same as bunker9).

## Cast
- **Noob** (yellow head, blue torso, green legs) — hero, broke, optimistic
- **Rich Kid** (black hoodie, chain, shades) — rival
- **Mom** (pink top, bun hair) — cameo
- **Town crowd** — 6 randomised avatars

## Beat sheet  (HUSS = gap left for your "huss huss huss" SFX)
| # | t (s) | Narration | Action | Camera | Sound |
|---|---|---|---|---|---|
| 1 | 0.0–2.0 | "In this town… when it rains, it rains MONEY." | Sky splits, cash bills pour on town square | Fast drone dive from clouds to street | Thunder boom, music drop |
| 2 | 2.0–5.5 | "Everyone gets rich… except him." | Crowd catches cash; Noob's bucket has a hole | Whip-pan to Noob, snap zoom on face | Coin clinks, "oof"-style bonk |
| 3 | 5.5–7.0 | — | Noob stares at empty bucket | Slow push-in | **HUSS #1 (1.5 s, music ducks)** |
| 4 | 7.0–13 | "So he made a plan." | Noob drags a giant trampoline-funnel to rooftop | Low-angle hero shot, montage cuts (3 × 0.8 s) | Build/hammer clicks |
| 5 | 13–19 | "But Rich Kid had a bigger one." | Rich Kid unveils a vacuum truck | Dolly-out reveal, dramatic zoom | Bass hit, record scratch |
| 6 | 19–20.5 | — | Both glare across street | Split-screen / over-shoulder cut | **HUSS #2** |
| 7 | 20.5–30 | "The clouds rolled in… the biggest storm ever." | Money tornado; vacuum sucks everything incl. Rich Kid's shoes | Orbit around tornado, shake | Wind, vacuum whine |
| 8 | 30–36 | "Then the vacuum got… too full." | Truck swells and explodes into cash confetti | Crash zoom, 0.3 s freeze frame | Explosion, glass |
| 9 | 36–37.5 | — | All cash rains into Noob's broken bucket… and falls out the hole | Top-down shot | **HUSS #3** |
| 10 | 37.5–48 | "But the hole wasn't a bug. It was a pipe." | Cut underground: bucket hole drains into a vault in Noob's basement full of cash | Elevator-drop camera through ground | Whoosh, cash register "cha-ching" |
| 11 | 48–53 | "Now he's the richest guy in town." | Noob in gold suit; Rich Kid holds empty bucket | Slow orbit, sunglasses slide on | Music swell |
| 12 | 53–56 | "And tomorrow… it rains GOLD." | Gold bricks start falling, everyone looks up | Tilt up to sky, hard cut to black | Thunder, stinger |

## Audio
- **Narrator:** one voice, one setting, generated per sentence then stitched (deep, energetic, dramatic). Same voice ID + same stability/speed for all 9 lines.
- **Music:** original upbeat-suspense loop (pizzicato + 808 + plucks, ~100 BPM) in the style of these videos — NOT the copyrighted tracks. Ducks −14 dB under VO, drops out fully on HUSS gaps.
- **SFX:** synthesised (bonk, coin clink, whoosh, explosion, thunder, cha-ching). Separate stem exported so you can re-mix.
- **Deliverables:** `final.mp4`, plus `music.wav`, `vo.wav`, `sfx.wav` stems and `huss_markers.txt` (exact timestamps).

## Captions
Bold white Impact-style word-by-word pop captions with black stroke, centre-lower third, keyword highlighted yellow.

## Notes / limits
- No Roblox logo/brand UI; the look is generic blocky-avatar style.
- Music is original-in-the-style, not the actual viral songs (copyright).
