import { createLabScene } from './scene.js';
import { LabAudio } from './audio.js';
import { FRAGMENTS, SignalSiegeGame, describeLoadout } from './game.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

const canvas = $('#scene');
const boot = $('#boot');
const bootBar = $('#bootBar');
const bootStatus = $('#bootStatus');
const enterButton = $('#enterButton');
const signalRailFill = $('#signalRailFill');
const liveStatus = $('#liveStatus');
const sections = $$('.story-section');
const audio = new LabAudio();

let lab;
let game;
let muted = true;
let savedScrollY = 0;
let qualityIndex = 0;
const qualities = ['auto', 'high', 'medium', 'low'];
const reducedBySystem = matchMedia('(prefers-reduced-motion: reduce)').matches;
let reducedMotion = reducedBySystem;
let reducedFlashes = reducedBySystem;
let reducedShake = reducedBySystem;
let scrollTicking = false;
let resizeFrame = 0;
let cleanedUp = false;
let gameInitialized = false;
let composerSelection = { subject: 0, style: 0, camera: 2, light: 4, motion: 0 };

const ui = {
  gameHud: $('#gameHud'),
  health: $('#hudHealth'),
  combo: $('#hudCombo'),
  heat: $('#hudHeat'),
  wave: $('#hudWave'),
  score: $('#hudScore'),
  fragmentRack: $('#fragmentRack'),
  abilityButton: $('#abilityButton'),
  pauseOverlay: $('#pauseOverlay'),
  resultsOverlay: $('#resultsOverlay'),
  resultsEyebrow: $('#resultsEyebrow'),
  resultsTitle: $('#resultsTitle'),
  resultsCopy: $('#resultsCopy'),
  resultScore: $('#resultScore'),
  bestScore: $('#bestScore'),
  bossIndicator: $('#bossIndicator'),
  bossMeter: $('#bossMeter'),
  liveStatus,
};

async function initialize() {
  try {
    setBoot(10, 'CHECKING RENDER BACKEND');
    lab = await createLabScene(canvas, qualities[qualityIndex]);
    setBoot(45, `RENDER BACKEND: ${lab.backend.toUpperCase()}`);
    setupComposer();
    setupInteractions();
    setBoot(72, 'ROUTING FIVE-CHANNEL INPUT');
    updateScrollState();
    lab.setReducedMotion(reducedMotion);
    lab.setReducedFlashes(reducedFlashes);
    document.body.classList.toggle('reduced-motion', reducedMotion);
    $('#motionButton').setAttribute('aria-pressed', String(reducedMotion));
    $('#motionButton').textContent = reducedMotion ? 'MOTION: REDUCED' : 'REDUCE MOTION';
    $('#flashesButton').setAttribute('aria-pressed', String(reducedFlashes));
    $('#flashesButton').textContent = reducedFlashes ? 'FLASHES: REDUCED' : 'FLASHES: FULL';
    $('#shakeButton').setAttribute('aria-pressed', String(reducedShake));
    $('#shakeButton').textContent = reducedShake ? 'SHAKE: REDUCED' : 'SHAKE: FULL';
    updateConstraintClarity();
    setBoot(100, 'OPERATOR STATUS: UNVERIFIED');
    enterButton.disabled = false;
    enterButton.textContent = 'ENTER TRANSMISSION';
    startLoop();
  } catch (error) {
    console.error(error);
    bootStatus.textContent = 'RENDER INITIALIZATION FAILED';
    enterButton.disabled = true;
    const message = document.createElement('p');
    message.className = 'warning-line';
    message.textContent = 'This browser could not initialize the WebGPU/WebGL 2 renderer. Try current Chrome, Safari, Firefox, or Edge with hardware acceleration enabled.';
    $('.boot__frame').append(message);
  }
}

function setBoot(percent, message) {
  bootBar.style.width = `${percent}%`;
  bootStatus.textContent = message;
}

function setupComposer() {
  const selects = $$('[data-compose]');
  selects.forEach((select) => {
    const category = select.dataset.compose;
    FRAGMENTS[category].forEach((fragment, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = fragment.name;
      select.append(option);
    });
    select.value = String(composerSelection[category]);
    select.addEventListener('focus', () => lab.setActiveChannel(category));
    select.addEventListener('change', () => {
      composerSelection[category] = Number(select.value);
      lab.setActiveChannel(category);
      audio.select();
      updateComposerReadout();
      game?.setSelection(composerSelection);
    });
  });
  updateComposerReadout();
}

function updateComposerReadout() {
  const subject = FRAGMENTS.subject[composerSelection.subject];
  const style = FRAGMENTS.style[composerSelection.style];
  const camera = FRAGMENTS.camera[composerSelection.camera];
  const light = FRAGMENTS.light[composerSelection.light];
  const motion = FRAGMENTS.motion[composerSelection.motion];
  const weapon = describeLoadout(composerSelection);
  $('#promptPreview').textContent = `A ${subject.name.toLowerCase()} signal entity, ${style.name.toLowerCase()} visual language, ${camera.name.toLowerCase()} camera, ${light.name.toLowerCase()} light, ${motion.name.toLowerCase()} motion.`;
  $('#composerClarity').textContent = `${Math.round(weapon.clarity * 100)}%`;
  $('#weaponPreview').textContent = weapon.name;
  lab?.setClarity(weapon.clarity);
}

function setupInteractions() {
  enterButton.addEventListener('click', async () => {
    const audioReady = await audio.unlock();
    muted = !audioReady;
    audio.setMuted(muted);
    updateMuteUI();
    if (audioReady) audio.startup();
    boot.classList.add('is-hidden');
    setTimeout(() => boot.remove(), 800);
  });

  $$('.anatomy-lines button').forEach((button) => {
    const activate = () => {
      $$('.anatomy-lines button').forEach((other) => other.classList.remove('is-active'));
      button.classList.add('is-active');
      lab.setActiveChannel(button.dataset.channel);
      audio.relay();
    };
    button.addEventListener('pointerenter', activate);
    button.addEventListener('focus', activate);
    button.addEventListener('click', activate);
  });

  const forgeReadouts = [
    'FRAME / COMPOSITION / SURFACE / COLOR',
    'SEQUENCE / CONTINUITY / CAMERA / TRANSFORMATION',
    'RHYTHM / TEXTURE / FREQUENCY / PRESSURE',
    'OFFER / WORKFLOW / RESEARCH / REPEATABLE ACTION',
  ];
  $$('.forge-tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.forge);
      $$('.forge-tabs button').forEach((other, i) => other.setAttribute('aria-selected', String(i === index)));
      $('#forgeReadout').textContent = forgeReadouts[index];
      lab.setForge(index);
      audio.relay();
    });
  });

  $$('[data-constraint]').forEach((input) => input.addEventListener('change', updateConstraintClarity));

  $('#qualityButton').addEventListener('click', () => {
    qualityIndex = (qualityIndex + 1) % qualities.length;
    const quality = qualities[qualityIndex];
    lab.setQuality(quality);
    $('#qualityButton').textContent = `QUALITY: ${quality.toUpperCase()}`;
    liveStatus.textContent = `Rendering quality set to ${quality}.`;
  });

  $('#motionButton').addEventListener('click', () => {
    reducedMotion = !reducedMotion;
    lab.setReducedMotion(reducedMotion);
    document.body.classList.toggle('reduced-motion', reducedMotion);
    $('#motionButton').setAttribute('aria-pressed', String(reducedMotion));
    $('#motionButton').textContent = reducedMotion ? 'MOTION: REDUCED' : 'REDUCE MOTION';
  });

  $('#flashesButton').addEventListener('click', () => {
    reducedFlashes = !reducedFlashes;
    lab.setReducedFlashes(reducedFlashes);
    $('#flashesButton').setAttribute('aria-pressed', String(reducedFlashes));
    $('#flashesButton').textContent = reducedFlashes ? 'FLASHES: REDUCED' : 'FLASHES: FULL';
    liveStatus.textContent = reducedFlashes ? 'Reduced flashes enabled.' : 'Full flashes enabled.';
  });

  $('#shakeButton').addEventListener('click', () => {
    reducedShake = !reducedShake;
    game?.setReducedShake(reducedShake);
    $('#shakeButton').setAttribute('aria-pressed', String(reducedShake));
    $('#shakeButton').textContent = reducedShake ? 'SHAKE: REDUCED' : 'SHAKE: FULL';
    liveStatus.textContent = reducedShake ? 'Reduced camera shake enabled.' : 'Full camera shake enabled.';
  });

  $('#fullscreenButton').addEventListener('click', toggleFullscreen);
  $('#muteButton').addEventListener('click', toggleMute);
  $('#gameMuteButton').addEventListener('click', toggleMute);

  $('#playButton').addEventListener('click', async () => {
    const audioReady = await audio.unlock();
    if (audioReady && muted) {
      muted = false;
      audio.setMuted(false);
      updateMuteUI();
    }
    ensureGame();
    game.setSelection(composerSelection);
    game.setReducedShake(reducedShake);
    $('#gameIntro').hidden = true;
    if (!document.body.classList.contains('game-active')) lockPage();
    game.start();
  });

  $('#viewEndingButton').addEventListener('click', () => {
    $('#ending').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    liveStatus.textContent = 'Static ending displayed.';
  });

  $('#pauseButton').addEventListener('click', () => game?.togglePause());
  $('#resumeButton').addEventListener('click', () => game?.resume());
  $('#restartButton').addEventListener('click', () => {
    ensureGame();
    game.setSelection(composerSelection);
    game.setReducedShake(reducedShake);
    if (!document.body.classList.contains('game-active')) lockPage();
    game.start();
  });
  $('#returnButton').addEventListener('click', () => {
    game?.stop();
    $('#gameIntro').hidden = false;
    unlockPage();
    requestAnimationFrame(() => $('#game').scrollIntoView({ behavior: 'auto' }));
  });

  window.addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      lab.resize();
      if (game?.running) game.pause();
      updateScrollState();
    });
  });
  window.addEventListener('orientationchange', () => {
    if (game?.running) {
      game.pause();
      liveStatus.textContent = 'Game paused while orientation changes.';
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game?.running) game.pause();
  });

  window.addEventListener('scroll', () => {
    if (document.body.classList.contains('game-active') || scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      updateScrollState();
      scrollTicking = false;
    });
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    if (!document.body.classList.contains('game-active')) return;
    if (location.hash !== '#game') {
      game?.stop();
      $('#gameIntro').hidden = false;
      unlockPage();
    }
  });

  window.addEventListener('pointermove', (event) => {
    if (!lab || game?.running) return;
    lab.updatePointer(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight * 2 - 1));
  }, { passive: true });
}

function updateConstraintClarity() {
  const identity = $('[data-constraint="identity"]').checked;
  const continuity = $('[data-constraint="continuity"]').checked;
  const noise = $('[data-constraint="noise"]').checked;
  const value = clamp(42 + (identity ? 22 : 0) + (continuity ? 20 : 0) - (noise ? 28 : 0), 0, 100);
  $('#clarityMeter').value = value;
  $('#clarityValue').textContent = `${value}%`;
  lab.setClarity(value / 100);
  audio.relay();
}

async function toggleMute() {
  if (!audio.ctx) {
    const audioReady = await audio.unlock();
    if (!audioReady) {
      muted = true;
      updateMuteUI();
      liveStatus.textContent = 'Web Audio is unavailable in this browser.';
      return;
    }
  }
  muted = !muted;
  audio.setMuted(muted);
  updateMuteUI();
}

function updateMuteUI() {
  $('#muteButton').textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
  $('#muteButton').setAttribute('aria-pressed', String(!muted));
  $('#gameMuteButton').textContent = muted ? 'UNMUTE' : 'MUTE';
}


async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen unsupported');
      await document.documentElement.requestFullscreen();
      $('#fullscreenButton').textContent = 'EXIT FULLSCREEN';
    } else {
      await document.exitFullscreen?.();
      $('#fullscreenButton').textContent = 'FULLSCREEN';
    }
  } catch {
    liveStatus.textContent = 'Fullscreen is unavailable in this browser context.';
  }
}

function ensureGame() {
  if (gameInitialized) return;
  game = new SignalSiegeGame(lab, audio, ui, {
    toggleMute,
    fullscreen: toggleFullscreen,
    started: () => { liveStatus.textContent = 'Signal Siege started.'; },
    loadoutChanged: (selection) => {
      composerSelection = { ...selection };
      $$('[data-compose]').forEach((select) => { select.value = String(composerSelection[select.dataset.compose]); });
      updateComposerReadout();
    },
    finished: (victory) => {
      liveStatus.textContent = victory ? 'Signal restored.' : 'Signal lost.';
    },
  });
  game.setSelection(composerSelection);
  game.setReducedShake(reducedShake);
  gameInitialized = true;
}

function updateScrollState() {
  if (!lab) return;
  const viewportMid = innerHeight * .5;
  let bestIndex = 0;
  let bestDistance = Infinity;
  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height * .5;
    const distance = Math.abs(center - viewportMid);
    if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
  });
  const active = sections[bestIndex];
  const rect = active.getBoundingClientRect();
  const progress = clamp((innerHeight * .75 - rect.top) / Math.max(1, rect.height));
  lab.setStoryPosition(bestIndex, progress);
  const total = document.documentElement.scrollHeight - innerHeight;
  signalRailFill.style.height = `${total > 0 ? clamp(scrollY / total) * 100 : 0}%`;
}

function lockPage() {
  if (document.body.classList.contains('game-active')) return;
  savedScrollY = window.scrollY;
  document.body.classList.add('game-active');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.width = '100%';
}

function unlockPage() {
  if (!document.body.classList.contains('game-active')) return;
  document.body.classList.remove('game-active');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, savedScrollY);
}

function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  game?.destroy();
  lab?.destroy();
  void audio.destroy();
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanup();
});

document.addEventListener('fullscreenchange', () => {
  $('#fullscreenButton').textContent = document.fullscreenElement ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
});

function startLoop() {
  let last = performance.now();
  lab.renderer.setAnimationLoop((now) => {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    game?.update(dt);
    lab.update();
  });
}

initialize();
