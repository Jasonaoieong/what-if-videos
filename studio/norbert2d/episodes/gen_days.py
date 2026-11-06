"""Writes ep06.json .. ep30.json: the rest of Norbert's 30-day glow-up (Days 6-30).

Every day: a hook card, the fix, the glow-up meter, a cliffhanger, and an end card teasing tomorrow.
Run: python3 gen_days.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))

VOICES = {
    "NARR": {"voice": "af_heart", "speed": 1.07, "pitch": 1.0},
    "NORB": {"voice": "am_puck", "speed": 1.1, "pitch": 1.1},
    "NORBLOW": {"voice": "am_puck", "speed": 1.0, "pitch": 0.97},
    "MAYA": {"voice": "af_bella", "speed": 1.05, "pitch": 1.04},
    "CHAD": {"voice": "am_adam", "speed": 1.05, "pitch": 1.0},
    "COACH": {"voice": "am_onyx", "speed": 1.0, "pitch": 0.95},
    "GRAN": {"voice": "bf_isabella", "speed": 0.95, "pitch": 1.0},
    "MOM": {"voice": "af_sarah", "speed": 1.05, "pitch": 1.0},
}
CAPS = {"NORB": "#FFD23F", "MAYA": "#FF8FD8", "CHAD": "#FF6B5B", "COACH": "#7FC8FF", "GRAN": "#A8F0A0", "MOM": "#FFB870"}

HOODIE = {"shirt": "#2E86C1", "shirtSh": "#1F6AA0", "pants": "#3D5A9E", "logoText": "N", "logo": "#FFD23F"}
FRESH = {"teeth": "fixed", "skin": "clear", "hair": "fresh", "outfit": "fresh", "colors": HOODIE}
SLOB = {"outfit": "slob", "colors": {}}
SUIT = {"outfit": "suit"}

GLOW = {5: 16}
for d in range(6, 30):
    GLOW[d] = GLOW[d - 1] + 3
GLOW[30] = 100


def N(**kw):
    return dict({"who": "NORB"}, **kw)


def C(who, **kw):
    return dict({"who": who}, **kw)


def two(a, b):
    a = dict({"x": 330, "scale": 0.8}, **a)
    b = dict({"x": 760, "scale": 0.8}, **b)
    return [a, b]


def E(e, x=540, y=900, at=0.3, size=170, **kw):
    return dict({"e": e, "x": x, "y": y, "at": at, "size": size}, **kw)


def T(txt, x=540, y=520, at=0.3, size=96, col="#FFD23F", **kw):
    y = y if y <= 600 else 520  # keep big text above faces
    return dict({"txt": txt, "x": x, "y": y, "at": at, "size": size, "col": col}, **kw)


def line(who, text, scene="set", gap=0.25, sfx=None, **p):
    d = {"who": who, "text": text, "scene": scene, "gap": gap, "p": p}
    auto = []
    fx = p.get("fx", [])
    if p.get("hook"):
        auto += [["whoosh", 0.0], ["pop", 0.08]]
    if "sparkle" in fx:
        auto += [["chime", 0.05], ["ding", 0.2]]
    if p.get("shake"):
        auto += [["boing", 0.0]]
    if "confetti" in fx:
        auto += [["crowd", 0.0]]
    if "red" in fx:
        auto += [["siren", 0.0]]
    if "clock" in fx:
        auto += [["clock3", 0.2]]
    for pr in p.get("screen", []) + p.get("front", []):
        if pr.get("at") is not None:
            auto += [["pop", pr["at"]]]
    if scene == "text":
        auto += [["vibrate", 0.2]] + [["pop", 0.4 + i * 0.7] for i in range(len(p.get("msgs", [])))]
    if scene == "gmeter":
        auto += ([["scratch", 0.0], ["static", 0.3]] if p.get("bad") else [["pop", 0.1], ["chime", 0.6]])
    if scene == "end":
        auto += [["whoosh", 0.0], ["pop", 0.3], ["pop", 0.8]]
    if sfx or auto:
        d["sfx"] = (sfx or []) + auto
    return d


def hook(d, text, hook_txt, **p):
    p.setdefault("banner", f"DAY {d} / 30")
    p.setdefault("bannerY", 370)
    p.setdefault("bannerSize", 52)
    p.setdefault("hookY", 520)
    p.setdefault("cam", [540, 1130, 1.12])
    p.setdefault("cam2", [540, 1100, 1.0])
    return line("NARR", text, hook=hook_txt, **p)


def meter(text, chip, **p):
    return line("NARR", text, "gmeter", gap=0.35, chip=chip, **p)


def end(text, tease, e, **p):
    return line("NARR", text, "end", gap=1.4, tease=tease, e=e, **p)


WORDS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = {20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety"}


def say(n):
    if n < 20:
        return WORDS[n]
    if n == 100:
        return "one hundred"
    t, o = n - n % 10, n % 10
    return TENS[t] + ("" if o == 0 else " " + WORDS[o])


def glow_line(d, chip, **p):
    left = 31 - d
    tail = f" {say(left).capitalize()} days left." if d < 30 else ""
    return meter(f"Glow up: {say(GLOW[d])} percent.{tail}", chip, **p)


EPS = {}

# ---------------- DAY 6: CLOTHES ----------------
EPS[6] = dict(look=dict(FRESH), title="his only shirt has a ketchup stain", lines=[
    hook(6, "Day six. His only shirt has a ketchup stain.", "HIS ONLY SHIRT 💀", cast=[N(expr="sad", **SLOB)], fx=["flies"]),
    line("MOM", "Twenty dollars. And nothing with a skull on it.", loc="room", cast=two(N(expr="awkward", **SLOB), C("MOM", expr="smug", pose="point"))),
    line("NORB", "Twenty bucks? I'm basically rich.", loc="store", cast=[N(expr="happy", pose="cheer", **SLOB)], fx=["rain:💸"]),
    line("NARR", "Outfit one: skulls.", loc="store", cast=[N(expr="smug", outfit="fresh", colors={"shirt": "#111111", "shirtSh": "#000", "pants": "#222", "logoText": "☠", "logo": "#FFF"})],
         screen=[E("❌", 820, 640, at=0.6, size=220)]),
    line("NARR", "Outfit two: a tuxedo. For school.", loc="store", cast=[N(expr="smug", **SUIT)], screen=[E("❌", 820, 640, at=0.7, size=220)]),
    line("NORB", "Okay. Normal. I can do normal.", loc="store", cast=[N(expr="determined", **SLOB)], cam=[540, 900, 1.6]),
    line("NARR", "Blue hoodie. Clean jeans. New shoes.", loc="store", cast=[N(expr="happy", pose="cheer")], fx=["sparkle"], cam=[540, 1300, 1.7], cam2=[540, 1060, 1.0], camDur=2.0),
    line("NORB", "I look like a guy who knows things.", loc="store", cast=[N(expr="smug", pose="point")], cam=[540, 820, 1.6]),
    glow_line(6, "✅ CLOTHES: UPGRADED"),
    line("NARR", "Then Coach posted the fitness test list.", loc="hallway", cast=[N(expr="shocked")], screen=[T("FITNESS TEST: FRIDAY", 540, 760, at=0.5, size=90, col="#FF6B5B")], shake=True),
    end("Tomorrow: can he do even one push up? Follow for day seven.", "ONE PUSH-UP?!", "💪"),
])

# ---------------- DAY 7: GYM ----------------
EPS[7] = dict(look=dict(FRESH), title="he can't do one push-up", lines=[
    hook(7, "Day seven. Fitness test in three days.", "0 PUSH-UPS?? 💀", loc="gym", cast=two(N(expr="awkward"), C("COACH", expr="determined"))),
    line("COACH", "Show me one push up, Norbert.", loc="gym", cast=two(N(expr="awkward"), C("COACH", expr="determined", pose="point")), cam=[640, 900, 1.4]),
    line("NARR", "He did zero.", loc="gym", cast=[N(expr="panic", pushup=True, x=540, y=1450)], screen=[T("0", 540, 760, at=0.3, size=300, col="#FF6B5B")]),
    line("NORB", "My arms are just for decoration!", loc="gym", cast=[N(expr="panic", pose="panic")], shake=True, cam=[540, 900, 1.5]),
    line("NARR", "So he trained. Every. Single. Morning.", loc="park", cast=[N(expr="determined", wobble=6, flail=True)], fx=["speed", "clock"]),
    line("NARR", "Day one: one push up. Day three: ten.", loc="park", cast=[N(expr="determined", pushup=True, y=1450)], screen=[T("1 → 10", 540, 760, at=0.5, size=200)]),
    line("NORB", "Ten! I'm basically a superhero!", loc="park", cast=[N(expr="happy", pose="cheer", jump=6)], fx=["sparkle"]),
    glow_line(7, "✅ GYM: 10 PUSH-UPS"),
    line("NARR", "Then he took one step, and his shoe exploded.", loc="gym", cast=[N(expr="shocked", pose="panic")], front=[E("💥", 600, 1560, at=0.9, size=220)], shake=1.2),
    end("Tomorrow: the shoe situation. Follow for day eight.", "SHOE EMERGENCY", "👟"),
])

# ---------------- DAY 8: SHOES ----------------
EPS[8] = dict(look=dict(FRESH), title="his shoe started talking", lines=[
    hook(8, "Day eight. His shoe is talking.", "HIS SHOE IS TALKING 👟", loc="hallway", cast=[N(expr="awkward")], front=[E("👟", 620, 1560, size=150, float=True)]),
    line("NORB", "It's fine. Nobody's looking.", loc="hallway", cast=[N(expr="awkward", look={"x": 1, "y": 0})], cam=[540, 900, 1.5]),
    line("NARR", "Maya was looking.", loc="hallway", cast=two(N(expr="shocked"), C("MAYA", expr="neutral", pose="wave")), fx=["hearts"]),
    line("MAYA", "Um. Is your shoe okay?", loc="hallway", cast=two(N(expr="panic"), C("MAYA", expr="awkward")), cam=[700, 900, 1.4]),
    line("NORB", "It's a new style. Flappy.", loc="hallway", cast=two(N(expr="awkward", blush=True, pose="shrug"), C("MAYA", expr="awkward")), cam=[380, 880, 1.5]),
    line("NARR", "Duct tape. Then glue. Then he just bought new ones.", loc="room", cast=[N(expr="determined")], screen=[E("🩹", 300, 760, at=0.2), E("🧴", 540, 760, at=1.0), E("👟", 780, 760, at=1.9)]),
    line("NORB", "Fresh kicks. Silent. Perfect.", loc="room", cast=[N(expr="smug")], fx=["sparkle"], cam=[540, 1500, 1.8], cam2=[540, 1060, 1.0], camDur=2.0),
    glow_line(8, "✅ SHOES: SILENT"),
    line("NARR", "Then Maya said hi, and his voice cracked.", loc="hallway", cast=two(N(expr="panic"), C("MAYA", expr="happy", pose="wave")), screen=[T("HI-IIIEEE?!", 340, 700, at=1.2, size=110)], shake=True),
    end("Tomorrow: fixing the voice crack. Follow for day nine.", "VOICE CRACK", "🎤"),
])

# ---------------- DAY 9: VOICE ----------------
EPS[9] = dict(look=dict(FRESH), title="his voice cracks every time", lines=[
    hook(9, "Day nine. His voice cracks every time he says hi.", "VOICE CRACK 😭", cast=[N(expr="sad")]),
    line("NORB", "Hi. Hi. Hiii. Why is it doing that?!", loc="room", cast=[N(expr="panic", pose="panic")], cam=[540, 880, 1.5], shake=True),
    line("NARR", "Grandma used to sing opera. Allegedly.", loc="room", cast=two(N(expr="awkward"), C("GRAN", expr="smug"))),
    line("GRAN", "Breathe from your belly, sweetie. Not your nose.", loc="room", cast=two(N(expr="determined"), C("GRAN", expr="happy", pose="point")), cam=[700, 900, 1.4]),
    line("NARR", "He practiced scales for six hours. The neighbors called the cops.", loc="room", cast=[N(expr="shocked", pose="cheer")], screen=[E("🚓", 900, 760, at=1.3, size=200)], fx=["red"]),
    line("NORB", "Hello, Maya. Hello, Maya.", voice_override="NORBLOW", loc="room", cast=[N(expr="smug")], fx=["sparkle"], cam=[540, 860, 1.6]),
    glow_line(9, "✅ VOICE: NO MORE CRACKS"),
    line("NARR", "Then he saw his reflection. He was standing like a shrimp.", loc="room", cast=[N(expr="shocked", lean=14, headTilt=20)], screen=[E("🦐", 820, 720, at=1.4, size=220)]),
    end("Tomorrow: the shrimp posture. Follow for day ten.", "NO MORE SHRIMP", "🦐"),
])

# ---------------- DAY 10: POSTURE ----------------
EPS[10] = dict(look=dict(FRESH), title="he stands like a shrimp", lines=[
    hook(10, "Day ten. He stands like a shrimp.", "SHRIMP POSTURE 🦐", cast=[N(expr="awkward", lean=14, headTilt=20)]),
    line("NARR", "The fix: walk with a book on his head.", loc="room", cast=[N(expr="determined")], front=[E("📕", 540, 640, at=0.4, size=160)]),
    line("NORB", "Easy. Watch this.", loc="room", cast=[N(expr="smug", walk=[300, 700])], front=[E("📕", 540, 640, at=0.0, size=160, fly=[500, -600], flyDur=0.8)]),
    line("NARR", "Book one hit the dog. Book two hit Mom.", loc="room", cast=two(N(expr="panic", pose="panic"), C("MOM", expr="shocked")), screen=[E("🐶", 200, 1300, at=0.3, size=200), E("📕", 800, 700, at=1.0, size=150)], shake=1.2),
    line("MOM", "NORBERT!", loc="room", cast=two(N(expr="panic"), C("MOM", expr="determined", pose="point")), cam=[760, 860, 1.6], shake=True),
    line("NARR", "Book forty seven stayed on.", loc="room", cast=[N(expr="smug", walk=[350, 730], walkDur=2.0)], front=[E("📕", 540, 640, at=0.0, size=160)], fx=["sparkle"]),
    glow_line(10, "✅ POSTURE: NOT A SHRIMP"),
    line("NARR", "Then at school, he saw Chad talking to Maya.", loc="hallway", cast=[N(x=160, scale=0.6, expr="shocked"), C("CHAD", x=620, scale=0.8, expr="smug"), C("MAYA", x=900, scale=0.8, expr="neutral")], screen=[E("❗", 160, 700, at=1.6, size=200)]),
    line("CHAD", "So, Maya. You're going to the dance with me, right?", loc="hallway", cast=two(C("CHAD", expr="smug", pose="point"), C("MAYA", expr="awkward")), cam=[500, 900, 1.3]),
    end("Tomorrow: who is Chad?! Follow for day eleven.", "WHO IS CHAD?!", "😤"),
])

# ---------------- DAY 11: CONFIDENCE ----------------
EPS[11] = dict(look=dict(FRESH), title="meet the rival", lines=[
    hook(11, "Day eleven. There's a rival. His name is Chad.", "MEET THE RIVAL 😤", loc="hallway", cast=[C("CHAD", expr="smug", scale=0.92)]),
    line("NARR", "Chad has abs. Chad has a car. Chad has a podcast.", loc="hallway", cast=[C("CHAD", expr="smug", pose="cheer", scale=0.92)], screen=[E("💪", 220, 760, at=0.3), E("🚗", 540, 640, at=1.1), E("🎙️", 860, 760, at=1.9)]),
    line("NORB", "I have a library card.", loc="hallway", cast=[N(expr="sad")], front=[E("🪪", 700, 1150, at=0.4, size=150)], cam=[540, 900, 1.4]),
    line("NARR", "He needed confidence. So: mirror pep talks.", loc="room", cast=[N(expr="determined", pose="point")]),
    line("NORB", "You are Norbert. You are cool. You are medium cool.", loc="room", cast=[N(expr="determined", pose="point")], cam=[540, 860, 1.6]),
    line("NARR", "By day two, he believed it. Kind of.", loc="room", cast=[N(expr="smug", pose="cheer")], fx=["sparkle"]),
    glow_line(11, "✅ CONFIDENCE: MEDIUM COOL"),
    line("NARR", "Then Chad walked past and sniffed the air.", loc="hallway", cast=two(N(expr="happy"), C("CHAD", expr="awkward"))),
    line("CHAD", "Whoa. Who had garlic for breakfast?", loc="hallway", cast=two(N(expr="shocked"), C("CHAD", expr="smug", pose="point")), screen=[E("🧄", 330, 700, at=0.8, size=200)], shake=True),
    end("Tomorrow: the breath problem. Follow for day twelve.", "GARLIC BREATH", "🧄"),
])

# ---------------- DAY 12: BREATH ----------------
EPS[12] = dict(look=dict(FRESH), title="garlic breath emergency", lines=[
    hook(12, "Day twelve. Chad says his breath smells like garlic.", "GARLIC BREATH?! 🧄", cast=[N(expr="awkward")], fx=["stink"]),
    line("NORB", "That's a lie. Let me check.", loc="room", cast=[N(expr="smug", armR=2.2, bendR=0.9)], cam=[540, 860, 1.6]),
    line("NARR", "It was not a lie.", loc="room", cast=[N(expr="shocked", pose="panic")], fx=["stink", "flies"], shake=True),
    line("NARR", "Brush. Floss. Tongue scraper. Forty seven mints.", loc="room", cast=[N(expr="determined")], screen=[E("🪥", 200, 760, at=0.2), E("🧵", 420, 640, at=0.7), E("👅", 660, 640, at=1.2), E("🍬", 880, 760, at=1.8)]),
    line("NORB", "My mouth is so minty I can see my breath indoors.", loc="room", cast=[N(expr="happy")], fx=["rain:❄️"]),
    glow_line(12, "✅ BREATH: ARCTIC FRESH"),
    line("NARR", "Then a poster went up. Dance lessons. Partners required.", loc="hallway", cast=[N(expr="shocked", x=540)], screen=[T("DANCE CLASS 💃", 540, 700, at=0.5, size=110), T("PARTNERS REQUIRED", 540, 820, at=1.6, size=80, col="#FF6B5B")]),
    line("NORB", "Partners?!", loc="hallway", cast=[N(expr="panic", pose="panic")], cam=[540, 860, 1.7], shake=True),
    end("Tomorrow: Norbert learns to dance. Follow for day thirteen.", "CAN HE DANCE?!", "🕺"),
])

# ---------------- DAY 13: DANCE ----------------
EPS[13] = dict(look=dict(FRESH), title="he has never danced", lines=[
    hook(13, "Day thirteen. Norbert has never danced. Ever.", "HE HAS NEVER DANCED 🕺", loc="gym", cast=[N(expr="awkward")]),
    line("NARR", "His first move was called the broken robot.", loc="gym", cast=[N(expr="determined", dance=True)], shakeAll=False),
    line("COACH", "Son, are you okay? Should I call someone?", loc="gym", cast=two(N(expr="determined", dance=True), C("COACH", expr="shocked")), cam=[700, 900, 1.3]),
    line("NARR", "His only partner: Grandma.", loc="room", cast=two(N(expr="awkward"), C("GRAN", expr="happy", dance=True))),
    line("GRAN", "Hips, Norbert! You have hips!", loc="room", cast=two(N(expr="panic", dance=True), C("GRAN", expr="happy", dance=True)), cam=[700, 900, 1.3]),
    line("NORB", "I don't think I do!", loc="room", cast=two(N(expr="panic", pose="panic"), C("GRAN", expr="smug")), cam=[340, 880, 1.5]),
    line("NARR", "Three hours later, he had one move. And it was good.", loc="room", cast=[N(expr="smug", dance=True)], fx=["sparkle", "clock"]),
    glow_line(13, "✅ DANCE: ONE (1) MOVE"),
    line("NARR", "Then Maya waved at him. He panicked, and saluted.", loc="hallway", cast=two(N(expr="panic", armR=2.9, bendR=1.4), C("MAYA", expr="shocked", pose="wave")), screen=[E("🫡", 330, 640, at=1.5, size=200)]),
    end("Tomorrow: fixing the panic salute. Follow for day fourteen.", "THE SALUTE", "🫡"),
])

# ---------------- DAY 14: SMILE ----------------
EPS[14] = dict(look=dict(FRESH), title="he saluted his crush", lines=[
    hook(14, "Day fourteen. He saluted his crush.", "HE SALUTED HER 🫡", cast=[N(expr="sad")]),
    line("NORB", "Why would I do that? I'm not in the army!", loc="room", cast=[N(expr="panic", pose="panic")], cam=[540, 880, 1.5]),
    line("NARR", "The fix: a normal smile. And a normal wave.", loc="room", cast=[N(expr="determined")]),
    line("NARR", "Smile number one: terrifying.", loc="room", cast=[N(expr="smug")], cam=[540, 820, 2.2], fx=["red"], screen=[E("😬", 860, 640, at=0.6, size=200)]),
    line("MOM", "Honey, why are you making that face at the toaster?", loc="kitchen", cast=two(N(expr="smug"), C("MOM", expr="shocked"))),
    line("NARR", "Smile number two hundred: perfect.", loc="room", cast=[N(expr="happy", pose="wave")], fx=["sparkle"], cam=[540, 900, 1.4]),
    glow_line(14, "✅ SMILE: NOT SCARY"),
    line("NARR", "Tomorrow is the halfway point. And Chad has a plan.", loc="hallway", cast=[C("CHAD", expr="smug", scale=0.92)], fx=["dark:0.35"]),
    line("CHAD", "Let's see how he handles the mile run.", loc="hallway", cast=[C("CHAD", expr="smug", scale=0.92, pose="point")], cam=[540, 860, 1.6], fx=["dark:0.35"]),
    end("Tomorrow: halfway. The mile run. Follow for day fifteen.", "THE MILE RUN", "🏃"),
])

# ---------------- DAY 15: MILE ----------------
EPS[15] = dict(look=dict(FRESH), title="halfway: the mile run", lines=[
    hook(15, "Day fifteen. Halfway. And it's the mile run.", "HALFWAY: THE MILE 🏃", loc="park", cast=[N(expr="determined")]),
    line("COACH", "Ready. Set. Go!", loc="park", cast=two(N(expr="determined"), C("COACH", expr="determined", pose="point")), sfx=[["ding", 0.6]]),
    line("NARR", "Chad finished in six minutes.", loc="park", cast=[C("CHAD", expr="smug", walk=[100, 980], walkDur=1.0)], fx=["speed"]),
    line("NARR", "Norbert's legs gave up at minute four.", loc="park", cast=[N(expr="sad", lean=18, headTilt=12)], fx=["clock"]),
    line("NORB", "Remember the push ups. Remember the push ups.", loc="park", cast=[N(expr="determined", wobble=4)], cam=[540, 860, 1.5], fx=["speed"]),
    line("NARR", "He finished. Last. But he finished. And Maya clapped.", loc="park", cast=two(N(expr="happy", pose="cheer"), C("MAYA", expr="happy", pose="cheer")), fx=["hearts"]),
    glow_line(15, "✅ MILE: FINISHED (LAST)"),
    line("NARR", "Then his stomach growled so loud the whole class heard.", loc="park", cast=[N(expr="panic")], screen=[T("GRRRRRR", 540, 700, at=0.8, size=160, col="#FF6B5B")], shake=1.4),
    line("NORB", "I've had cereal for dinner for three years.", loc="park", cast=[N(expr="awkward", pose="shrug")], cam=[540, 880, 1.5]),
    end("Tomorrow: can Norbert cook? Follow for day sixteen.", "CAN HE COOK?!", "🍳"),
])

# ---------------- DAY 16: COOKING ----------------
EPS[16] = dict(look=dict(FRESH), title="cereal for dinner for 3 years", lines=[
    hook(16, "Day sixteen. Today he cooks. An egg.", "HE CAN'T COOK AN EGG 🥚", loc="kitchen", cast=[N(expr="determined")], front=[E("🥚", 760, 1150, at=0.4, size=150)]),
    line("NORB", "How hard can an egg be?", loc="kitchen", cast=[N(expr="smug")], cam=[540, 880, 1.5]),
    line("NARR", "The smoke alarm disagreed.", loc="kitchen", cast=[N(expr="panic", pose="panic")], screen=[E("🔥", 800, 1100, at=0.1, size=220), E("🚨", 540, 620, at=0.5, size=180)], fx=["red"], shake=1.0),
    line("MOM", "Is the house on fire?!", loc="kitchen", cast=two(N(expr="panic"), C("MOM", expr="shocked", pose="panic")), cam=[700, 900, 1.4]),
    line("NARR", "Attempt six: an actual omelette.", loc="kitchen", cast=[N(expr="happy")], front=[E("🍳", 760, 1150, at=0.3, size=170)], fx=["sparkle"]),
    line("NORB", "I'm basically a chef now. Call me chef.", loc="kitchen", cast=[N(expr="smug", pose="point")], cam=[540, 860, 1.6]),
    glow_line(16, "✅ FOOD: NOT CEREAL"),
    line("NARR", "Then Maya posted a photo. And Chad commented.", "text", loc="room", cast=[N(expr="shocked", phone=True, phoneGlow=True, armR=2.05, bendR=0.75)],
         msgs=[{"from": "MAYA", "t": "posted a new photo 📸"}, {"from": "CHAD", "t": "❤️❤️ see u at the dance"}]),
    end("Tomorrow: Norbert fixes his socials. Follow for day seventeen.", "CRINGE POSTS", "📱"),
])

# ---------------- DAY 17: SOCIALS ----------------
EPS[17] = dict(look=dict(FRESH), title="his profile is so cringe", lines=[
    hook(17, "Day seventeen. Maya might look at his profile.", "HIS PROFILE IS CRINGE 📱", cast=[N(expr="panic", phone=True, phoneGlow=True, armR=2.05, bendR=0.75)]),
    line("NARR", "His last post: a selfie with a sandwich.", "text", loc="room", cast=[N(expr="awkward", phone=True, phoneGlow=True, armR=2.05, bendR=0.75)],
         msgs=[{"from": "me", "t": "me and the boys 🥪🥪🥪"}]),
    line("NORB", "Delete. Delete. Oh no. Delete!", loc="room", cast=[N(expr="panic", flail=True)], screen=[E("🗑️", 840, 760, at=0.3, size=180)], shake=True),
    line("NARR", "Two hundred posts deleted. One new photo.", loc="room", cast=[N(expr="determined", phone=True, phoneGlow=True, armR=2.6, bendR=0.2)], screen=[E("📸", 820, 640, at=0.9, size=180)]),
    line("NORB", "Hoodie. Good light. No sandwich.", loc="room", cast=[N(expr="smug")], fx=["sparkle"], cam=[540, 860, 1.5]),
    line("NARR", "Forty two likes. One of them was Maya.", "text", loc="room", cast=[N(expr="shocked", phone=True, phoneGlow=True, armR=2.05, bendR=0.75)],
         msgs=[{"from": "MAYA", "t": "liked your photo ❤️"}], fx=["hearts"]),
    glow_line(17, "✅ PROFILE: NOT CRINGE"),
    line("NARR", "He was so excited, he stayed up until four AM.", loc="room", cast=[N(expr="happy", phone=True, phoneGlow=True, armR=2.05, bendR=0.75)], fx=["dark:0.5", "clock"]),
    end("Tomorrow: zombie mode. Follow for day eighteen.", "ZOMBIE MODE", "🧟"),
])

# ---------------- DAY 18: SLEEP ----------------
EPS[18] = dict(look=dict(FRESH), title="he slept 2 hours", lines=[
    hook(18, "Day eighteen. He slept two hours.", "2 HOURS OF SLEEP 🧟", loc="classroom", cast=[N(expr="sad", blink=0.8, headTilt=14)], fx=["zzz"], board="QUIZ TODAY"),
    line("NARR", "He fell asleep in class. In the lunch line. Standing up.", loc="classroom", cast=[N(expr="sad", blink=1, lean=10)], fx=["zzz"], board="QUIZ TODAY"),
    line("NORB", "I'm awake! I'm awake!", loc="classroom", cast=[N(expr="panic", pose="panic")], shake=True, cam=[540, 880, 1.6], board="QUIZ TODAY"),
    line("NARR", "New rule: phone off at ten. Lights off at ten thirty.", loc="room", cast=[N(expr="determined")], screen=[E("📵", 820, 700, at=0.4, size=200)], fx=["dark:0.45"]),
    line("NARR", "Eight hours later.", loc="room", cast=[N(expr="happy", blink=1)], fx=["zzz", "clock"]),
    line("NORB", "Is this what being alive feels like?", loc="room", cast=[N(expr="happy", pose="cheer")], fx=["sparkle"], cam=[540, 900, 1.4]),
    glow_line(18, "✅ SLEEP: 8 HOURS"),
    line("NARR", "Then Chad walked up holding a giant slushie.", loc="hallway", cast=two(N(expr="awkward"), C("CHAD", expr="smug")), front=[E("🥤", 900, 1050, at=0.6, size=200)]),
    end("Tomorrow: Chad strikes. Follow for day nineteen.", "CHAD STRIKES", "🥤"),
])

# ---------------- DAY 19: SLUSHIE (setback) ----------------
EPS[19] = dict(look=dict(FRESH), glow_steps=[{"scene": "gmeter", "from": 55, "to": 47}, {"scene": "gmeter2", "from": 47, "to": 58}], title="chad ruined everything", lines=[
    hook(19, "Day nineteen. Chad did it.", "CHAD STRIKES 🥤", loc="hallway", cast=two(N(expr="shocked"), C("CHAD", expr="smug", pose="point")), screen=[E("🥤", 760, 900, at=0.4, size=200, fly=[-420, 0], flyDur=0.4)], shake=1.0, sfx=[["splat", 0.8]]),
    line("NARR", "Blue raspberry. All over the new hoodie.", loc="hallway", cast=[N(expr="sad", outfit="slob", colors=HOODIE)], screen=[E("💦", 700, 800, at=0.2, size=200)], cam=[540, 980, 1.3]),
    line("CHAD", "Oops. Guess the glow up is over.", loc="hallway", cast=[C("CHAD", expr="smug", scale=0.92)], cam=[540, 860, 1.5]),
    meter("Glow up damage. Down to forty seven.", "⚠️ HOODIE: DESTROYED", bad=True, label="GLOW-UP DAMAGE"),
    line("NORB", "No. I'm not going back to day one.", loc="room", cast=[N(expr="determined", outfit="slob", colors=HOODIE)], cam=[540, 860, 1.6]),
    line("NARR", "He learned laundry. Stain remover. Cold wash. Hang dry.", loc="room", cast=[N(expr="determined", flail=True, outfit="slob", colors=HOODIE)], screen=[E("🧺", 220, 760, at=0.3), E("🧴", 540, 640, at=1.0), E("🫧", 860, 760, at=1.8)], fx=["clock"]),
    line("NARR", "Good as new.", loc="room", cast=[N(expr="happy", pose="cheer")], fx=["sparkle"]),
    dict(meter("The comeback: fifty eight percent. Twelve days left.", "✅ COMEBACK: STRONGER"), scene="gmeter2"),
    line("NARR", "Then the teacher said: fail Friday's test, and you can't go to the dance.", loc="classroom", cast=[N(expr="shocked")], board="FAIL = NO DANCE", shake=1.8),
    end("Tomorrow: Norbert has to study. Follow for day twenty.", "FAIL = NO DANCE", "📚"),
])

# ---------------- DAY 20: GRADES ----------------
EPS[20] = dict(look=dict(FRESH), title="fail the test = no dance", lines=[
    hook(20, "Day twenty. If he fails this test, no dance.", "FAIL = NO DANCE 📚", loc="classroom", cast=[N(expr="panic")], board="FAIL = NO DANCE"),
    line("NORB", "My grade is a D. D for doomed.", loc="classroom", cast=[N(expr="sad")], cam=[540, 880, 1.5], board="MATH TEST FRIDAY"),
    line("NARR", "Then Maya offered to tutor him.", loc="classroom", cast=two(N(expr="shocked", blush=True), C("MAYA", expr="happy", pose="wave")), fx=["hearts"], board="MATH TEST FRIDAY"),
    line("MAYA", "It's easy. X is just a number we don't know yet.", loc="classroom", cast=two(N(expr="happy", blush=True), C("MAYA", expr="happy", pose="point")), cam=[700, 900, 1.3], board="x = ?"),
    line("NORB", "Like my chances with... nothing! Math! I love math!", loc="classroom", cast=two(N(expr="panic", pose="panic", blush=True), C("MAYA", expr="awkward")), cam=[380, 880, 1.5], shake=True, board="x = ?"),
    line("NARR", "Friday. The test.", loc="classroom", cast=[N(expr="determined")], fx=["dark:0.3", "clock"], board="TEST TODAY"),
    line("NARR", "B plus.", loc="classroom", cast=[N(expr="happy", pose="cheer", jump=6)], screen=[T("B+", 540, 760, at=0.2, size=320)], fx=["confetti"], board="TEST TODAY"),
    glow_line(20, "✅ GRADES: B+"),
    line("NARR", "Now he had to talk to her. Like a normal person. With words.", loc="hallway", cast=[N(expr="panic", pose="panic")], cam=[540, 880, 1.5]),
    end("Tomorrow: how do words work? Follow for day twenty one.", "HOW DO WORDS WORK", "💬"),
])

# ---------------- DAY 21: TALKING ----------------
EPS[21] = dict(look=dict(FRESH), title="he practiced talking on his cat", lines=[
    hook(21, "Day twenty one. He needs to learn how to talk.", "HOW DO WORDS WORK 💬", cast=[N(expr="awkward")]),
    line("NARR", "He practiced on the cat.", loc="room", cast=[N(expr="determined", x=420)], front=[E("🐱", 820, 1500, at=0.2, size=200)]),
    line("NORB", "So. Do you like... cheese?", loc="room", cast=[N(expr="awkward", x=420, pose="shrug")], front=[E("🐱", 820, 1500, size=200)], cam=[600, 1000, 1.3]),
    line("NARR", "The cat left.", loc="room", cast=[N(expr="sad", x=420)], front=[E("🐱", 820, 1500, at=None, size=200, fly=[700, 0], flyDur=0.6)], sfx=[["whoosh", 0.1]]),
    line("GRAN", "Ask questions. Then actually listen. And no cheese.", loc="room", cast=two(N(expr="awkward"), C("GRAN", expr="smug", pose="point")), cam=[700, 900, 1.3]),
    line("NARR", "At lunch, he asked Maya about her favorite movie. They talked for twenty minutes.", loc="hallway", cast=two(N(expr="happy"), C("MAYA", expr="happy")), fx=["hearts", "clock"]),
    glow_line(21, "✅ TALKING: 20 MINUTES"),
    line("NARR", "Then Chad asked Maya to the dance. In front of everyone.", loc="hallway", cast=[N(x=140, scale=0.6, expr="shocked"), C("CHAD", x=600, scale=0.8, expr="smug", pose="point"), C("MAYA", x=900, scale=0.8, expr="shocked")], screen=[E("😳", 140, 640, at=1.6, size=180)], shake=1.8),
    end("Tomorrow: what did Maya say?! Follow for day twenty two.", "WHAT DID SHE SAY?!", "😳"),
])

# ---------------- DAY 22: GIFT ----------------
EPS[22] = dict(look=dict(FRESH), title="did she say yes to chad?", lines=[
    hook(22, "Day twenty two. Did Maya say yes to Chad?", "DID SHE SAY YES?! 😳", loc="hallway", cast=two(C("CHAD", expr="smug"), C("MAYA", expr="awkward"))),
    line("MAYA", "I'll... think about it.", loc="hallway", cast=[C("MAYA", expr="awkward", scale=0.92)], cam=[540, 860, 1.6]),
    line("NARR", "Not a yes. Not a no.", loc="hallway", cast=[N(expr="awkward")], fx=["sparkle"]),
    line("NORB", "There's still time. I need a gift. Better than a podcast.", loc="room", cast=[N(expr="determined", pose="point")], cam=[540, 880, 1.5]),
    line("NARR", "He made her a corsage. From scratch.", loc="room", cast=[N(expr="determined")], screen=[E("🌸", 260, 760, at=0.3), E("✂️", 540, 640, at=0.9), E("🌼", 820, 760, at=1.5)]),
    line("NARR", "Version one looked like a salad.", loc="room", cast=[N(expr="awkward")], front=[E("🥗", 760, 1150, at=0.4, size=170)]),
    line("NARR", "Version nine was beautiful.", loc="room", cast=[N(expr="happy")], front=[E("💐", 760, 1150, at=0.3, size=190)], fx=["sparkle"]),
    glow_line(22, "✅ GIFT: HANDMADE"),
    line("NARR", "Then he tried on his dad's old suit.", loc="room", cast=[N(expr="shocked", outfit="suit", scale=1.0, lean=4)], screen=[T("3 SIZES TOO BIG", 540, 700, at=1.0, size=100, col="#FF6B5B")]),
    end("Tomorrow: the suit disaster. Follow for day twenty three.", "THE SUIT", "🤵"),
])

# ---------------- DAY 23: SUIT ----------------
EPS[23] = dict(look=dict(FRESH), title="the suit is 3 sizes too big", lines=[
    hook(23, "Day twenty three. The suit is three sizes too big.", "SUIT DISASTER 🤵", cast=[N(expr="sad", outfit="suit", scale=1.0)]),
    line("NORB", "I look like a kid at a funeral.", loc="room", cast=[N(expr="sad", outfit="suit", scale=1.0)], cam=[540, 880, 1.5]),
    line("NARR", "Back to Thrift King. Twelve dollar suit. Mom's sewing machine.", loc="store", cast=two(N(expr="determined", outfit="suit"), C("MOM", expr="determined"))),
    line("MOM", "Hold still, or I'm sewing your arm to it.", loc="room", cast=two(N(expr="panic", outfit="suit", pose="cheer"), C("MOM", expr="determined", pose="point")), cam=[700, 900, 1.3]),
    line("NARR", "Three hours. Two band aids.", loc="room", cast=[N(expr="awkward", outfit="suit")], screen=[E("🩹", 300, 760, at=0.3), E("🩹", 780, 760, at=0.9)], fx=["clock"]),
    line("NORB", "Is that... me? In a suit?", loc="room", cast=[N(expr="happy", outfit="suit")], fx=["sparkle"], cam=[540, 1500, 1.8], cam2=[540, 1000, 1.1], camDur=2.0),
    glow_line(23, "✅ SUIT: TAILORED"),
    line("NARR", "One problem. He still hasn't asked her.", loc="room", cast=[N(expr="awkward", outfit="suit")], cam=[540, 860, 1.6]),
    end("Tomorrow: he asks her. Follow for day twenty four.", "THE BIG ASK", "💌"),
])

# ---------------- DAY 24: THE ASK ----------------
EPS[24] = dict(look=dict(FRESH), title="he finally asks her", lines=[
    hook(24, "Day twenty four. Today, he asks Maya to the dance.", "THE BIG ASK 💌", loc="hallway", cast=[N(expr="determined")]),
    line("NORB", "Okay. Corsage. Smile. Words. Go.", loc="hallway", cast=[N(expr="determined", pose="point")], cam=[540, 860, 1.6]),
    line("NARR", "He walked up. He opened his mouth.", loc="hallway", cast=[N(expr="happy", walk=[200, 330], scale=0.8), C("MAYA", x=760, scale=0.8, expr="happy")], fx=["hearts"]),
    line("NARR", "And the fire alarm went off.", loc="hallway", cast=two(N(expr="shocked"), C("MAYA", expr="shocked")), fx=["red"], screen=[E("🚨", 540, 640, at=0.2, size=200)], shake=True),
    line("NORB", "Are you kidding me?!", loc="hallway", cast=[N(expr="panic", pose="panic")], cam=[540, 860, 1.7], fx=["red"]),
    line("NARR", "Guess who pulled the alarm.", loc="hallway", cast=[C("CHAD", expr="smug", scale=0.92, pose="point")], cam=[540, 900, 1.4]),
    glow_line(24, "✅ COURAGE: +3"),
    line("NARR", "Norbert had one more idea.", loc="night", cast=[N(expr="determined")], cam=[540, 900, 1.4]),
    end("Tomorrow: plan B. Follow for day twenty five.", "PLAN B", "📝"),
])

# ---------------- DAY 25: PLAN B ----------------
EPS[25] = dict(look=dict(FRESH), title="plan B: the locker note", lines=[
    hook(25, "Day twenty five. Plan B. A note in her locker.", "PLAN B 📝", cast=[N(expr="determined")]),
    line("NARR", "Draft one: four pages.", loc="room", cast=[N(expr="awkward")], front=[E("📜", 760, 1150, at=0.3, size=170)]),
    line("NARR", "Draft twelve: one line.", loc="room", cast=[N(expr="smug")], front=[E("📝", 760, 1150, at=0.3, size=170)]),
    line("NORB", "Will you go to the dance with me? Check yes or no.", loc="room", cast=[N(expr="determined")], cam=[540, 860, 1.5]),
    line("NARR", "He slipped it into her locker. Then hid in a trash can.", loc="hallway", cast=[], front=[E("🗑️", 540, 1300, at=0.8, size=360), E("👀", 540, 1170, at=1.4, size=110)]),
    line("NARR", "At lunch, Maya found him.", loc="hallway", cast=two(N(expr="shocked"), C("MAYA", expr="happy"))),
    line("MAYA", "Yes. Obviously, yes.", loc="hallway", cast=[C("MAYA", expr="happy", scale=0.92)], fx=["hearts"], cam=[540, 860, 1.6]),
    line("NORB", "She said yes. She said yes!", loc="hallway", cast=[N(expr="happy", pose="cheer", jump=7)], fx=["confetti"]),
    glow_line(25, "✅ DATE: SECURED 💛"),
    line("NARR", "Then Chad found out.", loc="hallway", cast=[C("CHAD", expr="determined", scale=0.92)], fx=["red"], cam=[540, 860, 1.6], shake=True),
    end("Tomorrow: Chad is not happy. Follow for day twenty six.", "CHAD IS MAD", "😠"),
])

# ---------------- DAY 26: CHALLENGE ----------------
EPS[26] = dict(look=dict(FRESH), title="chad challenged him", lines=[
    hook(26, "Day twenty six. Chad is not happy.", "CHAD IS MAD 😠", loc="hallway", cast=two(N(expr="awkward"), C("CHAD", expr="determined"))),
    line("CHAD", "You? With Maya? You were a ten percent.", loc="hallway", cast=two(N(expr="awkward"), C("CHAD", expr="smug", pose="point")), cam=[700, 900, 1.3]),
    line("NORB", "I'm a seventy six now. Look it up.", loc="hallway", cast=two(N(expr="smug", pose="point"), C("CHAD", expr="shocked")), cam=[380, 880, 1.5], sfx=[["ding", 0.9]]),
    line("NARR", "So Chad challenged him. A dance battle. Friday. The whole school.", loc="gym", cast=two(N(expr="shocked"), C("CHAD", expr="smug")), screen=[T("DANCE BATTLE ⚔️", 540, 700, at=0.9, size=120)]),
    line("NORB", "I know one move. One!", loc="gym", cast=[N(expr="panic", pose="panic")], cam=[540, 860, 1.7], shake=True),
    line("NARR", "So Grandma came out of retirement.", loc="room", cast=two(N(expr="awkward"), C("GRAN", expr="smug", dance=True))),
    line("GRAN", "I won the state jitterbug finals. Nineteen seventy one.", loc="room", cast=[C("GRAN", expr="smug", dance=True, scale=0.92)], cam=[540, 900, 1.4], fx=["sparkle"]),
    glow_line(26, "✅ TRAINING: GRAN MODE"),
    line("NARR", "Training starts at five AM.", loc="night", cast=[N(expr="shocked")], fx=["clock"]),
    end("Tomorrow: Gran's boot camp. Follow for day twenty seven.", "GRAN BOOT CAMP", "👵"),
])

# ---------------- DAY 27: BOOT CAMP ----------------
EPS[27] = dict(look=dict(FRESH), title="grandma's dance boot camp", lines=[
    hook(27, "Day twenty seven. Grandma's dance boot camp. Five AM.", "GRAN BOOT CAMP 👵", cast=two(N(expr="sad", blink=0.7), C("GRAN", expr="determined")), fx=["dark:0.3"]),
    line("GRAN", "Again! Again! My hip is younger than yours!", loc="room", cast=two(N(expr="panic", dance=True), C("GRAN", expr="determined", dance=True)), cam=[700, 900, 1.3]),
    line("NARR", "The spin. The slide. The worm.", loc="room", cast=[N(expr="determined", dance=True)], screen=[E("🌀", 220, 760, at=0.2), E("🛝", 540, 640, at=0.8), E("🪱", 860, 760, at=1.4)]),
    line("NARR", "The worm went badly.", loc="room", cast=[N(expr="shocked", pushup=True, y=1450)], screen=[E("💥", 540, 1150, at=0.4, size=240)], shake=1.0),
    line("NARR", "By sunset, he had a full routine.", loc="park", cast=[N(expr="smug", dance=True)], fx=["sparkle"]),
    line("NORB", "Gran. I think I can actually dance.", loc="park", cast=two(N(expr="happy"), C("GRAN", expr="happy"))),
    line("GRAN", "I know, sweetie. I taught you.", loc="park", cast=two(N(expr="happy"), C("GRAN", expr="smug")), cam=[700, 900, 1.3]),
    glow_line(27, "✅ DANCE: FULL ROUTINE"),
    line("NARR", "Then it was Friday. Dance battle time.", loc="gym", cast=two(N(expr="determined"), C("CHAD", expr="determined")), shake=True, sfx=[["braam", 0.0]]),
    end("Tomorrow: the dance battle. Follow for day twenty eight.", "DANCE BATTLE", "⚔️"),
])

# ---------------- DAY 28: BATTLE ----------------
EPS[28] = dict(look=dict(FRESH), title="the dance battle", lines=[
    hook(28, "Day twenty eight. Dance battle. The whole school is watching.", "DANCE BATTLE ⚔️", loc="gym", cast=two(N(expr="determined"), C("CHAD", expr="smug")), sfx=[["crowd", 0.3]]),
    line("NARR", "Chad went first. A backflip. The crowd screamed.", loc="gym", cast=[C("CHAD", expr="smug", jump=5, pose="cheer", scale=0.92)], fx=["confetti"]),
    line("CHAD", "Beat that, ten percent.", loc="gym", cast=[C("CHAD", expr="smug", pose="point", scale=0.92)], cam=[540, 860, 1.6]),
    line("NARR", "Norbert stepped up. Spin. Slide. Gran's secret move.", loc="gym", cast=[N(expr="determined", dance=True)], fx=["speed", "sparkle"]),
    line("NARR", "And then, the worm. Perfect.", loc="gym", cast=[N(expr="happy", pushup=True, y=1450)], fx=["sparkle"]),
    line("NARR", "The gym went silent. Then it went insane.", loc="gym", cast=[N(expr="happy", pose="cheer", jump=7)], fx=["confetti", "hearts"], sfx=[["crowd", 0.8]]),
    line("NORB", "Gran! It worked!", loc="gym", cast=[N(expr="happy", pose="cheer")], cam=[540, 860, 1.6], fx=["confetti"]),
    glow_line(28, "✅ BATTLE: WON 🏆"),
    line("NARR", "Then Chad walked up to him. Everyone held their breath.", loc="gym", cast=two(N(expr="awkward"), C("CHAD", expr="determined", walk=[980, 760])), fx=["dark:0.35"], sfx=[["heartbeat", 0.0]]),
    end("Tomorrow: what does Chad do? Follow for day twenty nine.", "CHAD'S MOVE", "😳"),
])

# ---------------- DAY 29: NIGHT BEFORE ----------------
EPS[29] = dict(look=dict(FRESH), title="what did chad do?", lines=[
    hook(29, "Day twenty nine. Chad walked up to Norbert.", "WHAT DID CHAD DO? 😳", loc="gym", cast=two(N(expr="awkward"), C("CHAD", expr="determined"))),
    line("CHAD", "That was sick, man. Respect.", loc="gym", cast=two(N(expr="shocked"), C("CHAD", expr="happy", pose="point")), cam=[700, 900, 1.3]),
    line("NORB", "Wait. Are we friends now?", loc="gym", cast=two(N(expr="happy"), C("CHAD", expr="smug")), cam=[380, 880, 1.5]),
    line("CHAD", "Don't push it.", loc="gym", cast=[C("CHAD", expr="smug", scale=0.92)], cam=[540, 860, 1.6]),
    line("NARR", "The dance is tomorrow. Final checklist.", loc="room", cast=[N(expr="determined", outfit="suit")]),
    line("NARR", "Hair. Skin. Teeth. Suit. Corsage. Courage.", loc="room", cast=[N(expr="smug", outfit="suit")],
         screen=[E("💇", 200, 640, at=0.1, size=130), E("✨", 420, 600, at=0.5, size=130), E("🦷", 660, 600, at=0.9, size=130), E("🤵", 880, 640, at=1.3, size=130), E("💐", 300, 860, at=1.7, size=130), E("🦁", 780, 860, at=2.1, size=130)]),
    line("NORB", "Twenty nine days ago, a bird lived in my hair.", loc="room", cast=[N(expr="happy", outfit="suit")], cam=[540, 860, 1.5], fx=["sparkle"]),
    glow_line(29, "✅ EVERYTHING: READY"),
    line("NARR", "He set three alarms. He did not sleep at all.", loc="room", cast=[N(expr="panic", blink=0, phone=True, phoneGlow=True, armR=2.05, bendR=0.75)], fx=["dark:0.5", "clock"]),
    end("Tomorrow: the spring dance. The finale. Don't miss it.", "THE FINALE", "💃", cta="FOLLOW FOR THE FINALE 🔔"),
])

# ---------------- DAY 30: FINALE ----------------
MAYA_DRESS = {"colors": {"shirt": "#FF6FA8", "shirtSh": "#E0558C", "pants": "#FF6FA8", "logoText": "✦", "logo": "#FFF"}}
EPS[30] = dict(look=dict(FRESH, outfit="suit"), days_left=0, glow_steps=[{"scene": "gmeter", "from": 88, "to": 100}], title="the spring dance (finale)", lines=[
    hook(30, "Day thirty. Tonight is the spring dance.", "DAY 30: THE DANCE 💃", loc="night", cast=[N(expr="determined", outfit="suit")], front=[E("💐", 760, 1150, at=0.6, size=150)]),
    line("NARR", "He knocked on Maya's door.", loc="night", cast=[N(expr="awkward", outfit="suit", x=600)], sfx=[["knock", 0.6]], cam=[480, 1000, 1.3]),
    line("MAYA", "Wow. Norbert?", loc="night", cast=two(N(expr="awkward", outfit="suit", blush=True), C("MAYA", expr="shocked", **MAYA_DRESS)), cam=[700, 900, 1.3], fx=["hearts"]),
    line("NORB", "I made this. It's not a salad, I promise.", loc="night", cast=two(N(expr="happy", outfit="suit", pose="point", blush=True), C("MAYA", expr="happy", **MAYA_DRESS)), front=[E("💐", 470, 1060, at=0.3, size=130)], cam=[440, 920, 1.4]),
    line("NARR", "The lights. The music. The dance floor.", loc="dance", cast=two(N(expr="happy", outfit="suit", dance=True), C("MAYA", expr="happy", dance=True, **MAYA_DRESS)), fx=["confetti"], cam=[540, 900, 1.3], cam2=[540, 1060, 1.0], camDur=2.0),
    line("NARR", "And Gran's secret move.", loc="dance", cast=[N(expr="smug", outfit="suit", dance=True, jump=4)], fx=["sparkle", "speed"]),
    line("MAYA", "You know you didn't have to change everything, right?", loc="dance", cast=two(N(expr="happy", outfit="suit", blush=True), C("MAYA", expr="happy", **MAYA_DRESS)), fx=["hearts"], cam=[700, 900, 1.3]),
    line("NORB", "I know. But I kind of like the new me.", loc="dance", cast=two(N(expr="happy", outfit="suit", blush=True), C("MAYA", expr="happy", **MAYA_DRESS)), fx=["hearts"], cam=[380, 880, 1.4]),
    meter("Glow up: one hundred percent.", "🏆 GLOW-UP COMPLETE", gold=True, label="FINAL SCORE", fx=["confetti"]),
    line("NARR", "Thirty days. One glow up. Thank you for watching.", loc="dance", cast=two(N(expr="happy", outfit="suit", dance=True), C("MAYA", expr="happy", dance=True, **MAYA_DRESS)), fx=["confetti", "hearts"]),
    end("Should Norbert get a season two? Comment season two.", "SEASON 2? 👀", "🎬", title="THE END… FOR NOW", cta="COMMENT 'SEASON 2' 🔔", expr="happy"),
])


def build(d, spec):
    ep = {
        "id": f"ep{d:02d}", "day": d, "title": f"Day {d} of 30",
        "days_left": spec.get("days_left", 31 - d),
        "glow": GLOW[d - 1],
        "glow_steps": spec.get("glow_steps", [{"scene": "gmeter", "from": GLOW[d - 1], "to": GLOW[d]}]),
        "look": spec["look"], "voices": VOICES, "cap_colors": CAPS, "lines": spec["lines"],
        "hook_title": spec["title"],
    }
    return ep


if __name__ == "__main__":
    for d, spec in EPS.items():
        with open(os.path.join(HERE, f"ep{d:02d}.json"), "w") as fh:
            json.dump(build(d, spec), fh, indent=1, ensure_ascii=False)
    print("wrote", len(EPS), "episodes")
