# Best Man in 30 — series bible

Interactive glow-up animated series, 9:16, one episode a day, about 40 seconds each.

## Premise
Bernie Kowalczyk, 29, 6'5", lives in a camper van in a supermarket car park with a chihuahua who hates him.
His little sister Gabby asks him to be best man at her wedding in 30 days. His ex, Rachel, is the maid of honor.
Each day the comments pick ONE thing he fixes. Every fix is permanent, and some choices come back later.

Why this beats the reference accounts (James / Kevin): the goal isn't only looks. He needs a speech, a suit, a date
and a dance, and he has to face Rachel. That gives choices with consequences, not just which body part to fix.

## Locked character: Bernie
Reference: ElevenLabs flow `8po1rkhQSxP0a4vY3vOB`, node `Ykq6MfAWbhW5pfEfYQht` (model sheet v1). Every shot is generated
with that node wired in as the reference image. Never describe him differently.
- Very tall and lanky, slight hunch, noodle limbs
- Bright ginger mullet with a cowlick, patchy ginger mustache, freckles, pale skin
- Huge thick square glasses that make his pale-blue eyes look twice their size
- Faded orange hoodie with sleeves too short and one drawstring missing, cargo shorts, green-striped tube socks, velcro sandals, a lanyard of keys
- Voice: ElevenLabs "Quinn - Soft Nerd Boy" (`2t3wubVNRseKNVjtlWx1`), model eleven_v4

The glow-up changes are cumulative. Keep a "current look" line below and add it to every prompt.

**Current look (update after each episode):** Day 1, nothing fixed yet.

## Supporting cast
- **Duchess**: tiny tan chihuahua, pink knitted sweater, bulging eyes, permanently furious. Bites his socks.
- **Gabby**: sister, 26, bright ginger bob, freckles, huge smile. Voice: "Margot" (`tAtHhBlA3E0eKZJKNSKE`).
- **Rachel**: the ex, maid of honor. Dark curly hair, effortlessly put-together. Seen only in photos until about Day 7.
- **Marcus**: the groom. Perfect at everything, kind, which makes it worse.
- To add as needed: a barber, a gym coach, a wedding planner who hates Bernie, the supermarket security guard.

## Locations
Camper van (main set), supermarket car park, barbershop, gym, suit shop, wedding venue.

## Look
Stylized 3D, feature-animation quality: hand-painted textures, soft skin, volumetric light, warm light from sources
in the scene (fairy lights, dawn, the phone screen) against cool shadows. Every prompt starts with the style line in
`episodes/ep01.md`.

## Episode beats (about 40 s)
| Time | Beat |
|---|---|
| 0–3 s | Hook: the strangest image of the episode |
| 3–7 s | Vote recap on screen: "DAY 4 · YOU PICKED HAIR (71%)" plus one joke about the comments |
| 7–28 s | The fix, escalating three times |
| 28–34 s | Twist |
| 34–40 s | Cliffhanger, then 2–4 one-word choices: "Comment ONE word" |

## Production (ElevenLabs canvas)
1. Keyframe per shot: `gemini-3-pro-image`, 9:16, 2K, model sheet wired in as reference.
2. Animate each keyframe: image-to-video (Seedance 2.5 or Veo 3.1), 4–8 s per shot. **Needs a paid ElevenLabs plan.**
3. Voices: TTS with the voice IDs above.
4. Music + sound effects: ElevenLabs music and SFX nodes.
5. Edit: ElevenLabs composition node, then captions and the vote card.
6. Post: Metricool (see `PLAYBOOK.md`), TikTok + Instagram.

## Canon log
Every vote result goes in `CANON.md`.
