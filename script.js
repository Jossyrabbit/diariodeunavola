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

const catalog = window.DDV_CATALOG || { products: [] };
const products = Array.isArray(catalog.products) ? catalog.products : [];

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

const pageSize = 36;
let visibleLimit = pageSize;
let filteredProducts = [];

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("es-CL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
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

function productMatches(product, query, category, subcategory) {
  const haystack = normalize([
    product.name,
    product.brand,
    product.sku,
    product.category,
    product.subcategory,
  ].join(" "));

  return (!query || haystack.includes(query))
    && (!category || product.category === category)
    && (!subcategory || product.subcategory === subcategory);
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
    product.name,
    product.sku ? `SKU: ${product.sku}` : "",
    `Precio web: ${price}`,
    product.supplierUrl,
  ].filter(Boolean).join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function renderProducts() {
  if (!productGrid) return;
  const visibleProducts = filteredProducts.slice(0, visibleLimit);

  productGrid.innerHTML = visibleProducts.map((product) => {
    const categoryLine = [product.category, product.subcategory].filter(Boolean).join(" / ");
    const brand = product.brand || "Sin marca";
    const sku = product.sku ? `SKU ${product.sku}` : "";
    const price = formatPrice(product.finalPrice);

    return `
      <article class="product-card">
        <div class="product-media">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
        <div class="product-body">
          <p class="product-kicker">${escapeHtml(categoryLine)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <div class="product-meta">
            <span>${escapeHtml(brand)}</span>
            ${sku ? `<span>${escapeHtml(sku)}</span>` : ""}
          </div>
          <strong class="product-price">${escapeHtml(price)}</strong>
          <div class="product-actions">
            <a class="button primary small" href="${whatsappUrl(product)}" target="_blank" rel="noopener">Consultar</a>
            <a class="button ghost small" href="${escapeHtml(product.supplierUrl)}" target="_blank" rel="noopener">Ficha</a>
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
}

function applyFilters({ resetLimit = true } = {}) {
  if (resetLimit) visibleLimit = pageSize;

  const query = normalize(searchInput?.value || "");
  const category = categorySelect?.value || "";
  const subcategory = subcategorySelect?.value || "";
  const sortMode = sortSelect?.value || "name";

  filteredProducts = sortProducts(
    products.filter((product) => productMatches(product, query, category, subcategory)),
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

  searchInput?.addEventListener("input", () => applyFilters());
  sortSelect?.addEventListener("change", () => applyFilters());

  categorySelect?.addEventListener("change", () => {
    if (subcategorySelect) subcategorySelect.value = "";
    updateSubcategoryOptions();
    applyFilters();
  });

  subcategorySelect?.addEventListener("change", () => applyFilters());

  clearButton?.addEventListener("click", () => {
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
}

initializeCatalog();
