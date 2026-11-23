import * as THREE from "three";

/**
 * Stylized materials that extend Three.js physically based shading without
 * replacing GoodieGraphics' lighting, tone mapping, or shadow pipeline.
 */
export const GoodieShaders = {
  /**
   * A softly stylized voxel surface: subtle world-space grain, brighter upward
   * faces, and restrained edge lighting. Keeps MeshStandardMaterial shadows.
   */
  voxel({
    color = "#79a96b",
    roughness = 0.92,
    metalness = 0,
    grain = 0.035,
    topLight = 0.12,
    edgeLight = 0.08,
    emissive = "#000000",
    emissiveIntensity = 0,
    ...options
  } = {}) {
    const material = new THREE.MeshStandardMaterial({
      color, roughness, metalness, emissive, emissiveIntensity, ...options
    });
    material.name = "GoodieVoxelShader";
    material.userData.goodieShader = "voxel";
    material.userData.goodieShaderOptions = { grain, topLight, edgeLight };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.goodieGrain = { value: grain };
      shader.uniforms.goodieTopLight = { value: topLight };
      shader.uniforms.goodieEdgeLight = { value: edgeLight };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vGoodieWorldPos;\nvarying vec3 vGoodieWorldNormal;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvGoodieWorldPos = worldPosition.xyz;\nvGoodieWorldNormal = normalize(mat3(modelMatrix) * objectNormal);");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float goodieGrain;\nuniform float goodieTopLight;\nuniform float goodieEdgeLight;\nvarying vec3 vGoodieWorldPos;\nvarying vec3 vGoodieWorldNormal;\nfloat goodieHash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float goodieTop = pow(max(vGoodieWorldNormal.y, 0.0), 2.0);
          float goodieEdge = pow(1.0 - abs(normalize(vGoodieWorldNormal).y), 3.0);
          float goodieNoise = goodieHash(floor(vGoodieWorldPos * 5.0)) - 0.5;
          diffuseColor.rgb *= 1.0 + goodieNoise * goodieGrain;
          diffuseColor.rgb *= 1.0 + goodieTop * goodieTopLight;
          diffuseColor.rgb += goodieEdge * goodieEdgeLight;
        `);
    };
    material.customProgramCacheKey = () => "goodie-voxel-shader-v1";
    return material;
  }
};
