# GoodieGraphics.js 🍰

**Make the Web 3D Delicious.**

GoodieGraphics.js is a high-level 3D graphics toolkit for the web, powered by Three.js. It adds a friendly API, procedural assets and reusable visual building blocks on top of a proven renderer.

> Early development: APIs may change while the project grows.

## Goals

- Create rich 3D experiences with a concise JavaScript API.
- Provide ready-to-use procedural models, not only primitive shapes.
- Offer reusable materials, effects and environment presets.
- Support desktop and mobile browsers.
- Keep access to the underlying Three.js scene and objects.

## Install

```bash
npm install goodiegraphics.js
```

For local repository development:

```bash
npm install
npm run dev
```

## Quick start

```js
import * as Goodie from "goodiegraphics.js";

const game = new Goodie.Game({
  container: document.querySelector("#app"),
  shadows: true
});

const world = new Goodie.World();
world.add(
  Goodie.Models.tree(),
  Goodie.Models.house(),
  Goodie.Models.crystal(),
  Goodie.Models.mushroom()
);
world.addGround();

game.setWorld(world);
game.start();
```

## Model library

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

All models return Three.js `Group` objects, so you can position, rotate, scale and combine them as usual.

## Core modules

- `Game`: renderer, camera, animation loop and resize handling.
- `World`: scene container, lighting and ground helper.
- `Models`: procedural 3D asset library.
- `Materials`: reusable material presets.

## Development

Three.js is the rendering foundation. GoodieGraphics.js focuses on a higher-level API, procedural assets and creator-friendly workflows rather than reimplementing a WebGL renderer.

## License

MIT. See [LICENSE](./LICENSE).
