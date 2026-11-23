import * as THREE from "three";

export const Materials = {
  grass: (options = {}) => new THREE.MeshStandardMaterial({ color: "#79a96b", roughness: 1, ...options }),
  wood: (options = {}) => new THREE.MeshStandardMaterial({ color: "#93613b", roughness: 0.88, ...options }),
  stone: (options = {}) => new THREE.MeshStandardMaterial({ color: "#9299a3", roughness: 0.92, ...options }),
  gold: (options = {}) => new THREE.MeshStandardMaterial({ color: "#f5bd45", metalness: 0.78, roughness: 0.24, ...options }),
  crystal: (options = {}) => new THREE.MeshPhysicalMaterial({
    color: "#75e5ff", metalness: 0.08, roughness: 0.08,
    transmission: 0.35, thickness: 0.8, transparent: true, opacity: 0.88,
    ...options
  }),
  glow: (color = "#8b5cf6", options = {}) => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.5, roughness: 0.35, ...options
  })
};
