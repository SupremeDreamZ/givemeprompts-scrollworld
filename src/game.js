const PARTS = ['./chunks/game/game.js.gz.part-00.b64', './chunks/game/game.js.gz.part-01.b64'];
const EXPECTED_SHA256 = 'a011edf2ce6c39a548f7cb51ef61e86d98cd31a6dc9d638eff1bd47ec27dfe41';

async function loadSource() {
  if (!('DecompressionStream' in globalThis)) throw new Error('This browser cannot decode the game runtime. Use a current Safari, Chrome, Firefox, or Edge release.');
  const encoded = [];
  for (const path of PARTS) {
    const response = await fetch(new URL(path, import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Game signal segment failed: ${response.status} ${path}`);
    encoded.push((await response.text()).trim());
  }
  const binary = atob(encoded.join(''));
  const compressed = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  if (hash !== EXPECTED_SHA256) throw new Error('Game module failed SHA-256 integrity verification.');
  return new TextDecoder().decode(bytes);
}

const [THREE, originalSource] = await Promise.all([import('three/webgpu'), loadSource()]);
const source = originalSource.replace("import * as THREE from 'three/webgpu';", 'const THREE = globalThis.__GMP_THREE;');

globalThis.__GMP_THREE = THREE;
const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
let loaded;
try {
  loaded = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
  delete globalThis.__GMP_THREE;
}

export const FRAGMENTS = loaded.FRAGMENTS;
export const SignalSiegeGame = loaded.SignalSiegeGame;
export const describeLoadout = loaded.describeLoadout;
export const selectionFromNames = loaded.selectionFromNames;
