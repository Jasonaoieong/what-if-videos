// Day 2 scenes: the dentist. Extends SCENES from ep.html.
(function () {
  const D = window.Dentist;
  const NX = 520, NY = 1240, NS = 0.8;                       // Norbert in the chair
  const NHEAD = { x: NX, y: NY - NS * 490 }, NMOUTH = { x: NX, y: NY - NS * 404 };
  const DX = 860, DY = 1190, DS = 0.74;                      // dentist standing right, facing left
  const DHEAD = { x: DX, y: DY - DS * 500 };

  function sceneStart(t) { return sceneAt(t).t0; }
  function fixedAfter(name) {
    const i = EP.lines.findIndex((l) => l.scene === name);
    return i >= 0 ? EP.lines[i].t0 - 0.12 : 1e9;
  }
  function teethAt(t) { return t >= fixedAfter('mirror_hold') ? 'fixed' : 'buck'; }

  function dentist(t, p) {
    return `<g transform="translate(${DX} 0) scale(-1 1) translate(${-DX} 0)">` +
      D.svg(Object.assign({ x: DX, y: DY, scale: DS, t, talk: mouthAt(t, 'DENT') }, p)) + `</g>`;
  }
  function officeShot(t, camv, np, dp, extra = '') {
    return `<g transform="${cam(...camv)}">` + D.office(t) + D.chairBack() +
      norbert(Object.assign({ x: NX, y: NY, scale: NS, teeth: teethAt(t) }, np), t) + D.chairFront() +
      (dp ? dentist(t, dp) : '') + extra + `</g>`;
  }

  window.glowAt = function (t) {
    const i = EP.lines.findIndex((l) => l.scene === 'meter');
    if (i < 0 || EP.glow_to == null) return EP.glow;
    const t0 = EP.lines[i].t0 - 0.12 + 0.6;
    return EP.glow + (EP.glow_to - EP.glow) * L.ease((t - t0) / 1.2);
  };

  Object.assign(SCENES, {
    recap(t, k, tl) {
      let s = L.sunburst(t, '#1E78D2', '#2A8BE6');
      s += L.banner(t, 'DAY 2 · YOU PICKED', 0.1, 560, 76);
      s += L.chip(t, 0.35, 540, 820, 600, '🦷', 'TEETH', tl > 0.8);
      s += N.svg({ x: 540, y: 1820, scale: 0.6, t, expr: 'happy', armL: 2.7 + Math.sin(t * 10) * 0.1, armR: 2.7 - Math.sin(t * 10) * 0.1,
        bendL: 0.3, bendR: 0.3, blink: blinkAt(t), talk: 0 });
      return s;
    },
    office_wide(t, k, tl) {
      const z = lerp(1.06, 1.0, L.ease(tl / 0.5));
      return officeShot(t, [640, 980, z], { expr: 'awkward', look: { x: 0.8, y: -0.2 }, talk: 0 }, { tool: 'mirror', armR: 1.25 });
    },
    ahh(t, k, tl) {
      const beam = `<path d="M 1100 700 L ${NMOUTH.x + 40} ${NMOUTH.y - 40} L ${NMOUTH.x + 40} ${NMOUTH.y + 40} L 1100 1100 Z" fill="rgba(255,250,200,0.35)"/>`;
      return officeShot(t, [NMOUTH.x + 20, NMOUTH.y - 40, lerp(2.4, 2.7, k)],
        { expr: 'shocked', look: { x: 0.3, y: -0.5 }, headTilt: -6 }, null, beam);
    },
    dent_shock(t, k, tl) {
      const sh = tl < 0.35 ? Math.sin(t * 60) * 5 : 0;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` +
        officeShot(t, [DHEAD.x - 60, DHEAD.y + 60, 2.0], { expr: 'awkward', talk: 0 }, { expr: 'shock', tool: 'light', armR: 1.3 }) + `</g>`;
    },
    norb_worried(t, k, tl) {
      return officeShot(t, [NHEAD.x, NHEAD.y + 30, 2.1], { expr: 'plead', look: { x: 0.7, y: -0.3 } }, { tool: 'light', armR: 1.3 });
    },
    teeth_zoom(t, k, tl) {
      const z = lerp(3.4, 4.2, L.easeIO(k));
      let sp = '';
      const g = L.pop(t, sceneStart(t) + 1.0, 0.25);
      if (g) sp += L.sparkle(NMOUTH.x - 18, NMOUTH.y + 20, 14 * g, t * 90) + L.sparkle(NMOUTH.x + 14, NMOUTH.y + 10, 10 * g, -t * 120);
      return officeShot(t, [NMOUTH.x, NMOUTH.y + 14, z], { expr: 'neutral', look: { x: 0, y: 0 }, talk: 0 }, null, sp);
    },
    montage(t, k, tl) {
      const sh = Math.sin(t * 70) * 7, shy = Math.cos(t * 53) * 5;
      let fx = '';
      // drill sparks from the mouth
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + t * 9, r0 = 20, r1 = 70 + ((i * 37 + Math.floor(t * 30)) % 50);
        fx += `<line x1="${(NMOUTH.x + Math.cos(a) * r0).toFixed(1)}" y1="${(NMOUTH.y + Math.sin(a) * r0).toFixed(1)}" x2="${(NMOUTH.x + Math.cos(a) * r1).toFixed(1)}" y2="${(NMOUTH.y + Math.sin(a) * r1).toFixed(1)}" stroke="#FFD23F" stroke-width="7" stroke-linecap="round"/>`;
      }
      let s = `<g transform="translate(${sh.toFixed(1)} ${shy.toFixed(1)})">` +
        officeShot(t, [680, 980, 1.25], { expr: 'panic', look: { x: 0, y: 0 }, talk: 0, armL: 2.5 + Math.sin(t * 20) * 0.2, bendL: 0.5 },
          { tool: 'drill', armR: 1.45, expr: k > 0.6 ? 'tired' : 'calm' }, fx) + `</g>`;
      // spinning clock
      const ca = t * 720;
      s += `<g transform="translate(860 560)"><circle r="110" fill="#FFFFFF" stroke="#000" stroke-width="10"/>` +
        `<line x1="0" y1="0" x2="0" y2="-80" stroke="#000" stroke-width="10" stroke-linecap="round" transform="rotate(${ca.toFixed(0)})"/>` +
        `<line x1="0" y1="0" x2="0" y2="-55" stroke="#E25B4A" stroke-width="12" stroke-linecap="round" transform="rotate(${(ca / 12).toFixed(0)})"/>` +
        `<circle r="10" fill="#000"/></g>`;
      if (k > 0.55) s += L.banner(t, '3 HOURS LATER...', sceneStart(t) + (sceneAt(t).t1 - sceneStart(t)) * 0.55, 860, 80);
      return s;
    },
    mirror_hold(t, k, tl) {
      return officeShot(t, [660, 980, 1.15], { expr: 'neutral', look: { x: 0.8, y: 0 }, talk: 0 }, { tool: 'mirror', armR: 1.15, expr: 'tired' });
    },
    reveal(t, k, tl) {
      let fx = '';
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + t * 1.5, r = 150 + Math.sin(t * 4 + i) * 20;
        const g = L.pop(t, sceneStart(t) + 0.1 + i * 0.08, 0.2);
        if (g) fx += L.sparkle(NHEAD.x + Math.cos(a) * r, NHEAD.y + 60 + Math.sin(a) * r * 0.7, (16 + (i % 2) * 8) * g, t * 100 + i * 40, i % 2 ? '#FFD23F' : '#FFFFFF');
      }
      for (let i = 0; i < 24; i++) {
        const x = (i * 97) % 1080, y = ((t - sceneStart(t)) * (300 + (i % 5) * 60) + i * 61) % 1200 + 300;
        fx += `<rect x="${x}" y="${y.toFixed(0)}" width="16" height="10" fill="${['#FFD23F', '#FF7AC6', '#5BE37D', '#7FE3FF'][i % 4]}" transform="rotate(${(t * 200 + i * 30).toFixed(0)} ${x} ${y.toFixed(0)})"/>`;
      }
      const z = lerp(1.6, 1.9, L.ease(k));
      return officeShot(t, [NHEAD.x, NHEAD.y + 120, z], { expr: 'happy', armL: 2.4, bendL: -0.3, armR: 2.4, bendR: -0.3, look: { x: 0, y: 0 } }, null) +
        `<g>${fx}</g>`;
    },
    meter(t, k, tl) {
      let s = L.sunburst(t, '#1E78D2', '#2A8BE6');
      const g = glowAt(t);
      s += `<g transform="translate(540 760) scale(${L.pop(t, sceneStart(t) + 0.1, 0.3).toFixed(3)})">`;
      s += `<text x="0" y="-120" text-anchor="middle" font-family="Anton" font-size="110" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">GLOW-UP METER</text>`;
      s += `<rect x="-420" y="-40" width="840" height="110" rx="55" fill="#141B2D" stroke="#000" stroke-width="10"/>`;
      s += `<rect x="-405" y="-25" width="${Math.max(80, 810 * g / 100).toFixed(1)}" height="80" rx="40" fill="#5BE37D"/>`;
      s += `<text x="0" y="330" text-anchor="middle" font-family="Anton" font-size="300" fill="#FFD23F" stroke="#000" stroke-width="22" paint-order="stroke">${Math.round(g)}%</text>`;
      s += `</g>`;
      const ck = L.pop(t, sceneStart(t) + 1.9, 0.25);
      if (ck) s += `<g transform="translate(540 1230) scale(${ck.toFixed(3)})"><rect x="-380" y="-64" width="760" height="128" rx="30" fill="#5BE37D" stroke="#000" stroke-width="8"/>` +
        `<text x="0" y="30" text-anchor="middle" font-family="Anton" font-size="76" fill="#0B2A14">✅ TEETH: FIXED FOREVER</text></g>`;
      s += N.svg({ x: 540, y: 1860, scale: 0.46, t, expr: 'happy', teeth: 'fixed', armL: 2.6, armR: 2.6, blink: blinkAt(t), talk: 0 });
      return s;
    },
    waiting(t, k, tl) {
      let bubble = '';
      const bk = L.pop(t, sceneStart(t) + 1.0, 0.25);
      if (bk) bubble = `<g transform="translate(540 640) scale(${bk.toFixed(3)})">` +
        `<rect x="-440" y="-120" width="880" height="240" rx="40" fill="#FFFFFF" stroke="#000" stroke-width="8"/>` +
        `<circle cx="-350" cy="0" r="62" fill="#C77DFF" stroke="#000" stroke-width="6"/>` +
        `<text x="-350" y="26" text-anchor="middle" font-family="Anton" font-size="70" fill="#fff">M</text>` +
        `<text x="-260" y="-30" font-family="Anton" font-size="52" fill="#5B2A86">MAYA 💛</text>` +
        `<text x="-260" y="56" font-family="Anton" font-size="56" fill="#1A1410">was that u at the dentist?? 😂</text></g>`;
      return officeShot(t, [600, 1000, 1.1], { expr: 'happy', phone: true, phoneGlow: tl > 0.9, armR: 2.05, bendR: 0.75, look: { x: 0.6, y: -0.2 } }, null) + bubble;
    },
    maya2(t, k, tl) {
      const sh = tl < 0.4 ? Math.sin(t * 60) * 7 : 0;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` +
        officeShot(t, [NHEAD.x, NHEAD.y + 60, 2.0], { expr: 'shocked', phone: true, phoneGlow: true, armR: 2.05, bendR: 0.75,
          armL: 2.5 + Math.sin(t * 16) * 0.15, bendL: 0.5, squash: Math.max(0, 1 - tl / 0.2) }, null) + `</g>`;
    },
  });

  // Vote scene with this episode's options.
  const baseVote = SCENES.vote;
  SCENES.vote = function (t, k, tl) {
    let s = L.sunburst(t, '#6A2FB8', '#7B3FD0');
    const t0 = sceneStart(t);
    s += L.banner(t, EP.vote_title || 'WHAT SHOULD NORBERT FIX FIRST?', t0, 470, 62);
    const em = EP.vote_emoji || ['💇', '🦷', '✨', '🛏️'];
    const hi = Math.floor(tl / 0.6) % 4;
    EP.vote.forEach((w, i) => { s += L.chip(t, t0 + 0.25 + i * 0.22, 540, 680 + i * 215, 640, em[i], w, tl > 1.2 && i === hi); });
    s += N.svg({ x: 540 + Math.sin(t * 2) * 10, y: 1900, scale: 0.48, t, expr: 'happy', teeth: EP.look && EP.look.teeth || teethAt(t),
      armL: 2.7, armR: 2.7, bendL: 0.3, bendR: 0.3, blink: blinkAt(t), talk: 0 });
    return s;
  };
  void baseVote;
})();
