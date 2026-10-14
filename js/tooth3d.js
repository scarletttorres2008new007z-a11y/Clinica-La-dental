/* ==========================================================
   La Dental · Muela 3D del inicio
   Una muela de verdad en 3D: corona blanco perla y raíces doradas.
   Gira sola, despacio, y se puede girar con el dedo o el mouse
   para verla desde todos los ángulos.
   Si el celular no puede mostrar 3D, se queda la imagen fija
   assets/img/diente-3d.webp, que es esta misma muela.
   ========================================================== */

import { THREE, createStudio, buildMolarAsync, clamp, smoothstep } from "./dental3d.js";

const canvas = document.getElementById("toothCanvas");
const stage = canvas && canvas.closest(".stage");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Posición inicial: la misma de la imagen fija
export const START = { yaw: -0.5, pitch: 0.3 };

async function start() {
  const { renderer, scene, camera, resize } = createStudio(canvas);
  camera.position.set(0, 0.45, 7.3);
  camera.lookAt(0, 0.1, 0);

  // "tilt" inclina hacia adelante y atrás; "spin" gira a los lados
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  // Se calcula en pedacitos para no trabar la bienvenida
  spin.add(await buildMolarAsync({ res: 72 }));
  tilt.add(spin);
  scene.add(tilt);

  resize();
  window.addEventListener("resize", resize);

  /* ---------- Girar con el dedo o el mouse ---------- */
  let yaw = START.yaw, pitch = START.pitch;
  let vYaw = 0, vPitch = 0;        // impulso que queda al soltar
  let dragging = false, lastX = 0, lastY = 0, lastT = 0;
  let idleSince = -1e9;            // desde cuándo nadie lo toca

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vYaw = vPitch = 0;
    canvas.setPointerCapture(e.pointerId);
    stage.classList.add("is-touched");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(8, now - lastT) / 1000;
    const k = 4 / canvas.clientWidth; // arrastrar todo el ancho = casi una vuelta
    const dYaw = (e.clientX - lastX) * k;
    // En el celular solo gira a los lados, para que la página siga bajando con el dedo
    const dPitch = e.pointerType === "touch" ? 0 : (e.clientY - lastY) * k;
    yaw += dYaw; pitch += dPitch;
    vYaw = dYaw / dt; vPitch = dPitch / dt;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    idleSince = performance.now();
    if (performance.now() - lastT > 80) vYaw = vPitch = 0; // lo soltó sin lanzar
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  /* ---------- Animación ---------- */
  let visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(canvas);
  }
  let prev = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (visible && !document.hidden) {
      if (!dragging) {
        const idle = (now - idleSince) / 1000;
        // Al soltarlo sigue girando con el impulso y luego vuelve a su giro lento
        vYaw *= Math.exp(-dt * 2.2);
        vPitch *= Math.exp(-dt * 2.2);
        const auto = reducedMotion ? 0 : 0.42 * smoothstep(0.6, 2, idle);
        yaw += (vYaw + auto) * dt;
        pitch += vPitch * dt;
        // Se inclina suave para mostrar la corona y las raíces
        const rest = reducedMotion ? START.pitch : START.pitch + Math.sin(now / 2600) * 0.22;
        pitch += (rest - pitch) * Math.min(1, dt * 1.4 * smoothstep(1.5, 3.5, idle));
      }
      pitch = clamp(pitch, -1.35, 1.45);
      spin.rotation.y = yaw;
      tilt.rotation.x = pitch;
      tilt.position.y = reducedMotion ? 0 : Math.sin(now / 760) * 0.05;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  };
  spin.rotation.y = yaw;
  tilt.rotation.x = pitch;
  renderer.render(scene, camera);
  stage.classList.add("is-3d");
  requestAnimationFrame(frame);
}

if (canvas && stage) {
  start().catch((err) => {
    // Sin 3D: se queda la imagen fija de la muela
    console.warn("Muela 3D no disponible:", err);
  });
}
