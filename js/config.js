/* ==========================================================
   L.a Dental · Datos de la clínica
   Este es el único archivo que hay que tocar para cambiar
   teléfono, WhatsApp, redes u horario. La página se actualiza sola.
   ========================================================== */

/*
 * Contacto y redes.
 * Si un campo queda vacío (""), su botón se esconde solo.
 *   whatsapp:   número con código de país, solo dígitos. Ej.: "50379795986"
 *   phone:      número para llamar, con código de país. Ej.: "+50379795986"
 *   phoneLabel: cómo se ve el número en la página
 */
const CONFIG = {
  whatsapp: "50379795986",
  phone: "+50379795986",
  phoneLabel: "7979-5986",
  instagram: "",
  facebook: "",

  // Mapa: búsqueda de Periplaza Apopa en Google Maps
  maps: "https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Periplaza+Apopa",
  mapEmbed: "https://maps.google.com/maps?q=Centro%20Comercial%20Periplaza%20Apopa%2C%20Apopa&z=16&output=embed"
};

/*
 * Horario que se muestra en "Visítanos".
 * Escribe una línea por cada grupo de días. Si se deja vacío [],
 * el bloque de horario no aparece.
 * Ejemplo:
 *   const HORARIO = [
 *     "Lunes a viernes: 8:00 a.m. a 5:00 p.m.",
 *     "Sábado: 8:00 a.m. a 12:00 m."
 *   ];
 */
const HORARIO = [];
