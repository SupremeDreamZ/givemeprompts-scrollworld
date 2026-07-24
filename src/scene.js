const PARTS = [
  './chunks/scene/part-00.b64',
  './chunks/scene/part-01.b64',
  './chunks/scene/part-02.b64',
  './chunks/scene/part-03.b64',
];
const EXPECTED_SHA256 = 'b4e2aab9200f0bf886ebb2286e0e42ea462a91ce502dcbe78984a3cef593b3d1';

async function loadSource() {
  const encoded = [];
  for (const path of PARTS) {
    const response = await fetch(new URL(path, import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Scene signal segment failed: ${response.status} ${path}`);
    encoded.push((await response.text()).trim());
  }
  const binary = atob(encoded.join(''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
  if (hash !== EXPECTED_SHA256) throw new Error('Scene module failed SHA-256 integrity verification.');
  return new TextDecoder().decode(bytes);
}

const [THREE, roundedModule, originalSource] = await Promise.all([
  import('three/webgpu'),
  import('three/addons/geometries/RoundedBoxGeometry.js'),
  loadSource(),
]);

const source = originalSource
  .replace("import * as THREE from 'three/webgpu';", 'const THREE = globalThis.__GMP_THREE;')
  .replace("import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';", 'const RoundedBoxGeometry = globalThis.__GMP_ROUNDED_BOX;');

globalThis.__GMP_THREE = THREE;
globalThis.__GMP_ROUNDED_BOX = roundedModule.RoundedBoxGeometry;
const moduleUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
let loaded;
try {
  loaded = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
  delete globalThis.__GMP_THREE;
  delete globalThis.__GMP_ROUNDED_BOX;
}

export const createLabScene = loaded.createLabScene;
