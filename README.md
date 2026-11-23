# GoodieGraphics.js 🍰

**Make the Web 3D Delicious.**

GoodieGraphics.js is a friendly, high-level 3D graphics toolkit for the web. It is built on top of Three.js and aims to make rich scenes, reusable 3D assets, materials and visual effects easier to create.

> Early development: APIs may change while the project grows.

## Goals

- A simple API for creating and running 3D experiences.
- Ready-to-use procedural models, not only primitive shapes.
- Reusable materials and visual effects.
- World and environment presets.
- Good performance on desktop and mobile browsers.
- Keep the flexibility of Three.js available when needed.

## Install

```bash
npm install goodiegraphics.js three
```

For local development before publishing:

```bash
npm install
npm run dev
```

## Quick start

```js
import * as Goodie from "goodiegraphics.js";

const game = new Goodie.Game({
  container: document.querySelector("#app"),
  background: "#b9ddff",
  shadows: true
});

const world = new Goodie.World();

world.add(
  Goodie.Models.tree(),
  Goodie.Models.crystal(),
  Goodie.Models.house()
);

game.setWorld(world);
game.start();
```

## Current modules

- `Game`: renderer, animation loop and resize handling.
- `World`: scene container with lighting and ground helpers.
- `Models`: procedural tree, crystal and house assets.
- `Materials`: reusable material presets.

## Development

The project currently uses Three.js as its rendering foundation. GoodieGraphics.js adds its own API and asset library on top; it does not attempt to reimplement a renderer.

## License

MIT. See [LICENSE](./LICENSE).
