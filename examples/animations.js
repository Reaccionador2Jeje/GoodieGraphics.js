import * as Goodie from "../src/index.js";

// Attach an animated procedural model to a normal GoodieGraphics world.
const game = new Goodie.Game({ container: document.querySelector("#app") });
const world = new Goodie.World();
const character = Goodie.Models.crystal({ height: 3, glow: true });
character.position.set(0, 0, 0);
world.add(character);

const animator = new Goodie.Animator(character, {
  clips: [
    Goodie.AnimationPresets.idle(character, { height: 0.12, angle: 0.04 }),
    Goodie.AnimationPresets.spin(character, { duration: 5, axis: "y" }),
    Goodie.AnimationPresets.pulse(character, { amount: 0.16 })
  ]
});

animator.play("Idle");
game.setWorld(world);
game.onUpdate((delta) => animator.update(delta));
game.start();

// Switch clips from your own UI or game logic:
// animator.crossFadeTo("Spin", { duration: 0.6 });
// animator.crossFadeTo("Pulse", { duration: 0.25 });
// animator.pause();
// animator.resume();

// When the character is permanently removed:
// animator.dispose();
