import * as THREE from "three";

/** Owns the renderer, camera and animation loop. */
export class Game {
  constructor({
    container = document.body,
    width,
    height,
    background = "#b9ddff",
    shadows = true,
    antialias = true,
    pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2),
    camera = {}
  } = {}) {
    if (!container?.appendChild) throw new TypeError("Game requires a DOM container element.");
    if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) throw new RangeError("pixelRatio must be a positive finite number.");
    this.container = container;
    this.disposed = false;
    this.renderer = new THREE.WebGLRenderer({ antialias, alpha: false });
    this.renderer.setPixelRatio(pixelRatio);
    const viewWidth = Math.max(1, width ?? (container.clientWidth || window.innerWidth));
    const viewHeight = Math.max(1, height ?? (container.clientHeight || window.innerHeight));
    this.renderer.setSize(viewWidth, viewHeight);
    this.renderer.shadowMap.enabled = shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setClearColor(background);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      camera.fov ?? 60,
      viewWidth / viewHeight,
      camera.near ?? 0.1,
      camera.far ?? 1000
    );
    this.camera.position.set(...(camera.position ?? [8, 7, 10]));
    this.camera.lookAt(...(camera.lookAt ?? [0, 1, 0]));

    this.world = null;
    this.running = false;
    this._frame = this._frame.bind(this);
    this._resize = this._resize.bind(this);
    this._lastTime = 0;
    this._onUpdate = null;
  }

  setWorld(world) {
    if (this.disposed) throw new Error("This Game has been disposed.");
    if (!world?.scene?.isScene) throw new TypeError("Game.setWorld() expects a GoodieGraphics World.");
    this.world = world;
    return this;
  }

  onUpdate(callback) {
    if (callback !== null && typeof callback !== "function") throw new TypeError("onUpdate() expects a function or null.");
    this._onUpdate = callback;
    return this;
  }

  start() {
    if (this.disposed) throw new Error("This Game has been disposed.");
    if (this.running) return this;
    this.running = true;
    this._lastTime = performance.now();
    window.addEventListener("resize", this._resize);
    this.renderer.setAnimationLoop(this._frame);
    return this;
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this._resize);
    return this;
  }

  _frame(time) {
    if (!this.running || !this.world) return;
    const delta = Math.min((time - this._lastTime) / 1000, 0.05);
    this._lastTime = time;
    this._onUpdate?.(delta, time / 1000);
    this.renderer.render(this.world.scene, this.camera);
  }

  _resize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this._onUpdate = null;
    this.world = null;
    this.disposed = true;
  }
}
