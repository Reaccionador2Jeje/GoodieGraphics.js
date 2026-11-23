import * as Goodie from "../src/index.js";

const game = new Goodie.Game({
  container: document.querySelector("#app"),
  background: "#b9ddff",
  shadows: true,
  camera: { position: [13, 11, 16], lookAt: [0, 1, 0] }
});

const world = new Goodie.World({ background: "#b9ddff", fog: { color: "#b9ddff", near: 28, far: 75 } });
world.addGround({ size: 90, color: "#83b879" });

const home = Goodie.Models.house({ width: 4.5, height: 3.5 });
world.add(home);

const trees = [
  [-8, -5, 1.1], [-7, 5, 0.9], [7, -6, 1.2], [8, 5, 1], [-2, 8, 0.8]
];
for (const [x, z, scale] of trees) {
  const item = Goodie.Models.tree({ height: 4 * scale, fruit: true });
  item.position.set(x, 0, z);
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
  object.position.set(x, 0, z);
  world.add(object);
}

game.setWorld(world);
game.onUpdate((delta) => {
  for (const object of world.objects) {
    if (object.name === "GoodieCrystal") object.rotation.y += delta * 0.7;
  }
});
game.start();
