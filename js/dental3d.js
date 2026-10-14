/* ==========================================================
   La Dental · Modelos 3D
   Aquí se modelan, con matemática, la muela del inicio y la boca
   completa (dientes, encías y lengua). No usa modelos descargados.
   Lo usan js/tooth3d.js (inicio) y js/mouth3d.js (boca).
   ========================================================== */

import * as THREE from "./vendor/three.module.min.js";
import { MarchingCubes } from "./vendor/MarchingCubes.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export { THREE };

/* ---------- 1. Herramientas para describir formas ---------- */
// Cada forma es una función de distancia:
// negativo = adentro, positivo = afuera, cero = la superficie.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Une dos formas con una curva suave (sin bordes duros)
export const smoothUnion = (a, b, k) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
// Le quita a una forma otra, también con curva suave
export const smoothCut = (a, b, k) => -smoothUnion(-a, b, k);

export const sphere = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;

// Caja muy redondeada (superelipsoide); e más alto = más cuadrada.
// ey permite que la punta sea más plana que los lados.
const blob = (nx, ny, nz, e, size, ey = e) =>
  (Math.pow(Math.pow(Math.pow(Math.abs(nx), e) + Math.pow(Math.abs(nz), e), ey / e) + Math.pow(Math.abs(ny), ey), 1 / ey) - 1) * size;

// Cono redondeado: de un punto A (radio r1) a un punto B (radio r2)
export const roundCone = (x, y, z, ax, ay, az, bx, by, bz, r1, r2) => {
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

// Raíz curva: dos conos seguidos (de la corona al codo y del codo a la punta)
const curvedRoot = (x, y, z, a, b, c, r1, r2, r3) =>
  Math.min(
    roundCone(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], r1, r2),
    roundCone(x, y, z, b[0], b[1], b[2], c[0], c[1], c[2], r2, r3)
  );

/* ---------- 2. De la forma a una malla 3D ---------- */
// Recorre una cuadrícula alrededor de la forma y arma la superficie
// (marching cubes). "paint" da el color de cada punto.
// center/half: centro y medio tamaño de la caja donde vive la forma.
function* fillField(mc, shape, paint, res, center, half) {
  const h = res / 2;
  const color = new THREE.Color();
  for (let z = 0; z < res; z++) {
    const pz = center[2] + ((z - h) / h) * half[2];
    for (let y = 0; y < res; y++) {
      const py = center[1] + ((y - h) / h) * half[1];
      for (let x = 0; x < res; x++) {
        const px = center[0] + ((x - h) / h) * half[0];
        const i = x + res * y + res * res * z;
        mc.field[i] = -shape(px, py, pz);
        if (paint) {
          paint(px, py, pz, color);
          mc.palette[i * 3] = color.r;
          mc.palette[i * 3 + 1] = color.g;
          mc.palette[i * 3 + 2] = color.b;
        }
      }
    }
    yield z;
  }
}

// Copia el resultado a una geometría normal, ya con su tamaño real
function toGeometry(mc, paint, center, half) {
  mc.update();
  const n = mc.count;
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) pos[i * 3 + k] = center[k] + mc.positionArray[i * 3 + k] * half[k];
    const nx = mc.normalArray[i * 3] / half[0];
    const ny = mc.normalArray[i * 3 + 1] / half[1];
    const nz = mc.normalArray[i * 3 + 2] / half[2];
    const len = Math.hypot(nx, ny, nz) || 1;
    nor[i * 3] = nx / len;
    nor[i * 3 + 1] = ny / len;
    nor[i * 3 + 2] = nz / len;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  if (paint) geometry.setAttribute("color", new THREE.BufferAttribute(mc.colorArray.slice(0, n * 3), 3));
  mc.geometry.dispose();
  return geometry;
}

const newCubes = (res, paint, maxPolys) => {
  const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, !!paint, maxPolys);
  mc.isolation = 0;
  return mc;
};

export function polygonize(shape, paint, { res = 64, center = [0, 0, 0], half = [1, 1, 1], maxPolys = 60000 } = {}) {
  const mc = newCubes(res, paint, maxPolys);
  for (const _ of fillField(mc, shape, paint, res, center, half)); // eslint-disable-line no-unused-vars
  return toGeometry(mc, paint, center, half);
}

// Igual, pero en pedacitos: deja respirar a la página mientras calcula
export async function polygonizeAsync(shape, paint, { res = 64, center = [0, 0, 0], half = [1, 1, 1], maxPolys = 60000 } = {}) {
  const mc = newCubes(res, paint, maxPolys);
  let t = performance.now();
  for (const _ of fillField(mc, shape, paint, res, center, half)) { // eslint-disable-line no-unused-vars
    if (performance.now() - t > 10) {
      await new Promise((r) => setTimeout(r, 0));
      t = performance.now();
    }
  }
  return toGeometry(mc, paint, center, half);
}

/* ---------- 3. Colores y materiales ---------- */
const rgb = (hex) => new THREE.Color(hex); // convierte el color de pantalla al espacio de luz
const C = {
  pearl: rgb(0xf7f4ee),
  ivory: rgb(0xf3eee2),
  cervical: rgb(0xe9dcc0),
  edge: rgb(0xe6eaea),
  goldLight: rgb(0xf3dcb0),
  gold: rgb(0xe6b56c),
  goldDeep: rgb(0xcb8e3c),
  cavity: rgb(0x3a2414),
  cavityRim: rgb(0x9c7448),
  dentin: rgb(0xf0dfbd),
  pulp: rgb(0xc8424e),
  pulpDeep: rgb(0x9b2a37)
};

// Esmalte brillante. Con "gold", la parte dorada (raíces) brilla como metal.
export function enamelMaterial({ gold = false } = {}) {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffffff)
  });
  if (gold) {
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <metalnessmap_fragment>",
          "#include <metalnessmap_fragment>\n float goldness = clamp((vColor.r - vColor.b) * 2.6, 0.0, 1.0) * smoothstep(0.2, 0.45, vColor.g);\n metalnessFactor = max(metalnessFactor, goldness * 0.3);"
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.75, smoothstep(0.12, 0.02, vColor.g));"
        );
    };
  }
  return material;
}

// Encía, paladar y lengua: rosados y húmedos
export const gumMaterial = (hex = 0xd9667a) =>
  new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.45, clearcoat: 0.75, clearcoatRoughness: 0.16, sheen: 0.25, sheenColor: new THREE.Color(0xffc4cc) });

export const metalMaterial = () =>
  new THREE.MeshPhysicalMaterial({ color: 0xe4e8ec, metalness: 0.9, roughness: 0.2, clearcoat: 0.6 });

/* ---------- 4. La muela (como la del logo, con raíces doradas) ---------- */
// Medidas: la corona va de y = 0 a y = 1; las raíces bajan hasta y = -1.25.
const CUSPS = [[-0.3, -0.24, 0.31], [0.3, -0.24, 0.3], [-0.3, 0.24, 0.3], [0.3, 0.24, 0.31]];

const crownOnly = (x, y, z) => {
  // Más ancha a media altura y angosta en el cuello
  const neck = 1 + Math.max(0, 0.42 - y) * 0.62;
  const belly = 1 - 0.05 * Math.exp(-((y - 0.5) * (y - 0.5)) / 0.05);
  let d = blob((x * neck * belly) / 0.76, (y - 0.42) / 0.44, (z * neck * belly) / 0.66, 2.5, 0.42);
  // Cuatro cúspides redondas arriba
  for (const [cx, cz, r] of CUSPS) d = smoothUnion(d, sphere(x, y, z, cx, 0.7, cz, r), 0.22);
  // Surcos entre las cúspides y una fosa al centro
  d = smoothCut(d, sphere(x, y, z, 0, 1.08, 0, 0.23), 0.16);
  d = smoothCut(d, Math.hypot(z, y - 1.02) - 0.07, 0.12);
  d = smoothCut(d, Math.hypot(x, y - 1.02) - 0.07, 0.12);
  return d;
};

const rootsOnly = (x, y, z) => {
  // Dos raíces adelante (abiertas hacia los lados) y una atrás
  const a = curvedRoot(x, y, z, [-0.3, 0.12, 0.14], [-0.44, -0.55, 0.16], [-0.36, -1.18, 0.12], 0.3, 0.19, 0.06);
  const b = curvedRoot(x, y, z, [0.3, 0.12, 0.14], [0.42, -0.5, 0.18], [0.3, -1.12, 0.16], 0.3, 0.18, 0.06);
  const c = curvedRoot(x, y, z, [0, 0.12, -0.22], [0.02, -0.5, -0.36], [-0.02, -1.05, -0.4], 0.3, 0.17, 0.06);
  return smoothUnion(smoothUnion(a, b, 0.12), c, 0.12);
};

export const molarShape = (x, y, z) => smoothUnion(crownOnly(x, y, z), rootsOnly(x, y, z), 0.32);

// Color: corona blanco perla que pasa a dorado en las raíces
export const molarPaint = (x, y, z, out) => {
  out.copy(C.pearl).lerp(C.goldLight, smoothstep(0.3, -0.22, y));
  out.lerp(C.gold, smoothstep(-0.08, -0.8, y));
  out.lerp(C.goldDeep, smoothstep(-0.55, -1.25, y) * 0.7);
};

const MOLAR_BOX = { center: [0, -0.1, 0], half: [1.05, 1.32, 1.05] };

function molarRecipe(variant) {
  let shape = molarShape;
  let paint = molarPaint;

  if (variant === "caries") {
    // Una caries: hueco oscuro en una cúspide y en el costado
    const pit = (x, y, z) => Math.min(sphere(x, y, z, 0.24, 0.98, 0.3, 0.17), sphere(x, y, z, 0.5, 0.72, 0.62, 0.12));
    shape = (x, y, z) => smoothCut(molarShape(x, y, z), pit(x, y, z), 0.06);
    paint = (x, y, z, out) => {
      molarPaint(x, y, z, out);
      const d = pit(x, y, z);
      out.lerp(C.cavityRim, smoothstep(0.2, 0.06, d) * 0.85);
      out.lerp(C.cavity, smoothstep(0.08, 0.0, d));
    };
  }

  if (variant === "root-canal") {
    // Endodoncia: la muela cortada a la mitad muestra la pulpa (nervio) en rojo
    const pulp = (x, y, z) => {
      const chamber = blob(x / 0.42, (y - 0.38) / 0.2, z / 0.36, 2.4, 0.2);
      const ra = roundCone(x, y, z, -0.24, 0.3, 0.12, -0.36, -1.08, 0.12, 0.08, 0.025);
      const rb = roundCone(x, y, z, 0.24, 0.3, 0.12, 0.3, -1.02, 0.16, 0.08, 0.025);
      const rc = roundCone(x, y, z, 0, 0.3, -0.18, 0, -0.95, -0.38, 0.08, 0.025);
      return smoothUnion(smoothUnion(chamber, ra, 0.1), smoothUnion(rb, rc, 0.1), 0.1);
    };
    const cutZ = 0.12; // plano del corte, de frente a la cámara
    shape = (x, y, z) => Math.max(smoothCut(molarShape(x, y, z), pulp(x, y, z) + 0.02, 0.03), z - cutZ);
    paint = (x, y, z, out) => {
      molarPaint(x, y, z, out);
      if (pulp(x, y, z) < 0.05) out.copy(C.pulp); // el hueco del nervio, rojo
      if (z > cutZ - 0.03) {
        // En la cara del corte: esmalte blanco afuera, dentina adentro y pulpa roja
        const skin = -crownOnly(x, y, z);
        out.copy(C.dentin);
        if (y > 0.15) out.lerp(C.pearl, smoothstep(0.12, 0.05, skin));
        const p = pulp(x, y, z);
        out.lerp(C.pulp, smoothstep(0.03, -0.01, p));
        out.lerp(C.pulpDeep, smoothstep(-0.02, -0.08, p) * 0.6);
      }
    };
  }

  return { shape, paint };
}

export function buildMolar({ res = 76, variant = "clean" } = {}) {
  const { shape, paint } = molarRecipe(variant);
  return new THREE.Mesh(polygonize(shape, paint, { res, ...MOLAR_BOX, maxPolys: 80000 }), enamelMaterial({ gold: true }));
}

export async function buildMolarAsync({ res = 76, variant = "clean" } = {}) {
  const { shape, paint } = molarRecipe(variant);
  return new THREE.Mesh(await polygonizeAsync(shape, paint, { res, ...MOLAR_BOX, maxPolys: 80000 }), enamelMaterial({ gold: true }));
}

/* ---------- 5. Dientes de la boca completa ---------- */
// Cada tipo se modela una vez y se reutiliza (más ligero en el celular).
// Medidas locales: x = a lo largo de la arcada, z = hacia afuera (labios),
// y = hacia la punta del diente. La encía queda en y = 0.

const TOOTH_TYPES = {
  // w: medio ancho, t: medio grosor, h: alto de la corona
  incisor: { w: 0.14, t: 0.11, h: 0.36 },
  canine: { w: 0.13, t: 0.135, h: 0.38 },
  premolar: { w: 0.115, t: 0.155, h: 0.29 },
  molar: { w: 0.165, t: 0.175, h: 0.26 }
};

const toothShape = (type) => {
  const { w, t, h } = TOOTH_TYPES[type];
  const bottom = -0.42; // la raíz queda escondida en la encía
  const cy = (h + bottom) / 2, hy = (h - bottom) / 2;
  return (x, y, z) => {
    const u = clamp(y / h, 0, 1);
    if (type === "incisor" || type === "canine") {
      // Frente plano que se adelgaza hacia el borde
      const thin = mix(1, type === "canine" ? 0.45 : 0.3, smoothstep(0.25, 1, u));
      const wide = mix(0.74, 1, smoothstep(0, 0.6, u));
      const tip = type === "canine" ? 1 - 0.28 * Math.pow(Math.abs(x) / w, 1.4) : 1 - 0.05 * Math.pow(Math.abs(x) / w, 4);
      const zc = -0.35 * t * u * u; // la cara de adentro es cóncava
      return blob(x / (w * wide), (y - cy) / (hy * (y > cy ? tip : 1)), (z - zc) / (t * thin), 2.6, Math.min(w, t), type === "canine" ? 3 : 5);
    }
    // Premolares y molares: cuerpo redondo con cúspides arriba
    const wide = mix(0.8, 1, smoothstep(0, 0.5, u));
    let d = blob(x / (w * wide), (y - (cy - 0.03)) / (hy - 0.03), z / (t * wide), 2.6, Math.min(w, t));
    const cusps = type === "molar"
      ? [[-0.07, -0.08], [0.07, -0.08], [-0.07, 0.08], [0.07, 0.08]]
      : [[0, -0.07], [0, 0.075]];
    const r = type === "molar" ? 0.085 : 0.09;
    for (const [cx, cz] of cusps) d = smoothUnion(d, sphere(x, y, z, cx, h - 0.075, cz, r), 0.05);
    d = smoothCut(d, Math.hypot(z, y - h - 0.012) - 0.022, 0.03);
    if (type === "molar") d = smoothCut(d, Math.hypot(x, y - h - 0.012) - 0.022, 0.03);
    return d;
  };
};

const toothPaint = (type) => {
  const { h } = TOOTH_TYPES[type];
  return (x, y, z, out) => {
    const u = y / h;
    out.copy(C.ivory).lerp(C.cervical, smoothstep(0.35, 0.0, u));
    if (type === "incisor") out.lerp(C.edge, smoothstep(0.82, 1.0, u) * 0.8);
  };
};

let toothGeometries = null;
function getToothGeometries() {
  if (toothGeometries) return toothGeometries;
  toothGeometries = {};
  for (const type of Object.keys(TOOTH_TYPES)) {
    const { w, t, h } = TOOTH_TYPES[type];
    toothGeometries[type] = polygonize(toothShape(type), toothPaint(type), {
      res: 34,
      center: [0, (h - 0.42) / 2, 0],
      half: [w * 1.3, (h + 0.42) / 2 + 0.12, t * 1.4],
      maxPolys: 12000
    });
  }
  return toothGeometries;
}

/* ---------- 6. La arcada (forma de herradura) ---------- */
// Medidas de los dientes, del centro hacia atrás (1 unidad = 30 mm)
const UPPER = [
  { type: "incisor", w: 1.0, h: 1.0, tilt: 0.22 },
  { type: "incisor", w: 0.78, h: 0.88, tilt: 0.2 },
  { type: "canine", w: 1.0, h: 1.0, tilt: 0.12 },
  { type: "premolar", w: 1.0, h: 1.0, tilt: 0.04 },
  { type: "premolar", w: 0.95, h: 0.95, tilt: 0.03 },
  { type: "molar", w: 1.0, h: 1.0, tilt: 0.02 },
  { type: "molar", w: 0.92, h: 0.95, tilt: 0.02 }
];
const LOWER = [
  { type: "incisor", w: 0.66, h: 0.88, tilt: 0.12 },
  { type: "incisor", w: 0.72, h: 0.9, tilt: 0.12 },
  { type: "canine", w: 0.92, h: 0.98, tilt: 0.08 },
  { type: "premolar", w: 1.0, h: 0.95, tilt: 0.02 },
  { type: "premolar", w: 1.0, h: 0.95, tilt: 0.02 },
  { type: "molar", w: 1.1, h: 0.95, tilt: 0.01 },
  { type: "molar", w: 1.05, h: 0.92, tilt: 0.01 }
];

// Curva de la arcada: media elipse; s = distancia desde el centro
function makeArch(a, b, z0) {
  const steps = 400, table = [];
  let s = 0, prev = [0, z0 + b];
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * (Math.PI * 0.62);
    const p = [a * Math.sin(th), z0 + b * Math.cos(th)];
    s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    table.push({ s, th });
    prev = p;
  }
  // Punto, dirección y "hacia afuera" a cierta distancia s (negativa = lado izquierdo)
  return (sv) => {
    const sa = Math.abs(sv);
    let lo = 0, hi = table.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (table[mid].s < sa) lo = mid; else hi = mid; }
    const k = (sa - table[lo].s) / Math.max(1e-6, table[hi].s - table[lo].s);
    const th = mix(table[lo].th, table[hi].th, clamp(k, 0, 1)) * Math.sign(sv || 1);
    const x = a * Math.sin(th), z = z0 + b * Math.cos(th);
    let tx = a * Math.cos(th), tz = -b * Math.sin(th);
    const tl = Math.hypot(tx, tz); tx /= tl; tz /= tl;
    // normal hacia afuera (perpendicular a la curva)
    let nx = tz, nz = -tx;
    if (nx * x + nz * (z - z0) < 0) { nx = -nx; nz = -nz; }
    return { x, z, tx, tz, nx, nz };
  };
}

// Alto de la encía y grosor de los dientes a lo largo de la arcada
// (se mezcla suave entre un diente y el siguiente)
function profileAlong(teeth) {
  const sorted = [...teeth].sort((p, q) => p.s - q.s);
  return (s) => {
    let i = sorted.findIndex((t) => t.s > s);
    if (i === -1) i = sorted.length;
    const a = sorted[Math.max(0, i - 1)], b = sorted[Math.min(sorted.length - 1, i)];
    const k = a === b ? 0 : smoothstep(a.s, b.s, s);
    // Cerca del centro de un diente la encía baja; entre dientes sube (papila)
    const near = Math.abs(s - a.s) < Math.abs(s - b.s) ? a : b;
    const d = clamp(Math.abs(s - near.s) / near.half, 0, 1.4);
    return {
      base: mix(a.base, b.base, k),
      thick: mix(a.thick, b.thick, k),
      papilla: smoothstep(0.5, 1.05, d) * 0.085,
      bulge: Math.cos(clamp(d, 0, 1) * Math.PI * 0.5)
    };
  };
}

// Encía: una banda rosada que sigue la arcada y abraza cada diente
function gumGeometry(arch, profile, length, bottom) {
  const S = 160, P = 44;
  const ends = length + 0.1;
  const pos = [], idx = [];
  for (let i = 0; i <= S; i++) {
    const s = -ends + (2 * ends * i) / S;
    const f = arch(s);
    const g = profile(s);
    // Cierra la banda en las puntas, detrás de las últimas muelas
    const endK = Math.sqrt(clamp(1 - Math.pow(clamp((Math.abs(s) - (length - 0.04)) / 0.14, 0, 1), 2), 0, 1));
    const top = mix(bottom * 0.6 + g.base * 0.4, g.base + g.papilla, endK);
    const rn = (g.thick + 0.04 + 0.018 * g.bulge) * Math.max(endK, 0.001);
    const yc = (top + bottom) / 2, ry = (top - bottom) / 2;
    for (let j = 0; j < P; j++) {
      const phi = (j / P) * Math.PI * 2;
      const c = Math.cos(phi), sn = Math.sin(phi);
      // Perfil casi cuadrado con esquinas redondas
      const pn = Math.sign(c) * Math.pow(Math.abs(c), 0.45);
      const py = Math.sign(sn) * Math.pow(Math.abs(sn), 0.4);
      const y = yc + ry * py;
      // Más ancha abajo, como el hueso que sostiene los dientes
      const n = pn * rn * (1 + 0.3 * smoothstep(top - 0.05, bottom + 0.2, y));
      pos.push(f.x + f.nx * n, y, f.z + f.nz * n);
    }
  }
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < P; j++) {
      const a = i * P + j, b = i * P + ((j + 1) % P), c2 = (i + 1) * P + j, d2 = (i + 1) * P + ((j + 1) % P);
      idx.push(a, c2, b, b, c2, d2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return geometry;
}

// Paladar (arriba) o piso de la boca (abajo): cierra el centro de la herradura
function innerGeometry(arch, profile, length, center, depth) {
  const S = 90, R = 16;
  const pos = [], idx = [];
  for (let i = 0; i <= S; i++) {
    const s = -length + (2 * length * i) / S;
    const f = arch(s);
    const g = profile(s);
    const inset = g.thick + 0.03;
    const ex = f.x - f.nx * inset, ez = f.z - f.nz * inset;
    const top = g.base + 0.02;
    // Cada línea va del borde hacia la línea del centro (sin juntarse en un punto)
    const cz = mix(f.z - f.nz * 0.4, center[1], smoothstep(0, length, Math.abs(s)));
    for (let k = 0; k <= R; k++) {
      const u = k / R;
      pos.push(mix(ex, center[0], u), top - depth * Math.sin(Math.min(u * 1.5, 1) * Math.PI * 0.5), mix(ez, Math.min(cz, ez), u));
    }
  }
  for (let i = 0; i < S; i++) {
    for (let k = 0; k < R; k++) {
      const a = i * (R + 1) + k, b = a + 1, c2 = a + R + 1, d2 = c2 + 1;
      idx.push(a, c2, b, b, c2, d2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return geometry;
}

// Tapa plana que cierra el bloque de encía por el lado de la raíz
function plateGeometry(arch, profile, length, center, y) {
  const S = 90;
  const pos = [center[0], y, center[1]], idx = [];
  for (let i = 0; i <= S; i++) {
    const s = -length + (2 * length * i) / S;
    const f = arch(s);
    const out = (profile(s).thick + 0.04) * 1.12;
    pos.push(f.x + f.nx * out, y, f.z + f.nz * out);
    if (i > 0) idx.push(0, i, i + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  return geometry;
}

// Una arcada completa: 14 dientes + encía (+ paladar arriba).
// Se modela con las coronas hacia arriba; la de arriba se voltea después.
export function buildJaw({ upper = false, brackets = false, floor = true } = {}) {
  const set = upper ? UPPER : LOWER;
  const shape = upper ? [1.04, 1.32, -0.38] : [0.97, 1.2, -0.46];
  const arch = makeArch(...shape);
  const geos = getToothGeometries();
  const group = new THREE.Group();
  const enamel = enamelMaterial();
  const metal = brackets ? metalMaterial() : null;
  const teeth = [];

  // Reparte los dientes a lo largo de la curva, del centro hacia atrás
  let s = 0.004;
  set.forEach((spec) => {
    const T = TOOTH_TYPES[spec.type];
    const half = T.w * spec.w;
    s += half;
    // Las puntas quedan en el plano de mordida (y = 0); los de adelante de arriba bajan un poco más
    const lift = upper && (spec.type === "incisor" || spec.type === "canine") ? 0.06 : 0;
    const base = -T.h * spec.h - 0.01 + lift;
    teeth.push({ spec, s, half, thick: T.t, base }, { spec, s: -s, half, thick: T.t, base });
    s += half + 0.006;
  });
  const length = s;

  const wire = [];
  teeth.sort((p, q) => p.s - q.s).forEach((t) => {
    const f = arch(t.s);
    const T = TOOTH_TYPES[t.spec.type];
    const mesh = new THREE.Mesh(geos[t.spec.type], enamel);
    // Ejes del diente: x a lo largo de la curva, y hacia la punta, z hacia afuera
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(
      new THREE.Vector3(-f.nz, 0, f.nx),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(f.nx, 0, f.nz)
    ));
    mesh.rotateX(t.spec.tilt); // los de adelante se inclinan un poco hacia afuera
    mesh.scale.set(t.spec.w, t.spec.h, 1);
    mesh.position.set(f.x, t.base, f.z);
    mesh.updateMatrix();
    group.add(mesh);

    // Brackets: en incisivos, colmillos y premolares
    if (brackets && t.spec.type !== "molar") {
      const front = { incisor: 0.66, canine: 0.72, premolar: 1 }[t.spec.type] * T.t;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.075 / t.spec.w, 0.065 / t.spec.h, 0.03), metal);
      bracket.position.set(0, T.h * 0.52, front + 0.012).applyMatrix4(mesh.matrix);
      bracket.quaternion.copy(mesh.quaternion);
      bracket.scale.copy(mesh.scale);
      group.add(bracket);
      wire.push(new THREE.Vector3(0, T.h * 0.52, front + 0.03).applyMatrix4(mesh.matrix));
    }
  });
  if (wire.length > 2) {
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 200, 0.008, 8, false), metal));
  }

  const profile = profileAlong(teeth);
  group.add(new THREE.Mesh(gumGeometry(arch, profile, length, upper ? -0.78 : -0.74), gumMaterial()));
  if (!floor) { group.userData = { length }; return group; }
  const inner = new THREE.Mesh(
    innerGeometry(arch, profile, length - 0.02, [0, shape[2] - 0.15], upper ? 0.34 : 0.16),
    gumMaterial(upper ? 0xc4566b : 0xab4152)
  );
  inner.material.side = THREE.DoubleSide;
  group.add(inner);
  // Tapa plana por debajo (arriba, en la mandíbula superior): el bloque se ve sólido
  const bottom = upper ? -0.78 : -0.74;
  const plate = new THREE.Mesh(
    plateGeometry(arch, profile, length - 0.04, [0, shape[2] - 0.15], bottom + 0.04),
    gumMaterial()
  );
  plate.material.side = THREE.DoubleSide;
  group.add(plate);

  group.userData = { length };
  return group;
}

/* ---------- 7. La lengua ---------- */
export function buildTongue() {
  const geometry = new THREE.SphereGeometry(1, 64, 40);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const front = Math.max(0, z);
    let X = x * 0.6 * (1 - 0.28 * front * front);
    let Y = y * (y > 0 ? 0.2 : 0.16);
    const Z = z * 0.78;
    // Surco al centro y punta un poco más baja
    if (y > 0) Y -= 0.045 * Math.exp(-(X * X) / 0.02) * y;
    Y -= 0.06 * front * front;
    p.setXYZ(i, X, Y, Z);
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, gumMaterial(0xc44d5f));
}

/* ---------- 8. La boca completa ---------- */
// Arcada de abajo con la lengua y arcada de arriba, unidas por una bisagra
// atrás (como la mandíbula). setOpen(0) = cerrada, setOpen(1) = abierta.
export function buildMouth({ brackets = false } = {}) {
  const group = new THREE.Group();
  const hinge = new THREE.Vector3(0, 0.05, -1.05);
  const lower = buildJaw({ upper: false, brackets });
  const upper = buildJaw({ upper: true, brackets });
  upper.scale.y = -1; // la de arriba, volteada
  const tongue = buildTongue();
  tongue.position.set(0, -0.2, -0.28);
  lower.add(tongue);
  const [lowerPivot, upperPivot] = [lower, upper].map((jaw) => {
    const pivot = new THREE.Group();
    pivot.position.copy(hinge);
    jaw.position.sub(hinge);
    pivot.add(jaw);
    group.add(pivot);
    return pivot;
  });
  const setOpen = (open) => {
    upperPivot.rotation.x = -open * 0.5;
    lowerPivot.rotation.x = open * 0.1;
  };
  setOpen(0);
  return { group, setOpen, upper, lower };
}

/* ---------- 9. Escena: luz de estudio suave ---------- */
export function createStudio(canvas, { exposure = 1.1, fov = 28, pixelRatio } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(pixelRatio || Math.min(Math.max(window.devicePixelRatio || 1, 1.5) * 1.25, 2.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // Reflejos de un cuarto iluminado: dan el brillo del esmalte
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 60);

  // Luz principal arriba a la izquierda, luz de borde atrás y relleno suave
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xdff0ea, 1.1);
  rim.position.set(4, 1.5, -4);
  // Luz cálida desde abajo al frente: hace brillar el dorado de las raíces
  const warm = new THREE.DirectionalLight(0xffe4bd, 0.7);
  warm.position.set(1.5, -3, 4);
  scene.add(key, rim, warm, new THREE.HemisphereLight(0xffffff, 0xf2e6d6, 0.45));

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    return true;
  };
  return { renderer, scene, camera, resize };
}
