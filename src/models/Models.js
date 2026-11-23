import * as THREE from "three";
import { Materials } from "../materials/Materials.js";

const standard = (color, roughness = 0.85) =>
  new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });

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

function addMesh(group, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

/** Procedural low-poly tree with layered foliage and optional fruit. */
export function tree({ height = 4, foliage = "#3d9b62", trunk = "#80502e", fruit = false, layers = 3 } = {}) {
  const group = new THREE.Group();
  addMesh(group, new THREE.CylinderGeometry(height * 0.055, height * 0.085, height * 0.48, 7), standard(trunk), [0, height * 0.24, 0]);

  const leafMaterial = standard(foliage, 0.9);
  for (let i = 0; i < Math.max(1, Math.floor(layers)); i++) {
    const count = Math.max(1, Math.floor(layers));
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(height * (0.36 - i * 0.035), height * (0.48 + (count - 3) * 0.04), 7),
      leafMaterial
    );
    crown.position.y = height * (0.48 + i * (0.48 / count));
    group.add(crown);
  }

  if (fruit) {
    const fruitMaterial = standard("#ed5b52", 0.35);
    for (const [x, y, z] of [[0.2, 0.72, 0], [-0.18, 0.86, 0.12], [0.08, 0.58, -0.2]]) {
      addMesh(group, new THREE.SphereGeometry(height * 0.045, 8, 6), fruitMaterial, [x * height, y * height, z * height]);
    }
  }
  return finish(group, "GoodieTree");
}

/** Faceted crystal with an optional emissive finish. */
export function crystal({ height = 2, color = "#75e5ff", glow = true } = {}) {
  const group = new THREE.Group();
  const material = Materials.crystal({
    color,
    emissive: glow ? color : "#000000",
    emissiveIntensity: glow ? 0.35 : 0
  });
  const body = addMesh(group, new THREE.OctahedronGeometry(height * 0.48, 0), material, [0, height * 0.55, 0]);
  body.scale.y = 1.45;
  addMesh(group, new THREE.CylinderGeometry(height * 0.28, height * 0.38, height * 0.18, 6), Materials.stone(), [0, height * 0.09, 0]);
  return finish(group, "GoodieCrystal");
}

/** Small house with walls, gabled-looking roof, door and windows. */
export function house({ width = 4, height = 3, wallColor = "#f0d5a6", roofColor = "#b94d43" } = {}) {
  const group = new THREE.Group();
  addMesh(group, new THREE.BoxGeometry(width, height * 0.62, width * 0.82), standard(wallColor), [0, height * 0.31, 0]);

  const roof = addMesh(group, new THREE.ConeGeometry(width * 0.78, height * 0.55, 4), standard(roofColor), [0, height * 0.88, 0]);
  roof.rotation.y = Math.PI / 4;

  addMesh(group, new THREE.BoxGeometry(width * 0.2, height * 0.38, 0.08), Materials.wood(), [0, height * 0.19, width * 0.415]);
  const windowMaterial = new THREE.MeshStandardMaterial({ color: "#8bd7ed", metalness: 0.15, roughness: 0.2 });
  for (const x of [-width * 0.28, width * 0.28]) {
    addMesh(group, new THREE.BoxGeometry(width * 0.16, height * 0.16, 0.09), windowMaterial, [x, height * 0.38, width * 0.416]);
  }
  return finish(group, "GoodieHouse");
}

/** Irregular low-poly boulder. */
export function rock({ size = 1.5, color = "#858b96", detail = 1 } = {}) {
  const group = new THREE.Group();
  const geometry = new THREE.IcosahedronGeometry(size, Math.max(0, Math.min(2, Math.floor(detail))));
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const variation = 0.82 + 0.28 * Math.sin(i * 12.9898);
    position.setXYZ(i, position.getX(i) * variation, position.getY(i) * variation * 0.72, position.getZ(i) * variation);
  }
  geometry.computeVertexNormals();
  const mesh = addMesh(group, geometry, standard(color, 1), [0, size * 0.48, 0]);
  mesh.rotation.set(0.12, 0.4, -0.08);
  return finish(group, "GoodieRock");
}

/** Cartoon mushroom with a stem and rounded cap. */
export function mushroom({ height = 1.4, capColor = "#e85d55", stemColor = "#f5e8ce", spots = true } = {}) {
  const group = new THREE.Group();
  addMesh(group, new THREE.CylinderGeometry(height * 0.12, height * 0.16, height * 0.52, 9), standard(stemColor), [0, height * 0.26, 0]);
  addMesh(group, new THREE.SphereGeometry(height * 0.38, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), standard(capColor), [0, height * 0.58, 0]);
  if (spots) {
    const spotMaterial = standard("#fff4dc", 0.55);
    for (const [x, z] of [[-0.18, 0.12], [0.17, 0.1], [0, -0.2]]) {
      addMesh(group, new THREE.SphereGeometry(height * 0.045, 7, 5), spotMaterial, [x * height, height * 0.78, z * height]);
    }
  }
  return finish(group, "GoodieMushroom");
}

/** Decorative flower with a stem, leaves and configurable petals. */
export function flower({ height = 1.2, petalColor = "#ff8fc7", centerColor = "#ffd45c", petals = 6 } = {}) {
  const group = new THREE.Group();
  addMesh(group, new THREE.CylinderGeometry(height * 0.025, height * 0.035, height * 0.72, 6), standard("#438b55"), [0, height * 0.36, 0]);
  const leaf = addMesh(group, new THREE.SphereGeometry(height * 0.13, 7, 5), standard("#55a968"), [height * 0.1, height * 0.32, 0]);
  leaf.scale.set(1.5, 0.45, 0.7);
  leaf.rotation.z = -0.35;

  const petalMaterial = standard(petalColor, 0.45);
  const count = Math.max(3, Math.floor(petals));
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const petal = addMesh(group, new THREE.SphereGeometry(height * 0.13, 8, 6), petalMaterial, [
      Math.cos(angle) * height * 0.13,
      height * 0.76,
      Math.sin(angle) * height * 0.13
    ]);
    petal.scale.set(1, 0.65, 1.35);
  }
  addMesh(group, new THREE.SphereGeometry(height * 0.105, 9, 7), standard(centerColor), [0, height * 0.78, 0]);
  return finish(group, "GoodieFlower");
}

/** Rounded decorative bush. */
export function bush({ size = 1.4, color = "#438f59", berries = false } = {}) {
  const group = new THREE.Group();
  const material = standard(color, 1);
  for (const [x, y, z, scale] of [[0, 0.35, 0, 0.65], [-0.35, 0.25, 0.05, 0.48], [0.32, 0.27, -0.08, 0.5]]) {
    const blob = addMesh(group, new THREE.IcosahedronGeometry(size * scale, 1), material, [x * size, y * size, z * size]);
    blob.scale.y = 0.85;
  }
  if (berries) {
    const berryMaterial = standard("#e85d62", 0.35);
    for (const [x, y, z] of [[-0.3, 0.52, 0.3], [0.25, 0.48, 0.25], [0.05, 0.68, -0.25]]) {
      addMesh(group, new THREE.SphereGeometry(size * 0.055, 8, 6), berryMaterial, [x * size, y * size, z * size]);
    }
  }
  return finish(group, "GoodieBush");
}

/** Wooden barrel with metal hoops. */
export function barrel({ height = 1.4, woodColor = "#98613b", metalColor = "#596575" } = {}) {
  const group = new THREE.Group();
  addMesh(group, new THREE.CylinderGeometry(height * 0.34, height * 0.34, height, 12, 1), Materials.wood({ color: woodColor }), [0, height / 2, 0]);
  const hoopMaterial = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.72, roughness: 0.32 });
  for (const y of [0.18, 0.82]) {
    addMesh(group, new THREE.TorusGeometry(height * 0.345, height * 0.035, 6, 12), hoopMaterial, [0, height * y, 0]).rotation.x = Math.PI / 2;
  }
  return finish(group, "GoodieBarrel");
}

/** Simple park lamp with a warm emissive lantern. */
export function lamp({ height = 3, metalColor = "#354052", lightColor = "#ffe6a1" } = {}) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: metalColor, metalness: 0.72, roughness: 0.3 });
  addMesh(group, new THREE.CylinderGeometry(height * 0.035, height * 0.055, height * 0.78, 8), metal, [0, height * 0.39, 0]);
  addMesh(group, new THREE.CylinderGeometry(height * 0.16, height * 0.12, height * 0.07, 8), metal, [0, height * 0.8, 0]);
  addMesh(group, new THREE.SphereGeometry(height * 0.105, 10, 8), new THREE.MeshStandardMaterial({
    color: lightColor, emissive: lightColor, emissiveIntensity: 1.8, roughness: 0.25
  }), [0, height * 0.9, 0]);
  return finish(group, "GoodieLamp");
}

/** Short decorative wooden fence segment. */
export function fence({ width = 3, height = 1, color = "#a87545" } = {}) {
  const group = new THREE.Group();
  const wood = Materials.wood({ color });
  for (const x of [-width / 2, width / 2]) {
    addMesh(group, new THREE.BoxGeometry(0.14, height, 0.14), wood, [x, height / 2, 0]);
    const cap = addMesh(group, new THREE.ConeGeometry(0.12, 0.2, 4), wood, [x, height + 0.08, 0]);
    cap.rotation.y = Math.PI / 4;
  }
  for (const y of [height * 0.32, height * 0.72]) {
    addMesh(group, new THREE.BoxGeometry(width + 0.12, 0.13, 0.12), wood, [0, y, 0]);
  }
  return finish(group, "GoodieFence");
}

export const Models = { tree, crystal, house, rock, mushroom, flower, bush, barrel, lamp, fence };
