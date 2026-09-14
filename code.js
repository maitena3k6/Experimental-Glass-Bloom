import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

///
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5, // strength
  0.4, // radius
  0.85, // threshold
);
composer.addPass(bloomPass);

const filmPass = new FilmPass(0.35, 0.025, 648, false);
composer.addPass(filmPass);
///
const cellsMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff, // Base color of the glass
  roughness: 0.1, // Low roughness for a smooth, glossy surface
  metalness: 0.0, // Glass is non-metallic
  transparent: true, // Required for blending
  opacity: 0.75, // Kept at 1.0 because 'transmission' handles internal transparency

  // Core Glass Properties
  transmission: 1.0, // 1.0 makes the fill completely translucent
  ior: 1.5, // Index of Refraction (1.5 is standard for generic glass)
  thickness: 0.5, // Simulates a solid volume rather than an infinitely thin shell

  // Optional Reflection Layer
  clearcoat: 1.0, // Adds a secondary glossy layer on top
  clearcoatRoughness: 0.05, // Roughness of the clearcoat layer
});

const circleMaterial = new THREE.MeshStandardMaterial({
  color: 0xff8800,
  emissive: new THREE.Color().setHex(0xff8800),
  emissiveIntensity: 2.0,
});

const lightSphereMaterial = new THREE.MeshStandardMaterial({
  color: 0xadd8e6,
  emissive: new THREE.Color().setHex(0xadd8e6),
  emissiveIntensity: 2,
});

const loader = new GLTFLoader();

let fragmentos = [];

loader.load("./icoesphere-monster-ball.glb", function (gltf) {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name.includes("circle")) {
        child.material = circleMaterial;
      } else if (child.name.includes("light_sphere")) {
        child.material = lightSphereMaterial;
      } else {
        child.material = cellsMaterial;
      }
      // Guardamos la referencia directa al fragmento
      fragmentos.push(child);
    }
  });

  scene.add(gltf.scene);
});

function animate(t) {
  const time = t * 0.005;

  const amplitude = 0.009; // Amplitud del temblor eléctrico

  for (let i = 0; i < fragmentos.length; i++) {
    const frag = fragmentos[i];

    if (frag.name.includes("circle")) {
      frag.rotation.x = time * 0.05 + frag.id;
      frag.rotation.y = time * 0.15 + frag.id;
      frag.rotation.z = time * 0.25 + frag.id;
    } else if (frag.name.includes("light_sphere")) {
      const sphereScale = Math.sin(time * 0.05) / 2;
      frag.scale.set(sphereScale, sphereScale, sphereScale);
    } else {
      const noiseX = Math.sin(time * (Math.random() * 2 - 1) * 30 + frag.id);
      const noiseY = Math.cos(time * (Math.random() * 2 - 1) * 30 + frag.id);

      frag.scale.set(6, 6, 6);
      frag.position.x += noiseX * amplitude;
      frag.position.y += noiseY * amplitude;
    }
  }

  renderer.render(scene, camera);
  composer.render();
}

renderer.setAnimationLoop(animate);

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // 1. Reajustar la cámara para que no se deformen las proporciones
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // Muy importante avisarle a Three.js que la cámara cambió

  // 2. Reajustar el tamaño del canvas de renderizado
  renderer.setSize(width, height);

  // 3. (Opcional) Ajustar la densidad de píxeles para pantallas Retina/High-DPI
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Escuchar cuando el usuario cambia el tamaño de la ventana
window.addEventListener("resize", onWindowResize);

document.body.appendChild(renderer.domElement);
