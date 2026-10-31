// Deterministic frame driver. Loads ?ep=<episode dir> timeline + sim,
// exposes window.renderAt(t) -> state (for QA logging).
import * as THREE from 'three';
import { makeSky, makeGround, makeClouds, makeEverest, makeStreaks, updateStreaks, makeDust, updateDust, makeTrees } from './world.js';
import { makeFaller, poseFaller } from './character.js';
import { cameraFor } from './rigs.js';
import { buildHud, updateHud } from './hud.js';

const params = new URLSearchParams(location.search);
const EP = params.get('ep') || '/episode';
const SCALE = parseFloat(params.get('scale') || '1') * parseFloat(params.get('r3d') || '1');

const tl = await (await fetch(`${EP}/timeline.json?${Date.now()}`)).json();
const sim = await (await fetch(`${EP}/sim.json`)).json();
const S = sim.samples, SIM_END = S[S.length - 1].t;

// ---- sim-time mapping: monotone cubic through segment knots -----------
const knots = [];
for (const s of tl.segments) knots.push([s.start, s.sim[0]]);
const last = tl.segments[tl.segments.length - 1];
knots.push([last.end, last.sim[1]]);
const kx = [], ky = [];
for (const [x, y] of knots) { if (kx.length && x <= kx[kx.length - 1]) continue; kx.push(x); ky.push(y); }
const n = kx.length, dk = [], m = new Array(n).fill(0);
for (let i = 0; i < n - 1; i++) dk.push((ky[i + 1] - ky[i]) / (kx[i + 1] - kx[i]));
for (let i = 1; i < n - 1; i++) m[i] = dk[i - 1] * dk[i] <= 0 ? 0 : (dk[i - 1] + dk[i]) / 2;
m[0] = dk[0]; m[n - 1] = dk[n - 2];
for (let i = 0; i < n - 1; i++) {
  if (dk[i] === 0) { m[i] = m[i + 1] = 0; continue; }
  const a = m[i] / dk[i], b = m[i + 1] / dk[i], h = a * a + b * b;
  if (h > 9) { const k = 3 / Math.sqrt(h); m[i] = k * a * dk[i]; m[i + 1] = k * b * dk[i]; }
}
function simTimeAt(t) {
  if (t <= kx[0]) return ky[0];
  if (t >= kx[n - 1]) return ky[n - 1];
  let i = 0; while (t > kx[i + 1]) i++;
  const hh = kx[i + 1] - kx[i], u = (t - kx[i]) / hh;
  const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
  return Math.min(SIM_END, h00 * ky[i] + h10 * hh * m[i] + h01 * ky[i + 1] + h11 * hh * m[i + 1]);
}
function sampleAt(st) {
  const dt = S[1].t - S[0].t;
  let i = Math.min(S.length - 2, Math.max(0, Math.floor(st / dt)));
  while (i < S.length - 2 && S[i + 1].t < st) i++;
  const a = S[i], b = S[i + 1], u = Math.max(0, Math.min(1, (st - a.t) / ((b.t - a.t) || 1)));
  const o = {}; for (const k of ['h', 'v', 'a', 'rho', 'temp_C']) o[k] = a[k] + (b[k] - a[k]) * u;
  return o;
}

// ---- shots: merge consecutive segments sharing a camera ---------------
const shots = [];
for (const s of tl.segments) {
  const p = shots[shots.length - 1];
  if (p && p.camera === s.camera) p.end = s.end; else shots.push({ camera: s.camera, start: s.start, end: s.end, scene: s.scene });
}
const impactSeg = tl.segments.find((s) => s.camera === 'impact_cut');
const IMPACT_T = impactSeg ? impactSeg.end : Infinity;

// ---- three.js scene ---------------------------------------------------
const canvas = document.getElementById('gl');
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
canvas.style.width = '1080px'; canvas.style.height = '1920px';
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const haze = new THREE.Color(0.72, 0.8, 0.92);
scene.fog = new THREE.Fog(haze, 3000, 120000);
const camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 900000);
const sky = makeSky(); scene.add(sky);
const ground = makeGround(); scene.add(ground);
const clouds = makeClouds(); scene.add(clouds);
const everest = makeEverest(); scene.add(everest);
const streaks = makeStreaks(); scene.add(streaks);
const dust = makeDust(); scene.add(dust);
scene.add(makeTrees());
const faller = makeFaller(); scene.add(faller);
faller.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

const sunDir = new THREE.Vector3(0.45, 0.55, -0.7).normalize();
const sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: .5, far: 30 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x6b5a45, 1.2); scene.add(hemi);
const rim = new THREE.DirectionalLight(0x9fc8ff, 1.2); scene.add(rim, rim.target);

buildHud(document.getElementById('hud'));

const ease = (u) => u * u * (3 - 2 * u);

// ---- force arrows (gravity vs drag) ------------------------------------
const MASS = 80, G = 9.80665, NPX = 1 / 260;   // metres of arrow per newton
function arrow(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, toneMapped: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 12), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.13, .32, 16), mat);
  g.add(shaft, head); g.userData = { shaft, head, mat }; g.renderOrder = 20; return g;
}
function setArrow(a, origin, dir, len, op) {
  const { shaft, head, mat } = a.userData;
  a.position.copy(origin); a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const L = Math.max(.05, len);
  shaft.scale.y = L; shaft.position.y = L / 2; head.position.y = L + .16;
  mat.opacity = op; a.visible = op > .01;
}


// ---- sun glare (light rays) ---------------------------------------------
function glareTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, 'rgba(255,245,220,1)'); g.addColorStop(.08, 'rgba(255,230,180,.55)'); g.addColorStop(.35, 'rgba(255,210,150,.12)'); g.addColorStop(1, 'rgba(255,200,140,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { x.save(); x.translate(256, 256); x.rotate(i / 14 * Math.PI * 2 + .2); const r = x.createLinearGradient(0, 0, 250, 0);
    r.addColorStop(0, 'rgba(255,240,210,.22)'); r.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = r; x.fillRect(0, -3 - (i % 3) * 2, 250, 6 + (i % 3) * 4); x.restore(); }
  return new THREE.CanvasTexture(c);
}
const glare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glareTex(), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, transparent: true }));
glare.renderOrder = 15; scene.add(glare);

// ---- motion blur: N sub-frames averaged ---------------------------------
const MB = parseInt(params.get('mb') || '1');
const FPS = tl.fps || 30, SHUTTER = 0.5;     // 180° shutter
const mbTex = [], mbQuad = new THREE.Scene(), mbCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
if (MB > 1) {
  for (let i = 0; i < MB; i++) mbTex.push(new THREE.FramebufferTexture(W, H));
  const uniforms = { n: { value: MB } }; let samp = '';
  for (let i = 0; i < MB; i++) { uniforms['t' + i] = { value: mbTex[i] }; samp += `uniform sampler2D t${i};`; }
  let sum = ''; for (let i = 0; i < MB; i++) sum += `c += texture2D(t${i}, vUv);`;
  mbQuad.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.,1.); }',
    fragmentShader: `${samp} uniform float n; varying vec2 vUv; void main(){ vec4 c = vec4(0.); ${sum} gl_FragColor = c / n; }`,
  })));
}

const BLEND_T = 0.9;
const smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const segAt = (t) => tl.segments.find((s) => t >= s.start && t < s.end) || last;

function updateWorld(t) {
  const simT = simTimeAt(t);
  const smp = sampleAt(simT);
  const impactAge = t - IMPACT_T;
  const st = { ...smp, simT, impactAge };
  if (impactAge >= 0) { st.h = 0; st.v = 0; st.a = 0; }

  const P = new THREE.Vector3(Math.sin(simT * .05) * 3, Math.max(st.h, 0) + 1.0, 0);
  faller.position.copy(P);
  faller.visible = impactAge < 0;
  poseFaller(faller, t, st.v, Math.max(0, (1500 - st.h) / 1500));
  faller.rotation.y = Math.sin(t * .3) * .25;

  // camera: eased blend into every new shot (except the impact cut-to-ground and post-flash)
  const si = shots.findIndex((s) => t >= s.start && t < s.end);
  const shot = shots[si < 0 ? shots.length - 1 : si];
  const u = Math.min(1, (t - shot.start) / (shot.end - shot.start));
  let c = cameraFor(shot, P, u, t, st);
  const prev = shots[si - 1];
  const sinceCut = t - shot.start;
  const hardCut = shot.camera === 'impact_cut' || shot.camera === 'aftermath_rise';
  const pc = prev && !hardCut ? cameraFor(prev, P, 1, t, st) : null;
  // long dollies (e.g. 500 m wide → 4 m close-up) get a proportionally longer blend
  const ratio = pc ? Math.abs(Math.log(Math.max(.1, pc.pos.distanceTo(P)) / Math.max(.1, c.pos.distanceTo(P)))) : 0;
  const swing = pc ? pc.pos.clone().sub(P).angleTo(c.pos.clone().sub(P)) : 0;
  const bT = Math.min(3.2, BLEND_T * Math.max(1, ratio / 1.2, swing / 1.2));
  if (pc && sinceCut < bT) {
    const k = smoother(sinceCut / bT);
    // blend look-at in direction space so the camera arcs instead of sliding
    const d0 = pc.look.clone().sub(pc.pos).normalize(), d1 = c.look.clone().sub(c.pos).normalize();
    // offset from the faller blended in direction + log-distance, so a 500 m → 4 m dolly decelerates smoothly
    const o0 = pc.pos.clone().sub(P), o1 = c.pos.clone().sub(P);
    const r0 = Math.max(.1, o0.length()), r1 = Math.max(.1, o1.length());
    o0.divideScalar(r0); o1.divideScalar(r1);
    // true slerp: constant angular speed even when swinging from above to below the faller
    const ang = Math.acos(Math.min(1, Math.max(-1, o0.dot(o1))));
    let ax = o0.clone().cross(o1); if (ax.lengthSq() < 1e-8) ax.set(1, 0, 0); ax.normalize();
    const od = o0.clone().applyAxisAngle(ax, ang * k);
    const pos = P.clone().addScaledVector(od, Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * k));
    const dir = d0.lerp(d1, k).normalize();
    c = { pos, look: pos.clone().addScaledVector(dir, 10), fov: pc.fov + (c.fov - pc.fov) * k, roll: pc.roll + (c.roll - pc.roll) * k };
  }
  camera.position.copy(c.pos); camera.fov = c.fov; camera.updateProjectionMatrix();
  camera.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
  camera.lookAt(c.look); camera.updateMatrixWorld();

  sun.position.copy(P).addScaledVector(sunDir, 12); sun.target.position.copy(P);
  rim.position.copy(P).add(new THREE.Vector3(-6, -2, 8)); rim.target.position.copy(P);

  // atmosphere + smooth lighting with altitude (cold blue up high → warm haze low)
  const camAlt = Math.max(camera.position.y, 0);
  const k10 = Math.min(1, camAlt / 10000);
  sky.position.copy(camera.position);
  sky.material.uniforms.uAlt.value = camAlt;
  const danger = impactAge < 0 ? Math.max(0, (1500 - st.h) / 1500) : 0;
  sky.material.uniforms.uDanger.value = danger;
  const hz = new THREE.Color().lerpColors(new THREE.Color(0.84, 0.85, 0.88), new THREE.Color(0.62, 0.74, 0.9), k10);
  scene.fog.color.copy(hz);
  ground.material.uniforms.uCam.value.copy(camera.position);
  ground.material.uniforms.uHaze.value.copy(hz);
  ground.material.uniforms.uHazeDist.value = 26000 + camAlt * 2.2;
  sun.color.setRGB(1, .93 + .05 * k10, .82 + .14 * k10);
  hemi.intensity = 1.0 + .4 * (1 - k10);

  const evOn = shot.camera === 'pull_back_wide' ? Math.min(1, Math.max(0, (u - .3) / .3)) : 0;
  everest.material.opacity = evOn * .9; everest.visible = evOn > 0.01;
  for (const sp of clouds.children) {
    const d = sp.position.distanceTo(camera.position);
    sp.material.opacity = sp.userData.baseOpacity * Math.min(1, d / (sp.scale.x * .6));
  }
  updateStreaks(streaks, P, st.h, st.v, st.h > 7000);
  streaks.visible = impactAge < 0 && shot.camera !== 'pull_back_wide';
  updateDust(dust, new THREE.Vector3(P.x, 0.5, 0), impactAge);

  // forces: fade in/out per segment flag; lengths from the simulation
  const seg = segAt(t);
  const segIdx = tl.segments.indexOf(seg);
  const fOn = (s) => s && s.forces ? 1 : 0;
  const fin = Math.min(1, (t - seg.start) / .5), fout = Math.min(1, (seg.end - t) / .5);
  let fop = fOn(seg) * Math.min(fin + fOn(tl.segments[segIdx - 1]), 1) * Math.min(fout + fOn(tl.segments[segIdx + 1]), 1);
  if (impactAge >= 0) fop = 0;
  const weight = MASS * G, drag = st.drag_N ?? (0.5 * st.rho * 0.4229 * st.v * st.v);
  st.weight = weight; st.drag = drag;
  st.forces = fop > 0 ? { op: fop } : null;

  // glare at the sun's screen position
  glare.position.copy(camera.position).addScaledVector(sunDir, 5000);
  const sunScreen = sunDir.clone().add(camera.position).project(camera);
  const onScreen = Math.abs(sunScreen.x) < 1.4 && Math.abs(sunScreen.y) < 1.4 && sunScreen.z < 1;
  glare.scale.setScalar(1400 * (1 + .1 * Math.sin(t * .7)));
  glare.material.opacity = onScreen ? .55 * k10 + .25 : 0;

  // "YOU" + Everest markers
  const dist = camera.position.distanceTo(P);
  if (impactAge < 0 && dist > 40 && camera.position.y > 300) {
    const sp = P.clone().project(camera);
    st.marker = { x: (sp.x + 1) / 2 * 1080, y: (1 - sp.y) / 2 * 1920, o: Math.min(1, (dist - 40) / 60) };
  }
  if (everest.visible) {
    const ep = everest.position.clone().add(new THREE.Vector3(0, 8849, 0)).project(camera);
    st.evMark = { x: (ep.x + 1) / 2 * 1080, y: (1 - ep.y) / 2 * 1920, o: everest.material.opacity };
  }
  return { st, shot, seg, P };
}

window.renderAt = (t) => {
  if (MB > 1) {
    for (let i = 0; i < MB; i++) {
      const ts = t + (i / (MB - 1) - .5) * SHUTTER / FPS;
      updateWorld(ts);
      renderer.render(scene, camera);
      renderer.copyFramebufferToTexture(mbTex[i]);
    }
  }
  const { st, shot, seg, P } = updateWorld(t);
  if (MB > 1) renderer.render(mbQuad, mbCam); else renderer.render(scene, camera);
  updateHud(t, tl, st, seg);
  const cp = camera.position;
  return { t, simT: +st.simT.toFixed(2), h: +st.h.toFixed(1), v: +st.v.toFixed(2), shot: shot.camera,
           cam: [+cp.x.toFixed(3), +cp.y.toFixed(3), +cp.z.toFixed(3)],
           rel: [+(cp.x - P.x).toFixed(4), +(cp.y - P.y).toFixed(4), +(cp.z - P.z).toFixed(4)] };
};

window.TIMELINE = tl;
window.ENGINE_READY = true;
