import * as THREE from "three";

/** A scene container with useful defaults for building a 3D world. */
export class World {
  constructor({ background = "#b9ddff", fog = null } = {}) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(background);
    if (fog) this.scene.fog = new THREE.Fog(fog.color ?? background, fog.near ?? 20, fog.far ?? 100);
    this.scene.name = "GoodieWorld";
    this.objects = new Set();

    this.ambientLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.6);
    this.ambientLight.name = "GoodieAmbientLight";
    this.scene.add(this.ambientLight);

    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.name = "GoodieSun";
    this.sun.position.set(8, 14, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sun);
  }

  add(...objects) {
    const items = objects.flat();
    if (items.some((object) => !object?.isObject3D)) {
      throw new TypeError("World.add() expects Three.js Object3D instances.");
    }
    for (const object of items) {
      this.scene.add(object);
      this.objects.add(object);
    }
    return this;
  }

  remove(object) {
    if (!object?.isObject3D) return this;
    object.removeFromParent();
    this.objects.delete(object);
    return this;
  }

  setBackground(color) {
    this.scene.background = new THREE.Color(color);
    return this;
  }

  addGround({ size = 100, color = "#79a96b", y = 0 } = {}) {
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(y)) {
      throw new RangeError("Ground size must be positive and y must be finite.");
    }
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1 });
    const ground = new THREE.Mesh(geometry, material);
    ground.name = "GoodieGround";
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = y;
    ground.receiveShadow = true;
    this.add(ground);
    return ground;
  }
}
