import { Vector3 } from "three";

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
  }
  return inspectGeometry(root);
}
