import * as THREE from "three";

const BIOMES = {
  meadow: { low: "#b18b58", middle: "#83b879", high: "#668c55", peak: "#d6d2bd" },
  forest: { low: "#76634a", middle: "#477d4b", high: "#285b3c", peak: "#9aa58a" },
  desert: { low: "#b77c43", middle: "#d9b36c", high: "#edcf8c", peak: "#f3e4bd" },
  snow: { low: "#657b83", middle: "#a9c3ca", high: "#e2edf0", peak: "#ffffff" },
  volcanic: { low: "#332d32", middle: "#665052", high: "#9a5946", peak: "#d58a52" }
};

function hash(x, z, seed) {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function smoothNoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = THREE.MathUtils.lerp(hash(ix, iz, seed), hash(ix + 1, iz, seed), u);
  const b = THREE.MathUtils.lerp(hash(ix, iz + 1, seed), hash(ix + 1, iz + 1, seed), u);
  return THREE.MathUtils.lerp(a, b, v);
}

function terrainNoise(x, z, seed) {
  return smoothNoise(x, z, seed) * 0.58
    + smoothNoise(x * 2.03, z * 2.03, seed + 1) * 0.28
    + smoothNoise(x * 4.07, z * 4.07, seed + 2) * 0.14;
}

/** Seeded low-poly terrain with biome-based vertex colors. */
export class Terrain {
  constructor({
    width = 80,
    depth = 80,
    segments = 100,
    seed = 7,
    biome = "meadow",
    amplitude = 4,
    frequency = 0.035,
    color = null
  } = {}) {
    if (!BIOMES[biome]) throw new RangeError(`Unknown biome "${biome}". Choose: ${Object.keys(BIOMES).join(", ")}.`);
    this.width = width;
    this.depth = depth;
    this.seed = seed;
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.biome = biome;
    this.palette = BIOMES[biome];
    if (color) this.palette = { ...this.palette, middle: color };

    const columns = Math.max(2, Math.floor(segments));
    const rows = Math.max(2, Math.floor(segments * depth / width));
    const positions = [];
    const colors = [];
    const indices = [];
    const cLow = new THREE.Color(this.palette.low);
    const cMid = new THREE.Color(this.palette.middle);
    const cHigh = new THREE.Color(this.palette.high);
    const cPeak = new THREE.Color(this.palette.peak);
    const vertexColor = new THREE.Color();

    for (let iz = 0; iz <= rows; iz++) {
      const z = (iz / rows - 0.5) * depth;
      for (let ix = 0; ix <= columns; ix++) {
        const x = (ix / columns - 0.5) * width;
        const n = terrainNoise(x * frequency, z * frequency, seed);
        const edge = Math.min(1, Math.min((0.5 - Math.abs(x / width)) * 7, (0.5 - Math.abs(z / depth)) * 7));
        const height = n * amplitude * Math.max(0.12, edge);
        positions.push(x, height, z);

        const elevation = THREE.MathUtils.clamp((height / Math.max(0.001, amplitude) + 1) * 0.5, 0, 1);
        if (elevation < 0.48) vertexColor.copy(cLow).lerp(cMid, elevation / 0.48);
        else if (elevation < 0.82) vertexColor.copy(cMid).lerp(cHigh, (elevation - 0.48) / 0.34);
        else vertexColor.copy(cHigh).lerp(cPeak, (elevation - 0.82) / 0.18);
        colors.push(vertexColor.r, vertexColor.g, vertexColor.b);

        if (ix < columns && iz < rows) {
          const a = iz * (columns + 1) + ix;
          const b = a + columns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      flatShading: true
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = "GoodieTerrain";
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.mesh.userData.biome = biome;
  }

  /** Approximate terrain elevation at world-space x/z coordinates. */
  getHeightAt(x, z) {
    const n = terrainNoise(x * this.frequency, z * this.frequency, this.seed);
    const edge = Math.min(1, Math.min((0.5 - Math.abs(x / this.width)) * 7, (0.5 - Math.abs(z / this.depth)) * 7));
    return n * this.amplitude * Math.max(0.12, edge);
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  static get biomes() {
    return Object.keys(BIOMES);
  }
}
