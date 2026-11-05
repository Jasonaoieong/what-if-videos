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

  window.Bunker = S;
})();
