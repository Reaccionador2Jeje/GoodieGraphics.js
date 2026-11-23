import * as THREE from "three";

/** Smooth day/night lighting controller for a GoodieGraphics World. */
export class DayNightCycle {
  constructor(world, { duration = 180, startAt = 0.5, dayIntensity = 2.2, nightIntensity = 0.12 } = {}) {
    if (!world?.scene?.isScene || !world.sun || !world.ambientLight) {
      throw new TypeError("DayNightCycle expects a GoodieGraphics World.");
    }
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(startAt)) throw new RangeError("Day/night duration must be positive and startAt must be finite.");
    if (!Number.isFinite(dayIntensity) || !Number.isFinite(nightIntensity) || dayIntensity < 0 || nightIntensity < 0) throw new RangeError("Light intensities must be non-negative finite numbers.");
    this.world = world;
    this.duration = Math.max(10, duration);
    this.time = THREE.MathUtils.euclideanModulo(startAt, 1);
    this.dayIntensity = dayIntensity;
    this.nightIntensity = nightIntensity;
    this.enabled = true;
    this._dayColor = new THREE.Color("#b9ddff");
    this._sunsetColor = new THREE.Color("#f2a06b");
    this._nightColor = new THREE.Color("#101a3d");
    this._skyColor = new THREE.Color();
    this.update(0);
  }

  update(delta) {
    if (this.enabled && Number.isFinite(delta) && delta > 0) {
      this.time = (this.time + delta / this.duration) % 1;
    }

    const angle = this.time * Math.PI * 2 - Math.PI / 2;
    const daylight = THREE.MathUtils.clamp((Math.sin(angle) + 0.12) / 0.72, 0, 1);
    const sunset = Math.pow(1 - Math.min(1, Math.abs(Math.sin(angle))), 5);
    const sun = this.world.sun;
    sun.position.set(Math.cos(angle) * 35, Math.sin(angle) * 35, 12);
    sun.intensity = THREE.MathUtils.lerp(this.nightIntensity, this.dayIntensity, daylight);
    sun.color.copy(this._dayColor).lerp(this._sunsetColor, sunset * 0.72);
    this.world.ambientLight.intensity = THREE.MathUtils.lerp(0.28, 1.55, daylight);

    this._skyColor.copy(this._nightColor).lerp(this._dayColor, daylight).lerp(this._sunsetColor, sunset * 0.35);
    if (this.world.scene.background?.isColor) this.world.scene.background.copy(this._skyColor);
    if (this.world.scene.fog?.color) this.world.scene.fog.color.copy(this._skyColor);

    return this;
  }

  setTime(value) {
    this.time = THREE.MathUtils.euclideanModulo(value, 1);
    return this.update(0);
  }

  pause() { this.enabled = false; return this; }
  resume() { this.enabled = true; return this; }
}
