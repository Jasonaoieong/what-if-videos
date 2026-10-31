// "THE FALLER" — the studio's original recurring character.
// Orange flight suit, charcoal harness, white helmet with amber visor.
// Built once; identical in every scene. Belly-to-earth arch pose.
import * as THREE from 'three';

const SUIT = new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: .55, metalness: .05 });
const DARK = new THREE.MeshStandardMaterial({ color: 0x22252b, roughness: .7 });
const HELM = new THREE.MeshStandardMaterial({ color: 0xf2f3f5, roughness: .3, metalness: .1 });
const VISOR = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: .08, metalness: .6, emissive: 0x402000 });
const SKIN = new THREE.MeshStandardMaterial({ color: 0xc58c6a, roughness: .8 });
export const FROST = { mats: [SUIT, DARK, HELM] };

function limb(len, rad, mat) {
  const g = new THREE.CapsuleGeometry(rad, len, 6, 12);
  g.translate(0, -len / 2, 0);              // pivot at top joint
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}

export function makeFaller() {
  const root = new THREE.Group();          // world-space body
  const body = new THREE.Group();          // standing frame, rotated into belly-down
  root.add(body);
  body.rotation.x = Math.PI / 2;           // face → down, head → +z

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.19, .5, 8, 16), SUIT);
  torso.position.y = 1.15; torso.scale.set(1.15, 1, .8); torso.castShadow = torso.receiveShadow = true;
  body.add(torso);
  const strapA = new THREE.Mesh(new THREE.TorusGeometry(.2, .025, 6, 20), DARK);
  strapA.position.set(0, 1.0, 0); strapA.rotation.x = Math.PI / 2; strapA.scale.set(1.15, .8, 1); body.add(strapA);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(.3, .38, .1), DARK);   // empty rig — no canopy
  pack.position.set(0, 1.2, -.19); pack.castShadow = true; body.add(pack);

  const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
  const helm = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 16), HELM); helm.castShadow = true; head.add(helm);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.152, 24, 12, -1.0, 2.0, 1.15, .7), VISOR);
  head.add(visor);
  const chin = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8), SKIN); chin.position.set(0, -.09, .07); head.add(chin);

  const mk = (side) => {
    const s = side;
    const sh = new THREE.Group(); sh.position.set(.25 * s, 1.36, 0); body.add(sh);
    const up = limb(.24, .055, SUIT); sh.add(up);
    const el = new THREE.Group(); el.position.y = -.3; up.add(el);
    const fo = limb(.22, .05, SUIT); el.add(fo);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(.055, 10, 8), DARK); glove.position.y = -.3; fo.add(glove);
    const hp = new THREE.Group(); hp.position.set(.1 * s, .84, 0); body.add(hp);
    const th = limb(.36, .075, SUIT); hp.add(th);
    const kn = new THREE.Group(); kn.position.y = -.44; th.add(kn);
    const sn = limb(.34, .06, SUIT); kn.add(sn);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .22), DARK); boot.position.set(0, -.44, .05); sn.add(boot);
    return { sh, el, hp, kn };
  };
  const L = mk(1), R = mk(-1);
  root.userData = { L, R, head, body };
  return root;
}

// Arch pose + wind flutter. v = speed (m/s), t = seconds, panic 0..1
export function poseFaller(f, t, v, panic = 0) {
  const { L, R, head, body } = f.userData;
  const w = Math.min(1, v / 80);
  const fl = (ph, a) => Math.sin(t * (9 + 5 * w) + ph) * a * (0.3 + w);
  for (const [P, s] of [[L, 1], [R, -1]]) {
    // arms out, elbows bent so forearms point toward head
    P.sh.rotation.set(fl(s, .05), 0, s * (1.75 + fl(1 + s, .06) - panic * .3 * Math.sin(t * 6 + s)));
    P.el.rotation.set(0, 0, -s * (1.3 + fl(2 * s, .08)));
    P.sh.rotation.x += -.35;                              // arms slightly back (arch)
    P.hp.rotation.set(-.15 + fl(3 + s, .04), 0, s * .32);
    P.kn.rotation.set(-1.15 + fl(4 * s, .1) - panic * .3 * Math.sin(t * 5 + s * 2), 0, 0); // shins up
  }
  head.rotation.x = -.45 + fl(5, .03);
  body.rotation.z = Math.sin(t * .7) * .05;
  body.rotation.y = Math.sin(t * .43) * .06;
}
