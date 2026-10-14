/* ==========================================================
   L.a Dental · Funciones de la página
   Índice:
     1. Enlaces de contacto (WhatsApp, teléfono, mapa, redes)
     2. Encabezado y menú de celular
     3. Títulos con letras 3D y animaciones al hacer scroll
     4. Diente 3D del inicio y efecto de inclinación
     5. Cinta de servicios
     6. Tarjetas que giran
     7. Sonrisa con brackets
     8. Guía "¿Qué le pasa a tu sonrisa?"
     9. Carrusel 3D de la clínica
    10. Mapa, horario y año
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
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg || "Hola L.a Dental, quisiera agendar una consulta.")}`;

safe("contacto", () => {
  $$("[data-wa]").forEach((a) => {
    if (!CONFIG.whatsapp) { a.hidden = true; return; }
    a.href = waLink(a.dataset.wa);
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
  $$(".services__grid, .tips__grid").forEach((grid) => {
    $$("[data-reveal]", grid).forEach((el, i) => el.style.setProperty("--d", `${(i % 3) * 0.12}s`));
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

/* ---------- 4. Diente 3D del inicio ---------- */
safe("diente 3D", () => {
  const tooth = $("#tooth3d");
  const base = $(".tooth3d__layer", tooth);

  // Capas apiladas en profundidad: le dan grosor real al girar
  const LAYERS = 9;
  for (let n = 1; n <= LAYERS; n++) {
    const layer = base.cloneNode(true);
    layer.style.transform = `translateZ(${-n * 2.2}px)`;
    tooth.insertBefore(layer, base);
  }
  base.classList.add("is-front");
  base.style.transform = "translateZ(1px)";
  // Brillo en la parte de arriba del diente
  const shine = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shine.setAttribute("d", "M17 15C20 11 25 10 29 12");
  shine.setAttribute("class", "tooth3d__shine");
  base.appendChild(shine);

  // Inclinación con el mouse (computadora) o con el scroll (celular)
  const tilt = (el, area) => {
    if (reducedMotion) return;
    if (!isTouch) {
      area.addEventListener("pointermove", (e) => {
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${x * 22}deg`);
        el.style.setProperty("--rx", `${-y * 16}deg`);
      });
      area.addEventListener("pointerleave", () => {
        el.style.removeProperty("--ry");
        el.style.removeProperty("--rx");
      });
    } else {
      const onScroll = () => {
        const r = area.getBoundingClientRect();
        const p = (r.top + r.height / 2) / window.innerHeight - 0.5; // -0.5 a 0.5
        el.style.setProperty("--rx", `${p * 22}deg`);
        el.style.setProperty("--ry", `${-p * 14}deg`);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  };
  tilt($("#stage"), $(".hero"));
  tilt($("#smileCard"), $(".promo"));
});

/* ---------- 5. Cinta de servicios (se duplica para que no tenga fin) ---------- */
safe("cinta", () => {
  const track = $("#ribbonTrack");
  track.innerHTML += track.innerHTML;
});

/* ---------- 6. Tarjetas que giran ---------- */
safe("tarjetas", () => {
  $$(".flip").forEach((card) => {
    const toggle = () => card.classList.toggle("is-flipped");
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // el botón de WhatsApp no gira la tarjeta
      toggle();
    });
    card.addEventListener("keydown", (e) => {
      if (e.target !== card) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    // En computadora también gira al pasar el mouse
    if (!isTouch) {
      card.addEventListener("mouseenter", () => card.classList.add("is-flipped"));
      card.addEventListener("mouseleave", () => card.classList.remove("is-flipped"));
    }
  });
});

/* ---------- 7. Sonrisa con brackets ---------- */
safe("sonrisa", () => {
  const g = $("#smileTeeth");
  const NS = "http://www.w3.org/2000/svg";
  const angles = [-21, -15, -9, -3, 3, 9, 15, 21];
  // Colores de las ligas de los brackets
  const bands = ["#E98E9C", "#5BA4E6", "#D9A23A", "#3F8F7A", "#9B7BD4", "#E98E9C", "#5BA4E6", "#D9A23A"];
  angles.forEach((a, i) => {
    const big = Math.abs(a) < 10;
    const wTooth = big ? 38 : 34;
    const tooth = document.createElementNS(NS, "g");
    tooth.style.setProperty("--i", i);
    // El giro va en un grupo interno; el externo lo usa la animación
    tooth.innerHTML = `<g transform="rotate(${a} 200 -260)">` +
      `<rect class="smile__tooth" x="${200 - wTooth / 2}" y="${big ? 104 : 108}" width="${wTooth}" height="${big ? 70 : 60}" rx="12"/>` +
      `<rect class="smile__bracket" x="190" y="135" width="20" height="20" rx="4"/>` +
      `<rect class="smile__band" x="187" y="132" width="26" height="26" rx="7" stroke="${bands[i]}"/></g>`;
    g.appendChild(tooth);
  });
});

/* ---------- 8. Guía "¿Qué le pasa a tu sonrisa?" ---------- */
safe("guía", () => {
  const OPTIONS = [
    {
      chip: "Me duele una muela",
      title: "Caries o endodoncia",
      text: "Un dolor de muela puede venir de una caries o de un nervio inflamado. Con una revisión sabremos si basta tratar la caries o si necesitas endodoncia.",
      msg: "Hola L.a Dental, me duele una muela y quisiera una consulta."
    },
    {
      chip: "Me están saliendo las cordales",
      title: "Extracción de cordales",
      text: "Si las muelas del juicio te causan dolor, inflamación o no tienen espacio, lo mejor es revisarlas y valorar su extracción.",
      msg: "Hola L.a Dental, me están saliendo las cordales y quisiera una consulta."
    },
    {
      chip: "Quiero dientes derechos",
      title: "Ortodoncia",
      text: "Con brackets alineamos tus dientes y tu mordida. Ahora con 0% de prima y cuotas desde $24.99.",
      msg: "Hola L.a Dental, quiero información sobre ortodoncia con 0% de prima."
    },
    {
      chip: "Me falta una pieza",
      title: "Prótesis dentales",
      text: "Una prótesis te ayuda a recuperar las piezas que faltan para sonreír y masticar con confianza.",
      msg: "Hola L.a Dental, me falta una pieza y quisiera información sobre prótesis."
    },
    {
      chip: "Tengo sarro o mal aliento",
      title: "Limpieza dental",
      text: "Una limpieza retira el sarro y la placa que el cepillo no alcanza. Y recuerda cepillar también tu lengua.",
      msg: "Hola L.a Dental, quisiera agendar una limpieza dental."
    },
    {
      chip: "Solo quiero una revisión",
      title: "Consulta preventiva",
      text: "Tu salud dental es importante. Agenda tu consulta para un diagnóstico preventivo y oportuno.",
      msg: "Hola L.a Dental, quisiera agendar una consulta de revisión."
    }
  ];

  const chips = $("#helperChips");
  const card = $("#helperAnswer");
  const title = $("#answerTitle");
  const text = $("#answerText");
  const btn = $("#answerBtn");

  const show = (index, animate) => {
    const opt = OPTIONS[index];
    $$(".chip", chips).forEach((c, i) => c.setAttribute("aria-selected", String(i === index)));
    title.textContent = opt.title;
    text.textContent = opt.text;
    if (CONFIG.whatsapp) btn.href = waLink(opt.msg);
    if (animate) {
      card.classList.remove("is-swap");
      void card.offsetWidth; // reinicia la animación
      card.classList.add("is-swap");
    }
  };

  OPTIONS.forEach((opt, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("role", "tab");
    b.textContent = opt.chip;
    b.addEventListener("click", () => show(i, true));
    chips.appendChild(b);
  });
  show(0, false);
});

/* ---------- 9. Carrusel 3D de la clínica ---------- */
safe("carrusel", () => {
  const track = $("#coverTrack");
  const covers = $$(".cover", track);
  const dots = $("#coverDots");

  covers.forEach((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", `Foto ${i + 1}`);
    d.addEventListener("click", () => goTo(i));
    dots.appendChild(d);
  });

  const centerOf = (el) => el.offsetLeft + el.offsetWidth / 2;
  const goTo = (i) => {
    const el = covers[Math.max(0, Math.min(covers.length - 1, i))];
    track.scrollTo({ left: centerOf(el) - track.clientWidth / 2, behavior: "smooth" });
  };
  let current = 0;

  // Cada foto gira según qué tan lejos está del centro
  const update = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    covers.forEach((el, i) => {
      const dist = (centerOf(el) - mid) / el.offsetWidth; // -1 a 1 aprox.
      const c = Math.max(-1.4, Math.min(1.4, dist));
      el.style.setProperty("--ry", `${-c * 38}deg`);
      el.style.setProperty("--s", String(1 - Math.min(Math.abs(c), 1) * 0.16));
      el.style.setProperty("--tz", `${-Math.abs(c) * 60}px`);
      el.style.zIndex = String(10 - Math.round(Math.abs(c) * 3));
      if (Math.abs(dist) < bestDist) { bestDist = Math.abs(dist); best = i; }
    });
    current = best;
    $$("button", dots).forEach((d, i) => d.setAttribute("aria-current", String(i === best)));
  };

  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  $("#coverPrev").addEventListener("click", () => goTo(current - 1));
  $("#coverNext").addEventListener("click", () => goTo(current + 1));

  // Empieza en la foto del centro
  const startAt = () => {
    const el = covers[1];
    track.scrollLeft = centerOf(el) - track.clientWidth / 2;
    update();
  };
  startAt();
  window.addEventListener("load", startAt);
});

/* ---------- 10. Mapa, horario, año y botón flotante ---------- */
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

safe("botón flotante", () => {
  const fab = $(".wa-float");
  const show = () => fab.classList.add("is-visible");
  if (document.body.classList.contains("is-intro")) {
    document.addEventListener("intro:open", () => setTimeout(show, 900), { once: true });
  } else show();
});
