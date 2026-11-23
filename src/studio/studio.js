import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { Models } from "../models/Models.js";
import { GoodieShapes } from "../models/Geometry.js";
import { Terrain } from "../world/Terrain.js";

const $ = (id) => document.getElementById(id);
document.documentElement.classList.toggle("desktop-app", Boolean(window.goodieDesktop?.isDesktop));
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

const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setMode("translate");
transformControls.setSpace("world");
transformControls.size = 0.85;
scene.add(transformControls.getHelper());
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});
transformControls.addEventListener("objectChange", () => {
  markChanged();
});
transformControls.addEventListener("mouseUp", () => {
  renderInspector();
});

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
let hasUnsavedChanges = false;

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
  if (selected) transformControls.attach(selected);
  else transformControls.detach();
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

function collectMaterials(root = selected) {
  if (!root) return [];
  const materials = [];
  root.traverse((node) => {
    if (!node.isMesh) return;
    const list = Array.isArray(node.material) ? node.material : [node.material];
    list.forEach((material) => { if (material && !materials.includes(material)) materials.push(material); });
  });
  return materials;
}

function readMaterialSettings(root = selected) {
  const material = collectMaterials(root)[0];
  if (!material) return null;
  return {
    color: material.color?.getHexString() ? "#" + material.color.getHexString() : "#ffffff",
    roughness: Number.isFinite(material.roughness) ? material.roughness : 0.7,
    metalness: Number.isFinite(material.metalness) ? material.metalness : 0,
    opacity: Number.isFinite(material.opacity) ? material.opacity : 1,
    wireframe: Boolean(material.wireframe)
  };
}

function applyMaterialSettings(settings, root = selected, dirty = true) {
  const materials = collectMaterials(root);
  if (!materials.length) return;
  for (const material of materials) {
    if (material.color && settings.color) material.color.set(settings.color);
    if ("roughness" in material && settings.roughness !== undefined) material.roughness = THREE.MathUtils.clamp(Number(settings.roughness), 0, 1);
    if ("metalness" in material && settings.metalness !== undefined) material.metalness = THREE.MathUtils.clamp(Number(settings.metalness), 0, 1);
    if ("opacity" in material && settings.opacity !== undefined) {
      material.opacity = THREE.MathUtils.clamp(Number(settings.opacity), 0, 1);
      material.transparent = material.opacity < 1;
    }
    if ("wireframe" in material && settings.wireframe !== undefined) material.wireframe = Boolean(settings.wireframe);
    material.needsUpdate = true;
  }
  if (dirty) markChanged();
}

function inspectorHeading(label) {
  const heading = document.createElement("div");
  heading.className = "inspector-group";
  heading.textContent = label;
  return heading;
}

function materialControl(labelText, type, value, onInput, { min, max, step } = {}) {
  const wrapper = document.createElement("label");
  wrapper.className = "material-control";
  const label = document.createElement("span");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = type;
  input.value = String(value);
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  if (step !== undefined) input.step = String(step);
  input.addEventListener("input", () => onInput(input.value));
  wrapper.append(label, input);
  return wrapper;
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
    const gridFields = document.createElement("div");
    gridFields.className = "transform-grid";
    ["x", "y", "z"].forEach((axis) => gridFields.appendChild(field(axis, values[axis], kind)));
    panel.append(inspectorHeading(label), gridFields);
  }

  const settings = readMaterialSettings();
  panel.appendChild(inspectorHeading("MATERIAL"));
  if (!settings) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = "This object has no editable mesh materials.";
    panel.appendChild(note);
    return;
  }
  const materialGrid = document.createElement("div");
  materialGrid.className = "material-grid";
  materialGrid.appendChild(materialControl("Base color", "color", settings.color, (value) => applyMaterialSettings({ color: value })));
  materialGrid.appendChild(materialControl("Roughness", "range", settings.roughness, (value) => applyMaterialSettings({ roughness: value }), { min: 0, max: 1, step: 0.01 }));
  materialGrid.appendChild(materialControl("Metalness", "range", settings.metalness, (value) => applyMaterialSettings({ metalness: value }), { min: 0, max: 1, step: 0.01 }));
  materialGrid.appendChild(materialControl("Opacity", "range", settings.opacity, (value) => applyMaterialSettings({ opacity: value }), { min: 0, max: 1, step: 0.01 }));
  const wireframeLabel = document.createElement("label");
  wireframeLabel.className = "material-toggle";
  const wireframe = document.createElement("input");
  wireframe.type = "checkbox";
  wireframe.checked = settings.wireframe;
  wireframe.addEventListener("change", () => applyMaterialSettings({ wireframe: wireframe.checked }));
  wireframeLabel.append(wireframe, document.createTextNode("Wireframe"));
  materialGrid.appendChild(wireframeLabel);
  panel.appendChild(materialGrid);
}

function refresh() { renderHierarchy(); renderInspector(); }
function markChanged() {
  const wasClean = !hasUnsavedChanges;
  hasUnsavedChanges = true;
  $("saveState").textContent = "● Unsaved changes";
  if (wasClean) window.goodieDesktop?.setDirty(true);
}
function markClean(label = "● Ready") {
  hasUnsavedChanges = false;
  $("saveState").textContent = label;
  window.goodieDesktop?.setDirty(false);
}

function rebuildTerrain(markDirty = true) {
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
  if (markDirty) markChanged();
}
rebuildTerrain(false);

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
  transformControls.detach();
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
function setTransformMode(mode) {
  if (!["translate", "rotate", "scale"].includes(mode)) return;
  transformControls.setMode(mode);
  document.querySelectorAll("[data-transform-mode]").forEach((button) => {
    const active = button.dataset.transformMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}
document.querySelectorAll("[data-transform-mode]").forEach((button) => {
  button.addEventListener("click", () => setTransformMode(button.dataset.transformMode));
});
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
  const modes = { w: "translate", e: "rotate", r: "scale" };
  const mode = modes[event.key.toLowerCase()];
  if (mode) {
    setTransformMode(mode);
    event.preventDefault();
  }
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

renderer.domElement.addEventListener("pointerdown", (event) => { pointerDown = { x: event.clientX, y: event.clientY, gizmo: transformControls.axis !== null }; });
renderer.domElement.addEventListener("pointerup", (event) => {
  if (!pointerDown || pointerDown.gizmo || transformControls.dragging || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 7) { pointerDown = null; return; }
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
      scale: object.scale.toArray(),
      material: readMaterialSettings(object)
    }))
  };
}
async function exportScene() {
  const data = JSON.stringify(serializeScene(), null, 2);
  const suggestedName = (sceneName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "goodie-world") + ".goodie.json";
  if (window.goodieDesktop?.isDesktop) {
    try {
      if (await window.goodieDesktop.saveScene(data, suggestedName)) markClean("● Exported");
    } catch (error) { await window.goodieDesktop.showError(error.message); }
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = suggestedName; link.click(); URL.revokeObjectURL(url);
  markClean("● Exported");
}

async function importSceneText(text) {
  const data = JSON.parse(text);
  if (data.format !== "goodie-studio" || !Array.isArray(data.objects)) throw new Error("This is not a GoodieStudio scene file.");
  objects.slice().forEach((object) => { selected = object; removeSelected(); });
  sceneName = typeof data.name === "string" ? data.name : "Imported world";
  const terrainData = data.terrain || { biome: "meadow", seed: 7, amplitude: 4 };
  $("biome").value = terrainData.biome || "meadow";
  $("seed").value = terrainData.seed ?? 7;
  $("terrainHeight").value = terrainData.amplitude ?? 4;
  $("heightValue").value = $("terrainHeight").value;
  rebuildTerrain(false);
  for (const item of data.objects) {
    const isShape = typeof item.type === "string" && item.type.startsWith("shape:");
    const shapeType = isShape ? item.type.slice(6) : null;
    if (isShape ? !shapeTypes.includes(shapeType) : !modelTypes.includes(item.type)) continue;
    const object = isShape ? makeShape(shapeType) : makeModel(item.type);
    object.name = typeof item.name === "string" ? item.name : object.name;
    object.position.fromArray(item.position || [0, 0, 0]);
    object.rotation.set(...(item.rotation || [0, 0, 0]));
    object.scale.fromArray(item.scale || [1, 1, 1]);
    if (item.material && typeof item.material === "object") {
      const material = item.material;
      const settings = {
        color: /^#[0-9a-f]{6}$/i.test(material.color) ? material.color : "#ffffff",
        roughness: Number.isFinite(Number(material.roughness)) ? THREE.MathUtils.clamp(Number(material.roughness), 0, 1) : 0.7,
        metalness: Number.isFinite(Number(material.metalness)) ? THREE.MathUtils.clamp(Number(material.metalness), 0, 1) : 0,
        opacity: Number.isFinite(Number(material.opacity)) ? THREE.MathUtils.clamp(Number(material.opacity), 0, 1) : 1,
        wireframe: Boolean(material.wireframe)
      };
      applyMaterialSettings(settings, object, false);
    }
  }
  $("fileInput").value = ""; refresh(); markClean("● Imported");
}

async function confirmDiscardChanges() {
  if (!hasUnsavedChanges) return true;
  return window.goodieDesktop?.isDesktop
    ? window.goodieDesktop.confirmDiscardChanges()
    : confirm("Discard your unsaved changes and continue?");
}

async function openScene() {
  if (!await confirmDiscardChanges()) return;
  if (window.goodieDesktop?.isDesktop) {
    try { const file = await window.goodieDesktop.openScene(); if (file) await importSceneText(file.content); }
    catch (error) { await window.goodieDesktop.showError(error.message); }
    return;
  }
  $("fileInput").click();
}

async function createNewScene() {
  if (!await confirmDiscardChanges()) return;
  objects.slice().forEach((object) => { selected = object; removeSelected(); });
  sceneName = "Untitled world";
  $("biome").value = "meadow"; $("seed").value = 7; $("terrainHeight").value = 4; $("heightValue").value = 4;
  rebuildTerrain(false); $("selectionToast").textContent = "Nothing selected"; markClean("● Ready");
}

$("exportScene").addEventListener("click", exportScene);
$("importScene").addEventListener("click", openScene);
$("newScene").addEventListener("click", createNewScene);
$("fileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try { await importSceneText(await file.text()); }
  catch (error) {
    if (window.goodieDesktop?.isDesktop) await window.goodieDesktop.showError(error.message);
    else console.error("Could not import scene:", error);
  }
});
window.goodieDesktop?.onCommand((name) => {
  if (name === "new") createNewScene();
  if (name === "open") openScene();
  if (name === "save") exportScene();
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
  transformControls.dispose();
  controls.dispose();
  renderer.dispose();
});
