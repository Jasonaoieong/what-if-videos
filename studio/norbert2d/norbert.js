// Norbert: flat 2D vector cartoon character, fully posable.
// Norbert.svg(pose) returns an SVG <g> string. Local origin = waist; feet at y≈+280, hair tip at y≈-745.
(function () {
  const C = {
    line: '#2A1E1A', skin: '#F4B183', skinSh: '#E39A6C', nose: '#EFA474',
    hair: '#3B2A20', hairHi: 'rgba(255,255,255,0.38)',
    shirt: '#E8B33A', shirtSh: '#CC9527', stain: '#8A5A2B',
    shorts: '#4CAF6A', shortsSh: '#3A8F55',
    shoe: '#F4F4F2', sole: '#B9B4AE', sock: '#FFFFFF', lace: '#E25B4A',
    pimple: '#E5483B', white: '#FFFFFF', mouth: '#5A1E1E', tongue: '#E0706A', tooth: '#FFF6DA',
    stubble: 'rgba(60,40,30,0.45)', sweat: '#8FD3FF',
  };
  const OUT = 6;
  const f = (n) => Math.round(n * 10) / 10;

  const tube = (d, w, col) =>
    `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="${w + OUT * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shape = (d, fill, sw = OUT) =>
    `<path d="${d}" fill="${fill}" stroke="${C.line}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const circ = (x, y, r, fill, sw = OUT) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${C.line}" stroke-width="${sw}"/>`;
  const line = (d, w = OUT, col = C.line) =>
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Expressions: eye openness L/R, pupil radius, brow lift L/R and tilt, mouth type, extras.
  const EXPR = {
    neutral: { eye: [1, 1], pupil: 13, brow: [0, 0], tilt: [0, 0], mouth: 'flat' },
    awkward: { eye: [1, 0.85], pupil: 12, brow: [-10, 6], tilt: [-8, 10], mouth: 'wavy' },
    happy:   { eye: ['arc', 'arc'], pupil: 13, brow: [-12, -10], tilt: [0, 0], mouth: 'smile' },
    panic:   { eye: [1.35, 1.3], pupil: 8, brow: [-26, -22], tilt: [14, -14], mouth: 'open', open: 1, sweat: true },
    shocked: { eye: [1.5, 1.45], pupil: 6, brow: [-34, -30], tilt: [0, 0], mouth: 'open', open: 1.3 },
    sad:     { eye: [0.75, 0.7], pupil: 13, brow: [-6, -6], tilt: [16, -16], mouth: 'frown', tear: true },
    smug:    { eye: [0.55, 0.6], pupil: 13, brow: [4, -14], tilt: [-6, 12], mouth: 'smirk' },
  };

  const HC = { x: 0, y: -490 }; // head centre
  const HR = 150;

  function eye(x, y, r, open, pupR, look, blink) {
    if (open === 'arc') {
      return line(`M ${x - r} ${y + 6} Q ${x} ${y - r * 0.9} ${x + r} ${y + 6}`, 9);
    }
    const o = Math.max(0.05, open * (1 - blink));
    if (o < 0.15) return line(`M ${x - r} ${y} Q ${x} ${y + 8} ${x + r} ${y}`, 8);
    const ry = r * o;
    const px = x + look.x * r * 0.4, py = y + look.y * ry * 0.35;
    return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(ry)}" fill="${C.white}" stroke="${C.line}" stroke-width="${OUT}"/>` +
      `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${pupR}" ry="${f(Math.min(pupR, ry * 0.8))}" fill="${C.line}"/>` +
      `<circle cx="${f(px - pupR * 0.35)}" cy="${f(py - pupR * 0.35)}" r="${f(pupR * 0.32)}" fill="#fff"/>`;
  }

  function face(p, e) {
    let s = '';
    const blink = p.blink || 0, look = p.look || { x: 0, y: 0 };
    // Ears (behind head drawn by caller)
    // Stubble
    for (const [x, y] of [[-40, -372], [-20, -362], [0, -358], [22, -362], [44, -372], [-58, -388], [60, -386],
                          [-30, -380], [10, -372], [34, -382], [-8, -384]]) {
      s += `<circle cx="${x}" cy="${y}" r="3.2" fill="${C.stubble}"/>`;
    }
    // Eyes: uneven sizes and heights
    s += eye(-55, -488, 36, e.eye[0], e.pupil + 1, look, blink);
    s += eye(52, -478, 29, e.eye[1], e.pupil - 1, look, blink);
    // Brows: left thick and high, right thin and low
    const [bl, br] = e.brow, [tl, tr] = e.tilt;
    s += shape(`M -98 ${-545 + bl - tl} L -22 ${-540 + bl + tl} L -24 ${-526 + bl + tl} L -96 ${-530 + bl - tl} Z`, C.hair, 4);
    s += line(`M 24 ${-522 + br + tr} L 84 ${-530 + br - tr}`, 7, C.hair);
    // Crooked nose
    s += `<g transform="rotate(16 22 -452)">` +
      shape('M 10 -478 C 34 -482 48 -458 40 -440 C 31 -424 8 -428 3 -441 C -2 -455 -3 -473 10 -478 Z', C.nose) +
      `</g>`;
    // Mouth
    const my = -404, open = (e.open || 0) * (p.talk != null ? Math.max(0.35, p.talk) : 1);
    if (e.mouth === 'open' || (p.talk && p.talk > 0.15)) {
      const o = e.mouth === 'open' ? open : p.talk;
      const ry = 12 + 30 * o;
      s += `<ellipse cx="0" cy="${f(my + ry * 0.6)}" rx="${f(38 + 6 * o)}" ry="${f(ry)}" fill="${C.mouth}" stroke="${C.line}" stroke-width="${OUT}"/>`;
      s += `<ellipse cx="4" cy="${f(my + ry * 1.15)}" rx="22" ry="${f(Math.max(4, ry * 0.35))}" fill="${C.tongue}"/>`;
    } else if (e.mouth === 'smile') s += line(`M -48 ${my - 4} Q 0 ${my + 34} 48 ${my - 8}`, 7);
    else if (e.mouth === 'frown') s += line(`M -42 ${my + 16} Q 0 ${my - 8} 42 ${my + 16}`, 7);
    else if (e.mouth === 'wavy') s += line(`M -46 ${my + 4} Q -24 ${my - 8} -2 ${my + 4} T 44 ${my + 2}`, 7);
    else if (e.mouth === 'smirk') s += line(`M -40 ${my + 6} Q 6 ${my + 10} 46 ${my - 10}`, 7);
    else s += line(`M -44 ${my + 2} Q 0 ${my + 10} 44 ${my}`, 7);
    // Buck teeth: two huge uneven teeth over the lip, right one chipped
    s += shape(`M -28 ${my} L -3 ${my + 1} L -4 ${my + 44} Q -16 ${my + 49} -27 ${my + 42} Z`, C.tooth, 5);
    s += shape(`M 3 ${my + 1} L 26 ${my - 1} L 25 ${my + 26} L 18 ${my + 32} L 4 ${my + 34} Z`, C.tooth, 5);
    // Pimples (red with a shine)
    for (const [x, y, r] of [[-104, -440, 10], [-120, -462, 7], [-86, -420, 8], [-112, -414, 6], [-70, -448, 5],
                             [98, -438, 10], [118, -418, 7], [84, -410, 6], [110, -455, 5],
                             [-4, -548, 9], [62, -552, 6], [-60, -560, 5],
                             [-14, -350, 8], [30, -356, 6], [38, -436, 12]]) {
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.pimple}" stroke="${C.line}" stroke-width="2.5"/>` +
        `<circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.33)}" fill="#fff" opacity="0.9"/>`;
    }
    if (e.sweat) s += shape('M 128 -560 Q 140 -530 132 -518 Q 120 -512 116 -526 Q 116 -540 128 -560 Z', C.sweat, 4);
    if (e.tear) s += shape('M -64 -462 Q -56 -432 -62 -420 Q -72 -414 -76 -428 Q -74 -444 -64 -462 Z', C.sweat, 4);
    return s;
  }

  function hair(t) {
    let s = '';
    // Greasy cap with a jagged fringe
    s += shape('M -160 -462 A 162 162 0 1 1 160 -470 L 140 -560 L 118 -546 L 100 -592 L 66 -550 L 38 -600 L 8 -552 ' +
      'L -24 -603 L -56 -548 L -88 -594 L -114 -550 L -140 -578 Z', C.hair);
    // Grease shine
    s += line('M -84 -612 Q -40 -640 4 -628', 9, C.hairHi) + line('M 40 -630 Q 70 -630 92 -610', 7, C.hairHi);
    // Question-mark cowlick (springs slightly)
    const w = Math.sin(t * 6) * 4;
    s += tube(`M 8 -640 C -2 -700 22 -${742 + w} 62 -${746 + w} C 106 -${748 + w} 120 -${700 + w} 96 -${675 + w} C 82 -${662 + w} 64 -${668 + w} 62 -${682 + w}`, 18, C.hair);
    // Strays
    s += tube('M -60 -642 Q -84 -690 -112 -686', 8, C.hair) + tube('M 70 -640 Q 96 -676 122 -664', 8, C.hair);
    return s;
  }

  function arm(side, a, bend) {
    const sx = side * 116, sy = -306, L = 236;
    const hx = sx + side * Math.sin(a) * L, hy = sy + Math.cos(a) * L;
    const mx = (sx + hx) / 2, my = (sy + hy) / 2;
    let dx = hx - sx, dy = hy - sy;
    const n = Math.hypot(dx, dy);
    const cx = mx + (-dy / n) * bend * side * 60, cy = my + (dx / n) * bend * side * 60;
    const arm = tube(`M ${f(sx)} ${f(sy)} Q ${f(cx)} ${f(cy)} ${f(hx)} ${f(hy)}`, 24, C.skin) + circ(hx, hy, 27, C.skin);
    // Droopy sleeve over the shoulder
    const ang = Math.atan2(Math.cos(a), side * Math.sin(a)) * 180 / Math.PI - 90;
    const ex = sx + side * Math.sin(a) * 22, ey = sy + Math.cos(a) * 22;
    const sleeve = `<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="34" ry="46" transform="rotate(${f(ang)} ${f(ex)} ${f(ey)})" fill="${C.shirt}" stroke="${C.line}" stroke-width="${OUT}"/>`;
    return { arm, sleeve, hand: { x: hx, y: hy } };
  }

  function legs(t) {
    let s = '';
    s += tube('M -50 60 L -52 238', 22, C.skin) + tube('M 50 60 L 52 238', 22, C.skin);
    s += tube('M -52 150 L -52 236', 32, C.sock);                       // tall sock
    s += shape('M 30 214 Q 52 200 74 214 Q 80 226 74 236 Q 52 246 30 236 Q 24 226 30 214 Z', C.sock, 5); // bunched sock
    s += line('M 34 224 Q 52 216 70 224', 3.5) + line('M 34 232 Q 52 226 70 232', 3.5);
    // Shoes: chunky, one lace untied
    for (const sd of [-1, 1]) {
      const x = sd * 62;
      s += shape(`M ${x - 64} 262 Q ${x - 66} 230 ${x - 30} 228 L ${x + 30} 228 Q ${x + 68} 232 ${x + 66} 262 Q ${x} 284 ${x - 64} 262 Z`, C.shoe);
      s += line(`M ${x - 60} 264 Q ${x} 282 ${x + 62} 264`, 9, C.sole);
    }
    const w = Math.sin(t * 3) * 6;
    s += line(`M 70 236 Q 96 ${250 + w} 104 ${272 - w} Q 110 ${286 + w} 128 282`, 5, C.lace);
    return s;
  }

  function torso() {
    let s = '';
    s += shape('M -112 -336 Q 0 -362 112 -336 L 138 -40 Q 0 -18 -138 -40 Z', C.shirt);
    s += `<path d="M 70 -330 Q 110 -320 112 -336 L 138 -40 Q 110 -34 92 -32 Z" fill="${C.shirtSh}" opacity="0.6"/>`;
    s += shape('M -40 -346 Q 0 -310 40 -346 Q 0 -336 -40 -346 Z', C.skinSh, 5); // collar opening
    // Stains and a hole
    s += `<path d="M -62 -214 q 20 -22 44 -6 q 18 14 -4 30 q -22 14 -36 -2 q -12 -10 -4 -22 Z" fill="${C.stain}" opacity="0.85"/>`;
    s += `<circle cx="-4" cy="-170" r="9" fill="${C.stain}" opacity="0.8"/><circle cx="40" cy="-128" r="14" fill="${C.stain}" opacity="0.7"/>`;
    s += shape('M 60 -94 q 14 -10 26 0 q 6 12 -8 18 q -16 4 -18 -18 Z', C.skin, 4);
    // Shorts
    s += shape('M -128 -50 L 128 -50 L 134 70 L 14 70 L 0 30 L -14 70 L -134 70 Z', C.shorts);
    s += `<path d="M 80 -46 L 128 -50 L 134 70 L 98 70 Z" fill="${C.shortsSh}" opacity="0.7"/>`;
    s += line('M -128 -36 L 128 -36', 4);
    return s;
  }

  // pose: {x, y, scale, t, expr, armL, armR, bendL, bendR, blink, look:{x,y}, talk, bob, lean, squash}
  function svg(p) {
    const t = p.t || 0, e = EXPR[p.expr || 'neutral'];
    const bob = p.bob != null ? p.bob : Math.sin(t * 2.2) * 6;
    const sq = p.squash || 0;
    const A = arm(-1, p.armL != null ? p.armL : 0.26, p.bendL != null ? p.bendL : -0.25);
    const B = arm(1, p.armR != null ? p.armR : 0.26, p.bendR != null ? p.bendR : -0.25);
    let s = `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${f((p.scale || 1) * (1 + sq * 0.06))} ${f((p.scale || 1) * (1 - sq * 0.06))})">`;
    s += `<ellipse cx="0" cy="282" rx="190" ry="26" fill="rgba(0,0,0,0.25)"/>`;
    s += legs(t);
    s += `<g transform="translate(0 ${f(bob)}) rotate(${f(p.lean || 0)} 0 0)">`;
    s += A.arm + B.arm;
    s += torso();
    s += A.sleeve + B.sleeve;
    // neck + head (head pushed forward/slouched by a slight tilt)
    s += shape('M -22 -372 L 22 -372 L 24 -322 L -24 -322 Z', C.skin);
    s += `<g transform="rotate(${f(p.headTilt || 0)} 0 -360)">`;
    s += circ(-150, -472, 30, C.skin) + circ(150, -478, 26, C.skin);
    s += line('M -158 -480 Q -148 -466 -156 -458', 4) + line('M 156 -486 Q 146 -474 154 -466', 4);
    s += circ(HC.x, HC.y, HR, C.skin);
    s += `<path d="M 70 -376 Q 140 -420 146 -500 Q 150 -420 70 -376 Z" fill="${C.skinSh}" opacity="0.35"/>`;
    s += face(p, e) + hair(t);
    s += `</g></g></g>`;
    return s;
  }

  window.Norbert = { svg, EXPR, C };
})();
