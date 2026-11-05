// "What if the Earth stopped spinning?" — globe + surface scenes, deterministic renderAt(t).
import * as THREE from 'three';
import { makeSky, makeGround, makeClouds, makeTrees, makeDust, updateDust, cloudTexture, rng } from './world.js';
import { makeFaller, poseFaller } from './character.js';
import { buildHud, updateHud } from './hud.js';

const params = new URLSearchParams(location.search);
const EP = params.get('ep');
const SCALE = parseFloat(params.get('scale') || '1') * parseFloat(params.get('r3d') || '1');
const tl = await (await fetch(`${EP}/timeline.json?${Date.now()}`)).json();
const R = 6371, V_EQ = 1674.4;                        // km, km/h at the equator
for (const s of tl.segments) s.shot = s.camera;
const segs = tl.segments, LAST = segs[segs.length - 1];
const segAt = (t) => segs.find((s) => t >= s.start && t < s.end) || LAST;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const lerp = (a, b, u) => a + (b - a) * u;
const segBy = (shot) => segs.find((s) => s.shot === shot);
const segU = (s, t) => s ? clamp((t - s.start) / (s.end - s.start)) : 0;

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('gl');
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
canvas.style.width = '1080px'; canvas.style.height = '1920px';
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const camera = new THREE.PerspectiveCamera(35, 1080 / 1920, 0.05, 2e6);

// ---------------------------------------------------------------- SPACE scene
const space = new THREE.Scene();
const sunDir = new THREE.Vector3(1, .22, .55).normalize();
const NOISE = `
float h3(vec3 p){ p = fract(p*.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vn(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<6;i++){ s+=a*vn(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return s; }`;
const globeMat = new THREE.ShaderMaterial({
  uniforms: { uSun: { value: sunDir.clone() }, uMorph: { value: 0 }, uLat: { value: -1 }, uLatOn: { value: 0 }, uEq: { value: 0 }, uT: { value: 0 }, uDrain: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vObj; varying vec3 vW;
    void main(){ vObj = normalize(position); vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz;
      gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; uniform float uMorph, uLat, uLatOn, uEq, uT, uDrain; varying vec3 vN; varying vec3 vObj; varying vec3 vW; ${NOISE}
    void main(){
      vec3 p = vObj; float lat = asin(clamp(p.y,-1.,1.)); float c2 = cos(lat)*cos(lat);
      float hgt = fbm(p*1.7+vec3(3.,1.,7.)) - .53 + .12*(fbm(p*6.)-.5);
      float h2 = hgt + uMorph*.42*(c2 - .66) + uDrain*.62;  // spin bulge gone: water drains poleward; uDrain lowers sea level
      float land = smoothstep(-.004,.004,h2);
      float alat = abs(lat);
      vec3 deep = vec3(.01,.05,.16), shal = vec3(.02,.20,.38);
      vec3 ocean = mix(deep, shal, smoothstep(-.12,0.,h2));
      float dry = smoothstep(.25,.05,abs(alat-.42)) * smoothstep(.45,.75,fbm(p*3.+5.));
      vec3 green = mix(vec3(.10,.24,.07), vec3(.20,.30,.10), fbm(p*9.));
      vec3 sand = vec3(.62,.50,.32), rock = vec3(.38,.31,.24);
      vec3 seabed = mix(vec3(.42,.38,.33), vec3(.30,.33,.22), fbm(p*7.));
      vec3 grd = mix(green, sand, dry); grd = mix(grd, seabed, uMorph*smoothstep(.02,-.08,hgt)); grd = mix(grd, rock, smoothstep(.10,.25,hgt + uMorph*.42*(c2 - .66)));
      // drained ocean floor: sediment plains, dark trenches, pale volcanic ridge seams
      float wasSea = uDrain*smoothstep(.0,-.02,hgt);
      float rdg = exp(-pow((fbm(p*2.1+vec3(9.,4.,2.))-.5)/.016,2.));
      vec3 floorC = mix(vec3(.46,.40,.33), vec3(.33,.29,.25), fbm(p*11.));
      floorC = mix(floorC, vec3(.12,.10,.10), smoothstep(-.18,-.42,hgt));
      floorC = mix(floorC, vec3(.78,.70,.58), rdg*smoothstep(-.04,-.12,hgt));
      grd = mix(grd, floorC, wasSea);
      vec3 col = mix(ocean, grd, land);
      col = mix(col, vec3(.92,.95,1.), smoothstep(1.18,1.3,alat + .08*fbm(p*8.)));   // ice caps
      vec3 N = normalize(vN), L = normalize(uSun), Vv = normalize(cameraPosition - vW);
      float d = dot(N,L), lit = smoothstep(-.06,.25,d);
      vec3 c = col*(.05 + 1.25*max(d,0.));
      vec3 Hh = normalize(L+Vv); c += (1.-land)*pow(max(dot(N,Hh),0.),140.)*vec3(1.,.9,.75)*.35*lit;
      float city = land*step(0.,hgt)*step(.9, vn(p*520.))*smoothstep(.35,.7,fbm(p*14.))*(1.-smoothstep(1.0,1.25,alat));
      c += (1.-lit)*city*vec3(1.,.7,.35)*1.4;               // night-side city lights
      float ring = uLatOn*exp(-pow((lat-uLat)/.012,2.));       // latitude line
      c = mix(c, vec3(1.,.69,.13)*1.6, ring);
      c = mix(c, vec3(1.,.69,.13)*1.3, uEq*exp(-pow(lat/.008,2.)));
      float rim = pow(1.-max(dot(N,Vv),0.),3.); c += rim*vec3(.3,.55,1.)*.6*lit;
      gl_FragColor = vec4(c,1.);
    }`,
});
const earth = new THREE.Group(); space.add(earth);
earth.add(new THREE.Mesh(new THREE.SphereGeometry(R, 192, 128), globeMat));
const cloudMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: { uSun: { value: sunDir.clone() }, uMorph: { value: 0 }, uFade: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vObj; void main(){ vObj = normalize(position); vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uSun; uniform float uFade; varying vec3 vN; varying vec3 vObj; ${NOISE}
    void main(){ vec3 p = vObj; float lat = asin(clamp(p.y,-1.,1.));
      float band = .55 + .45*abs(sin(lat*3.));
      float n = fbm(p*4.+vec3(0.,0.,0.) + fbm(p*2.)*1.2);
      float a = smoothstep(.52,.75,n)*band; float lit = smoothstep(-.05,.3,dot(normalize(vN),normalize(uSun)));
      gl_FragColor = vec4(vec3(1.)*(.08+lit), a*.85*uFade); }`,
});
const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.009, 160, 100), cloudMat); space.add(cloudShell);
const atmo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 128, 64), new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uSun: { value: sunDir.clone() } },
  vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
    void main(){ vec3 V = normalize(cameraPosition - vW); float f = pow(1.-abs(dot(normalize(vN),V)), 2.2);
      float lit = smoothstep(-.35,.4,dot(normalize(vW),normalize(uSun)));
      gl_FragColor = vec4(vec3(.32,.6,1.)*f*lit*1.6, 1.); }`,
})); space.add(atmo);
{ // stars
  const n = 5000, pos = new Float32Array(n * 3), r = rng(77), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const v = new THREE.Vector3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(9e5); pos.set([v.x, v.y, v.z], i * 3); const b = .4 + r() * .6; col.set([b, b, b * (1 + r() * .2)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  space.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, depthWrite: false })));
}
const sunSprite = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(.12, 'rgba(255,235,190,.9)'); g.addColorStop(.4, 'rgba(255,200,140,.15)'); g.addColorStop(1, 'rgba(255,190,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(1.6e5); space.add(s); return s;
})();
// all of Earth's water as one sphere: diameter ≈ 1,384 km (USGS)
const waterBall = tl.water_ball ? (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1384 / 2, 96, 64), new THREE.MeshPhysicalMaterial({
  color: 0x2a7fd6, roughness: .08, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, emissive: 0x0a2a55, emissiveIntensity: .6 }));
  m.visible = false; space.add(m); return m; })() : null;
if (waterBall) { const l = new THREE.DirectionalLight(0xffffff, 3.2); l.position.copy(sunDir).multiplyScalar(1e5); space.add(l, new THREE.AmbientLight(0x6688aa, .5)); }
// "YOU" pin on the equator (child of the earth so it spins with it)
const pin = new THREE.Mesh(new THREE.SphereGeometry(55, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffb020, toneMapped: false }));
earth.add(pin);

// ---------------------------------------------------------------- SURFACE scene
const surf = new THREE.Scene();
const haze = new THREE.Color(.75, .82, .92);
surf.fog = new THREE.Fog(haze, 800, 30000);
const sky = makeSky(); surf.add(sky);
const ground = makeGround(); surf.add(ground);
const sclouds = makeClouds(); surf.add(sclouds);
surf.add(makeTrees());
const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x6b5a45, 1.3); surf.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 3.0); surf.add(sun, sun.target);
const person = makeFaller(); surf.add(person);
// debris thrown along with you: planks, boxes, leaves (instanced)
const DEB = 220, deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: .9 }), DEB);
const debSeed = []; { const r = rng(5), c = new THREE.Color();
  for (let i = 0; i < DEB; i++) { debSeed.push([(r() - .5) * 160, r() * 40, (r() - .5) * 120, .82 + r() * .3, r() * 9, .2 + r() * 1.6, r()]);
    deb.setColorAt(i, c.setHSL(r() < .5 ? .08 : .25, .4, .2 + r() * .25)); } }
deb.frustumCulled = false; surf.add(deb);
// speed streaks (horizontal)
const STR = 300, strGeo = new THREE.BufferGeometry(); strGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STR * 6), 3));
const streaks = new THREE.LineSegments(strGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45, depthWrite: false, fog: false }));
streaks.frustumCulled = false; surf.add(streaks);
const strSeed = []; { const r = rng(11); for (let i = 0; i < STR; i++) strSeed.push([r() * 200, (r() - .5) * 40, (r() - .5) * 60, .5 + r() * .5]); }
// dust wall: stacked noisy sheets racing east
function dustWallTex(seed) {        // billowing brown wall, ragged top edge
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const x = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 900; i++) {
    const px = r() * 2048, top = 120 + 90 * Math.sin(px / 140 + seed) + 60 * Math.sin(px / 47), py = top + Math.pow(r(), .7) * (512 - top), rad = 30 + r() * 90;
    const l = 22 + r() * 30, g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, `hsla(28,38%,${l}%,.55)`); g.addColorStop(.6, `hsla(28,34%,${l - 6}%,.25)`); g.addColorStop(1, 'hsla(28,30%,20%,0)');
    x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    if (px < rad) { x.save(); x.translate(2048, 0); x.fillRect(px - rad, py - rad, rad * 2, rad * 2); x.restore(); }   // wrap seam
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const dustTex = dustWallTex(3);
const wall = new THREE.Group(); surf.add(wall);
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 620), new THREE.MeshBasicMaterial({ map: dustTex, color: new THREE.Color(1, 1, 1),
    transparent: true, opacity: .9, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.rotation.y = Math.PI / 2; m.position.set(-i * 26, 240 - (i % 3) * 40 + i * 6, (i % 2) * 300); m.material.map = dustWallTex(10 + i); m.material.map.repeat.set(3, 1);
  m.material.map.offset.set(i * .37, 0); m.material.map.needsUpdate = true; wall.add(m);
}
const dustP = makeDust(140); surf.add(dustP);

buildHud(document.getElementById('hud'));

// ---------------------------------------------------------------- time → world state
const SPIN_STOP = 1.35;   // hook: the planet halts here
const FASTER = tl.spin_mode === 'faster';
const NORMAL = tl.spin_mode === 'normal';    // Earth just spins as it does today (no stop, no spin-up)
const SLOW = tl.spin_mode === 'slow';        // spin winds down to a crawl (a day as long as a year)
function spinAngle(t) {   // fast (stylised) spin decelerating to a dead stop
  const w0 = 1.2;          // rad/s on screen
  if (NORMAL) return .12 * t;
  if (SLOW) { const T = 3.5; return t < T ? .5 * (t - t * t / (2 * T)) + .004 * t : .5 * T / 2 + .004 * t; }
  if (FASTER) {           // spin-up: slow → ever faster, eases back down in the ending
    const es = segs.find((s) => s.shot === 'ending'), te = es ? es.start : 1e9;
    const a = (x) => .15 * x + .004 * x * x * x / 3;      // ∫(.15 + .004 x²)
    if (t < te) return a(t);
    const w1 = .15 + .004 * te * te, d = t - te;           // decelerate smoothly to a gentle normal spin
    return a(te) + w1 * d - (w1 - .15) * (d - (1 - Math.exp(-d * .8)) / .8) ;
  }
  if (t >= SPIN_STOP) return w0 * SPIN_STOP / 2;
  return w0 * (t - t * t / (2 * SPIN_STOP));
}
const sph = (r, az, el) => new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(r);
const AZ = .55;                              // camera azimuth for the "front" of the globe

function counterAt(t, s) {
  const v = rawCounter(t, s), i = segs.indexOf(s), p = segs[i - 1];
  if (!p) return v;
  // odometer rolls quickly from the previous beat's value into the new one
  return lerp(rawCounter(p.end - 1e-3, p), v, sm((t - s.start) / .5));
}
function rawCounter(t, s) {
  const u = segU(s, t), c = s.counter;
  if (c.rate) return c.rate * Math.max(0, t - s.start);
  return lerp(c.from, c.to, c.ease === 'out' ? easeOut(u * 1.15) : sm(u));
}

function globeCam(shot, u, t, s) {
  switch (shot) {
    case 'space': return { pos: sph(R * lerp(7.4, 6.3, easeOut(u)), AZ + .08 * u, .22), look: new THREE.Vector3(), fov: 34 };
    case 'zoom': {
      const k = sm(u), r = Math.exp(lerp(Math.log(6.3 * R), Math.log(R * 1.012), Math.pow(k, 1.4)));
      const pos = sph(r, AZ + .08 + .1 * k, lerp(.22, .03, k));
      const look = new THREE.Vector3().lerp(sph(R * 1.0, AZ + .45, .0), Math.pow(k, 1.6));
      return { pos, look, fov: lerp(34, 60, k) };
    }
    case 'latitude': return { pos: sph(6.2 * R, AZ + .1 * u, lerp(.12, .62, sm(u))), look: new THREE.Vector3(0, R * .25 * sm(u), 0), fov: 34 };
    case 'oceans': return { pos: sph(6.2 * R, AZ + .4 + .9 * u, lerp(.55, .3, sm(u))), look: new THREE.Vector3(), fov: 34 };
    case 'day': return { pos: sph(6.6 * R, Math.atan2(sunDir.x, sunDir.z) - .9, .12), look: new THREE.Vector3(), fov: 34 };
    case 'orbit': return { pos: sph(R * lerp(3.3, 2.9, sm(u)), sunAz() - .35 + .3 * u, lerp(.42, .3, sm(u))), look: sph(R * .3, sunAz() - .1 + .3 * u, .05), fov: 40 };
    case 'tilt': return { pos: sph(R * lerp(5.6, 5.0, sm(u)), sunAz() - .55 - .2 * u, lerp(-.5, -.38, sm(u))), look: new THREE.Vector3(), fov: 36 };
    case 'ending': return { pos: sph(lerp(6.1, 7.2, sm(u)) * R, sunAz() + .55 - .25 * u, lerp(.12, .3, sm(u))), look: new THREE.Vector3(), fov: 34 };
  }
}
const sunAz = () => { const v = globeMat.uniforms.uSun.value; return Math.atan2(v.x, v.z); };
const SURF_SHOTS = new Set(['flung', 'wind', 'float']);
const GLOBE = new Set(['space', 'zoom', 'latitude', 'oceans', 'day', 'ending', 'orbit', 'tilt']);

function update(t) {
  const s = segAt(t), u = segU(s, t), shot = s.shot;
  const st = { simT: t, impactAge: -1, h: counterAt(t, s), v: s.wind || 0, label: s.counter.label, unit: s.counter.unit, ro: [], a: 0 };
  // readouts
  if (tl.readout === 'none') {}
  else if (FASTER || SLOW) st.ro.push(['DAY LENGTH', (s.dayH ?? 24).toLocaleString('en-US'), 'h']); else if (NORMAL) st.ro.push(['SPIN AT EQUATOR', '1,674', 'km/h']); else st.ro.push(['EARTH SPIN', t < SPIN_STOP ? Math.round(V_EQ * (1 - t / SPIN_STOP)).toLocaleString('en-US') : '0', 'km/h']);
  if (shot === 'latitude') st.ro.push(['LATITUDE', Math.round(90 * sm(u * 1.1)) + '°', 'N']);
  if (shot === 'flung' || shot === 'wind') st.ro.push(['SPEED OF SOUND', '1,235', 'km/h']);
  if (shot === 'day') st.ro.push(['DAYLIGHT', Math.round(lerp(12, 4383, sm(u))).toLocaleString('en-US'), 'h']);
  st.foot = 'SIMULATION · NOT TO SCALE IN TIME';

  let scene;
  if (GLOBE.has(shot)) {
    scene = space;
    // earth rotation: hook spin → stop; resumes gently at the ending
    let ang = spinAngle(t);
    const es = segBy('ending'); if (es && t > es.start && !FASTER && !NORMAL && !SLOW) ang += .03 * Math.pow(t - es.start, 2);
    earth.rotation.y = ang;
    // the atmosphere keeps going after the stop (clouds drift on)
    cloudShell.rotation.y = FASTER || NORMAL || SLOW ? ang * .97 : t < SPIN_STOP ? ang : ang + (t - SPIN_STOP) * .09;
    // sun: sweeps around during the "1 day = 1 year" beat
    const ds = segBy('day'); let sd = sunDir.clone();
    if (ds && t > ds.start) sd.applyAxisAngle(new THREE.Vector3(0, 1, 0), -1.9 * sm((Math.min(t, ds.end) - ds.start) / (ds.end - ds.start)));
    globeMat.uniforms.uSun.value.copy(sd); cloudMat.uniforms.uSun.value.copy(sd); atmo.material.uniforms.uSun.value.copy(sd);
    sunSprite.position.copy(sd).multiplyScalar(6e5);
    // ocean migration morph (and back for the ending)
    const os = segBy('oceans');
    let morph = (tl.morph_sign ?? 1) * (os ? sm((t - os.start - .4) / ((os.end - os.start) * .7)) : 0);
    if (es && t > es.start) morph *= 1 - sm((t - es.start) / 2.5);
    globeMat.uniforms.uMorph.value = morph;
    // ocean drain: sea level falls through the 'oceans' beat and stays down
    if (tl.drain) { const d0 = os ? os.start + .3 : 1e9, d1 = os ? os.end - .2 : 1e9; globeMat.uniforms.uDrain.value = Math.pow(sm((t - d0) / (d1 - d0)), 1.7); }
    cloudMat.uniforms.uFade.value = tl.drain ? 1 - .75 * globeMat.uniforms.uDrain.value : 1;
    // all of Earth's water gathered into one ball (USGS): rests on the globe facing the camera
    if (waterBall) { const on = es && t > es.start + .6 ? sm((t - es.start - .6) / 1.2) : 0; waterBall.visible = on > 0;
      waterBall.scale.setScalar(Math.max(on, 1e-3)); }
    // latitude line sweeps from the equator to the pole
    const ls = segBy('latitude');
    globeMat.uniforms.uLatOn.value = ls && t > ls.start - .3 && t < ls.end + .3 ? clamp((t - ls.start + .3) / .4) * clamp((ls.end + .3 - t) / .4) : 0;
    globeMat.uniforms.uLat.value = ls ? (Math.PI / 2) * sm(segU(ls, t) * 1.1) : 0;
    globeMat.uniforms.uEq.value = shot === 'zoom' ? clamp(u * 3) * (1 - clamp((u - .8) * 5)) : 0;
    // pin: on the equator facing the zoom target
    const pinLon = AZ + .45 - earth.rotation.y;
    pin.position.copy(sph(R * 1.002, pinLon, 0)); pin.visible = shot === 'zoom' || shot === 'space' && t > SPIN_STOP;
    pin.scale.setScalar(shot === 'zoom' ? lerp(1, .1, sm(u)) : 1);
    // camera with smooth blend from the previous globe shot
    let c = globeCam(shot, u, t, s);
    const si = segs.indexOf(s), prev = segs[si - 1];
    if (prev && GLOBE.has(prev.shot) && prev.shot !== shot && t - s.start < 1.2) {
      const p = globeCam(prev.shot, 1, t, prev), k = sm((t - s.start) / 1.2);
      const r0 = p.pos.length(), r1 = c.pos.length(), d = p.pos.clone().normalize().lerp(c.pos.clone().normalize(), k).normalize();
      c = { pos: d.multiplyScalar(Math.exp(lerp(Math.log(r0), Math.log(r1), k))), look: p.look.clone().lerp(c.look, k), fov: lerp(p.fov, c.fov, k) };
    }
    // hook jolt when the planet stops
    const jolt = t > SPIN_STOP && !NORMAL && !SLOW && !tl.drain ? Math.exp(-(t - SPIN_STOP) * 5) * Math.sin((t - SPIN_STOP) * 60) : 0;
    c.pos.add(new THREE.Vector3(jolt * 140, jolt * 90, 0));
    if (waterBall) { const d = c.pos.clone().sub(c.look).normalize(), side = new THREE.Vector3(0, 1, 0).cross(d).normalize();
      waterBall.position.copy(d.multiplyScalar(R + 692 * 1.02).add(side.multiplyScalar(R * .18)).normalize().multiplyScalar(R + 692 * .98)); }
    camera.position.copy(c.pos); camera.up.set(0, 1, 0); camera.fov = c.fov; camera.near = Math.max(1, (c.pos.length() - R * 1.06) * .5); camera.far = c.pos.length() + R * 4; camera.lookAt(c.look);
    // atmosphere entry flash at the end of the zoom; flash back out of the surface
    if (shot === 'zoom' && !s.noflash) st.flashW = clamp((u - .86) / .14);
    if (prev && !GLOBE.has(prev.shot)) st.flashW = 1 - clamp((t - s.start) / .45);
  } else {
    scene = surf;
    const sinceIn = t - s.start;
    if (shot === 'float') {
      // spinning faster: you get lighter and lighter and drift off the ground
      const lift = Math.pow(clamp(sinceIn / (s.end - s.start)), 2.2) * (s.liftTo ?? 6);
      const P = new THREE.Vector3(0, 1.0 + lift, 30);
      person.visible = true; person.position.copy(P); poseFaller(person, t, 5, .4);
      person.rotation.set(-1.25 + Math.sin(t * .8) * .15 + lift * .05, .4 + t * .05, Math.sin(t * .6) * .1);
      const cp = P.clone().add(new THREE.Vector3(5.5 + Math.sin(t * .3), 1.2 - lift * .35, 6.5)); cp.y = Math.max(cp.y, .6);
      camera.position.copy(cp); camera.fov = 52; camera.near = .3; camera.far = 9e5; camera.up.set(0, 1, 0);
      camera.lookAt(P.clone().add(new THREE.Vector3(0, .6, 0)));
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      debSeed.forEach(([dx, dy, dz, sp, rs, sz, ty], i) => {            // pebbles, leaves, dust rising with you
        const up = Math.pow(clamp(sinceIn / (s.end - s.start) * (.6 + ty * .8)), 2) * (dy * .25 + 2) * (s.liftTo ?? 6) / 4;
        e.set(t * rs * .2, t * rs * .15, 0); q.setFromEuler(e);
        m.compose(new THREE.Vector3(dx * .15, .1 + up, 30 + dz * .12), q, new THREE.Vector3(sz * .15, sz * .05, sz * .12)); deb.setMatrixAt(i, m);
      });
      deb.instanceMatrix.needsUpdate = true; deb.visible = true; wall.visible = false; dustP.visible = false;
      surf.fog.color.copy(haze); surf.fog.near = 800; surf.fog.far = 30000; streakUpdate(P, 0);
      st.flashW = 1 - clamp(sinceIn / .45);
    } else if (shot === 'flung') {
      // you keep the planet's old speed: 465 m/s east, tumbling, a few metres up
      const x = -1100 + 465 * sinceIn, y = 14 + 6 * Math.sin(sinceIn * 1.3);
      const P = new THREE.Vector3(x, y, 0);
      person.visible = true; person.position.copy(P);
      poseFaller(person, t, 80, .9);
      person.rotation.set(sinceIn * 2.1, sinceIn * .7, Math.sin(sinceIn * 1.7) * 1.2);
      const cp = P.clone().add(new THREE.Vector3(-7 + Math.sin(t * .8) * .6, 2.2, 6.5 + Math.sin(t * .5)));
      camera.position.copy(cp); camera.fov = 62; camera.near = .3; camera.far = 9e5; camera.up.set(0, 1, 0);
      camera.lookAt(P.clone().add(new THREE.Vector3(3, -1.5, 0)));
      // debris travelling with you (slightly slower → drifts back past camera)
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      debSeed.forEach(([dx, dy, dz, sp, rs, sz, ty], i) => {
        const along = ((dx + (sp - 1) * 465 * sinceIn * .25) % 160 + 240) % 160 - 80;
        e.set(t * rs, t * rs * .7, 0); q.setFromEuler(e);
        const scl = ty < .3 ? new THREE.Vector3(sz * 2.5, sz * .15, sz * .4) : ty < .6 ? new THREE.Vector3(sz * .6, sz * .6, sz * .6) : new THREE.Vector3(sz * .3, sz * .02, sz * .3);
        m.compose(new THREE.Vector3(P.x + along, Math.max(.5, P.y + dy - 20), dz), q, scl); deb.setMatrixAt(i, m);
      });
      deb.instanceMatrix.needsUpdate = true; deb.visible = true;
      wall.visible = false; dustP.visible = false;
      surf.fog.color.copy(haze); surf.fog.near = 800; surf.fog.far = 30000;
      streakUpdate(P, 1);
      st.flashW = 1 - clamp(sinceIn / .45);
    } else { // wind: static camera on the ground, a wall of dust arrives at 465 m/s
      person.visible = false; deb.visible = true;
      const xf = -2300 + 465 * sinceIn;                       // front position
      wall.visible = true; wall.position.x = xf;
      wall.children.forEach((m, i) => { m.material.map.offset.x = i * .37 + t * .4; m.material.opacity = .9 * clamp((xf + 2200) / 600); });
      const cp = new THREE.Vector3(60 + Math.sin(t * .4) * .5, 2.0, 40);
      const shake = clamp((xf + 300) / 400) * (1 - clamp((xf - 300) / 2000));
      cp.add(new THREE.Vector3(Math.sin(t * 37) * .08 * shake, Math.sin(t * 29) * .06 * shake, 0));
      camera.position.copy(cp); camera.fov = 58; camera.near = .3; camera.far = 9e5; camera.up.set(0, 1, 0);
      camera.lookAt(new THREE.Vector3(-400, 60 + 40 * sm(sinceIn / 3), 0));
      // after the front passes the camera: brown-out
      const inside = clamp((xf - 40) / 250);
      surf.fog.color.copy(haze).lerp(new THREE.Color(.55, .43, .32), inside);
      surf.fog.near = lerp(800, 5, inside); surf.fog.far = lerp(30000, 260, inside);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      debSeed.forEach(([dx, dy, dz, sp, rs, sz, ty], i) => {
        const x = xf + 40 - ((dx + 80) * 6 * (1 + ty)) + (t * 40 % 30);
        e.set(t * rs, t * rs * .7, 0); q.setFromEuler(e);
        m.compose(new THREE.Vector3(x, 1 + dy * 1.5, dz * 2 + 40), q, new THREE.Vector3(sz, sz * .3, sz * .6)); deb.setMatrixAt(i, m);
      });
      deb.instanceMatrix.needsUpdate = true;
      dustP.visible = xf > -60; updateDust(dustP, new THREE.Vector3(Math.min(xf, 60), 1, 40), clamp((xf + 100) / 400) * 1.5);
      streakUpdate(new THREE.Vector3(Math.min(xf + 50, 70), 6, 40), clamp((xf + 200) / 300));
      st.danger = inside * .25;
      st.flashW = 1 - clamp(sinceIn / .3);
    }
    sky.position.copy(camera.position); sky.material.uniforms.uAlt.value = camera.position.y; sky.material.uniforms.uDanger.value = 0;
    ground.material.uniforms.uCam.value.copy(camera.position); ground.material.uniforms.uHaze.value.copy(surf.fog.color);
    ground.material.uniforms.uHazeDist.value = surf.fog.far * .9;
    sun.position.copy(camera.position).addScaledVector(sunDir, 50); sun.target.position.copy(camera.position);
    // clouds race overhead with the still-moving atmosphere
    sclouds.position.x = 465 * (t - s.start) * .6;
  }
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return { st, s, scene };
}
function streakUpdate(P, op) {
  const pos = strGeo.attributes.position;
  strSeed.forEach(([x0, y, z, k], i) => {
    const xx = P.x + ((x0 * 7 - window.__t * 465 * k * .35) % 200 + 200) % 200 - 100;
    pos.setXYZ(i * 2, xx, P.y + y, P.z + z); pos.setXYZ(i * 2 + 1, xx - 12 * k, P.y + y, P.z + z);
  });
  pos.needsUpdate = true; streaks.material.opacity = .45 * op; streaks.visible = op > .01;
}

// ---------------------------------------------------------------- motion blur + entry
const MB = parseInt(params.get('mb') || '1'), FPS = tl.fps || 30;
const mbTex = [], mbScene = new THREE.Scene(), mbCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
if (MB > 1) {
  const un = {}; let dec = '', sum = '';
  for (let i = 0; i < MB; i++) { mbTex.push(new THREE.FramebufferTexture(W, H)); un['t' + i] = { value: mbTex[i] }; dec += `uniform sampler2D t${i};`; sum += `c+=texture2D(t${i},vUv);`; }
  mbScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: un, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `${dec} varying vec2 vUv; void main(){ vec4 c=vec4(0.); ${sum} gl_FragColor=c/${MB}.; }` })));
}
window.renderAt = (t) => {
  if (MB > 1) mbTex.forEach((x) => x.dispose());      // re-allocate: otherwise the first sub-frame texture can keep a stale image (ghosting)
  if (MB > 1) for (let i = 0; i < MB; i++) {
    const ts = t + (i / (MB - 1) - .5) * .5 / FPS; window.__t = ts;
    const { scene } = update(ts); renderer.render(scene, camera); renderer.copyFramebufferToTexture(mbTex[i]);
  }
  window.__t = t;
  const { st, s, scene } = update(t);
  if (MB > 1) renderer.render(mbScene, mbCam); else renderer.render(scene, camera);
  updateHud(t, tl, st, s);
  const cp = camera.position;
  return { t, simT: t, h: +st.h.toFixed(1), v: st.v, a: 0, shot: s.shot, cam: [+cp.x.toFixed(2), +cp.y.toFixed(2), +cp.z.toFixed(2)] };
};
window.TIMELINE = tl;
window.ENGINE_READY = true;
