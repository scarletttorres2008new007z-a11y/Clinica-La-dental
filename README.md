# La Dental · Landing page

Página de una sola sección (landing) para **La Dental, Clínicas Especializadas**,
Centro Comercial Periplaza Apopa, local 31-D.

Es HTML, CSS y JavaScript puros: no necesita instalar nada ni compilar.
Para publicarla basta con arrastrar la carpeta (o el .zip) a Netlify Drop.

## Qué tiene

- Bienvenida con burbujas, el logo armándose letra por letra y una boca que se abre para entrar.
- Inicio con la foto real de la entrada en 3D y los datos clave: 6 tratamientos, 0% de prima y local 31-D.
- 01 Tratamientos: carrusel 3D con una foto por tratamiento (ortodoncia, limpieza, caries, endodoncia, cordales y prótesis).
- 02 Ortodoncia: su publicación real en 3D con 0% de prima y cuotas desde $24.99.
- 03 La clínica: fotos de la recepción y el consultorio que se abren como un libro al bajar.
- 04 Preguntas frecuentes.
- 05 Agenda tu cita: formulario que abre WhatsApp con el mensaje listo, mapa y rótulo de Periplaza.
- Barra fija con WhatsApp, ubicación y llamada.

Todas las fotos salen de las imágenes de la clínica. Si la clínica manda fotos con más
resolución, basta con reemplazar los archivos de `assets/img/` con el mismo nombre.

## Archivos

```
index.html            Estructura de la página (cada sección está marcada con un comentario)
css/base.css          Colores, letras, botones y logo
css/intro.css         Pantalla de bienvenida
css/layout.css        Encabezado, fotos en 3D, inicio, pie de página y barra de acciones
css/sections.css      Tratamientos, ortodoncia, la clínica, preguntas y agenda
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
