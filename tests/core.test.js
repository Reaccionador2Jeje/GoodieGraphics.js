import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { Models, World, Materials, version } from "../src/index.js";

test("exports the initial public API", () => {
  assert.equal(version, "0.1.0");
  assert.equal(typeof World, "function");
  assert.equal(typeof Materials.gold, "function");
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
