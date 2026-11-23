import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { editGeometry, inspectGeometry, restoreGeometryJSON, serializeGeometryJSON } from "../src/studio/GeometryTools.js";

function close(actual, expected, epsilon = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected}`);
}

test("inspectGeometry counts meshes, vertices and triangles recursively", () => {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)));
  group.add(new THREE.Mesh(new THREE.TetrahedronGeometry(1)));
  assert.deepEqual(inspectGeometry(group), { meshes: 2, vertices: 36, triangles: 16 });
});

test("center operation recenters geometry without moving it in world space", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  mesh.geometry.translate(3, 4, 5);
  mesh.position.set(7, 8, 9);
  mesh.rotation.set(0.35, 0.7, -0.2);
  mesh.scale.set(1.5, 0.8, 2);
  const before = new THREE.Box3().setFromObject(mesh);
  const originalGeometry = mesh.geometry;
  const result = editGeometry(mesh, "center");
  const after = new THREE.Box3().setFromObject(mesh);
  close(after.min.x, before.min.x); close(after.min.y, before.min.y); close(after.min.z, before.min.z);
  close(after.max.x, before.max.x); close(after.max.y, before.max.y); close(after.max.z, before.max.z);
  assert.notEqual(mesh.geometry, originalGeometry);
  close(mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).length(), 0);
  assert.equal(result.meshes, 1);
});

test("mirror edits a private geometry copy and refreshes normals and bounds", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  const originalGeometry = mesh.geometry;
  const originalX = mesh.geometry.getAttribute("position").getX(0);
  editGeometry(mesh, "mirror", "x");
  assert.notEqual(mesh.geometry, originalGeometry);
  close(mesh.geometry.getAttribute("position").getX(0), -originalX);
  assert.ok(mesh.geometry.getAttribute("normal"));
  assert.ok(mesh.geometry.boundingBox);
  assert.ok(mesh.geometry.boundingSphere);
  assert.equal(originalGeometry.getAttribute("position").getX(0), originalX);
});

test("normal recalculation works recursively on nested meshes", () => {
  const root = new THREE.Group();
  const child = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry());
  child.add(mesh); root.add(child);
  const result = editGeometry(root, "normals");
  assert.equal(result.meshes, 1);
  assert.equal(mesh.geometry.getAttribute("normal").count, mesh.geometry.getAttribute("position").count);
});

test("invalid operations and mirror axes are rejected", () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry());
  assert.throws(() => editGeometry(mesh, "bevel"), /Unknown geometry operation/);
  assert.throws(() => editGeometry(mesh, "mirror", "q"), /Mirror axis/);
});

test("objects without mesh descendants are safe no-ops", () => {
  const group = new THREE.Group();
  assert.deepEqual(editGeometry(group, "center"), { meshes: 0, vertices: 0, triangles: 0 });
});

test("serialized edited geometry can be restored with its attributes and groups", () => {
  const original = new THREE.BoxGeometry(2, 3, 4, 2, 2, 2);
  original.addGroup(0, 6, 0);
  original.translate(1, 2, 3);
  const restored = restoreGeometryJSON(serializeGeometryJSON(original));
  assert.equal(restored.getAttribute("position").count, original.getAttribute("position").count);
  assert.equal(restored.index.count, original.index.count);
  assert.equal(restored.groups.length, original.groups.length);
  close(restored.getAttribute("position").getX(0), original.getAttribute("position").getX(0));
  close(restored.getAttribute("normal").getZ(0), original.getAttribute("normal").getZ(0));
});

test("invalid geometry JSON is rejected", () => {
  assert.throws(() => restoreGeometryJSON({}), /Invalid serialized BufferGeometry/);
  assert.throws(() => restoreGeometryJSON({ data: { attributes: { position: { type: "EvilArray", itemSize: 3, array: [] } } } }), /Invalid serialized geometry attribute/);
});
