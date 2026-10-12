(function initDdvEditorialCommerce() {
  "use strict";

  const products = Array.isArray(window.DDV_EDITORIAL_PRODUCTS) ? window.DDV_EDITORIAL_PRODUCTS : [];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const params = new URLSearchParams(window.location.search);
  const defaultPlan = products[0]?.id || "";
  const requestedPlan = params.get("plan") || "";
  const selectedPlan = productMap.has(requestedPlan) ? requestedPlan : defaultPlan;
  const selector = document.querySelector("[data-editorial-plan-selector]");
  const orderForm = document.querySelector("[data-editorial-order-form]");
  const status = document.querySelector("[data-commerce-status]");

  window.DDV_PAYMENT_PROVIDER = Object.freeze({
    enabled: false,
    name: null,
    async createCheckout() {
      throw new Error("Los pagos de DDV todavía no están habilitados.");
    },
  });

  if (selector) {
    selector.innerHTML = products.map((product) => `
      <a href="/revista/pedido/?plan=${encodeURIComponent(product.id)}"${product.id === selectedPlan ? ' aria-current="true"' : ""}>
        <span>${product.shortName}</span><small>${formatCurrency(product.price)}</small>
      </a>`).join("");
  }

  document.querySelectorAll("ddv-order-summary").forEach((summary) => summary.setAttribute("product", selectedPlan));

  if (orderForm) {
    const planInput = orderForm.querySelector("input[name='product_id']");
    if (planInput) planInput.value = selectedPlan;
    orderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (status) {
        status.textContent = "Las ventas aún no están habilitadas. Tus datos no fueron enviados ni guardados.";
        status.focus({ preventScroll: true });
      }
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value);
  }
})();
