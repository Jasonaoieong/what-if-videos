// World: sky, procedural ground, clouds, Everest ghost, particles.
// Units: metres, y up, ground at y = 0. Everything deterministic.
import * as THREE from 'three';

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const NOISE = /* glsl */`
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5;} return v; }
`;

export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uAlt: { value: 10000 }, uSun: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
      uDanger: { value: 0 }, uVac: { value: 0 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position);
      vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `varying vec3 vDir; uniform float uAlt; uniform vec3 uSun; uniform float uDanger; uniform float uVac;
      void main(){
        float k = clamp(uAlt/10000.,0.,1.);
        vec3 zenith = mix(vec3(.24,.48,.86), vec3(.03,.10,.32), k);
        vec3 horizon = mix(vec3(.86,.90,.95), vec3(.62,.76,.93), k);
        float e = clamp(vDir.y,-1.,1.);
        vec3 c = mix(horizon, zenith, pow(max(e,0.),.55));
        c = mix(c, horizon*.92, smoothstep(0.,-.25,e));
        float sd = max(dot(normalize(vDir),uSun),0.);
        c += vec3(1.,.93,.78)*(pow(sd,900.)*6. + pow(sd,30.)*.22);
        float sp = smoothstep(11000., 36000., uAlt);                 // stratosphere: sky goes black above, thin blue limb at the horizon
        vec3 space = mix(vec3(.25,.45,.85)*smoothstep(.25,-.02,e), vec3(.004,.006,.02), smoothstep(-.02,.35,e));
        c = mix(c, space + vec3(1.,.95,.85)*pow(sd,900.)*6., sp*smoothstep(-.2,.05,e));
        c = mix(c, c*vec3(1.15,.75,.7), uDanger*.35);
        // no atmosphere at all: black sky at noon, bare sun disk, no horizon glow
        c = mix(c, vec3(.004,.005,.012) + vec3(1.,.97,.9)*pow(sd,1400.)*8., uVac);
        gl_FragColor = vec4(c,1.);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  m.scale.setScalar(380000); m.frustumCulled = false; m.renderOrder = -10;
  return m;
}

export function makeGround() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uHaze: { value: new THREE.Color(0.7, 0.8, 0.92) },
      uHazeDist: { value: 60000 }, uSun: { value: new THREE.Vector3(0.45, 0.55, -0.7).normalize() },
      uDust: { value: 0 }, uCity: { value: 0 },
    },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz;
      gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: NOISE + `varying vec3 vW; uniform vec3 uCam; uniform vec3 uHaze; uniform float uHazeDist; uniform vec3 uSun; uniform float uCity;
      void main(){
        vec2 p = vW.xz;
        // farmland patchwork (~250 m fields)
        vec2 cell = floor(p/260. + vec2(fbm(p*.0007)*2.));
        float h = hash(cell);
        vec3 field = h<.3 ? vec3(.36,.47,.20) : h<.55 ? vec3(.55,.52,.28) : h<.72 ? vec3(.27,.38,.17) : h<.86 ? vec3(.62,.58,.38) : vec3(.42,.36,.24);
        // crop rows
        float rows = .92 + .08*sin((h>.5? p.x : p.y)*1.4);
        // forests
        float forest = smoothstep(.55,.62, fbm(p*.00035+3.));
        vec3 col = mix(field*rows, vec3(.13,.24,.11)*(.8+.4*noise(p*.08)), forest);
        // river
        float rv = abs(p.y - 2500. - 1800.*sin(p.x*.00021) - 400.*sin(p.x*.0011));
        col = mix(col, vec3(.16,.30,.40), smoothstep(45.,25.,rv));
        // roads every 1.3 km with jitter
        vec2 r = abs(fract((p + vec2(0.,300.*sin(p.x*.0005)))/1300.)-.5)*1300.;
        col = mix(col, vec3(.55,.53,.50), smoothstep(7.,4.,min(r.x,r.y))*(1.-forest*.7));
        // town block near origin (+x)
        float town = smoothstep(1800.,900., length(p - vec2(2600.,-1500.)));
        vec2 b = fract(p/42.); float bld = step(.18,b.x)*step(.18,b.y);
        col = mix(col, mix(vec3(.5,.48,.46), vec3(.70,.64,.58)*(.8+.4*hash(floor(p/42.))), bld), town*.9);
        // close-up grass detail
        float near = smoothstep(2500.,60., distance(uCam,vW));
        vec2 fe = abs(fract(p/260. + vec2(fbm(p*.0007)*2.)) - .5);
        col = mix(col, vec3(.16,.24,.11), near*smoothstep(.485,.497,max(fe.x,fe.y)));   // hedgerows
        col *= mix(1., .82 + .36*fbm(p*.045), near);                                      // field texture
        col *= mix(1., .9 + .2*noise(p*1.3), near*near);                                  // grass
        float mud = smoothstep(.62,.7, fbm(p*.01+9.)); col = mix(col, col*vec3(1.1,.95,.8), mud*near*.5);
        if (uCity > .5) {   // desert city: sand, road grid, block roofs, plazas, palms
          vec3 sand = mix(vec3(.80,.68,.50), vec3(.72,.58,.40), fbm(p*.002));
          vec2 blk = fract(p/120.); vec2 bid = floor(p/120.);
          float road = 1. - step(.12,blk.x)*step(.12,blk.y);
          float big = 1. - step(.03, abs(fract(p.x/1200.)-.5)) ;
          vec2 lot = fract(p/30.); float roof = step(.15,lot.x)*step(.15,lot.y)*step(.12,blk.x)*step(.12,blk.y);
          float hb = hash(floor(p/30.)); float urban = smoothstep(9000.,3000., length(p));
          vec3 rc = hb<.5 ? vec3(.86,.84,.80) : hb<.8 ? vec3(.62,.60,.58) : vec3(.33,.42,.48);
          col = mix(sand, mix(vec3(.74,.70,.64), rc*(.85+.3*noise(p*.3)), roof), urban);
          col = mix(col, vec3(.25,.25,.27), (road*.85 + big)*urban);
          float lane = road*step(.48, abs(fract(p.x/2.)-.5))*urban;
          float pr = length(p), pa = atan(p.y, p.x);
          float plaza = smoothstep(240.,232., pr);
          vec2 tile = abs(fract(p/1.2)-.5);
          vec3 stone = mix(vec3(.80,.77,.72), vec3(.62,.58,.54), step(.5, fract(pr/14.)));
          stone = mix(stone, vec3(.45,.43,.42), smoothstep(.06,.03, abs(fract(pa*12./6.2832)-.5)) * step(30., pr));
          stone = mix(stone, vec3(.25,.42,.20), step(.5, fract(pr/40.+.25)) * step(.35, abs(fract(pa*6./6.2832)-.5)) * step(.5, noise(p*.4)));
          col = mix(col, stone*(.92+.08*step(.46,max(tile.x,tile.y))), plaza);
          float pool = smoothstep(70.,64., length(p - vec2(-150., 110.)));
          col = mix(col, vec3(.10,.35,.45), pool);
          float palm = step(.82, noise(p*.06)) * (1.-roof) * urban * (1.-plaza) * .6;
          col = mix(col, vec3(.18,.32,.14), palm);
          col *= .92 + .16*noise(p*2.1);
        }
        float lit = .55 + .45*clamp(uSun.y,0.,1.);
        col *= lit;
        float d = distance(uCam, vW);
        float fogK = 1. - exp(-pow(d/uHazeDist, 1.35));
        gl_FragColor = vec4(mix(col, uHaze, clamp(fogK,0.,1.)), 1.);
      }`,
  });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(700000, 700000, 256, 256), mat);
  g.rotation.x = -Math.PI / 2; g.frustumCulled = false;
  return g;
}

export function cloudTexture(seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const px = 128 + (r() - .5) * 120, py = 140 + (r() - .5) * 70, rad = 30 + r() * 60;
    const g = x.createRadialGradient(px, py, 0, px, py, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makeClouds() {
  const group = new THREE.Group();
  const tex = [cloudTexture(3), cloudTexture(11), cloudTexture(29)];
  const r = rng(42);
  const add = (x, y, z, s, shade, op) => {
    const m = new THREE.SpriteMaterial({ map: tex[Math.floor(r() * 3)], transparent: true, depthWrite: false,
      color: new THREE.Color(shade, shade, shade * 1.02), opacity: op, fog: true });
    const sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s * 0.62, 1);
    sp.userData.baseOpacity = op; group.add(sp);
  };
  // altocumulus deck 4.0–5.2 km: wide field + dense puffs on the fall path
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2, d = 200 + Math.pow(r(), .7) * 26000;
    const y = 4000 + r() * 1200;
    add(Math.cos(a) * d, y, Math.sin(a) * d, 900 + r() * 2200, .82 + (y - 4000) / 1200 * .18, .9);
  }
  for (let i = 0; i < 140; i++) {
    add((r() - .5) * 260, 4050 + r() * 1100, (r() - .5) * 260, 60 + r() * 160, .86 + r() * .14, .75);
  }
  // cirrus wisps ~9 km
  for (let i = 0; i < 60; i++) {
    const a = r() * Math.PI * 2, d = 300 + r() * 18000;
    add(Math.cos(a) * d, 8900 + r() * 400, Math.sin(a) * d, 2500 + r() * 4000, 1.0, .35);
  }
  return group;
}

export function makeEverest() {
  const geo = new THREE.ConeGeometry(9000, 8849, 64, 24, true);
  geo.translate(0, 8849 / 2, 0);
  const pos = geo.attributes.position, r = rng(5);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i); if (y > 8800) continue;
    const k = 1 + (Math.sin(i * 1.7) * .08 + (r() - .5) * .12) * (1 - y / 8849);
    pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe8f5, roughness: .9, transparent: true, opacity: 0, fog: true });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(-14000, 0, -26000);
  return m;
}

export function makeStreaks(n = 260) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false, fog: false });
  const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false;
  const r = rng(99); const seeds = [];
  for (let i = 0; i < n; i++) seeds.push([(r() - .5) * 40, r() * 60, (r() - .5) * 40, .4 + r() * .6]);
  lines.userData.seeds = seeds;
  return lines;
}

export function updateStreaks(lines, P, h, v, cold) {
  const pos = lines.geometry.attributes.position, s = lines.userData.seeds;
  const len = v * 0.045;
  for (let i = 0; i < s.length; i++) {
    const [x, y0, z, k] = s[i];
    // particles are fixed in air; the body falls through them
    const y = ((y0 - h * k * 0.6) % 60 + 60) % 60 - 30;
    pos.setXYZ(i * 2, P.x + x, P.y + y, P.z + z);
    pos.setXYZ(i * 2 + 1, P.x + x, P.y + y + len * k, P.z + z);
  }
  pos.needsUpdate = true;
  lines.material.opacity = Math.min(.55, v / 140) * (cold ? 1 : .8);
  lines.material.color.setRGB(cold ? .8 : 1, cold ? .92 : 1, 1);
}

export function makeTrees(n = 2600) {
  const g = new THREE.Group(), r = rng(314);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: 0x2f5a26, roughness: .95, flatShading: true }), n);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.18, .25, 1, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let k = 0;
  while (k < n) {
    // clustered hedgerows + copses around the landing zone, keeping a meadow clear
    const cx = (r() - .5) * 2400, cz = (r() - .5) * 2400;
    if (Math.hypot(cx, cz) < 70) continue;
    const cluster = 4 + Math.floor(r() * 18);
    for (let j = 0; j < cluster && k < n; j++, k++) {
      const x = cx + (r() - .5) * 60, z = cz + (r() - .5) * 60, h = 7 + r() * 9, w = 2.5 + r() * 2.5;
      m.compose(new THREE.Vector3(x, h * .5 + w * .6, z), q, new THREE.Vector3(w, w * 1.25, w)); crown.setMatrixAt(k, m);
      crown.setColorAt(k, c.setHSL(.27 + r() * .06, .45, .2 + r() * .1));
      m.compose(new THREE.Vector3(x, h * .3, z), q, new THREE.Vector3(1, h * .6, 1)); trunk.setMatrixAt(k, m);
    }
  }
  crown.castShadow = false; g.add(crown, trunk);
  return g;
}

export function makeDust(n = 70) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const mat = new THREE.PointsMaterial({ size: 1.6, color: 0xb9a68a, transparent: true, opacity: 0, depthWrite: false, map: cloudTexture(77) });
  const p = new THREE.Points(geo, mat); p.frustumCulled = false;
  const r = rng(123); p.userData.dirs = [];
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, e = r() * .9; p.userData.dirs.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), 4 + r() * 14]); }
  return p;
}

export function updateDust(p, origin, age) {
  const pos = p.geometry.attributes.position;
  p.userData.dirs.forEach(([x, y, z, sp], i) => {
    const d = sp * .5 * (1 - Math.exp(-age * 2.2));
    pos.setXYZ(i, origin.x + x * d, Math.max(0.2, origin.y + y * d * .7 - age * age * .3), origin.z + z * d);
  });
  pos.needsUpdate = true;
  p.material.opacity = age <= 0 ? 0 : Math.max(0, .45 - age * .09);
  p.material.size = 4 + age * 5;
}
