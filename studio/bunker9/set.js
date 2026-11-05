// Bunker 9 sets, lighting and creatures. World is 1080x1920 (wider sets extend past the edges). Floor at y=1500.
(function () {
  const INK = '#0B0B0D';
  const f = (n) => Math.round(n * 10) / 10;
  const shape = (d, fill, sw = 5) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const line = (d, w = 5, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const S = {};

  S.concrete = function (x0, x1) {
    let s = `<rect x="${x0}" y="-400" width="${x1 - x0}" height="1900" fill="#2B2E34"/>`;
    for (let x = x0 - (x0 % 240); x < x1; x += 240) s += `<rect x="${x}" y="-400" width="4" height="1900" fill="#24272C"/>`;
    for (let y = 200; y < 1500; y += 260) s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="4" fill="#24272C"/>`;
    // pipes
    s += `<rect x="${x0}" y="230" width="${x1 - x0}" height="26" fill="#3A3E45" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="${x0}" y="270" width="${x1 - x0}" height="14" fill="#4A3B32" stroke="${INK}" stroke-width="3"/>`;
    for (let x = x0 + 120; x < x1; x += 420) s += `<rect x="${x}" y="222" width="18" height="42" fill="#2B2E34" stroke="${INK}" stroke-width="3"/>`;
    // floor
    s += `<rect x="${x0}" y="1500" width="${x1 - x0}" height="800" fill="#1A1C20"/>`;
    s += `<rect x="${x0}" y="1494" width="${x1 - x0}" height="12" fill="#121316"/>`;
    for (let x = x0; x < x1; x += 160) s += `<path d="M ${x} 1506 L ${x - 200} 2100" stroke="#16181B" stroke-width="3"/>`;
    return s;
  };

  // The steel door. boltK: 0 = locked, 1 = open. slotK: flap open amount.
  S.door = function (t, o = {}) {
    const cx = 620, top = 600, w = 420, boltK = o.boltK || 0, slotK = o.slotK || 0, knock = o.knock || 0;
    const sh = knock * Math.sin(t * 90) * 4;
    let s = `<g transform="translate(${f(sh)} 0)">`;
    s += `<rect x="${cx - w / 2 - 30}" y="${top - 30}" width="${w + 60}" height="${1500 - top + 30}" fill="#1E2024" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="${cx - w / 2}" y="${top}" width="${w}" height="${1500 - top}" fill="#4A4F57" stroke="${INK}" stroke-width="6"/>`;
    for (const yy of [top + 40, 1460]) for (let x = cx - w / 2 + 30; x < cx + w / 2; x += 60) s += `<circle cx="${x}" cy="${yy}" r="6" fill="#363A40" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="${cx - w / 2 + 40}" y="${top + 80}" width="${w - 80}" height="300" fill="none" stroke="#3B3F46" stroke-width="8"/>`;
    // scratches
    s += line(`M ${cx - 120} ${top + 520} l 40 120 M ${cx - 100} ${top + 520} l 40 120 M ${cx - 80} ${top + 520} l 40 120`, 3, '#5D636C');
    // slot
    const sy = 1040;
    s += `<rect x="${cx - 100}" y="${sy}" width="200" height="54" fill="#050506" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="${cx - 100}" y="${f(sy - slotK * 50)}" width="200" height="54" fill="#5A6069" stroke="${INK}" stroke-width="5"/>`;
    // bolt
    const bx = cx + w / 2 - 40 - boltK * 150;
    s += `<rect x="${cx + w / 2 - 220}" y="1150" width="250" height="34" rx="6" fill="#2C2F35" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="${f(bx - 140)}" y="1156" width="190" height="22" rx="6" fill="#9AA1AB" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="${f(bx - 40)}" y="1132" width="22" height="40" rx="5" fill="#9AA1AB" stroke="${INK}" stroke-width="4"/>`;
    s += `</g>`;
    return s;
  };

  S.rule = function (t, alpha = 1) {
    return `<g opacity="${alpha}" font-family="SpecialElite" text-anchor="middle" fill="#E0473C">` +
      `<text x="620" y="440" font-size="62" transform="rotate(-2 620 440)">NEVER OPEN AFTER DARK.</text>` +
      `<text x="620" y="520" font-size="54" transform="rotate(1 620 520)">THEY ONLY SOUND LIKE US.</text>` +
      `<path d="M 430 450 l 0 40 M 560 452 l 0 26 M 760 446 l 0 54 M 520 530 l 0 30 M 700 528 l 0 44" stroke="#E0473C" stroke-width="5" stroke-linecap="round"/></g>`;
  };

  S.bunkroom = function (t) {
    let s = S.concrete(-400, 2400);
    // bunks
    for (const bx of [-60, 1260]) {
      s += `<rect x="${bx}" y="900" width="420" height="34" fill="#3A3E45" stroke="${INK}" stroke-width="5"/>`;
      s += `<rect x="${bx}" y="1240" width="420" height="34" fill="#3A3E45" stroke="${INK}" stroke-width="5"/>`;
      s += `<rect x="${bx + 10}" y="866" width="400" height="36" rx="10" fill="#5B4E6A" stroke="${INK}" stroke-width="4"/>`;
      s += `<rect x="${bx + 10}" y="1206" width="400" height="36" rx="10" fill="#4A5A6A" stroke="${INK}" stroke-width="4"/>`;
      for (const px of [bx, bx + 400]) s += `<rect x="${px}" y="860" width="20" height="640" fill="#2E3238" stroke="${INK}" stroke-width="4"/>`;
    }
    // crates, generator, maps
    s += `<rect x="560" y="1330" width="200" height="170" fill="#5A4632" stroke="${INK}" stroke-width="5"/><path d="M 560 1330 L 760 1500 M 760 1330 L 560 1500" stroke="#3E3022" stroke-width="5"/>`;
    s += `<rect x="1820" y="1240" width="300" height="260" rx="10" fill="#3D5A3E" stroke="${INK}" stroke-width="6"/><circle cx="1900" cy="1330" r="40" fill="#2A2D33" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="900" y="620" width="240" height="180" fill="#C9B994" stroke="${INK}" stroke-width="5" transform="rotate(-3 1020 710)"/>`;
    s += line('M 930 660 Q 990 700 1040 650 T 1110 700', 4, '#7A2E24') + `<circle cx="1050" cy="720" r="10" fill="none" stroke="#B3271F" stroke-width="4"/>`;
    // hanging lamps
    for (const lx of [300, 1020, 1740]) {
      const sw = Math.sin(t * 1.3 + lx) * 4;
      s += `<path d="M ${lx} 284 L ${f(lx + sw)} 470" stroke="${INK}" stroke-width="4"/>` + shape(`M ${f(lx + sw - 40)} 470 L ${f(lx + sw + 40)} 470 L ${f(lx + sw + 24)} 430 L ${f(lx + sw - 24)} 430 Z`, '#3A3E45', 4) +
        `<ellipse cx="${f(lx + sw)}" cy="476" rx="20" ry="10" fill="#FFE7A8"/>`;
    }
    return s;
  };

  // Fog: soft drifting blobs (draw on top of the set, under the darkness).
  S.fog = function (t, y0 = 1300, n = 7, w = 1080) {
    let s = `<g filter="url(#fogblur)" opacity="0.5">`;
    for (let i = 0; i < n; i++) {
      const x = ((i * 337 + t * (18 + i * 4)) % (w + 600)) - 300, y = y0 + (i % 3) * 70;
      s += `<ellipse cx="${f(x)}" cy="${y}" rx="${220 + (i % 4) * 60}" ry="60" fill="#8E9AA8" opacity="0.35"/>`;
    }
    return s + `</g>`;
  };

  // Darkness with holes for lights. lights: [{x,y,r}] soft circles, cones: [{x,y,a,len,spread}] flashlight beams.
  let maskId = 0;
  S.dark = function (amount, lights = [], cones = [], tint = '#000') {
    const id = 'm' + (maskId++);
    let m = `<mask id="${id}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/>`;
    for (const l of lights) m += `<circle cx="${f(l.x)}" cy="${f(l.y)}" r="${f(l.r)}" fill="url(#holeGrad)"/>`;
    for (const c of cones) {
      const a1 = c.a - c.spread, a2 = c.a + c.spread;
      const p1 = `${f(c.x + Math.cos(a1) * c.len)} ${f(c.y + Math.sin(a1) * c.len)}`, p2 = `${f(c.x + Math.cos(a2) * c.len)} ${f(c.y + Math.sin(a2) * c.len)}`;
      m += `<path d="M ${f(c.x)} ${f(c.y)} L ${p1} L ${p2} Z" fill="#000" filter="url(#coneblur)"/>`;
    }
    m += `</mask>`;
    return `<defs>${m}</defs><rect x="-2000" y="-2000" width="6000" height="6000" fill="${tint}" opacity="${amount.toFixed(3)}" mask="url(#${id})"/>`;
  };

  // The thing at the slot: a small pale hand with seven long fingers.
  S.hand = function (t, k, x = 620, y = 1066) {
    if (k <= 0) return '';
    const reach = k * 260, tw = Math.sin(t * 7) * 0.08;
    let s = `<g transform="translate(${x} ${y}) rotate(${(-8 + Math.sin(t * 2) * 3).toFixed(1)})">`;
    s += `<path d="M -20 -14 L ${f(-20 + 30)} ${f(-14 + reach * 0.9)} L ${f(20 + 30)} ${f(-14 + reach * 0.9)} L 20 -14 Z" fill="#D8D2C6" stroke="${INK}" stroke-width="5"/>`;
    const px = 30, py = reach * 0.9;
    s += `<ellipse cx="${px}" cy="${f(py + 26)}" rx="34" ry="28" fill="#D8D2C6" stroke="${INK}" stroke-width="5"/>`;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i - 3) * 0.3 + tw * Math.sin(i + t * 3);
      const L = 120 + (i % 3) * 35 + k * 50;
      const ex = px + Math.cos(a) * L, ey = py + 30 + Math.sin(a) * L;
      const mx = px + Math.cos(a - 0.15) * L * 0.6, my = py + 30 + Math.sin(a - 0.15) * L * 0.6;
      s += `<path d="M ${px} ${f(py + 34)} Q ${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>` +
        `<path d="M ${px} ${f(py + 34)} Q ${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" fill="none" stroke="#D8D2C6" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="${f(ex)}" cy="${f(ey)}" r="5" fill="#3A2F2A"/>`;
    }
    return s + `</g>`;
  };

  // City street at dusk: burning sky, skyline, a missile trail.
  S.city = function (t, o = {}) {
    let s = `<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1630"/><stop offset="0.55" stop-color="#B4472E"/><stop offset="1" stop-color="#F0A04B"/></linearGradient></defs>`;
    s += `<rect x="-800" y="-400" width="3000" height="1900" fill="url(#dusk)"/>`;
    // missile trail
    const mk = o.missile != null ? o.missile : 0.5;
    s += `<path d="M 1300 -200 Q 900 ${f(200 + mk * 100)} ${f(1300 - mk * 900)} ${f(-200 + mk * 900)}" stroke="#FFF2D6" stroke-width="10" fill="none" opacity="0.8"/>`;
    s += `<circle cx="${f(1300 - mk * 900)}" cy="${f(-200 + mk * 900)}" r="14" fill="#FFFFFF"/>`;
    // skyline layers
    const B1 = [[-700, 700], [-520, 520], [-380, 760], [-200, 600], [-40, 820], [140, 560], [300, 720], [470, 640], [640, 800], [820, 580], [980, 700], [1150, 620], [1320, 760], [1500, 600], [1680, 740]];
    for (const [x, h] of B1) {
      s += `<rect x="${x}" y="${1500 - h}" width="170" height="${h}" fill="#1E1420" stroke="${INK}" stroke-width="4"/>`;
      for (let wy = 1500 - h + 40; wy < 1400; wy += 70) for (let wx = x + 22; wx < x + 150; wx += 44)
        if (((wx * 7 + wy * 3) % 5) < 2) s += `<rect x="${wx}" y="${wy}" width="22" height="30" fill="#F2C76B" opacity="${(0.5 + 0.5 * Math.sin(t * 3 + wx + wy)).toFixed(2)}"/>`;
    }
    s += `<rect x="-800" y="1500" width="3000" height="800" fill="#26242A"/>`;
    for (let x = -800; x < 2200; x += 200) s += `<rect x="${x}" y="1640" width="110" height="14" fill="#E8D27A"/>`;
    // abandoned car
    s += shape('M 820 1500 L 840 1420 Q 900 1380 1000 1380 L 1080 1420 L 1120 1500 Z', '#7A2E2A') + `<circle cx="880" cy="1504" r="30" fill="#111" stroke="${INK}" stroke-width="4"/><circle cx="1070" cy="1504" r="30" fill="#111" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="900" y="1395" width="70" height="30" fill="#9FC6E0" opacity="0.6"/>`;
    s += `<circle cx="1110" cy="1460" r="10" fill="${(t * 3) % 1 < 0.5 ? '#FFB020' : '#5A3A10'}"/>`;
    return s;
  };

  // Parking garage with the bunker hatch, light spilling out.
  S.garage = function (t, o = {}) {
    let s = `<rect x="-800" y="-400" width="3000" height="1900" fill="#2C2B2E"/>`;
    s += `<rect x="-800" y="200" width="3000" height="60" fill="#3A393D" stroke="${INK}" stroke-width="4"/>`;
    for (const x of [-500, 100, 1300, 1900]) s += `<rect x="${x}" y="260" width="120" height="1240" fill="#3E3D42" stroke="${INK}" stroke-width="5"/><rect x="${x}" y="1100" width="120" height="40" fill="#C9A227"/>`;
    s += `<text x="160" y="900" font-family="Anton" font-size="90" fill="#C9A227" opacity="0.6">P2</text>`;
    // hatch / steel door in the far wall
    const op = o.open != null ? o.open : 1;
    s += `<rect x="460" y="700" width="340" height="800" fill="#FFE2A0"/>`;
    s += `<rect x="${f(460 - op * 300)}" y="700" width="340" height="800" fill="#4A4F57" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="440" y="680" width="380" height="20" fill="#1E2024"/>`;
    s += `<text x="630" y="650" text-anchor="middle" font-family="SpecialElite" font-size="56" fill="#E0473C">BUNKER 9</text>`;
    s += `<rect x="-800" y="1500" width="3000" height="800" fill="#1E1D21"/>`;
    for (let x = -800; x < 2200; x += 260) s += `<rect x="${x}" y="1560" width="12" height="200" fill="#E8E2C4" transform="skewX(-30)"/>`;
    return s;
  };

  // Dust falling (after the blast).
  S.dust = function (t, n = 40, amt = 1) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = (i * 97) % 1200 - 60, y = ((t * (120 + (i % 7) * 30) + i * 53) % 1700) + 100;
      s += `<circle cx="${x}" cy="${f(y)}" r="${2 + (i % 3)}" fill="#C9C1B0" opacity="${(0.4 * amt).toFixed(2)}"/>`;
    }
    return s;
  };

  // Emergency alert on a phone screen.
  S.alert = function (t, k) {
    const sh = Math.sin(t * 70) * 6;
    let s = `<rect width="1080" height="1920" fill="${(t * 2) % 1 < 0.5 ? '#3A0606' : '#140303'}"/>`;
    s += `<g transform="translate(${f(540 + sh)} 980) rotate(${f(Math.sin(t * 50) * 1.5)})">`;
    s += `<rect x="-330" y="-640" width="660" height="1280" rx="70" fill="#0E0F12" stroke="#000" stroke-width="10"/>`;
    s += `<rect x="-298" y="-600" width="596" height="1200" rx="44" fill="#1B1D22"/>`;
    s += `<rect x="-270" y="-420" width="540" height="560" rx="30" fill="#ECECEC"/>`;
    s += `<text x="-230" y="-350" font-family="Anton" font-size="44" fill="#C8372D">⚠ EMERGENCY ALERT</text>`;
    s += `<text x="-230" y="-260" font-family="Anton" font-size="64" fill="#111">BALLISTIC MISSILE</text>`;
    s += `<text x="-230" y="-185" font-family="Anton" font-size="64" fill="#111">THREAT INBOUND.</text>`;
    s += `<text x="-230" y="-100" font-family="Anton" font-size="46" fill="#333">SEEK IMMEDIATE SHELTER.</text>`;
    s += `<text x="-230" y="-30" font-family="Anton" font-size="56" fill="#C8372D">THIS IS NOT A DRILL.</text>`;
    s += `<text x="-230" y="90" font-family="SpecialElite" font-size="36" fill="#555">Impact estimate: 11 min</text>`;
    s += `</g>`;
    return s;
  };

  // Table with a glowing radio.
  S.radioTable = function (t) {
    let s = `<rect x="320" y="1260" width="440" height="30" fill="#5A4632" stroke="${INK}" stroke-width="5"/><rect x="340" y="1290" width="20" height="210" fill="#5A4632"/><rect x="720" y="1290" width="20" height="210" fill="#5A4632"/>`;
    s += shape('M 420 1130 L 660 1130 L 660 1260 L 420 1260 Z', '#3A3E45');
    s += `<rect x="440" y="1150" width="120" height="60" fill="#F2C76B" opacity="${(0.6 + 0.4 * Math.sin(t * 8)).toFixed(2)}"/><circle cx="610" cy="1190" r="28" fill="#2B2E34" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M 640 1130 L 700 1000" stroke="${INK}" stroke-width="6"/>`;
    // a few cans
    for (const [x, c] of [[300, '#B3271F'], [770, '#3E7CC0'], [810, '#9AA1AB']]) s += `<rect x="${x}" y="1205" width="40" height="55" rx="5" fill="${c}" stroke="${INK}" stroke-width="4"/>`;
    return s;
  };

  // ---- cinematic layer helpers ----
  S.grade = (col, op = 0.25, mode = 'overlay') => `<rect x="-2000" y="-2000" width="6000" height="6000" fill="${col}" opacity="${op}" style="mix-blend-mode:${mode}"/>`;
  S.bloom = (x, y, r, col = '#FFD9A0', op = 0.55) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${op}" filter="url(#bloomblur)" style="mix-blend-mode:screen"/>`;
  S.shaft = (x, y, w, len, ang, col = '#FFE3B0', op = 0.18) =>
    `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)})"><path d="M ${-w * 0.2} 0 L ${w * 0.2} 0 L ${w} ${len} L ${-w} ${len} Z" fill="${col}" opacity="${op}" filter="url(#coneblur)" style="mix-blend-mode:screen"/></g>`;
  S.embers = function (t, n = 40, col = '#FFB25A') {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = ((i * 131) % 1400) - 160 + Math.sin(t * 1.5 + i) * 30, y = 1700 - ((t * (90 + (i % 5) * 40) + i * 77) % 1900);
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${2 + (i % 3)}" fill="${col}" opacity="${(0.4 + 0.5 * Math.abs(Math.sin(t * 4 + i))).toFixed(2)}"/>`;
    }
    return `<g style="mix-blend-mode:screen">${s}</g>`;
  };
  // An infected: hunched stick body, grey-green skin, torn clothes, glowing eyes, limping shamble.
  S.zombie = function (t, x, y, sc = 1, ph = 0, o = {}) {
    const w = t * 1.6 + ph, lurch = Math.sin(w * Math.PI) * 6, fl = o.flip ? -1 : 1;
    const skin = '#8FA08A', cloth = o.cloth || '#4A3F45';
    let s = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc * fl)} ${f(sc)})">`;
    s += `<ellipse cx="0" cy="6" rx="100" ry="14" fill="rgba(0,0,0,0.45)"/>`;
    for (const sd of [-1, 1]) {
      const p2 = w * Math.PI + (sd > 0 ? Math.PI : 0);
      const fx = sd * 20 + Math.sin(p2) * 40, kx = sd * 16 + Math.sin(p2) * 22 + 20;
      s += `<path d="M ${sd * 20} -290 Q ${f(kx)} -150 ${f(fx)} 0" stroke="${INK}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M ${sd * 20} -290 Q ${f(kx)} -150 ${f(fx)} 0" stroke="#3A3530" stroke-width="20" fill="none" stroke-linecap="round"/>`;
    }
    s += `<g transform="rotate(${f(24 + lurch)} 0 -300)">`;
    s += `<path d="M -54 -560 Q 0 -576 54 -560 L 62 -300 L 30 -280 L 10 -300 L -20 -276 L -62 -300 Z" fill="${cloth}" stroke="${INK}" stroke-width="5"/>`;
    for (const sd of [-1, 1]) s += `<path d="M ${sd * 48} -540 Q ${sd * 120} -470 ${sd * 60 + 140} ${f(-430 + Math.sin(w * 2 + sd) * 20)}" stroke="${INK}" stroke-width="28" fill="none" stroke-linecap="round"/><path d="M ${sd * 48} -540 Q ${sd * 120} -470 ${sd * 60 + 140} ${f(-430 + Math.sin(w * 2 + sd) * 20)}" stroke="${skin}" stroke-width="18" fill="none" stroke-linecap="round"/>`;
    s += `<circle cx="20" cy="-640" r="70" fill="${skin}" stroke="${INK}" stroke-width="6"/>`;
    s += `<path d="M -20 -690 L 10 -660 L -4 -640" stroke="#5A2A2A" stroke-width="5" fill="none"/>`;
    s += `<circle cx="0" cy="-650" r="13" fill="#E9F57A"/><circle cx="44" cy="-650" r="13" fill="#E9F57A"/>` + S.bloom(22, -650, 40, '#E9F57A', 0.5);
    s += `<path d="M -4 -606 Q 22 -592 50 -608 L 44 -596 L 34 -604 L 26 -594 L 16 -604 L 6 -594 Z" fill="#2A1414" stroke="${INK}" stroke-width="3"/>`;
    s += `</g></g>`;
    return s;
  };
  // Mushroom cloud on the horizon. k: 0..1 growth.
  S.mushroom = function (t, x, y, k) {
    if (k <= 0) return '';
    const h = 900 * k, w = 380 * Math.min(1, k * 1.4);
    let s = `<g transform="translate(${x} ${y})" style="mix-blend-mode:screen">`;
    s += `<path d="M -70 0 Q -50 ${f(-h * 0.5)} -90 ${f(-h * 0.8)} L 90 ${f(-h * 0.8)} Q 50 ${f(-h * 0.5)} 70 0 Z" fill="#E8A35A" opacity="0.8" filter="url(#fogblur)"/>`;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + t * 0.2;
      s += `<circle cx="${f(Math.cos(a) * w * 0.55)}" cy="${f(-h * 0.85 + Math.sin(a) * w * 0.22)}" r="${f(w * 0.42)}" fill="${i % 2 ? '#FFC77A' : '#E86B3A'}" opacity="0.75" filter="url(#fogblur)"/>`;
    }
    s += `<circle cx="0" cy="${f(-h * 0.85)}" r="${f(w * 0.5)}" fill="#FFF3D0" opacity="0.6" filter="url(#bloomblur)"/>`;
    s += `</g><g transform="translate(${x} ${y})">`;
    // solid, readable silhouette on top of the glow
    s += `<path d="M -46 0 Q -30 ${f(-h * 0.45)} -60 ${f(-h * 0.78)} L 60 ${f(-h * 0.78)} Q 30 ${f(-h * 0.45)} 46 0 Z" fill="#C8552E" opacity="0.9"/>`;
    s += `<ellipse cx="0" cy="${f(-h * 0.86)}" rx="${f(w * 0.85)}" ry="${f(w * 0.42)}" fill="#E07A3A" opacity="0.92"/>`;
    s += `<ellipse cx="0" cy="${f(-h * 0.9)}" rx="${f(w * 0.6)}" ry="${f(w * 0.26)}" fill="#FFC77A" opacity="0.9"/>`;
    s += `<ellipse cx="0" cy="${f(-h * 0.55)}" rx="${f(w * 0.5)}" ry="${f(w * 0.1)}" fill="#E8A35A" opacity="0.7"/>`;
    return s + `</g>`;
  };

  window.Bunker = S;
})();
