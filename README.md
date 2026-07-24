# GiveMePrompts — Underground Prompt Laboratory

This `gh-pages` branch contains the deployable GiveMePrompts underground laboratory experience and the playable **PROMPT//WAR: SIGNAL SIEGE** finale.

## Publishing source

Use one GitHub Pages deployment method:

- **Source:** Deploy from a branch
- **Branch:** `gh-pages`
- **Folder:** `/(root)`

The expected public URL is:

`https://supremedreamz.github.io/givemeprompts-scrollworld/`

The URL should not be described as live until GitHub Pages settings show a successful deployment and the page has been opened in a browser.

## Runtime

- Static HTML/CSS/JavaScript
- Six compressed payload segments decoded by the loading page
- Three.js `0.185.1` loaded from jsDelivr
- WebGPURenderer with WebGL 2 backend fallback
- No build step

## Verified in this branch

- Loader file exists
- All six payload segment files exist
- `.nojekyll` exists
- Branch is ahead of `main` and preserves the previous ScrollWorld build on `main`

## Not yet independently verified

- Successful GitHub Pages deployment status
- Public URL response
- Complete desktop and mobile gameplay run on the deployed build
- Exact equality between the deployed compressed payload and the latest local standalone HTML, because the branch currently has no cryptographic payload manifest
