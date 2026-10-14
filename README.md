# L.a Dental · Landing page

Página de una sola sección (landing) para **L.a Dental, Clínicas Especializadas**,
Centro Comercial Periplaza Apopa, local 31-D.

Es HTML, CSS y JavaScript puros: no necesita instalar nada ni compilar.
Para publicarla basta con arrastrar la carpeta (o el .zip) a Netlify Drop.

## Qué tiene

- Bienvenida con burbujas, el logo armándose letra por letra y una boca que se abre para entrar.
- Inicio en menta con formas blancas (como sus publicaciones), diente 3D y atajo "¿Qué necesitas hoy?".
- Mapa de tu sonrisa: la persona toca el diente que le molesta y ve qué tratamiento le puede servir.
- Tratamientos en pestañas: ortodoncia, limpieza, caries, endodoncia, cordales y prótesis.
- Cupón de ortodoncia: 0% de prima y cuotas desde $24.99, con sonrisa de brackets.
- Tu primera visita en 4 pasos.
- Fotos reales de la clínica y la frase de la pared del consultorio.
- Consejos en tarjetas estilo publicación que se pasan con el dedo.
- Preguntas frecuentes y formulario "Agenda tu cita" que abre WhatsApp con el mensaje listo.
- Mapa, rótulo de Periplaza y barra fija con WhatsApp, ubicación y llamada.

## Archivos

```
index.html            Estructura de la página (cada sección está marcada con un comentario)
css/base.css          Colores, letras, botones y logo
css/intro.css         Pantalla de bienvenida
css/layout.css        Encabezado, inicio, confianza, pie de página y barra de acciones
css/sections.css      Mapa de la sonrisa, tratamientos, cupón, visita, clínica, consejos, preguntas y agenda
css/responsive.css    Ajustes para celular, tablet y computadora
js/config.js          Datos de la clínica (el único archivo que hay que editar)
js/intro.js           Animación de bienvenida
js/main.js            Funciones de la página
assets/img/           Fotos, ícono y la imagen para compartir el enlace
```

## Cambiar datos

Todo está en `js/config.js`:

- `whatsapp`, `phone`, `phoneLabel`: número de la clínica.
- `instagram`, `facebook`: enlaces de redes (si están vacíos, el botón no aparece).
- `HORARIO`: líneas del horario (si está vacío, no se muestra).

## Probar en la computadora

Abre una terminal en esta carpeta y ejecuta:

```
python3 -m http.server 8000
```

Luego entra a http://localhost:8000 (también desde el celular, en la misma red Wi-Fi).
