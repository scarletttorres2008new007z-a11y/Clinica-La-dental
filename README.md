# L.a Dental · Landing page

Página de una sola sección (landing) para **L.a Dental, Clínicas Especializadas**,
Centro Comercial Periplaza Apopa, local 31-D.

Es HTML, CSS y JavaScript puros: no necesita instalar nada ni compilar.
Para publicarla basta con arrastrar la carpeta (o el .zip) a Netlify Drop.

## Qué tiene

- Bienvenida con burbujas, el logo armándose letra por letra y una boca que se abre para entrar.
- Inicio con un diente en 3D y tarjetas flotantes de la promoción.
- Servicios en tarjetas que giran: ortodoncia, limpieza, caries, cordales, endodoncia y prótesis.
- Promoción de ortodoncia: 0% de prima y cuotas desde $24.99.
- Guía "¿Qué le pasa a tu sonrisa?" que recomienda un servicio y abre WhatsApp con el mensaje listo.
- Carrusel 3D con fotos reales de la clínica.
- Consejos, mapa, teléfono y botón flotante de WhatsApp.

## Archivos

```
index.html            Estructura de la página (cada sección está marcada con un comentario)
css/base.css          Colores, letras, botones y logo
css/intro.css         Pantalla de bienvenida
css/layout.css        Encabezado, inicio, cinta, pie de página y botón flotante
css/sections.css      Servicios, promoción, guía, clínica, consejos y visítanos
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
