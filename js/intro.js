/* ==========================================================
   L.a Dental · Pantalla de bienvenida
   1. Arma las letras del logo y los dientes de las mandíbulas
   2. Dibuja burbujas que suben (como espuma de cepillado)
   3. Al tocar "Quiero mi sonrisa", la boca se abre y entra la página
   ========================================================== */

// Avisa al CSS que hay JavaScript (para las animaciones de entrada)
document.documentElement.classList.add("js");

/*
 * Separa el texto de un elemento en letras (<span class="ch">)
 * agrupadas por palabra, para animarlas una por una.
 * Los elementos internos (como el punto del logo) cuentan como una letra.
 */
function splitLetters(el) {
  let i = 0;
  const nodes = Array.from(el.childNodes);
  el.textContent = "";
  let word = null;

  const newWord = () => {
    word = document.createElement("span");
    word.className = "word";
    el.appendChild(word);
  };

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const char of node.textContent) {
        if (char === " ") { el.appendChild(document.createTextNode(" ")); word = null; continue; }
        if (!word) newWord();
        const span = document.createElement("span");
        span.className = "ch";
        span.style.setProperty("--i", i++);
        span.textContent = char;
        word.appendChild(span);
      }
    } else {
      if (!word) newWord();
      node.classList.add("ch");
      node.style.setProperty("--i", i++);
      word.appendChild(node);
    }
  });
}

(function intro() {
  const intro = document.getElementById("intro");
  const btn = document.getElementById("introBtn");
  if (!intro || !btn) return;

  // Letras del logo
  const logoWord = intro.querySelector("[data-split-letters]");
  if (logoWord) splitLetters(logoWord);

  // Dientes: suficientes para cubrir el ancho de la pantalla
  const buildTeeth = () => {
    const count = Math.ceil((window.innerWidth + 120) / 56) + 1;
    intro.querySelectorAll("[data-teeth]").forEach((row) => {
      row.innerHTML = "";
      for (let n = 0; n < count; n++) {
        const t = document.createElement("span");
        t.style.setProperty("--i", Math.abs(n - count / 2));
        row.appendChild(t);
      }
    });
  };
  buildTeeth();

  /* ---------- Burbujas ---------- */
  const canvas = document.getElementById("introBubbles");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  let bubbles = [];
  let running = !!ctx;
  let last = performance.now();
  let w = 0, h = 0;

  const resize = () => {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const total = Math.min(90, Math.round((w * h) / 9000));
    while (bubbles.length < total) bubbles.push(makeBubble(true));
    bubbles.length = total;
  };

  const makeBubble = (anywhere) => {
    const sparkle = Math.random() < 0.14;
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 30,
      r: sparkle ? 4 + Math.random() * 5 : 4 + Math.random() * 16,
      vy: 38 + Math.random() * 70,          // velocidad moderada hacia arriba
      phase: Math.random() * Math.PI * 2,
      sway: 8 + Math.random() * 18,
      sparkle,
      rot: Math.random() * Math.PI
    };
  };

  const drawSparkle = (b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.fillStyle = "#D9A23A";
    ctx.beginPath();
    const r = b.r * 1.6;
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.quadraticCurveTo(0, 0, 0, r);
    ctx.quadraticCurveTo(0, 0, -r, 0);
    ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill();
    ctx.restore();
  };

  const drawBubble = (b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.stroke();
    // brillo pequeño
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  };

  const tick = (now) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, w, h);
    bubbles.forEach((b, i) => {
      b.y -= b.vy * dt;
      b.phase += dt * 1.6;
      b.rot += dt;
      const x = b.x + Math.sin(b.phase) * b.sway * dt * 2;
      b.x = x;
      if (b.y < -40) bubbles[i] = makeBubble(false);
      b.sparkle ? drawSparkle(b) : drawBubble(b);
    });
    requestAnimationFrame(tick);
  };

  try {
    if (ctx) {
      resize();
      requestAnimationFrame(tick);
      window.addEventListener("resize", () => { resize(); buildTeeth(); });
    }
  } catch (err) {
    running = false; // si falla el dibujo, la bienvenida sigue funcionando
  }

  /* ---------- Entrar a la página ---------- */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opened = false;

  const open = () => {
    if (opened) return;
    opened = true;
    const step = reduced ? 0.2 : 1;
    intro.classList.add("is-leaving");
    setTimeout(() => intro.classList.add("is-teeth"), 350 * step);
    setTimeout(() => {
      intro.classList.add("is-open");
      document.body.classList.remove("is-intro");
      document.body.classList.add("is-entering");
      document.dispatchEvent(new CustomEvent("intro:open"));
    }, 1050 * step);
    setTimeout(() => {
      running = false;
      intro.classList.add("is-gone");
      document.body.classList.remove("is-entering");
      intro.setAttribute("aria-hidden", "true");
    }, 2250 * step);
  };

  btn.addEventListener("click", open);
  window.introOpen = open;
})();
