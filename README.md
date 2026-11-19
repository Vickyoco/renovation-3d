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

Project scaffold. The repository was created on 2026-11-20; implementation follows the workflow above step by step.
