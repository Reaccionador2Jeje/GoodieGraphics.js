import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

/** Load common 3D interchange formats into Three.js Object3D hierarchies. */
export class ModelLoader {
  static async gltf(url, { dracoLoader = null, meshoptDecoder = null, onProgress } = {}) {
    const loader = new GLTFLoader();
    if (dracoLoader) loader.setDRACOLoader(dracoLoader);
    if (meshoptDecoder) loader.setMeshoptDecoder(meshoptDecoder);
    const gltf = await loader.loadAsync(url, onProgress);
    gltf.scene.userData.goodieFormat = "gltf";
    gltf.scene.userData.animations = gltf.animations.map((clip) => clip.name);
    return gltf;
  }

  static async glb(url, options = {}) {
    return this.gltf(url, options);
  }

  static async obj(url, { onProgress } = {}) {
    const object = await new OBJLoader().loadAsync(url, onProgress);
    object.userData.goodieFormat = "obj";
    return object;
  }

  static async fbx(url, { onProgress } = {}) {
    const object = await new FBXLoader().loadAsync(url, onProgress);
    object.userData.goodieFormat = "fbx";
    return object;
  }

  static async load(url, { format, ...options } = {}) {
    const extension = (format || String(url).split("?")[0].split(".").pop()).toLowerCase();
    if (extension === "gltf" || extension === "glb") return this.gltf(url, options);
    if (extension === "obj") return this.obj(url, options);
    if (extension === "fbx") return this.fbx(url, options);
    throw new RangeError("Unsupported model format. Supported formats: glTF, GLB, OBJ and FBX.");
  }
}
