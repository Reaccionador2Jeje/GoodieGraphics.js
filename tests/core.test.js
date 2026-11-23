import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Models, World, Materials, ParticleEmitter, Water, version } from "../src/index.js";

test("exports the public API", () => {
  assert.equal(version, "0.2.0");
  assert.equal(typeof World, "function");
  assert.equal(typeof Materials.gold, "function");
  assert.equal(typeof ParticleEmitter, "function");
  assert.equal(typeof Water, "function");
});

test("every procedural model returns a named Three.js Group", () => {
  const models = [
    Models.tree(), Models.crystal(), Models.house(), Models.rock(),
    Models.mushroom(), Models.flower(), Models.bush(), Models.barrel(),
    Models.lamp(), Models.fence()
  ];

  for (const model of models) {
    assert.ok(model.isGroup);
    assert.ok(model.name.startsWith("Goodie"));
    assert.ok(model.children.length > 0);
    let meshCount = 0;
    model.traverse((node) => {
      if (node.isMesh) {
        meshCount++;
        assert.ok(node.geometry);
        assert.ok(node.material);
        assert.equal(node.castShadow, true);
        assert.equal(node.receiveShadow, true);
      }
    });
    assert.ok(meshCount > 0);
  }
});

test("model options customize generated assets", () => {
  const tallTree = Models.tree({ height: 8, layers: 4, fruit: true });
  const smallCrystal = Models.crystal({ height: 0.5, color: "#ff00ff", glow: false });
  assert.ok(tallTree.children.length > Models.tree().children.length);
  assert.equal(smallCrystal.name, "GoodieCrystal");
});

test("World adds, removes and creates a ground plane", () => {
  const world = new World();
  const rock = Models.rock();
  world.add(rock);
  assert.equal(world.scene.children.includes(rock), true);
  assert.equal(world.objects.has(rock), true);

  world.remove(rock);
  assert.equal(world.scene.children.includes(rock), false);
  assert.equal(world.objects.has(rock), false);

  const ground = world.addGround({ size: 25 });
  assert.equal(ground.name, "GoodieGround");
  assert.equal(ground.receiveShadow, true);
  assert.equal(world.objects.has(ground), true);
});

test("World.add rejects non-3D values", () => {
  const world = new World();
  assert.throws(() => world.add({}), /Three.js Object3D/);
});

test("ParticleEmitter creates a fixed point buffer and supports updates", () => {
  const emitter = new ParticleEmitter({ count: 12 });
  assert.equal(emitter.points.isPoints, true);
  assert.equal(emitter.points.geometry.attributes.position.count, 12);
  assert.equal(emitter.burst(5), emitter);
  assert.equal(emitter.update(1 / 60), emitter);
  assert.equal(emitter.stop(), emitter);
  assert.equal(emitter.start(), emitter);
  emitter.dispose();
});

test("Water exposes an animated mesh and advances its shader clock", () => {
  const water = new Water({ width: 6, height: 4 });
  assert.equal(water.mesh.isMesh, true);
  assert.equal(water.mesh.name, "GoodieWater");
  water.update(0.5);
  assert.ok(water.mesh.material.uniforms.uTime.value > 0);
  water.dispose();
});
