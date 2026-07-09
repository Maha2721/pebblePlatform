/* ===========================
   SHAPE + GRIP — 3D ENGINE
   =========================== */
'use strict';

// ---- STATE ----
const state = {
  shell: 'standard',
  grip: 'standard',
  texture: 'smooth',
  support: 'none',
  tactile: 'none',
  color: '#E8E0D5',
  colorName: 'Off White',
};

// ---- DATA ----
const data = {
  shell: {
    standard:    { name: 'Standard Shell',   weight: 0,  time: '2h 30min', grams: 22, diff: 'Easy',     suits: ['All grip styles', 'General use'] },
    sculpted:    { name: 'Sculpted Palm',     weight: 22, time: '3h 10min', grams: 34, diff: 'Easy',     suits: ['Palm grip', 'Long sessions', 'Large hands'] },
    fingerguide: { name: 'Finger Guide',      weight: 18, time: '3h 00min', grams: 30, diff: 'Moderate', suits: ['Low vision users', 'Motor control needs', 'Learning users'] },
    wide:        { name: 'Wide Body',         weight: 35, time: '3h 45min', grams: 42, diff: 'Easy',     suits: ['Large hands', 'Palm grip', 'Wide hand span'] },
  },
  grip: {
    slim:     { name: 'Slim 3mm',         weight: 6  },
    standard: { name: 'Standard 7mm',     weight: 0  },
    wide:     { name: 'Wide 14mm',        weight: 32 },
    thumb:    { name: 'Thumb Shelf',      weight: 28 },
  },
  texture: {
    smooth: { name: 'Smooth' },
    dots:   { name: 'Grip Dots' },
    tpu:    { name: 'Soft TPU' },
  },
  support: {
    none:  { name: 'None',             weight: 0  },
    wrist: { name: 'Flat Wrist Rest',  weight: 45 },
    palm:  { name: 'Angled Palm Pad',  weight: 52 },
  },
  tactile: {
    none:    { name: 'None' },
    dot:     { name: 'Button Dot' },
    grooves: { name: 'Finger Grooves' },
  },
};

const BASE_WEIGHT = 99;

// ---- SHARED THREE.JS SETUP ----
function createScene(canvas, bgColor = '#F0F4FF') {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
  camera.position.set(0.18, 0.12, 0.28);
  camera.lookAt(0, 0.01, 0);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(0.5, 1, 0.8); key.castShadow = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xC8D8FF, 0.5);
  fill.position.set(-0.8, 0.3, -0.5); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.25);
  rim.position.set(0, -1, -1); scene.add(rim);

  return { renderer, scene, camera };
}

function resizeRenderer(renderer, canvas, camera) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// ---- MOUSE GEOMETRY HELPERS ----
const chassisMat  = new THREE.MeshStandardMaterial({ color: 0x2C2C2C, roughness: 0.6, metalness: 0.1 });
const bottomMat   = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.8 });
const scrollMat   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.5 });
const buttonMat   = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.5 });
const rubberMat   = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 1.0 });
const wristMat    = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
const padMat      = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });

function buildChassis(group) {
  // Body
  const geo = new THREE.BoxGeometry(0.068, 0.036, 0.113);
  geo.translate(0, 0, 0);
  const body = new THREE.Mesh(geo, chassisMat);
  body.castShadow = true; group.add(body);

  // Bottom
  const bg = new THREE.BoxGeometry(0.066, 0.003, 0.111);
  const bot = new THREE.Mesh(bg, bottomMat);
  bot.position.set(0, -0.02, 0); group.add(bot);

  // Scroll wheel
  const wg = new THREE.CylinderGeometry(0.009, 0.009, 0.013, 16);
  const wheel = new THREE.Mesh(wg, scrollMat);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.021, -0.033); group.add(wheel);

  // Buttons
  const lcg = new THREE.BoxGeometry(0.028, 0.004, 0.042);
  const lc = new THREE.Mesh(lcg, buttonMat); lc.position.set(-0.017, 0.019, -0.022); group.add(lc);
  const rcg = new THREE.BoxGeometry(0.028, 0.004, 0.042);
  const rc = new THREE.Mesh(rcg, buttonMat); rc.position.set(0.017, 0.019, -0.022); group.add(rc);

  // Feet
  const fg = new THREE.CylinderGeometry(0.004, 0.004, 0.002, 8);
  [[-0.028,-0.021,-0.048],[0.028,-0.021,-0.048],[-0.028,-0.021,0.048],[0.028,-0.021,0.048]].forEach(([x,y,z]) => {
    const f = new THREE.Mesh(fg, rubberMat); f.position.set(x,y,z); group.add(f);
  });
}

function buildShell(group, type, color) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.55, metalness: 0.04 });

  const shell = new THREE.Group();
  switch (type) {
    case 'sculpted': {
      // Larger, curved rear
      const g = new THREE.BoxGeometry(0.067, 0.005, 0.113);
      const top = new THREE.Mesh(g, mat); top.castShadow = true;
      const rear = new THREE.BoxGeometry(0.065, 0.009, 0.022);
      const rearMesh = new THREE.Mesh(rear, mat);
      rearMesh.position.set(0, 0.003, 0.054);
      shell.add(top, rearMesh);
      break;
    }
    case 'fingerguide': {
      const g = new THREE.BoxGeometry(0.067, 0.005, 0.113);
      const top = new THREE.Mesh(g, mat); top.castShadow = true;
      // Raised finger ridges
      const ridgeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.85), roughness: 0.7 });
      const rg = new THREE.BoxGeometry(0.012, 0.004, 0.025);
      [-0.018, 0, 0.018].forEach(x => {
        const ridge = new THREE.Mesh(rg, ridgeMat);
        ridge.position.set(x, 0.004, -0.018);
        shell.add(ridge);
      });
      shell.add(top);
      break;
    }
    case 'wide': {
      const g = new THREE.BoxGeometry(0.082, 0.005, 0.113);
      const top = new THREE.Mesh(g, mat); top.castShadow = true;
      shell.add(top);
      break;
    }
    default: { // standard
      const g = new THREE.BoxGeometry(0.067, 0.004, 0.113);
      const top = new THREE.Mesh(g, mat); top.castShadow = true;
      shell.add(top);
    }
  }
  shell.position.set(0, 0.021, 0);
  group.add(shell);
  return shell;
}

function buildGrips(group, type, color) {
  const c = new THREE.Color(color).multiplyScalar(0.82);
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.78, metalness: 0 });
  const widths = { slim: 0.003, standard: 0.007, wide: 0.014, thumb: 0.012 };
  const w = widths[type] || 0.007;
  const pg = new THREE.BoxGeometry(w, 0.022, 0.072);
  const gl = new THREE.Mesh(pg, mat); gl.position.set(-(0.034 + w/2), 0.004, 0); gl.castShadow = true; group.add(gl);
  const gr = new THREE.Mesh(pg, mat); gr.position.set( (0.034 + w/2), 0.004, 0); gr.castShadow = true; group.add(gr);
  if (type === 'thumb') {
    const sg = new THREE.BoxGeometry(0.006, 0.004, 0.022);
    const shelfMat = mat.clone();
    const sl = new THREE.Mesh(sg, shelfMat); sl.position.set(-(0.034+w+0.003), 0.008, 0.01); group.add(sl);
  }
}

function buildSupport(group, type, color) {
  if (type === 'none') return;
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.65), roughness: 0.7 });
  if (type === 'wrist') {
    const g = new THREE.BoxGeometry(0.068, 0.005, 0.04);
    const b = new THREE.Mesh(g, mat); b.castShadow = true;
    const pg2 = new THREE.BoxGeometry(0.065, 0.003, 0.037);
    const p = new THREE.Mesh(pg2, padMat); p.position.y = 0.004;
    const gr = new THREE.Group(); gr.add(b, p); gr.position.set(0, -0.016, 0.067); group.add(gr);
  } else if (type === 'palm') {
    const g = new THREE.BoxGeometry(0.068, 0.005, 0.045);
    const b = new THREE.Mesh(g, mat); b.castShadow = true;
    const pg2 = new THREE.BoxGeometry(0.065, 0.003, 0.042);
    const p = new THREE.Mesh(pg2, padMat); p.position.y = 0.004;
    const gr = new THREE.Group(); gr.add(b, p);
    gr.position.set(0, -0.016, 0.072); gr.rotation.x = -0.26; group.add(gr);
  }
}

function buildTactile(group, type, color) {
  if (type === 'none') return;
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), roughness: 0.9 });
  if (type === 'dot') {
    const g = new THREE.SphereGeometry(0.003, 8, 8);
    const d = new THREE.Mesh(g, mat); d.position.set(-0.017, 0.025, -0.042); group.add(d);
  } else if (type === 'grooves') {
    const g = new THREE.BoxGeometry(0.055, 0.002, 0.006);
    const gm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    [-0.015, 0, 0.015].forEach(z => {
      const groove = new THREE.Mesh(g, gm); groove.position.set(0, 0.024, z); group.add(groove);
    });
  }
}

// ---- HERO CANVAS (auto-rotating preview) ----
const heroCanvas = document.getElementById('heroCanvas');
const hero = createScene(heroCanvas, '#EEF3FF');
const heroGroup = new THREE.Group(); hero.scene.add(heroGroup);
buildChassis(heroGroup);
let heroShell = null, heroGrip = null;
function rebuildHero() {
  if (heroShell) hero.scene.remove(heroShell);
  if (heroGrip) hero.scene.remove(heroGrip);
  const sg = new THREE.Group(); buildShell(sg, state.shell, state.color); heroGroup.add(sg); heroShell = sg;
  const gg = new THREE.Group(); buildGrips(gg, state.grip, state.color); heroGroup.add(gg); heroGrip = gg;
}
rebuildHero();
let heroRot = 0;
function animateHero() {
  requestAnimationFrame(animateHero);
  heroRot += 0.006;
  heroGroup.rotation.y = heroRot;
  heroGroup.rotation.x = 0.25;
  resizeRenderer(hero.renderer, heroCanvas, hero.camera);
  hero.renderer.render(hero.scene, hero.camera);
}
animateHero();

// ---- MAIN CONFIGURATOR CANVAS ----
const mainCanvas = document.getElementById('mainCanvas');
const main = createScene(mainCanvas, '#0A0A14');
const mainGroup = new THREE.Group(); main.scene.add(mainGroup);
buildChassis(mainGroup);
let mShell = null, mGrip = null, mSupport = null, mTactile = null;

function rebuildMain() {
  [mShell, mGrip, mSupport, mTactile].forEach(m => { if (m) mainGroup.remove(m); });
  const sg = new THREE.Group(); buildShell(sg, state.shell, state.color); mainGroup.add(sg); mShell = sg;
  const gg = new THREE.Group(); buildGrips(gg, state.grip, state.color); mainGroup.add(gg); mGrip = gg;
  const sup = new THREE.Group(); buildSupport(sup, state.support, state.color); mainGroup.add(sup); mSupport = sup;
  const tac = new THREE.Group(); buildTactile(tac, state.tactile, state.color); mainGroup.add(tac); mTactile = tac;
  rebuildHero();
}

// Orbit controls
let dragging = false, px = 0, py = 0, rotX = 0.28, rotY = -0.15, zoom = 1;
mainCanvas.addEventListener('mousedown', e => { dragging = true; px = e.clientX; py = e.clientY; });
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  rotY += (e.clientX - px) * 0.008; rotX += (e.clientY - py) * 0.006;
  rotX = Math.max(-0.8, Math.min(1.0, rotX)); px = e.clientX; py = e.clientY;
});
mainCanvas.addEventListener('wheel', e => {
  zoom *= 1 + e.deltaY * 0.001; zoom = Math.max(0.5, Math.min(2.5, zoom)); e.preventDefault();
}, { passive: false });
let lt = null;
mainCanvas.addEventListener('touchstart', e => { lt = e.touches[0]; });
mainCanvas.addEventListener('touchmove', e => {
  if (!lt) return;
  const t = e.touches[0];
  rotY += (t.clientX - lt.clientX) * 0.01; rotX += (t.clientY - lt.clientY) * 0.008;
  rotX = Math.max(-0.8, Math.min(1.0, rotX)); lt = t; e.preventDefault();
}, { passive: false });

// Camera views
const views = {
  perspective: [0.28, -0.15],
  top:         [Math.PI/2, 0],
  front:       [0.05, 0],
  side:        [0.05, Math.PI/2],
};
document.querySelectorAll('.view-btn').forEach(b =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const v = views[b.dataset.view];
    rotX = v[0]; rotY = v[1]; zoom = 1;
  })
);

function animateMain() {
  requestAnimationFrame(animateMain);
  mainGroup.rotation.x = rotX; mainGroup.rotation.y = rotY;
  main.camera.position.setLength(0.36 * zoom);
  main.camera.lookAt(0, 0.01, 0);
  resizeRenderer(main.renderer, mainCanvas, main.camera);
  main.renderer.render(main.scene, main.camera);
}
animateMain();

// ---- UI UPDATES ----
function updateUI() {
  const sh = data.shell[state.shell];
  const gr = data.grip[state.grip];
  const tx = data.texture[state.texture];
  const su = data.support[state.support];
  const ta = data.tactile[state.tactile];

  // Summary
  document.getElementById('sumShell').textContent = sh.name;
  document.getElementById('sumGrip').textContent = gr.name;
  document.getElementById('sumTexture').textContent = tx.name;
  document.getElementById('sumSupport').textContent = su.name;
  document.getElementById('sumTactile').textContent = ta.name;
  document.getElementById('sumColor').textContent = state.colorName;

  // Weight
  const total = BASE_WEIGHT + sh.weight + gr.weight + su.weight;
  document.getElementById('weightNum').textContent = total;
  const pct = Math.max(2, Math.min(100, ((total - 65) / (220 - 65)) * 100));
  document.getElementById('weightFill').style.width = pct + '%';

  // Suitability
  document.getElementById('suitTags').innerHTML =
    sh.suits.map(s => `<span class="suit-tag">${s}</span>`).join('');

  // Print info
  document.getElementById('printMat').textContent = state.texture === 'tpu' ? 'TPU 95A' : 'PETG';
  document.getElementById('printTime').textContent = sh.time;
  document.getElementById('printGrams').textContent = (sh.grams + gr.weight * 0.5).toFixed(0) + 'g';
  document.getElementById('printDiff').textContent = sh.diff;
}

// ---- EVENT LISTENERS ----
document.querySelectorAll('input[name="shell"]').forEach(i =>
  i.addEventListener('change', e => { state.shell = e.target.value; rebuildMain(); updateUI(); })
);
document.querySelectorAll('input[name="grip"]').forEach(i =>
  i.addEventListener('change', e => { state.grip = e.target.value; rebuildMain(); updateUI(); })
);
document.querySelectorAll('input[name="texture"]').forEach(i =>
  i.addEventListener('change', e => { state.texture = e.target.value; updateUI(); })
);
document.querySelectorAll('input[name="support"]').forEach(i =>
  i.addEventListener('change', e => { state.support = e.target.value; rebuildMain(); updateUI(); })
);
document.querySelectorAll('input[name="tactile"]').forEach(i =>
  i.addEventListener('change', e => { state.tactile = e.target.value; rebuildMain(); updateUI(); })
);
document.querySelectorAll('.cswatch').forEach(b =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.cswatch').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.color = b.dataset.color; state.colorName = b.dataset.name;
    document.getElementById('colorLabel').textContent = state.colorName;
    rebuildMain(); updateUI();
  })
);

// ---- DOWNLOAD + SHARE ----
document.getElementById('downloadBtn').addEventListener('click', () => {
  const fname = `pebble_SG_${state.shell}_${state.grip}_${state.support}.3mf`;
  showToast(`Preparing ${fname} for download…`);
  setTimeout(() => showToast('Download ready! Open in your slicer.'), 1600);
});
document.getElementById('shareBtn').addEventListener('click', () => {
  const p = new URLSearchParams({ sh: state.shell, gr: state.grip, tx: state.texture, su: state.support, ta: state.tactile, co: encodeURIComponent(state.color) });
  const url = window.location.origin + window.location.pathname + '?' + p;
  navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast(url));
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ---- NEED CARDS ----
document.querySelectorAll('.need-card').forEach(c =>
  c.addEventListener('click', () => {
    document.querySelectorAll('.need-card').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  })
);

// ---- INIT ----
rebuildMain();
updateUI();
