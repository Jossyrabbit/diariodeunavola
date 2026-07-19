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
const quickCatalogButtons = document.querySelectorAll("[data-catalog-quick]");

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

initializeCatalog();

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
    const consent = form.querySelector("input[name='consent']");
    const message = form.querySelector(".form-message");
    const emailIsValid = email instanceof HTMLInputElement && email.validity.valid && email.value.trim();
    const interestIsValid = !(interest instanceof HTMLSelectElement) || interest.value;
    const consentIsValid = !(consent instanceof HTMLInputElement) || consent.checked;

    if (!emailIsValid || !interestIsValid || !consentIsValid) {
      event.preventDefault();
      if (message) {
        message.textContent = "Revisa el correo, selecciona un interes y acepta recibir correos para continuar.";
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
