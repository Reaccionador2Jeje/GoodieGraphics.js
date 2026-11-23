import * as THREE from "three";

/** Manages clips, playback, blending and timing for one Object3D hierarchy. */
export class Animator {
  constructor(root, { clips = [] } = {}) {
    if (!root?.isObject3D) throw new TypeError("Animator expects a Three.js Object3D root.");
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.clips = new Map();
    this.actions = new Map();
    this.activeAction = null;
    this.disposed = false;
    for (const clip of clips) this.add(clip);
  }

  add(clip) {
    if (this.disposed) throw new Error("This Animator has been disposed.");
    if (!clip?.isAnimationClip) throw new TypeError("Animator.add() expects a Three.js AnimationClip.");
    if (this.clips.has(clip.name)) throw new Error('An animation named "' + clip.name + '" already exists.');
    this.clips.set(clip.name, clip);
    this.actions.set(clip.name, this.mixer.clipAction(clip));
    return this;
  }

  getAction(name) {
    const action = this.actions.get(name);
    if (!action) throw new RangeError('Animation "' + name + '" was not found.');
    return action;
  }

  play(name, {
    loop = THREE.LoopRepeat,
    repetitions = Infinity,
    timeScale = 1,
    weight = 1,
    fadeIn = 0,
    clampWhenFinished = false,
    startAt = 0
  } = {}) {
    const action = this.getAction(name);
    if (!Number.isFinite(timeScale) || !Number.isFinite(weight) || !Number.isFinite(startAt)) {
      throw new TypeError("timeScale, weight and startAt must be finite numbers.");
    }
    action.reset();
    action.enabled = true;
    action.clampWhenFinished = clampWhenFinished;
    action.setLoop(loop, repetitions);
    action.setEffectiveTimeScale(timeScale);
    action.setEffectiveWeight(THREE.MathUtils.clamp(weight, 0, 1));
    action.time = Math.max(0, startAt);
    if (fadeIn > 0) action.fadeIn(fadeIn);
    action.play();
    this.activeAction = action;
    return action;
  }

  crossFadeTo(name, { duration = 0.35, ...options } = {}) {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError("Cross-fade duration must be a non-negative number.");
    }
    const previous = this.activeAction;
    const next = this.play(name, { ...options, fadeIn: 0 });
    if (previous && previous !== next) previous.crossFadeTo(next, duration, false);
    else if (duration > 0) next.fadeIn(duration);
    return next;
  }

  update(deltaSeconds) {
    if (this.disposed) return this;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError("Animator.update() expects a non-negative time delta.");
    }
    this.mixer.update(deltaSeconds);
    return this;
  }

  pause() {
    if (this.activeAction) this.activeAction.paused = true;
    return this;
  }

  resume() {
    if (this.activeAction) this.activeAction.paused = false;
    return this;
  }

  stop(name = null) {
    if (name) {
      this.getAction(name).stop();
      if (this.activeAction === this.actions.get(name)) this.activeAction = null;
    } else {
      this.mixer.stopAllAction();
      this.activeAction = null;
    }
    return this;
  }

  setTimeScale(value) {
    if (!Number.isFinite(value)) throw new TypeError("Time scale must be a finite number.");
    this.mixer.timeScale = value;
    return this;
  }

  setWeight(name, value) {
    if (!Number.isFinite(value)) throw new TypeError("Animation weight must be a finite number.");
    this.getAction(name).setEffectiveWeight(THREE.MathUtils.clamp(value, 0, 1));
    return this;
  }

  dispose() {
    if (this.disposed) return;
    this.stop();
    this.mixer.uncacheRoot(this.root);
    this.actions.clear();
    this.clips.clear();
    this.disposed = true;
  }
}

export { LoopOnce, LoopRepeat, LoopPingPong } from "three";
