import { AnimationBuilder } from "./AnimationBuilder.js";

/** Ready-to-use motion clips for procedural models and simple object rigs. */
export class AnimationPresets {
  static bob(target, { height = 0.25, duration = 1.8, name = "Bob" } = {}) {
    const base = target.position.clone();
    return new AnimationBuilder(target, { name, duration })
      .addVector3(target, "position",
        [0, duration / 2, duration],
        [base.x, base.y, base.z, base.x, base.y + height, base.z, base.x, base.y, base.z],
        { interpolation: "smooth" })
      .build();
  }

  static spin(target, { turns = 1, duration = 3, axis = "y", name = "Spin" } = {}) {
    if (!["x", "y", "z"].includes(axis)) throw new RangeError("Spin axis must be x, y or z.");
    const base = target.rotation.clone();
    const end = base[axis] + Math.PI * 2 * turns;
    const middle = (base[axis] + end) / 2;
    const values = [base.x, base.y, base.z, base.x, base.y, base.z, base.x, base.y, base.z];
    values[axis === "x" ? 0 : axis === "y" ? 1 : 2] = base[axis];
    values[3 + (axis === "x" ? 0 : axis === "y" ? 1 : 2)] = middle;
    values[6 + (axis === "x" ? 0 : axis === "y" ? 1 : 2)] = end;
    return new AnimationBuilder(target, { name, duration })
      .addVector3(target, "rotation", [0, duration / 2, duration], values, { interpolation: "linear" })
      .build();
  }

  static pulse(target, { amount = 0.12, duration = 1.2, name = "Pulse" } = {}) {
    const base = target.scale.clone();
    const peak = base.clone().multiplyScalar(1 + amount);
    return new AnimationBuilder(target, { name, duration })
      .addVector3(target, "scale", [0, duration / 2, duration],
        [...base.toArray(), ...peak.toArray(), ...base.toArray()], { interpolation: "smooth" })
      .build();
  }

  static sway(target, { angle = 0.16, duration = 2.4, axis = "z", name = "Sway" } = {}) {
    if (!["x", "y", "z"].includes(axis)) throw new RangeError("Sway axis must be x, y or z.");
    const base = target.rotation.clone();
    const right = base.clone();
    right[axis] += angle;
    return new AnimationBuilder(target, { name, duration })
      .addVector3(target, "rotation", [0, duration / 2, duration],
        [base.x, base.y, base.z, right.x, right.y, right.z, base.x, base.y, base.z], { interpolation: "smooth" })
      .build();
  }

  static idle(target, { height = 0.08, angle = 0.035, duration = 2.5, name = "Idle" } = {}) {
    const basePosition = target.position.clone();
    const baseRotation = target.rotation.clone();
    const builder = new AnimationBuilder(target, { name, duration });
    builder.addVector3(target, "position", [0, duration / 2, duration],
      [basePosition.x, basePosition.y, basePosition.z,
        basePosition.x, basePosition.y + height, basePosition.z,
        basePosition.x, basePosition.y, basePosition.z], { interpolation: "smooth" });
    builder.addVector3(target, "rotation", [0, duration / 2, duration],
      [baseRotation.x, baseRotation.y, baseRotation.z,
        baseRotation.x, baseRotation.y, baseRotation.z + angle,
        baseRotation.x, baseRotation.y, baseRotation.z], { interpolation: "smooth" });
    return builder.build();
  }
}
