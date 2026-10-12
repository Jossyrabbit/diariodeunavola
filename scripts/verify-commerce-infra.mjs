import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

const catalog = JSON.parse(await read("data/editorial-products.json"));
const expected = new Map([
  ["caja-ddv-01", { price: 15990, photo: true, deliveries: 1 }],
  ["suscripcion-ddv-anual", { price: 29990, photo: false, deliveries: 3 }],
  ["club-ddv-anual", { price: 39990, photo: false, deliveries: 3 }],
]);

for (const product of catalog) {
  const rule = expected.get(product.id);
  if (!rule) throw new Error(`Producto editorial no autorizado: ${product.id}`);
  if (product.price_clp !== rule.price || product.currency !== "CLP") throw new Error(`Precio no autorizado: ${product.id}`);
  if (product.collectible_photo_eligible !== rule.photo) throw new Error(`Elegibilidad de fotografía incorrecta: ${product.id}`);
  if (product.delivery_count !== rule.deliveries) throw new Error(`Cantidad de entregas incorrecta: ${product.id}`);
  if (product.active !== false) throw new Error(`El producto ${product.id} no puede activarse en Fase 1`);
}

const migrationFiles = await readdir(path.join(root, "netlify/database/migrations"));
if (!migrationFiles.some((file) => file.endsWith(".sql"))) throw new Error("Falta la migración de comercio DDV");

const netlifyConfig = await read("netlify.toml");
for (const marker of ['functions = "netlify/functions"', 'conditions = {Role = ["admin"]}', 'to = "/admin/login/index.html"']) {
  if (!netlifyConfig.includes(marker)) throw new Error(`netlify.toml: falta ${marker}`);
}

const functions = (await readdir(path.join(root, "netlify/functions"))).filter((file) => file.endsWith(".mjs"));
const protectedFunctions = functions.filter((file) => file.startsWith("admin-") && !["admin-login.mjs", "admin-logout.mjs"].includes(file));
for (const file of protectedFunctions) {
  const source = await read(`netlify/functions/${file}`);
  if (!source.includes("requireAdmin")) throw new Error(`${file}: falta autorización server-side`);
}

const functionNames = new Set(functions);
for (const forbidden of ["create-checkout.mjs", "mercadopago-webhook.mjs", "create-order.mjs"]) {
  if (functionNames.has(forbidden)) throw new Error(`Fase 1 no permite ${forbidden}`);
}

const orderPage = await read("revista/pedido/index.html");
if (!orderPage.includes('type="submit" disabled aria-disabled="true"')) throw new Error("El checkout público dejó de estar desactivado");

const adminPage = await read("admin/index.html");
if (!adminPage.includes('meta name="robots" content="noindex, nofollow"')) throw new Error("El panel debe usar noindex");
if (/sign[ -]?up|registrarse|crear cuenta/i.test(adminPage)) throw new Error("El panel no debe ofrecer registro público");

console.log(JSON.stringify({
  commercePhase: 1,
  publicCheckout: false,
  publicRegistration: false,
  products: catalog.map(({ id, price_clp, active }) => ({ id, price_clp, active })),
  protectedFunctions,
}, null, 2));
