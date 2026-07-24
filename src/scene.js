import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const GREEN = 0xa5f27a;
const AMBER = 0xf2a640;
const RED = 0xe94335;
const PAPER = 0xe4dfd2;
const BLACK = 0x070707;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
function lerp(a, b, t) { return a + (b - a) * t; }

function makeLabelTexture(text, fg = '#a5f27a', bg = '#071007', width = 512, height = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
  ctx.fillStyle = fg;
  ctx.font = `700 ${Math.floor(height * .34)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function roundedBox(w, h, d, radius, material) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), material);
}

function addEdges(mesh, color = 0x343a36, opacity = .75) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 22),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  edges.renderOrder = 3;
  mesh.add(edges);
  return mesh;
}

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return () => {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ r >>> 15, r | 1);
    r ^= r + Math.imul(r ^ r >>> 7, r | 61);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

export async function createLabScene(canvas, initialQuality = 'auto') {
  const state = {
    quality: initialQuality,
    reducedMotion: false,
    reducedFlashes: false,
    activeChannel: 'subject',
    activeForge: 0,
    clarity: .74,
    gameMode: false,
    gameTransition: 0,
    scrollIndex: 0,
    scrollProgress: 0,
    pointer: new THREE.Vector2(),
    elapsed: 0,
    playerX: 0,
    playerY: 0,
  };

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false });
  await renderer.init();
  renderer.setPixelRatio(getPixelRatio(initialQuality));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = initialQuality !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040504);
  scene.fog = new THREE.FogExp2(0x050605, .022);

  const camera = new THREE.PerspectiveCamera(39, window.innerWidth / window.innerHeight, .1, 180);
  camera.position.set(7.5, 3.4, 13);

  const materials = createMaterials();
  const environment = createEnvironment(materials, state.quality);
  scene.add(environment.group);

  const machine = createMachine(materials);
  scene.add(machine.group);

  const gameWorld = createGameWorld(materials, state.quality);
  gameWorld.group.visible = false;
  scene.add(gameWorld.group);

  const lightRig = createLighting(state.quality);
  scene.add(lightRig.group);

  const clock = new THREE.Clock();
  const targetCamera = new THREE.Vector3();
  const targetLook = new THREE.Vector3();
  const currentLook = new THREE.Vector3();

  function setStoryPosition(index, progress) {
    state.scrollIndex = index;
    state.scrollProgress = progress;
  }

  function setActiveChannel(channel) {
    state.activeChannel = channel;
    machine.channels.forEach((entry) => {
      const active = entry.name === channel;
      entry.lamp.material.emissiveIntensity = active ? 5 : .55;
      entry.lamp.scale.setScalar(active ? 1.35 : 1);
    });
  }

  function setForge(index) {
    state.activeForge = index;
    machine.forgeLamps.forEach((lamp, i) => {
      lamp.material.emissive.setHex(i === index ? GREEN : AMBER);
      lamp.material.emissiveIntensity = i === index ? 4.5 : .4;
    });
  }

  function setClarity(value) {
    state.clarity = clamp01(value);
    machine.clarityBar.scale.x = Math.max(.02, state.clarity);
    machine.clarityBar.position.x = -1.12 + 1.12 * state.clarity;
    machine.warningLamp.material.emissiveIntensity = lerp(4.2, .35, state.clarity);
  }

  function setReducedMotion(value) { state.reducedMotion = value; }
  function setReducedFlashes(value) { state.reducedFlashes = value; }

  function setQuality(value) {
    state.quality = value;
    renderer.setPixelRatio(getPixelRatio(value));
    renderer.shadowMap.enabled = value !== 'low';
    renderer.shadowMap.needsUpdate = true;
    gameWorld.stars.visible = value !== 'low';
    gameWorld.dust.visible = value === 'high' || value === 'auto';
    resize();
  }

  function enterGame() {
    state.gameMode = true;
    state.gameTransition = 0;
    gameWorld.group.visible = true;
  }

  function exitGame() {
    state.gameMode = false;
    state.gameTransition = 0;
    gameWorld.group.visible = false;
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPixelRatio(state.quality));
    renderer.setSize(w, h, false);
  }

  function updatePointer(x, y) {
    state.pointer.x = x;
    state.pointer.y = y;
  }

  function update() {
    const dt = Math.min(.05, clock.getDelta());
    state.elapsed += dt;

    if (state.gameMode) {
      state.gameTransition = Math.min(1, state.gameTransition + dt * .62);
      applyGameTransform(machine, camera, lightRig, gameWorld, state, targetCamera, dt);
    } else {
      applyStoryTransform(machine, camera, lightRig, state, targetCamera, targetLook, currentLook, dt);
    }

    animateMachine(machine, state, dt);
    animateEnvironment(environment, state, dt);
    animateGameWorld(gameWorld, state, dt);
    renderer.render(scene, camera);
    return dt;
  }

  function destroy() {
    renderer.setAnimationLoop(null);
    const geometries = new Set();
    const materialsToDispose = new Set();
    const textures = new Set();
    scene.traverse((node) => {
      if (node.geometry) geometries.add(node.geometry);
      const nodeMaterials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      for (const material of nodeMaterials) {
        materialsToDispose.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
      }
    });
    geometries.forEach((geometry) => geometry.dispose?.());
    textures.forEach((texture) => texture.dispose?.());
    materialsToDispose.forEach((material) => material.dispose?.());
    renderer.dispose();
  }

  return {
    renderer,
    scene,
    camera,
    materials,
    machine,
    gameWorld,
    state,
    setStoryPosition,
    setActiveChannel,
    setForge,
    setClarity,
    setReducedMotion,
    setReducedFlashes,
    setQuality,
    enterGame,
    exitGame,
    updatePointer,
    update,
    resize,
    destroy,
    get backend() { return renderer.backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL 2'; }
  };
}

function getPixelRatio(quality) {
  const device = window.devicePixelRatio || 1;
  if (quality === 'low') return Math.min(1, device);
  if (quality === 'medium') return Math.min(1.35, device);
  if (quality === 'high') return Math.min(2, device);
  const memory = navigator.deviceMemory || 4;
  return Math.min(memory >= 8 && innerWidth > 900 ? 1.75 : 1.2, device);
}

function createMaterials() {
  const blackSteel = new THREE.MeshStandardMaterial({ color: 0x0b0d0c, metalness: .74, roughness: .37 });
  const anodized = new THREE.MeshPhysicalMaterial({ color: 0x111513, metalness: .92, roughness: .23, clearcoat: .28, clearcoatRoughness: .44 });
  const gunmetal = new THREE.MeshStandardMaterial({ color: 0x252b28, metalness: .8, roughness: .31 });
  const worn = new THREE.MeshStandardMaterial({ color: 0x3b3d37, metalness: .67, roughness: .56 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x080908, metalness: .04, roughness: .92 });
  const paper = new THREE.MeshStandardMaterial({ color: 0xd6cfbc, metalness: 0, roughness: .88, side: THREE.DoubleSide });
  const acrylic = new THREE.MeshPhysicalMaterial({ color: 0x111a15, roughness: .16, metalness: .05, transparent: true, opacity: .42, transmission: .18, thickness: .35, clearcoat: 1 });
  const greenLamp = new THREE.MeshStandardMaterial({ color: 0x10250d, emissive: GREEN, emissiveIntensity: 2.8, roughness: .28 });
  const amberLamp = new THREE.MeshStandardMaterial({ color: 0x2b1605, emissive: AMBER, emissiveIntensity: 1.2, roughness: .3 });
  const redLamp = new THREE.MeshStandardMaterial({ color: 0x2c0804, emissive: RED, emissiveIntensity: 2.8, roughness: .3 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x6d442d, metalness: .88, roughness: .42 });
  const white = new THREE.MeshStandardMaterial({ color: PAPER, metalness: .05, roughness: .78 });
  return { blackSteel, anodized, gunmetal, worn, rubber, paper, acrylic, greenLamp, amberLamp, redLamp, copper, white };
}

function createEnvironment(mat, quality) {
  const group = new THREE.Group();
  group.name = 'LaboratoryEnvironment';

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: 0x080a08, roughness: .83, metalness: .18 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.15;
  floor.receiveShadow = true;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0b, roughness: .8, metalness: .25 });
  for (let i = -5; i <= 5; i += 1) {
    const rib = roundedBox(.22, 9, .35, .04, wallMat);
    rib.position.set(i * 2.3, .4, -6.7);
    group.add(rib);
  }
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), wallMat);
  rear.position.set(0, .2, -6.9);
  group.add(rear);

  const cables = new THREE.Group();
  for (let i = 0; i < 10; i += 1) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7 + i * 1.5, 4.2, -6.2),
      new THREE.Vector3(-6.5 + i * 1.4, 1.8, -6.1),
      new THREE.Vector3(-5.8 + i * 1.3, -1.3, -5.7),
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .035 + (i % 3) * .012, 6, false), mat.rubber);
    cables.add(tube);
  }
  group.add(cables);

  const random = seededRandom(27);
  const particleCount = quality === 'low' ? 80 : 260;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (random() - .5) * 24;
    positions[i * 3 + 1] = random() * 10 - 3;
    positions[i * 3 + 2] = random() * 16 - 8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: PAPER, size: .018, transparent: true, opacity: .3, depthWrite: false }));
  group.add(dust);

  return { group, floor, cables, dust };
}

function createLighting(quality) {
  const group = new THREE.Group();
  const ambient = new THREE.HemisphereLight(0x87998a, 0x090a09, .48);
  group.add(ambient);

  const key = new THREE.SpotLight(0xe4dfd2, 110, 55, Math.PI * .22, .45, 1.3);
  key.position.set(-7, 9, 8);
  key.target.position.set(0, 0, 0);
  key.castShadow = quality !== 'low';
  key.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
  group.add(key, key.target);

  const green = new THREE.PointLight(GREEN, 12, 14, 2);
  green.position.set(3.5, 1.2, 2.8);
  group.add(green);

  const amber = new THREE.PointLight(AMBER, 8, 12, 2);
  amber.position.set(-4, -.5, 3);
  group.add(amber);

  const red = new THREE.PointLight(RED, 0, 14, 2);
  red.position.set(0, 3, 1);
  group.add(red);

  return { group, ambient, key, green, amber, red };
}

function createMachine(mat) {
  const group = new THREE.Group();
  group.name = 'GMP-01_PROMPT_SYNTHESIS_ARRAY';

  const chassis = roundedBox(8.6, 5.8, 4.2, .28, mat.blackSteel);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  addEdges(chassis, 0x3a413c, .62);
  group.add(chassis);

  const frontPanel = roundedBox(8.05, 5.25, .35, .18, mat.anodized);
  frontPanel.position.z = 2.08;
  frontPanel.castShadow = true;
  group.add(frontPanel);

  const topHousing = roundedBox(5.2, 1.2, 1.8, .17, mat.gunmetal);
  topHousing.position.set(.6, 3.15, .2);
  topHousing.rotation.z = -.025;
  addEdges(topHousing);
  group.add(topHousing);

  const feet = [];
  for (const x of [-3.25, 3.25]) {
    for (const z of [-1.55, 1.55]) {
      const foot = roundedBox(.7, .45, .72, .12, mat.rubber);
      foot.position.set(x, -3.1, z);
      group.add(foot);
      feet.push(foot);
    }
  }

  const labelMaterial = new THREE.MeshBasicMaterial({ map: makeLabelTexture('GMP-01 // PROMPT SYNTHESIS ARRAY', '#e4dfd2', '#101110'), toneMapped: false });
  const identityPlate = new THREE.Mesh(new THREE.PlaneGeometry(3.35, .56), labelMaterial);
  identityPlate.position.set(-1.85, 2.05, 2.27);
  group.add(identityPlate);

  const crtGroup = new THREE.Group();
  crtGroup.name = 'RawSignalCRT';
  crtGroup.position.set(-2.25, .62, 2.28);
  const crtFrame = roundedBox(3.15, 2.05, .42, .22, mat.worn);
  crtGroup.add(crtFrame);
  const crtTexture = makeLabelTexture('RAW SIGNAL // UNSTABLE', '#a5f27a', '#061008', 640, 360);
  const crtScreenMat = new THREE.MeshBasicMaterial({ map: crtTexture, color: 0xc8ffb2, toneMapped: false });
  const crt = roundedBox(2.66, 1.58, .12, .26, crtScreenMat);
  crt.position.z = .25;
  crtGroup.add(crt);
  group.add(crtGroup);

  const intake = new THREE.Group();
  intake.name = 'RawSignalIntake';
  intake.position.set(-2.35, -1.25, 2.35);
  const intakeBody = roundedBox(3.1, 1.25, .6, .15, mat.gunmetal);
  intake.add(intakeBody);
  const intakeWindow = roundedBox(2.45, .58, .12, .08, mat.acrylic);
  intakeWindow.position.z = .36;
  intake.add(intakeWindow);
  const rollers = [];
  for (const x of [-.82, .82]) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .64, 20), mat.worn);
    roller.rotation.z = Math.PI / 2;
    roller.position.set(x, 0, .39);
    roller.castShadow = true;
    intake.add(roller);
    rollers.push(roller);
  }
  group.add(intake);

  const promptTape = new THREE.Mesh(new THREE.PlaneGeometry(9.2, .34, 32, 1), mat.paper.clone());
  promptTape.material.map = makeLabelTexture('RAW IDEA  /  SUBJECT ?  /  STYLE ?  /  CAMERA ?  /  LIGHT ?  /  MOTION ?', '#161814', '#d6cfbc', 1600, 96);
  promptTape.material.map.wrapS = THREE.RepeatWrapping;
  promptTape.material.map.repeat.set(2.4, 1);
  promptTape.position.set(-5.8, -1.22, 2.72);
  group.add(promptTape);

  const splitter = new THREE.Group();
  splitter.name = 'SemanticSplitter';
  splitter.position.set(1.85, .72, 2.35);
  const splitterBase = roundedBox(3.4, 3.9, .55, .18, mat.gunmetal);
  splitter.add(splitterBase);
  group.add(splitter);

  const channelNames = ['subject', 'style', 'camera', 'light', 'motion'];
  const channelColors = [GREEN, 0x7fd4ff, AMBER, 0xf7e56c, 0xd888ff];
  const channels = [];
  channelNames.forEach((name, i) => {
    const channel = new THREE.Group();
    channel.name = `Channel_${name}`;
    const y = 1.3 - i * .65;
    channel.position.set(0, y, .38);
    const rail = roundedBox(2.45, .25, .2, .06, mat.blackSteel);
    channel.add(rail);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x091109, emissive: channelColors[i], emissiveIntensity: i === 0 ? 5 : .55, roughness: .22 });
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 20), lampMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(-1.07, 0, .18);
    channel.add(lamp);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .22), new THREE.MeshBasicMaterial({ map: makeLabelTexture(name.toUpperCase(), '#e4dfd2', '#121412', 360, 72), toneMapped: false }));
    label.position.set(.26, 0, .2);
    channel.add(label);
    splitter.add(channel);
    channels.push({ name, group: channel, lamp, baseY: y, color: channelColors[i] });
  });

  const router = new THREE.Group();
  router.name = 'ModalityRouter';
  router.position.set(0, -.4, .3);
  const routerRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, .2, 12, 48), mat.copper);
  routerRing.rotation.x = Math.PI / 2;
  router.add(routerRing);
  const routerCore = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .45, 32), mat.anodized);
  routerCore.rotation.x = Math.PI / 2;
  router.add(routerCore);
  group.add(router);

  const forgeLamps = [];
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 8), mat.amberLamp.clone());
    lamp.position.set(Math.cos(angle) * .72, Math.sin(angle) * .72, .32);
    router.add(lamp);
    forgeLamps.push(lamp);
  }

  const constraint = new THREE.Group();
  constraint.name = 'ConstraintLattice';
  constraint.position.set(0, .2, 2.5);
  for (let i = 0; i < 7; i += 1) {
    const bar = roundedBox(5.1 - i * .25, .06, .08, .025, i % 2 ? mat.copper : mat.worn);
    bar.position.y = 1.5 - i * .5;
    bar.rotation.z = (i % 2 ? 1 : -1) * .04;
    constraint.add(bar);
  }
  constraint.visible = false;
  group.add(constraint);

  const clarityHousing = roundedBox(2.7, .48, .18, .06, mat.blackSteel);
  clarityHousing.position.set(2.1, -2.08, 2.32);
  group.add(clarityHousing);
  const clarityBar = new THREE.Mesh(new THREE.BoxGeometry(2.24, .13, .08), mat.greenLamp.clone());
  clarityBar.geometry.translate(1.12, 0, 0);
  clarityBar.position.set(.98, -2.08, 2.45);
  clarityBar.scale.x = .74;
  group.add(clarityBar);

  const warningLamp = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 24), mat.redLamp.clone());
  warningLamp.rotation.x = Math.PI / 2;
  warningLamp.position.set(3.55, 2.08, 2.29);
  group.add(warningLamp);

  const knobs = [];
  for (let i = 0; i < 9; i += 1) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(.12, .15, .18, 18), i % 3 === 0 ? mat.worn : mat.rubber);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(-.6 + (i % 3) * .48, -1.4 - Math.floor(i / 3) * .43, 2.3);
    group.add(knob);
    knobs.push(knob);
  }

  const archive = new THREE.Group();
  archive.name = 'FailureArchive';
  for (let i = 0; i < 6; i += 1) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1.55, .95), new THREE.MeshBasicMaterial({ map: makeLabelTexture(`FAIL_${String(i + 1).padStart(3,'0')} // QUARANTINED`, i % 2 ? '#e94335' : '#f2a640', '#100706', 480, 300), side: THREE.DoubleSide, toneMapped: false }));
    card.position.set((i % 3 - 1) * 1.8, 1 - Math.floor(i / 3) * 1.25, 0);
    card.rotation.z = (i - 2.5) * .035;
    archive.add(card);
  }
  archive.position.set(0, 0, 3.1);
  archive.visible = false;
  group.add(archive);

  const operator = new THREE.Group();
  operator.name = 'OperatorConsole';
  const consoleBody = roundedBox(6.9, 1.35, 2.1, .2, mat.anodized);
  consoleBody.rotation.x = -.3;
  operator.add(consoleBody);
  const operatorLamps = [];
  channelNames.forEach((name, i) => {
    const x = -2.4 + i * 1.2;
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(.35, .42, .24, 28), mat.worn);
    dial.rotation.x = Math.PI / 2 - .3;
    dial.position.set(x, .22, 1.02);
    operator.add(dial);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), new THREE.MeshStandardMaterial({ color: channelColors[i], emissive: channelColors[i], emissiveIntensity: 2 }));
    lamp.position.set(x, .63, .82);
    operator.add(lamp);
    operatorLamps.push(lamp);
  });
  operator.position.set(0, -3.35, 1.35);
  operator.visible = false;
  group.add(operator);

  const playerPlatform = new THREE.Group();
  playerPlatform.name = 'GMP_DefensePlatform';
  const core = roundedBox(2.4, .62, 1.2, .18, mat.anodized);
  playerPlatform.add(core);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.17, .28, 1.4, 20), mat.copper);
  muzzle.rotation.z = Math.PI / 2;
  muzzle.position.y = .55;
  playerPlatform.add(muzzle);
  const shieldRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, .06, 8, 40), mat.greenLamp.clone());
  shieldRing.rotation.x = Math.PI / 2;
  playerPlatform.add(shieldRing);
  playerPlatform.visible = false;
  group.add(playerPlatform);

  group.rotation.y = -.1;
  group.position.y = -.1;

  return {
    group, chassis, frontPanel, topHousing, feet, crtGroup, crt, intake, rollers, promptTape,
    splitter, channels, router, forgeLamps, constraint, clarityBar, warningLamp, knobs,
    archive, operator, operatorLamps, playerPlatform
  };
}

function createGameWorld(mat, quality) {
  const group = new THREE.Group();
  group.name = 'SignalSiegeWorld';
  group.position.z = -8;

  const grid = new THREE.GridHelper(34, 34, GREEN, 0x15301b);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -5;
  grid.material.transparent = true;
  grid.material.opacity = .22;
  group.add(grid);

  const boundaryMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: .22 });
  const boundaryPoints = [
    new THREE.Vector3(-8.5,-5,0), new THREE.Vector3(8.5,-5,0),
    new THREE.Vector3(8.5,5,0), new THREE.Vector3(-8.5,5,0), new THREE.Vector3(-8.5,-5,0)
  ];
  const boundary = new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundaryPoints), boundaryMat);
  group.add(boundary);

  const random = seededRandom(117);
  const starCount = quality === 'low' ? 80 : 340;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    positions[i*3] = (random() - .5) * 28;
    positions[i*3+1] = (random() - .5) * 19;
    positions[i*3+2] = -random() * 15;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: GREEN, size: .035, transparent: true, opacity: .42 }));
  group.add(stars);

  const dustPositions = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i += 1) {
    dustPositions[i*3] = (random() - .5) * 18;
    dustPositions[i*3+1] = (random() - .5) * 12;
    dustPositions[i*3+2] = random() * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: PAPER, size: .018, transparent: true, opacity: .2 }));
  group.add(dust);

  return { group, grid, boundary, stars, dust };
}

function applyStoryTransform(machine, camera, lights, state, targetCamera, targetLook, currentLook, dt) {
  const i = state.scrollIndex;
  const p = smooth(state.scrollProgress);
  const reduce = state.reducedMotion;
  const ease = reduce ? 1 : Math.min(1, dt * 3.2);

  const cameraStates = [
    [[7.5, 3.4, 13], [0,0,0]],
    [[-5.6, -.3, 8.7], [-2,-.4,1.3]],
    [[6.2, 1.1, 9.6], [1.2,.45,1.1]],
    [[0, 5.4, 11], [0,0,0]],
    [[5.7, 1.6, 8.4], [0,.1,1.4]],
    [[0, .4, 10.5], [0,0,2]],
    [[-4.8, 3.8, 9], [0,-.6,1]],
    [[0, 2.6, 11.8], [0,-1.2,1]],
    [[0, 0, 15], [0,0,-5]],
    [[0, 2.2, 12.5], [0,0,0]],
  ];
  const a = cameraStates[Math.min(i, cameraStates.length - 1)];
  const b = cameraStates[Math.min(i + 1, cameraStates.length - 1)];
  for (let axis = 0; axis < 3; axis += 1) {
    targetCamera.setComponent(axis, lerp(a[0][axis], b[0][axis], p));
    targetLook.setComponent(axis, lerp(a[1][axis], b[1][axis], p));
  }
  if (!reduce) {
    targetCamera.x += state.pointer.x * .38;
    targetCamera.y += state.pointer.y * .2;
  }
  camera.position.lerp(targetCamera, ease);
  camera.getWorldDirection(currentLook);
  currentLook.multiplyScalar(7).add(camera.position).lerp(targetLook, ease);
  camera.lookAt(currentLook);

  machine.group.visible = i < 9 || p < .6;
  machine.group.scale.setScalar(1);
  machine.group.position.set(0, -.1, 0);
  machine.group.rotation.x = 0;
  machine.group.rotation.y = lerp(-.1, .08, Math.sin(state.elapsed * .12) * .5 + .5);
  machine.chassis.scale.set(1, 1, 1);
  machine.frontPanel.scale.set(1, 1, 1);
  machine.topHousing.position.set(.6, 3.15, .2);
  machine.topHousing.scale.set(1, 1, 1);
  machine.intake.position.set(-2.35, -1.25, 2.35);
  machine.splitter.position.set(1.85, .72, 2.35);
  machine.router.position.set(0, -.4, .3);
  machine.promptTape.visible = true;
  machine.operator.position.set(0, -3.35, 1.35);
  machine.operator.rotation.set(0, 0, 0);

  machine.constraint.visible = i === 4;
  machine.archive.visible = i === 5;
  machine.operator.visible = i >= 6 && i <= 7;
  machine.playerPlatform.visible = false;
  machine.frontPanel.visible = i !== 5;
  machine.crtGroup.visible = i !== 5;

  const explode = i === 2 ? Math.sin(p * Math.PI) : 0;
  machine.channels.forEach((entry, idx) => {
    const direction = idx - 2;
    entry.group.position.x = explode * (1.2 + Math.abs(direction) * .2) * (direction === 0 ? .25 : Math.sign(direction));
    entry.group.position.y = entry.baseY + explode * direction * .55;
    entry.group.position.z = explode * .95;
  });

  machine.router.rotation.z = lerp(machine.router.rotation.z, state.activeForge * -Math.PI / 2 + state.elapsed * .04, Math.min(1, dt * 4));
  machine.router.scale.setScalar(i === 3 ? 1 + Math.sin(p * Math.PI) * .35 : 1);

  if (i === 4) {
    machine.constraint.rotation.z = Math.sin(state.elapsed * .25) * .025;
    machine.warningLamp.material.emissiveIntensity = lerp(4.2, .4, state.clarity);
  }

  if (i === 5) {
    machine.archive.position.z = lerp(4.2, 2.5, p);
    machine.archive.rotation.y = lerp(-.1, .1, p);
  }

  if (i === 7) {
    const assemble = p;
    machine.operator.position.y = lerp(-3.35, -2.55, assemble);
    machine.operator.rotation.x = lerp(.16, -.05, assemble);
    machine.topHousing.position.y = lerp(3.15, 2.8, assemble);
  }

  lights.red.intensity = i === 4 ? 12 * (1 - state.clarity) : i === 5 ? 2 : 0;
  lights.green.intensity = i === 5 ? 3 : 12;
  lights.amber.intensity = i === 4 ? 11 : 7;
}

function applyGameTransform(machine, camera, lights, gameWorld, state, targetCamera, dt) {
  const t = smooth(state.gameTransition);
  machine.constraint.visible = false;
  machine.archive.visible = false;
  machine.crtGroup.visible = false;
  machine.frontPanel.visible = true;
  machine.operator.visible = t < .7;
  machine.playerPlatform.visible = t > .35;

  machine.group.position.set(state.playerX, lerp(-.1, -4.25, t) + state.playerY, lerp(0, -1.5, t));
  machine.group.rotation.set(lerp(0, -.06, t), lerp(-.1, 0, t), 0);
  machine.group.scale.setScalar(lerp(1, .55, t));
  machine.chassis.scale.x = lerp(1, .38, t);
  machine.chassis.scale.y = lerp(1, .32, t);
  machine.frontPanel.scale.x = lerp(1, .42, t);
  machine.frontPanel.scale.y = lerp(1, .35, t);
  machine.topHousing.position.y = lerp(3.15, .8, t);
  machine.topHousing.scale.set(lerp(1, .5, t), lerp(1,.45,t), lerp(1,.55,t));
  machine.intake.position.x = lerp(-2.35, -1.2, t);
  machine.splitter.position.x = lerp(1.85, 1.2, t);
  machine.promptTape.visible = t < .72;
  machine.router.position.y = lerp(-.4, .2, t);
  machine.playerPlatform.position.set(0, .9, 1.2);

  targetCamera.set(0, 0, lerp(12, 14.5, t));
  camera.position.lerp(targetCamera, Math.min(1, dt * 2.5));
  camera.lookAt(0, 0, -3);
  gameWorld.group.position.z = lerp(-20, -4, t);
  gameWorld.group.rotation.z = Math.sin(state.elapsed * .08) * .01;
  lights.green.intensity = 18;
  lights.amber.intensity = 4;
  lights.red.intensity = 2;
}

function animateMachine(machine, state, dt) {
  const speed = state.reducedMotion ? .15 : 1;
  machine.rollers.forEach((roller, i) => { roller.rotation.x += dt * (i ? -4 : 4) * speed; });
  if (machine.promptTape.material.map) machine.promptTape.material.map.offset.x -= dt * .12 * speed;
  machine.knobs.forEach((knob, i) => { knob.rotation.y += dt * (.08 + i * .004) * speed; });
  machine.operatorLamps.forEach((lamp, i) => { lamp.material.emissiveIntensity = 1.2 + Math.sin(state.elapsed * 2 + i) * .5; });
  machine.playerPlatform.rotation.y = Math.sin(state.elapsed * .7) * .035;
  machine.playerPlatform.children.forEach((child, i) => {
    if (child.geometry?.type === 'TorusGeometry') child.rotation.z += dt * .5;
  });
  if (!state.reducedMotion && !state.reducedFlashes) machine.crt.material.color.setHSL(.27, .9, .55 + Math.sin(state.elapsed * 19) * .012);
  else machine.crt.material.color.setHSL(.27, .86, .55);
}

function animateEnvironment(environment, state, dt) {
  if (!state.reducedMotion) {
    environment.dust.rotation.y += dt * .008;
    environment.dust.position.y = Math.sin(state.elapsed * .08) * .1;
  }
}

function animateGameWorld(world, state, dt) {
  if (!world.group.visible) return;
  world.grid.position.y = ((state.elapsed * .35) % 1) - .5;
  world.stars.position.y -= dt * .16;
  if (world.stars.position.y < -1) world.stars.position.y = 0;
  world.dust.rotation.z += dt * .012;
}
