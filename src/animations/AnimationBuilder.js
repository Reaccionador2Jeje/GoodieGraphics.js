import * as THREE from "three";

const INTERPOLATIONS = {
  linear: THREE.InterpolateLinear,
  smooth: THREE.InterpolateSmooth,
  discrete: THREE.InterpolateDiscrete
};

function validateFrames(times, values, stride, label) {
  if (!Array.isArray(times) || times.length < 2) {
    throw new TypeError(label + " needs at least two keyframe times.");
  }
  if (!Array.isArray(values) || values.length !== times.length * stride) {
    throw new TypeError(label + " values must contain " + stride + " value(s) per keyframe.");
  }
  for (let i = 0; i < times.length; i++) {
    if (!Number.isFinite(times[i]) || times[i] < 0 || (i > 0 && times[i] <= times[i - 1])) {
      throw new RangeError("Keyframe times must be finite, non-negative and strictly increasing.");
    }
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("Keyframe values must all be finite numbers.");
  }
}

function trackPath(root, target, property) {
  if (!target?.isObject3D || !root?.isObject3D) {
    throw new TypeError("Animation tracks need a Three.js Object3D root and target.");
  }
  let current = target;
  while (current && current !== root) current = current.parent;
  if (current !== root) {
    throw new RangeError("The animated target must be the root or one of its descendants.");
  }
  if (typeof property !== "string" || !property.trim() || property.includes(".")) {
    throw new TypeError("Use a single Three.js property name such as position, rotation or scale.");
  }
  return target === root ? "." + property : target.uuid + "." + property;
}

/**
 * Fluent builder for Three.js keyframe clips. The resulting clip can be played
 * by Animator and can target the root object or named descendants.
 */
export class AnimationBuilder {
  constructor(root, { name = "GoodieAnimation", duration = -1 } = {}) {
    if (!root?.isObject3D) throw new TypeError("AnimationBuilder expects a Three.js Object3D root.");
    this.root = root;
    this.name = name;
    this.duration = duration;
    this.tracks = [];
  }

  addVector3(target, property, times, values, { interpolation = "linear" } = {}) {
    validateFrames(times, values, 3, "Vector3 track");
    const mode = INTERPOLATIONS[interpolation];
    if (mode === undefined) throw new RangeError("Unknown interpolation: " + interpolation);
    const track = new THREE.VectorKeyframeTrack(trackPath(this.root, target, property), times, values);
    track.setInterpolation(mode);
    this.tracks.push(track);
    return this;
  }

  addNumber(target, property, times, values, { interpolation = "linear" } = {}) {
    validateFrames(times, values, 1, "Number track");
    const mode = INTERPOLATIONS[interpolation];
    if (mode === undefined) throw new RangeError("Unknown interpolation: " + interpolation);
    const track = new THREE.NumberKeyframeTrack(trackPath(this.root, target, property), times, values);
    track.setInterpolation(mode);
    this.tracks.push(track);
    return this;
  }

  addQuaternion(target, times, values, { interpolation = "linear" } = {}) {
    validateFrames(times, values, 4, "Quaternion track");
    const mode = INTERPOLATIONS[interpolation];
    if (mode === undefined) throw new RangeError("Unknown interpolation: " + interpolation);
    const track = new THREE.QuaternionKeyframeTrack(trackPath(this.root, target, "quaternion"), times, values);
    track.setInterpolation(mode);
    this.tracks.push(track);
    return this;
  }

  addColor(target, property, times, values, { interpolation = "linear" } = {}) {
    validateFrames(times, values, 3, "Color track");
    const mode = INTERPOLATIONS[interpolation];
    if (mode === undefined) throw new RangeError("Unknown interpolation: " + interpolation);
    const track = new THREE.ColorKeyframeTrack(trackPath(this.root, target, property), times, values);
    track.setInterpolation(mode);
    this.tracks.push(track);
    return this;
  }

  build() {
    if (!this.tracks.length) throw new Error("Cannot build an animation without tracks.");
    return new THREE.AnimationClip(this.name, this.duration, this.tracks);
  }
}
