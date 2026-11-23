import * as THREE from "three";

/** Camera-facing soft glow sprite, useful for lamps, crystals and magic props. */
export class Glow {
  constructor({ color = "#8be9ff", size = 2, opacity = 0.7, position = [0, 1, 0] } = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 62);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    this.texture = new THREE.CanvasTexture(canvas);
    this.material = new THREE.SpriteMaterial({
      map: this.texture, color: 0xffffff, transparent: true,
      opacity, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.name = "GoodieGlow";
    this.sprite.position.set(...position);
    this.sprite.scale.set(size, size, 1);
  }

  setColor(color) {
    const canvas = this.texture.image;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 62);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    this.texture.needsUpdate = true;
    return this;
  }

  dispose() {
    this.sprite.removeFromParent();
    this.texture.dispose();
    this.material.dispose();
  }
}
