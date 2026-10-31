// Camera rigs. Each returns {pos, look, fov, roll} given body position P,
// segment progress u (0..1), absolute time t and state st {v, h, impactAge}.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (u) => u * u * (3 - 2 * u);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const lerp = (a, b, u) => a + (b - a) * u;

// smooth value noise (C1-continuous) — no frame-to-frame jitter
function h1(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function vn(x) { const i = Math.floor(x), f = x - i, u = f * f * f * (f * (f * 6 - 15) + 10); return h1(i) * (1 - u) + h1(i + 1) * u - .5; }
function fbm(x, seed) { return vn(x + seed) + .5 * vn(x * 2.1 + seed * 3.3) + .25 * vn(x * 4.3 + seed * 7.1); }
// buffeting: amplitude in metres, frequency band 2–9 Hz equivalent, smooth
function shake(t, amp) {
  return V(fbm(t * 1.9, 1.7) * amp * 2, fbm(t * 1.6, 9.1) * amp * 1.6, fbm(t * 2.2, 4.2) * amp * 1.2);
}
// slow handheld drift applied to every rig so the camera is never dead
export function drift(t, amp = .12) { return V(fbm(t * .35, 2.2) * amp, fbm(t * .3, 5.9) * amp, fbm(t * .4, 8.4) * amp); }

export const RIGS = {
  // hook: high above and behind, diving in; vast ground below
  drone_dive: (P, u, t, st) => {
    // hook: punch in from 16 m to 4 m in the first 1.8 s, then a slow orbit
    const e = easeOut(Math.min(1, t / 1.8)), a = u * .5;
    const r = lerp(16, 4.4, e);
    return { pos: P.clone().add(V(Math.sin(a) * r * .55, lerp(12, 3.8, e), -Math.cos(a) * r * .8)),
             look: P.clone().add(V(0, -2.5, 1)), fov: lerp(64, 44, e) };
  },
  // reveal scale: pull out to a wide side view, Everest ghost in frame
  pull_back_wide: (P, u, t, st) => {
    const e = ease(u);
    const d = 4 * Math.pow(650, e);  // log-space pull-back: constant relative speed, no lurch
    const pos = P.clone().add(V(d * .35, d * .12 + 1, d * .95));
    const look = P.clone().lerp(V(-14000, 5000, -26000), Math.pow(e, 1.5) * .08).add(V(0, -d * .12, 0));
    return { pos, look, fov: lerp(44, 52, e) };
  },
  close_orbit_frost: (P, u, t, st) => {
    const a = lerp(.5, 2.2, ease(u));
    return { pos: P.clone().add(V(Math.sin(a) * 3.4, 1.1, Math.cos(a) * 3.4 + .6)),
             look: P.clone().add(V(0, -.1, .55)), fov: 42 };
  },
  tracking_side: (P, u, t, st) => ({
    pos: P.clone().add(V(4.6, lerp(.6, -.2, u), .6)).add(shake(t, st.v * .0012)),
    look: P.clone().add(V(0, -.6, .5)), fov: lerp(46, 52, u), roll: -.08 }),
  // above, looking straight down past the body at the cirrus deck below
  top_down_clouds: (P, u, t, st) => ({
    pos: P.clone().add(V(.3, lerp(5, 9, ease(u)), -.4)).add(shake(t, st.v * .0008)),
    look: P.clone().add(V(0, -50, .3)), fov: 62, roll: u * .5 }),
  // below the body looking up at the visor; heavy buffeting
  face_on_shake: (P, u, t, st) => ({
    pos: P.clone().add(V(.4, -3.4, 1.9)).add(shake(t, st.v * .0011)),
    look: P.clone().add(V(0, 0, .8)), fov: lerp(50, 38, ease(u)) }),
  slow_push_in: (P, u, t, st) => {
    const e = ease(u);
    return { pos: P.clone().add(V(lerp(-9, -3.2, e), lerp(1.2, .4, e), lerp(5, 1.8, e))),
             look: P.clone().add(V(0, -.4, .6)), fov: lerp(44, 34, e), roll: .05 };
  },
  through_clouds: (P, u, t, st) => ({
    pos: P.clone().add(V(-1.6, 3.2, -4.2)).add(shake(t, .03)),
    look: P.clone().add(V(0, -6, 2)), fov: 58, roll: Math.sin(t * .5) * .06 }),
  tracking_behind_ground: (P, u, t, st) => ({
    pos: P.clone().add(V(1.2, 2.4, -5.5)).add(shake(t, st.v * .0016)),
    look: P.clone().add(V(0, -14, 6)), fov: lerp(54, 62, u) }),
  // over-the-shoulder looking straight down: ground expands
  ground_rush: (P, u, t, st) => ({
    pos: P.clone().add(V(.8, 2.2, -4.6)).add(shake(t, .025 + u * .05)),
    look: P.clone().add(V(0, -4, 3)), fov: lerp(60, 74, u * u) }),
  // from the ground looking up as the figure arrives
  impact_cut: (P, u, t, st) => ({
    pos: V(28, 1.6, 34).add(shake(t, st.impactAge > 0 ? .35 * Math.exp(-st.impactAge * 3) : 0)),
    look: V(0, Math.max(P.y, 0) * .55 + 1.5, 0), fov: 50 }),
  aftermath_rise: (P, u, t, st) => {
    const e = ease(u);
    // starts on the dust in the meadow, then rises and tilts up into the sky
    return { pos: V(lerp(34, 60, e), lerp(6, 260, e * e), lerp(40, 120, e)),
             look: V(lerp(0, -300, e), lerp(1, 520, Math.pow(e, 1.6)), lerp(0, -600, e)), fov: lerp(46, 58, e) };
  },
};

export function cameraFor(seg, P, u, t, st) {
  const f = RIGS[seg.camera] || RIGS.tracking_side;
  const r = f(P, u, t, st);
  r.roll = (r.roll || 0) + fbm(t * .25, 3.3) * .03;
  if (seg.camera !== 'impact_cut') r.pos.add(drift(t, r.pos.distanceTo(P) * .02 + .05));
  return r;
}
