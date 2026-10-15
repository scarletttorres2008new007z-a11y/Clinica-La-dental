/* ==========================================================
   La Dental · Boca 3D que se abre al bajar
   En la sección "Cuidamos toda tu sonrisa" la boca completa
   (dientes, encías y lengua) se abre y gira mientras bajas.
   Se arma solo cuando la sección está cerca, para que la página
   cargue rápido. Si no hay 3D, queda la imagen fija
   assets/img/boca-3d.webp.
   ========================================================== */

import { THREE, createStudio, buildMouth, clamp, smoothstep, mix } from "./dental3d.js";

const section = document.getElementById("sonrisa");
const stage = document.getElementById("mouthStage");
const canvas = document.getElementById("mouthCanvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Qué tanto has bajado dentro de la sección: 0 al llegar, 1 al terminar
const progress = () => {
  const pin = section.firstElementChild;
  const top = parseFloat(getComputedStyle(pin).top) || 0;
  const r = section.getBoundingClientRect();
  return clamp((top - r.top) / Math.max(1, r.height - pin.offsetHeight), 0, 1);
};

function start() {
  const { renderer, scene, camera, resize } = createStudio(canvas, { fov: 30 });
  const mouth = buildMouth();
  const holder = new THREE.Group();
  holder.add(mouth.group);
  scene.add(holder);

  // La cámara se aleja lo necesario para que la boca quepa en pantalla
  const fit = () => {
    if (!resize()) return;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // En celular la boca llena más el espacio para que se vea grande
    const fit = camera.aspect < 1.3 ? 0.25 : 0.6;
    camera.userData.dist = Math.max(1.4 / tan, 1.5 / (tan * camera.aspect)) + fit;
  };
  fit();

  // Arma la escena según el avance (0 = cerrada de frente, 1 = abierta vista desde arriba)
  const pose = (p) => {
    const open = smoothstep(0.08, 0.72, p);
    mouth.setOpen(open);
    holder.rotation.y = mix(-0.6, 0.42, smoothstep(0, 1, p));
    holder.rotation.x = mix(0.06, 0.34, open);
    const d = camera.userData.dist;
    camera.position.set(0, mix(0.15, 0.7, open), d);
    camera.lookAt(0, mix(-0.05, 0.22, open), 0);
    section.classList.toggle("is-open", p > 0.62);
  };

  let target = progress(), current = target, visible = false, drawn = -1;
  const onScroll = () => { target = progress(); };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { fit(); drawn = -1; onScroll(); });
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(stage);

  // Solo dibuja cuando algo cambió (cuida la batería del celular)
  const frame = () => {
    if (visible) {
      current = reducedMotion ? target : current + (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      if (current !== drawn) {
        pose(current);
        renderer.render(scene, camera);
        drawn = current;
      }
    }
    requestAnimationFrame(frame);
  };
  pose(current);
  renderer.render(scene, camera);
  stage.classList.add("is-3d");
  requestAnimationFrame(frame);
}

// Se arma cuando la sección está a una pantalla de distancia
if (section && stage && canvas) {
  const go = () => {
    try { start(); } catch (err) { console.warn("Boca 3D no disponible:", err); }
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      setTimeout(go, 30);
    }, { rootMargin: "100% 0px" });
    io.observe(section);
  } else {
    go();
  }
}
