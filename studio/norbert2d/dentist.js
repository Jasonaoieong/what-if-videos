// Dr. Molar (dentist) and the dental office, in the same flat style as Norbert.
(function () {
  const C = window.Norbert.C;
  const OUT = 6;
  const f = (n) => Math.round(n * 10) / 10;
  const tube = (d, w, col) =>
    `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="${w + OUT * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shape = (d, fill, sw = OUT) => `<path d="${d}" fill="${fill}" stroke="${C.line}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const circ = (x, y, r, fill, sw = OUT) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${C.line}" stroke-width="${sw}"/>`;
  const line = (d, w = OUT, col = C.line) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

  // p: {x, y, scale, t, talk, armR (0 down .. 3 up), tool: 'drill'|'light'|'mirror'|null, expr: 'calm'|'shock'|'tired'}
  function svg(p) {
    const t = p.t || 0, talk = p.talk || 0, bob = Math.sin(t * 1.8) * 4;
    const skin = '#E9B48C', coat = '#F7FAFC', scrub = '#4FA3C7', glove = '#8FD3FF';
    let s = `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${p.scale || 1})">`;
    s += `<ellipse cx="0" cy="282" rx="200" ry="26" fill="rgba(0,0,0,0.22)"/>`;
    // legs + shoes
    s += tube('M -55 40 L -58 240', 34, scrub) + tube('M 55 40 L 58 240', 34, scrub);
    s += shape('M -125 262 Q -125 228 -80 228 L -30 228 Q -20 250 -30 264 Q -80 280 -125 262 Z', '#2A2A33');
    s += shape('M 125 262 Q 125 228 80 228 L 30 228 Q 20 250 30 264 Q 80 280 125 262 Z', '#2A2A33');
    s += `<g transform="translate(0 ${f(bob)})">`;
    // arms
    const a = p.armR != null ? p.armR : 0.2;
    const sx = 120, sy = -300, L = 230;
    const hx = sx + Math.sin(a) * L, hy = sy + Math.cos(a) * L;
    s += tube(`M -120 -300 Q -170 -170 -140 -70`, 34, coat) + circ(-140, -62, 30, glove);
    s += tube(`M ${sx} ${sy} Q ${f((sx + hx) / 2 + 50)} ${f((sy + hy) / 2)} ${f(hx)} ${f(hy)}`, 34, coat) + circ(hx, hy, 30, glove);
    // coat
    s += shape('M -130 -330 Q 0 -360 130 -330 L 150 60 L -150 60 Z', coat);
    s += shape('M -40 -340 L 0 -200 L 40 -340 Z', scrub, 5);
    s += line('M 0 -200 L 0 60', 5) + circ(-12, -120, 7, '#DDE3EA', 3) + circ(-12, -40, 7, '#DDE3EA', 3);
    s += shape('M 60 -250 L 110 -250 L 110 -190 L 60 -190 Z', '#E7EEF5', 4);           // pocket
    s += `<rect x="70" y="-270" width="8" height="40" fill="#E25B4A"/><rect x="88" y="-266" width="8" height="36" fill="#2E86C1"/>`;
    // head
    s += shape('M -24 -376 L 24 -376 L 26 -330 L -26 -330 Z', skin);
    s += circ(0, -500, 140, skin);
    s += circ(-142, -500, 26, skin) + circ(142, -500, 26, skin);
    // bald top with grey side hair
    s += shape('M -146 -520 Q -150 -600 -100 -610 Q -120 -560 -118 -500 Z', '#C9CED6');
    s += shape('M 146 -520 Q 150 -600 100 -610 Q 120 -560 118 -500 Z', '#C9CED6');
    s += line('M -40 -630 Q 0 -646 40 -630', 8, 'rgba(255,255,255,0.5)');
    // head mirror
    s += line('M -130 -560 Q 0 -620 130 -560', 10, '#555E6E');
    s += circ(70, -598, 40, '#DDE7F2') + circ(70, -598, 14, '#9AA7B8', 3);
    // glasses + eyes
    const shock = p.expr === 'shock', tired = p.expr === 'tired';
    for (const x of [-55, 55]) {
      s += circ(x, -510, 44, 'rgba(255,255,255,0.35)', 7);
      if (tired) s += line(`M ${x - 18} -506 Q ${x} -498 ${x + 18} -506`, 7);
      else s += circ(x, -510, shock ? 16 : 11, C.line, 0);
    }
    s += line('M -11 -512 L 11 -512', 6);
    if (tired) for (const x of [-55, 55]) s += line(`M ${x - 22} -478 Q ${x} -470 ${x + 22} -478`, 4, '#9C6B5A');
    // brows
    const bl = shock ? -18 : tired ? 6 : 0;
    s += line(`M -86 ${-566 + bl} L -26 ${-572 + bl}`, 10, '#C9CED6') + line(`M 26 ${-572 + bl} L 86 ${-566 + bl}`, 10, '#C9CED6');
    // nose
    s += shape('M -10 -470 Q 0 -440 22 -436 Q 10 -420 -14 -430 Z', '#D99B74', 4);
    // mouth (moves when talking) under a big moustache
    const open = Math.max(talk, shock ? 0.8 : 0);
    if (open > 0.1) s += `<ellipse cx="0" cy="${f(-398 + open * 8)}" rx="${f(26 + open * 6)}" ry="${f(8 + open * 22)}" fill="${C.mouth}" stroke="${C.line}" stroke-width="5"/>`;
    else s += line('M -26 -398 Q 0 -390 26 -398', 6);
    s += shape(`M -70 ${-418 - open * 4} Q -40 -440 0 -428 Q 40 -440 70 ${-418 - open * 4} Q 40 -404 0 -414 Q -40 -404 -70 ${-418 - open * 4} Z`, '#B9BFC9');
    // tool in right hand
    if (p.tool === 'clippers') {
      s += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(-30)">` + shape('M -14 -16 L 70 -16 L 70 16 L -14 16 Z', '#2A2A33') +
        shape('M 70 -18 L 92 -18 L 92 18 L 70 18 Z', '#C9D3DF', 3) + `</g>`;
    } else if (p.tool === 'drill') {
      s += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(-35)">` + shape('M -14 -10 L 90 -10 L 90 10 L -14 10 Z', '#C9D3DF') +
        shape('M 90 -4 L 130 -2 L 130 2 L 90 4 Z', '#7F8A99', 3) + `</g>`;
    } else if (p.tool === 'light') {
      s += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(-40)">` + shape('M -10 -12 L 70 -12 L 70 12 L -10 12 Z', '#2A2A33') +
        `<path d="M 70 -12 L 260 -70 L 260 70 L 70 12 Z" fill="rgba(255,250,200,0.35)"/></g>`;
    } else if (p.tool === 'mirror') {
      s += `<g transform="translate(${f(hx)} ${f(hy)}) rotate(-30)">` + shape('M 0 -4 L 80 -4 L 80 4 L 0 4 Z', '#9AA7B8', 3) +
        circ(96, 0, 18, '#DDE7F2', 4) + `</g>`;
    }
    s += `</g></g>`;
    return s;
  }

  function office(t) {
    const INK = '#1A1410';
    let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#BFE3E0"/>`;
    for (let y = -600; y < 1400; y += 110) s += `<rect x="-600" y="${y}" width="2280" height="3" fill="#A9D2CE"/>`;
    // window with clouds
    s += `<rect x="640" y="470" width="320" height="280" rx="12" fill="#8ED1FF" stroke="${INK}" stroke-width="10"/>`;
    s += `<ellipse cx="${(720 + (t * 20) % 200).toFixed(0)}" cy="560" rx="60" ry="24" fill="#fff"/>`;
    s += `<line x1="800" y1="470" x2="800" y2="750" stroke="${INK}" stroke-width="8"/>`;
    // tooth poster
    s += `<g transform="rotate(-3 220 600)"><rect x="110" y="470" width="220" height="280" fill="#FFFFFF" stroke="${INK}" stroke-width="8"/>` +
      `<path d="M 170 540 Q 220 510 270 540 Q 290 600 265 660 Q 250 700 240 640 Q 220 610 200 640 Q 190 700 175 660 Q 150 600 170 540 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/>` +
      `<circle cx="200" cy="580" r="7" fill="${INK}"/><circle cx="240" cy="580" r="7" fill="${INK}"/><path d="M 205 605 Q 220 618 235 605" fill="none" stroke="${INK}" stroke-width="5"/>` +
      `<text x="220" y="730" text-anchor="middle" font-family="Anton" font-size="44" fill="#2E86C1">FLOSS!</text></g>`;
    // cabinet
    s += `<rect x="820" y="1000" width="300" height="400" fill="#F2F5F7" stroke="${INK}" stroke-width="8"/>`;
    s += `<rect x="845" y="1030" width="250" height="150" fill="#E4EAEE" stroke="${INK}" stroke-width="5"/><rect x="845" y="1210" width="250" height="160" fill="#E4EAEE" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="900" y="960" width="40" height="40" rx="6" fill="#7FB3D5" stroke="${INK}" stroke-width="5"/><rect x="960" y="940" width="30" height="60" rx="6" fill="#E25B4A" stroke="${INK}" stroke-width="5"/>`;
    // floor
    s += `<rect x="-600" y="1400" width="2280" height="900" fill="#E8EDF0"/>`;
    for (let x = -600; x < 1680; x += 120) s += `<rect x="${x}" y="1400" width="4" height="900" fill="#D3DBE0"/>`;
    s += `<rect x="-600" y="1392" width="2280" height="14" fill="#9DB3BC"/>`;
    // overhead lamp arm
    s += line('M 1000 300 Q 800 260 700 380', 14, '#9AA7B8');
    s += shape('M 640 380 L 760 380 L 740 430 L 660 430 Z', '#DDE3EA') + `<ellipse cx="700" cy="432" rx="40" ry="10" fill="#FFF6B0"/>`;
    return s;
  }

  // Dental chair drawn in two layers so Norbert sits "in" it.
  function chairBack() {
    const INK = '#1A1410';
    return `<path d="M 320 1260 Q 300 820 470 700 L 640 700 Q 700 760 690 1260 Z" fill="#3E7CC0" stroke="${INK}" stroke-width="8"/>`;
  }
  function chairFront() {
    const INK = '#1A1410';
    return `<path d="M 300 1250 L 780 1250 Q 800 1320 760 1340 L 320 1340 Q 280 1320 300 1250 Z" fill="#4A8FD6" stroke="${INK}" stroke-width="8"/>` +
      `<rect x="510" y="1340" width="60" height="70" fill="#9AA7B8" stroke="${INK}" stroke-width="6"/>` +
      `<ellipse cx="540" cy="1420" rx="160" ry="20" fill="#7F8A99" stroke="${INK}" stroke-width="6"/>`;
  }

  window.Dentist = { svg, office, chairBack, chairFront };
})();
