import * as Goodie from "../src/index.js";

const game = new Goodie.Game({
  container: document.querySelector("#app"),
  background: "#b9ddff",
  shadows: true,
  camera: { position: [11, 9, 13], lookAt: [0, 1, 0] }
});

const world = new Goodie.World({ background: "#b9ddff", fog: { color: "#b9ddff", near: 25, far: 65 } });
world.addGround({ size: 80, color: "#83b879" });

const home = Goodie.Models.house({ width: 4.5, height: 3.5 });
home.position.set(0, 0, 0);
world.add(home);

for (const [x, z, scale] of [[-6, -3, 1], [-5, 4, 1.2], [6, -4, 0.9], [7, 4, 1.1], [0, 7, 0.8]]) {
  const tree = Goodie.Models.tree({ height: 4 * scale, fruit: true });
  tree.position.set(x, 0, z);
  world.add(tree);
}

for (const [x, z, color] of [[-3, 1, "#75e5ff"], [4, 2, "#c084fc"], [2, -5, "#f9a8d4"]]) {
  const gem = Goodie.Models.crystal({ height: 2.2, color });
  gem.position.set(x, 0, z);
  world.add(gem);
}

game.setWorld(world);
game.onUpdate((delta) => {
  for (const object of world.objects) {
    if (object.name === "GoodieCrystal") object.rotation.y += delta * 0.7;
  }
});
game.start();
