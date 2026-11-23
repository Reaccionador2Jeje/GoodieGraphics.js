# Changelog

## Unreleased

### Added
- Interactive viewport transform gizmos for moving, rotating and scaling selected objects.
- W/E/R shortcuts for switching transform modes.
- Unsaved-scene protection when closing the desktop editor, opening another scene or creating a new scene.

## 1.0.0 — 2026-11-23

First stable public API release.

### Added
- GoodieShapes geometry toolkit with primitive, parametric, custom polyhedron, lathe, tube and extrusion geometry.
- ModelBuilder for assembling arbitrary Three.js objects into reusable custom models.
- ModelLoader support for glTF, GLB, OBJ and FBX assets.
- GoodieStudio geometry palette with sixteen general-purpose shapes alongside the procedural asset examples.
- Public TypeScript declarations for the main package API.
- GitHub Actions workflow for automated tests and production builds.

### Improved
- Game renderer sizing, update callback validation and idempotent disposal.
- World.add() validates all objects before mutating the scene.
- Terrain validates dimensions, density and query coordinates.
- ModelBuilder prevents cyclic scene graphs.
- GoodieStudio can duplicate custom geometry without sharing disposable mesh resources.
- Documentation, package metadata and license metadata aligned with the repository's BSD 3-Clause license.

### Compatibility
- Existing procedural Models, GoodieFX, GoodieWorld and GoodieAnimations APIs remain available.
- GoodieStudio remains browser-based. A desktop application is not part of this release.
