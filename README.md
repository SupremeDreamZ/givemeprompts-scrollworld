# GiveMePrompts — Underground Prompt Laboratory

This `gh-pages` branch contains the GiveMePrompts cinematic scroll experience and the playable **PROMPT//WAR: SIGNAL SIEGE** finale.

## GitHub Pages

Configure the repository once under **Settings → Pages**:

- **Source:** Deploy from a branch
- **Branch:** `gh-pages`
- **Folder:** `/(root)`

Expected address:

`https://supremedreamz.github.io/givemeprompts-scrollworld/`

The branch is deployable, but the public address should only be described as live after GitHub reports a successful Pages deployment and the URL is opened in a real browser.

## Runtime architecture

- Direct `index.html`, `styles.css`, and ES modules
- Three.js `0.185.1` loaded from pinned jsDelivr URLs
- `WebGPURenderer` with the Three.js WebGL 2 backend fallback
- Direct scene module
- Game module stored as two gzip/Base64 segments because of connector upload limits
- SHA-256 verification before the game module is executed
- No build step

## Repairs included

- Removed the obsolete six-part whole-page loader
- Removed the competing GitHub Actions deployment method
- Added projectile, enemy-projectile, and pickup reuse pools
- Added dynamic geometry and material cleanup
- Prevented stale boss timers from completing a restarted run
- Cleared movement and firing state on blur, pause, stop, and restart
- Paused gameplay on hidden tabs, lost focus, and orientation changes
- Fixed boss geometry initialization
- Preserved the original ScrollWorld implementation on `main`

## Verification completed

- JavaScript syntax checks pass for all local source modules
- Static HTML, selector, anchor, and import checks pass
- Mocked game lifecycle tests pass
- Game payload chunk Git blob hashes match the local upload files
- Decompressed game source is checked against SHA-256 `a011edf2ce6c39a548f7cb51ef61e86d98cd31a6dc9d638eff1bd47ec27dfe41`

## Still requiring physical or unrestricted browser verification

- Public GitHub Pages response
- Complete WebGPU and WebGL rendered runs
- Physical iPhone and Android touch playthroughs
- Safari and Firefox visual comparison
- Extended GPU-memory profiling

These items are not claimed as verified until they are actually run. Software has enough fictional confidence already.
