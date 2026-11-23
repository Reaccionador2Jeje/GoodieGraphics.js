import * as Goodie from "../src/index.js";

const game = new Goodie.Game({
  container: document.querySelector("#app"),
  background: "#b9ddff",
  shadows: true,
  camera: { position: [15, 13, 19], lookAt: [0, 1, 0] }
});

const world = new Goodie.World({ background: "#b9ddff", fog: { color: "#b9ddff", near: 30, far: 90 } });
const terrain = new Goodie.Terrain({
  width: 90, depth: 90, segments: 110,
  seed: 23, biome: "meadow", amplitude: 1.4, frequency: 0.055
});
world.add(terrain.mesh);

const home = Goodie.Models.house({ width: 4.5, height: 3.5 });
home.position.y = terrain.getHeightAt(0, 0);
world.add(home);

const trees = [
  [-8, -5, 1.1], [-7, 5, 0.9], [7, -6, 1.2], [8, 5, 1], [-2, 8, 0.8]
];
for (const [x, z, scale] of trees) {
  const item = Goodie.Models.tree({ height: 4 * scale, fruit: true });
  item.position.set(x, terrain.getHeightAt(x, z), z);
  world.add(item);
}

const props = [
  [Goodie.Models.crystal({ color: "#75e5ff" }), -3, 1],
  [Goodie.Models.crystal({ color: "#c084fc" }), 4, 2],
  [Goodie.Models.rock({ size: 1.2 }), -5, -2],
  [Goodie.Models.mushroom({ height: 1.5 }), 5, -2],
  [Goodie.Models.bush({ berries: true }), -3, -5],
  [Goodie.Models.flower({ petalColor: "#ff91c8" }), 3, 5],
  [Goodie.Models.barrel(), 3, -1],
  [Goodie.Models.lamp(), -5, 3],
  [Goodie.Models.fence(), 0, -5]
];

for (const [object, x, z] of props) {
  object.position.set(x, terrain.getHeightAt(x, z), z);
  world.add(object);
}

const pondZ = -13;
const pond = new Goodie.Water({ width: 8, height: 5, color: "#35bde8", opacity: 0.88 });
pond.mesh.position.set(0, terrain.getHeightAt(0, pondZ) + 0.12, pondZ);
world.add(pond.mesh);

const sparkle = new Goodie.ParticleEmitter({
  count: 90, color: "#c7f5ff", size: 0.11,
  lifetime: 2.4, speed: 0.8, spread: 3,
  gravity: 0.12,
  position: [0, terrain.getHeightAt(0, pondZ) + 0.5, pondZ]
});
world.add(sparkle.points);

const crystalGlow = new Goodie.Glow({
  color: "#8be9ff", size: 2.4, opacity: 0.55,
  position: [-3, terrain.getHeightAt(-3, 1) + 1.8, 1]
});
world.add(crystalGlow.sprite);

const dayNight = new Goodie.DayNightCycle(world, { duration: 150, startAt: 0.5 });

game.setWorld(world);
game.onUpdate((delta) => {
  for (const object of world.objects) {
    if (object.name === "GoodieCrystal") object.rotation.y += delta * 0.7;
  }
  pond.update(delta);
  sparkle.update(delta);
  dayNight.update(delta);
});
game.start();

window.goodieDemo = { game, world, terrain, pond, sparkle, crystalGlow, dayNight };
