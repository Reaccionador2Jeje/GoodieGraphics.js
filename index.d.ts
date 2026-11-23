import type * as THREE from "three";

export type Vector3Tuple = [number, number, number];
export type ColorValue = THREE.ColorRepresentation;
export type GeometryMaterial = THREE.Material | THREE.MaterialParameters | ColorValue;
export interface MeshOptions {
  name?: string;
  color?: ColorValue;
  material?: GeometryMaterial;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
}
export interface GLTFAsset {
  scene: THREE.Group;
  scenes: THREE.Group[];
  animations: THREE.AnimationClip[];
  parser: unknown;
  asset: Record<string, unknown>;
  [key: string]: unknown;
}

export declare const version: "1.0.0";

export declare class Game {
  constructor(options?: {
    container?: HTMLElement;
    width?: number;
    height?: number;
    background?: ColorValue;
    shadows?: boolean;
    antialias?: boolean;
    pixelRatio?: number;
    camera?: { fov?: number; near?: number; far?: number; position?: Vector3Tuple; lookAt?: Vector3Tuple };
  });
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  world: World | null;
  running: boolean;
  setWorld(world: World): this;
  onUpdate(callback: ((deltaSeconds: number, elapsedSeconds: number) => void) | null): this;
  start(): this;
  stop(): this;
  dispose(): void;
}

export declare class World {
  constructor(options?: { background?: ColorValue; fog?: { color?: ColorValue; near?: number; far?: number } | null });
  scene: THREE.Scene;
  objects: Set<THREE.Object3D>;
  ambientLight: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  add(...objects: Array<THREE.Object3D | THREE.Object3D[]>): this;
  remove(object: THREE.Object3D): this;
  setBackground(color: ColorValue): this;
  addGround(options?: { size?: number; color?: ColorValue; y?: number }): THREE.Mesh;
}

export declare const Models: {
  tree(options?: Record<string, unknown>): THREE.Group;
  crystal(options?: Record<string, unknown>): THREE.Group;
  house(options?: Record<string, unknown>): THREE.Group;
  rock(options?: Record<string, unknown>): THREE.Group;
  mushroom(options?: Record<string, unknown>): THREE.Group;
  flower(options?: Record<string, unknown>): THREE.Group;
  bush(options?: Record<string, unknown>): THREE.Group;
  barrel(options?: Record<string, unknown>): THREE.Group;
  lamp(options?: Record<string, unknown>): THREE.Group;
  fence(options?: Record<string, unknown>): THREE.Group;
};

export declare class GoodieShapes {
  static box(options?: MeshOptions & { width?: number; height?: number; depth?: number }): THREE.Mesh;
  static plane(options?: MeshOptions & { width?: number; height?: number; segmentsX?: number; segmentsY?: number }): THREE.Mesh;
  static circle(options?: MeshOptions & { radius?: number; segments?: number }): THREE.Mesh;
  static ring(options?: MeshOptions & { innerRadius?: number; outerRadius?: number; segments?: number }): THREE.Mesh;
  static sphere(options?: MeshOptions & { radius?: number; widthSegments?: number; heightSegments?: number }): THREE.Mesh;
  static ellipsoid(options?: MeshOptions & { radiusX?: number; radiusY?: number; radiusZ?: number; widthSegments?: number; heightSegments?: number }): THREE.Mesh;
  static capsule(options?: MeshOptions & { radius?: number; length?: number; capSegments?: number; radialSegments?: number }): THREE.Mesh;
  static cylinder(options?: MeshOptions & { radiusTop?: number; radiusBottom?: number; height?: number; radialSegments?: number }): THREE.Mesh;
  static cone(options?: MeshOptions & { radius?: number; height?: number; radialSegments?: number }): THREE.Mesh;
  static pyramid(options?: MeshOptions & { radius?: number; height?: number; sides?: number }): THREE.Mesh;
  static torus(options?: MeshOptions & { radius?: number; tube?: number; radialSegments?: number; tubularSegments?: number }): THREE.Mesh;
  static torusKnot(options?: MeshOptions & { radius?: number; tube?: number; tubularSegments?: number; radialSegments?: number; p?: number; q?: number }): THREE.Mesh;
  static dodecahedron(options?: MeshOptions & { radius?: number; detail?: number }): THREE.Mesh;
  static icosahedron(options?: MeshOptions & { radius?: number; detail?: number }): THREE.Mesh;
  static octahedron(options?: MeshOptions & { radius?: number; detail?: number }): THREE.Mesh;
  static tetrahedron(options?: MeshOptions & { radius?: number; detail?: number }): THREE.Mesh;
  static polyhedron(options: MeshOptions & { vertices: number[]; indices: number[]; radius?: number; detail?: number }): THREE.Mesh;
  static lathe(options: MeshOptions & { points: Array<[number, number]>; segments?: number }): THREE.Mesh;
  static tube(options: MeshOptions & { points: Vector3Tuple[]; radius?: number; tubularSegments?: number; radialSegments?: number; closed?: boolean }): THREE.Mesh;
  static shape(options: { points: Array<[number, number]> }): THREE.Shape;
  static extrude(options: MeshOptions & { shape: THREE.Shape; depth?: number; bevelEnabled?: boolean; bevelThickness?: number; bevelSize?: number; bevelSegments?: number }): THREE.Mesh;
  static wireframe(options: MeshOptions & { geometry: THREE.BufferGeometry; color?: ColorValue }): THREE.LineSegments;
  static fromGeometry(geometry: THREE.BufferGeometry, options?: MeshOptions): THREE.Mesh;
  static material(options?: GeometryMaterial): THREE.Material;
}
export { GoodieShapes as Shapes };

export declare class ModelBuilder {
  constructor(options?: { name?: string; position?: Vector3Tuple });
  root: THREE.Group;
  add<T extends THREE.Object3D>(object: T, options?: { name?: string; position?: Vector3Tuple; rotation?: Vector3Tuple; scale?: Vector3Tuple; parent?: THREE.Object3D }): T;
  shape<T extends THREE.Object3D>(factory: (options?: any) => T, options?: any, transform?: { name?: string; position?: Vector3Tuple; rotation?: Vector3Tuple; scale?: Vector3Tuple; parent?: THREE.Object3D }): T;
  group(name: string, transform?: Record<string, unknown>): THREE.Group;
  box(options?: Parameters<typeof GoodieShapes.box>[0], transform?: Record<string, unknown>): THREE.Mesh;
  sphere(options?: Parameters<typeof GoodieShapes.sphere>[0], transform?: Record<string, unknown>): THREE.Mesh;
  cylinder(options?: Parameters<typeof GoodieShapes.cylinder>[0], transform?: Record<string, unknown>): THREE.Mesh;
  cone(options?: Parameters<typeof GoodieShapes.cone>[0], transform?: Record<string, unknown>): THREE.Mesh;
  torus(options?: Parameters<typeof GoodieShapes.torus>[0], transform?: Record<string, unknown>): THREE.Mesh;
  tube(options: Parameters<typeof GoodieShapes.tube>[0], transform?: Record<string, unknown>): THREE.Mesh;
  extrude(options: Parameters<typeof GoodieShapes.extrude>[0], transform?: Record<string, unknown>): THREE.Mesh;
  build(): THREE.Group;
  static from(object: THREE.Object3D, options?: { clone?: boolean; name?: string }): ModelBuilder;
}

export declare class ModelLoader {
  static gltf(url: string, options?: { dracoLoader?: unknown; meshoptDecoder?: unknown; onProgress?: (event: ProgressEvent) => void }): Promise<GLTFAsset>;
  static glb(url: string, options?: { dracoLoader?: unknown; meshoptDecoder?: unknown; onProgress?: (event: ProgressEvent) => void }): Promise<GLTFAsset>;
  static obj(url: string, options?: { onProgress?: (event: ProgressEvent) => void }): Promise<THREE.Group>;
  static fbx(url: string, options?: { onProgress?: (event: ProgressEvent) => void }): Promise<THREE.Group>;
  static load(url: string, options?: { format?: "gltf" | "glb" | "obj" | "fbx"; onProgress?: (event: ProgressEvent) => void }): Promise<GLTFAsset | THREE.Group>;
}

export declare const Materials: {
  grass(options?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  wood(options?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  stone(options?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  gold(options?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  crystal(options?: THREE.MeshPhysicalMaterialParameters): THREE.MeshPhysicalMaterial;
  glow(color?: ColorValue, options?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
};

export declare class ParticleEmitter {
  constructor(options?: { count?: number; color?: ColorValue; size?: number; lifetime?: number; speed?: number; spread?: number; gravity?: number; opacity?: number; loop?: boolean; position?: Vector3Tuple });
  points: THREE.Points;
  burst(amount?: number): this;
  start(): this;
  stop(): this;
  update(deltaSeconds: number): this;
  dispose(): void;
}
export declare class Water {
  constructor(options?: { width?: number; height?: number; color?: ColorValue; opacity?: number; waveSpeed?: number; waveScale?: number; segments?: number });
  mesh: THREE.Mesh;
  update(deltaSeconds: number): this;
  dispose(): void;
}
export declare class Glow {
  constructor(options?: { color?: ColorValue; size?: number; opacity?: number; position?: Vector3Tuple });
  sprite: THREE.Sprite;
  setColor(color: ColorValue): this;
  dispose(): void;
}

export declare class Terrain {
  constructor(options?: { width?: number; depth?: number; segments?: number; seed?: number; biome?: "meadow" | "forest" | "desert" | "snow" | "volcanic"; amplitude?: number; frequency?: number; color?: ColorValue | null });
  mesh: THREE.Mesh;
  readonly biome: string;
  getHeightAt(x: number, z: number): number;
  dispose(): void;
  static readonly biomes: string[];
}
export declare class DayNightCycle {
  constructor(world: World, options?: { duration?: number; startAt?: number; dayIntensity?: number; nightIntensity?: number });
  time: number;
  update(deltaSeconds: number): this;
  setTime(value: number): this;
  pause(): this;
  resume(): this;
}

export declare class AnimationBuilder {
  constructor(root: THREE.Object3D, options?: { name?: string; duration?: number });
  addVector3(target: THREE.Object3D, property: string, times: number[], values: number[], options?: { interpolation?: "linear" | "smooth" | "discrete" }): this;
  addNumber(target: THREE.Object3D, property: string, times: number[], values: number[], options?: { interpolation?: "linear" | "smooth" | "discrete" }): this;
  addQuaternion(target: THREE.Object3D, times: number[], values: number[], options?: { interpolation?: "linear" | "smooth" | "discrete" }): this;
  addColor(target: THREE.Object3D, property: string, times: number[], values: number[], options?: { interpolation?: "linear" | "smooth" | "discrete" }): this;
  build(): THREE.AnimationClip;
}
export declare class Animator {
  constructor(root: THREE.Object3D, options?: { clips?: THREE.AnimationClip[] });
  static fromGLTF(gltf: GLTFAsset, options?: { root?: THREE.Object3D }): Animator;
  add(clip: THREE.AnimationClip): this;
  getAction(name: string): THREE.AnimationAction;
  play(name: string, options?: { loop?: number; repetitions?: number; timeScale?: number; weight?: number; fadeIn?: number; clampWhenFinished?: boolean; startAt?: number }): THREE.AnimationAction;
  crossFadeTo(name: string, options?: { duration?: number; loop?: number; repetitions?: number; timeScale?: number; weight?: number; clampWhenFinished?: boolean; startAt?: number }): THREE.AnimationAction;
  update(deltaSeconds: number): this;
  pause(): this;
  resume(): this;
  stop(name?: string | null): this;
  setTimeScale(value: number): this;
  setWeight(name: string, value: number): this;
  dispose(): void;
}
export declare class AnimationPresets {
  static bob(target: THREE.Object3D, options?: { height?: number; duration?: number; name?: string }): THREE.AnimationClip;
  static spin(target: THREE.Object3D, options?: { turns?: number; duration?: number; axis?: "x" | "y" | "z"; name?: string }): THREE.AnimationClip;
  static pulse(target: THREE.Object3D, options?: { amount?: number; duration?: number; name?: string }): THREE.AnimationClip;
  static sway(target: THREE.Object3D, options?: { angle?: number; duration?: number; axis?: "x" | "y" | "z"; name?: string }): THREE.AnimationClip;
  static idle(target: THREE.Object3D, options?: { height?: number; angle?: number; duration?: number; name?: string }): THREE.AnimationClip;
}
export declare const LoopOnce: typeof THREE.LoopOnce;
export declare const LoopRepeat: typeof THREE.LoopRepeat;
export declare const LoopPingPong: typeof THREE.LoopPingPong;
