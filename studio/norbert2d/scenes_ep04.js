// Day 4 (HAIR) and Day 5 (ROOM) scenes, plus a step-based glow-up meter. Extends SCENES from ep.html.
(function () {
  const INK = '#1A1410';
  const D = window.Dentist;
  function start(t) { return sceneAt(t).t0; }
  function sceneStart(name) { const i = EP.lines.findIndex((l) => l.scene === name); return i >= 0 ? EP.lines[i].t0 - 0.12 : null; }

  // Meter steps: [{scene, from, to}] animate in order; before the first step the meter shows EP.glow.
  const baseGlow = window.glowAt;
  window.glowAt = function (t) {
    if (!EP.glow_steps) return baseGlow(t);
    let g = EP.glow;
    for (const st of EP.glow_steps) {
      const s0 = sceneStart(st.scene);
      if (s0 == null || t < s0 + 0.5) break;
      g = st.from + (st.to - st.from) * L.ease((t - s0 - 0.5) / 1.1);
    }
    return g;
  };

  function meterBoard(t, label, chip, chipCol = '#5BE37D', broken = false) {
    let s = L.sunburst(t, broken ? '#8A1E1E' : '#1E78D2', broken ? '#A12828' : '#2A8BE6');
    const g = glowAt(t);
    const sh = broken && t - start(t) < 1.6 ? Math.sin(t * 70) * 8 : 0;
    s += `<g transform="translate(${(540 + sh).toFixed(1)} 760) scale(${L.pop(t, start(t) + 0.1, 0.3).toFixed(3)})">`;
    s += `<text x="0" y="-120" text-anchor="middle" font-family="Anton" font-size="104" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">${label}</text>`;
    s += `<rect x="-420" y="-40" width="840" height="110" rx="55" fill="#141B2D" stroke="#000" stroke-width="10"/>`;
    s += `<rect x="-405" y="-25" width="${Math.max(80, 810 * g / 100).toFixed(1)}" height="80" rx="40" fill="${broken ? '#E5483B' : '#5BE37D'}"/>`;
    if (broken) s += `<path d="M -140 -40 L -100 20 L -150 70 M 160 -40 L 120 30 L 180 70" stroke="#FFFFFF" stroke-width="8" fill="none"/>`;
    s += `<text x="0" y="330" text-anchor="middle" font-family="Anton" font-size="300" fill="${broken ? '#FFFFFF' : '#FFD23F'}" stroke="#000" stroke-width="22" paint-order="stroke">${Math.round(g)}%</text></g>`;
    if (broken) for (let i = 0; i < 8; i++) {
      const a = i * 0.8 + t * 3, r = 200 + ((t * 300 + i * 50) % 260);
      s += `<line x1="${(540 + Math.cos(a) * r).toFixed(0)}" y1="${(780 + Math.sin(a) * r * 0.6).toFixed(0)}" x2="${(540 + Math.cos(a) * (r + 30)).toFixed(0)}" y2="${(780 + Math.sin(a) * (r + 30) * 0.6).toFixed(0)}" stroke="#FFD23F" stroke-width="7" stroke-linecap="round"/>`;
    }
    const ck = chip ? L.pop(t, start(t) + 1.6, 0.25) : 0;
    if (ck) s += `<g transform="translate(540 1230) scale(${ck.toFixed(3)})"><rect x="-400" y="-64" width="800" height="128" rx="30" fill="${chipCol}" stroke="#000" stroke-width="8"/>` +
      `<text x="0" y="30" text-anchor="middle" font-family="Anton" font-size="70" fill="#0B1A10">${chip}</text></g>`;
    return s;
  }

  function barbershop(t) {
    let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="#F2E3C6"/>`;
    for (let x = -600; x < 1680; x += 120) s += `<rect x="${x}" y="-600" width="60" height="2100" fill="#EAD6B2"/>`;
    s += `<rect x="180" y="420" width="720" height="560" rx="20" fill="#BFDDE8" stroke="${INK}" stroke-width="12"/><path d="M 260 480 L 420 900 M 340 480 L 500 900" stroke="#FFFFFF" stroke-width="16" opacity="0.5"/>`;
    // barber pole
    s += `<rect x="-20" y="420" width="70" height="380" rx="30" fill="#FFFFFF" stroke="${INK}" stroke-width="7"/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M -20 ${430 + i * 64 + ((t * 80) % 64)} L 50 ${470 + i * 64 + ((t * 80) % 64)}" stroke="#E5483B" stroke-width="16" opacity="0.9"/>`;
    s += `<rect x="-600" y="1400" width="2280" height="900" fill="#2E2E36"/>`;
    for (let x = -600; x < 1680; x += 120) for (let y = 1400; y < 2300; y += 120) if (((x + y) / 120) % 2 === 0) s += `<rect x="${x}" y="${y}" width="120" height="120" fill="#F2F2F2"/>`;
    return s;
  }
  function barberChair() {
    return `<path d="M 330 1260 L 760 1260 Q 780 1330 740 1350 L 350 1350 Q 310 1330 330 1260 Z" fill="#B3271F" stroke="${INK}" stroke-width="8"/>` +
      `<rect x="510" y="1350" width="60" height="70" fill="#9AA7B8" stroke="${INK}" stroke-width="6"/><ellipse cx="540" cy="1420" rx="160" ry="20" fill="#7F8A99" stroke="${INK}" stroke-width="6"/>`;
  }
  function cape(t) {
    return `<path d="M 360 1060 Q 540 990 720 1060 L 760 1300 L 320 1300 Z" fill="#F4F4F2" stroke="${INK}" stroke-width="7"/>`;
  }
  const BX = 870, BY = 1200, BS = 0.72;
  function barber(t, p) {
    return `<g transform="translate(${BX} 0) scale(-1 1) translate(${-BX} 0)">` + D.svg(Object.assign({ x: BX, y: BY, scale: BS, t, talk: mouthAt(t, 'BARB') }, p)) + `</g>`;
  }
  function shop(t, camv, np, bp, extra = '') {
    return `<g transform="${cam(...camv)}">` + barbershop(t) + barberChair() +
      norbert(Object.assign({ x: 540, y: 1250, scale: 0.8, teeth: 'fixed', skin: 'clear' }, np), t) + cape(t) + (bp ? barber(t, bp) : '') + extra + `</g>`;
  }
  function bird(x, y, t, sc = 1) {
    const w = Math.sin(t * 30) * 30;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc})"><ellipse cx="0" cy="0" rx="40" ry="30" fill="#5AA9E6" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M -10 -10 L -50 ${(-30 - w).toFixed(1)} L 10 -5 Z" fill="#3E86C2" stroke="${INK}" stroke-width="4"/><circle cx="22" cy="-8" r="6" fill="${INK}"/><path d="M 36 0 L 56 4 L 36 10 Z" fill="#F7C548" stroke="${INK}" stroke-width="3"/></g>`;
  }
  function mouse(x, y, t, i) {
    const b = Math.abs(Math.sin(t * 6 + i)) * 6;
    return `<g transform="translate(${x} ${(y - b).toFixed(1)})"><ellipse cx="0" cy="0" rx="34" ry="24" fill="#9AA0A8" stroke="${INK}" stroke-width="4"/><circle cx="-18" cy="-24" r="12" fill="#C9A0A8" stroke="${INK}" stroke-width="3"/><circle cx="12" cy="-24" r="12" fill="#C9A0A8" stroke="${INK}" stroke-width="3"/>` +
      `<circle cx="-8" cy="-6" r="4" fill="${INK}"/><circle cx="8" cy="-6" r="4" fill="${INK}"/><circle cx="0" cy="2" r="4" fill="#E58A9A"/><path d="M 30 6 Q 60 0 70 20" stroke="${INK}" stroke-width="3" fill="none"/></g>`;
  }
  function room(t, clean, camv, np, extra = '') {
    return `<g transform="${cam(...camv)}"><g transform="translate(0 150)">${clean ? L.roomClean(t) : L.room(t)}</g>` +
      (clean ? '' : L.stink(t, 540, 1150)) + norbert(Object.assign({ teeth: 'fixed', skin: 'clear', hair: 'fresh' }, np), t) + extra + `</g>`;
  }

  Object.assign(SCENES, {
    // ---------- DAY 4: HAIR ----------
    recap4(t, k, tl) {
      return room(t, false, [540, 820, lerp(2.4, 2.1, L.ease(tl / 0.6))], { hair: 'mess', expr: 'awkward', look: { x: 0, y: -1 } }, L.flies(t, 540, 560, 3)) +
        L.banner(t, 'DAY 4 · YOU PICKED HAIR 💇', 0.05, 560, 64);
    },
    meter_broken(t, k, tl) { return meterBoard(t, 'METER ERROR', 'REAL SCORE RECALCULATED', '#FFD23F', true); },
    meter_shock(t, k, tl) {
      const sh = tl < 0.5 ? Math.sin(t * 60) * 8 : 0;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` + room(t, false, [540, 900, 1.8], { hair: 'mess', expr: 'shocked', armL: 2.6, armR: 2.6, bendL: 0.5, bendR: 0.5 }) + `</g>`;
    },
    barber_wide(t, k, tl) {
      return shop(t, [600, 1000, lerp(1.08, 1.0, L.ease(tl / 0.5))], { hair: 'mess', expr: 'awkward', look: { x: 0.8, y: 0 } }, { tool: 'clippers', armR: 1.3 });
    },
    barber_shock(t, k, tl) {
      const sh = tl < 0.4 ? Math.sin(t * 60) * 5 : 0;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` + shop(t, [760, 880, 2.0], { hair: 'mess', expr: 'awkward' }, { tool: 'clippers', armR: 1.3, expr: 'shock' }, L.flies(t, 560, 600, 2)) + `</g>`;
    },
    bird(t, k, tl) {
      const fly = L.ease((tl - 0.3) / 1.0);
      const bx = 560 + fly * 500, by = 640 - fly * 520 + Math.sin(fly * 9) * 40;
      return shop(t, [560, 820, 1.9], { hair: 'mess', expr: 'shocked', look: { x: 1, y: -1 } }, null, tl > 0.3 ? bird(bx, by, t, 1.2) : '');
    },
    clipper_montage(t, k, tl) {
      const sh = Math.sin(t * 70) * 6;
      let fx = '';
      for (let i = 0; i < 14; i++) {
        const a = i * 0.45 + t * 4, r = 120 + ((t * 400 + i * 60) % 340);
        fx += `<path d="M ${(560 + Math.cos(a) * r).toFixed(0)} ${(640 + Math.sin(a) * r * 0.7).toFixed(0)} q 12 -18 26 -4" stroke="#3B2A20" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      }
      let s = `<g transform="translate(${sh.toFixed(1)} 0)">` + shop(t, [640, 960, 1.25], { hair: k < 0.6 ? 'mess' : 'fresh', expr: 'panic', look: { x: 0, y: 0 }, talk: 0 }, { tool: 'clippers', armR: 1.45, expr: k > 0.6 ? 'tired' : 'calm' }, fx) + `</g>`;
      s += `<g transform="translate(860 520)"><circle r="100" fill="#FFFFFF" stroke="#000" stroke-width="10"/><line x1="0" y1="0" x2="0" y2="-74" stroke="#000" stroke-width="10" stroke-linecap="round" transform="rotate(${(t * 720).toFixed(0)})"/><circle r="10" fill="#000"/></g>`;
      return s;
    },
    reveal_hair(t, k, tl) {
      let fx = '';
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + t * 1.4;
        const g = L.pop(t, start(t) + 0.15 + i * 0.07, 0.2);
        if (g) fx += L.sparkle(540 + Math.cos(a) * 230, 640 + Math.sin(a) * 180, (18 + (i % 2) * 10) * g, t * 100 + i * 40, i % 2 ? '#FFD23F' : '#FFFFFF');
      }
      return shop(t, [540, 760, lerp(1.7, 2.0, L.ease(k))], { hair: 'fresh', expr: 'happy', look: { x: 0, y: 0 } }, null, fx);
    },
    meter4(t, k, tl) { return meterBoard(t, 'GLOW-UP METER', '✅ HAIR: FIXED FOREVER'); },
    door_stink(t, k, tl) {
      const op = L.ease((tl - 0.4) / 0.3);
      let s = `<rect width="1080" height="1920" fill="#4A3B4F"/>`;
      s += `<rect x="290" y="560" width="500" height="1000" fill="#1A120E"/>`;
      s += `<g transform="translate(290 560) scale(${(1 - op * 0.85).toFixed(3)} 1)"><rect width="500" height="1000" fill="#6B4E3D" stroke="${INK}" stroke-width="10"/><circle cx="430" cy="520" r="18" fill="#C9A227"/></g>`;
      if (op > 0) {
        s += `<g opacity="${op.toFixed(2)}">`;
        for (let i = 0; i < 9; i++) {
          const r = 120 + i * 40 + Math.sin(t * 3 + i) * 20, ph = (t * 0.8 + i * 0.13) % 1;
          s += `<circle cx="${(540 + Math.cos(i * 1.3) * r * 0.6).toFixed(0)}" cy="${(1060 + Math.sin(i * 1.7) * r * 0.5 - ph * 200).toFixed(0)}" r="${(90 + i * 12).toFixed(0)}" fill="#9BD15A" opacity="0.45"/>`;
        }
        s += `</g>` + L.flies(t, 540, 1000, 3) + L.flies(t + 1, 600, 800, 3);
      }
      s += norbert({ x: 540, y: 1900, scale: 0.75, teeth: 'fixed', skin: 'clear', hair: 'fresh', expr: op > 0.5 ? 'shocked' : 'happy', talk: 0 }, t);
      return `<g transform="translate(${op > 0 && tl < 1.2 ? (Math.sin(t * 60) * 8).toFixed(1) : 0} 0)">${s}</g>`;
    },

    // ---------- DAY 5: ROOM ----------
    recap5(t, k, tl) {
      return room(t, false, [540, 1060, lerp(1.15, 1.0, L.ease(tl / 0.6))], { expr: 'awkward', look: { x: 0.5, y: 0 } }, L.flies(t, 560, 760, 3)) +
        L.banner(t, 'DAY 5 · THE ROOM 🛏️', 0.05, 560, 64);
    },
    room_wide(t, k, tl) {
      const rx = -100 + ((tl * 700) % 1400);
      return room(t, false, [540, 1060, 1.05], { expr: 'smug', armR: 2.2, bendR: -0.4 },
        `<g transform="translate(${rx.toFixed(0)} 1540)"><ellipse cx="0" cy="0" rx="46" ry="22" fill="#6B6B72" stroke="${INK}" stroke-width="4"/><circle cx="40" cy="-8" r="14" fill="#6B6B72" stroke="${INK}" stroke-width="4"/><path d="M -46 0 Q -90 -20 -110 10" stroke="${INK}" stroke-width="4" fill="none"/></g>` + L.flies(t, 560, 760, 3));
    },
    under_bed(t, k, tl) {
      let s = `<rect width="1080" height="1920" fill="#0A0A0E"/>`;
      s += `<path d="M 0 900 L 1080 760 L 1080 1240 L 0 1100 Z" fill="#FFF3C4" opacity="0.14"/>`;
      const g = (d) => L.pop(t, start(t) + d, 0.2);
      if (g(0.3)) s += `<g transform="translate(260 1000) scale(${g(0.3).toFixed(2)})"><path d="M -60 0 Q -40 -40 0 -30 Q 40 -50 60 0 Q 40 30 0 20 Q -40 30 -60 0 Z" fill="#F4F4F2" stroke="${INK}" stroke-width="5"/></g>`;
      if (g(0.9)) s += `<g transform="translate(520 980) scale(${g(0.9).toFixed(2)})"><path d="M -90 20 L 90 20 L 70 -20 L -70 -20 Z" fill="#D9B27C" stroke="${INK}" stroke-width="5"/><path d="M -70 -20 Q 0 -60 70 -20" fill="#6B8E3A" stroke="${INK}" stroke-width="5"/><circle cx="20" cy="-34" r="10" fill="#7A9A3A"/></g>`;
      if (g(1.6)) for (let i = 0; i < 4; i++) s += mouse(720 + i * 80, 1030 + (i % 2) * 20, t, i);
      return s;
    },
    mice_hi(t, k, tl) {
      let s = `<rect width="1080" height="1920" fill="#0A0A0E"/><path d="M 0 800 L 1080 700 L 1080 1300 L 0 1200 Z" fill="#FFF3C4" opacity="0.14"/>`;
      s += `<g transform="translate(540 1000) scale(3.2) translate(-540 -1000)">`;
      for (let i = 0; i < 4; i++) s += mouse(420 + i * 80, 1000 + (i % 2) * 14, t, i);
      s += `</g>`;
      s += `<path d="M 560 1500 Q 560 1700 540 1900" stroke="#F4B183" stroke-width="40" fill="none"/>` + `<circle cx="560" cy="1480" r="40" fill="#F4B183" stroke="${INK}" stroke-width="6"/>`;
      return s;
    },
    trash_montage(t, k, tl) {
      const sh = Math.sin(t * 60) * 5, n = Math.min(11, Math.ceil(k * 13));
      let bags = '';
      for (let i = 0; i < n; i++) bags += `<g transform="translate(${80 + (i % 6) * 160} ${1600 - Math.floor(i / 6) * 150})"><path d="M -70 0 Q -80 -110 0 -120 Q 80 -110 70 0 Z" fill="#1E1E24" stroke="#000" stroke-width="6"/><path d="M -12 -120 L 0 -150 L 12 -120" stroke="#1E1E24" stroke-width="10" fill="none"/></g>`;
      let s = `<g transform="translate(${sh.toFixed(1)} 0)">` + room(t, k > 0.7, [540, 1060, 1.0], { expr: 'determined', armL: 2.4 + Math.sin(t * 20) * 0.4, armR: 2.4 - Math.sin(t * 20) * 0.4, bendL: 0.3, bendR: 0.3, x: 540 + Math.sin(t * 6) * 120 }) + `</g>` + bags;
      s += `<text x="540" y="560" text-anchor="middle" font-family="Anton" font-size="150" fill="#FFD23F" stroke="#000" stroke-width="16" paint-order="stroke">${n} BAGS</text>`;
      return s;
    },
    reveal_room(t, k, tl) {
      let fx = '';
      for (let i = 0; i < 7; i++) {
        const g = L.pop(t, start(t) + 0.15 + i * 0.07, 0.2);
        if (g) fx += L.sparkle(120 + i * 140, 700 + (i % 3) * 260, (18 + (i % 2) * 10) * g, t * 100 + i * 40, i % 2 ? '#FFD23F' : '#FFFFFF');
      }
      return room(t, true, [540, 1060, lerp(1.0, 1.08, k)], { expr: 'happy', armL: 2.4, armR: 2.4, bendL: -0.3, bendR: -0.3 }, fx);
    },
    meter5(t, k, tl) { return meterBoard(t, 'GLOW-UP METER', '✅ ROOM: CLEAN FOREVER'); },
    maya5(t, k, tl) {
      let bubble = '';
      const bk = L.pop(t, start(t) + 0.5, 0.25);
      if (bk) bubble = `<g transform="translate(540 640) scale(${bk.toFixed(3)})"><rect x="-450" y="-120" width="900" height="240" rx="40" fill="#FFFFFF" stroke="#000" stroke-width="8"/>` +
        `<circle cx="-360" cy="0" r="62" fill="#C77DFF" stroke="#000" stroke-width="6"/><text x="-360" y="26" text-anchor="middle" font-family="Anton" font-size="70" fill="#fff">M</text>` +
        `<text x="-270" y="-30" font-family="Anton" font-size="52" fill="#5B2A86">MAYA 💛</text><text x="-270" y="56" font-family="Anton" font-size="50" fill="#1A1410">send ur outfit for tmrw 👀</text></g>`;
      return room(t, true, [560, 1000, 1.2], { expr: 'happy', phone: true, phoneGlow: true, armR: 2.05, bendR: 0.75, look: { x: 0.6, y: -0.2 } }) + bubble;
    },
    shirt_panic(t, k, tl) {
      const sh = tl < 0.4 ? Math.sin(t * 60) * 7 : 0;
      let s = `<g transform="translate(${sh.toFixed(1)} 0)">` + room(t, true, [560, 1060, 2.2], { expr: 'panic', armL: 2.6, armR: 2.6, bendL: 0.5, bendR: 0.5 }) + `</g>`;
      const a = L.pop(t, start(t) + 0.3, 0.2);
      if (a) s += `<g transform="translate(860 980) scale(${a.toFixed(3)}) rotate(160)"><path d="M 0 0 L -120 60 L -90 20 L -200 20 L -200 -20 L -90 -20 L -120 -60 Z" fill="#FFD23F" stroke="#000" stroke-width="6"/></g>` +
        `<text x="800" y="840" text-anchor="middle" font-family="Anton" font-size="70" fill="#FFD23F" stroke="#000" stroke-width="10" paint-order="stroke">KETCHUP?!</text>`;
      return s;
    },
  });
})();
