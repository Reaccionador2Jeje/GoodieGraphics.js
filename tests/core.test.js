import test from "node:test";
import assert from "node:assert/strict";
import { Models, World, Materials, ParticleEmitter, Water, Terrain, DayNightCycle, Animator, AnimationBuilder, AnimationPresets, GoodieShapes, Shapes, ModelBuilder, ModelLoader, version, LoopOnce } from "../src/index.js";

test("exports the public API", () => {
  assert.equal(version, "0.4.0");
  assert.equal(typeof World, "function");
  assert.equal(typeof Materials.gold, "function");
  assert.equal(typeof ParticleEmitter, "function");
  assert.equal(typeof Water, "function");
  assert.equal(typeof Terrain, "function");
  assert.equal(typeof DayNightCycle, "function");
  assert.equal(typeof Animator, "function");
  assert.equal(typeof AnimationBuilder, "function");
  assert.equal(typeof AnimationPresets, "function");
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

test("Terrain generates reproducible vertex geometry and biome metadata", () => {
  const first = new Terrain({ width: 30, depth: 20, segments: 16, seed: 9, biome: "forest" });
  const second = new Terrain({ width: 30, depth: 20, segments: 16, seed: 9, biome: "forest" });
  assert.equal(first.mesh.name, "GoodieTerrain");
  assert.equal(first.mesh.userData.biome, "forest");
  assert.deepEqual(
    Array.from(first.mesh.geometry.attributes.position.array),
    Array.from(second.mesh.geometry.attributes.position.array)
  );
  assert.equal(first.mesh.geometry.attributes.color.count, first.mesh.geometry.attributes.position.count);
  assert.equal(typeof first.getHeightAt(2, 3), "number");
  assert.deepEqual(Terrain.biomes, ["meadow", "forest", "desert", "snow", "volcanic"]);
  first.dispose();
  second.dispose();
});

test("Terrain rejects unknown biomes", () => {
  assert.throws(() => new Terrain({ biome: "unknown" }), /Unknown biome/);
});

test("DayNightCycle updates world lighting and supports time controls", () => {
  const world = new World();
  const cycle = new DayNightCycle(world, { duration: 60, startAt: 0.5 });
  const before = cycle.time;
  cycle.update(1);
  assert.notEqual(cycle.time, before);
  assert.equal(cycle.setTime(0.75), cycle);
  assert.equal(cycle.time, 0.75);
  assert.equal(cycle.pause(), cycle);
  assert.equal(cycle.resume(), cycle);
});

test("GoodieAnimations builds and plays keyframe clips", () => {
  const model = Models.tree();
  const clip = new AnimationBuilder(model, { name: "TestMove", duration: 1 })
    .addVector3(model, "position", [0, 0.5, 1], [0, 0, 0, 0, 2, 0, 0, 0, 0], { interpolation: "smooth" })
    .build();
  const animator = new Animator(model, { clips: [clip] });
  animator.play("TestMove", { loop: LoopOnce, repetitions: 1, clampWhenFinished: true });
  animator.update(0.5);
  assert.ok(model.position.y > 0);
  assert.equal(animator.pause(), animator);
  assert.equal(animator.resume(), animator);
  assert.equal(animator.setTimeScale(0.5), animator);
  assert.equal(animator.stop(), animator);
  animator.dispose();
});

test("GoodieAnimations presets create named clips and validate tracks", () => {
  const model = Models.crystal();
  const idle = AnimationPresets.idle(model);
  const spin = AnimationPresets.spin(model, { turns: 2 });
  const pulse = AnimationPresets.pulse(model);
  const sway = AnimationPresets.sway(model);
  const child = new (model.constructor)();
  child.name = "AnimatedPart";
  model.add(child);
  const quaternionClip = new AnimationBuilder(model, { name: "TurnPart", duration: 1 })
    .addQuaternion(child, [0, 1], [0, 0, 0, 1, 0, 1, 0, 0])
    .build();
  assert.equal(idle.name, "Idle");
  assert.equal(spin.name, "Spin");
  assert.equal(pulse.name, "Pulse");
  assert.equal(sway.name, "Sway");
  assert.equal(quaternionClip.tracks[0].ValueTypeName, "quaternion");
  assert.throws(() => new AnimationBuilder(model).addVector3(model, "position", [0, 0], [0, 1], {}), /values must contain/);
  assert.throws(() => new Animator(model).play("missing"), /was not found/);
});

test("Animator can consume GLTF-style animation collections", () => {
  const model = Models.tree();
  const clip = AnimationPresets.idle(model);
  const animator = Animator.fromGLTF({ scene: model, animations: [clip] });
  assert.equal(animator.play("Idle").isRunning(), true);
  animator.dispose();
  assert.throws(() => Animator.fromGLTF({ scene: model, animations: [] , bad: true }, { root: null }), /GLTF result/);
});

test("GoodieShapes creates many generic editable geometries", () => {
  const factories = ["box", "plane", "circle", "ring", "sphere", "ellipsoid", "capsule", "cylinder", "cone", "pyramid", "torus", "torusKnot", "dodecahedron", "icosahedron", "octahedron", "tetrahedron"];
  for (const name of factories) {
    const object = GoodieShapes[name]();
    assert.equal(object.isMesh, true, name + " should return a Mesh");
    assert.equal(object.geometry.isBufferGeometry, true);
  }
  assert.equal(Shapes, GoodieShapes);
  assert.equal(GoodieShapes.lathe({ points: [[0.2, 0], [0.5, 1], [0.2, 2]] }).isMesh, true);
  assert.equal(GoodieShapes.tube({ points: [[0, 0, 0], [1, 1, 0], [2, 0, 0]] }).isMesh, true);
  assert.equal(GoodieShapes.extrude({ shape: GoodieShapes.shape({ points: [[0, 0], [1, 0], [0.5, 1]] }) }).isMesh, true);
  assert.throws(() => GoodieShapes.shape({ points: [[0, 0], [1, 0]] }), /three/);
});

test("ModelBuilder assembles arbitrary meshes and nested groups", () => {
  const builder = new ModelBuilder({ name: "TestCustomModel" });
  const body = builder.box({ color: "#ff0000" }, { name: "Body", position: [0, 1, 0] });
  const headGroup = builder.group("Head", { position: [0, 2, 0] });
  builder.add(GoodieShapes.sphere({ radius: 0.5 }), { name: "HeadMesh", parent: headGroup });
  const model = builder.build();
  assert.equal(model.name, "TestCustomModel");
  assert.equal(model.getObjectByName("Body"), body);
  assert.ok(model.getObjectByName("HeadMesh"));
  assert.throws(() => builder.add(new (body.constructor)(), { parent: new (body.constructor)() }), /Parent/);
  assert.equal(ModelBuilder.from(model).build().children.length, model.children.length);
  assert.equal(typeof ModelLoader.gltf, "function");
});
