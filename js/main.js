/* ==========================================================
   La Dental · Funciones de la página
   Índice:
     1. Enlaces de contacto (WhatsApp, teléfono, mapa, redes)
     2. Encabezado y menú de celular
     3. Títulos con letras 3D y animaciones al hacer scroll
     4. Diente 3D del inicio y efecto de inclinación
     4b. Números que cuentan
     5. Atajo "¿Qué necesitas hoy?"
     6. Mapa de tu sonrisa (toca un diente)
     7. Pestañas de tratamientos
     8. Sonrisa con brackets del cupón
     9. Camino de "Tu primera visita"
    10. Mazo de consejos
    11. Formulario "Agenda tu cita"
    12. Mapa, horario, año y barra de acciones
   Cada parte va protegida: si una falla, las demás siguen.
   ========================================================== */

const safe = (name, fn) => {
  try { fn(); } catch (err) { console.warn("No se pudo iniciar:", name, err); }
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const isTouch = window.matchMedia("(hover: none)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";

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
  $$(".stats__grid, .path, .values, .pledge").forEach((group) => {
    $$("[data-reveal]", group).forEach((el, i) => el.style.setProperty("--d", `${i * 0.1}s`));
  });

  // Publicaciones de redes: giran una por una
  $$("#feed .feed__post").forEach((post, i) => post.style.setProperty("--i", i));

  const targets = $$("[data-reveal], [data-split], #feed");
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

/* ---------- 4. Diente 3D e inclinación ---------- */
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
  const shine = document.createElementNS(NS, "path");
  shine.setAttribute("d", "M17 15C20 11 25 10 29 12");
  shine.setAttribute("class", "tooth3d__shine");
  base.appendChild(shine);
});

safe("inclinación", () => {
  if (reducedMotion) return;
  // Con el mouse en computadora; con el scroll en celular (solo donde no se toca)
  const tilt = (el, area, { onTouch = true, strength = 1 } = {}) => {
    if (!el || !area) return;
    if (!isTouch) {
      area.addEventListener("pointermove", (e) => {
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${x * 20 * strength}deg`);
        el.style.setProperty("--rx", `${-y * 14 * strength}deg`);
      });
      area.addEventListener("pointerleave", () => {
        el.style.removeProperty("--ry");
        el.style.removeProperty("--rx");
      });
    } else if (onTouch) {
      const onScroll = () => {
        const r = area.getBoundingClientRect();
        const p = Math.max(-0.5, Math.min(0.5, (r.top + r.height / 2) / window.innerHeight - 0.5));
        el.style.setProperty("--rx", `${p * 20 * strength}deg`);
        el.style.setProperty("--ry", `${-p * 12 * strength}deg`);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  };
  tilt($("#stage"), $(".hero"));
  $$(".about__photo").forEach((photo) => tilt(photo, $("#aboutMedia"), { strength: 0.8 }));
  tilt($("#coupon"), $(".promo"), { strength: 0.6 });
  tilt($("#mouthCard"), $(".mouth__stage"), { onTouch: false, strength: 0.6 });
});

/* ---------- Números que cuentan al aparecer ---------- */
safe("contadores", () => {
  const nums = $$("[data-count]");
  if (reducedMotion || !("IntersectionObserver" in window)) return;
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    // El 0% cuenta hacia abajo desde 100: así se nota que es "cero"
    const from = target === 0 ? 100 : 0;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (target - from) * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  const start = () => nums.forEach((n) => io.observe(n));
  if (document.body.classList.contains("is-intro")) document.addEventListener("intro:open", start, { once: true });
  else start();
});

/* ---------- 5. Atajo "¿Qué necesitas hoy?" ---------- */
// Elige el tratamiento en el formulario y baja hasta él
const pickService = (name) => {
  const select = $("#fService");
  if (!select) return;
  const option = Array.from(select.options).find((o) => o.text === name);
  if (option) select.value = option.text;
  $("#agenda").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  const field = select.closest(".field");
  field.classList.remove("is-picked");
  void field.offsetWidth;
  field.classList.add("is-picked");
};

safe("atajo", () => {
  $$("#quickChips [data-pick]").forEach((b) => b.addEventListener("click", () => pickService(b.dataset.pick)));
});

/* ---------- 6. Mapa de tu sonrisa ---------- */
safe("mapa de la sonrisa", () => {
  const ZONES = {
    incisivos: {
      name: "Incisivos",
      title: "Los dientes de enfrente",
      text: "Son los que más se ven al sonreír. Si están chuecos o separados, la ortodoncia los acomoda. Si tienen sarro o manchas, una limpieza los deja como nuevos.",
      tags: [["Ortodoncia", "tab-orto"], ["Limpieza dental", "tab-limpieza"]]
    },
    caninos: {
      name: "Caninos",
      title: "Los colmillos",
      text: "Guían tu mordida. Si salieron fuera de lugar o se ven montados, la ortodoncia los lleva a su sitio.",
      tags: [["Ortodoncia", "tab-orto"]]
    },
    premolares: {
      name: "Premolares",
      title: "Entre colmillos y muelas",
      text: "Si te molestan con lo frío o lo dulce, puede ser una caries. Tratada a tiempo, no llega al nervio.",
      tags: [["Caries", "tab-caries"], ["Endodoncia", "tab-endo"]]
    },
    molares: {
      name: "Molares",
      title: "Las muelas",
      text: "Hacen el trabajo pesado y es donde más aparecen las caries. Si el dolor es fuerte o no se quita, puede necesitar endodoncia. Si falta una, una prótesis la reemplaza.",
      tags: [["Caries", "tab-caries"], ["Endodoncia", "tab-endo"], ["Prótesis dentales", "tab-protesis"]]
    },
    cordales: {
      name: "Cordales",
      title: "Las muelas del juicio",
      text: "Salen al fondo de la boca. Si duelen, se inflaman o no tienen espacio, se revisan para valorar su extracción.",
      tags: [["Extracción de cordales", "tab-cordales"]]
    }
  };
  // Del centro hacia atrás: tipo de diente y ancho
  const TEETH = [
    ["incisivos", 22], ["incisivos", 19], ["caninos", 20], ["premolares", 21],
    ["premolares", 21], ["molares", 26], ["molares", 26], ["cordales", 24]
  ];
  const CX = 180, CY = 150, RX = 137, RY = 110, GAP = 3;
  const group = $("#archTeeth");
  const point = (deg) => {
    const t = (deg * Math.PI) / 180;
    return [CX + RX * Math.cos(t), CY + RY * Math.sin(t)];
  };

  // Reparte los dientes a lo largo del arco según su ancho
  let count = 0;
  const placeSide = (from, to) => {
    const steps = 400;
    const lens = [0];
    let prev = point(from);
    for (let s = 1; s <= steps; s++) {
      const p = point(from + ((to - from) * s) / steps);
      lens.push(lens[s - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
      prev = p;
    }
    const total = lens[steps];
    const needed = TEETH.reduce((sum, [, w]) => sum + w + GAP, 0);
    const scale = total / needed;
    let offset = (GAP / 2) * scale;
    TEETH.forEach(([zone, w], k) => {
      const center = offset + (w * scale) / 2;
      offset += (w + GAP) * scale;
      const s = lens.findIndex((l) => l >= center);
      const deg = from + ((to - from) * s) / steps;
      const [x, y] = point(deg);
      const tw = w * scale * 0.94;
      const th = zone === "molares" || zone === "cordales" ? 30 : zone === "incisivos" ? 34 : 32;
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "tooth");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", ZONES[zone].name);
      g.dataset.zone = zone;
      g.style.setProperty("--i", String(count++ % 16));
      g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(deg + 90).toFixed(1)})`);
      // Área invisible más grande para tocar fácil con el dedo
      g.innerHTML =
        `<rect class="tooth__hit" x="${-(w * scale) / 2}" y="-26" width="${w * scale}" height="52"/>` +
        `<rect x="${-tw / 2}" y="${-th / 2}" width="${tw}" height="${th}" rx="${zone === "molares" || zone === "cordales" ? 9 : 7}"/>`;
      group.appendChild(g);
      void k;
    });
  };
  placeSide(270, 192); placeSide(270, 348);   // arriba: izquierda y derecha
  placeSide(90, 168); placeSide(90, 12);      // abajo: izquierda y derecha

  const legend = $("#zoneLegend");
  const info = $("#zoneInfo");
  const select = (zone, animate) => {
    const z = ZONES[zone];
    $$(".tooth", group).forEach((t) => t.classList.toggle("is-zone", t.dataset.zone === zone));
    $$("button", legend).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.zone === zone)));
    $("#zoneName").textContent = z.name;
    $("#zoneTitle").textContent = z.title;
    $("#zoneText").textContent = z.text;
    $("#zoneTags").innerHTML = z.tags.map(([label, tab]) => `<a href="#tratamientos" data-tab="${tab}">${label}</a>`).join("");
    const btn = $("#zoneBtn");
    if (CONFIG.whatsapp) btn.href = waLink(`Hola La Dental, me molesta en la zona de ${z.name.toLowerCase()} y quisiera una revisión.`);
    if (animate) {
      info.classList.remove("is-swap");
      void info.offsetWidth;
      info.classList.add("is-swap");
    }
  };

  Object.entries(ZONES).forEach(([key, z]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.dataset.zone = key;
    b.textContent = z.name;
    b.addEventListener("click", () => select(key, true));
    legend.appendChild(b);
  });
  group.addEventListener("click", (e) => {
    const t = e.target.closest(".tooth");
    if (t) select(t.dataset.zone, true);
  });
  group.addEventListener("keydown", (e) => {
    const t = e.target.closest(".tooth");
    if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(t.dataset.zone, true); }
  });
  select("molares", false);
});

/* ---------- 7. Pestañas de tratamientos ---------- */
const openTab = (id, focus) => {
  const tab = document.getElementById(id);
  if (!tab) return;
  const tabs = $$("#treatTabs [role=tab]");
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    panel.hidden = !on;
    if (on) {
      panel.classList.remove("is-enter");
      void panel.offsetWidth;
      panel.classList.add("is-enter");
    }
  });
  // En celular la pestaña elegida se centra en la fila
  tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reducedMotion ? "auto" : "smooth" });
  if (focus) tab.focus({ preventScroll: true });
};

safe("pestañas", () => {
  const tabs = $$("#treatTabs [role=tab]");
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => openTab(t.id));
    t.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      openTab(tabs[(i + keys[e.key] + tabs.length) % tabs.length].id, true);
    });
  });
  // Enlaces del mapa de la sonrisa que abren un tratamiento
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-tab]");
    if (link) openTab(link.dataset.tab);
  });
});

/* ---------- 8. Sonrisa con brackets ---------- */
safe("sonrisa", () => {
  const g = $("#smileTeeth");
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

/* ---------- 9. Camino de "Tu primera visita" ---------- */
safe("camino", () => {
  const path = $("#path");
  const fill = $("#pathFill");
  const desktop = window.matchMedia("(min-width: 980px)");
  const update = () => {
    const r = path.getBoundingClientRect();
    const span = desktop.matches ? r.height + window.innerHeight * 0.3 : r.height;
    const p = Math.max(0, Math.min(1, (window.innerHeight * 0.75 - r.top) / span));
    fill.style.setProperty("--p", p.toFixed(3));
  };
  window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();
});

/* ---------- 10. Mazo de consejos ---------- */
safe("consejos", () => {
  const deck = $("#deck");
  const cards = $$(".post", deck);
  const count = $("#deckCount");
  let order = cards.map((_, i) => i);
  let busy = false;

  const render = () => {
    order.forEach((cardIndex, pos) => { cards[cardIndex].dataset.pos = String(pos); });
    count.textContent = `${order[0] + 1} / ${cards.length}`;
  };
  const next = () => {
    if (busy) return;
    busy = true;
    cards[order[0]].dataset.pos = "out";
    setTimeout(() => { order.push(order.shift()); render(); busy = false; }, 380);
  };
  const prev = () => {
    if (busy) return;
    busy = true;
    order.unshift(order.pop());
    const card = cards[order[0]];
    card.dataset.pos = "in";
    void card.offsetWidth;
    requestAnimationFrame(() => { render(); setTimeout(() => { busy = false; }, 300); });
  };

  $("#deckNext").addEventListener("click", next);
  $("#deckPrev").addEventListener("click", prev);

  // Deslizar con el dedo
  let startX = null;
  deck.addEventListener("pointerdown", (e) => { startX = e.clientX; });
  deck.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (dx < -45) next();
    else if (dx > 45) prev();
  });
  deck.addEventListener("pointercancel", () => { startX = null; });
  render();
});

/* ---------- 11. Formulario "Agenda tu cita" ---------- */
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

/* ---------- 12. Mapa, horario, año y barra de acciones ---------- */
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
