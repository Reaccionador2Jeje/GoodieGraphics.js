import * as THREE from "three";

const material = (value = "#d9dce5") => {
  if (value?.isMaterial) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new THREE.MeshStandardMaterial({ color: value, roughness: 0.72, metalness: 0.05 });
  }
  return new THREE.MeshStandardMaterial({ ...value });
};

function mesh(geometry, options = {}) {
  const result = new THREE.Mesh(geometry, material(options.material ?? options.color));
  result.name = options.name ?? "GoodieMesh";
  if (options.position) result.position.set(...options.position);
  if (options.rotation) result.rotation.set(...options.rotation);
  if (options.scale) result.scale.set(...options.scale);
  result.castShadow = options.castShadow ?? true;
  result.receiveShadow = options.receiveShadow ?? true;
  return result;
}

/**
 * General-purpose geometry factory. Every method returns a normal Three.js Mesh,
 * so the result can be edited, grouped, animated and combined freely.
 */
export class GoodieShapes {
  static box({ width = 1, height = 1, depth = 1, ...o } = {}) {
    return mesh(new THREE.BoxGeometry(width, height, depth), o);
  }
  static plane({ width = 1, height = 1, segmentsX = 1, segmentsY = 1, ...o } = {}) {
    return mesh(new THREE.PlaneGeometry(width, height, segmentsX, segmentsY), o);
  }
  static circle({ radius = 1, segments = 32, ...o } = {}) {
    return mesh(new THREE.CircleGeometry(radius, segments), o);
  }
  static ring({ innerRadius = 0.5, outerRadius = 1, segments = 32, ...o } = {}) {
    return mesh(new THREE.RingGeometry(innerRadius, outerRadius, segments), o);
  }
  static sphere({ radius = 1, widthSegments = 32, heightSegments = 20, ...o } = {}) {
    return mesh(new THREE.SphereGeometry(radius, widthSegments, heightSegments), o);
  }
  static ellipsoid({ radiusX = 1, radiusY = 1.5, radiusZ = 1, ...o } = {}) {
    const result = mesh(new THREE.SphereGeometry(1, o.widthSegments ?? 32, o.heightSegments ?? 20), o);
    result.scale.set(radiusX, radiusY, radiusZ);
    return result;
  }
  static capsule({ radius = 0.5, length = 1, capSegments = 4, radialSegments = 8, ...o } = {}) {
    return mesh(new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments), o);
  }
  static cylinder({ radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 32, ...o } = {}) {
    return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), o);
  }
  static cone({ radius = 1, height = 2, radialSegments = 32, ...o } = {}) {
    return mesh(new THREE.ConeGeometry(radius, height, radialSegments), o);
  }
  static pyramid({ radius = 1, height = 1.5, sides = 4, ...o } = {}) {
    return mesh(new THREE.ConeGeometry(radius, height, sides), o);
  }
  static torus({ radius = 1, tube = 0.25, radialSegments = 16, tubularSegments = 64, ...o } = {}) {
    return mesh(new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments), o);
  }
  static torusKnot({ radius = 1, tube = 0.25, tubularSegments = 128, radialSegments = 16, p = 2, q = 3, ...o } = {}) {
    return mesh(new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q), o);
  }
  static dodecahedron({ radius = 1, detail = 0, ...o } = {}) {
    return mesh(new THREE.DodecahedronGeometry(radius, detail), o);
  }
  static icosahedron({ radius = 1, detail = 0, ...o } = {}) {
    return mesh(new THREE.IcosahedronGeometry(radius, detail), o);
  }
  static octahedron({ radius = 1, detail = 0, ...o } = {}) {
    return mesh(new THREE.OctahedronGeometry(radius, detail), o);
  }
  static tetrahedron({ radius = 1, detail = 0, ...o } = {}) {
    return mesh(new THREE.TetrahedronGeometry(radius, detail), o);
  }
  static polyhedron({ vertices, indices, radius = 1, detail = 0, ...o } = {}) {
    if (!Array.isArray(vertices) || !Array.isArray(indices) || vertices.length < 9 || indices.length < 3) {
      throw new TypeError("polyhedron() requires vertex coordinates and triangle indices.");
    }
    return mesh(new THREE.PolyhedronGeometry(vertices, indices, radius, detail), o);
  }
  static lathe({ points, segments = 32, ...o } = {}) {
    if (!Array.isArray(points) || points.length < 2) throw new TypeError("lathe() needs at least two [x, y] points.");
    return mesh(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments), o);
  }
  static tube({ points, radius = 0.1, tubularSegments = 64, radialSegments = 8, closed = false, ...o } = {}) {
    if (!Array.isArray(points) || points.length < 2) throw new TypeError("tube() needs at least two 3D points.");
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
    return mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed), o);
  }
  static extrude({ shape, depth = 0.25, bevelEnabled = true, bevelThickness = 0.08, bevelSize = 0.05, bevelSegments = 2, ...o } = {}) {
    if (!(shape instanceof THREE.Shape) && !(shape?.isShape === true)) {
      throw new TypeError("extrude() expects a THREE.Shape created by GoodieShapes.shape() or THREE.Shape.");
    }
    return mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled, bevelThickness, bevelSize, bevelSegments, curveSegments: 12 }), o);
  }
  static shape({ points, ...o } = {}) {
    if (!Array.isArray(points) || points.length < 3) throw new TypeError("shape() needs at least three [x, y] points.");
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (const point of points.slice(1)) shape.lineTo(point[0], point[1]);
    shape.closePath();
    return shape;
  }
  static wireframe({ geometry, color = "#b8d8ff", ...o } = {}) {
    if (!geometry?.isBufferGeometry) throw new TypeError("wireframe() expects a BufferGeometry.");
    const edges = new THREE.EdgesGeometry(geometry);
    const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
    lines.name = o.name ?? "GoodieWireframe";
    if (o.position) lines.position.set(...o.position);
    if (o.rotation) lines.rotation.set(...o.rotation);
    if (o.scale) lines.scale.set(...o.scale);
    return lines;
  }
  static fromGeometry(geometry, options = {}) {
    if (!geometry?.isBufferGeometry) throw new TypeError("fromGeometry() expects a BufferGeometry.");
    return mesh(geometry, options);
  }
  static material(options) { return material(options); }
}

/** Short alias for the general-purpose shape factory. */
export const Shapes = GoodieShapes;
