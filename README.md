# La Dental · Landing page

Página de una sola sección (landing) para **La Dental, Clínicas Especializadas**,
Centro Comercial Periplaza Apopa, local 31-D.

Es HTML, CSS y JavaScript puros: no necesita instalar nada ni compilar.
Para publicarla basta con arrastrar la carpeta (o el .zip) a Netlify Drop.

## Qué tiene

- Bienvenida con burbujas, el logo armándose letra por letra y una boca que se abre para entrar.
- Inicio con una muela 3D real (corona blanco perla y raíces doradas) dentro del círculo y la sonrisa dorada del logo. Gira sola y se puede girar con el dedo o el mouse para verla desde todos los ángulos. Al lado, los datos clave: 6 tratamientos, 0% de prima y local 31-D.
- 01 Tratamientos: primero la boca completa en 3D (dientes, encías y lengua) que se abre y gira mientras bajas; después un carrusel 3D donde cada tarjeta lleva su publicación de Instagram completa y un modelo 3D del tratamiento (brackets, muela limpia, caries, endodoncia, su imagen de la muela del juicio y prótesis).
- 02 Ortodoncia: su publicación real en 3D con 0% de prima y cuotas desde $24.99.
- 03 La clínica: la entrada, la recepción y el consultorio; las dos últimas se abren como un libro al bajar.
- 04 Preguntas frecuentes; las de consejos muestran su publicación al abrirse.
- 05 Agenda tu cita: formulario que abre WhatsApp con el mensaje listo, mapa y rótulo de Periplaza.
- Barra fija con WhatsApp, ubicación y llamada.

Todas las fotos salen de las imágenes de la clínica. Si la clínica manda fotos con más
resolución, basta con reemplazar los archivos de `assets/img/` con el mismo nombre.

Los modelos 3D (muela y boca) se arman con código en `js/dental3d.js`; no usan modelos
descargados. Las imágenes `3d-*.webp`, `diente-3d.webp` y `boca-3d.webp` son fotos de esos
mismos modelos: se ven en las tarjetas y en celulares que no pueden mostrar 3D.

## Archivos

```
index.html            Estructura de la página (cada sección está marcada con un comentario)
css/base.css          Colores, letras, botones y logo
css/intro.css         Pantalla de bienvenida
css/layout.css        Encabezado, fotos en 3D, inicio, pie de página y barra de acciones
css/sections.css      Boca 3D, tratamientos, ortodoncia, la clínica, preguntas y agenda
css/responsive.css    Ajustes para celular, tablet y computadora
js/config.js          Datos de la clínica (el único archivo que hay que editar)
js/intro.js           Animación de bienvenida
js/main.js            Funciones de la página
js/dental3d.js        Modelos 3D: la muela y la boca completa (dientes, encías y lengua)
js/tooth3d.js         Muela 3D del inicio que se gira (sin 3D queda assets/img/diente-3d.webp)
js/mouth3d.js         Boca 3D que se abre al bajar (sin 3D queda assets/img/boca-3d.webp)
js/vendor/            Three.js, la librería que dibuja el 3D (licencia MIT)
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
