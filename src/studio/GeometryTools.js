import { BufferAttribute, BufferGeometry, Vector3 } from "three";

/**
 * Non-destructive geometry operations for GoodieStudio.
 * Each operation clones source geometries before editing so duplicated objects
 * and other scene instances never share the edited GPU buffers.
 */

function meshesOf(root) {
  if (!root?.isObject3D) throw new TypeError("Geometry operations expect a Three.js Object3D.");
  const meshes = [];
  root.traverse((node) => {
    if (node.isMesh && node.geometry?.isBufferGeometry) meshes.push(node);
  });
  return meshes;
}

function refreshGeometry(geometry) {
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.attributes.position.needsUpdate = true;
  if (geometry.attributes.normal) geometry.attributes.normal.needsUpdate = true;
}

export function inspectGeometry(root) {
  const meshes = meshesOf(root);
  let vertices = 0;
  let triangles = 0;
  for (const mesh of meshes) {
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    if (!position) continue;
    vertices += position.count;
    triangles += Math.floor((geometry.index?.count ?? position.count) / 3);
  }
  return { meshes: meshes.length, vertices, triangles };
}

export function editGeometry(root, operation, axis = "x") {
  const meshes = meshesOf(root);
  if (!meshes.length) return { meshes: 0, vertices: 0, triangles: 0 };

  if (operation === "mirror" && !["x", "y", "z"].includes(axis)) {
    throw new RangeError('Mirror axis must be "x", "y" or "z".');
  }
  if (!["center", "normals", "mirror"].includes(operation)) {
    throw new RangeError("Unknown geometry operation: " + operation);
  }

  for (const mesh of meshes) {
    const geometry = mesh.geometry.clone();
    if (operation === "center") {
      geometry.computeBoundingBox();
      const center = geometry.boundingBox.getCenter(new Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
      center.multiply(mesh.scale).applyQuaternion(mesh.quaternion);
      mesh.position.add(center);
    } else if (operation === "normals") {
      geometry.computeVertexNormals();
    } else {
      const scale = { x: 1, y: 1, z: 1 };
      scale[axis] = -1;
      geometry.scale(scale.x, scale.y, scale.z);
      geometry.computeVertexNormals();
    }
    refreshGeometry(geometry);
    mesh.geometry = geometry;
    mesh.userData.goodieGeometryEdited = true;
  }
  return inspectGeometry(root);
}

const typedArrays = {
  Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
  Int32Array, Uint32Array, Float32Array, Float64Array
};

function restoreAttribute(data, fallbackType = "Float32Array") {
  const source = Array.isArray(data) ? { array: data } : data;
  const rawArray = Array.isArray(source?.array)
    ? source.array
    : (ArrayBuffer.isView(source?.array) ? Array.from(source.array) : null);
  const ArrayType = typedArrays[source?.type] || typedArrays[fallbackType];
  const itemSize = source?.itemSize ?? (fallbackType === "Uint32Array" ? 1 : undefined);
  if (!ArrayType || !rawArray || !Number.isInteger(itemSize) || itemSize < 1 || itemSize > 4) {
    throw new TypeError("Invalid serialized geometry attribute (type=" + String(source?.type) + ", itemSize=" + String(itemSize) + ").");
  }
  return new BufferAttribute(new ArrayType(rawArray), itemSize, Boolean(source.normalized));
}

export function serializeGeometryJSON(source) {
  if (!source?.isBufferGeometry) throw new TypeError("Expected a Three.js BufferGeometry.");
  const geometry = source.clone();
  // Built-in geometries otherwise serialize constructor parameters, not edited buffers.
  delete geometry.parameters;
  return geometry.toJSON();
}

export function restoreGeometryJSON(json) {
  const data = json?.data;
  if (!data || typeof data.attributes !== "object") throw new TypeError("Invalid serialized BufferGeometry.");
  const geometry = new BufferGeometry();
  for (const [name, attribute] of Object.entries(data.attributes)) geometry.setAttribute(name, restoreAttribute(attribute));
  if (data.index) geometry.setIndex(restoreAttribute(data.index, "Uint32Array"));
  for (const group of data.groups || []) geometry.addGroup(group.start, group.count, group.materialIndex);
  if (data.drawRange) geometry.setDrawRange(data.drawRange.start ?? 0, data.drawRange.count ?? Infinity);
  for (const [name, attributes] of Object.entries(data.morphAttributes || {})) {
    geometry.morphAttributes[name] = attributes.map(restoreAttribute);
  }
  geometry.morphTargetsRelative = Boolean(data.morphTargetsRelative);
  geometry.name = typeof json.name === "string" ? json.name : "";
  geometry.userData = json.userData && typeof json.userData === "object" ? structuredClone(json.userData) : {};
  refreshGeometry(geometry);
  return geometry;
}
