/* ==========================================================
   Protección de la vista previa (solo rama demo)
   Sellos en las fotos, crédito de la diseñadora y bloqueos básicos
   para que la propuesta no se use sin autorización.
   ========================================================== */
(function () {
  const CREDIT = "Diseño de Scarlett";

  // Sello en cada foto
  const addStamps = () => {
    document.querySelectorAll(".photo, .tcard__media, .polaroid, .map-card").forEach((el) => {
      if (el.querySelector(":scope > .demo-stamp")) return;
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const s = document.createElement("span");
      s.className = "demo-stamp";
      s.innerHTML = `<span class="demo-stamp__pre">Vista previa · </span>${CREDIT}`;
      el.appendChild(s);
    });
  };

  // Crédito en el pie de página
  const addCredit = () => {
    const bottom = document.querySelector(".footer__bottom");
    if (!bottom || bottom.querySelector(".demo-credit")) return;
    const p = document.createElement("p");
    p.className = "demo-credit";
    p.textContent = `Vista previa: ${CREDIT}. Propuesta para La Dental, no autorizada para publicarse ni copiarse.`;
    bottom.appendChild(p);
  };

  // Si alguien borra el aviso o la marca de agua, vuelven a aparecer
  const badgeHTML = document.querySelector(".demo-badge")?.outerHTML;
  const ensureMarks = () => {
    if (!document.querySelector(".demo-watermark")) {
      const wm = document.createElement("div");
      wm.className = "demo-watermark";
      wm.setAttribute("aria-hidden", "true");
      document.body.appendChild(wm);
    }
    if (badgeHTML && !document.querySelector(".demo-badge")) document.body.insertAdjacentHTML("beforeend", badgeHTML);
    document.querySelectorAll(".demo-watermark, .demo-badge, .demo-stamp").forEach((el) => el.removeAttribute("style"));
    addStamps();
    addCredit();
  };

  // Bloqueos básicos: clic derecho, arrastrar fotos, guardar, ver código e imprimir
  document.body.classList.add("demo-lock");
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => { if (e.target.tagName === "IMG") e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["s", "u", "p"].includes(k)) e.preventDefault();
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) e.preventDefault();
    if (e.key === "F12") e.preventDefault();
  });

  ensureMarks();
  setTimeout(ensureMarks, 1500);
  new MutationObserver(() => {
    if (!document.querySelector(".demo-watermark") || !document.querySelector(".demo-badge")) ensureMarks();
  }).observe(document.body, { childList: true });
  setInterval(ensureMarks, 3000);

  console.log("%cVista previa protegida", "font-size:18px;font-weight:bold;color:#3F8F7A");
  console.log(`Este sitio es una propuesta de ${CREDIT} para La Dental. No está autorizado copiarlo ni publicarlo.`);
})();
