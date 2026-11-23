# GoodieGraphics.js 🍰

**Make the Web 3D Delicious.**

GoodieGraphics.js is a high-level 3D graphics toolkit for the web, powered by Three.js. It provides a general-purpose geometry library, a custom model builder, 3D asset import, procedural examples, reusable real-time effects, animation tools and seeded world generation.

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
const terrain = new Goodie.Terrain({ biome: "forest", seed: 42 });

world.add(terrain.mesh, Goodie.Models.tree());
const cycle = new Goodie.DayNightCycle(world);
game.setWorld(world);
game.onUpdate((delta) => cycle.update(delta));
game.start();
```

## GoodieWorld: procedural terrain

Create a seeded terrain with biome colors and query its elevation.

```js
const terrain = new Goodie.Terrain({
  width: 100,
  depth: 100,
  segments: 120,
  seed: 42,
  biome: "forest",
  amplitude: 5,
  frequency: 0.035
});

world.add(terrain.mesh);
const tree = Goodie.Models.tree();
tree.position.set(8, terrain.getHeightAt(8, -4), -4);
world.add(tree);
```

Available biomes: `meadow`, `forest`, `desert`, `snow`, `volcanic`.

Use the same seed and settings to reproduce the same terrain. Increase `segments` for more detail; lower it for better performance on phones. Call `terrain.dispose()` when removing the terrain permanently.

## Day/night cycle

```js
const dayNight = new Goodie.DayNightCycle(world, {
  duration: 180, // seconds for a full cycle
  startAt: 0.5   // 0 = midnight, 0.5 = midday
});

game.onUpdate((delta) => dayNight.update(delta));
dayNight.setTime(0.75); // sunset
dayNight.pause();
dayNight.resume();
```

The cycle updates sunlight, hemisphere lighting, sky background and fog color.

## Create any 3D model: GoodieShapes + ModelBuilder

The ten `Models.*` assets are optional ready-made examples. Build original objects from geometry primitives, custom extrusions, lathed profiles, tubes, polyhedra and imported assets.

### Geometry library

`GoodieShapes` includes: `box`, `plane`, `circle`, `ring`, `sphere`, `ellipsoid`, `capsule`, `cylinder`, `cone`, `pyramid`, `torus`, `torusKnot`, `dodecahedron`, `icosahedron`, `octahedron`, `tetrahedron`, `polyhedron`, `lathe`, `tube`, `extrude`, `shape`, `wireframe` and `fromGeometry`.

```js
const body = Goodie.GoodieShapes.box({ width: 2, height: 3, depth: 1, color: "#55aaff" });
const detail = Goodie.GoodieShapes.torus({ radius: 0.6, tube: 0.12, color: "#ffcc55" });
```

### Assemble a completely custom model

```js
const builder = new Goodie.ModelBuilder({ name: "MyRobot" });
builder.box({ width: 1.2, height: 1.5, depth: 0.8, color: "#718096" }, { name: "Body", position: [0, 1.5, 0] });
builder.sphere({ radius: 0.65, color: "#9bdcff" }, { name: "Head", position: [0, 2.7, 0] });
builder.cylinder({ radiusTop: 0.12, radiusBottom: 0.16, height: 1.1, color: "#303846" }, { position: [-0.8, 0.5, 0] });
builder.torus({ radius: 0.3, tube: 0.08, color: "#ffcc55" }, { position: [0, 1.7, 0.5] });
const robot = builder.build();
world.add(robot);
```

### Import existing 3D assets

```js
const gltf = await Goodie.ModelLoader.gltf("/models/character.glb");
world.add(gltf.scene);
const animator = Goodie.Animator.fromGLTF(gltf);
if (gltf.animations.length) animator.play(gltf.animations[0].name);

const obj = await Goodie.ModelLoader.obj("/models/prop.obj");
world.add(obj);
```

Supported import formats: glTF, GLB, OBJ and FBX. Loading remote files requires the host to permit the request (CORS).
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

## GoodieFX effects

### ParticleEmitter

```js
const dust = new Goodie.ParticleEmitter({
  count: 120, color: "#fff0b5", size: 0.14,
  lifetime: 2, speed: 1.2, spread: 1.5, gravity: -0.7
});
world.add(dust.points);
game.onUpdate((delta) => dust.update(delta));
dust.burst(40);
dust.dispose();
```

### Water

```js
const lake = new Goodie.Water({ width: 18, height: 12, color: "#35bde8" });
world.add(lake.mesh);
game.onUpdate((delta) => lake.update(delta));
```

### Glow

```js
const aura = new Goodie.Glow({ color: "#8be9ff", size: 2, opacity: 0.7 });
world.add(aura.sprite);
aura.setColor("#ffc4ed");
aura.dispose();
```

Dispose effects when removing them permanently to release GPU resources.

## Core modules

- `Game`: renderer, camera, animation loop and resize handling.
- `World`: scene container, lighting and ground helper.
- `Terrain`: seeded procedural terrain and biome palettes.
- `DayNightCycle`: dynamic sun, ambient light, sky and fog.
- `Models`: procedural 3D asset library.
- `Animator`, `AnimationBuilder`, `AnimationPresets`: GoodieAnimations keyframes, playback and motion presets.
- `Materials`: reusable material presets.
- `ParticleEmitter`, `Water`, `Glow`: GoodieFX real-time effects.

## Scripts

- `npm run dev`: start the Vite showcase.
- `npm run build`: create a production build.
- `npm test`: run the Node.js test suite.

## License

MIT. See [LICENSE](./LICENSE).

## GoodieAnimations: professional 3D motion

Animate any Three.js object hierarchy with keyframe clips, quaternion tracks, reusable motion presets, playback controls and cross-fades.

### Quick animation

```js
const character = Goodie.Models.tree();
world.add(character);
const animator = new Goodie.Animator(character, {
  clips: [Goodie.AnimationPresets.idle(character), Goodie.AnimationPresets.sway(character)]
});
animator.play("Idle");
game.onUpdate((delta) => animator.update(delta));

// Blend to another animation without a hard cut.
animator.crossFadeTo("Sway", { duration: 0.4 });
animator.dispose();
```

GLTFLoader results are supported directly with `Animator.fromGLTF(gltf)`, so imported skeletal clips can be played alongside clips built in code.

### Build custom keyframe clips

```js
const jump = new Goodie.AnimationBuilder(character, { name: "Jump", duration: 0.8 })
  .addVector3(character, "position", [0, 0.4, 0.8], [0, 0, 0, 0, 1.8, 0, 0, 0, 0], { interpolation: "smooth" })
  .build();
const animator = new Goodie.Animator(character, { clips: [jump] });
animator.play("Jump", { loop: Goodie.LoopOnce, repetitions: 1, clampWhenFinished: true });
```
## GoodieStudio: visual world editor

Open the visual editor at [`/studio.html`](./studio.html) after starting the development server:

```bash
npm install
npm run dev
```

Then visit `http://localhost:5173/studio.html`. GoodieStudio is a browser-based scene builder designed for mouse, touch and smaller screens.

### Editor features

- Add the ten procedural assets from the GoodieModels library.
- Select objects from the viewport or scene hierarchy.
- Edit position, rotation and scale in the inspector.
- Duplicate and delete objects.
- Generate seeded terrain across all five GoodieWorld biomes.
- Export a scene to a `.goodie.json` file and import it later.

The scene format stores asset type, transforms, scene name and terrain settings. Imported files are validated before their contents are added. GoodieStudio is an early editor: it currently focuses on procedural assets and transforms rather than arbitrary mesh or material authoring.
