import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicOutputs = [
  ["/actualidad/", "actualidad/index.html"],
  ["/cultivo/", "cultivo/index.html"],
  ["/cultura/", "cultura/index.html"],
  ["/legislacion/", "legislacion/index.html"],
  ["/categorias/ciencia-salud.html", "categorias/ciencia-salud.html"],
  ["/eventos", "eventos.html"],
  ["/eventos/", "eventos/index.html"],
  ["/revista/planes/", "revista/planes/index.html"],
  ["/revista/pedido/", "revista/pedido/index.html"],
  ["/revista/confirmacion/", "revista/confirmacion/index.html"],
];

const requiredMarkup = [
  '<ddv-header></ddv-header>',
  '<ddv-footer></ddv-footer>',
  '<script src="/editorial-system.js" defer></script>',
];
const forbiddenOldHeaderMarkup = [
  '<a href="/index.html">Inicio</a>',
  '<a href="/catalogo.html">Catálogo</a>',
  '<a href="/comunidad.html">Comunidad</a>',
  'Buscar en Diario de una Vola',
  '>Suscribirme</a>',
];

const verified = [];
for (const [route, relativeFile] of publicOutputs) {
  const absoluteFile = path.join(repositoryRoot, relativeFile);
  const html = await readFile(absoluteFile, "utf8");
  for (const marker of requiredMarkup) {
    if (!html.includes(marker)) throw new Error(`${route}: falta ${marker} en ${relativeFile}`);
  }
  for (const marker of forbiddenOldHeaderMarkup) {
    if (html.includes(marker)) throw new Error(`${route}: persiste el header antiguo en ${relativeFile}: ${marker}`);
  }
  verified.push({ route, file: relativeFile });
}

const editorialProducts = await readFile(path.join(repositoryRoot, "editorial-products.js"), "utf8");
for (const marker of ['id: "caja-ddv-01"', "price: 15990", 'id: "suscripcion-ddv-anual"', "price: 29990", 'id: "club-ddv-anual"', "price: 39990"]) {
  if (!editorialProducts.includes(marker)) throw new Error(`Catálogo editorial: falta ${marker}`);
}

const orderPage = await readFile(path.join(repositoryRoot, "revista/pedido/index.html"), "utf8");
if (!orderPage.includes('type="submit" disabled aria-disabled="true"')) throw new Error("Pedido editorial: el cobro debe permanecer deshabilitado");
if (orderPage.includes("data-netlify") || orderPage.includes('method="post"')) throw new Error("Pedido editorial: no debe enviar datos antes de habilitar ventas");

console.log(JSON.stringify({ publishDirectory: repositoryRoot, verified }, null, 2));
