// Day 3 scenes: SKIN. Extends SCENES from ep.html. Only active when the episode uses these scene names.
(function () {
  const INK = '#1A1410';
  function start(t) { return sceneAt(t).t0; }

  function bathroom(t, morning) {
    let s = `<rect x="-600" y="-600" width="2280" height="2100" fill="${morning ? '#CFE8EE' : '#9CC3CC'}"/>`;
    for (let y = -600; y < 1500; y += 90) for (let x = (y / 90) % 2 ? -645 : -600; x < 1680; x += 90)
      s += `<rect x="${x + 3}" y="${y + 3}" width="84" height="84" fill="${morning ? '#DDF0F4' : '#AACFD7'}"/>`;
    // window light
    if (morning) s += `<path d="M 760 -100 L 980 -100 L 1300 1500 L 900 1500 Z" fill="#FFF6D0" opacity="0.35"/>`;
    // shelf with products
    s += `<rect x="60" y="560" width="360" height="22" fill="#F2F2F2" stroke="${INK}" stroke-width="6"/>`;
    [['#E5483B', 80, 70], ['#5BE37D', 140, 90], ['#7FB3D5', 210, 60], ['#F7C548', 270, 100], ['#C77DFF', 340, 75]].forEach(([c, x, h]) => {
      s += `<rect x="${x}" y="${560 - h}" width="44" height="${h}" rx="8" fill="${c}" stroke="${INK}" stroke-width="5"/><rect x="${x + 12}" y="${560 - h - 18}" width="20" height="20" fill="#FFF" stroke="${INK}" stroke-width="4"/>`;
    });
    // towel
    s += `<path d="M 860 600 L 1000 600 L 990 900 L 870 900 Z" fill="#F7A6B4" stroke="${INK}" stroke-width="6"/>`;
    return s;
  }
  // counter + sink in the foreground (we are looking out of the mirror)
  function counter() {
    let s = `<rect x="-200" y="1250" width="1480" height="700" fill="#EDE6D8" stroke="${INK}" stroke-width="8"/>`;
    s += `<ellipse cx="540" cy="1300" rx="220" ry="40" fill="#C9D6DF" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="520" y="1190" width="40" height="70" fill="#9AA7B8" stroke="${INK}" stroke-width="5"/>`;
    // product pile
    [['#E5483B', 120, 110], ['#5BE37D', 190, 140], ['#F7C548', 830, 120], ['#7FB3D5', 900, 90], ['#C77DFF', 960, 150]].forEach(([c, x, h]) => {
      s += `<rect x="${x}" y="${1250 - h}" width="56" height="${h}" rx="10" fill="${c}" stroke="${INK}" stroke-width="5"/>`;
    });
    return s;
  }
  function bath(t, p, camv, extra = '', morning = false) {
    return `<g transform="${cam(...camv)}">` + bathroom(t, morning) + norbert(Object.assign({ teeth: 'fixed' }, p), t) + counter() + extra + `</g>`;
  }
  function steam(t) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.6 + i / 5) % 1, x = 380 + i * 80, y = 760 - ph * 300;
      s += `<path d="M ${x} ${y.toFixed(1)} q -14 -20 0 -40 q 14 -20 0 -40" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity="${(0.6 * Math.sin(ph * Math.PI)).toFixed(2)}"/>`;
    }
    return s;
  }

  window.glowAt = function (t) {
    const i = EP.lines.findIndex((l) => l.scene === 'meter' || l.scene === 'meter3');
    if (i < 0 || EP.glow_to == null) return EP.glow;
    const t0 = EP.lines[i].t0 - 0.12 + 0.6;
    return EP.glow + (EP.glow_to - EP.glow) * L.ease((t - t0) / 1.2);
  };

  Object.assign(SCENES, {
    recap3(t, k, tl) {
      const z = lerp(2.4, 2.1, L.ease(tl / 0.6));
      return bath(t, { expr: 'shocked', skin: 'acne', look: { x: 0, y: 0 }, talk: 0 }, [540, 860, z]) +
        L.banner(t, 'DAY 3 · YOU PICKED SKIN 🧴', 0.05, 560, 64);
    },
    bathroom(t, k, tl) {
      return bath(t, { expr: 'smug', skin: 'acne', armR: 2.3, bendR: -0.4, look: { x: 0.6, y: -0.5 } }, [540, 980, 1.25]);
    },
    mask(t, k, tl) {
      const on = tl > 0.25;
      let s = bath(t, { expr: 'awkward', skin: on ? 'mask' : 'acne', armL: 2.0, bendL: -0.8, armR: 2.0, bendR: -0.8 }, [540, 860, 2.0]);
      if (between(tl, 0.22, 0.5)) s += `<rect width="1080" height="1920" fill="#8BC34A" opacity="0.35"/>`;
      return s;
    },
    mask_burn(t, k, tl) {
      const sh = Math.sin(t * 40) * 4;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` + bath(t, { expr: 'panic', skin: 'mask', armL: 2.6, armR: 2.6, bendL: 0.5, bendR: 0.5 }, [540, 880, 1.9], steam(t)) + `</g>`;
    },
    pop(t, k, tl) {
      let s = bath(t, { expr: tl < 0.5 ? 'determined' : 'shocked', skin: 'acne', look: { x: 0, y: 0.2 } }, [540, 860, 2.4]);
      const fly = L.ease((tl - 0.4) / 0.25);
      if (tl > 0.4 && tl < 0.65) s += `<circle cx="${(560 + fly * 20).toFixed(0)}" cy="${(940 - fly * 40).toFixed(0)}" r="${(10 + fly * 80).toFixed(0)}" fill="#F4E9B0" stroke="#000" stroke-width="5"/>`;
      if (tl >= 0.65) {
        s += `<g transform="translate(560 900)"><path d="M -120 -20 Q -150 -110 -40 -100 Q 0 -170 60 -110 Q 160 -120 130 -20 Q 190 40 90 80 Q 60 150 -10 90 Q -100 140 -110 60 Q -190 20 -120 -20 Z" fill="#F4E9B0" stroke="#000" stroke-width="6" opacity="0.92"/>` +
          `<path d="M -40 80 L -44 ${(130 + (tl - 0.65) * 160).toFixed(0)} M 40 80 L 38 ${(110 + (tl - 0.65) * 120).toFixed(0)}" stroke="#F4E9B0" stroke-width="14" stroke-linecap="round"/></g>`;
        s += `<text x="540" y="560" text-anchor="middle" font-family="Anton" font-size="120" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">SPLAT</text>`;
      }
      return s;
    },
    sleep(t, k, tl) {
      let s = `<g transform="${cam(240, 1300, 1.6)}"><g transform="translate(0 150)">${L.room(t)}</g>`;
      s += `<g transform="rotate(-90 160 1310)">` + N.svg({ x: 160, y: 1310, scale: 0.45, t, expr: 'neutral', blink: 1, talk: 0, skin: 'mask', teeth: 'fixed', bob: 0 }) + `</g>`;
      for (let i = 0; i < 3; i++) {
        const ph = (tl * 0.7 + i / 3) % 1;
        s += `<text x="${(200 + ph * 120).toFixed(0)}" y="${(1180 - ph * 200).toFixed(0)}" font-family="Anton" font-size="${(40 + ph * 30).toFixed(0)}" fill="#FFFFFF" opacity="${(1 - ph).toFixed(2)}">Z</text>`;
      }
      s += `</g><rect width="1080" height="1920" fill="#0A1030" opacity="0.45"/>`;
      return s;
    },
    reveal_skin(t, k, tl) {
      let fx = '';
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + t * 1.4, r = 230;
        const g = L.pop(t, start(t) + 0.15 + i * 0.07, 0.2);
        if (g) fx += L.sparkle(540 + Math.cos(a) * r, 860 + Math.sin(a) * r * 0.8, (18 + (i % 2) * 10) * g, t * 100 + i * 40, i % 2 ? '#FFD23F' : '#FFFFFF');
      }
      return bath(t, { expr: 'happy', skin: 'clear', armL: 2.4, armR: 2.4, bendL: -0.3, bendR: -0.3 }, [540, 900, lerp(1.6, 1.9, L.ease(k))], fx, true);
    },
    meter3(t, k, tl) {
      let s = L.sunburst(t, '#1E78D2', '#2A8BE6');
      const g = glowAt(t);
      s += `<g transform="translate(540 760) scale(${L.pop(t, start(t) + 0.1, 0.3).toFixed(3)})">`;
      s += `<text x="0" y="-120" text-anchor="middle" font-family="Anton" font-size="110" fill="#FFFFFF" stroke="#000" stroke-width="14" paint-order="stroke">GLOW-UP METER</text>`;
      s += `<rect x="-420" y="-40" width="840" height="110" rx="55" fill="#141B2D" stroke="#000" stroke-width="10"/>`;
      s += `<rect x="-405" y="-25" width="${Math.max(80, 810 * g / 100).toFixed(1)}" height="80" rx="40" fill="#5BE37D"/>`;
      s += `<text x="0" y="330" text-anchor="middle" font-family="Anton" font-size="300" fill="#FFD23F" stroke="#000" stroke-width="22" paint-order="stroke">${Math.round(g)}%</text></g>`;
      const ck = L.pop(t, start(t) + 1.6, 0.25);
      if (ck) s += `<g transform="translate(540 1230) scale(${ck.toFixed(3)})"><rect x="-380" y="-64" width="760" height="128" rx="30" fill="#5BE37D" stroke="#000" stroke-width="8"/>` +
        `<text x="0" y="30" text-anchor="middle" font-family="Anton" font-size="76" fill="#0B2A14">✅ SKIN: CLEARED FOREVER</text></g>`;
      s += N.svg({ x: 540, y: 1860, scale: 0.46, t, expr: 'happy', teeth: 'fixed', skin: 'clear', armL: 2.6, armR: 2.6, blink: blinkAt(t), talk: 0 });
      return s;
    },
    maya3(t, k, tl) {
      let bubble = '';
      const bk = L.pop(t, start(t) + 0.5, 0.25);
      if (bk) bubble = `<g transform="translate(540 640) scale(${bk.toFixed(3)})">` +
        `<rect x="-450" y="-120" width="900" height="240" rx="40" fill="#FFFFFF" stroke="#000" stroke-width="8"/>` +
        `<circle cx="-360" cy="0" r="62" fill="#C77DFF" stroke="#000" stroke-width="6"/><text x="-360" y="26" text-anchor="middle" font-family="Anton" font-size="70" fill="#fff">M</text>` +
        `<text x="-270" y="-30" font-family="Anton" font-size="52" fill="#5B2A86">MAYA 💛</text>` +
        `<text x="-270" y="56" font-family="Anton" font-size="52" fill="#1A1410">smoothies after school tmrw? 🥤</text></g>`;
      return bath(t, { expr: 'happy', skin: 'clear', phone: true, phoneGlow: true, armR: 2.05, bendR: 0.75, look: { x: 0.6, y: -0.2 } }, [560, 1000, 1.2], '', true) + bubble;
    },
    hair_panic(t, k, tl) {
      const sh = tl < 0.4 ? Math.sin(t * 60) * 7 : 0;
      let arrows = '';
      const a = L.pop(t, start(t) + 0.3, 0.2);
      if (a) arrows = `<g transform="translate(820 520) scale(${a.toFixed(3)}) rotate(20)"><path d="M 0 0 L -120 60 L -90 20 L -200 20 L -200 -20 L -90 -20 L -120 -60 Z" fill="#FFD23F" stroke="#000" stroke-width="6"/></g>` +
        `<text x="760" y="440" font-family="Anton" font-size="70" fill="#FFD23F" stroke="#000" stroke-width="10" paint-order="stroke">THIS</text>`;
      return `<g transform="translate(${sh.toFixed(1)} 0)">` +
        bath(t, { expr: 'panic', skin: 'clear', armL: 2.6, armR: 2.6, bendL: 0.5, bendR: 0.5 }, [540, 760, 2.0], L.flies(t, 540, 560, 3), true) + `</g>` + arrows;
    },
  });
})();
