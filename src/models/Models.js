import * as THREE from "three";
import { Materials } from "../materials/Materials.js";

function finish(group, name) {
  group.name = name;
  group.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  return group;
}

/** Procedural low-poly tree with a trunk, layered foliage and optional fruit. */
export function tree({ height = 4, foliage = "#3d9b62", trunk = "#80502e", fruit = false } = {}) {
  const group = new THREE.Group();
  const trunkMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(height * 0.055, height * 0.085, height * 0.48, 7),
    new THREE.MeshStandardMaterial({ color: trunk, roughness: 0.95 })
  );
  trunkMesh.position.y = height * 0.24;
  group.add(trunkMesh);

  const leafMaterial = new THREE.MeshStandardMaterial({ color: foliage, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(height * (0.34 - i * 0.045), height * 0.48, 7), leafMaterial);
    crown.position.y = height * (0.48 + i * 0.19);
    group.add(crown);
  }

  if (fruit) {
    const fruitMesh = new THREE.Mesh(new THREE.SphereGeometry(height * 0.045, 8, 6), new THREE.MeshStandardMaterial({ color: "#f05b52" }));
    for (const [x, y, z] of [[0.2, height * 0.72, 0], [-0.18, height * 0.86, 0.12], [0.08, height * 0.58, -0.2]]) {
      const item = fruitMesh.clone();
      item.position.set(x * height, y, z * height);
      group.add(item);
    }
  }
  return finish(group, "GoodieTree");
}

/** Stylized faceted crystal with a glowing core. */
export function crystal({ height = 2, color = "#75e5ff", glow = true } = {}) {
  const group = new THREE.Group();
  const material = Materials.crystal({ color, emissive: glow ? color : "#000000", emissiveIntensity: glow ? 0.35 : 0 });
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(height * 0.48, 0), material);
  body.scale.y = 1.45;
  body.position.y = height * 0.55;
  group.add(body);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.28, height * 0.38, height * 0.18, 6), Materials.stone());
  base.position.y = height * 0.09;
  group.add(base);
  return finish(group, "GoodieCrystal");
}

/** Small stylized house with walls, roof, door and windows. */
export function house({ width = 4, height = 3, wallColor = "#f0d5a6", roofColor = "#b94d43" } = {}) {
  const group = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(width, height * 0.62, width * 0.82),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 })
  );
  walls.position.y = height * 0.31;
  group.add(walls);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(width * 0.78, height * 0.55, 4),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.82 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = height * 0.88;
  group.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, height * 0.38, 0.08), Materials.wood());
  door.position.set(0, height * 0.19, width * 0.415);
  group.add(door);

  const windowMaterial = new THREE.MeshStandardMaterial({ color: "#8bd7ed", metalness: 0.15, roughness: 0.2 });
  for (const x of [-width * 0.28, width * 0.28]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, height * 0.16, 0.09), windowMaterial);
    window.position.set(x, height * 0.38, width * 0.416);
    group.add(window);
  }
  return finish(group, "GoodieHouse");
}

export const Models = { tree, crystal, house };
