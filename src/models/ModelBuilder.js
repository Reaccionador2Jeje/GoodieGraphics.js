import * as THREE from "three";
import { GoodieShapes } from "./Geometry.js";

/** Fluent builder for assembling reusable custom 3D models from any geometry. */
export class ModelBuilder {
  constructor({ name = "GoodieCustomModel", position = [0, 0, 0] } = {}) {
    this.root = new THREE.Group();
    this.root.name = name;
    this.root.position.set(...position);
  }

  add(object, { name, position, rotation, scale, parent = this.root } = {}) {
    if (!object?.isObject3D || object === this.root) throw new TypeError("ModelBuilder.add() expects a Three.js Object3D other than its own root.");
    if (!parent?.isObject3D || (parent !== this.root && !this.root.getObjectById(parent.id))) {
      throw new TypeError("Parent must belong to this model.");
    }
    if (name) object.name = name;
    if (position) object.position.set(...position);
    if (rotation) object.rotation.set(...rotation);
    if (scale) object.scale.set(...scale);
    for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor === object) throw new RangeError("Adding this object would create a scene graph cycle.");
    }
    object.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    parent.add(object);
    return object;
  }

  shape(factory, options = {}, transform = {}) {
    if (typeof factory !== "function") throw new TypeError("shape() expects a GoodieShapes factory function.");
    return this.add(factory(options), transform);
  }

  group(name, transform = {}) {
    const group = new THREE.Group();
    group.name = name;
    return this.add(group, transform);
  }

  box(options = {}, transform = {}) { return this.shape(GoodieShapes.box, options, transform); }
  sphere(options = {}, transform = {}) { return this.shape(GoodieShapes.sphere, options, transform); }
  cylinder(options = {}, transform = {}) { return this.shape(GoodieShapes.cylinder, options, transform); }
  cone(options = {}, transform = {}) { return this.shape(GoodieShapes.cone, options, transform); }
  torus(options = {}, transform = {}) { return this.shape(GoodieShapes.torus, options, transform); }
  tube(options = {}, transform = {}) { return this.shape(GoodieShapes.tube, options, transform); }
  extrude(options = {}, transform = {}) { return this.shape(GoodieShapes.extrude, options, transform); }

  build() {
    this.root.updateMatrixWorld(true);
    return this.root;
  }

  static from(object, { clone = true, name = "GoodieImportedModel" } = {}) {
    if (!object?.isObject3D) throw new TypeError("ModelBuilder.from() expects an Object3D.");
    const builder = new ModelBuilder({ name });
    if (object.children.length) {
      builder.root.position.copy(object.position);
      builder.root.quaternion.copy(object.quaternion);
      builder.root.scale.copy(object.scale);

      // Import direct children to preserve the original top-level hierarchy.
      for (const child of object.children) {
        builder.root.add(clone ? child.clone(true) : child);
      }
    } else {
      // A leaf object keeps its own transform inside the imported root.
      builder.root.add(clone ? object.clone(true) : object);
    }
    return builder;
  }
}
