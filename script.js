const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#site-nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

document.querySelectorAll("[data-share-url]").forEach((button) => {
  button.addEventListener("click", async () => {
    const title = button.dataset.shareTitle || document.title;
    const url = button.dataset.shareUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      const originalText = button.textContent;
      button.textContent = "Enlace copiado";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1800);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
    }
  });
});

document.querySelectorAll("form[name='newsletter-ddv']").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const formMessage = form.querySelector(".form-message");
    const formData = new FormData(form);
    const body = new URLSearchParams();
    formData.forEach((value, key) => body.append(key, String(value)));

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }
    if (formMessage) {
      formMessage.classList.remove("is-error");
      formMessage.textContent = "Estamos guardando tu suscripción.";
    }

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!response.ok) throw new Error(`Subscription failed with ${response.status}`);
      window.location.assign("/gracias.html?form=newsletter-ddv");
    } catch {
      if (formMessage) {
        formMessage.classList.add("is-error");
        formMessage.innerHTML = `No pudimos guardar tus datos en este momento. Puedes intentarlo nuevamente o <a href="https://wa.me/${DDV_WHATSAPP_NUMBER}?text=Hola%20Diario%20de%20una%20Vola%2C%20quiero%20suscribirme%20a%20la%20revista." target="_blank" rel="noopener noreferrer">escribirnos por WhatsApp</a>.`;
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Suscribirme";
      }
    }
  });
});

const catalog = window.DDV_CATALOG || { products: [] };
const products = Array.isArray(catalog.products)
  ? catalog.products.filter((product) => product
    && product.status !== "ocultar"
    && product.name
    && !/^[-\d%\s]+$/.test(product.name.trim()))
  : [];
const DDV_WHATSAPP_NUMBER = "56999815822";
const DDV_CART_KEY = "ddv-cart";
const DDV_FAVORITES_KEY = "ddv-favorites";
const DDV_SHIPPING_ESTIMATE = "2 a 3 días hábiles";
const DDV_DEFAULT_IMAGE = "https://static.wixstatic.com/media/1287cc_9b7b1f6130bd4ab78fbfe3cd286fecb8~mv2.jpg/v1/fill/w_900,h_700,fp_0.50_0.50,q_85,enc_avif,quality_auto/1287cc_9b7b1f6130bd4ab78fbfe3cd286fecb8~mv2.jpg";

const searchInput = document.querySelector("#catalog-search");
const categorySelect = document.querySelector("#catalog-category");
const subcategorySelect = document.querySelector("#catalog-subcategory");
const sortSelect = document.querySelector("#catalog-sort");
const productGrid = document.querySelector("#product-grid");
const statusLabel = document.querySelector("#catalog-status");
const totalLabel = document.querySelector("#catalog-total");
const emptyState = document.querySelector("#catalog-empty");
const clearButton = document.querySelector("#catalog-clear");
const loadMoreButton = document.querySelector("#catalog-load-more");
const quickCatalogButtons = document.querySelectorAll("[data-catalog-quick]");
const cartPanel = document.querySelector("#cart-panel");
const cartList = document.querySelector("#cart-list");
const cartEmpty = document.querySelector("#cart-empty");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector("#cart-count");
const cartOpenButtons = document.querySelectorAll("[data-cart-open]");
const cartCloseButtons = document.querySelectorAll("[data-cart-close]");
const cartOrderButton = document.querySelector("#cart-order");
const cartDownloadButton = document.querySelector("#cart-download");
const favoritesPanel = document.querySelector("#favorites-panel");
const favoritesList = document.querySelector("#favorites-list");
const favoritesEmpty = document.querySelector("#favorites-empty");
const favoritesCount = document.querySelector("#favorites-count");
const favoritesOpenButtons = document.querySelectorAll("[data-favorites-open]");
const favoritesCloseButtons = document.querySelectorAll("[data-favorites-close]");
const galleryModal = document.querySelector("#image-zoom-modal");
const galleryModalImage = document.querySelector("[data-gallery-modal-image]");

const pageSize = 36;
let visibleLimit = pageSize;
let filteredProducts = [];
let activeQuickTerms = [];
let activeQuickCategories = [];
let activeQuickSubcategories = [];
let activeQuickTagCategories = [];
let activeQuickTagSubcategories = [];
let activeQuickGroups = [];

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("es-CL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugPart(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productSlug(product) {
  const namePart = slugPart(product.name).slice(0, 84) || "producto";
  const keyPart = slugPart(product.id || product.sku || product.name).slice(0, 36);
  return keyPart && keyPart !== namePart ? `${namePart}-${keyPart}` : namePart;
}

function productDetailPath(product) {
  return `/productos/${productSlug(product)}.html`;
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return "Consultar";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayProductName(productOrName = "") {
  const raw = typeof productOrName === "string" ? productOrName : productOrName.name;
  const text = String(raw || "").replace(/\s+/g, " ").trim();
  if (!text) return "Producto seleccionado";
  const letters = text.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  const uppercaseLetters = [...letters].filter((char) => char === char.toLocaleUpperCase("es-CL") && char !== char.toLocaleLowerCase("es-CL")).length;
  const isMostlyUppercase = letters.length > 4 && uppercaseLetters / letters.length >= 0.6;
  if (!isMostlyUppercase) return text;
  const titled = text.toLocaleLowerCase("es-CL").replace(/(^|[\s/(-])([a-záéíóúüñ])/g, (match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("es-CL")}`);
  return titled
    .replace(/\bLed\b/g, "LED")
    .replace(/\bHps\b/g, "HPS")
    .replace(/\bCmh\b/g, "CMH")
    .replace(/\bPh\b/g, "pH")
    .replace(/\bEc\b/g, "EC")
    .replace(/\bUva\b/g, "UVA")
    .replace(/\bUvb\b/g, "UVB")
    .replace(/\bUvc\b/g, "UVC")
    .replace(/\bUsb\b/g, "USB")
    .replace(/\bAbs\b/g, "ABS")
    .replace(/\bPp\b/g, "PP")
    .replace(/\bCto\b/g, "CTO")
    .replace(/\bUdf\b/g, "UDF")
    .replace(/\bDtu\b/g, "DTU")
    .replace(/\bRtu\b/g, "RTU")
    .replace(/\bMm\b/g, "mm")
    .replace(/\bCm\b/g, "cm")
    .replace(/\bMl\b/g, "ml")
    .replace(/\bGrs\b/g, "grs")
    .replace(/\bGr\b/g, "gr")
    .replace(/(\d)\s?W\b/g, "$1W")
    .replace(/(\d)\s?w\b/g, "$1W");
}

function displayBrand(product) {
  return product.brand ? displayProductName(product.brand) : "Selección DDV";
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

function queryTerms(value) {
  return normalize(value)
    .split(/[\s|,]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
}

function dataList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillSelect(select, values, placeholder) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>`;
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  if (values.includes(current)) select.value = current;
}

function productMatches(product, query, category, subcategory, quickTerms = []) {
  const haystack = normalize([
    product.name,
    product.brand,
    product.sku,
    product.category,
    product.subcategory,
  ].join(" "));
  const terms = queryTerms(query);
  const hasQuickRule = activeQuickGroups.length || activeQuickCategories.length || activeQuickSubcategories.length || quickTerms.length;
  const inQuickTagScope = activeQuickTagCategories.length || activeQuickTagSubcategories.length
    ? activeQuickTagCategories.includes(product.category)
      || activeQuickTagSubcategories.includes(product.subcategory)
    : true;
  const matchesQuick = hasQuickRule
    ? activeQuickGroups.some((group) => product.groups?.[group])
      || activeQuickCategories.includes(product.category)
      || activeQuickSubcategories.includes(product.subcategory)
      || (inQuickTagScope && quickTerms.some((term) => haystack.includes(term)))
    : true;
  const matchesQuery = hasQuickRule
    ? matchesQuick
    : terms.every((term) => haystack.includes(term));

  return matchesQuery
    && (!category || product.category === category)
    && (!subcategory || product.subcategory === subcategory);
}

function resetQuickFilters() {
  activeQuickTerms = [];
  activeQuickCategories = [];
  activeQuickSubcategories = [];
  activeQuickTagCategories = [];
  activeQuickTagSubcategories = [];
  activeQuickGroups = [];
}

function sortProducts(items, sortMode) {
  const sorted = [...items];
  if (sortMode === "price-asc") {
    sorted.sort((a, b) => (a.finalPrice || Infinity) - (b.finalPrice || Infinity));
  } else if (sortMode === "price-desc") {
    sorted.sort((a, b) => (b.finalPrice || 0) - (a.finalPrice || 0));
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  return sorted;
}

function whatsappUrl(product) {
  const price = formatPrice(product.finalPrice);
  const message = [
    "Hola Diario de una Vola, quiero consultar por este producto:",
    displayProductName(product),
    product.sku ? `SKU: ${product.sku}` : "",
    `Precio web: ${price}`,
    `Despacho estimado: ${DDV_SHIPPING_ESTIMATE}`,
    new URL(productDetailPath(product), window.location.origin).href,
  ].filter(Boolean).join("\n");

  return `https://wa.me/${DDV_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DDV_CART_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(DDV_CART_KEY, JSON.stringify(cart));
}

function findProduct(productId) {
  return products.find((product) => product.id === productId);
}

function cartRows() {
  const cart = readCart();
  return Object.entries(cart)
    .map(([productId, quantity]) => {
      const product = findProduct(productId);
      const qty = Math.max(1, Number(quantity) || 1);
      if (!product) return null;
      const unit = Number.isFinite(product.finalPrice) ? Math.round(product.finalPrice) : 0;
      return {
        product,
        quantity: qty,
        unit,
        subtotal: unit * qty,
      };
    })
    .filter(Boolean);
}

function cartSummary(rows = cartRows()) {
  return rows.reduce((summary, row) => {
    summary.count += row.quantity;
    summary.total += row.subtotal;
    return summary;
  }, { count: 0, total: 0 });
}

function renderCart() {
  if (!cartPanel) return;
  const rows = cartRows();
  const summary = cartSummary(rows);

  if (cartCount) cartCount.textContent = String(summary.count);
  if (cartTotal) cartTotal.textContent = formatPrice(summary.total);
  if (cartEmpty) cartEmpty.hidden = rows.length > 0;
  if (cartOrderButton) cartOrderButton.disabled = rows.length === 0;
  if (cartDownloadButton) cartDownloadButton.disabled = rows.length === 0;

  if (cartList) {
    cartList.innerHTML = rows.map(({ product, quantity, subtotal }) => `
      <article class="cart-item">
        <img src="${escapeHtml(product.image || DDV_DEFAULT_IMAGE)}" alt="${escapeHtml(displayProductName(product))}" loading="lazy">
        <div>
          <strong>${escapeHtml(displayProductName(product))}</strong>
          <span>${escapeHtml([product.category, product.sku ? `SKU ${product.sku}` : ""].filter(Boolean).join(" / "))}</span>
          <small>${escapeHtml(formatPrice(product.finalPrice))} c/u</small>
          <div class="cart-item-controls">
            <button type="button" data-cart-decrease="${escapeHtml(product.id)}" aria-label="Restar ${escapeHtml(displayProductName(product))}">-</button>
            <span>${quantity}</span>
            <button type="button" data-cart-increase="${escapeHtml(product.id)}" aria-label="Sumar ${escapeHtml(displayProductName(product))}">+</button>
            <button type="button" data-cart-remove="${escapeHtml(product.id)}">Quitar</button>
          </div>
        </div>
        <em>${escapeHtml(formatPrice(subtotal))}</em>
      </article>
    `).join("");
  }
}

function addToCart(productId, amount = 1) {
  const product = findProduct(productId);
  if (!product) return;
  const cart = readCart();
  cart[productId] = Math.max(1, (Number(cart[productId]) || 0) + amount);
  writeCart(cart);
  renderCart();
  openCart();
}

function updateCartItem(productId, quantity) {
  const cart = readCart();
  const qty = Number(quantity);
  if (qty > 0) {
    cart[productId] = qty;
  } else {
    delete cart[productId];
  }
  writeCart(cart);
  renderCart();
}

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DDV_FAVORITES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(DDV_FAVORITES_KEY, JSON.stringify([...new Set(favorites)]));
}

function updateFavoriteButtons() {
  const favorites = new Set(readFavorites());
  document.querySelectorAll("[data-toggle-favorite]").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    const isActive = favorites.has(button.dataset.productId || "");
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    const icon = button.querySelector("span");
    if (icon) icon.textContent = isActive ? "♥" : "♡";
  });
}

function renderFavorites() {
  const favoriteIds = readFavorites();
  const favoriteProducts = favoriteIds.map(findProduct).filter(Boolean);
  if (favoritesCount) favoritesCount.textContent = String(favoriteProducts.length);
  if (favoritesEmpty) favoritesEmpty.hidden = favoriteProducts.length > 0;
  if (favoritesList) {
    favoritesList.innerHTML = favoriteProducts.map((product) => {
      const name = displayProductName(product);
      return `
      <article class="favorite-item">
        <a href="${escapeHtml(productDetailPath(product))}">
          <img src="${escapeHtml(product.image || DDV_DEFAULT_IMAGE)}" alt="${escapeHtml(name)}" loading="lazy">
        </a>
        <div>
          <strong><a href="${escapeHtml(productDetailPath(product))}">${escapeHtml(name)}</a></strong>
          <span>${escapeHtml([product.category, product.subcategory].filter(Boolean).join(" / "))}</span>
          <small>${escapeHtml(formatPrice(product.finalPrice))}</small>
          <div class="favorite-actions">
            <button class="button primary small" type="button" data-add-to-cart data-product-id="${escapeHtml(product.id)}">Agregar al pedido</button>
            <button class="button ghost small" type="button" data-toggle-favorite data-product-id="${escapeHtml(product.id)}"><span aria-hidden="true">♥</span> Quitar</button>
          </div>
        </div>
      </article>`;
    }).join("");
  }
  updateFavoriteButtons();
}

function toggleFavorite(productId) {
  const product = findProduct(productId);
  if (!product) return;
  const favorites = readFavorites();
  const exists = favorites.includes(productId);
  writeFavorites(exists ? favorites.filter((id) => id !== productId) : [...favorites, productId]);
  renderFavorites();
}

function openCart() {
  if (!cartPanel) return;
  closeFavorites();
  cartPanel.classList.add("is-open");
  cartPanel.setAttribute("aria-hidden", "false");
}

function closeCart() {
  if (!cartPanel) return;
  cartPanel.classList.remove("is-open");
  cartPanel.setAttribute("aria-hidden", "true");
}

function openFavorites() {
  if (!favoritesPanel) return;
  closeCart();
  renderFavorites();
  favoritesPanel.classList.add("is-open");
  favoritesPanel.setAttribute("aria-hidden", "false");
}

function closeFavorites() {
  if (!favoritesPanel) return;
  favoritesPanel.classList.remove("is-open");
  favoritesPanel.setAttribute("aria-hidden", "true");
}

function cartCsv() {
  const rows = cartRows();
  const header = ["Producto", "SKU", "Categoria", "Cantidad", "Precio unitario", "Subtotal", "Despacho estimado"];
  const body = rows.map(({ product, quantity, unit, subtotal }) => [
    displayProductName(product),
    product.sku || "",
    [product.category, product.subcategory].filter(Boolean).join(" / "),
    quantity,
    unit,
    subtotal,
    DDV_SHIPPING_ESTIMATE,
  ]);
  return [header, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
}

function downloadCartCsv() {
  const rows = cartRows();
  if (!rows.length) return;
  const blob = new Blob([`\ufeff${cartCsv()}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "pedido-diario-de-una-vola.csv";
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function orderWhatsappMessage() {
  const rows = cartRows();
  const summary = cartSummary(rows);
  return [
    "Hola Diario de una Vola, quiero enviar este pedido:",
    "",
    ...rows.map(({ product, quantity, subtotal }, index) => `${index + 1}. ${displayProductName(product)}${product.sku ? ` / SKU ${product.sku}` : ""} / Cantidad: ${quantity} / Subtotal: ${formatPrice(subtotal)}`),
    "",
    `Total estimado: ${formatPrice(summary.total)}`,
    `Despacho estimado: ${DDV_SHIPPING_ESTIMATE}`,
    "Disponibilidad y precio final a confirmar.",
  ].join("\n");
}

function renderProducts() {
  if (!productGrid) return;
  const visibleProducts = filteredProducts.slice(0, visibleLimit);

  productGrid.innerHTML = visibleProducts.map((product) => {
    const categoryLine = [product.category, product.subcategory].filter(Boolean).join(" / ");
    const brand = displayBrand(product);
    const sku = product.sku ? `SKU ${product.sku}` : "";
    const price = formatPrice(product.finalPrice);
    const detailPath = productDetailPath(product);
    const name = displayProductName(product);

    return `
      <article class="product-card">
        <div class="product-media-wrap">
          <a class="product-media" href="${escapeHtml(detailPath)}">
            <img src="${escapeHtml(product.image || DDV_DEFAULT_IMAGE)}" alt="${escapeHtml(name)}" loading="lazy">
          </a>
          <button class="favorite-toggle product-card-favorite" type="button" data-toggle-favorite data-product-id="${escapeHtml(product.id)}" aria-label="Guardar ${escapeHtml(name)} como favorito"><span aria-hidden="true">♡</span></button>
          <button class="product-card-add" type="button" data-add-to-cart data-product-id="${escapeHtml(product.id)}"><span aria-hidden="true">+</span> Agregar al pedido</button>
        </div>
        <div class="product-body">
          <p class="product-kicker">${escapeHtml(categoryLine)}</p>
          <h3><a href="${escapeHtml(detailPath)}">${escapeHtml(name)}</a></h3>
          <div class="product-meta">
            <span>${escapeHtml(brand)}</span>
            ${sku ? `<span>${escapeHtml(sku)}</span>` : ""}
          </div>
          <strong class="product-price">${escapeHtml(price)}</strong>
          <small class="product-shipping">Despacho ${escapeHtml(DDV_SHIPPING_ESTIMATE)}</small>
          <div class="product-actions">
            <a class="button secondary outline small" href="${whatsappUrl(product)}" target="_blank" rel="noopener">Consultar</a>
            <a class="button ghost small" href="${escapeHtml(detailPath)}">Ficha</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (statusLabel) {
    const shown = Math.min(visibleLimit, filteredProducts.length);
    statusLabel.textContent = `${shown} de ${filteredProducts.length} productos visibles`;
  }

  if (emptyState) {
    emptyState.hidden = filteredProducts.length !== 0;
  }

  if (loadMoreButton) {
    loadMoreButton.hidden = visibleLimit >= filteredProducts.length;
  }

  updateFavoriteButtons();
}

function applyFilters({ resetLimit = true } = {}) {
  if (resetLimit) visibleLimit = pageSize;

  const query = normalize(searchInput?.value || "");
  const category = categorySelect?.value || "";
  const subcategory = subcategorySelect?.value || "";
  const sortMode = sortSelect?.value || "name";

  filteredProducts = sortProducts(
    products.filter((product) => productMatches(product, query, category, subcategory, activeQuickTerms)),
    sortMode,
  );

  renderProducts();
}

function updateSubcategoryOptions() {
  const category = categorySelect?.value || "";
  const available = products
    .filter((product) => !category || product.category === category)
    .map((product) => product.subcategory);
  fillSelect(subcategorySelect, uniqueSorted(available), "Todas");
}

function initializeCatalog() {
  if (!productGrid) return;

  fillSelect(categorySelect, uniqueSorted(products.map((product) => product.category)), "Todas");
  updateSubcategoryOptions();

  if (totalLabel) totalLabel.textContent = String(products.length);
  filteredProducts = sortProducts(products, "name");
  renderProducts();

  searchInput?.addEventListener("input", () => {
    resetQuickFilters();
    applyFilters();
  });
  sortSelect?.addEventListener("change", () => applyFilters());

  categorySelect?.addEventListener("change", () => {
    resetQuickFilters();
    if (subcategorySelect) subcategorySelect.value = "";
    updateSubcategoryOptions();
    applyFilters();
  });

  subcategorySelect?.addEventListener("change", () => {
    resetQuickFilters();
    applyFilters();
  });

  clearButton?.addEventListener("click", () => {
    resetQuickFilters();
    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "";
    if (subcategorySelect) subcategorySelect.value = "";
    if (sortSelect) sortSelect.value = "name";
    updateSubcategoryOptions();
    applyFilters();
  });

  loadMoreButton?.addEventListener("click", () => {
    visibleLimit += pageSize;
    renderProducts();
  });

  quickCatalogButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category || "";
      const subcategory = button.dataset.subcategory || "";
      const query = button.dataset.query || "";
      activeQuickCategories = dataList(button.dataset.categories || category);
      activeQuickSubcategories = dataList(button.dataset.subcategories || subcategory);
      activeQuickTerms = queryTerms(button.dataset.tags || "");
      activeQuickTagCategories = dataList(button.dataset.tagCategories || "");
      activeQuickTagSubcategories = dataList(button.dataset.tagSubcategories || "");
      activeQuickGroups = dataList(button.dataset.groups || "");

      if (searchInput) searchInput.value = query;
      if (categorySelect) categorySelect.value = category && activeQuickCategories.length === 1 ? category : "";
      updateSubcategoryOptions();
      if (subcategorySelect) subcategorySelect.value = subcategory && activeQuickSubcategories.length === 1 ? subcategory : "";
      if (sortSelect) sortSelect.value = "name";
      applyFilters();
      document.querySelector("#catalogo-productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const addButton = target.closest("[data-add-to-cart]");
  if (addButton instanceof HTMLElement) {
    event.preventDefault();
    addToCart(addButton.dataset.productId || "");
    return;
  }

  const favoriteButton = target.closest("[data-toggle-favorite]");
  if (favoriteButton instanceof HTMLElement) {
    event.preventDefault();
    toggleFavorite(favoriteButton.dataset.productId || "");
    return;
  }

  const galleryThumb = target.closest("[data-gallery-thumb]");
  if (galleryThumb instanceof HTMLElement) {
    const gallery = galleryThumb.closest("[data-product-gallery]");
    const mainImage = gallery?.querySelector("[data-gallery-main]");
    if (mainImage instanceof HTMLImageElement) {
      mainImage.src = galleryThumb.dataset.galleryThumb || mainImage.src;
      mainImage.alt = galleryThumb.dataset.galleryAlt || mainImage.alt;
      gallery?.querySelectorAll("[data-gallery-thumb]").forEach((button) => button.removeAttribute("aria-current"));
      galleryThumb.setAttribute("aria-current", "true");
    }
    return;
  }

  const zoomButton = target.closest("[data-gallery-zoom]");
  if (zoomButton instanceof HTMLElement) {
    const image = zoomButton.querySelector("[data-gallery-main]");
    if (image instanceof HTMLImageElement && galleryModal && galleryModalImage instanceof HTMLImageElement) {
      galleryModalImage.src = image.src;
      galleryModalImage.alt = image.alt;
      galleryModal.classList.add("is-open");
      galleryModal.setAttribute("aria-hidden", "false");
    }
    return;
  }

  const galleryClose = target.closest("[data-gallery-close]");
  if (galleryClose instanceof HTMLElement && galleryModal) {
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    return;
  }

  if (target === galleryModal && galleryModal) {
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    return;
  }

  const increaseButton = target.closest("[data-cart-increase]");
  if (increaseButton instanceof HTMLElement) {
    const productId = increaseButton.dataset.cartIncrease || "";
    const cart = readCart();
    updateCartItem(productId, (Number(cart[productId]) || 1) + 1);
    return;
  }

  const decreaseButton = target.closest("[data-cart-decrease]");
  if (decreaseButton instanceof HTMLElement) {
    const productId = decreaseButton.dataset.cartDecrease || "";
    const cart = readCart();
    updateCartItem(productId, (Number(cart[productId]) || 1) - 1);
    return;
  }

  const removeButton = target.closest("[data-cart-remove]");
  if (removeButton instanceof HTMLElement) {
    updateCartItem(removeButton.dataset.cartRemove || "", 0);
  }
});

cartOpenButtons.forEach((button) => button.addEventListener("click", openCart));
cartCloseButtons.forEach((button) => button.addEventListener("click", closeCart));
favoritesOpenButtons.forEach((button) => button.addEventListener("click", openFavorites));
favoritesCloseButtons.forEach((button) => button.addEventListener("click", closeFavorites));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeCart();
  closeFavorites();
  if (galleryModal) {
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
  }
});

cartDownloadButton?.addEventListener("click", downloadCartCsv);

cartOrderButton?.addEventListener("click", () => {
  const rows = cartRows();
  if (!rows.length) return;
  downloadCartCsv();
  window.open(`https://wa.me/${DDV_WHATSAPP_NUMBER}?text=${encodeURIComponent(orderWhatsappMessage())}`, "_blank", "noopener");
});

initializeCatalog();
renderCart();
renderFavorites();
updateFavoriteButtons();

const searchIndex = Array.isArray(window.DDV_SEARCH_INDEX) ? window.DDV_SEARCH_INDEX : [];
const siteSearchForm = document.querySelector(".search-page-form");
const siteSearchInput = document.querySelector("#site-search-input");
const siteSearchResults = document.querySelector("#site-search-results");
const siteSearchCount = document.querySelector("#site-search-count");
const siteSearchCategory = document.querySelector("#site-search-category");
const siteSearchDate = document.querySelector("#site-search-date");
const siteSearchLevel = document.querySelector("#site-search-level");

function renderSiteSearchResults(query) {
  if (!siteSearchResults) return;
  const normalizedQuery = normalize(query);
  const selectedCategory = siteSearchCategory?.value || "";
  const selectedYear = siteSearchDate?.value || "";
  const selectedLevel = siteSearchLevel?.value || "";
  const results = searchIndex.filter((item) => {
    const matchesQuery = normalizedQuery
      ? normalize([
      item.title,
      item.category,
      item.excerpt,
      item.type,
      item.author,
      item.series,
      item.keywords,
    ].join(" ")).includes(normalizedQuery)
      : true;
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesYear = !selectedYear || item.year === selectedYear;
    const matchesLevel = !selectedLevel || item.level === selectedLevel;
    return matchesQuery && matchesCategory && matchesYear && matchesLevel;
  });

  const visibleResults = normalizedQuery || selectedCategory || selectedYear || selectedLevel
    ? results
    : results.slice(0, 8);

  siteSearchResults.innerHTML = visibleResults.map((item) => `
    <a class="search-result" href="${escapeHtml(item.url)}">
      <span>${escapeHtml(item.type)} / ${escapeHtml(item.category || "DDV")}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.excerpt || "")}</p>
      <small>${escapeHtml([item.date, item.readTime, item.series, item.level].filter(Boolean).join(" / "))}</small>
    </a>
  `).join("");

  if (siteSearchCount) {
    if (!normalizedQuery && !selectedCategory && !selectedYear && !selectedLevel) {
      siteSearchCount.textContent = "Mostrando una seleccion inicial. Escribe para filtrar por tema.";
    } else if (visibleResults.length === 1) {
      siteSearchCount.textContent = "1 resultado encontrado.";
    } else {
      siteSearchCount.textContent = `${visibleResults.length} resultados encontrados.`;
    }
  }
}

function initializeSiteSearch() {
  if (!siteSearchInput || !siteSearchResults) return;
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  siteSearchInput.value = initialQuery;
  renderSiteSearchResults(initialQuery);

  siteSearchInput.addEventListener("input", () => {
    renderSiteSearchResults(siteSearchInput.value);
  });

  [siteSearchCategory, siteSearchDate, siteSearchLevel].forEach((control) => {
    control?.addEventListener("change", () => renderSiteSearchResults(siteSearchInput.value));
  });

  siteSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSiteSearchResults(siteSearchInput.value);
    const query = siteSearchInput.value.trim();
    const nextUrl = query ? `?q=${encodeURIComponent(query)}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  });
}

initializeSiteSearch();

const newsletterForms = document.querySelectorAll(".newsletter-panel");

newsletterForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    const email = form.querySelector("input[type='email']");
    const interest = form.querySelector("select[name='interest']");
    const frequency = form.querySelector("select[name='frequency']");
    const interestChecks = [...form.querySelectorAll("input[name='interests']")];
    const consent = form.querySelector("input[name='consent']");
    const message = form.querySelector(".form-message");
    const emailIsValid = email instanceof HTMLInputElement && email.validity.valid && email.value.trim();
    const interestIsValid = !(interest instanceof HTMLSelectElement) || interest.value;
    const interestsAreValid = interestChecks.length === 0 || interestChecks.some((input) => input.checked);
    const frequencyIsValid = !(frequency instanceof HTMLSelectElement) || frequency.value;
    const consentIsValid = !(consent instanceof HTMLInputElement) || consent.checked;

    if (!emailIsValid || !interestIsValid || !interestsAreValid || !frequencyIsValid || !consentIsValid) {
      event.preventDefault();
      if (message) {
        message.textContent = "Revisa el correo, selecciona al menos un tema, elige una frecuencia y acepta recibir correos para continuar.";
        message.classList.add("is-error");
      }
      return;
    }

    if (message) {
      message.textContent = "Listo. Te llevaremos a la confirmacion.";
      message.classList.remove("is-error");
      message.classList.add("is-success");
    }
  });
});
