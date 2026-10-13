(function initDdvAdmin() {
  "use strict";

  const statusNode = document.querySelector("[data-admin-status]");
  const overviewNode = document.querySelector("[data-admin-overview]");
  const ordersNode = document.querySelector("[data-admin-orders]");
  const subscriptionsNode = document.querySelector("[data-admin-subscriptions]");
  const deliveriesNode = document.querySelector("[data-admin-deliveries]");
  const addressDialog = document.querySelector("[data-address-dialog]");
  const deliveryDialog = document.querySelector("[data-delivery-dialog]");
  const quoteDialog = document.querySelector("[data-quote-dialog]");
  let currentQuoteOrder = null;

  const stateLabels = {
    draft: "Borrador",
    payment_pending: "Pago pendiente",
    paid: "Pagado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    chargeback: "Contracargo",
    active: "Activa",
    completed: "Completada",
    on_hold: "En pausa",
    pending: "Pendiente",
    ready: "Preparada",
    shipped: "Despachada",
    delivered: "Entregada",
    returned: "Devuelta",
    pending_quote: "Pendiente de cotización",
    quoted: "Cotizada",
    accepted: "Aceptada",
    declined: "Rechazada",
    expired: "Vencida",
    not_requested: "No solicitado",
    approved: "Aprobado",
    rejected: "Rechazado",
  };

  function element(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.type) node.type = options.type;
    return node;
  }

  function cell(text) {
    return element("td", { text: text ?? "—" });
  }

  function formatMoney(value) {
    if (value === null || value === undefined) return "Pendiente";
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  }

  function showStatus(message, tone = "") {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.dataset.tone = tone;
  }

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, { credentials: "same-origin", ...options });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      window.location.assign("/admin/login/");
      throw new Error("La sesión no tiene autorización de administración.");
    }
    if (!response.ok) throw new Error(data.message || "No fue posible completar la operación.");
    return data;
  }

  function renderOverview(data) {
    overviewNode.replaceChildren();
    const metrics = [
      ["Pedidos", data.orders_total],
      ["Pagados", data.orders_paid],
      ["Por cotizar", data.quotes_pending],
      ["Esperando aceptación", data.quotes_waiting_acceptance],
      ["Suscripciones activas", data.subscriptions_active],
      ["Entregas pendientes", data.deliveries_pending],
      ["Listas para despacho", data.deliveries_ready],
      ["Fotos asignadas", `${data.photo_slots_assigned} / 200`],
    ];
    metrics.forEach(([label, value]) => {
      const article = element("article");
      article.append(element("strong", { text: value }), element("span", { text: label }));
      overviewNode.append(article);
    });
  }

  function renderOrders(orders) {
    ordersNode.replaceChildren();
    if (!orders.length) {
      const row = element("tr");
      const empty = cell("No existen pedidos. El checkout público está desactivado.");
      empty.colSpan = 7;
      row.append(empty);
      ordersNode.append(row);
      return;
    }
    orders.forEach((order) => {
      const row = element("tr");
      const action = element("td");
      const button = element("button", { className: "ddv-text-button", text: "Gestionar", type: "button" });
      button.addEventListener("click", () => openQuoteDialog(order));
      action.append(button);
      row.append(
        cell(order.public_reference),
        cell(`${order.full_name}\n${order.email_normalized}`),
        cell(order.product_name_snapshot),
        cell(stateLabels[order.quote_status] || order.quote_status),
        cell(stateLabels[order.payment_status] || order.payment_status),
        cell(formatMoney(order.total_clp)),
        action,
      );
      ordersNode.append(row);
    });
  }

  function addressText(subscription) {
    if (!subscription.address_line_1) return "Sin dirección vigente";
    return [subscription.address_line_1, subscription.street_number, subscription.commune, subscription.region].filter(Boolean).join(", ");
  }

  function renderSubscriptions(subscriptions) {
    subscriptionsNode.replaceChildren();
    if (!subscriptions.length) {
      const row = element("tr");
      const empty = cell("No existen suscripciones registradas.");
      empty.colSpan = 5;
      row.append(empty);
      subscriptionsNode.append(row);
      return;
    }
    subscriptions.forEach((subscription) => {
      const row = element("tr");
      const action = element("td");
      const button = element("button", { className: "ddv-text-button", text: "Actualizar dirección", type: "button" });
      button.addEventListener("click", () => openAddressDialog(subscription));
      action.append(button);
      row.append(
        cell(`${subscription.full_name}\n${subscription.email_normalized}`),
        cell(subscription.product_name_snapshot),
        cell(`${subscription.deliveries_completed} / ${subscription.total_deliveries}`),
        cell(addressText(subscription)),
        action,
      );
      subscriptionsNode.append(row);
    });
  }

  function renderDeliveries(deliveries) {
    deliveriesNode.replaceChildren();
    if (!deliveries.length) {
      const row = element("tr");
      const empty = cell("No existen entregas registradas.");
      empty.colSpan = 6;
      row.append(empty);
      deliveriesNode.append(row);
      return;
    }
    deliveries.forEach((delivery) => {
      const row = element("tr");
      const action = element("td");
      const button = element("button", { className: "ddv-text-button", text: "Gestionar", type: "button" });
      button.addEventListener("click", () => openDeliveryDialog(delivery));
      action.append(button);
      const contents = [delivery.includes_magazine && "Revista", delivery.includes_box && "Caja"].filter(Boolean).join(" + ");
      row.append(
        cell(delivery.public_reference),
        cell(`${delivery.sequence_number} · ${delivery.product_name_snapshot}`),
        cell(contents),
        cell(stateLabels[delivery.status] || delivery.status),
        cell([delivery.carrier, delivery.tracking_code].filter(Boolean).join(" · ") || "—"),
        action,
      );
      deliveriesNode.append(row);
    });
  }

  function openAddressDialog(subscription) {
    const form = addressDialog.querySelector("form");
    form.reset();
    form.elements.customer_id.value = subscription.customer_id;
    form.elements.region.value = subscription.region || "";
    form.elements.commune.value = subscription.commune || "";
    form.elements.address_line_1.value = subscription.address_line_1 || "";
    form.elements.street_number.value = subscription.street_number || "";
    addressDialog.showModal();
  }

  function openDeliveryDialog(delivery) {
    const form = deliveryDialog.querySelector("form");
    form.reset();
    form.elements.delivery_id.value = delivery.id;
    form.elements.status.value = delivery.status;
    form.elements.carrier.value = delivery.carrier || "";
    form.elements.tracking_code.value = delivery.tracking_code || "";
    deliveryDialog.showModal();
  }

  function quoteSummary(order, shippingValue) {
    const shipping = Number.isSafeInteger(shippingValue) ? shippingValue : Number(order.shipping_clp);
    const hasShipping = Number.isSafeInteger(shipping) && shipping >= 0;
    const total = hasShipping ? Number(order.unit_price_clp) + shipping : null;
    const deliveries = Number(order.covers_deliveries) || (order.product_name_snapshot.includes("Caja DDV") ? 1 : 3);
    return [
      `Solicitud ${order.public_reference}`,
      `${order.product_name_snapshot}: ${formatMoney(order.unit_price_clp)}`,
      `Despacho desde Santiago${deliveries === 3 ? " (cubre 3 entregas)" : ""}: ${hasShipping ? formatMoney(shipping) : "pendiente"}`,
      `Total: ${total === null ? "pendiente" : formatMoney(total)}`,
      "Esta cotización tiene una vigencia de 7 días. El pago se solicita únicamente después de aceptar este total.",
    ].join("\n");
  }

  function whatsappUrl(phone, message) {
    const normalized = String(phone || "").replace(/\D/g, "");
    return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : "";
  }

  function refreshQuotePreview() {
    if (!currentQuoteOrder) return;
    const form = quoteDialog.querySelector("form");
    const raw = form.elements.shipping_clp.value;
    const shipping = raw === "" ? null : Number(raw);
    const total = Number.isSafeInteger(shipping) && shipping >= 0
      ? Number(currentQuoteOrder.unit_price_clp) + shipping
      : null;
    form.elements.total.value = total === null ? "Pendiente" : formatMoney(total);
    const summary = quoteSummary(currentQuoteOrder, shipping);
    quoteDialog.querySelector("[data-quote-summary]").textContent = summary;
    const whatsapp = quoteDialog.querySelector("[data-open-whatsapp]");
    const href = whatsappUrl(currentQuoteOrder.phone, summary);
    whatsapp.href = href || "#";
    whatsapp.hidden = !href;
  }

  function openQuoteDialog(order) {
    currentQuoteOrder = order;
    const form = quoteDialog.querySelector("form");
    form.reset();
    form.elements.order_id.value = order.id;
    form.elements.product_price.value = formatMoney(order.unit_price_clp);
    form.elements.shipping_clp.value = order.shipping_clp ?? "";
    const deliveries = Number(order.covers_deliveries) || (order.product_name_snapshot.includes("Caja DDV") ? 1 : 3);
    form.elements.delivery_scope.value = deliveries === 3 ? "Tres entregas del año" : "Una entrega";
    quoteDialog.querySelector("[data-accept-quote]").disabled = order.quote_status !== "quoted";
    refreshQuotePreview();
    quoteDialog.showModal();
  }

  async function load() {
    showStatus("Cargando datos protegidos…");
    try {
      const [session, overview, orders, subscriptions, deliveries] = await Promise.all([
        fetchJson("/api/admin/session"),
        fetchJson("/api/admin/overview"),
        fetchJson("/api/admin/orders"),
        fetchJson("/api/admin/subscriptions"),
        fetchJson("/api/admin/deliveries"),
      ]);
      document.querySelector("[data-admin-email]").textContent = session.user.email || "Cuenta administradora";
      renderOverview(overview.overview);
      renderOrders(orders.orders);
      renderSubscriptions(subscriptions.subscriptions);
      renderDeliveries(deliveries.deliveries);
      showStatus("Datos actualizados. Los cobros públicos continúan desactivados.", "success");
    } catch (error) {
      showStatus(error.message, "error");
    }
  }

  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  document.querySelector("[data-address-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await fetchJson("/api/admin/address", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer_id: values.customer_id, address: values }),
      });
      addressDialog.close();
      await load();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  document.querySelector("[data-delivery-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await fetchJson("/api/admin/delivery", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      deliveryDialog.close();
      await load();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  document.querySelector("[data-quote-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await fetchJson("/api/admin/order-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: values.order_id, shipping_clp: Number(values.shipping_clp) }),
      });
      quoteDialog.close();
      await load();
      showStatus("Cotización guardada por 7 días. Aún no se ha solicitado ningún pago.", "success");
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  quoteDialog?.querySelector("input[name='shipping_clp']")?.addEventListener("input", refreshQuotePreview);
  quoteDialog?.querySelector("[data-copy-order]")?.addEventListener("click", async () => {
    if (!currentQuoteOrder) return;
    const raw = quoteDialog.querySelector("input[name='shipping_clp']").value;
    const shipping = raw === "" ? null : Number(raw);
    try {
      await navigator.clipboard.writeText(quoteSummary(currentQuoteOrder, shipping));
      showStatus("Resumen copiado. Revisa el texto antes de enviarlo al comprador.", "success");
    } catch {
      showStatus("No fue posible copiar el resumen automáticamente.", "error");
    }
  });
  quoteDialog?.querySelector("[data-accept-quote]")?.addEventListener("click", async () => {
    if (!currentQuoteOrder || currentQuoteOrder.quote_status !== "quoted") return;
    try {
      await fetchJson("/api/admin/order-quote-accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_id: currentQuoteOrder.id }),
      });
      quoteDialog.close();
      await load();
      showStatus("Aceptación por WhatsApp registrada. Mercado Pago continúa desactivado.", "success");
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  document.querySelector("[data-admin-refresh]")?.addEventListener("click", load);
  document.querySelector("[data-admin-logout]")?.addEventListener("click", async () => {
    try {
      await fetchJson("/api/admin/logout", { method: "POST", headers: { "content-type": "application/json" } });
    } finally {
      window.location.assign("/admin/login/");
    }
  });

  load();
})();
