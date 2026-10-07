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

console.log(JSON.stringify({ publishDirectory: repositoryRoot, verified }, null, 2));
