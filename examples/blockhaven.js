import * as THREE from "three";
import {
  Game, World, Models, GoodieShapes, ModelBuilder, ModelLoader, Materials,
  ParticleEmitter, Water, Glow, Terrain, DayNightCycle, Animator,
  AnimationBuilder, AnimationPresets, LoopRepeat, GoodieShaders
} from "../src/index.js";

function showFatalError(error) {
  const message = error?.stack || error?.message || String(error);
  console.error("[Blockhaven]", error);
  let panel = document.getElementById("blockhaven-error");
  if (!panel) {
    panel = document.createElement("pre");
    panel.id = "blockhaven-error";
    panel.style.cssText = "position:fixed;z-index:99999;inset:12px;overflow:auto;white-space:pre-wrap;padding:18px;border-radius:12px;background:#210f16;color:#ffd7df;border:1px solid #ff718d;font:12px/1.5 monospace";
    document.body.appendChild(panel);
  }
  panel.textContent = "BLOCKHAVEN NO PUDO INICIAR\\n\\n" + message;
  document.getElementById("loading")?.classList.add("done");
}
window.addEventListener("error", (event) => showFatalError(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => showFatalError(event.reason));

try {
const $ = (id) => document.getElementById(id);
const viewport = $("viewport");
const BLOCK = 1;
const WORLD_RADIUS = 13;
const BLOCK_TYPES = {
  grass: { label: "Hierba", material: GoodieShaders.voxel({ color: "#75a95a", roughness: 1, grain: .055, topLight: .19, edgeLight: .035 }) },
  dirt: { label: "Tierra", material: GoodieShaders.voxel({ color: "#96613d", roughness: 1, grain: .085, topLight: .10, edgeLight: .025 }) },
  stone: { label: "Piedra", material: GoodieShaders.voxel({ color: "#9299a3", roughness: .96, grain: .065, topLight: .14, edgeLight: .045 }) },
  wood: { label: "Madera", material: GoodieShaders.voxel({ color: "#a66e3e", roughness: .88, grain: .045, topLight: .13, edgeLight: .04 }) },
  sand: { label: "Arena", material: GoodieShaders.voxel({ color: "#d9bd78", roughness: 1, grain: .075, topLight: .16, edgeLight: .025 }) },
  crystal: { label: "Cristal", material: new THREE.MeshPhysicalMaterial({ color: "#69d9f2", roughness: .16, metalness: .12, emissive: "#1c8da9", emissiveIntensity: .42, transparent: true, opacity: .94, transmission: .12 }) }
};
const blockGeometry = GoodieShapes.box({ width: BLOCK, height: BLOCK, depth: BLOCK }).geometry;
const blockMap = new Map();
const blockMeshes = [];
const animators = [];
const emitters = [];
let selectedBlock = "grass";
let day = 0;
let isLocked = false;
let yaw = 0;
let pitch = -.16;
let verticalVelocity = 0;
let grounded = false;
let pointerLook = false;
let lastTouch = null;
let joystickPointer = null;
let joystickVector = { x: 0, y: 0 };
let lastToast = 0;
const keys = new Set();
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

const game = new Game({
  container: viewport,
  background: "#a9d5ee",
  shadows: true,
  antialias: true,
  pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
  camera: { fov: 74, near: .08, far: 180, position: [0, 3, 7] }
});
const world = new World({ background: "#a9d5ee", fog: { color: "#a9d5ee", near: 25, far: 92 } });
world.ambientLight.intensity = 1.25;
world.sun.intensity = 2.6;
world.sun.position.set(22, 32, 12);
world.sun.shadow.mapSize.set(2048, 2048);
world.sun.shadow.bias = -0.00018;
world.sun.shadow.normalBias = 0.025;
world.sun.shadow.radius = 3;
world.sun.shadow.camera.left = -24;
world.sun.shadow.camera.right = 24;
world.sun.shadow.camera.top = 24;
world.sun.shadow.camera.bottom = -24;

const terrain = new Terrain({ width: 110, depth: 110, segments: 84, seed: 23, biome: "meadow", amplitude: 3.2, frequency: .045 });
terrain.mesh.position.y = -3.3;
world.add(terrain.mesh);
const dayNight = new DayNightCycle(world, { duration: 300, startAt: .34 });
const water = new Water({ width: 20, height: 15, color: "#38b8d8", opacity: .86, waveScale: .11, segments: 30 });
water.mesh.position.set(-7, -1.65, -8);
world.add(water.mesh);

function key(x, y, z) { return x + "," + y + "," + z; }
function addBlock(x, y, z, type, rebuild = true) {
  if (!BLOCK_TYPES[type] || !Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(z)) return false;
  const id = key(x, y, z);
  if (blockMap.has(id)) return false;
  blockMap.set(id, { x, y, z, type });
  if (rebuild) rebuildBlockMeshes();
  return true;
}
function removeBlock(x, y, z) {
  const removed = blockMap.delete(key(x, y, z));
  if (removed) rebuildBlockMeshes();
  return removed;
}
function rebuildBlockMeshes() {
  for (const mesh of blockMeshes) {
    world.remove(mesh);
    mesh.dispose?.();
  }
  blockMeshes.length = 0;
  const batches = new Map();
  for (const block of blockMap.values()) {
    if (!batches.has(block.type)) batches.set(block.type, []);
    batches.get(block.type).push(block);
  }
  for (const [type, blocks] of batches) {
    const batch = new THREE.InstancedMesh(blockGeometry, BLOCK_TYPES[type].material, blocks.length);
    batch.name = "VoxelBatch:" + type;
    batch.castShadow = true;
    batch.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    blocks.forEach((block, index) => {
      matrix.makeTranslation(block.x + .5, block.y + .5, block.z + .5);
      batch.setMatrixAt(index, matrix);
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.userData.blockType = type;
    batch.userData.blocks = blocks;
    world.add(batch);
    blockMeshes.push(batch);
  }
}
// La superficie jugable es el terreno natural de GoodieGraphics.
// No generamos una alfombra de cubos: los bloques solo aparecen cuando el
// jugador los coloca.
function generateWorld() {
  blockMap.clear();
  rebuildBlockMeshes();
}
generateWorld();

function topAt(x, z) {
  return terrain.getHeightAt(x, z) + terrain.mesh.position.y;
}
function addDecorations() {
  const treePositions = [[-9,-5],[8,-7],[-11,7],[10,8],[3,-11],[-4,10],[12,1],[-12,-1]];
  for (const [x,z] of treePositions) {
    const y = topAt(x,z);
    const tree = Models.tree({ height: 3.8, foliage: "#438c59", fruit: (x + z) % 2 === 0 });
    tree.position.set(x, y, z); world.add(tree);
    const sway = new Animator(tree, { clips: [AnimationPresets.sway(tree, { angle: .025, duration: 3.8 + Math.abs(x) * .08 })] });
    sway.play("Sway", { loop: LoopRepeat }); animators.push(sway);
  }
  for (const [x,z] of [[-5,-4],[5,5],[-10,-9],[9,10]]) {
    const y = topAt(x,z);
    const flower = Models.flower({ height: .9, petalColor: "#f5a5c8" });
    flower.position.set(x,y,z); world.add(flower);
  }
  for (const [x,z] of [[-3,2],[4,-2],[11,-4],[-8,5]]) {
    const y = topAt(x,z);
    const rock = Models.rock({ size: .65, color: "#8b929c" });
    rock.position.set(x,y,z); world.add(rock);
  }
  const house = Models.house({ width: 3.2, height: 2.8, wallColor: "#dfc99e", roofColor: "#8f5846" });
  house.position.set(4, topAt(4,3), 3); world.add(house);
  const barrel = Models.barrel({ height: 1.1 }); barrel.position.set(6, topAt(6,3), 3); world.add(barrel);
  const mushroom = Models.mushroom({ height: 1.25, capColor: "#d96d58" });
  mushroom.position.set(7, topAt(7,4), 4); world.add(mushroom);
  const bush = Models.bush({ size: 1.25, berries: true });
  bush.position.set(2, topAt(2,6), 6); world.add(bush);
  const fence = Models.fence({ width: 2.4, height: .85 });
  fence.position.set(5, topAt(5,5), 5); world.add(fence);
  const beacon = GoodieShapes.sphere({ radius: .22, widthSegments: 12, heightSegments: 8, color: Materials.glow("#a9ef83") });
  beacon.position.set(-7, topAt(-7,-5) + 2.2, -5); world.add(beacon);
  const lamp = Models.lamp({ height: 3 }); lamp.position.set(4, topAt(4,5), 5); world.add(lamp);
  const lampGlow = new Glow({ color: "#ffdf91", size: 3, opacity: .48, position: [4, lamp.position.y + 2.7, 5] });
  world.add(lampGlow.sprite);
  const crystal = Models.crystal({ height: 2.1, color: "#6fe5ff", glow: true });
  crystal.position.set(-5, topAt(-5,4), 4); world.add(crystal);
  const crystalAnimator = new Animator(crystal, { clips: [AnimationPresets.idle(crystal, { height: .12, duration: 2.8 })] });
  crystalAnimator.play("Idle", { loop: LoopRepeat }); animators.push(crystalAnimator);

  // A custom wind marker demonstrates ModelBuilder and AnimationBuilder together.
  const turbine = new ModelBuilder({ name: "ValleyWindMarker" });
  turbine.cylinder({ radiusTop: .07, radiusBottom: .12, height: 2.8, radialSegments: 7, color: Materials.wood({ color: "#7d654b" }) }, { name: "Pole", position: [0,1.4,0] });
  const rotor = turbine.group("Rotor", { position: [0,2.65,0] });
  turbine.box({ width: 1.6, height: .12, depth: .12, color: "#dce7e9" }, { name: "BladeA", position: [0,0,0], parent: rotor });
  turbine.box({ width: .12, height: 1.6, depth: .12, color: "#dce7e9" }, { name: "BladeB", position: [0,0,0], parent: rotor });
  const wind = turbine.build();
  wind.position.set(-8, topAt(-8,-7), -7); world.add(wind);
  const windClip = new AnimationBuilder(wind, { name: "WindRotor", duration: 4 })
    .addVector3(rotor, "rotation", [0,2,4], [0,0,0, 0,0,Math.PI, 0,0,Math.PI*2], { interpolation: "linear" }).build();
  const windAnimator = new Animator(wind, { clips: [windClip] });
  windAnimator.play("WindRotor", { loop: LoopRepeat }); animators.push(windAnimator);

  // One more shape primitive: a decorative stone ring beside the shore.
  const ring = GoodieShapes.torus({ radius: 1.15, tube: .12, color: Materials.gold({ color: "#c7a66a", metalness: .45 }) });
  ring.rotation.x = Math.PI / 2; ring.position.set(-7, -1.35, -8); world.add(ring);
}
addDecorations();

const miningParticles = new ParticleEmitter({ count: 70, color: "#e7d39a", size: .12, lifetime: .55, speed: 2.4, spread: .65, gravity: -4, loop: false });
world.add(miningParticles.points);
const crystalGlow = new Glow({ color: "#6ee7f9", size: 4.5, opacity: .18, position: [-5, topAt(-5,4) + 3.1, 4] });
world.add(crystalGlow.sprite);

// Build a stylized tool from several library primitives; it is attached to the camera.
const tool = new ModelBuilder({ name: "ExplorerTool" });
tool.box({ width: .16, height: .72, depth: .16, color: Materials.wood({ color: "#87532f" }) }, { position: [.58,-.53,-1.05] });
tool.box({ width: .72, height: .18, depth: .18, color: Materials.stone({ color: "#8da5b4" }) }, { position: [.58,-.18,-1.05] });
const toolModel = tool.build();
game.camera.add(toolModel);
world.scene.add(game.camera);

game.setWorld(world);
const player = new THREE.Vector3(0, topAt(0,0) + 1.72, 0);
game.camera.position.copy(player);
const cycle = dayNight;
let blockActionCooldown = 0;

function showToast(message) {
  const now = performance.now();
  if (now - lastToast < 180) return;
  lastToast = now;
  $("toast").textContent = message;
  $("toast").classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => $("toast").classList.remove("visible"), 1450);
}
function selectHotbar(type) {
  if (!BLOCK_TYPES[type]) return;
  selectedBlock = type;
  document.querySelectorAll(".slot").forEach(slot => slot.classList.toggle("active", slot.dataset.block === type));
  showToast(BLOCK_TYPES[type].label + " seleccionado");
}
document.querySelectorAll(".slot").forEach(slot => slot.addEventListener("click", () => selectHotbar(slot.dataset.block)));

function castBlockRay() {
  raycaster.setFromCamera(center, game.camera);
  const hits = raycaster.intersectObjects([...blockMeshes, terrain.mesh], false);
  return hits.find(hit => hit.distance <= 6) || null;
}
function mineBlock() {
  const hit = castBlockRay();
  if (!hit || hit.object === terrain.mesh || hit.instanceId === undefined) { showToast("Solo puedes extraer bloques que hayas colocado"); return; }
  const block = hit.object.userData.blocks[hit.instanceId];
  if (!block) return;
  miningParticles.points.position.set(block.x + .5, block.y + .5, block.z + .5);
  miningParticles.burst(24);
  removeBlock(block.x, block.y, block.z);
  showToast("Bloque extraído · " + BLOCK_TYPES[block.type].label);
}
function placeBlock() {
  const hit = castBlockRay();
  if (!hit || !hit.face) { showToast("Apunta a una superficie"); return; }
  let x, y, z;
  if (hit.object === terrain.mesh) {
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (normal.y < 0.35) { showToast("Coloca bloques sobre la superficie"); return; }
    x = Math.floor(hit.point.x);
    y = Math.floor(hit.point.y + 0.02);
    z = Math.floor(hit.point.z);
  } else {
    if (hit.instanceId === undefined) return;
    const block = hit.object.userData.blocks[hit.instanceId];
    if (!block) return;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).round();
    x = block.x + normal.x; y = block.y + normal.y; z = block.z + normal.z;
  }
  const px = Math.floor(player.x), py = Math.floor(player.y - 1.1), pz = Math.floor(player.z);
  if ((x === px && z === pz && (y === py || y === py + 1 || y === py + 2))) { showToast("No puedes colocarlo dentro de ti"); return; }
  if (addBlock(x,y,z,selectedBlock)) showToast(BLOCK_TYPES[selectedBlock].label + " colocado");
  else showToast("Ese espacio ya está ocupado");
}
function jump() { if (grounded) { verticalVelocity = 7.2; grounded = false; } }
function updatePlayer(delta) {
  const forwardInput = (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - joystickVector.y;
  const sideInput = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + joystickVector.x;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(sideInput));
  if (move.lengthSq() > 1) move.normalize();
  const speed = keys.has("ShiftLeft") ? 7.4 : 5.1;
  const nextX = player.x + move.x * speed * delta;
  const nextZ = player.z + move.z * speed * delta;
  const feetY = Math.floor(player.y - 1.72);
  const collides = (x,z) => blockMap.has(key(Math.floor(x), feetY, Math.floor(z))) || blockMap.has(key(Math.floor(x), feetY + 1, Math.floor(z)));
  if (!collides(nextX, player.z)) player.x = nextX;
  if (!collides(player.x, nextZ)) player.z = nextZ;
  verticalVelocity -= 18 * delta;
  player.y += verticalVelocity * delta;
  const ground = topAt(player.x, player.z) + 1.72;
  if (player.y <= ground) { player.y = ground; verticalVelocity = 0; grounded = true; }
  else grounded = false;
  if (player.y < -10) { player.set(0, topAt(0,0) + 1.72, 0); verticalVelocity = 0; showToast("Has regresado al punto de inicio"); }
  game.camera.position.copy(player);
  game.camera.rotation.order = "YXZ";
  game.camera.rotation.set(pitch, yaw, 0);
  $("coords").textContent = "X " + Math.floor(player.x) + " · Z " + Math.floor(player.z);
}

function update(delta) {
  // Algunos navegadores móviles pueden entregar un delta negativo al reanudar
  // una pestaña. Los sistemas de animación requieren siempre tiempo >= 0.
  const safeDelta = Number.isFinite(delta)
    ? THREE.MathUtils.clamp(delta, 0, 0.05)
    : 0;

  updatePlayer(safeDelta);
  dayNight.update(safeDelta);
  water.update(safeDelta);
  for (const animator of animators) animator.update(safeDelta);
  miningParticles.update(safeDelta);
  blockActionCooldown = Math.max(0, blockActionCooldown - safeDelta);
  day = (day + safeDelta) % 300;
  const hours = Math.floor((day / 300) * 24);
  $("world-time").textContent = "DÍA 1 · " + String(hours).padStart(2,"0") + ":00";
}
game.onUpdate(update);
game.start();

window.addEventListener("keydown", event => {
  if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (/^Digit[1-6]$/.test(event.code)) selectHotbar(Object.keys(BLOCK_TYPES)[Number(event.code.slice(5))-1]);
  if (event.code === "Space") jump();
  if (event.code === "KeyE") { $("help-card").classList.toggle("open"); }
});
window.addEventListener("keyup", event => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
viewport.addEventListener("click", () => {
  if (matchMedia("(pointer:fine)").matches && !isLocked && !$("help-card").classList.contains("open")) viewport.requestPointerLock?.();
});
document.addEventListener("pointerlockchange", () => { isLocked = document.pointerLockElement === viewport; });
document.addEventListener("mousemove", event => {
  if (!isLocked) return;
  yaw -= event.movementX * .0022;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * .002, -1.42, 1.42);
});
viewport.addEventListener("contextmenu", event => event.preventDefault());
viewport.addEventListener("mousedown", event => {
  if (!matchMedia("(pointer:fine)").matches) return;
  if (event.button === 0) mineBlock();
  if (event.button === 2) placeBlock();
});
$("mine").addEventListener("click", mineBlock);
$("place").addEventListener("click", placeBlock);
$("jump").addEventListener("pointerdown", event => { event.preventDefault(); jump(); });

const joystick = $("joystick"), stick = $("stick");
joystick.addEventListener("pointerdown", event => { joystickPointer = event.pointerId; joystick.setPointerCapture(event.pointerId); updateJoystick(event); });
joystick.addEventListener("pointermove", event => { if (event.pointerId === joystickPointer) updateJoystick(event); });
function updateJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width/2), dy = event.clientY - (rect.top + rect.height/2);
  const length = Math.max(1, Math.hypot(dx,dy)), max = rect.width * .31, scale = Math.min(1,max/length);
  joystickVector = { x: dx*scale/max, y: -dy*scale/max };
  stick.style.transform = "translate(" + dx*scale + "px," + dy*scale + "px)";
}
function releaseJoystick(event) {
  if (event.pointerId !== joystickPointer) return;
  joystickPointer = null; joystickVector = {x:0,y:0}; stick.style.transform = "translate(0,0)";
}
joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
$("look-pad").addEventListener("pointerdown", event => { lastTouch = {x:event.clientX,y:event.clientY,id:event.pointerId}; $("look-pad").setPointerCapture(event.pointerId); });
$("look-pad").addEventListener("pointermove", event => {
  if (!lastTouch || lastTouch.id !== event.pointerId) return;
  yaw -= (event.clientX-lastTouch.x)*.006;
  pitch = THREE.MathUtils.clamp(pitch-(event.clientY-lastTouch.y)*.005,-1.42,1.42);
  lastTouch = {x:event.clientX,y:event.clientY,id:event.pointerId};
});
$("look-pad").addEventListener("pointerup", () => lastTouch = null);
$("look-pad").addEventListener("pointercancel", () => lastTouch = null);

$("help-toggle").addEventListener("click", () => $("help-card").classList.toggle("open"));
$("close-help").addEventListener("click", () => $("help-card").classList.remove("open"));
function saveWorld() {
  const data = { version: 1, blocks: [...blockMap.values()], player: player.toArray(), yaw, pitch, selectedBlock };
  try { localStorage.setItem("blockhaven-world-v1", JSON.stringify(data)); showToast("Mundo guardado en este dispositivo"); }
  catch { showToast("No se pudo guardar el mundo"); }
}
function loadWorld() {
  try {
    const raw = localStorage.getItem("blockhaven-world-v1");
    if (!raw) { showToast("Todavía no hay un mundo guardado"); return; }
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.blocks) || data.blocks.length > 12000) throw new Error("Invalid save");
    blockMap.clear();
    for (const block of data.blocks) if (BLOCK_TYPES[block.type] && [block.x,block.y,block.z].every(Number.isInteger)) blockMap.set(key(block.x,block.y,block.z), block);
    rebuildBlockMeshes();
    if (Array.isArray(data.player) && data.player.length === 3 && data.player.every(Number.isFinite)) player.fromArray(data.player);
    yaw = Number.isFinite(data.yaw) ? data.yaw : yaw;
    pitch = Number.isFinite(data.pitch) ? THREE.MathUtils.clamp(data.pitch,-1.42,1.42) : pitch;
    selectHotbar(data.selectedBlock);
    showToast("Mundo restaurado");
  } catch { showToast("El archivo guardado no es válido"); }
}
$("save-world").addEventListener("click", saveWorld);
$("load-world").addEventListener("click", loadWorld);

$("model-file").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  const extension = file.name.split(".").pop().toLowerCase();
  const url = URL.createObjectURL(file);
  try {
    const loaded = await ModelLoader.load(url, { format: extension });
    const object = extension === "gltf" || extension === "glb" ? loaded.scene : loaded;
    object.scale.setScalar(.8);
    object.position.set(Math.floor(player.x)+2, topAt(Math.floor(player.x)+2,Math.floor(player.z))+1, Math.floor(player.z));
    world.add(object);
    showToast("Modelo 3D importado al mundo");
  } catch (error) { showToast("No se pudo importar: " + error.message); }
  finally { URL.revokeObjectURL(url); event.target.value = ""; }
});

window.addEventListener("beforeunload", () => {
  game.dispose(); water.dispose(); terrain.dispose(); miningParticles.dispose(); crystalGlow.dispose();
  for (const animator of animators) animator.dispose();
  for (const mesh of blockMeshes) mesh.geometry?.dispose();
  for (const material of Object.values(BLOCK_TYPES)) material.material.dispose();
});
$("loading").classList.add("done");
setTimeout(() => $("loading").remove(), 650);
if (matchMedia("(pointer:coarse)").matches) $("help-card").classList.add("open");

} catch (error) {
  showFatalError(error);
}
