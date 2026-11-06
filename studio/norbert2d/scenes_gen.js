// Generic, data-driven scenes for Days 6-30. Each line names a scene ('set', 'meter', 'text', 'emoji', 'end')
// and passes its options in line.p. Locations, cast, camera moves and effects are all picked from JSON.
(function () {
  const INK = '#1A1410';
  const N = window.Norbert, D = window.Dentist;
  const P = (t) => sceneAt(t).line.p || {};
  const st = (t) => sceneAt(t).t0;
  const R = (a, b, i) => a + ((Math.sin(i * 127.1) * 43758.5453) % 1 + 1) % 1 * (b - a);

  // ---------- locations (world space, floor at y≈1400) ----------
  const floor = (col, line) => `<rect x="-600" y="1400" width="2280" height="900" fill="${col}"/><rect x="-600" y="1392" width="2280" height="14" fill="${line}"/>`;
  const LOC = {
    room: (t) => `<g transform="translate(0 150)">${L.roomClean(t)}</g>`,
    messy: (t) => `<g transform="translate(0 150)">${L.room(t)}</g>`,
    hallway(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#F3E9D2"/>`;
      for (let x = -560; x < 1680; x += 150) s += `<rect x="${x}" y="520" width="140" height="880" fill="#3E7CC0" stroke="${INK}" stroke-width="6"/>` +
        `<rect x="${x + 20}" y="560" width="100" height="14" fill="#2C5E96"/><rect x="${x + 20}" y="590" width="100" height="14" fill="#2C5E96"/><rect x="${x + 110}" y="900" width="14" height="50" rx="5" fill="#C9D3DF"/>`;
      s += `<rect x="-600" y="380" width="2280" height="40" fill="#E5483B"/>` + floor('#CFC6B4', '#9C927F');
      return s;
    },
    gym(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#C9D6E3"/>`;
      for (let y = -600; y < 1400; y += 70) s += `<rect x="-600" y="${y}" width="2280" height="3" fill="#B3C2D1"/>`;
      s += `<rect x="760" y="300" width="300" height="200" fill="#FFFFFF" stroke="${INK}" stroke-width="8"/><rect x="860" y="380" width="100" height="80" fill="none" stroke="#E5483B" stroke-width="7"/>` +
        `<ellipse cx="910" cy="520" rx="70" ry="14" fill="none" stroke="#F28C28" stroke-width="9"/><path d="M 850 525 L 880 620 M 970 525 L 940 620 M 910 530 L 910 630" stroke="#FFF" stroke-width="4"/>`;
      s += `<text x="200" y="560" text-anchor="middle" font-family="Anton" font-size="110" fill="#E5483B" opacity="0.85">GO EAGLES</text>`;
      s += `<rect x="-600" y="1400" width="2280" height="900" fill="#E2B271"/>`;
      for (let x = -600; x < 1680; x += 90) s += `<rect x="${x}" y="1400" width="4" height="900" fill="#C9965A"/>`;
      return s + `<path d="M -600 1600 L 1680 1600" stroke="#FFF" stroke-width="8"/>`;
    },
    store(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#FBE3EC"/>`;
      s += `<text x="540" y="540" text-anchor="middle" font-family="Anton" font-size="110" fill="#C2185B">THRIFT KING</text>`;
      const cols = ['#E5483B', '#2E86C1', '#5BE37D', '#F7C548', '#9B59B6', '#1ABC9C', '#E67E22'];
      for (const rx of [-120, 760]) {
        s += `<path d="M ${rx} 640 L ${rx + 420} 640" stroke="#7F8A99" stroke-width="12"/>`;
        for (let i = 0; i < 7; i++) s += `<path d="M ${rx + 30 + i * 56} 640 l -30 30 l 0 230 l 60 0 l 0 -230 Z" fill="${cols[(i + (rx > 0 ? 3 : 0)) % 7]}" stroke="${INK}" stroke-width="5"/>`;
      }
      return s + floor('#E8E1F0', '#B8AFC4');
    },
    park(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#8ED1FF"/>`;
      s += `<circle cx="880" cy="380" r="90" fill="#FFE066"/>`;
      s += `<ellipse cx="${(200 + (t * 25) % 900).toFixed(0)}" cy="300" rx="110" ry="40" fill="#FFF"/>`;
      s += `<rect x="40" y="700" width="70" height="700" fill="#8B5A2B" stroke="${INK}" stroke-width="6"/><circle cx="75" cy="660" r="200" fill="#4CAF50" stroke="${INK}" stroke-width="7"/>`;
      s += `<rect x="-600" y="1300" width="2280" height="1000" fill="#7CCB5B"/><path d="M 300 2300 Q 540 1600 700 1300 L 820 1300 Q 700 1600 900 2300 Z" fill="#E8D3A0"/>`;
      return s;
    },
    kitchen(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#FFF4D6"/>`;
      for (let x = -600; x < 1680; x += 80) for (let y = 820; y < 1100; y += 80) s += `<rect x="${x}" y="${y}" width="78" height="78" fill="#FFFFFF" stroke="#E6DCC0" stroke-width="2"/>`;
      s += `<rect x="-600" y="1100" width="2280" height="40" fill="#8D6E63" stroke="${INK}" stroke-width="6"/><rect x="-600" y="1140" width="2280" height="260" fill="#C9A27E" stroke="${INK}" stroke-width="6"/>`;
      s += `<rect x="760" y="420" width="260" height="680" rx="16" fill="#E8EEF3" stroke="${INK}" stroke-width="8"/><path d="M 760 700 L 1020 700" stroke="${INK}" stroke-width="6"/>`;
      return s + floor('#D9CBB0', '#A89878');
    },
    classroom(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#E7F0E0"/>`;
      s += `<rect x="60" y="400" width="960" height="460" fill="#2F5D3A" stroke="#8B5A2B" stroke-width="18"/>`;
      s += `<text x="540" y="560" text-anchor="middle" font-family="Anton" font-size="80" fill="#FFFFFF" opacity="0.85">${(P(t).board || 'TEST FRIDAY')}</text>`;
      s += `<text x="540" y="700" text-anchor="middle" font-family="Anton" font-size="60" fill="#FFFFFF" opacity="0.6">x² + 2x = ?</text>`;
      return s + floor('#BFA88A', '#8F7A5E');
    },
    dance(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#1B1035"/>`;
      for (let i = 0; i < 6; i++) {
        const a = Math.sin(t * 1.3 + i) * 0.5;
        s += `<path d="M ${100 + i * 180} -100 L ${100 + i * 180 + Math.sin(a) * 900 - 120} 1400 L ${100 + i * 180 + Math.sin(a) * 900 + 120} 1400 Z" fill="${['#FF4FA3', '#4FC3FF', '#FFD23F'][i % 3]}" opacity="0.16"/>`;
      }
      s += `<line x1="540" y1="-600" x2="540" y2="240" stroke="#999" stroke-width="6"/><circle cx="540" cy="300" r="80" fill="#C9D3DF" stroke="${INK}" stroke-width="6"/>`;
      for (let i = 0; i < 12; i++) s += `<rect x="${500 + (i % 4) * 22 - 10}" y="${250 + Math.floor(i / 4) * 30}" width="18" height="18" fill="#FFF" opacity="${(0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i))).toFixed(2)}"/>`;
      s += `<text x="540" y="560" text-anchor="middle" font-family="Anton" font-size="100" fill="#FFD23F" stroke="#000" stroke-width="8" paint-order="stroke">SPRING DANCE</text>`;
      s += `<rect x="-600" y="1400" width="2280" height="900" fill="#2A1B4D"/>`;
      for (let x = -600; x < 1680; x += 160) for (let y = 1400; y < 2300; y += 160) s += `<rect x="${x}" y="${y}" width="158" height="158" fill="${['#FF4FA3', '#4FC3FF', '#FFD23F', '#7CFC9A'][((x + y) / 160 + Math.floor(t * 3)) & 3]}" opacity="0.35"/>`;
      return s;
    },
    night(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#141A3A"/>`;
      for (let i = 0; i < 40; i++) s += `<circle cx="${R(-600, 1680, i).toFixed(0)}" cy="${R(-600, 900, i + 50).toFixed(0)}" r="${R(2, 5, i + 9).toFixed(1)}" fill="#FFF" opacity="${(0.5 + 0.5 * Math.sin(t * 3 + i)).toFixed(2)}"/>`;
      s += `<circle cx="820" cy="300" r="90" fill="#FFF3C4"/>`;
      s += `<rect x="-200" y="700" width="700" height="700" fill="#5D4E7A" stroke="${INK}" stroke-width="8"/><path d="M -260 720 L 150 420 L 560 720 Z" fill="#3E3357" stroke="${INK}" stroke-width="8"/>` +
        `<rect x="40" y="900" width="160" height="160" fill="#FFE08A" stroke="${INK}" stroke-width="6"/><rect x="280" y="1040" width="140" height="360" fill="#7A4E2D" stroke="${INK}" stroke-width="6"/>`;
      return s + floor('#2B2F45', '#1E2133');
    },
    stage(t) {
      let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#3A0D0D"/>`;
      for (let x = -600; x < 1680; x += 90) s += `<path d="M ${x} -600 Q ${x + 45} 400 ${x} 1400" stroke="#6E1414" stroke-width="40" fill="none"/>`;
      s += `<ellipse cx="540" cy="1420" rx="520" ry="90" fill="#FFF3B0" opacity="0.35"/>`;
      return s + floor('#5A3A22', '#3A2414');
    },
  };

  // ---------- cast ----------
  const CAST = {
    MAYA: { hair: 'long', teeth: 'fixed', skin: 'clear', outfit: 'fresh', blush: true, colors: { shirt: '#C77DFF', shirtSh: '#A45ED8', hair: '#5B3A1E', skin: '#E8A87C', skinSh: '#D68F62', pants: '#2F3E6E', logoText: '★', logo: '#FFD23F' } },
    CHAD: { hair: 'chad', teeth: 'fixed', skin: 'clear', outfit: 'fresh', colors: { shirt: '#E5483B', shirtSh: '#B8352B', hair: '#E8C547', skin: '#F2C29A', pants: '#2A2A33', logoText: 'C', logo: '#FFD23F' } },
    COACH: { hair: 'fresh', teeth: 'fixed', skin: 'clear', outfit: 'fresh', colors: { shirt: '#2E86C1', shirtSh: '#1F6AA0', hair: '#8A8F99', skin: '#D9A07A', pants: '#2A2A33', logoText: 'COACH', logo: '#FFF' } },
    GRAN: { hair: 'long', teeth: 'fixed', skin: 'clear', outfit: 'fresh', colors: { shirt: '#7FB77E', shirtSh: '#5E9A5D', hair: '#D7D7DF', skin: '#F0C3A0', pants: '#6D4C7D', logoText: '♥', logo: '#E5483B' } },
    MOM: { hair: 'long', teeth: 'fixed', skin: 'clear', outfit: 'fresh', colors: { shirt: '#F28C28', shirtSh: '#CF6F12', hair: '#3B2A20', skin: '#F4B183', pants: '#3D5A9E', logoText: '♥', logo: '#FFF' } },
  };
  function actor(c, t) {
    const who = c.who || 'NORB';
    const base = { t, blink: blinkAt(t + (who.length * 0.7)), talk: mouthAt(t, who) };
    if (who === 'NORB') return norbert(Object.assign(base, c), t);
    if (who === 'BARB') return D.svg(Object.assign({ x: c.x, y: c.y || 1200, scale: c.scale || 0.72, t, talk: mouthAt(t, 'BARB') }, c));
    const o = Object.assign({ x: 540, y: 1290, scale: 0.86 }, CAST[who] || {}, base, c);
    o.colors = Object.assign({}, (CAST[who] || {}).colors, c.colors || {});
    return N.svg(o);
  }

  // ---------- effects ----------
  function fx(t, list, s0) {
    let s = '';
    for (const f of list || []) {
      const [name, arg] = f.split(':');
      if (name === 'sparkle') for (let i = 0; i < 7; i++) {
        const a = i * 0.9 + t * 1.3, g = L.pop(t, s0 + 0.1 + i * 0.07, 0.2);
        if (g) s += L.sparkle(540 + Math.cos(a) * 300, 760 + Math.sin(a) * 260, (20 + (i % 2) * 12) * g, t * 100 + i * 40, i % 2 ? '#FFD23F' : '#FFFFFF');
      }
      if (name === 'hearts') for (let i = 0; i < 8; i++) {
        const ph = ((t - s0) * 0.5 + i / 8) % 1;
        s += `<text x="${(200 + i * 95 + Math.sin(t * 2 + i) * 20).toFixed(0)}" y="${(1300 - ph * 900).toFixed(0)}" font-size="${60 + (i % 3) * 20}" opacity="${(1 - ph).toFixed(2)}" text-anchor="middle">💖</text>`;
      }
      if (name === 'rain') for (let i = 0; i < 18; i++) {
        const ph = ((t - s0) * 0.9 + i / 18) % 1;
        s += `<text x="${(R(0, 1080, i)).toFixed(0)}" y="${(-100 + ph * 1700).toFixed(0)}" font-size="${70 + (i % 3) * 20}" text-anchor="middle" transform="rotate(${((t * 90 + i * 40) % 360).toFixed(0)} ${R(0, 1080, i).toFixed(0)} ${(-100 + ph * 1700).toFixed(0)})">${arg || '💸'}</text>`;
      }
      if (name === 'confetti') for (let i = 0; i < 40; i++) {
        const ph = ((t - s0) * 0.6 + R(0, 1, i)) % 1, x = R(0, 1080, i + 3) + Math.sin(t * 3 + i) * 30;
        s += `<rect x="${x.toFixed(0)}" y="${(-50 + ph * 2000).toFixed(0)}" width="18" height="30" fill="${['#FF4FA3', '#4FC3FF', '#FFD23F', '#7CFC9A', '#FFFFFF'][i % 5]}" transform="rotate(${(t * 200 + i * 30).toFixed(0)} ${x.toFixed(0)} ${(-50 + ph * 2000).toFixed(0)})"/>`;
      }
      if (name === 'clock') s += `<g transform="translate(870 560)"><circle r="100" fill="#FFFFFF" stroke="#000" stroke-width="10"/><line x1="0" y1="0" x2="0" y2="-74" stroke="#000" stroke-width="10" stroke-linecap="round" transform="rotate(${(t * 720).toFixed(0)})"/><line x1="0" y1="0" x2="44" y2="0" stroke="#000" stroke-width="10" stroke-linecap="round" transform="rotate(${(t * 60).toFixed(0)})"/><circle r="10" fill="#000"/></g>`;
      if (name === 'speed') for (let i = 0; i < 12; i++) {
        const y = 300 + i * 110, ph = ((t * 3 + i * 0.37) % 1);
        s += `<line x1="${(1100 - ph * 1400).toFixed(0)}" y1="${y}" x2="${(1300 - ph * 1400).toFixed(0)}" y2="${y}" stroke="#FFFFFF" stroke-width="8" opacity="0.6" stroke-linecap="round"/>`;
      }
      if (name === 'flies') s += L.flies(t, 540, 700, 3);
      if (name === 'stink') s += L.stink(t, 540, 1150);
      if (name === 'pop') { const g = L.pop(t, s0 + 0.25, 0.25); if (g) s += `<text x="${arg === 'l' ? 300 : 800}" y="720" font-size="${(200 * g).toFixed(0)}" text-anchor="middle">${f.split(':')[2] || '❗'}</text>`; }
      if (name === 'zzz') for (let i = 0; i < 3; i++) { const ph = ((t - s0) * 0.6 + i / 3) % 1; s += `<text x="${(650 + ph * 200).toFixed(0)}" y="${(700 - ph * 300).toFixed(0)}" font-family="Anton" font-size="${80 + i * 20}" fill="#FFF" stroke="#000" stroke-width="6" paint-order="stroke" opacity="${(1 - ph).toFixed(2)}">Z</text>`; }
      if (name === 'dark') s += `<rect width="1080" height="1920" fill="#000" opacity="${arg || 0.4}"/>`;
      if (name === 'red') s += `<rect width="1080" height="1920" fill="#E5483B" opacity="${(0.25 * Math.max(0, 1 - (t - s0) * 2)).toFixed(2)}"/>`;
    }
    return s;
  }

  function props(t, list, s0) {
    let s = '';
    for (const pr of list || []) {
      const g = pr.at != null ? L.pop(t, s0 + pr.at, 0.22) : 1;
      if (!g) continue;
      const bob = pr.float ? Math.sin(t * 3 + (pr.x || 0)) * 14 : 0;
      const rot = pr.spin ? (t * pr.spin) % 360 : (pr.rot || 0);
      const fly = pr.fly ? L.ease((t - s0 - (pr.at || 0)) / (pr.flyDur || 1)) : 0;
      const x = (pr.x || 540) + fly * (pr.fly ? pr.fly[0] : 0), y = (pr.y || 900) + bob + fly * (pr.fly ? pr.fly[1] : 0);
      s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${g.toFixed(3)})">` +
        (pr.e ? `<text x="0" y="${((pr.size || 160) * 0.35).toFixed(0)}" font-size="${pr.size || 160}" text-anchor="middle">${pr.e}</text>` : '') +
        (pr.txt ? `<text x="0" y="0" font-family="Anton" font-size="${pr.size || 90}" text-anchor="middle" fill="${pr.col || '#FFD23F'}" stroke="#000" stroke-width="${(pr.size || 90) / 9}" paint-order="stroke">${pr.txt}</text>` : '') + `</g>`;
    }
    return s;
  }

  // ---------- scenes ----------
  Object.assign(SCENES, {
    set(t, k, tl) {
      const p = P(t), s0 = st(t);
      const c0 = p.cam || [540, 1060, 1.0], c1 = p.cam2 || c0;
      const kk = L.easeIO(Math.min(1, tl / (p.camDur || 1.4)));
      const camv = [lerp(c0[0], c1[0], kk), lerp(c0[1], c1[1], kk), lerp(c0[2], c1[2], kk)];
      const shake = (p.shake && tl < (p.shake === true ? 0.5 : p.shake)) || p.shakeAll ? Math.sin(t * 60) * 8 : 0;
      let w = (LOC[p.loc || 'room'] || LOC.room)(t);
      w += props(t, p.back, s0);
      for (const c of p.cast || [{ who: 'NORB' }]) {
        const cc = Object.assign({}, c);
        if (cc.wobble) cc.x = (cc.x || 540) + Math.sin(t * cc.wobble) * 60;
        if (cc.walk) { const wk = L.ease(tl / (cc.walkDur || 1.2)); cc.x = lerp(cc.walk[0], cc.walk[1], wk); }
        if (cc.jump) cc.y = (cc.y || 1290) - Math.abs(Math.sin(t * cc.jump)) * 120;
        if (cc.flail) { cc.armL = 2.4 + Math.sin(t * 18) * 0.5; cc.armR = 2.4 - Math.sin(t * 18) * 0.5; cc.bendL = 0.3; cc.bendR = 0.3; }
        if (cc.dance) { cc.armL = 1.6 + Math.sin(t * 8) * 1.0; cc.armR = 1.6 - Math.sin(t * 8) * 1.0; cc.lean = Math.sin(t * 8) * 8; cc.bob = Math.abs(Math.sin(t * 8)) * -30; }
        if (cc.pushup) { cc.lean = 80; cc.y = (cc.y || 1500) + Math.abs(Math.sin(t * 2.5)) * 40; cc.armL = 3.0; cc.armR = 3.0; }
        if (cc.pose === 'cheer') Object.assign(cc, { armL: 2.6, armR: 2.6, bendL: -0.3, bendR: -0.3 });
        if (cc.pose === 'panic') Object.assign(cc, { armL: 2.6, armR: 2.6, bendL: 0.5, bendR: 0.5 });
        if (cc.pose === 'point') Object.assign(cc, { armR: 1.6, bendR: -0.1 });
        if (cc.pose === 'wave') Object.assign(cc, { armR: 2.5 + Math.sin(t * 10) * 0.25, bendR: 0.4 });
        if (cc.pose === 'shrug') Object.assign(cc, { armL: 1.3, armR: 1.3, bendL: 0.9, bendR: 0.9 });
        w += actor(cc, t);
      }
      w += props(t, p.front, s0);
      let s = `<g transform="translate(${shake.toFixed(1)} 0)"><g transform="${cam(...camv)}">${w}</g></g>`;
      s += fx(t, p.fx, s0) + props(t, p.screen, s0);
      if (p.banner) s += L.banner(t, p.banner, s0 + 0.05, p.bannerY || 560, p.bannerSize || 64);
      if (p.hook) {
        const g = L.pop(t, s0 + 0.05, 0.25);
        s += `<g transform="translate(540 ${p.hookY || 660}) scale(${g.toFixed(3)}) rotate(-3)"><rect x="-470" y="-95" width="940" height="170" rx="26" fill="#FFD23F" stroke="#000" stroke-width="10"/>` +
          `<text x="0" y="38" text-anchor="middle" font-family="Anton" font-size="${p.hook.length > 22 ? 70 : 92}" fill="#111">${p.hook}</text></g>`;
      }
      return s;
    },
    gmeter(t, k, tl) {
      const p = P(t), s0 = st(t), g = glowAt(t), bad = !!p.bad;
      let s = L.sunburst(t, bad ? '#8A1E1E' : (p.gold ? '#B8860B' : '#1E78D2'), bad ? '#A12828' : (p.gold ? '#DAA520' : '#2A8BE6'));
      const sh = bad && tl < 1.4 ? Math.sin(t * 70) * 8 : 0;
      s += `<g transform="translate(${(540 + sh).toFixed(1)} 760) scale(${L.pop(t, s0 + 0.1, 0.3).toFixed(3)})">`;
      s += `<text x="0" y="-120" text-anchor="middle" font-family="Anton" font-size="104" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">${p.label || 'GLOW-UP METER'}</text>`;
      s += `<rect x="-420" y="-40" width="840" height="110" rx="55" fill="#141B2D" stroke="#000" stroke-width="10"/>`;
      s += `<rect x="-405" y="-25" width="${Math.max(80, 810 * g / 100).toFixed(1)}" height="80" rx="40" fill="${bad ? '#E5483B' : '#5BE37D'}"/>`;
      s += `<text x="0" y="330" text-anchor="middle" font-family="Anton" font-size="300" fill="${bad ? '#FFFFFF' : '#FFD23F'}" stroke="#000" stroke-width="22" paint-order="stroke">${Math.round(g)}%</text></g>`;
      const ck = p.chip ? L.pop(t, s0 + 1.5, 0.25) : 0;
      if (ck) s += `<g transform="translate(540 1230) scale(${ck.toFixed(3)})"><rect x="-430" y="-64" width="860" height="128" rx="30" fill="${bad ? '#FFD23F' : '#5BE37D'}" stroke="#000" stroke-width="8"/>` +
        `<text x="0" y="28" text-anchor="middle" font-family="Anton" font-size="${p.chip.length > 24 ? 56 : 68}" fill="#0B1A10">${p.chip}</text></g>`;
      if (p.fx) s += fx(t, p.fx, s0);
      return s;
    },
    text(t, k, tl) {
      const p = P(t), s0 = st(t);
      let s = SCENES.set(t, k, tl);
      (p.msgs || []).forEach((m, i) => {
        const g = L.pop(t, s0 + 0.4 + i * 0.7, 0.25);
        if (!g) return;
        const y = 620 + i * 200, me = m.from === 'me';
        const name = m.from === 'me' ? 'NORBERT' : m.from;
        const col = { MAYA: '#5B2A86', CHAD: '#B8352B', MOM: '#CF6F12', COACH: '#1F6AA0' }[m.from] || '#333';
        s += `<g transform="translate(${me ? 600 : 480} ${y}) scale(${g.toFixed(3)})"><rect x="-420" y="-80" width="840" height="170" rx="36" fill="${me ? '#4FC3FF' : '#FFFFFF'}" stroke="#000" stroke-width="8"/>` +
          `<text x="-380" y="-20" font-family="Anton" font-size="44" fill="${me ? '#0B2A40' : col}">${name}${m.from === 'MAYA' ? ' 💛' : ''}</text>` +
          `<text x="-380" y="56" font-family="Anton" font-size="${m.t.length > 30 ? 44 : 52}" fill="#1A1410">${m.t}</text></g>`;
      });
      return s;
    },
    emoji(t, k, tl) {
      const p = P(t), s0 = st(t);
      let s = L.sunburst(t, p.c1 || '#7B2CBF', p.c2 || '#9D4EDD');
      const g = L.pop(t, s0 + 0.05, 0.3);
      s += `<g transform="translate(540 820) scale(${(g * (1 + Math.sin(t * 6) * 0.03)).toFixed(3)}) rotate(${(Math.sin(t * 4) * 6).toFixed(1)})"><text x="0" y="150" font-size="420" text-anchor="middle">${p.e || '😱'}</text></g>`;
      if (p.big) s += `<text x="540" y="480" text-anchor="middle" font-family="Anton" font-size="${p.big.length > 14 ? 96 : 130}" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">${p.big}</text>`;
      return s + fx(t, p.fx, s0);
    },
    end(t, k, tl) {
      const p = P(t), s0 = st(t);
      let s = L.sunburst(t, '#E5483B', '#F2685A');
      s += L.banner(t, p.title || `TOMORROW: DAY ${EP.day + 1}`, s0 + 0.05, 470, 70);
      const g = L.pop(t, s0 + 0.3, 0.3);
      s += `<g transform="translate(540 860) scale(${g.toFixed(3)})"><rect x="-440" y="-180" width="880" height="360" rx="40" fill="#141B2D" stroke="#000" stroke-width="10"/>` +
        `<text x="0" y="-40" text-anchor="middle" font-size="150">${p.e || '👀'}</text><text x="0" y="120" text-anchor="middle" font-family="Anton" font-size="${(p.tease || '').length > 18 ? 66 : 84}" fill="#FFD23F">${p.tease || ''}</text></g>`;
      const g2 = L.pop(t, s0 + 0.8, 0.3);
      if (g2) s += `<g transform="translate(540 1220) scale(${g2.toFixed(3)})"><rect x="-400" y="-70" width="800" height="140" rx="70" fill="#FFFFFF" stroke="#000" stroke-width="8"/>` +
        `<text x="0" y="26" text-anchor="middle" font-family="Anton" font-size="70" fill="#E5483B">${p.cta || 'FOLLOW + COMMENT 🔔'}</text></g>`;
      s += N.svg(Object.assign({ x: 540 + Math.sin(t * 2) * 10, y: 1900, scale: 0.48, t, expr: p.expr || 'determined', armL: 2.7, armR: 2.7, bendL: 0.3, bendR: 0.3, blink: blinkAt(t), talk: 0 }, EP.look || {}, p.norb || {}));
      return s;
    },
  });
  SCENES.gmeter2 = SCENES.gmeter;
})();
