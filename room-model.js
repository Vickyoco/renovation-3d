// room-model.js — procedural 3D room model for renovation-3d
// Builds a single-room scene (floor, walls, window, door) plus a basic
// furniture set (sofa, coffee table, TV stand + TV, floor lamp, rug,
// kitchen cabinet run) out of Three.js primitives, with real dimensions
// in metres so material previews and cost estimates can measure areas.
//
// Usage:
//   import { buildRoom, MATERIALS } from './room-model.js';
//   const room = buildRoom(scene);          // adds everything to scene
//   room.setFloorMaterial('marble');        // swap floor finish
//   room.setWallColor('#e8e2d4');           // repaint walls
//   room.setFurnitureVisible('sofa', false);// hide / show a furniture item
//   room.measurements();                    // { floorArea, wallArea, ... }

import * as THREE from 'three';

export const ROOM = { width: 5.2, depth: 4.2, height: 2.8 }; // metres (x, z, y)

export const MATERIALS = {
  floor: {
    wood:   { color: 0xb08954, roughness: 0.8,  label: 'Wood laminate' },
    marble: { color: 0xd9d9d6, roughness: 0.25, label: 'Polished marble' },
    tile:   { color: 0x9fb4bd, roughness: 0.5,  label: 'Ceramic tile' },
    concrete:{ color: 0x8a8a86, roughness: 0.95, label: 'Polished concrete' },
  },
};

function box(w, h, d, color, roughness = 0.85) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function plankTexture(base = '#b08954') {
  // Procedural wood-plank texture drawn on a canvas — no external assets.
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(60,35,15,0.55)'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); }
  g.strokeStyle = 'rgba(60,35,15,0.25)';
  for (let i = 0; i < 4; i++) { const x = (i % 2) * 128 + 64; g.beginPath(); g.moveTo(x, i * 64); g.lineTo(x, i * 64 + 64); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2.4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildRoom(scene) {
  const { width: W, depth: D, height: H } = ROOM;
  const root = new THREE.Group();
  scene.add(root);

  // ---- Floor -------------------------------------------------------------
  const floorMat = new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.8 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, D), floorMat);
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  floor.name = 'floor';
  root.add(floor);

  // ---- Walls (back + left solid, front + right open for viewing) --------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0ead9, roughness: 0.95 });
  const backWall = box(W, H, 0.12, 0xf0ead9, 0.95);
  backWall.material = wallMat;
  backWall.position.set(0, H / 2, -D / 2);
  root.add(backWall);

  const leftWall = box(0.12, H, D, 0xf0ead9, 0.95);
  leftWall.material = wallMat;
  leftWall.position.set(-W / 2, H / 2, 0);
  root.add(leftWall);

  // Skirting boards
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const skirtB = new THREE.Mesh(new THREE.BoxGeometry(W, 0.09, 0.02), skirtMat);
  skirtB.position.set(0, 0.045, -D / 2 + 0.07); root.add(skirtB);
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, D), skirtMat);
  skirtL.position.set(-W / 2 + 0.07, 0.045, 0); root.add(skirtL);

  // ---- Window on the back wall -------------------------------------------
  const windowGroup = new THREE.Group();
  const frame = box(1.8, 1.4, 0.06, 0xffffff, 0.4);
  frame.position.set(0.9, 1.65, -D / 2 + 0.07);
  windowGroup.add(frame);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, 1.24, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xbfe3f2, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 })
  );
  glass.position.copy(frame.position); glass.position.z += 0.02;
  windowGroup.add(glass);
  const mullionV = box(0.04, 1.24, 0.03, 0xffffff, 0.4);
  mullionV.position.copy(glass.position); mullionV.position.z += 0.02;
  windowGroup.add(mullionV);
  const mullionH = box(1.64, 0.04, 0.03, 0xffffff, 0.4);
  mullionH.position.copy(mullionV.position);
  windowGroup.add(mullionH);
  root.add(windowGroup);

  // ---- Door on the left wall ---------------------------------------------
  const door = box(0.05, 2.05, 0.9, 0x8a6844, 0.7);
  door.position.set(-W / 2 + 0.08, 1.025, 1.2);
  root.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.8, roughness: 0.3 }));
  knob.position.set(-W / 2 + 0.12, 1.0, 0.82);
  root.add(knob);

  // ---- Furniture ----------------------------------------------------------
  const furniture = {};

  // Sofa (base + back + arms + cushions)
  const sofa = new THREE.Group();
  const sofaMat = 0x7d8ca3;
  const base = box(2.2, 0.45, 0.95, sofaMat); base.position.y = 0.28; sofa.add(base);
  const back = box(2.2, 0.55, 0.22, sofaMat); back.position.set(0, 0.72, -0.37); sofa.add(back);
  const armL = box(0.22, 0.3, 0.95, sofaMat); armL.position.set(-1.0, 0.66, 0); sofa.add(armL);
  const armR = armL.clone(); armR.position.x = 1.0; sofa.add(armR);
  const cush = box(0.92, 0.14, 0.8, 0x93a5bd); cush.position.set(-0.48, 0.57, 0.03); sofa.add(cush);
  const cush2 = cush.clone(); cush2.position.x = 0.48; sofa.add(cush2);
  sofa.position.set(0.2, 0, 0.9);
  sofa.rotation.y = Math.PI;
  root.add(sofa); furniture.sofa = sofa;

  // Rug under sofa / table
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.02, 1.9),
    new THREE.MeshStandardMaterial({ color: 0xc7b299, roughness: 1 }));
  rug.position.set(0.2, 0.011, 0.75); rug.receiveShadow = true;
  root.add(rug); furniture.rug = rug;

  // Coffee table
  const table = new THREE.Group();
  const top = box(1.1, 0.05, 0.55, 0x6e4f30, 0.5); top.position.y = 0.4; table.add(top);
  for (const [x, z] of [[-0.48, -0.2], [0.48, -0.2], [-0.48, 0.2], [0.48, 0.2]]) {
    const leg = box(0.05, 0.4, 0.05, 0x4a3520, 0.6); leg.position.set(x, 0.2, z); table.add(leg);
  }
  table.position.set(0.2, 0, 0.55);
  root.add(table); furniture.coffeeTable = table;

  // TV + stand against back wall
  const tvGroup = new THREE.Group();
  const stand = box(1.6, 0.4, 0.4, 0x5a4632, 0.6); stand.position.y = 0.2; tvGroup.add(stand);
  const tv = box(1.45, 0.82, 0.04, 0x111418, 0.3); tv.position.y = 0.86; tvGroup.add(tv);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.74, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x2b4a67, roughness: 0.15, metalness: 0.2 }));
  screen.position.set(0, 0.86, 0.03); tvGroup.add(screen);
  tvGroup.position.set(-1.2, 0, -D / 2 + 0.35);
  root.add(tvGroup); furniture.tv = tvGroup;

  // Floor lamp
  const lamp = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 }));
  pole.position.y = 0.75; lamp.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.24, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf5d98b, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffca66, emissiveIntensity: 0.35 }));
  shade.position.y = 1.55;
  lamp.add(shade);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 }));
  lampBase.position.y = 0.015;
  lamp.add(lampBase);
  lamp.position.set(1.95, 0, -1.55);
  root.add(lamp); furniture.lamp = lamp;

  // Cabinet run along the left wall (kitchen / storage preview)
  const cabinet = new THREE.Group();
  const cabBody = box(0.6, 0.9, 2.2, 0xd8d2c4, 0.7); cabBody.position.y = 0.45; cabinet.add(cabBody);
  const counter = box(0.64, 0.04, 2.24, 0x777777, 0.35); counter.position.y = 0.92; cabinet.add(counter);
  cabinet.position.set(-W / 2 + 0.42, 0, -0.6);
  root.add(cabinet); furniture.cabinet = cabinet;

  // ---- Ceiling light glow (visual anchor, no geometry cost) ---------------
  const ceilLight = new THREE.PointLight(0xffe6b0, 12, 12, 1.6);
  ceilLight.position.set(0, H - 0.25, 0);
  root.add(ceilLight);

  // ---- Public API ---------------------------------------------------------
  return {
    group: root,
    furniture,
    setFloorMaterial(key) {
      const m = MATERIALS.floor[key];
      if (!m) return;
      floorMat.map = key === 'wood' ? plankTexture() : null;
      floorMat.color.set(key === 'wood' ? 0xffffff : m.color);
      floorMat.roughness = m.roughness;
      floorMat.needsUpdate = true;
    },
    setWallColor(hex) { wallMat.color.set(hex); },
    setFurnitureVisible(name, visible) {
      if (furniture[name]) furniture[name].visible = visible;
    },
    measurements() {
      const floorArea = W * D;
      const wallArea = 2 * (W + D) * H;
      return {
        room: { ...ROOM },
        floorArea: +floorArea.toFixed(2),          // m2
        wallArea: +wallArea.toFixed(2),            // m2 (all four walls)
        ceilingArea: +floorArea.toFixed(2),        // m2
        skirtingLength: +(2 * (W + D)).toFixed(2),  // m
      };
    },
  };
}
