// Shared drawing helpers for Norbert episodes: room, effects, HUD, captions, overlays.
(function () {
  const L = {};
  L.ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  L.easeIO = (x) => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  L.pop = (t, t0, d = 0.18) => { const x = (t - t0) / d; if (x < 0) return 0; if (x > 1) return 1; return L.ease(x) + Math.sin(x * Math.PI) * 0.22; };
  L.between = (t, a, b) => t >= a && t < b;
  const INK = '#1A1410';

  L.room = function (t) {
    let s = '';
    s += `<rect x="-600" y="-600" width="2280" height="2100" fill="#2E5B63"/>`;
    for (let x = -600; x < 1680; x += 60) s += `<rect x="${x}" y="-600" width="26" height="2100" fill="#2A535A"/>`;
    // window
    s += `<rect x="90" y="560" width="300" height="260" rx="10" fill="#14233F" stroke="${INK}" stroke-width="10"/>`;
    s += `<line x1="240" y1="560" x2="240" y2="820" stroke="${INK}" stroke-width="8"/><line x1="90" y1="690" x2="390" y2="690" stroke="${INK}" stroke-width="8"/>`;
    s += `<circle cx="320" cy="620" r="26" fill="#F6E7A1"/>`;
    for (const [x, y] of [[130, 600], [180, 760], [350, 760], [280, 720], [150, 650]])
      s += `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity="${(0.5 + 0.5 * Math.sin(t * 3 + x)).toFixed(2)}"/>`;
    // curtains
    s += `<path d="M 70 545 Q 110 700 80 840 L 40 840 L 40 545 Z" fill="#B5463A" stroke="${INK}" stroke-width="6"/>`;
    s += `<path d="M 410 545 Q 370 700 400 840 L 440 840 L 440 545 Z" fill="#B5463A" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="30" y="535" width="420" height="16" rx="8" fill="${INK}"/>`;
    // posters
    s += `<g transform="rotate(-4 840 640)"><rect x="740" y="540" width="200" height="250" fill="#E25B4A" stroke="${INK}" stroke-width="8"/>` +
      `<path d="M 840 580 L 880 690 L 800 690 Z" fill="#F7C548" stroke="${INK}" stroke-width="6"/><rect x="775" y="720" width="130" height="18" fill="${INK}"/></g>`;
    s += `<g transform="rotate(5 545 525)"><rect x="470" y="470" width="150" height="110" fill="#7FB3D5" stroke="${INK}" stroke-width="7"/>` +
      `<circle cx="545" cy="520" r="28" fill="#F7C548" stroke="${INK}" stroke-width="5"/></g>`;
    // shelf with trophies of nothing
    s += `<rect x="640" y="820" width="200" height="16" fill="#8A6A4F" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="660" y="780" width="26" height="40" fill="#C9A227" stroke="${INK}" stroke-width="4"/><rect x="700" y="760" width="40" height="60" fill="#5E7CE2" stroke="${INK}" stroke-width="4"/>`;
    // floor
    s += `<rect x="-600" y="1400" width="2280" height="900" fill="#6B4E3D"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="-600" y="${1400 + i * 90}" width="2280" height="4" fill="#5B4133"/>`;
    s += `<rect x="-600" y="1392" width="2280" height="14" fill="#3E2C22"/>`;
    // bed
    s += `<rect x="-40" y="1180" width="330" height="200" rx="18" fill="#7C6BC4" stroke="${INK}" stroke-width="8"/>`;
    s += `<path d="M -40 1200 Q 120 1150 290 1210 L 290 1300 Q 140 1330 -40 1290 Z" fill="#9B8BE0" stroke="${INK}" stroke-width="7"/>`;
    s += `<rect x="-40" y="1360" width="330" height="40" fill="#4E3F8F" stroke="${INK}" stroke-width="7"/>`;
    s += `<ellipse cx="40" cy="1190" rx="70" ry="34" fill="#F1F1F1" stroke="${INK}" stroke-width="6"/>`;
    // desk + monitor
    s += `<rect x="770" y="1150" width="360" height="26" fill="#8A6A4F" stroke="${INK}" stroke-width="7"/>`;
    s += `<rect x="800" y="1176" width="20" height="220" fill="#8A6A4F" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="800" y="950" width="300" height="190" rx="10" fill="${INK}"/>`;
    s += `<rect x="814" y="962" width="272" height="160" rx="6" fill="#62C4F0"/>`;
    s += `<path d="M 814 1122 L 880 1050 L 930 1100 L 980 1040 L 1086 1122 Z" fill="#3E9B5A"/>`;
    s += `<rect x="930" y="1140" width="40" height="12" fill="${INK}"/>`;
    // clutter
    s += `<g transform="rotate(-8 170 1500)"><rect x="70" y="1470" width="220" height="40" fill="#D9B27C" stroke="${INK}" stroke-width="6"/><circle cx="180" cy="1488" r="10" fill="#C0392B"/></g>`;
    for (const [x, y, c, r] of [[880, 1460, '#C0392B', 0], [940, 1480, '#2E86C1', 0], [330, 1560, '#27AE60', 70]])
      s += `<rect x="${x}" y="${y}" width="34" height="56" rx="6" fill="${c}" stroke="${INK}" stroke-width="5" transform="rotate(${r} ${x + 17} ${y + 28})"/>`;
    s += `<path d="M 700 1600 q 30 -20 60 0 q 10 30 -20 40 q -40 0 -40 -40 Z" fill="#EEE" stroke="${INK}" stroke-width="5"/>`;
    s += `<circle cx="990" cy="1580" r="22" fill="#F4F4F2" stroke="${INK}" stroke-width="5"/>`;
    s += `<path d="M 480 1700 q 40 -30 90 -10 q 30 20 70 0" fill="none" stroke="#E8E8E8" stroke-width="16" stroke-linecap="round"/>`;
    return s;
  };

  L.stink = function (t, cx, cy, spread = 190, h = 320) {
    let s = '';
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.55 + i / 6) % 1;
      const x = cx + (i % 2 ? 1 : -1) * (spread + (i * 37) % 60), y = cy - ph * h;
      const o = Math.sin(ph * Math.PI) * 0.8;
      s += `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} q -16 -24 0 -48 q 16 -24 0 -48" fill="none" stroke="#9BD15A" stroke-width="9" stroke-linecap="round" opacity="${o.toFixed(2)}"/>`;
    }
    return s;
  };

  L.fly = function (x, y, t, i = 0) {
    const w = Math.abs(Math.sin(t * 60 + i)) * 10 + 4;
    return `<ellipse cx="${(x - 6).toFixed(1)}" cy="${(y - 8).toFixed(1)}" rx="9" ry="${w.toFixed(1)}" fill="#E8F4FF" opacity="0.85"/>` +
      `<ellipse cx="${(x + 6).toFixed(1)}" cy="${(y - 8).toFixed(1)}" rx="9" ry="${w.toFixed(1)}" fill="#E8F4FF" opacity="0.85"/>` +
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="8" fill="${INK}"/>`;
  };
  L.flies = function (t, cx, cy, n = 3) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = t * (2 + i * 0.7) + i * 2.1;
      s += L.fly(cx + Math.cos(a) * (170 + i * 30), cy + Math.sin(a * 1.3) * 90 - i * 40, t, i);
    }
    return s;
  };

  L.sparkle = function (x, y, r, rot = 0, col = '#FFFFFF') {
    return `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${r / 40})" d="M 0 -40 Q 6 -6 40 0 Q 6 6 0 40 Q -6 6 -40 0 Q -6 -6 0 -40 Z" fill="${col}" stroke="${INK}" stroke-width="5"/>`;
  };

  L.sunburst = function (t, c1, c2) {
    let s = `<rect x="-200" y="-200" width="1480" height="2320" fill="${c1}"/>`;
    const n = 18, rot = t * 12;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 360 + rot, a1 = a0 + 360 / n / 2;
      const p = (a) => `${(540 + Math.cos(a * Math.PI / 180) * 2400).toFixed(0)} ${(960 + Math.sin(a * Math.PI / 180) * 2400).toFixed(0)}`;
      s += `<path d="M 540 960 L ${p(a0)} L ${p(a1)} Z" fill="${c2}"/>`;
    }
    return s;
  };

  L.hud = function (days, glow) {
    let s = '';
    s += `<rect x="24" y="120" width="230" height="180" rx="22" fill="#141B2D" stroke="#0B0F1A" stroke-width="6"/>`;
    s += `<text x="139" y="178" text-anchor="middle" font-family="Anton" font-size="38" fill="#C9D1E3">DAYS LEFT</text>`;
    s += `<text x="139" y="276" text-anchor="middle" font-family="Anton" font-size="100" fill="#FFD23F">${days}</text>`;
    s += `<rect x="274" y="120" width="782" height="180" rx="22" fill="#141B2D" stroke="#0B0F1A" stroke-width="6"/>`;
    s += `<text x="306" y="178" font-family="Anton" font-size="38" fill="#C9D1E3">GLOW-UP</text>`;
    s += `<text x="1026" y="182" text-anchor="end" font-family="Anton" font-size="54" fill="#5BE37D">${Math.round(glow)}%</text>`;
    s += `<rect x="306" y="216" width="718" height="44" rx="22" fill="#2A3350"/>`;
    s += `<rect x="306" y="216" width="${Math.max(44, 718 * glow / 100).toFixed(1)}" height="44" rx="22" fill="#5BE37D"/>`;
    return s;
  };

  L.banner = function (t, text, t0, y = 420, size = 70) {
    const k = L.pop(t, t0, 0.25);
    if (!k) return '';
    return `<g transform="translate(540 ${y}) scale(${k.toFixed(3)})">` +
      `<rect x="-470" y="-62" width="940" height="124" rx="26" fill="#141B2D" stroke="#FFD23F" stroke-width="8"/>` +
      `<text x="0" y="${size * 0.42}" text-anchor="middle" font-family="Anton" font-size="${size}" fill="#FFFFFF">${text}</text></g>`;
  };

  L.caption = function (t, words, t0, y = 1420, size = 128, color = '#FFFFFF') {
    const k = L.pop(t, t0, 0.14);
    if (!k) return '';
    return `<g transform="translate(540 ${y}) scale(${k.toFixed(3)})">` +
      `<text x="0" y="0" text-anchor="middle" font-family="Anton" font-size="${size}" fill="${color}" stroke="#000" stroke-width="22" stroke-linejoin="round" paint-order="stroke">${words}</text></g>`;
  };

  L.chip = function (t, t0, x, y, w, emoji, word, highlight) {
    const k = L.pop(t, t0, 0.2);
    if (!k) return '';
    const hl = highlight ? 1 + Math.sin(t * 8) * 0.04 : 1;
    return `<g transform="translate(${x} ${y}) scale(${(k * hl).toFixed(3)}) rotate(${highlight ? Math.sin(t * 6) * 2 : 0})">` +
      `<rect x="${-w / 2}" y="-95" width="${w}" height="190" rx="34" fill="#141B2D" stroke="#FFD23F" stroke-width="8"/>` +
      `<text x="${-w / 2 + 46}" y="34" font-size="92">${emoji}</text>` +
      `<text x="${-w / 2 + 160}" y="38" font-family="Anton" font-size="92" fill="#FFFFFF">${word}</text></g>`;
  };

  window.L = L;
})();
