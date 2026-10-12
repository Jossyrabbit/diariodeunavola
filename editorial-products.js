(function registerDdvEditorialProducts() {
  "use strict";

  const products = [
    {
      id: "caja-ddv-01",
      sku: "DDV-BOX-01",
      name: "Caja DDV N.º 01",
      shortName: "Caja DDV",
      price: 15990,
      currency: "CLP",
      cadence: "Compra única",
      description: "La primera edición impresa de DDV acompañada por una selección de objetos y muestras.",
      badge: "Edición N.º 01",
      magazines: 1,
      boxes: 1,
      benefits: [
        "Revista DDV N.º 01 impresa",
        "Fotografía coleccionable para las primeras 200 cajas",
        "Stickers de colaboradores",
        "Papelillos",
        "2 semillas a granel",
        "Mecha de cáñamo",
        "Sticker DDV",
        "Muestra de limpiador",
        "Muestra SOMA",
      ],
      limitedBenefit: "La fotografía coleccionable se asignará según el orden real de las primeras 200 compras confirmadas.",
    },
    {
      id: "suscripcion-ddv-anual",
      sku: "DDV-SUB-ANUAL",
      name: "Suscripción DDV",
      shortName: "Suscripción DDV",
      price: 29990,
      currency: "CLP",
      cadence: "1 año",
      description: "Tres revistas impresas durante el año, una cada cuatro meses, sin cajas de productos.",
      badge: "Solo revistas",
      magazines: 3,
      boxes: 0,
      benefits: [
        "3 revistas DDV impresas",
        "Una entrega editorial cada cuatro meses",
        "Vigencia anual",
        "Sin cajas de productos",
      ],
    },
    {
      id: "club-ddv-anual",
      sku: "DDV-CLUB-ANUAL",
      name: "Club DDV",
      shortName: "Club DDV",
      price: 39990,
      currency: "CLP",
      cadence: "1 año",
      description: "Las tres revistas y las tres cajas del año, con beneficios adicionales todavía por definir.",
      badge: "Revistas + cajas",
      magazines: 3,
      boxes: 3,
      benefits: [
        "3 revistas DDV impresas",
        "3 cajas DDV durante el año",
        "Una entrega cada cuatro meses",
        "Beneficios adicionales por definir",
      ],
      pendingBenefit: true,
    },
  ];

  window.DDV_EDITORIAL_PRODUCTS = Object.freeze(products.map((product) => Object.freeze({
    ...product,
    benefits: Object.freeze([...product.benefits]),
  })));
})();
