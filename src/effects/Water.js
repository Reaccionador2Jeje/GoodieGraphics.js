import * as THREE from "three";

/** Animated stylized water surface. Call update(delta) from Game.onUpdate(). */
export class Water {
  constructor({
    width = 20,
    height = 20,
    color = "#35bde8",
    opacity = 0.82,
    waveSpeed = 1,
    waveScale = 0.16,
    segments = 48
  } = {}) {
    if (![width, height].every((value) => Number.isFinite(value) && value > 0)) throw new RangeError("Water width and height must be positive finite numbers.");
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new RangeError("Water opacity must be between 0 and 1.");
    if (!Number.isFinite(waveSpeed) || !Number.isFinite(waveScale)) throw new TypeError("Water wave settings must be finite numbers.");
    if (!Number.isFinite(segments) || segments < 1 || segments > 256) throw new RangeError("Water segments must be between 1 and 256.");
    this.time = 0;
    this.waveSpeed = waveSpeed;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height, segments, segments),
      new THREE.ShaderMaterial({
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uWaveScale: { value: waveScale }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uWaveScale;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            vUv = uv;
            vec3 p = position;
            float wave = sin(p.x * 1.4 + uTime * 1.3) * cos(p.y * 1.1 - uTime);
            wave += sin((p.x + p.y) * 0.8 + uTime * 0.7) * 0.45;
            p.z += wave * uWaveScale;
            vWave = wave;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            float shimmer = 0.5 + 0.5 * sin(vUv.x * 34.0 + vUv.y * 22.0 + uTime * 2.0);
            vec3 deep = uColor * 0.72;
            vec3 light = uColor * 1.18;
            vec3 color = mix(deep, light, clamp(0.35 + vWave * 0.22 + shimmer * 0.22, 0.0, 1.0));
            gl_FragColor = vec4(color, uOpacity);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `
      })
    );
    this.mesh.name = "GoodieWater";
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
  }

  update(delta) {
    if (Number.isFinite(delta) && delta > 0) {
      this.time += Math.min(delta, 0.05) * this.waveSpeed;
      this.mesh.material.uniforms.uTime.value = this.time;
    }
    return this;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
