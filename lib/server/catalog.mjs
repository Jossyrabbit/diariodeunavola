import products from "../../data/editorial-products.json" with { type: "json" };
import { HttpError } from "./errors.mjs";

const productMap = new Map(products.map((product) => [product.id, Object.freeze({ ...product })]));

export const EDITORIAL_PRODUCTS = Object.freeze([...productMap.values()]);

export function getServerProduct(productId) {
  const product = productMap.get(productId);
  if (!product) throw new HttpError(400, "invalid_product", "El producto editorial no existe.");
  return product;
}

export function validateServerPrice(productId, priceClp, currency = "CLP") {
  const product = getServerProduct(productId);
  if (product.price_clp !== priceClp || product.currency !== currency) {
    throw new HttpError(409, "catalog_mismatch", "El precio no coincide con el catálogo autorizado.");
  }
  return product;
}
