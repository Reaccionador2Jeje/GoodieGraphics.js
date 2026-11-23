import * as THREE from "three";

/**
 * Lightweight CPU particle emitter. Call update(delta) from Game.onUpdate().
 * Designed for modest particle counts on mobile browsers.
 */
export class ParticleEmitter {
  constructor({
    count = 120,
    color = "#ffffff",
    size = 0.16,
    lifetime = 1.8,
    speed = 1.4,
    spread = 1,
    gravity = -0.8,
    opacity = 0.9,
    loop = true,
    position = [0, 0, 0]
  } = {}) {
    if (!Number.isFinite(count) || count < 1 || count > 100000) throw new RangeError("Particle count must be between 1 and 100000.");
    if (!Number.isFinite(lifetime) || lifetime <= 0) throw new RangeError("Particle lifetime must be positive.");
    if (!Number.isFinite(speed) || speed < 0 || !Number.isFinite(spread) || spread < 0) throw new RangeError("Particle speed and spread must be non-negative finite numbers.");
    if (!Number.isFinite(gravity) || !Number.isFinite(size) || size <= 0 || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new RangeError("Particle gravity must be finite, size positive and opacity between 0 and 1.");
    if (!Array.isArray(position) || position.length !== 3 || position.some((value) => !Number.isFinite(value))) throw new TypeError("Particle position must be a finite [x, y, z] tuple.");
    this.count = Math.floor(count);
    this.lifetime = Math.max(0.05, lifetime);
    this.speed = speed;
    this.spread = spread;
    this.gravity = gravity;
    this.loop = loop;
    this.enabled = true;
    this._cursor = 0;
    this._ages = new Float32Array(this.count);
    this._velocities = new Float32Array(this.count * 3);
    this._positions = new Float32Array(this.count * 3);
    this._geometry = new THREE.BufferGeometry();
    this._geometry.setAttribute("position", new THREE.BufferAttribute(this._positions, 3));
    this._material = new THREE.PointsMaterial({
      color, size, transparent: true, opacity,
      depthWrite: false, blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.points = new THREE.Points(this._geometry, this._material);
    this.points.name = "GoodieParticles";
    this.points.position.set(...position);
    this._origin = new THREE.Vector3();
    this._scratch = new THREE.Vector3();
    this._spawnAll();
  }

  _spawn(index) {
    const i = index * 3;
    const angle = Math.random() * Math.PI * 2;
    this._positions[i] = (Math.random() - 0.5) * this.spread;
    this._positions[i + 1] = 0;
    this._positions[i + 2] = (Math.random() - 0.5) * this.spread;
    this._velocities[i] = Math.cos(angle) * this.speed * (0.25 + Math.random() * 0.75);
    this._velocities[i + 1] = this.speed * (0.35 + Math.random() * 0.8);
    this._velocities[i + 2] = Math.sin(angle) * this.speed * (0.25 + Math.random() * 0.75);
    this._ages[index] = Math.random() * this.lifetime;
  }

  _spawnAll() {
    for (let i = 0; i < this.count; i++) this._spawn(i);
    this._geometry.attributes.position.needsUpdate = true;
  }

  /** Emit a one-time burst of particles. */
  burst(amount = this.count) {
    const total = Math.min(this.count, Math.max(0, Math.floor(amount)));
    for (let n = 0; n < total; n++) {
      this._spawn(this._cursor);
      this._ages[this._cursor] = 0;
      this._cursor = (this._cursor + 1) % this.count;
    }
    this._geometry.attributes.position.needsUpdate = true;
    return this;
  }

  start() { this.enabled = true; return this; }
  stop() { this.enabled = false; return this; }

  update(delta) {
    if (!this.enabled || !Number.isFinite(delta) || delta <= 0) return this;
    const dt = Math.min(delta, 0.05);
    for (let p = 0; p < this.count; p++) {
      const i = p * 3;
      this._ages[p] += dt;
      if (this._ages[p] >= this.lifetime) {
        if (this.loop) this._spawn(p);
        else {
          this._positions[i + 1] = -100000;
          continue;
        }
      }
      this._velocities[i + 1] += this.gravity * dt;
      this._positions[i] += this._velocities[i] * dt;
      this._positions[i + 1] += this._velocities[i + 1] * dt;
      this._positions[i + 2] += this._velocities[i + 2] * dt;
    }
    this._geometry.attributes.position.needsUpdate = true;
    return this;
  }

  dispose() {
    this.points.removeFromParent();
    this._geometry.dispose();
    this._material.dispose();
  }
}
