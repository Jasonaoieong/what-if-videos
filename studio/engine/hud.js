// HUD: hook, heading, odometer altimeter, readouts, word-by-word captions,
// fact cards, force labels. Every animation is a pure function of t
// (no CSS transitions) so frame-by-frame rendering is deterministic.
const $ = (id) => document.getElementById(id);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const easeOutBack = (u, c = 1.7) => 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
const easeOut = (u) => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const NUM_RE = /(−?\d[\d.,]*\d?\s?(?:°C|km\/h|km|meters|minutes|seconds|m\b|N\b)?|¼)/gi;
const KEY_RE = /^(terminal|velocity|slowing|down\.?|top|speed\.?|drag|gravity|lived\.?|debated\.?|strange|thicker\.?|stopped\.?|didn't\.?|east|sound\.?|pole\.?|oceans|continent|year\.?|night\.?|dinosaurs)$/i;
const PLACES = 5, DIG_H = 92;

export function buildHud(root, tl) {
  let odo = '';
  for (let p = PLACES - 1; p >= 0; p--) {
    odo += `<span class="col" id="col${p}"><span class="strip">${[0,1,2,3,4,5,6,7,8,9,0].map((d) => `<i>${d}</i>`).join('')}</span></span>`;
    if (p === 3) odo += '<span class="sep" id="sep">,</span>';
  }
  root.innerHTML = `
  <div id="vignette"></div><div id="danger"></div><div id="flash"></div>
  <div id="hook"></div>
  <div id="heading"><span></span></div>
  <div id="fact"><div class="ft"></div><div class="fv"></div><div class="fl"><i></i></div></div>
  <div id="tape">
    <div id="tapeLabel">ALTITUDE</div>
    <div id="tapeWin"><div id="ticks"></div><div id="tapeNeedle"></div></div>
    <div id="altNum"><span id="odo">${odo}</span><small id="altUnit"> m</small></div>
    <div class="ro"><label>SPEED</label><b id="spd">0</b><small>km/h</small></div>
    <div class="ro"><label>AIR DENSITY</label><b id="rho">34</b><small>% sea lvl</small></div>
    <div class="ro"><label>REAL TIME</label><b id="clk">0:00</b><small></small></div>
    <div id="spdBar"><i></i></div>
  </div>
  <div id="youMark"><i></i><span id="youTxt">YOU</span></div>
  <div id="evMark">EVEREST · 8,849 m</div>
  <div id="forces"><div class="fh">FORCES ON YOU</div>
    <div class="fb"><div class="bar g"><i></i></div><label>GRAVITY<b id="fGv"></b></label></div>
    <div class="fb"><div class="bar d"><i></i></div><label>AIR DRAG<b id="fDv"></b></label></div>
    <div id="fNet"></div></div>
  <div id="caption"></div><div id="sparks"></div>
  <div id="foot">SIMULATION · TIME COMPRESSED · STANDARD ATMOSPHERE</div>`;
  let html = '';
  const TK = tl?.counter?.ticks;   // {step, major, px} for short counters
  if (TK) for (let m = 0; m <= TK.max; m += TK.step) { const major = m % TK.major === 0;
    html += `<div class="tk${major ? ' mj' : ''}" style="bottom:${m * TK.px}px">${major ? m : ''}</div>`; }
  else {
  for (let m = 0; m <= 11000; m += 100) {
    const major = m % 1000 === 0;
    html += `<div class="tk${major ? ' mj' : ''}" style="bottom:${m * .5}px">${major ? (m / 1000) + 'k' : ''}</div>`;
  }
  html += `<div class="evr" style="bottom:${8849 * .5}px">EVEREST 8,849</div>`;
  }
  $('ticks').innerHTML = html;
  $('sparks').innerHTML = Array.from({ length: 14 }, () => '<i></i>').join('');
}

// ---- odometer: each digit column rolls; higher places roll during the last unit of the lower place
function odometer(v) {
  v = Math.max(0, v);
  for (let p = 0; p < PLACES; p++) {
    const base = Math.pow(10, p);
    let pos;
    if (p === 0) pos = v % 10;
    else {
      const r = v % base, whole = Math.floor(v / base) % 10;
      const carry = r > base - 1 ? smooth(r - (base - 1)) : 0;
      pos = whole + carry;
    }
    const col = $('col' + p);
    col.firstElementChild.style.transform = `translateY(${-pos * DIG_H}px)`;
    col.style.opacity = (p === 0 || v >= base - .5) ? 1 : 0;
    col.style.display = (p === 0 || v >= base - .5) ? 'inline-block' : 'none';
  }
  $('sep').style.display = v >= 999.5 ? 'inline-block' : 'none';
}

// ---- caption tokenizer: words with number groups kept as one chip
function tokens(text) {
  const out = []; let last = 0;
  text.replace(NUM_RE, (m, _g, i) => {
    if (i > last) text.slice(last, i).split(/\s+/).filter(Boolean).forEach((w) => out.push({ w, num: false }));
    out.push({ w: m.trim(), num: true }); last = i + m.length; return m;
  });
  text.slice(last).split(/\s+/).filter(Boolean).forEach((w) => out.push({ w, num: false }));
  // trailing punctuation glued to a chip goes back outside it
  return out.map((t) => ({ ...t, key: !t.num && KEY_RE.test(t.w) }));
}

export function updateHud(t, tl, st, seg) {
  // hook title
  const hook = $('hook');
  if (t < 2.9) {
    const inU = clamp(t / .25, 0, 1), outU = clamp((t - 2.4) / .5, 0, 1);
    if (!hook.dataset.k) { hook.innerHTML = tl.hook_text.replaceAll('\n', '<br>').replace(tl.hook_em || '10,000 METERS', `<em>${tl.hook_em || '10,000 METERS'}</em>`); hook.dataset.k = 1; }
    hook.style.opacity = (1 - outU);
    hook.style.transform = `translate(-50%,${-outU * 60}px) scale(${(.6 + .4 * easeOutBack(inU)) * (1 - outU * .25)})`;
    hook.style.filter = `blur(${outU * 6}px)`;
    hook.style.display = 'block';
  } else hook.style.display = 'none';

  // heading: slides in, letter-spacing settles
  const hd = $('heading'), hs = hd.firstElementChild;
  if (seg && seg.heading && t > 2.6) {
    const age = t - Math.max(seg.start, 2.6), out = clamp((seg.end - t) / .25, 0, 1);
    const u = easeOut(age / .4);
    if (hs.textContent !== seg.heading) hs.textContent = seg.heading;
    hd.style.opacity = u * out;
    hd.style.transform = `translate(-50%, ${(1 - u) * -24}px)`;
    hs.style.letterSpacing = (6 + (1 - u) * 10) + 'px';
  } else hd.style.opacity = 0;

  // fact card: discovery moment
  const fc = $('fact');
  if (seg && seg.fact) {
    const a = t - (seg.start + .6), dur = Math.min(3.4, seg.end - seg.start - .8);
    if (a >= 0 && a < dur) {
      const inU = easeOutBack(clamp(a / .35, 0, 1), 2.2), outU = smooth((a - (dur - .3)) / .3);
      fc.querySelector('.ft').textContent = seg.fact.title;
      fc.querySelector('.fv').textContent = seg.fact.value;
      fc.style.opacity = clamp(a / .15, 0, 1) * (1 - outU);
      fc.style.transform = `translateX(${(1 - inU) * -380 - outU * 40}px)`;
      fc.querySelector('.fl i').style.width = clamp(a / dur, 0, 1) * 100 + '%';
      fc.style.boxShadow = `0 0 ${40 * Math.exp(-a * 3)}px rgba(255,176,32,${.8 * Math.exp(-a * 3)})`;
    } else fc.style.opacity = 0;
  } else fc.style.opacity = 0;

  // altimeter
  const tapeOn = st.impactAge < 0 ? clamp((t - .5) / .4, 0, 1) : 1;
  $('tape').style.opacity = tapeOn;
  $('tapeLabel').textContent = st.label || tl.counter.label;
  $('altUnit').textContent = ' ' + (st.unit ?? tl.counter.unit);
  $('tapeWin').style.display = st.ro ? 'none' : '';
  odometer(st.h);
  $('ticks').style.transform = `translateY(${st.h * (tl.counter.ticks?.px || .5)}px)`;
  const ros = document.querySelectorAll('#tape .ro');
  if (st.ro) ros.forEach((r, i) => { const d = st.ro[i]; r.style.display = d ? '' : 'none'; if (d) { r.children[0].textContent = d[0]; r.children[1].textContent = d[1]; r.children[2].textContent = d[2]; } });
  else {
  $('spd').textContent = fmt(st.v * 3.6);
  $('rho').textContent = Math.round(st.rho / 1.225 * 100);
  const s = Math.floor(st.simT); $('clk').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  $('spdBar').firstElementChild.style.width = clamp(st.v / (tl.vmax || 90) * 100, 0, 100) + '%';
  const decel = st.a < -0.05;
  $('spd').className = decel ? 'decel' : (st.v > 80 ? 'hot' : '');
  const an = $('altNum');
  const DH = tl.danger_h ?? 1200;
  an.className = st.h < DH * .83 && st.impactAge < 0 && !st.ro ? 'red' : '';
  // thousand-mark pulse: glow swells briefly every time a new 1,000 m is crossed
  const sinceK = (st.h % 1000) / Math.max(st.v, 1);               // real s since crossing
  an.style.transform = `scale(${1 + .06 * Math.exp(-sinceK * 1.2)})`;

  // captions: word-by-word reveal, number chips with outline + bounce, key-word tint, sparks
  const cap = $('caption'), sparks = $('sparks');
  const c = t < 2.6 ? null : tl.captions.find((c) => t >= c.start && t < c.end + .25);
  sparks.style.opacity = 0;
  if (c) {
    const age = t - c.start, left = c.end + .25 - t;
    const outU = clamp(1 - left / .22, 0, 1);
    if (cap.dataset.k !== c.text) {
      const tk = tokens(c.text);
      cap.innerHTML = tk.map((x) => x.num ? `<span class="w chip"><b>${x.w}</b><s></s></span>` : `<span class="w${x.key ? ' key' : ''}">${x.w}</span>`).join(' ');
      cap.dataset.k = c.text;
    }
    const words = cap.querySelectorAll('.w'), n = words.length, span = Math.max(.25, (c.end - c.start) * .75);
    let chipAge = -1, chipEl = null;
    words.forEach((w, i) => {
      const wa = age - (i / n) * span;
      const u = clamp(wa / .16, 0, 1);
      w.style.opacity = u;
      const isChip = w.classList.contains('chip');
      const bounce = isChip ? 1 + .22 * Math.exp(-Math.max(wa, 0) * 7) * Math.cos(Math.max(wa, 0) * 22) * (wa > 0 ? 1 : 0) : 1;
      w.style.transform = `translateY(${(1 - easeOut(u)) * 28}px) scale(${(.7 + .3 * easeOutBack(u)) * (u >= 1 ? bounce : 1)})`;
      if (isChip) {
        w.querySelector('s').style.clipPath = `inset(0 ${100 - clamp(wa / .3, 0, 1) * 100}% 0 0)`;
        if (wa >= 0 && chipAge < 0) { chipAge = wa; chipEl = w; }
      }
    });
    cap.style.opacity = 1 - outU;
    cap.style.transform = `translate(-50%, ${-outU * 18}px)`;
    cap.style.filter = `blur(${outU * 4}px)`;
    // spark burst from the first number chip
    if (chipEl && chipAge < .6) {
      const r = chipEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      sparks.style.opacity = 1 - outU;
      [...sparks.children].forEach((d, i) => {
        const a = i / 14 * Math.PI * 2 + i * .37, dist = (60 + (i % 4) * 26) * easeOut(chipAge / .6);
        d.style.left = (cx + Math.cos(a) * (r.width / 2 + dist)) + 'px';
        d.style.top = (cy + Math.sin(a) * (r.height / 2 + dist * .6)) + 'px';
        d.style.opacity = 1 - chipAge / .6;
        d.style.transform = `scale(${1 - chipAge / .7})`;
      });
    }
  } else cap.style.opacity = 0;

  // force-balance gauge
  const fp = $('forces');
  if (st.forces) {
    fp.style.opacity = st.forces.op;
    fp.style.transform = `translateX(${(1 - easeOut(st.forces.op)) * -60}px)`;
    const mx = tl.force_max || 1000;
    fp.querySelector('.g i').style.width = clamp(st.weight / mx, 0, 1) * 100 + '%';
    fp.querySelector('.d i').style.width = clamp(st.drag / mx, 0, 1) * 100 + '%';
    $('fGv').textContent = fmt(st.weight) + ' N'; $('fDv').textContent = fmt(st.drag) + ' N';
    const net = st.weight - st.drag, n = $('fNet');
    const [txt, cls] = Math.abs(st.a) < 0.2 ? ['BALANCED · TERMINAL VELOCITY', 'bal'] : st.a > 0 ? ['GRAVITY WINS · SPEEDING UP', 'up'] : ['DRAG WINS · SLOWING DOWN', 'dn'];
    if (n.textContent !== txt) { n.textContent = txt; n.className = cls; n.dataset.t0 = t; }
    n.style.transform = `scale(${1 + .18 * Math.exp(-(t - (+n.dataset.t0 || 0)) * 5)})`;
  } else fp.style.opacity = 0;

  // danger + markers + flash
  $('danger').style.opacity = st.ro ? (st.danger || 0) : st.impactAge < 0 ? clamp((DH - st.h) / Math.max(DH, 1), 0, 1) * (.35 + .12 * Math.sin(t * 7)) : 0;
  const mk = $('youMark');
  if (st.marker) {
    if (tl.marker_label) $('youTxt').textContent = tl.marker_label;
    mk.style.display = 'block'; mk.style.left = st.marker.x + 'px'; mk.style.top = st.marker.y + 'px'; mk.style.opacity = st.marker.o;
    mk.firstElementChild.style.transform = `scale(${1 + .15 * Math.sin(t * 4)})`;
  } else mk.style.display = 'none';
  const ev = $('evMark');
  if (st.evMark) { ev.style.display = 'block'; ev.style.left = st.evMark.x + 'px'; ev.style.top = st.evMark.y + 'px'; ev.style.opacity = st.evMark.o; }
  else ev.style.display = 'none';
  const ia = st.impactAge;
  if (st.foot && $('foot').textContent !== st.foot) $('foot').textContent = st.foot;
  let fl = 0, black = 0;
  if (ia >= 0) { fl = ia < .06 ? 1 : Math.max(0, 1 - (ia - .06) / .3); black = ia < .9 ? clamp((ia - .1) / .2, 0, 1) * (1 - clamp((ia - .6) / .3, 0, 1)) : 0; }
  if (st.flashW) fl = Math.max(fl, st.flashW);
  if (st.noFlash) { fl = 0; black = 0; }
  $('flash').style.background = fl > black ? `rgba(255,255,255,${fl})` : `rgba(0,0,0,${black})`;
}
