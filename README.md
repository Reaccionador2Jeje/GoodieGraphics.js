# GoodieGraphics.js 🍰

**Make the Web 3D Delicious.**

GoodieGraphics.js is a high-level 3D graphics toolkit for the web, powered by Three.js. It combines a friendly scene API, procedural 3D assets and reusable real-time effects.

> Early development: APIs may change while the project grows. The package is not published to npm yet.

## Get the project

```bash
git clone https://github.com/Reaccionador2Jeje/GoodieGraphics.js.git
cd GoodieGraphics.js
npm install
npm run dev
```

## Quick start

```js
import * as Goodie from "./src/index.js";

const game = new Goodie.Game({ container: document.querySelector("#app") });
const world = new Goodie.World();

world.add(
  Goodie.Models.tree(),
  Goodie.Models.house(),
  Goodie.Models.crystal()
);
world.addGround();

const water = new Goodie.Water({ width: 12, height: 8 });
world.add(water.mesh);

const particles = new Goodie.ParticleEmitter({ count: 80, color: "#9cecff" });
world.add(particles.points);

game.setWorld(world);
game.onUpdate((delta) => {
  water.update(delta);
  particles.update(delta);
});
game.start();
```

## Procedural model library

| Model | Description |
| --- | --- |
| `Models.tree()` | Layered low-poly tree; optional fruit |
| `Models.house()` | Small house with roof, door and windows |
| `Models.crystal()` | Faceted crystal with optional glow |
| `Models.rock()` | Irregular low-poly boulder |
| `Models.mushroom()` | Cartoon mushroom with optional spots |
| `Models.flower()` | Stem, leaves and configurable petals |
| `Models.bush()` | Clustered bush; optional berries |
| `Models.barrel()` | Wooden barrel with metal hoops |
| `Models.lamp()` | Decorative warm-glowing park lamp |
| `Models.fence()` | Reusable wooden fence segment |

All models return Three.js `Group` objects.

## GoodieFX effects

### ParticleEmitter

Creates a lightweight point-based particle system.

```js
const dust = new Goodie.ParticleEmitter({
  count: 120,
  color: "#fff0b5",
  size: 0.14,
  lifetime: 2,
  speed: 1.2,
  spread: 1.5,
  gravity: -0.7,
  loop: true
});
world.add(dust.points);

game.onUpdate((delta) => dust.update(delta));
dust.burst(40); // one-time burst
dust.stop();    // pause simulation
dust.start();   // resume simulation
dust.dispose(); // release GPU resources
```

The emitter uses a fixed particle buffer and CPU updates. Keep particle counts modest on mobile devices.

### Water

Adds a stylized animated water surface with a compact shader.

```js
const lake = new Goodie.Water({
  width: 18,
  height: 12,
  color: "#35bde8",
  opacity: 0.85,
  waveSpeed: 1,
  waveScale: 0.16
});
world.add(lake.mesh);
game.onUpdate((delta) => lake.update(delta));
```

### Glow

Creates a soft additive sprite for magical props, lamps and crystals. It uses a small canvas-generated texture.

```js
const aura = new Goodie.Glow({
  color: "#8be9ff",
  size: 2,
  opacity: 0.7,
  position: [0, 1, 0]
});
world.add(aura.sprite);
aura.setColor("#ffc4ed");
aura.dispose();
```

Call `dispose()` on effects when removing them permanently to release their GPU resources.

## Core modules

- `Game`: renderer, camera, animation loop and resize handling.
- `World`: scene container, lighting and ground helper.
- `Models`: procedural 3D asset library.
- `Materials`: reusable material presets.
- `ParticleEmitter`, `Water`, `Glow`: GoodieFX real-time effects.

## Scripts

- `npm run dev`: start the Vite showcase.
- `npm run build`: create a production build.
- `npm test`: run the Node.js test suite.

## Development

Three.js is the rendering foundation. GoodieGraphics.js focuses on a higher-level API, procedural assets and creator-friendly workflows rather than reimplementing a WebGL renderer.

## License

MIT. See [LICENSE](./LICENSE).
