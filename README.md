# renovation-3d

Browser-side home renovation 3D preview tool.

Upload room photos, reconstruct a 3D scene entirely in the browser, preview materials and furniture, edit the price table, and generate a renovation cost report. No server-side rendering or uploads — everything runs client-side.

## Stack

- **Three.js** — 3D scene preview, materials and furniture placement
- **WASM OpenSfM** — client-side photogrammetry compiled to WebAssembly (structure-from-motion from uploaded room photos)
- **IndexedDB** — local project storage (photos, scenes, price tables) in the browser

## Workflow

1. Upload room photos
2. Reconstruct 3D scene
3. Preview materials & furniture
4. Edit price table
5. Generate renovation cost report

## Status

Initial code is in: `index.html` is the entry page (Three.js scene with orbit controls, floor-material and wall-colour pickers, furniture toggles, live measurements), and `room-model.js` builds the procedural 3D room model (5.2 m x 4.2 m x 2.8 m room with window, door and a basic furniture set) and exposes material/furniture/measurement APIs for the later workflow steps.

To view it, serve the repository folder with any static file server (for example `npx serve .`) and open index.html — it loads Three.js from a CDN, so it needs an internet connection.
