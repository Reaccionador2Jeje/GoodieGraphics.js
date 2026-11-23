import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Models } from "../models/Models.js";
import { GoodieShapes } from "../models/Geometry.js";
import { Terrain } from "../world/Terrain.js";

const $ = (id) => document.getElementById(id);
const host = $("canvasHost");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#a9c9d9");
scene.fog = new THREE.Fog("#a9c9d9", 38, 105);
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
camera.position.set(15, 13, 18);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x66745d, 2));
const sun = new THREE.DirectionalLight(0xfff0d8, 3);
sun.position.set(12, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35;
scene.add(sun);

const grid = new THREE.GridHelper(80, 40, 0x687d8d, 0x344653);
grid.position.y = 0.012;
scene.add(grid);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: "#91a77b", roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.name = "EditorGround";
scene.add(ground);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 4;
controls.maxDistance = 75;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const objects = [];
const modelTypes = ["tree", "house", "rock", "crystal", "mushroom", "flower", "bush", "barrel", "lamp", "fence"];
const shapeTypes = ["box", "sphere", "ellipsoid", "plane", "circle", "ring", "cylinder", "cone", "capsule", "torus", "torusKnot", "pyramid", "dodecahedron", "icosahedron", "octahedron", "tetrahedron"];
const icons = { tree:"🌳", house:"🏠", rock:"🪨", crystal:"💎", mushroom:"🍄", flower:"🌼", bush:"🌿", barrel:"🛢️", lamp:"💡", fence:"🪵", box:"🧊", sphere:"⚪", ellipsoid:"🥚", plane:"▱", circle:"🔵", ring:"⭕", cylinder:"🥫", cone:"🔺", capsule:"💊", torus:"🍩", torusKnot:"🪢", pyramid:"🔻", dodecahedron:"💠", icosahedron:"🔷", octahedron:"🔶", tetrahedron:"🔺" };
let selected = null;
let terrain = null;
let terrainSettings = { biome: "meadow", seed: 7, amplitude: 4 };
let nextId = 1;
let sceneName = "Untitled world";
let pointerDown = null;

function makeModel(type) {
  const factory = Models[type];
  if (!factory) throw new Error("Unknown model: " + type);
  const object = factory();
  object.userData.goodieType = type;
  object.userData.editorId = nextId++;
  object.name = type[0].toUpperCase() + type.slice(1) + " " + object.userData.editorId;
  object.position.set(0, 0, 0);
  object.traverse((node) => { if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; } });
  scene.add(object);
  objects.push(object);
  selectObject(object);
  refresh();
  return object;
}

function makeShape(type) {
  const factory = GoodieShapes[type];
  if (typeof factory !== "function") throw new Error("Unknown geometry shape: " + type);
  const object = factory({ color: "#e9a85b" });
  object.userData.goodieType = "shape:" + type;
  object.userData.editorId = nextId++;
  object.name = type[0].toUpperCase() + type.slice(1) + " " + object.userData.editorId;
  scene.add(object);
  objects.push(object);
  selectObject(object);
  refresh();
  return object;
}

function selectObject(object) {
  selected = object;
  $("selectionToast").textContent = object ? object.name : "Nothing selected";
  renderHierarchy();
  renderInspector();
}

function renderHierarchy() {
  $("objectCount").textContent = objects.length;
  $("objectStatus").textContent = objects.length + (objects.length === 1 ? " object in scene" : " objects in scene");
  const list = $("objectList");
  if (!objects.length) {
    list.innerHTML = '<div class="empty-state">Your scene is empty.<br/>Add an asset to begin.</div>';
    return;
  }
  list.innerHTML = "";
  [...objects].reverse().forEach((object) => {
    const type = object.userData.goodieType.replace(/^shape:/, "");
    const button = document.createElement("button");
    button.className = "object-row" + (object === selected ? " selected" : "");
    button.innerHTML = '<span>' + (icons[type] || "📦") + '</span><span></span><small>3D</small>';
    button.children[1].textContent = object.name;
    button.addEventListener("click", () => selectObject(object));
    list.appendChild(button);
  });
}

function field(axis, value, kind) {
  const cell = document.createElement("div");
  cell.className = "transform-cell";
  const label = document.createElement("label");
  label.textContent = axis.toUpperCase();
  const input = document.createElement("input");
  input.type = "number";
  input.step = kind === "scale" ? "0.1" : "0.25";
  input.value = Number(value.toFixed(2));
  input.addEventListener("change", () => {
    if (!selected) return;
    const number = Number(input.value);
    if (!Number.isFinite(number)) return;
    if (kind === "position") selected.position[axis] = number;
    else if (kind === "rotation") selected.rotation[axis] = THREE.MathUtils.degToRad(number);
    else selected.scale[axis] = Math.max(0.05, number);
    markChanged();
  });
  cell.append(label, input);
  return cell;
}

function renderInspector() {
  const panel = $("inspector");
  panel.innerHTML = "";
  if (!selected) {
    panel.innerHTML = '<div class="empty-state">Select an object to edit its properties.</div>';
    return;
  }
  const title = document.createElement("p");
  title.className = "inspector-name";
  title.textContent = (icons[selected.userData.goodieType.replace(/^shape:/, "")] || "📦") + "  " + selected.name;
  panel.appendChild(title);
  for (const [kind, label, values] of [
    ["position", "POSITION", selected.position],
    ["rotation", "ROTATION · DEGREES", { x: selected.rotation.x * 180 / Math.PI, y: selected.rotation.y * 180 / Math.PI, z: selected.rotation.z * 180 / Math.PI }],
    ["scale", "SCALE", selected.scale]
  ]) {
    const heading = document.createElement("div");
    heading.className = "inspector-group";
    heading.textContent = label;
    const gridFields = document.createElement("div");
    gridFields.className = "transform-grid";
    ["x", "y", "z"].forEach((axis) => gridFields.appendChild(field(axis, values[axis], kind)));
    panel.append(heading, gridFields);
  }
}

function refresh() { renderHierarchy(); renderInspector(); }
function markChanged() { $("saveState").textContent = "● Unsaved changes"; }

function rebuildTerrain() {
  if (terrain) {
    scene.remove(terrain.mesh);
    terrain.dispose();
  }
  terrainSettings = {
    biome: $("biome").value,
    seed: Number($("seed").value) || 1,
    amplitude: Number($("terrainHeight").value)
  };
  terrain = new Terrain({ width: 70, depth: 70, segments: 78, ...terrainSettings });
  terrain.mesh.position.y = -0.03;
  scene.add(terrain.mesh);
  markChanged();
}
rebuildTerrain();

function addModel(type) {
  const object = makeModel(type);
  object.position.set(0, terrain ? terrain.getHeightAt(0, 0) : 0, 0);
  markChanged();
  renderInspector();
}

$("shapeGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-shape]");
  if (button) {
    const object = makeShape(button.dataset.shape);
    object.position.set(0, terrain ? terrain.getHeightAt(0, 0) + 0.6 : 0.6, 0);
    markChanged();
    renderInspector();
  }
});

$("assetGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-model]");
  if (button) addModel(button.dataset.model);
});
$("terrainHeight").addEventListener("input", () => { $("heightValue").value = $("terrainHeight").value; });
$("applyTerrain").addEventListener("click", rebuildTerrain);

function removeSelected() {
  if (!selected) return;
  scene.remove(selected);
  const index = objects.indexOf(selected);
  if (index >= 0) objects.splice(index, 1);
  selected.traverse((node) => {
    if (node.isMesh) {
      node.geometry.dispose();
      if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
      else node.material.dispose();
    }
  });
  selected = null;
  refresh();
  markChanged();
}
$("deleteObject").addEventListener("click", removeSelected);
$("duplicateObject").addEventListener("click", () => {
  if (!selected) return;
  const copy = selected.clone(true);
  copy.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry = node.geometry.clone();
    node.material = Array.isArray(node.material)
      ? node.material.map((item) => item.clone())
      : node.material.clone();
  });
  copy.userData.editorId = nextId++;
  copy.name = selected.name.replace(/ \d+$/, "") + " " + copy.userData.editorId;
  copy.position.add(new THREE.Vector3(1.5, 0, 1.5));
  scene.add(copy);
  objects.push(copy);
  selectObject(copy);
  markChanged();
});
function focusSelection() {
  if (!selected) return;
  const box = new THREE.Box3().setFromObject(selected);
  const center = box.getCenter(new THREE.Vector3());
  controls.target.copy(center);
}
$("focusTool").addEventListener("click", focusSelection);
$("resetCamera").addEventListener("click", () => {
  camera.position.set(15, 13, 18);
  controls.target.set(0, 1, 0);
  controls.update();
});

renderer.domElement.addEventListener("pointerdown", (event) => { pointerDown = { x: event.clientX, y: event.clientY }; });
renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 7) { pointerDown = null; return; }
  pointerDown = null;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(objects, true);
  if (hits.length) {
    let target = hits[0].object;
    while (target.parent && !target.userData.goodieType) target = target.parent;
    selectObject(target.userData.goodieType ? target : null);
  } else selectObject(null);
});

function serializeScene() {
  return {
    format: "goodie-studio",
    version: 1,
    name: sceneName,
    terrain: terrainSettings,
    objects: objects.map((object) => ({
      type: object.userData.goodieType,
      name: object.name,
      position: object.position.toArray(),
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: object.scale.toArray()
    }))
  };
}
function exportScene() {
  const data = JSON.stringify(serializeScene(), null, 2);
  const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = (sceneName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "goodie-world") + ".goodie.json";
  link.click();
  URL.revokeObjectURL(url);
  $("saveState").textContent = "● Exported";
}
$("exportScene").addEventListener("click", exportScene);
$("importScene").addEventListener("click", () => $("fileInput").click());
$("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.format !== "goodie-studio" || !Array.isArray(data.objects)) throw new Error("This is not a GoodieStudio scene file.");
    objects.slice().forEach((object) => { selected = object; removeSelected(); });
    sceneName = typeof data.name === "string" ? data.name : "Imported world";
    const terrainData = data.terrain || { biome: "meadow", seed: 7, amplitude: 4 };
    $("biome").value = terrainData.biome || "meadow";
    $("seed").value = terrainData.seed ?? 7;
    $("terrainHeight").value = terrainData.amplitude ?? 4;
    $("heightValue").value = $("terrainHeight").value;
    rebuildTerrain();
    for (const item of data.objects) {
      if (!modelTypes.includes(item.type)) continue;
      const object = makeModel(item.type);
      object.name = typeof item.name === "string" ? item.name : object.name;
      object.position.fromArray(item.position || [0, 0, 0]);
      object.rotation.set(...(item.rotation || [0, 0, 0]));
      object.scale.fromArray(item.scale || [1, 1, 1]);
    }
    $("saveState").textContent = "● Imported";
    $("fileInput").value = "";
    refresh();
  } catch (error) {
    alert("Could not import scene: " + error.message);
  }
});
$("newScene").addEventListener("click", () => {
  if (objects.length && !confirm("Start a new scene? Your current scene will be cleared unless you exported it.")) return;
  objects.slice().forEach((object) => { selected = object; removeSelected(); });
  sceneName = "Untitled world";
  $("biome").value = "meadow"; $("seed").value = 7; $("terrainHeight").value = 4; $("heightValue").value = 4;
  rebuildTerrain();
  $("saveState").textContent = "● Ready";
  $("selectionToast").textContent = "Nothing selected";
});

function resize() {
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(host);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
window.addEventListener("beforeunload", () => {
  resizeObserver.disconnect();
  renderer.dispose();
});
