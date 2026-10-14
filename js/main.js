/* ==========================================================
   La Dental · Funciones de la página
   Índice:
     1. Enlaces de contacto (WhatsApp, teléfono, mapa, redes)
     2. Encabezado y menú de celular
     3. Títulos con letras 3D y animaciones al hacer scroll
     4. Fotos en 3D que se inclinan
     5. Carrusel 3D de tratamientos
     6. Fotos de la clínica que se abren al bajar
     7. Formulario "Agenda tu cita"
     8. Mapa, horario, año y barra de acciones
   Cada parte va protegida: si una falla, las demás siguen.
   ========================================================== */

const safe = (name, fn) => {
  try { fn(); } catch (err) { console.warn("No se pudo iniciar:", name, err); }
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const isTouch = window.matchMedia("(hover: none)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Enlaces de contacto ---------- */
const waLink = (msg) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg || "Hola La Dental, quisiera agendar una consulta.")}`;

safe("contacto", () => {
  $$("[data-wa]").forEach((a) => {
    if (!CONFIG.whatsapp) { a.hidden = true; return; }
    if (a.dataset.wa) a.href = waLink(a.dataset.wa);
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-tel]").forEach((a) => {
    if (!CONFIG.phone) { a.hidden = true; return; }
    a.href = `tel:${CONFIG.phone}`;
  });
  $$("[data-phone-label]").forEach((el) => { el.textContent = CONFIG.phoneLabel || CONFIG.phone; });
  if (!CONFIG.phone) $$('[data-needs="phone"]').forEach((el) => { el.hidden = true; });
  $$("[data-maps]").forEach((a) => {
    if (!CONFIG.maps) { a.hidden = true; return; }
    a.href = CONFIG.maps;
  });
  $$("[data-link]").forEach((a) => {
    const url = CONFIG[a.dataset.link];
    if (!url) { a.hidden = true; return; }
    a.href = url;
  });
});

/* ---------- 2. Encabezado y menú ---------- */
safe("menú", () => {
  const header = $("#header");
  const burger = $("#burger");
  const nav = $("#nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
});

/* ---------- 3. Títulos 3D y animaciones al hacer scroll ---------- */
safe("animaciones", () => {
  $$("[data-split]").forEach((el) => splitLetters(el));

  // Retraso escalonado para elementos que aparecen juntos
  $$(".hero__facts, .values").forEach((group) => {
    $$("[data-reveal]", group).forEach((el, i) => el.style.setProperty("--d", `${i * 0.1}s`));
  });

  const targets = $$("[data-reveal], [data-split]");
  const start = () => {
    if (!("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el) => io.observe(el));
  };

  // Empiezan cuando la boca se abre (o de una vez si no hay bienvenida)
  if ($("#intro") && document.body.classList.contains("is-intro")) {
    document.addEventListener("intro:open", start, { once: true });
  } else {
    start();
  }
});

/* ---------- 4. Fotos en 3D que se inclinan ---------- */
safe("inclinación", () => {
  if (reducedMotion) return;
  // Con el mouse en computadora; con el scroll en celular
  const tilt = (el, area, strength = 1) => {
    if (!el || !area) return;
    if (!isTouch) {
      area.addEventListener("pointermove", (e) => {
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${x * 22 * strength}deg`);
        el.style.setProperty("--rx", `${-y * 14 * strength}deg`);
      });
      area.addEventListener("pointerleave", () => {
        el.style.removeProperty("--ry");
        el.style.removeProperty("--rx");
      });
    } else {
      const onScroll = () => {
        const r = area.getBoundingClientRect();
        const p = Math.max(-0.5, Math.min(0.5, (r.top + r.height / 2) / window.innerHeight - 0.5));
        el.style.setProperty("--rx", `${p * 18 * strength}deg`);
        el.style.setProperty("--ry", `${p * 24 * strength}deg`);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  };
  tilt($("#heroScene"), $(".hero"));
  tilt($("#promoScene"), $(".promo"), 0.8);
});

/* ---------- 5. Carrusel 3D de tratamientos ---------- */
safe("carrusel", () => {
  const track = $("#track");
  const cards = $$(".tcard", track);
  const dotsBox = $("#trackDots");
  let active = 0;

  // Un punto por tarjeta
  const dots = cards.map((card, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Ver ${card.querySelector("h3").textContent}`);
    b.addEventListener("click", () => goTo(i));
    dotsBox.appendChild(b);
    return b;
  });

  const goTo = (i) => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: reducedMotion ? "auto" : "smooth" });
  };

  // Cada tarjeta gira según qué tan lejos está del centro
  const update = () => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    cards.forEach((card, i) => {
      const d = (card.offsetLeft + card.offsetWidth / 2 - center) / (card.offsetWidth + 18);
      const k = Math.max(-1.5, Math.min(1.5, d));
      if (!reducedMotion) {
        card.style.transform = `rotateY(${-k * 32}deg) scale(${1 - Math.min(Math.abs(k), 1) * 0.1})`;
        card.style.setProperty("--px", `${-k * 26}px`);
      }
      if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = i; }
    });
    if (best !== active || !cards[best].classList.contains("is-active")) {
      active = best;
      cards.forEach((c, i) => c.classList.toggle("is-active", i === best));
      dots.forEach((d, i) => d.setAttribute("aria-current", String(i === best)));
    }
  };

  let ticking = false;
  track.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  $("#trackPrev").addEventListener("click", () => goTo(active - 1));
  $("#trackNext").addEventListener("click", () => goTo(active + 1));

  // En pantallas anchas empieza en la segunda tarjeta, con una a cada lado
  if (track.clientWidth > cards[0].offsetWidth * 2.6) {
    track.scrollLeft = cards[1].offsetLeft - (track.clientWidth - cards[1].offsetWidth) / 2;
  }
  update();
});

/* ---------- 6. Fotos de la clínica que se abren al bajar ---------- */
safe("galería", () => {
  const gallery = $("#gallery");
  if (reducedMotion) return;
  const update = () => {
    const r = gallery.getBoundingClientRect();
    // 1 = cerrado (abajo de la pantalla), 0 = abierto (ya a la vista)
    const open = Math.max(0, Math.min(1, (r.top - window.innerHeight * 0.35) / (window.innerHeight * 0.55)));
    gallery.style.setProperty("--open", open.toFixed(3));
  };
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();
});

/* ---------- 7. Formulario "Agenda tu cita" ---------- */
safe("formulario", () => {
  const form = $("#bookForm");
  const error = $("#formError");
  if (!CONFIG.whatsapp && !CONFIG.phone) { form.hidden = true; return; }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#fName").value.trim();
    if (!name) {
      error.hidden = false;
      $("#fName").focus();
      return;
    }
    error.hidden = true;
    const service = $("#fService").value;
    const when = form.querySelector("input[name=cuando]:checked").value;
    const msg = `Hola La Dental, soy ${name}. Quisiera agendar una cita para: ${service}. Me gustaría ir ${when}.`;
    if (CONFIG.whatsapp) window.open(waLink(msg), "_blank", "noopener");
    else window.location.href = `tel:${CONFIG.phone}`;
  });
});

/* ---------- 8. Mapa, horario, año y barra de acciones ---------- */
safe("visítanos", () => {
  // El mapa se carga solo cuando la persona llega cerca (página más rápida)
  const frame = $("#mapFrame");
  if (CONFIG.mapEmbed) {
    const load = () => { if (!frame.src) frame.src = CONFIG.mapEmbed; };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
      }, { rootMargin: "400px" });
      io.observe(frame);
    } else load();
  } else {
    frame.closest(".map-card").hidden = true;
  }

  if (Array.isArray(HORARIO) && HORARIO.length) {
    $("#hoursList").innerHTML = HORARIO.map((l) => `<span>${l}</span>`).join("<br>");
    $("#hoursItem").hidden = false;
  }

  $("#year").textContent = new Date().getFullYear();
});

safe("barra de acciones", () => {
  const bar = $("#actionbar");
  const show = () => bar.classList.add("is-visible");
  if (document.body.classList.contains("is-intro")) {
    document.addEventListener("intro:open", () => setTimeout(show, 900), { once: true });
  } else show();
});
