# Auditoría técnica DDV

Fecha de corte: 8 de octubre de 2026  
Alcance: estado completo del working tree local y comprobaciones de lectura sobre el despliegue público `https://diariodeunavola.netlify.app`.  
Restricciones respetadas: no se instalaron dependencias, no se modificó código fuente, no se hicieron commits y no se desplegó.

## Resumen ejecutivo

DDV es un sitio estático de 498 documentos HTML, publicado directamente desde la raíz del repositorio en Netlify. El contenido editorial, los eventos y las fichas de producto están materializados como HTML; no hay CMS, API ni base de datos de aplicación en el repositorio. La capa compartida se monta progresivamente con `editorial-system.js`, mientras `script.js` concentra navegación, formularios, búsqueda, catálogo, favoritos y pedido.

La base es funcional y el recorrido no encontró un P0. Las 497 URLs declaradas en `sitemap.xml` respondieron 200 en el servidor local; no aparecieron referencias locales rotas ni excepciones JavaScript en 24 plantillas representativas. El responsive de las siete portadas críticas no mostró overflow a 1440, 1024, 768, 430 ni 390 px. Sin embargo, hay P1 claros: cuatro imágenes editoriales fallan con 403, el newsletter puede aceptar una selección inválida, los paneles de pedido/favoritos no se comportan como diálogos accesibles, existen rutas duplicadas indexables y el pipeline de catálogo/búsqueda no es reproducible desde los archivos presentes.

### Cifras de la auditoría

| Indicador | Resultado |
|---|---:|
| Archivos del repositorio auditados | 520 |
| Documentos HTML | 498 |
| URLs en sitemap | 497 |
| URLs del sitemap con respuesta local 200 | 497/497 |
| Referencias locales faltantes | 0 |
| Imágenes declaradas en HTML | 2.893 |
| Imágenes sin atributo `alt` | 0 |
| Imágenes con `alt=""` decorativo | 2 |
| Imágenes con `width` y `height` intrínsecos | 0 |
| Productos en fuente JSON/JS | 436 |
| Productos publicables y fichas generadas | 415 |
| Filas de producto descartadas por nombre inválido | 21 |
| Entradas del índice de búsqueda | 469 |
| Excepciones JavaScript en recorrido representativo | 0 |
| Recursos externos de contenido comprobados | 434 útiles; 430 OK y 4 con 403 |

## Metodología y límites

- Inventario recursivo del repositorio y lectura de todos los HTML, CSS, JavaScript, JSON, sitemap, robots y configuración Netlify.
- Resolución estática de `href`, `src`, `srcset` y `action`, incluyendo rutas limpias, `.html` e `index.html`.
- Recorrido HTTP de las 497 URLs del sitemap contra un servidor local de solo lectura.
- Ejecución en Edge headless de 24 rutas representativas de todas las familias, con captura de errores JavaScript, respuestas 4xx y recursos fallidos.
- QA responsive de `/index.html`, las cinco portadas de categoría y `/eventos` a 1440, 1024, 768, 430 y 390 px.
- Pruebas sin efectos externos de menú, búsqueda, catálogo, carrito, favoritos y validación de newsletter. No se envió un pedido por WhatsApp ni se hizo un envío real al panel de Netlify Forms.
- Comprobación HTTP del despliegue público y de 434 recursos de contenido externos. Los enlaces `wa.me` no se invocaron para evitar iniciar acciones externas.

La auditoría refleja también cambios locales ya presentes antes de crear este documento. Esos cambios no fueron alterados.

## Arquitectura observada

| Capa | Implementación | Observación |
|---|---|---|
| Publicación | Sitio estático; `publish = "."` | Netlify sirve el repositorio completo como artefacto público. |
| Build | `node scripts/verify-public-output.mjs` | Es una verificación de marcadores en siete rutas, no una compilación ni suite de pruebas. |
| Shell global | `editorial-system.js` | Sustituye en runtime headers y footers heredados; home y tienda usan además `<ddv-header>`/`<ddv-footer>`. |
| Estilos | Un único `styles.css` de 217.201 bytes locales | Contiene estilos históricos, catálogo, revista y sistema editorial actual. |
| Interacción general | `script.js` | Menú, compartir, newsletter, catálogo, carrito, favoritos y búsqueda. |
| Revista | `revista.js` | Lector paginado, índice modal, teclado, gestos, fullscreen e impresión. |
| Contenido editorial | HTML en `notas/`, archivos y categorías | Sin CMS ni API; el HTML es la fuente de publicación. |
| Eventos | `eventos.html`, `eventos/index.html`, `eventos/archivo.html` y tres fichas | La portada puede leer el archivo por `fetch` para destacar eventos pasados. |
| Catálogo | `products.json` y `products-data.js` | Exportación estática declarada desde un Excel no incluido. |
| Búsqueda | `site-search.js` | Índice estático cargado y filtrado completamente en el cliente. |
| Estado de compra | `localStorage` + CSV + WhatsApp | No existe backend de pedidos, pago, reserva ni control de stock. |

## Inventario de rutas públicas

El sitemap contiene 497 URLs. El archivo `404.html` completa los 498 HTML, pero correctamente no figura en el sitemap.

| Familia de rutas | Cantidad | Rutas / patrón | Fuente o plantilla |
|---|---:|---|---|
| Home | 1 | `/` | `index.html` |
| Páginas raíz de soporte | 11 | `/buscar.html`, `/comunidad.html`, `/contacto.html`, `/contenido-patrocinado.html`, `/gracias.html`, `/orientacion.html`, `/politica-editorial.html`, `/politica-privacidad.html`, `/sobre-ddv.html`, `/suscripcion.html`, `/terminos.html` | HTML raíz + shell progresivo |
| Archivo editorial | 1 | `/notas.html` | `notas.html` |
| Artículos | 44 | `/notas/*.html` | HTML individual de artículo |
| Portadas canónicas de sección | 4 | `/actualidad/`, `/cultivo/`, `/cultura/`, `/legislacion/` | `*/index.html` |
| Categorías históricas | 7 | `/categorias/actualidad.html`, `/categorias/ciencia-salud.html`, `/categorias/cultivo.html`, `/categorias/cultura.html`, `/categorias/entrevistas.html`, `/categorias/legislacion.html`, `/categorias/opinion.html` | HTML de archivo por categoría |
| Eventos | 6 | `/eventos.html`, `/eventos/`, `/eventos/archivo.html` y tres actividades | HTML estático + mejora en `editorial-system.js` |
| Tienda | 1 | `/catalogo.html` (`/catalogo` funciona como pretty URL en Netlify) | `catalogo.html` |
| Productos | 415 | `/productos/*.html` | Fichas estáticas generadas |
| Revista | 2 | `/revista/`, `/revista/edicion-1/` | Portada y lector de edición |
| Series | 4 | `/series/*/` | HTML contenedor + registro de capítulos en JS |
| Autores | 1 | `/autores/equipo-ddv.html` | HTML estático |

## Componentes y comportamientos compartidos

| Componente / módulo | Archivo | Uso |
|---|---|---|
| `DDVHeader`, `DDVFooter` | `editorial-system.js:131-150` | Shell visual global. |
| `DDVContainer` | `editorial-system.js:153-161` | Eje y gutters editoriales. |
| `CategoryHero`, `ArticleCard` | `editorial-system.js:164-201` | Portadas de categoría y artículo destacado. |
| `ddv-ad-banner` | `script.js:9-62` | Slots editoriales/publicitarios con placeholder honesto. |
| `ddv-note`, `ddv-fact-box`, `article-image`, `article-ad` | `editorial-system.js:278-329` | Bloques de lectura reutilizables. |
| `related-articles`, `article-navigation` | `editorial-system.js:331-374` | Relacionados y navegación entre artículos. |
| `ddv-product-recommendations` | `editorial-system.js:378-412` | Preparado para recomendaciones, pero sin mapa de relaciones configurado en el repo. |
| Portadas de categoría | `editorial-system.js:660-718` | Destacado, últimas publicaciones, series, “ver más” y newsletter. |
| Portada de eventos | `editorial-system.js:776-827` | Manejo de agenda vacía y promoción del archivo histórico. |
| Catálogo, carrito y favoritos | `script.js:138-849` | Filtrado, render, persistencia local, CSV y salida a WhatsApp. |
| Buscador | `script.js:852-933` | Filtro cliente de `site-search.js`. |
| Lector de revista | `revista.js` | Paginación, índice, teclado, gestos, impresión y fullscreen. |

## Origen de datos

| Dominio | Origen comprobado | Actualización / riesgo |
|---|---|---|
| Artículos | 44 archivos en `notas/`; listados duplicados en `notas.html` y categorías | No hay CMS ni generador. Cada alta/cambio exige mantener varias superficies manualmente. |
| Eventos | Tres fichas en `eventos/` y archivo `eventos/archivo.html` | No hay calendario/API. La portada reutiliza el HTML del archivo con `fetch`. |
| Productos | `products.json` y `products-data.js`; metadata declara `catalogo-categorizacion-ddv (1).xlsx` | El Excel y el script generador no están en el repositorio. |
| Búsqueda | `site-search.js`: 44 artículos, 7 categorías, 3 eventos y 415 productos | No hay generador presente; hoy coincide con las cantidades publicadas, pero puede desincronizarse. |
| Series | Registro manual `seriesRegistry` en `editorial-system.js:16-65` | Los capítulos apuntan a artículos existentes. |

## Funcionalidad comprobada

| Área | Resultado |
|---|---|
| Navegación global | En las 24 plantillas probadas termina mostrando `Actualidad · Cultivo · Cultura · Ley · Ciencia · Eventos · Tienda · Revista →`. El menú móvil abre y actualiza `aria-expanded`. |
| Enlaces internos | Cero destinos faltantes en el análisis estático; 497/497 URLs del sitemap dieron 200 local. |
| Buscador | Carga 469 entradas, toma `?q=`, filtra en vivo y actualiza URL. La búsqueda “cultivo” devolvió 302 coincidencias, sin ranking. |
| Catálogo | Renderiza 36 de 415 productos inicialmente y permite cargar más. |
| Carrito | Agregar producto actualiza `localStorage`, contador y total. |
| Favoritos | Guardar producto actualiza `localStorage` y `aria-pressed`. |
| Pedido | Genera CSV y abre un mensaje prearmado de WhatsApp; no crea una orden en servidor. |
| Formularios | Existen definiciones Netlify para newsletter, contacto y orientación. La recepción real no puede confirmarse sin panel o envío de prueba. |
| SEO base | Los 498 HTML tienen `title`, descripción, canonical, `lang`, viewport y exactamente un `h1`. Los JSON-LD encontrados parsean correctamente. |
| Responsive | Sin overflow en las siete portadas críticas a 1440/1024/768/430/390. Categorías: 3/2/1 columnas según ancho; ejes laterales coincidentes. |
| Consola | Cero excepciones JavaScript en el recorrido. Los únicos errores de consola confirmados provienen de cuatro imágenes Wix con 403. |

## Problemas comprobados

Escala: P0 bloquea el negocio o implica pérdida/seguridad crítica; P1 afecta una función, contenido o calidad esencial; P2 es deuda o mejora importante sin bloqueo inmediato. Esfuerzo relativo: XS, S, M, L, XL.

| Ruta | Problema | Evidencia | Archivo implicado | Gravedad | Solución recomendada | Esfuerzo |
|---|---|---|---|---|---|---|
| `/`, `/cultura/`, `/categorias/ciencia-salud.html` y cuatro artículos relacionados | Cuatro imágenes editoriales no cargan | Edge y comprobación HTTP reciben 403. Afectan “Weed Of the Room Vol. 3”, “¿Qué es el kif?”, “Mi polen kif” y “Fitocannabinoides”. | `index.html:52,82`; `cultura/index.html:99,113,141`; `categorias/ciencia-salud.html:85`; artículos correspondientes | P1 | Recuperar las imágenes originales, alojarlas como assets controlados por DDV y actualizar HTML, OG, Twitter y JSON-LD. | S |
| `/suscripcion.html` | La validación personalizada llega después del envío asíncrono | Hay dos listeners: el primero hace `fetch("/")` (`script.js:99-129`) y el segundo valida intereses (`script.js:935-966`). Con email/frecuencia/consentimiento válidos pero sin tema, mostró error y aun así navegó a `/gracias.html?form=newsletter-ddv`. | `script.js:99-129,935-966`; `suscripcion.html:93` | P1 | Unificar validación y envío en un único listener; validar antes de deshabilitar o ejecutar `fetch`; añadir prueba de regresión. | S |
| `/catalogo` y `/catalogo.html` | Pedido y favoritos se abren como paneles visuales, no como diálogos accesibles | El foco queda en `body`, los `aside` no tienen `role="dialog"`/`aria-modal`, no hay focus trap ni restauración; el fondo permanece navegable. | `catalogo.html:277-316`; `script.js:529-555` | P1 | Implementar diálogo accesible: foco inicial, trampa y retorno, `role="dialog"`, `aria-modal`, bloqueo/inert del fondo y Escape consistente. | M |
| Categorías y eventos | Varias URLs publican contenido duplicado con canonical propio | Los pares `/actualidad/`–`/categorias/actualidad.html`, cultivo, cultura y legislación comparten todos sus enlaces de artículos; `/eventos.html` y `/eventos/` también se duplican. Ambos lados aparecen en sitemap y se autocanonicalizan. | Canónicos en cada par (`*:8`); `sitemap.xml:72-124` | P1 | Elegir una URL por contenido, redirigir aliases con 301, retirar duplicados del sitemap y apuntar todos los canonical a la URL elegida. | M |
| Todo el sitio | No existe una suite automatizada de enlaces, consola, formularios, a11y ni responsive | No hay `package.json`, framework de test ni CI. El único build gate verifica strings en siete archivos. | `netlify.toml:1-3`; `scripts/verify-public-output.mjs:6-42` | P1 | Convertir el auditor de rutas en tests versionados; añadir smoke E2E para familias, enlaces, consola, formularios, carrito, búsqueda y breakpoints. | L |
| Catálogo y búsqueda | El pipeline no es reproducible desde el repositorio | README dice regenerar desde Excel, pero no existe el `.xlsx` ni generador; tampoco existe generador de `site-search.js`, sitemap o 415 fichas. | `README.md:26`; `products.json:2-3`; ausencia en `scripts/` | P1 | Versionar la fuente autorizada o documentar su ubicación segura y añadir un generador determinista para JSON, JS, fichas, búsqueda y sitemap, con validaciones. | L |
| Catálogo | La fuente contiene 21 filas inválidas y no contiene stock | 21 productos tienen nombre `-25%` y se filtran en JS; 436/436 tienen `stock` vacío; 40 no tienen SKU. La tienda muestra 415 publicables. | `products.json:2559` y otras 20 ocurrencias; `products.json:58` y todas las filas; filtro en `script.js:139-143` | P1 | Corregir la extracción en la fuente, validar esquema/nombre/SKU/stock antes de generar y fallar el build ante filas anómalas. | M |
| Todas las páginas interiores | El shell global depende de JavaScript y convive con 485 copias del header antiguo en el HTML fuente | `script.js` carga dinámicamente el sistema (`script.js:970-975`) y `installGlobalShell` reemplaza `innerHTML` (`editorial-system.js:203-225`). Si JS falla o tarda, aparece navegación obsoleta y hay dos fuentes de verdad. | 485 HTML; `script.js:970-975`; `editorial-system.js:203-225` | P1 | Generar el shell común en build/includes o mantener un único componente estático; usar mejora progresiva solo para conducta, no para corregir navegación. | L |
| `/catalogo*` y 415 fichas | Cada página de producto carga el catálogo completo | `products-data.js` pesa 570.524 bytes sin comprimir y se incluye en 416 HTML. En producción comprime bien (~29 KB observado), pero se revalida y parsea completo incluso en una ficha. | `products-data.js`; `catalogo.html:320`; `productos/*:318` | P2 | Separar datos mínimos de carrito/ficha, cargar el catálogo completo solo en la tienda y aplicar versionado/cache largo a assets. | M |
| Todo el sitio | Ninguna imagen declara dimensiones intrínsecas | 0 de 2.893 `<img>` tienen ambos atributos `width` y `height`. Aunque varias tarjetas reservan aspecto por CSS, no todos los contextos garantizan espacio previo. | `index.html:43-82`, `productos/*:74` y resto de HTML | P2 | Añadir dimensiones o `aspect-ratio` verificable desde el generador para reducir CLS; conservar `loading` y `decoding`. | M |
| Todo el sitio | CSS monolítico y no minificado | `styles.css` pesa 217.201 bytes locales y contiene más de 10.000 líneas para todas las superficies. | `styles.css` | P2 | Mantener tokens globales, pero dividir por capas/entrada, eliminar reglas muertas y minificar en build sin alterar la identidad visual. | M |
| Despliegue Netlify | Assets sin política de caché duradera y sin cabeceras defensivas explícitas | `styles.css`, `products-data.js` y `editorial-system.js` responden `Cache-Control: public,max-age=0,must-revalidate`. `netlify.toml` no define headers; en la respuesta solo se observó HSTS entre los headers defensivos comunes. | `netlify.toml:1-3`; respuestas HTTP del 08-10-2026 | P2 | Añadir nombres versionados o hashes, cache inmutable para assets y una política revisada de CSP, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy`. | M |
| `/buscar.html` | Resultados sin ranking ni paginación | “cultivo” devuelve 302 resultados y renderiza todos; la coincidencia es un `includes` uniforme sobre todos los campos. | `script.js:861-906`; `site-search.js` | P2 | Ponderar título/categoría antes que extracto, ordenar por relevancia/fecha y limitar o paginar resultados. | M |
| `/catalogo*` | El “pedido” no es una orden persistente | Carrito y favoritos solo viven en `localStorage`; finalizar descarga CSV y abre WhatsApp. No hay ID, recibo, backend, bloqueo de precio ni reserva de stock. La interfaz sí advierte que precio/disponibilidad se confirman. | `script.js:372-380,469-477,560-608,832-846` | P2 | Si el objetivo comercial requiere trazabilidad, crear un endpoint/formulario de pedido y confirmación; si no, documentar formalmente que es una cotización por WhatsApp. | M/L |
| `/series/*/` | Metadatos sociales y schema incompletos | Las cuatro series son las únicas páginas sin `og:title`, `og:image`, Twitter Card ni JSON-LD. | `series/*/index.html` | P2 | Añadir metadatos sociales y `CollectionPage`/`ItemList` o schema de serie coherente con el resto. | S |
| `/contacto.html` | Formulario sin honeypot | Contacto tiene `data-netlify="true"` pero, a diferencia de newsletter y orientación, no incluye `netlify-honeypot`. | `contacto.html:72`; comparación con `orientacion.html:80` | P2 | Añadir honeypot y revisar protección antispam/rate limit en Netlify. | XS |
| `/404.html` | Página de error indexable | Tiene canonical y no declara `noindex`; no está en sitemap, pero puede ser descubierta. | `404.html` | P2 | Añadir `meta name="robots" content="noindex,follow"` y comprobar que Netlify responde realmente 404 para rutas inexistentes. | XS |
| Despliegue | Working tree y producción no son idénticos | Por ejemplo, `eventos.html` local mide 5.340 bytes y la respuesta pública de `/eventos` 3.092 bytes; CSS y datos también difieren. Hay cambios locales no desplegados. | Working tree actual; respuestas Netlify del 08-10-2026 | P2 | Antes de publicar, revisar diff, ejecutar QA completa y desplegar un commit reproducible; registrar SHA del deploy. | S |

## Sospechas o verificaciones pendientes

Estas entradas no se deben tratar como fallos confirmados hasta realizar la prueba indicada.

| Ruta | Sospecha pendiente | Evidencia disponible | Archivo implicado | Gravedad potencial | Prueba / solución recomendada | Esfuerzo |
|---|---|---|---|---|---|---|
| Newsletter, contacto y orientación | No está confirmada la recepción real en Netlify Forms | El markup es compatible y contiene `form-name`, pero no hubo acceso al panel ni envío externo autorizado. | `index.html:132`; `suscripcion.html:93`; `contacto.html:72`; `orientacion.html:80` | P1 | En deploy de staging, enviar una entrada única por formulario y confirmar recepción, notificación, exportación y página de éxito en el panel. | S |
| `/catalogo*` | El envío final puede ser bloqueado por navegador o perder contexto | No se accionó `window.open` para evitar una comunicación externa; el flujo depende de descarga + popup de WhatsApp. | `script.js:832-846` | P1 | Probar en Safari/iOS, Chrome/Android y desktop; separar descarga de apertura o mostrar confirmación/alternativa copiable. | S |
| Todo el sitio | Contraste, orden de lectura y anuncio por lector de pantalla | El análisis confirmó labels, skip links, foco visible y alt; no sustituyen una prueba WCAG manual. | `styles.css`, todas las plantillas | P1 | Ejecutar axe/Lighthouse y prueba manual con NVDA/VoiceOver, teclado y zoom 200/400 %. | M |
| Netlify | Autodeploy, previews y rollback no confirmados | No hay workflow CI en el repo; la configuración del sitio vive fuera del código. | `netlify.toml`, panel Netlify | P1 | Revisar rama de producción, build hooks, deploy previews, variables, historial y rollback desde el panel. | S |
| Productos | Vigencia comercial de precios, margen y disponibilidad | `generatedAt` es 2026-07-19; todos los stocks están vacíos y el sitio confirma por WhatsApp. | `products.json`, `products-data.js` | P1 | Contrastar muestra de SKUs con proveedor y definir caducidad/frecuencia de actualización. | M |
| Rendimiento | Core Web Vitals reales | Se observaron pesos y fallos de recursos, pero no hay RUM ni medición de campo. | Todo el sitio | P2 | Medir LCP/CLS/INP en producción por plantilla y conexión móvil; fijar presupuestos de rendimiento. | M |
| Enlaces externos de acción | WhatsApp y comportamiento de Instagram en todos los clientes | No se invocaron enlaces `wa.me`; Instagram respondió, pero no se autenticó ni probó deep linking. | HTML y `script.js` | P2 | Smoke manual sin enviar mensajes, verificando número, texto y fallback web/app. | S |
| Privacidad | Retención y consentimiento fuera del front-end | La UI solicita consentimiento, pero la política operativa de Netlify/WhatsApp no es visible en el código. | Formularios y `politica-privacidad.html` | P2 | Revisar retención, acceso, baja, encargados de tratamiento y trazabilidad con responsables del negocio. | M |

## Prioridad de remediación sugerida

1. Recuperar las cuatro imágenes 403 y corregir el doble listener del newsletter.
2. Hacer accesibles los paneles de carrito/favoritos.
3. Consolidar aliases de categorías/eventos con 301 y canonical único.
4. Incorporar generación reproducible y validación del catálogo/búsqueda/sitemap.
5. Ampliar el build gate a una suite de rutas, consola, enlaces y flujos críticos.
6. Reducir dependencia del shell corregido en runtime y de la duplicación de 498 HTML.
7. Completar caché, seguridad, metadatos de series y medición de rendimiento.

No se recomienda un rediseño total: la identidad actual —fondo blanco, tipografía editorial fuerte, color acento e intervenciones manuscritas— puede preservarse mientras se corrigen estos puntos de arquitectura, calidad y operación.
