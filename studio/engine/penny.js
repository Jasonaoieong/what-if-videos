// "Would a penny dropped from the Burj Khalifa kill you?" — coin-scale cameras, real fall sim.
import * as THREE from 'three';
import { makeSky, makeGround, makeDust, updateDust, rng } from './world.js';
import { buildHud, updateHud } from './hud.js';

const params = new URLSearchParams(location.search);
const EP = params.get('ep');
const SCALE = parseFloat(params.get('scale') || '1') * parseFloat(params.get('r3d') || '1');
const tl = await (await fetch(`${EP}/timeline.json?${Date.now()}`)).json();
const sim = await (await fetch(`${EP}/sim.json`)).json();
const S = sim.samples, SIM_END = S[S.length - 1].t, H0 = S[0].h;
const segs = tl.segments, LAST = segs[segs.length - 1];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (u) => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const lerp = (a, b, u) => a + (b - a) * u;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const segAt = (t) => segs.find((s) => t >= s.start && t < s.end) || LAST;

// ---- video time → sim time (monotone cubic through segment knots)
const kx = [], ky = [];
for (const s of segs) if (!kx.length || s.start > kx[kx.length - 1]) { kx.push(s.start); ky.push(s.sim[0]); }
kx.push(LAST.end); ky.push(LAST.sim[1]);
const n = kx.length, dk = [], m = new Array(n).fill(0);
for (let i = 0; i < n - 1; i++) dk.push((ky[i + 1] - ky[i]) / (kx[i + 1] - kx[i]));
for (let i = 1; i < n - 1; i++) m[i] = dk[i - 1] * dk[i] <= 0 ? 0 : (dk[i - 1] + dk[i]) / 2;
m[0] = dk[0]; m[n - 1] = dk[n - 2];
for (let i = 0; i < n - 1; i++) { if (dk[i] === 0) { m[i] = m[i + 1] = 0; continue; }
  const a = m[i] / dk[i], b = m[i + 1] / dk[i], h = a * a + b * b; if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * dk[i]; m[i + 1] = k * b * dk[i]; } }
function simTimeAt(t) {
  if (t <= kx[0]) return ky[0]; if (t >= kx[n - 1]) return ky[n - 1];
  let i = 0; while (t > kx[i + 1]) i++;
  const hh = kx[i + 1] - kx[i], u = (t - kx[i]) / hh;
  return Math.min(SIM_END, (2 * u ** 3 - 3 * u * u + 1) * ky[i] + (u ** 3 - 2 * u * u + u) * hh * m[i] + (-2 * u ** 3 + 3 * u * u) * ky[i + 1] + (u ** 3 - u * u) * hh * m[i + 1]);
}
function sampleAt(st) {
  const dt = S[1].t - S[0].t; let i = clamp(Math.floor(st / dt), 0, S.length - 2);
  const a = S[i], b = S[i + 1], u = clamp((st - a.t) / (b.t - a.t));
  const o = {}; for (const k of ['h', 'v', 'a', 'rho']) o[k] = a[k] + (b[k] - a[k]) * u; return o;
}
const impactSeg = segs.find((s) => s.camera === 'impact_cut');
const IMPACT_T = impactSeg ? impactSeg.end - .05 : Infinity;

// ---- renderer + scene
const canvas = document.getElementById('gl');
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
canvas.style.width = '1080px'; canvas.style.height = '1920px';
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const haze = new THREE.Color(.86, .80, .70);                     // warm desert haze
scene.fog = new THREE.Fog(haze, 1500, 26000);
const camera = new THREE.PerspectiveCamera(45, 1080 / 1920, .002, 400000);
const sky = makeSky(); scene.add(sky);
const ground = makeGround(); ground.material.uniforms.uCity.value = 1; scene.add(ground);
// fine local patch where the camera gets within centimetres of the street (keeps shader varyings precise)
const patch = new THREE.Mesh(new THREE.PlaneGeometry(300, 300, 120, 120), ground.material);
patch.rotation.x = -Math.PI / 2; patch.position.set(84, .0004, 6); scene.add(patch);
const sunDir = V(.55, .62, .55).normalize();
const sun = new THREE.DirectionalLight(0xfff0d8, 3.4); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xcfe2ff, 0xb59a74, 1.3); scene.add(hemi);
// environment map from the sky (for metal + glass reflections)
{ const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(), sk = makeSky();
  sk.material.uniforms.uAlt.value = 400; es.add(sk);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(2e5, 2e5), new THREE.MeshBasicMaterial({ color: 0x9c8466 })); gp.rotation.x = -Math.PI / 2; gp.position.y = -400; es.add(gp);
  scene.environment = pm.fromScene(es, .02, .1, 2e6).texture; }

// ---- the tower: three stepped wings around a core, glass with floor bands, spire to 828 m
function facadeTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#5d6f82'; x.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 16) { x.fillStyle = 'rgba(210,220,230,.55)'; x.fillRect(0, y, 256, 2); }
  for (let xx = 0; xx < 256; xx += 8) { x.fillStyle = 'rgba(190,200,210,.35)'; x.fillRect(xx, 0, 1, 512); }
  const r = rng(4); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${150 + r() * 80},${170 + r() * 60},${190 + r() * 50},.18)`; x.fillRect(Math.floor(r() * 32) * 8, Math.floor(r() * 32) * 16 + 2, 7, 14); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glass = new THREE.MeshStandardMaterial({ map: facadeTex(), metalness: .55, roughness: .14, color: 0xa9bfd6, envMapIntensity: 1.1 });
const steel = new THREE.MeshStandardMaterial({ color: 0xc9d1d9, metalness: .9, roughness: .25 });
export const wingLen = (h) => h >= 600 ? 0 : 58 * Math.pow(1 - h / 600, .8);
const tower = new THREE.Group(); scene.add(tower);
{ const TIERS = 26;
  for (let i = 0; i < TIERS; i++) {
    const h0 = i * 600 / TIERS, h1 = (i + 1) * 600 / TIERS, L = wingLen(h0) + 2;
    for (let w = 0; w < 3; w++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(L, h1 - h0, 22 - i * .35), glass);
      box.geometry.translate(L / 2, 0, 0);
      const uv = box.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * L / 30, uv.getY(k) * (h1 - h0) / 60);
      box.position.y = (h0 + h1) / 2; box.rotation.y = w * Math.PI * 2 / 3 + .5; tower.add(box);
    }
  }
  const core = new THREE.Mesh(new THREE.CylinderGeometry(9, 16, 640, 32), glass); core.position.y = 320; tower.add(core);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(.6, 6.5, 190, 24), steel); spire.position.y = 640 + 95; tower.add(spire);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.08, .6, 3, 12), steel); tip.position.y = 829.5; tower.add(tip);
  // maintenance ledge the penny rests on at the very top
}
// ---- surrounding towers (instanced), keep the plaza + landing zone clear
const NB = 1400, bld = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ metalness: .6, roughness: .35, envMapIntensity: .9 }), NB);
{ const r = rng(21), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  for (let i = 0; i < NB; i++) {
    let x, z; do { x = (r() - .5) * 7000; z = (r() - .5) * 7000; } while (Math.hypot(x, z) < 330);
    const h = 25 + Math.pow(r(), 2.4) * 330, w = 18 + r() * 30;
    mm.compose(V(Math.round(x / 120) * 120 + 60 + (r() - .5) * 30, h / 2, Math.round(z / 120) * 120 + 60 + (r() - .5) * 30), q, V(w, h, w * (.7 + r() * .6)));
    bld.setMatrixAt(i, mm); bld.setColorAt(i, c.setHSL(r() < .6 ? .58 : .09, .15 + r() * .15, .45 + r() * .3));
  } }
scene.add(bld);
// palms around the plaza (parallax near the ground)
const NP = 90, trunkM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .3, 1, 6), new THREE.MeshStandardMaterial({ color: 0x7a5f45, roughness: 1 }), NP);
const frondM = new THREE.InstancedMesh(new THREE.ConeGeometry(1, .5, 7), new THREE.MeshStandardMaterial({ color: 0x3f6b2a, roughness: .9 }), NP);
{ const r = rng(8), mm = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < NP; i++) { const a = r() * Math.PI * 2, rad = 100 + r() * 140, x = Math.cos(a) * rad, z = Math.sin(a) * rad, h = 8 + r() * 6;
    if (Math.hypot(x - 84, z - 6) < 12) { i--; continue; }
    mm.compose(V(x, h / 2, z), q, V(1, h, 1)); trunkM.setMatrixAt(i, mm);
    mm.compose(V(x, h, z), q.setFromEuler(new THREE.Euler(Math.PI, r() * 6, 0)), V(3.5, 3.5, 3.5)); frondM.setMatrixAt(i, mm); q.identity(); } }
scene.add(trunkM, frondM);

// ---- the penny (generic one-cent design; 19.05 mm × 1.52 mm)
function faceTex(back) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const g = x.createRadialGradient(220, 200, 20, 256, 256, 260); g.addColorStop(0, '#e2a274'); g.addColorStop(1, '#8a4a28');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(255,220,190,.55)'; x.lineWidth = 14; x.beginPath(); x.arc(256, 256, 236, 0, 7); x.stroke();
  x.strokeStyle = 'rgba(60,25,10,.45)'; x.lineWidth = 4; x.beginPath(); x.arc(256, 256, 222, 0, 7); x.stroke();
  x.fillStyle = 'rgba(70,30,12,.55)'; x.font = '900 150px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(back ? '1¢' : '★', 256, 250);
  x.font = '800 40px Inter, sans-serif'; x.fillText(back ? 'ONE CENT' : 'LIBERTY', 256, 400);
  const r = rng(back ? 3 : 9); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${r() < .5 ? '255,230,200' : '60,25,10'},${r() * .12})`; x.fillRect(r() * 512, r() * 512, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const copper = (map) => new THREE.MeshStandardMaterial({ map, color: 0xffffff, metalness: .92, roughness: .32, envMapIntensity: 1.6 });
const coin = new THREE.Mesh(new THREE.CylinderGeometry(.009525, .009525, .00152, 64),
  [new THREE.MeshStandardMaterial({ color: 0xb06a3c, metalness: .92, roughness: .4 }), copper(faceTex(false)), copper(faceTex(true))]);
// object: coin (default), bowling ball or raindrop — cameras scale with its size
const OBJ = tl.object?.type || 'coin';
const RAD = { coin: .009525, ball: .109, drop: .0021, hail: .1015 }[OBJ];
const K = RAD / .009525;
let obj = coin;
if (OBJ === 'ball') {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'), r = rng(12);
  x.fillStyle = '#16245e'; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(${90 + r() * 120},${40 + r() * 60},${200 + r() * 55},${.25 + r() * .3})`; x.lineWidth = 6 + r() * 26;
    x.beginPath(); let px = r() * 1024, py = r() * 512; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (r() - .5) * 300; py += (r() - .5) * 160; x.lineTo(px, py); } x.stroke(); }
  for (const [hx, hy, hr] of [[470, 150, 34], [560, 150, 34], [515, 245, 40]]) { const g = x.createRadialGradient(hx, hy, 2, hx, hy, hr); g.addColorStop(0, '#000'); g.addColorStop(.8, '#05060c'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(hx, hy, hr, 0, 7); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  obj = new THREE.Mesh(new THREE.SphereGeometry(RAD, 96, 64), new THREE.MeshPhysicalMaterial({ map: tex, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.4 }));
} else if (OBJ === 'hail') {                          // record hailstone: lumpy, layered ice
  const g = new THREE.IcosahedronGeometry(RAD, 5), pa = g.attributes.position, r = rng(17), bumps = [];
  for (let i = 0; i < 40; i++) bumps.push([new THREE.Vector3(r() - .5, r() - .5, r() - .5).normalize(), .05 + r() * .12, .25 + r() * .35]);
  const v = new THREE.Vector3();
  for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const n = v.clone().normalize(); let k = 1;
    for (const [d, a, w] of bumps) k += a * Math.max(0, 1 - n.distanceTo(d) / w);
    v.copy(n).multiplyScalar(RAD * k * .85); v.y *= .82; pa.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
  for (let yy = 0; yy < 256; yy += 4) { x.fillStyle = `hsl(205,${20 + (yy % 24)}%,${78 + 14 * Math.sin(yy * .3)}%)`; x.fillRect(0, yy, 512, 4); }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(255,255,255,${r() * .5})`; x.fillRect(r() * 512, r() * 256, 2 + r() * 4, 1 + r() * 2); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  obj = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: tex, roughness: .28, clearcoat: .8, clearcoatRoughness: .2, transmission: .0, envMapIntensity: 1.5, sheen: .5 }));
} else if (OBJ === 'drop') {
  const g = new THREE.SphereGeometry(RAD, 64, 48), pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setY(i, y < 0 ? y * .55 : y * .92); }   // flattened "bun" shape of a falling 4 mm drop
  g.computeVertexNormals();
  obj = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: 0x9fd2ff, metalness: .15, roughness: .02, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3, transparent: true, opacity: .93 }));
}
if (obj !== coin) { scene.add(obj); } else scene.add(coin);
// impact props: crater cracks (ball), splash crown + puddle (drop), dust
const crack = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), r = rng(31);
  const g = x.createRadialGradient(256, 256, 10, 256, 256, 150); g.addColorStop(0, 'rgba(40,30,20,.95)'); g.addColorStop(.5, 'rgba(70,55,40,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(30,22,15,.9)'; for (let i = 0; i < 22; i++) { let a = r() * 6.28, rr = 40, px = 256, py = 256; x.lineWidth = 3 + r() * 4; x.beginPath(); x.moveTo(px, py);
    while (rr < 250) { rr += 15 + r() * 25; a += (r() - .5) * .5; px = 256 + Math.cos(a) * rr; py = 256 + Math.sin(a) * rr; x.lineTo(px, py); x.lineWidth *= .9; } x.stroke(); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0 }));
  m.rotation.x = -Math.PI / 2; scene.add(m); return m; })();
const crown = new THREE.InstancedMesh(OBJ === 'hail' ? new THREE.DodecahedronGeometry(1, 0) : new THREE.SphereGeometry(1, 10, 8), obj.material, 28); crown.visible = false; scene.add(crown);
const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshPhysicalMaterial({ color: 0x6f8794, roughness: .05, metalness: .3, transparent: true, opacity: .2, envMapIntensity: 1.2 }));
puddle.rotation.x = -Math.PI / 2; puddle.visible = false; scene.add(puddle);
const dustI = makeDust(90); dustI.visible = false; scene.add(dustI);
const coinLight = new THREE.PointLight(0xfff2e0, 0, .6); scene.add(coinLight);

buildHud(document.getElementById('hud'), tl);

// ---- coin path: drifts out from the spire past the setbacks, flutters like a leaf
const LAND = V(84, 0, 6);
const sV = (x, y, z) => V(x * K, y * K, z * K);
function coinPos(simT, h) {
  const out = sm((H0 - h) / 650);
  const flutter = clamp(simT / 2) * (OBJ === 'coin' ? .8 : .15);
  return V(1.6 + (LAND.x - 1.6) * out + Math.sin(simT * 2.3) * .35 * flutter, Math.max(h, 0) + (OBJ === 'coin' ? .00076 : RAD), LAND.z * out + Math.cos(simT * 1.7) * .3 * flutter);
}

// ---- cameras (metres; the coin is 19 mm across)
function cam(shot, P, u, t, st) {
  const orbit = (r, el, a) => P.clone().add(V(Math.cos(a) * r * Math.cos(el), Math.sin(el) * r, Math.sin(a) * r * Math.cos(el)));
  switch (shot) {
    case 'hook': return { pos: orbit(.085 * K, .6, 1.2 + t * .12), look: P.clone().add(sV(0, .022, 0)), fov: 42 };
    case 'wide': { const e = sm(u), d0 = .09 * K, d = d0 * Math.pow(990 / d0, e);         // log dolly out to ~1 km: whole tower in frame
      return { pos: P.clone().add(V(d * .7, d * .3 + .02 * K, d * .62)), look: P.clone().lerp(V(0, 430, 0), e * .85), fov: lerp(42, 52, e) }; }
    case 'flutter': return { pos: orbit(.07 * K, .15 + .1 * Math.sin(t * .4), 2.4 + t * .35), look: P, fov: 40 };
    case 'facade': if (OBJ === 'drop') return { pos: P.clone().add(sV(.1, .012, .05)), look: P.clone().add(sV(0, .004, 0)), fov: 38 };
      return { pos: P.clone().add(sV(.16, .05, .2)), look: P.clone().add(sV(-1.2, -.35, -.25)), fov: 50 };
    case 'topdown': return { pos: P.clone().add(sV(.03, .22, .07)), look: P.clone().add(sV(0, -6, -.6)), fov: lerp(50, 58, u) };
    case 'rush': return { pos: P.clone().add(sV(.09, .06, .14)), look: P.clone().add(sV(1.2, -1.6, .6)), fov: lerp(55, 68, u * u) };
    case 'land': case 'impact_cut': return { pos: LAND.clone().add(sV(.11, .03, .15)), look: LAND.clone().add(sV(0, .004, 0)), fov: 42 };
    case 'rise': { const k = sm(u);
      const g = Math.pow(1000, k) / 1000;              // log dolly: .19 m → 190 m
      const pos = LAND.clone().add(V(.11 * K + 140 * g, .03 * K + 6 * g, .15 * K + 120 * g));
      const look = LAND.clone().add(sV(0, .004, 0)).lerp(V(0, 828, 0), Math.pow(k, 1.25));
      return { pos, look, fov: lerp(42, 56, k) }; }
  }
}
const shots = []; for (const s of segs) { const p = shots[shots.length - 1]; if (p && p.camera === s.camera) p.end = s.end; else shots.push({ camera: s.camera, start: s.start, end: s.end }); }

function update(t) {
  const simT = simTimeAt(t), smp = sampleAt(simT);
  const impactAge = t - IMPACT_T;
  const st = { ...smp, simT, impactAge, noFlash: true, foot: tl.foot };
  let P = coinPos(simT, smp.h);
  // coin attitude: rests flat on the ledge, tips off, then flutters/tumbles
  const fall = clamp(simT / .6);
  if (OBJ === 'coin') coin.rotation.set(Math.sin(simT * 5.1) * 1.3 * fall + .02, simT * 2.2 * fall, Math.sin(simT * 3.4 + 1) * .9 * fall);
  else if (OBJ === 'ball') obj.rotation.set(simT * .7, simT * 1.1, simT * .3);
  else obj.rotation.set(Math.sin(simT * 9) * .05, 0, Math.cos(simT * 7) * .05);
  crack.material.opacity = 0; crown.visible = false; puddle.visible = false; dustI.visible = false; obj.visible = true;
  if (impactAge >= 0 && OBJ !== 'coin') {
    st.h = 0; st.v = 0; st.a = 0;
    if (OBJ === 'ball') {                                  // slams in, sinks a little, cracks the stone, dust
      P = LAND.clone().add(V(0, RAD * .8 - .03 * clamp(impactAge * 20), 0));
      obj.rotation.set(1.6, 2.1, .3);
      crack.position.set(LAND.x, .002, LAND.z); crack.material.opacity = clamp(impactAge * 25);
      dustI.visible = true; updateDust(dustI, LAND.clone().add(V(0, .05, 0)), impactAge * .12);
      st.shake = .02 * Math.exp(-impactAge * 6);
    } else {                                              // drop: crown splash + film; hail: shatters into ice chunks
      obj.visible = false; P = LAND.clone().add(V(0, .001, 0));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
      crown.visible = OBJ === 'hail' || impactAge < .5;
      for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, sp = .05 + (i % 3) * .015, tt = impactAge;
        m4.compose(V(LAND.x + Math.cos(a) * sp * tt * 3, .001 + sp * 6 * tt - 9.8 * tt * tt * .5, LAND.z + Math.sin(a) * sp * tt * 3), q, V(1, 1, 1).multiplyScalar(RAD * .25 * (1 - tt))); crown.setMatrixAt(i, m4); }
      if (OBJ === 'hail') for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283 + i, sp = .6 + (i % 5) * .25, tt = impactAge, q2 = new THREE.Quaternion().setFromEuler(new THREE.Euler(tt * 9 + i, tt * 7, 0));
        m4.compose(V(LAND.x + Math.cos(a) * sp * tt, Math.max(.01, .05 + sp * 2.2 * tt - 4.9 * tt * tt), LAND.z + Math.sin(a) * sp * tt), q2, V(1, .7, .8).multiplyScalar(RAD * (.18 + (i % 4) * .07))); crown.setMatrixAt(i, m4); }
      crown.instanceMatrix.needsUpdate = true;
      puddle.visible = OBJ === 'drop'; puddle.position.set(LAND.x, .0006, LAND.z); puddle.scale.setScalar(RAD * (1.2 + 1.8 * (1 - Math.exp(-impactAge * 8))));
    }
  } else if (impactAge >= 0) {                                  // land, bounce, wobble, settle flat
    st.h = 0; st.v = 0; st.a = 0;
    const b = Math.abs(Math.sin(impactAge * 18)) * .012 * Math.exp(-impactAge * 5);
    P = LAND.clone().add(V(impactAge < 1 ? impactAge * .02 : .02, .00076 + b, 0));
    const wob = Math.exp(-impactAge * 3.2);
    coin.rotation.set(Math.sin(impactAge * 24) * .5 * wob, 1.1, Math.cos(impactAge * 24) * .5 * wob);
  } else if (t > IMPACT_T - 2) P = P.clone().lerp(LAND.clone().setY(P.y), sm((t - (IMPACT_T - 2)) / 2));
  obj.position.copy(P);
  coinLight.position.copy(P).add(V(.05, .06, .08)); coinLight.intensity = .02;

  // shot + smooth blend (direction slerp + log distance) between consecutive shots
  const si = shots.findIndex((s) => t >= s.start && t < s.end), shot = shots[si < 0 ? shots.length - 1 : si];
  const u = clamp((t - shot.start) / (shot.end - shot.start));
  let c = cam(shot.camera, P, u, t, st);
  const prev = shots[si - 1], since = t - shot.start;
  const pc0 = prev && shot.camera !== 'impact_cut' ? cam(prev.camera, P, 1, t, st) : null;
  const bT = pc0 ? Math.min(3, 1.1 * Math.max(1, Math.abs(Math.log(pc0.pos.distanceTo(P) / cam(shot.camera, P, 1, shot.end, st).pos.distanceTo(P))) / 1.2)) : 0;
  if (pc0 && since < bT) {
    const pc = pc0, k = sm(since / bT);
    const o0 = pc.pos.clone().sub(P), o1 = c.pos.clone().sub(P), r0 = o0.length(), r1 = o1.length();
    const od = o0.normalize().lerp(o1.normalize(), k).normalize();
    const d0 = pc.look.clone().sub(pc.pos).normalize(), d1 = c.look.clone().sub(c.pos).normalize();
    const pos = P.clone().addScaledVector(od, Math.exp(lerp(Math.log(r0), Math.log(r1), k)));
    c = { pos, look: pos.clone().addScaledVector(d0.lerp(d1, k).normalize(), 5), fov: lerp(pc.fov, c.fov, k) };
  }
  // gentle handheld drift scaled to camera distance
  const dist = c.pos.distanceTo(P), dr = Math.min(dist * .015, c.pos.y * .3);
  c.pos.add(V(Math.sin(t * .7) * dr, Math.sin(t * .53 + 1) * dr, Math.sin(t * .61 + 2) * dr));
  if (st.shake) c.pos.add(V(Math.sin(t * 91) * st.shake, Math.sin(t * 77) * st.shake, 0));
  c.pos.y = Math.max(c.pos.y, .02);                    // never dip under the street
  camera.position.copy(c.pos); camera.fov = c.fov; camera.near = Math.max(.002, Math.min(dist * .05, c.pos.y * .3)); camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(c.look); camera.updateMatrixWorld();

  sun.position.copy(P).addScaledVector(sunDir, 30); sun.target.position.copy(P);
  sky.position.copy(camera.position); sky.material.uniforms.uAlt.value = Math.max(camera.position.y, 0); sky.material.uniforms.uDanger.value = 0;
  ground.material.uniforms.uCam.value.copy(camera.position); ground.material.uniforms.uHaze.value.copy(haze);
  ground.material.uniforms.uHazeDist.value = 9000 + camera.position.y * 4;
  // marker when the object is too small to see
  if (impactAge < 0 && dist > 3 * K) { const sp = P.clone().project(camera);
    st.marker = { x: (sp.x + 1) / 2 * 1080, y: (1 - sp.y) / 2 * 1920, o: clamp((dist - 3 * K) / (6 * K)) }; }
  return { st, seg: segAt(t), shot, P };
}

const MB = parseInt(params.get('mb') || '1'), FPS = tl.fps || 30;
const mbTex = [], mbScene = new THREE.Scene(), mbCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
if (MB > 1) { const un = {}; let dec = '', sum = '';
  for (let i = 0; i < MB; i++) { mbTex.push(new THREE.FramebufferTexture(W, H)); un['t' + i] = { value: mbTex[i] }; dec += `uniform sampler2D t${i};`; sum += `c+=texture2D(t${i},vUv);`; }
  mbScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: un, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
    fragmentShader: `${dec} varying vec2 vUv; void main(){ vec4 c=vec4(0.); ${sum} gl_FragColor=c/${MB}.; }` }))); }
window.renderAt = (t) => {
  if (MB > 1) for (let i = 0; i < MB; i++) { update(t + (i / (MB - 1) - .5) * .5 / FPS); renderer.render(scene, camera); renderer.copyFramebufferToTexture(mbTex[i]); }
  const { st, seg, shot, P } = update(t);
  if (MB > 1) renderer.render(mbScene, mbCam); else renderer.render(scene, camera);
  updateHud(t, tl, st, seg);
  const cp = camera.position;
  return { t, simT: +st.simT.toFixed(2), h: +st.h.toFixed(1), v: +st.v.toFixed(2), a: +(st.a || 0).toFixed(3), shot: shot.camera,
    cam: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)], rel: [+(cp.x - P.x).toFixed(4), +(cp.y - P.y).toFixed(4), +(cp.z - P.z).toFixed(4)] };
};
window.TIMELINE = tl;
window.ENGINE_READY = true;
