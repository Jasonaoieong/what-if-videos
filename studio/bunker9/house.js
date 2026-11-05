// House sets for one-shot stories: living room, hallway, nursery, the baby monitor, and the tall figure.
(function () {
  const INK = '#0B0B0D';
  const f = (n) => Math.round(n * 10) / 10;
  const shape = (d, fill, sw = 5) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const line = (d, w = 5, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const H = {};

  function wallpaper(x0, x1, base, stripe) {
    let s = `<rect x="${x0}" y="-400" width="${x1 - x0}" height="1900" fill="${base}"/>`;
    for (let x = x0; x < x1; x += 90) s += `<rect x="${x}" y="-400" width="34" height="1900" fill="${stripe}"/>`;
    s += `<rect x="${x0}" y="1380" width="${x1 - x0}" height="120" fill="#3A2E2A" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="${x0}" y="1500" width="${x1 - x0}" height="800" fill="#4A3A30"/>`;
    for (let x = x0; x < x1; x += 140) s += `<path d="M ${x} 1500 L ${x - 160} 2100" stroke="#3E3028" stroke-width="4"/>`;
    return s;
  }

  H.living = function (t) {
    let s = wallpaper(-400, 1600, '#3B4A5A', '#364454');
    // window with moon
    s += `<rect x="120" y="520" width="280" height="360" fill="#0E1626" stroke="${INK}" stroke-width="10"/><circle cx="320" cy="600" r="34" fill="#E8E2C4"/>` +
      line('M 260 520 L 260 880 M 120 700 L 400 700', 8);
    // TV with flicker glow
    const tv = 0.6 + 0.4 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.1));
    s += `<rect x="760" y="1060" width="320" height="200" rx="10" fill="#111" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="776" y="1074" width="288" height="172" fill="rgb(${Math.round(90 * tv)},${Math.round(140 * tv)},${Math.round(220 * tv)})"/>`;
    s += `<rect x="740" y="1260" width="360" height="240" fill="#5A4030" stroke="${INK}" stroke-width="6"/>`;
    // couch
    s += shape('M -120 1220 Q -120 1150 -40 1150 L 520 1150 Q 600 1150 600 1220 L 600 1500 L -120 1500 Z', '#8A3E3A');
    s += shape('M -120 1320 L 600 1320 L 600 1500 L -120 1500 Z', '#9B4A44');
    s += shape('M 40 1260 Q 120 1230 200 1260 L 200 1320 L 40 1320 Z', '#C9B994', 4);
    // lamp
    s += line('M 660 1500 L 660 1180', 8, '#2B2620') + shape('M 610 1180 L 710 1180 L 690 1110 L 630 1110 Z', '#E2C47A');
    // picture frames
    s += `<rect x="470" y="600" width="150" height="110" fill="#C9B994" stroke="${INK}" stroke-width="6"/><circle cx="520" cy="645" r="16" fill="#6B5A4A"/><circle cx="572" cy="650" r="13" fill="#6B5A4A"/>`;
    return s;
  };

  H.hall = function (t) {
    let s = wallpaper(-600, 2400, '#4A3B4F', '#423447');
    for (const dx of [-300, 500, 1300, 2100]) {
      s += `<rect x="${dx}" y="760" width="300" height="740" fill="#5A4636" stroke="${INK}" stroke-width="8"/><circle cx="${dx + 250}" cy="1150" r="12" fill="#C9A227" stroke="${INK}" stroke-width="3"/>`;
    }
    s += `<rect x="2100" y="1490" width="300" height="10" fill="#FFE7A8" opacity="${(0.6 + 0.4 * Math.sin(t * 5)).toFixed(2)}"/>`;
    for (const px of [150, 950, 1750]) s += `<rect x="${px}" y="640" width="130" height="160" fill="#C9B994" stroke="${INK}" stroke-width="6" transform="rotate(${(px % 7) - 3} ${px + 65} 720)"/>`;
    return s;
  };

  H.nursery = function (t, o = {}) {
    let s = wallpaper(-400, 1600, '#5A6B7A', '#53636F');
    // window + moonlight
    s += `<rect x="640" y="460" width="300" height="380" fill="#0E1626" stroke="${INK}" stroke-width="10"/>` + line('M 790 460 L 790 840 M 640 650 L 940 650', 8) + `<circle cx="860" cy="540" r="30" fill="#E8E2C4"/>`;
    // stars on the wall
    for (const [x, y] of [[120, 520], [260, 440], [420, 560], [180, 700], [520, 420]]) s += `<path transform="translate(${x} ${y})" d="M 0 -18 L 5 -5 L 18 -5 L 8 4 L 12 18 L 0 9 L -12 18 L -8 4 L -18 -5 L -5 -5 Z" fill="#E8D88A" opacity="0.8"/>`;
    // rocking chair
    const rk = Math.sin(t * 1.4) * (o.rock || 0) * 6;
    s += `<g transform="rotate(${rk.toFixed(1)} 1180 1500)">` + shape('M 1060 1080 L 1080 1400 L 1300 1400 L 1320 1080 Z', '#6B4A33') + line('M 1020 1500 Q 1190 1440 1360 1500', 10, '#5A3E2B') + `</g>`;
    // crib
    const cx = 300, cy = 1500;
    s += shape(`M ${cx - 260} ${cy - 420} L ${cx + 260} ${cy - 420} L ${cx + 260} ${cy - 120} L ${cx - 260} ${cy - 120} Z`, 'none', 0);
    s += `<rect x="${cx - 260}" y="${cy - 170}" width="520" height="50" fill="#EDE6D8" stroke="${INK}" stroke-width="6"/>`;
    for (let x = cx - 250; x <= cx + 250; x += 50) s += `<rect x="${x}" y="${cy - 420}" width="14" height="260" fill="#EDE6D8" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="${cx - 270}" y="${cy - 440}" width="540" height="26" rx="8" fill="#EDE6D8" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="${cx - 260}" y="${cy - 120}" width="20" height="120" fill="#EDE6D8" stroke="${INK}" stroke-width="5"/><rect x="${cx + 240}" y="${cy - 120}" width="20" height="120" fill="#EDE6D8" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="${cx - 240}" y="${cy - 210}" width="480" height="40" rx="14" fill="#A9C7E0" stroke="${INK}" stroke-width="4"/>`;
    // mobile
    const ma = t * 0.9;
    s += line(`M ${cx} ${cy - 720} L ${cx} ${cy - 620}`, 4);
    for (let i = 0; i < 4; i++) {
      const a = ma + (i * Math.PI) / 2, mx = cx + Math.cos(a) * 90, my = cy - 600 + Math.sin(a) * 14;
      s += line(`M ${cx} ${cy - 620} L ${f(mx)} ${f(my)} L ${f(mx)} ${f(my + 40)}`, 3) + `<circle cx="${f(mx)}" cy="${f(my + 56)}" r="16" fill="${['#E8D88A', '#A9C7E0', '#E8A9B9', '#B9E0A9'][i]}" stroke="${INK}" stroke-width="3"/>`;
    }
    // night light
    s += `<circle cx="560" cy="1420" r="20" fill="#FFE7A8" stroke="${INK}" stroke-width="4"/>`;
    return s;
  };

  // The tall figure: an impossibly thin stick shape with long arms and two white eyes.
  H.tall = function (t, x, y, sc = 1, eyes = 1) {
    const sw = Math.sin(t * 1.3) * 3;
    let s = `<g transform="translate(${x} ${y}) scale(${sc})">`;
    s += `<path d="M 0 0 L -14 -520 M 0 0 L 14 -520" stroke="#050506" stroke-width="20" stroke-linecap="round"/>`;
    s += `<path d="M 0 -520 L 0 -1100" stroke="#050506" stroke-width="34" stroke-linecap="round"/>`;
    s += `<path d="M 0 -1040 Q -90 ${f(-760 + sw * 4)} -70 -420 M 0 -1040 Q 90 ${f(-760 - sw * 4)} 70 -420" stroke="#050506" stroke-width="16" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="0" cy="-1180" rx="70" ry="96" fill="#050506"/>`;
    if (eyes) s += `<circle cx="-24" cy="-1190" r="${7 * eyes}" fill="#F4F1EA"/><circle cx="24" cy="-1190" r="${7 * eyes}" fill="#F4F1EA"/>`;
    return s + `</g>`;
  };

  // A big handheld baby monitor filling the frame. feed(): SVG of what the camera sees (drawn in 1080x1920 space).
  H.monitor = function (t, feedSvg, o = {}) {
    let s = `<rect width="1080" height="1920" fill="#0A0B0D"/>`;
    s += `<rect x="110" y="300" width="860" height="1320" rx="70" fill="#E9E6DF" stroke="#000" stroke-width="10"/>`;
    s += `<defs><clipPath id="feedclip"><rect x="170" y="370" width="740" height="900" rx="20"/></clipPath><filter id="mono"><feColorMatrix type="matrix" values="0.25 0.45 0.1 0 0  0.35 0.6 0.15 0 0.04  0.2 0.35 0.1 0 0  0 0 0 1 0"/></filter></defs>`;
    s += `<g clip-path="url(#feedclip)"><rect x="170" y="370" width="740" height="900" fill="#111"/><g filter="url(#mono)">` +
      `<g transform="translate(170 370) scale(0.6852)">${feedSvg}</g></g>`;
    for (let i = 0; i < 26; i++) s += `<rect x="170" y="${(370 + ((i * 37 + t * 400) % 900)).toFixed(0)}" width="740" height="3" fill="#fff" opacity="0.06"/>`;
    if (o.static) s += `<rect x="170" y="370" width="740" height="900" filter="url(#grain)" opacity="${o.static}"/>`;
    s += `</g><rect x="170" y="370" width="740" height="900" rx="20" fill="none" stroke="#000" stroke-width="8"/>`;
    s += `<text x="200" y="420" font-family="SpecialElite" font-size="34" fill="#E6FFE6">CAM 1 · NURSERY</text>`;
    s += `<circle cx="860" cy="408" r="10" fill="${(t * 2) % 1 < 0.5 ? '#FF3B30' : '#4A1512'}"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${380 + i * 70}" y="1340" width="50" height="${f(20 + 80 * Math.abs(Math.sin(t * 9 + i)) * (o.sound || 0))}" fill="#6FAE8E"/>`;
    s += `<circle cx="540" cy="1520" r="44" fill="#3A3E45" stroke="#000" stroke-width="6"/>`;
    return s;
  };

  window.House = H;
})();
