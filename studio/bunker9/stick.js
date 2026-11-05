// Bunker 9 cast: posable 2D stickman rigs with round heads, expressive faces and per-character outfits.
// Stick.svg(p) -> SVG string. Local origin = between the feet; head centre at y=-640 (scale 1 ≈ 760 px tall).
(function () {
  const INK = '#0B0B0D', SKIN = '#EFE6D6', SKIN_SH = '#CFC3AE';
  const f = (n) => Math.round(n * 10) / 10;
  const limb = (d, w, col) =>
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 10}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const shape = (d, fill, sw = 5) => `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const circ = (x, y, r, fill, sw = 5) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
  const line = (d, w = 5, col = INK) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const CAST = {
    milo:  { top: '#E9B43A', topSh: '#C1902A', pants: '#3B4252', shoe: '#E8E8E8', hair: '#2A1F18', body: 'hoodie' },
    june:  { top: '#3A3F48', topSh: '#2A2E35', pants: '#22262D', shoe: '#5A3B2B', hair: '#1A1412', body: 'jacket' },
    hal:   { top: '#5B6B3A', topSh: '#46542C', pants: '#4A4236', shoe: '#2B2620', hair: '#A8A8A8', body: 'jacket' },
    priya: { top: '#DCE6EA', topSh: '#B9C7CD', pants: '#DCE6EA', shoe: '#F2F2F2', hair: '#1C1410', body: 'scrubs' },
    teddy: { top: '#3E7CC0', topSh: '#2F619A', pants: '#2E3542', shoe: '#E9C33A', hair: '#3A2A1E', body: 'raincoat' },
    dante: { top: '#E07B2A', topSh: '#B9611E', pants: '#E07B2A', shoe: '#2B2620', hair: '#1A1412', body: 'overalls' },
    ava:   { top: '#7D4FB3', topSh: '#62398F', pants: '#2E3542', shoe: '#EDEDED', hair: '#C98A3A', body: 'hoodie' },
  };

  const EXPR = {
    neutral:  { eye: 1.0, pupil: 9, brow: [0, 0], tilt: [0, 0], mouth: 'flat' },
    scared:   { eye: 1.3, pupil: 6, brow: [-14, -14], tilt: [12, -12], mouth: 'wobble' },
    terror:   { eye: 1.5, pupil: 4, brow: [-22, -22], tilt: [16, -16], mouth: 'open', open: 1 },
    angry:    { eye: 0.8, pupil: 9, brow: [8, 8], tilt: [-14, 14], mouth: 'frown' },
    sad:      { eye: 0.85, pupil: 10, brow: [-6, -6], tilt: [16, -16], mouth: 'frown', tear: true },
    hope:     { eye: 1.15, pupil: 10, brow: [-10, -10], tilt: [0, 0], mouth: 'small' },
    stern:    { eye: 0.75, pupil: 9, brow: [6, 6], tilt: [-8, 8], mouth: 'flat' },
    blank:    { eye: 1.0, pupil: 3, brow: [0, 0], tilt: [0, 0], mouth: 'flat' },
  };

  function face(p, e, c) {
    const hx = 0, hy = -640, lk = p.look || { x: 0, y: 0 };
    const blink = p.blink || 0;
    let s = '';
    for (const sd of [-1, 1]) {
      const ex = hx + sd * 28 + lk.x * 6, ey = hy - 4;
      const ry = Math.max(1.5, 17 * e.eye * (1 - blink));
      if (ry < 3) s += line(`M ${ex - 14} ${ey} L ${ex + 14} ${ey}`, 5);
      else {
        s += `<ellipse cx="${f(ex)}" cy="${ey}" rx="15" ry="${f(ry)}" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>`;
        const pr = Math.min(e.pupil, ry * 0.8);
        s += `<circle cx="${f(ex + lk.x * 6)}" cy="${f(ey + lk.y * 5)}" r="${f(pr)}" fill="${INK}"/>`;
        if (p.who === 'teddy' && p.glow) s += `<circle cx="${f(ex + lk.x * 6)}" cy="${f(ey + lk.y * 5)}" r="${f(pr * 0.5)}" fill="#BFE8FF"/>`;
      }
      const [b, tl] = [e.brow[sd < 0 ? 0 : 1], e.tilt[sd < 0 ? 0 : 1]];
      s += line(`M ${ex - 16} ${ey - 30 + b + tl * sd * -0.5} L ${ex + 16} ${ey - 30 + b - tl * sd * -0.5}`, 6);
    }
    if (p.who === 'hal') s += line(`M -48 -646 L -10 -646 L -10 -626 L -48 -626 Z M 10 -646 L 48 -646 L 48 -626 L 10 -626 Z M -10 -640 L 10 -640`, 4);
    // mouth
    const my = hy + 36, talk = p.talk || 0;
    const open = Math.max(e.open || 0, talk);
    if (open > 0.12) s += `<ellipse cx="0" cy="${f(my + 4)}" rx="${f(12 + open * 6)}" ry="${f(4 + open * 14)}" fill="#3A1414" stroke="${INK}" stroke-width="4"/>`;
    else if (e.mouth === 'frown') s += line(`M -18 ${my + 6} Q 0 ${my - 6} 18 ${my + 6}`, 5);
    else if (e.mouth === 'wobble') s += line(`M -18 ${my} q 6 -6 12 0 t 12 0 t 12 0`, 5);
    else if (e.mouth === 'small') s += line(`M -10 ${my} Q 0 ${my + 6} 10 ${my}`, 5);
    else s += line(`M -16 ${my} L 16 ${my}`, 5);
    if (e.tear) s += `<path d="M -30 -616 q 5 14 0 20 q -6 -2 0 -20 Z" fill="#9FD3FF" stroke="${INK}" stroke-width="2"/>`;
    if (p.who === 'dante') for (const [x, y] of [[-30, -594], [-18, -588], [-4, -586], [10, -588], [24, -592], [32, -600], [-36, -602]]) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="rgba(0,0,0,0.45)"/>`;
    return s;
  }

  function hair(p, c) {
    const w = p.who;
    if (w === 'milo') return shape('M -66 -650 Q -70 -720 -10 -722 Q 40 -738 70 -690 Q 78 -660 66 -646 L 50 -676 L 34 -654 L 20 -684 L 0 -660 L -18 -688 L -36 -660 L -50 -684 Z', c.hair);
    if (w === 'june') return shape('M -72 -628 Q -78 -560 -60 -548 L -54 -640 Z', c.hair) + shape('M 72 -628 Q 78 -560 60 -548 L 54 -640 Z', c.hair) +
      shape('M -76 -652 Q -74 -742 0 -744 Q 74 -742 76 -652 Z', '#C8372D') + line('M -76 -652 L 76 -652', 12, '#A12C24') + circ(0, -748, 12, '#C8372D', 4);
    if (w === 'hal') return shape('M -70 -660 Q -60 -716 0 -716 Q 60 -716 70 -660 Q 40 -690 0 -690 Q -40 -690 -70 -660 Z', c.hair);
    if (w === 'priya') return shape('M -72 -646 Q -70 -722 0 -724 Q 70 -722 72 -646 Q 40 -686 0 -686 Q -40 -686 -72 -646 Z', c.hair) +
      shape('M 60 -690 Q 118 -660 104 -590 Q 92 -620 74 -650 Z', c.hair);
    if (w === 'teddy') return shape('M -84 -620 Q -92 -742 0 -748 Q 92 -742 84 -620 Q 70 -700 0 -704 Q -70 -700 -84 -620 Z', c.top);
    if (w === 'ava') return shape('M -74 -640 Q -80 -730 0 -734 Q 80 -730 74 -640 Q 84 -560 66 -500 L 50 -640 Q 0 -690 -50 -640 L -66 -500 Q -84 -560 -74 -640 Z', c.hair);
    if (w === 'dante') return shape('M -72 -650 Q -70 -726 0 -728 Q 70 -726 72 -650 Z', '#2B2B33') + shape('M -72 -660 L -120 -650 Q -118 -640 -70 -642 Z', '#2B2B33');
    return '';
  }

  function torso(p, c) {
    const w = p.who;
    let s = '';
    if (c.body === 'raincoat') s += shape('M -58 -560 Q 0 -578 58 -560 L 76 -300 Q 0 -286 -76 -300 Z', c.top);
    else if (c.body === 'overalls') {
      s += shape('M -52 -556 Q 0 -572 52 -556 L 58 -300 L -58 -300 Z', '#EAE2D2');
      s += shape('M -50 -470 L 50 -470 L 58 -300 L -58 -300 Z', c.top) + line('M -40 -470 L -30 -556 M 40 -470 L 30 -556', 9, c.top);
    } else s += shape('M -56 -558 Q 0 -576 56 -558 L 64 -300 Q 0 -290 -64 -300 Z', c.top);
    s += `<path d="M 30 -556 Q 56 -558 60 -300 Q 44 -296 36 -298 Z" fill="${c.topSh}" opacity="0.7"/>`;
    if (w === 'milo') s += line('M -36 -556 Q 0 -500 36 -556', 7, '#5A5F6A') + circ(-38, -548, 11, '#5A5F6A', 4) + circ(38, -548, 11, '#5A5F6A', 4) +
      shape('M -30 -420 L 30 -420 L 26 -380 L -26 -380 Z', c.topSh, 3);
    if (w === 'hal') s += circ(34, -312, 7, '#C9B26A', 3) + circ(46, -306, 7, '#C9B26A', 3) + line('M -60 -330 L 60 -330', 8, '#2B2620');
    if (w === 'priya') s += line('M -20 -500 L -20 -470 M -35 -485 L -5 -485', 6, '#C8372D');
    if (w === 'june') s += line('M -54 -540 L 54 -420', 5, '#22262D');
    return s;
  }

  function arm(side, a, bend, c) {
    const sx = side * 50, sy = -540, L = 240;
    const hx = sx + side * Math.sin(a) * L, hy = sy + Math.cos(a) * L;
    const mx = (sx + hx) / 2, my = (sy + hy) / 2, dx = hx - sx, dy = hy - sy, n = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / n) * bend * side * 60, cy = my + (dx / n) * bend * side * 60;
    return { d: `M ${f(sx)} ${f(sy)} Q ${f(cx)} ${f(cy)} ${f(hx)} ${f(hy)}`, hand: { x: hx, y: hy } };
  }

  function prop(p, hand) {
    const { x, y } = hand;
    if (p.prop === 'camcorder') return `<g transform="translate(${f(x)} ${f(y - 10)}) rotate(${p.propRot || 0})">` + shape('M -34 -22 L 30 -22 L 30 22 L -34 22 Z', '#1E1F24') +
      shape('M 30 -12 L 52 -18 L 52 18 L 30 12 Z', '#2E3038') + `<circle cx="-20" cy="-10" r="5" fill="${(p.t * 2) % 1 < 0.5 ? '#FF3B30' : '#5A1A16'}"/></g>`;
    if (p.prop === 'flashlight') return `<g transform="translate(${f(x)} ${f(y)}) rotate(${p.propRot || 0})">` + shape('M -10 -12 L 44 -12 L 44 12 L -10 12 Z', '#2B2B33') + shape('M 44 -16 L 58 -16 L 58 16 L 44 16 Z', '#C9CED6') + `</g>`;
    if (p.prop === 'logbook') return `<g transform="translate(${f(x)} ${f(y - 20)}) rotate(-8)">` + shape('M -40 -50 L 40 -50 L 40 50 L -40 50 Z', '#6B3A2A') + line('M -30 -30 L 30 -30 M -30 -14 L 30 -14 M -30 2 L 20 2', 3, '#E9DCC2') + `</g>`;
    if (p.prop === 'phone') return `<g transform="translate(${f(x)} ${f(y - 30)}) rotate(${p.propRot || -10})">` + shape('M -18 -34 L 18 -34 L 18 34 L -18 34 Z', '#16171B', 4) + `<rect x="-13" y="-28" width="26" height="52" fill="${p.phoneGlow ? '#BFE3FF' : '#2A3550'}"/></g>`;
    if (p.prop === 'monitor') return `<g transform="translate(${f(x)} ${f(y - 30)}) rotate(-6)">` + shape('M -34 -46 L 34 -46 L 34 46 L -34 46 Z', '#E9E6DF', 4) + `<rect x="-26" y="-38" width="52" height="40" fill="#6FAE8E"/>` + `<circle cx="0" cy="24" r="7" fill="#3A3E45"/></g>`;
    if (p.prop === 'rabbit') return `<g transform="translate(${f(x)} ${f(y + 10)})">` + shape('M -10 -60 Q -18 -96 -6 -98 Q 4 -96 0 -62 Z', '#CFC7BA', 3) + shape('M 8 -60 Q 12 -96 22 -94 Q 30 -88 14 -60 Z', '#CFC7BA', 3) +
      circ(4, -44, 22, '#CFC7BA', 3) + `<circle cx="-4" cy="-48" r="3" fill="${INK}"/><circle cx="12" cy="-48" r="3" fill="${INK}"/>` + shape('M -18 -26 Q 4 -16 26 -26 L 22 10 L -14 10 Z', '#CFC7BA', 3) + `</g>`;
    return '';
  }

  // p: {who, x, y, scale, t, expr, armL, armR, bendL, bendR, talk, blink, look, walk, lean, prop, propSide, flip, bandage}
  function svg(p) {
    const c = CAST[p.who], e = EXPR[p.expr || 'neutral'], t = p.t || 0;
    const sc = p.scale || 1, fl = p.flip ? -1 : 1;
    const breathe = Math.sin(t * 2.1 + (p.x || 0)) * 3;
    const wk = p.walk != null ? p.walk : null;
    let s = `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${f(sc * fl)} ${f(sc)})">`;
    s += `<ellipse cx="0" cy="6" rx="110" ry="16" fill="rgba(0,0,0,0.45)"/>`;
    // legs (walk cycle when p.walk is a phase)
    for (const sd of [-1, 1]) {
      let kx = sd * 22, ky = -150, fx = sd * 26, fy = 0;
      if (wk != null) {
        const ph = wk * Math.PI * 2 + (sd > 0 ? Math.PI : 0);
        fx = sd * 18 + Math.sin(ph) * 70; fy = -Math.max(0, Math.cos(ph)) * 30;
        kx = sd * 14 + Math.sin(ph) * 40 + 16; ky = -160 - Math.max(0, Math.cos(ph)) * 20;
      }
      s += limb(`M ${sd * 22} -300 Q ${f(kx)} ${f(ky)} ${f(fx)} ${f(fy)}`, 22, c.pants);
      s += shape(`M ${f(fx - 22)} ${f(fy - 6)} Q ${f(fx)} ${f(fy - 26)} ${f(fx + 34)} ${f(fy - 6)} L ${f(fx + 34)} ${f(fy + 4)} L ${f(fx - 22)} ${f(fy + 4)} Z`, c.shoe, 4);
    }
    const bob = wk != null ? -Math.abs(Math.sin(wk * Math.PI * 2)) * 10 : breathe;
    s += `<g transform="translate(0 ${f(bob)}) rotate(${f(p.lean || 0)} 0 -300)">`;
    const A = arm(-1, p.armL != null ? p.armL : 0.18, p.bendL != null ? p.bendL : 0.2, c);
    const B = arm(1, p.armR != null ? p.armR : 0.18, p.bendR != null ? p.bendR : 0.2, c);
    s += limb(A.d, 20, c.top) + limb(B.d, 20, c.top);
    s += torso(p, c);
    s += circ(A.hand.x, A.hand.y, 16, SKIN, 4) + circ(B.hand.x, B.hand.y, 16, SKIN, 4);
    if (p.who === 'june') s += circ(A.hand.x, A.hand.y, 17, '#F4F1EA', 4) + line(`M ${f(A.hand.x - 12)} ${f(A.hand.y - 4)} L ${f(A.hand.x + 12)} ${f(A.hand.y + 4)}`, 3, '#B7AFA0');
    s += prop(p, p.propSide === 'L' ? A.hand : B.hand);
    // neck + head
    s += limb('M 0 -560 L 0 -580', 14, SKIN);
    s += `<g transform="rotate(${f(p.headTilt || 0)} 0 -580)">`;
    s += circ(0, -640, 72, SKIN, 6);
    s += `<path d="M 40 -590 Q 70 -620 66 -670 Q 80 -610 40 -590 Z" fill="${SKIN_SH}" opacity="0.6"/>`;
    s += face(p, e, c) + hair(p, c);
    s += `</g></g></g>`;
    return s;
  }

  window.Stick = { svg, CAST, EXPR };
})();
