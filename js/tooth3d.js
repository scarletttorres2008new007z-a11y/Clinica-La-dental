/* ==========================================================
   La Dental · Diente 3D del inicio
   Un diente de verdad en 3D (con luz, brillo y sombra) que gira
   despacio. Se arma con Three.js (carpeta js/vendor).
   Si el celular no puede mostrar 3D, se queda la imagen fija
   assets/img/diente-3d.webp, que es este mismo diente.
   ========================================================== */

import * as THREE from "./vendor/three.module.min.js";
import { MarchingCubes } from "./vendor/MarchingCubes.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const canvas = document.getElementById("toothCanvas");
const stage = canvas && canvas.closest(".stage");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Forma del diente (una muela, como la del logo) ---------- */
// Cada función dice qué tan lejos está un punto de la superficie:
// negativo = adentro del diente, positivo = afuera.

// Une dos formas con una curva suave (sin bordes duros)
const smoothUnion = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const smoothCut = (a, b, k) => -smoothUnion(-a, b, k);

const sphere = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;

// Corona: una caja muy redondeada
const crown = (x, y, z) => {
  // Se angosta hacia el cuello del diente
  const narrow = 1 + Math.max(0, 0.45 - y) * 0.45;
  const nx = (x * narrow) / 0.72, ny = (y - 0.4) / 0.4, nz = (z * narrow) / 0.6;
  const n = 2.6;
  const v = Math.pow(Math.abs(nx), n) + Math.pow(Math.abs(ny), n) + Math.pow(Math.abs(nz), n);
  return (Math.pow(v, 1 / n) - 1) * 0.42;
};

// Raíz: un cono redondeado que se afina hacia la punta
const root = (x, y, z, ax, ay, az, bx, by, bz, r1, r2) => {
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pax = x - ax, pay = y - ay, paz = z - az;
  const py = pax * bax + pay * bay + paz * baz;
  const pz = py - l2;
  const qx = pax * l2 - bax * py, qy = pay * l2 - bay * py, qz = paz * l2 - baz * py;
  const x2 = qx * qx + qy * qy + qz * qz, y2 = py * py * l2, z2 = pz * pz * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(pz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
  if (Math.sign(py) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
  return (Math.sqrt(x2 * a2 * il2) + py * rr) * il2 - r1;
};

const tooth = (x, y, z) => {
  let d = crown(x, y, z);
  // Cuatro cúspides arriba
  d = smoothUnion(d, sphere(x, y, z, -0.33, 0.68, -0.26, 0.32), 0.2);
  d = smoothUnion(d, sphere(x, y, z, 0.33, 0.68, -0.26, 0.32), 0.2);
  d = smoothUnion(d, sphere(x, y, z, -0.33, 0.68, 0.26, 0.32), 0.2);
  d = smoothUnion(d, sphere(x, y, z, 0.33, 0.68, 0.26, 0.32), 0.2);
  // Surcos entre las cúspides
  d = smoothCut(d, sphere(x, y, z, 0, 1.06, 0, 0.22), 0.14);
  d = smoothCut(d, Math.hypot(z, y - 1.02) - 0.08, 0.1);
  d = smoothCut(d, Math.hypot(x, y - 1.02) - 0.08, 0.1);
  // Dos raíces
  const roots = smoothUnion(
    root(x, y, z, -0.3, 0.1, 0.02, -0.46, -1.08, 0.08, 0.33, 0.12),
    root(x, y, z, 0.3, 0.1, -0.02, 0.42, -1.04, -0.08, 0.33, 0.12),
    0.12
  );
  return smoothUnion(d, roots, 0.32);
};

/* ---------- Escena ---------- */
function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // Se dibuja con más detalle que la pantalla para que los bordes queden suaves
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1.5) * 1.25, 2.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Reflejos suaves de un cuarto iluminado: dan el brillo del esmalte
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 0.45, 7.3);
  camera.lookAt(0, 0.1, 0);

  // Luz principal arriba a la izquierda y luz de borde atrás
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe5dd, 1.2);
  rim.position.set(4, 1, -4);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9ec8ba, 0.5));

  // Esmalte: blanco hueso, brillante como un diente sano
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xf8f5ee,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xffffff)
  });

  // Convierte la forma en malla 3D
  const RES = 76;
  const SPAN = 1.5;      // medio ancho del espacio donde vive el diente
  const OFFSET_Y = -0.08; // centra el diente a lo alto
  const mc = new MarchingCubes(RES, material, false, false, 60000);
  mc.isolation = 0;
  const half = RES / 2;
  for (let z = 0; z < RES; z++) {
    for (let y = 0; y < RES; y++) {
      for (let x = 0; x < RES; x++) {
        const px = ((x - half) / half) * SPAN;
        const py = ((y - half) / half) * SPAN + OFFSET_Y;
        const pz = ((z - half) / half) * SPAN;
        mc.field[x + RES * y + RES * RES * z] = -tooth(px, py, pz) * 30;
      }
    }
  }
  mc.update();
  mc.scale.setScalar(SPAN);

  const holder = new THREE.Group();
  holder.add(mc);
  holder.rotation.x = 0.32; // se ve un poco desde arriba, con sus cúspides
  scene.add(holder);

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  // Gira despacio; se pausa cuando no está en pantalla
  let visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(canvas);
  }
  const t0 = performance.now();
  const frame = (now) => {
    const t = (now - t0) / 1000;
    if (visible) {
      holder.rotation.y = reducedMotion ? -0.5 : -0.5 + t * 0.45;
      holder.position.y = reducedMotion ? 0 : Math.sin(t * 1.3) * 0.06;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  };
  renderer.render(scene, camera);
  stage.classList.add("is-3d");
  requestAnimationFrame(frame);
}

try {
  if (canvas && stage) start();
} catch (err) {
  // Sin 3D: se queda la imagen fija del diente
  console.warn("Diente 3D no disponible:", err);
}
