import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// console.log(OrbitControls);

const size = 512;

const canvas = document.getElementById("canvas");
canvas.width = canvas.height = size;
console.log(canvas);
const dpr = window.devicePixelRatio / window.devicePixelRatio;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setPixelRatio(dpr);
renderer.autoClear = false;

const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));

const camera = new THREE.PerspectiveCamera(40, 1 / 1, 0.01, 300);
camera.position.set(2, 9, 9);
const look_at = new THREE.Vector3(0, 3, 0);
const light_dir = new THREE.Vector3(-1, 1, -2).normalize();

const stats = new Stats();
document.getElementById("container").appendChild(stats.dom);

const controls = {
  shadow: true,
  balloon: 50,
};
const gui = new GUI();
gui.add(controls, "shadow");
gui.add(controls, "balloon", 0, 100, 1);

const orbit = new OrbitControls(camera, canvas);
orbit.target.copy(look_at);
orbit.minDistance = 5;
orbit.maxDistance = 15;
orbit.minPolarAngle = 0.1;
orbit.maxPolarAngle = 2.7;
orbit.update();

const textureloader = new THREE.TextureLoader();

const environment = textureloader.load("./src/studio.jpg", function (texture) {
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
});

const environment_blur = textureloader.load(
  "./src/studio-blur.jpg",
  function (texture) {
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }
);

const ortho = new THREE.OrthographicCamera(0, 1, 1, -1, -1, 1);
const scene = new THREE.Scene();
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  side: THREE.DoubleSide,
});
plane.material = material;
scene.add(plane);
renderer.render(scene, ortho);

let count = 0;
animate();

function animate() {
  requestAnimationFrame(animate);
  /*
  material.uniforms.t.value = count;
  material.uniforms.is_shadow.value = controls.shadow;
  material.uniforms.balloon.value = controls.balloon / 100;
  // plane.material = material;
  */
  renderer.render(scene, ortho);

  stats.update();
  count = (count + 0.02) % (Math.PI * 2);
  //console.log(count);
}
