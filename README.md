# Diario de una Vola - sitio con catalogo

Esta carpeta contiene la version estatica del sitio y el primer catalogo cargado desde el Excel de productos.

## Archivos principales

- `index.html`: estructura principal de la pagina.
- `notas.html`: archivo editorial con notas migradas desde Wix.
- `notas/`: paginas individuales de notas.
- `styles.css`: diseno visual y version movil.
- `script.js`: menu movil, buscador, filtros y carga del catalogo.
- `products-data.js`: datos que usa la web para mostrar los productos.
- `products.json`: copia legible del catalogo exportado.
- `gracias.html`: pagina de confirmacion del formulario.

## Como verla

Abre `index.html` en el navegador.

## Como publicarla

Sube el contenido completo de esta carpeta a Netlify, o sube el archivo ZIP generado desde esta carpeta.

## Como actualizar productos despues

Mantendremos el Excel como fuente de trabajo. Cuando cambien precios, fotos o estados, se actualiza el Excel y se vuelve a generar `products-data.js` para publicar una nueva version.
