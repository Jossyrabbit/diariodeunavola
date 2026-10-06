/*
 * DDV editorial system
 * Shared interior-page shell, article reading tools, category covers and series.
 * Content is read from the existing HTML pages; this file never rewrites article copy.
 */
(function initDdvEditorialSystem() {
  "use strict";

  const body = document.body;
  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
  const isHome = body.classList.contains("ddv-home") || currentPath === "/" || currentPath === "/index.html";

  const seriesRegistry = {
    "cultivo-desde-cero": {
      name: "Cultivo desde cero",
      description: "Una ruta de lectura con artículos DDV para acompañar las etapas esenciales del autocultivo.",
      note: "de la semilla a la cosecha",
      articles: [
        "germinacion-empecemos-a-cultivar",
        "empecemos-a-cultivar-los-insumos-necesarios-para-partir",
        "vegetacion-y-lo-que-debemos-saber",
        "prefloracionn-stretching",
        "etapa-final-floracion",
      ],
    },
    "abcdiario-del-cultivo": {
      name: "ABCDiario del cultivo",
      description: "Conceptos y herramientas prácticas del archivo DDV para comprender mejor lo que ocurre en el cultivo.",
      note: "observar · entender · cultivar",
      articles: [
        "raices-en-que-ayudan-a-mi-planta",
        "nudos-que-podemos-aprender-de-ellos",
        "humedad-y-temperatura",
        "ec-y-ph-por-que-importan-en-mi-riego",
        "micorrizas-y-trichodermas-que-son-y-por-que-las-debo-usar-en-mi-cultivo",
        "nutrientes-cuales-necesitamos-y-para-que",
        "tricomas",
      ],
    },
    "ley-20000-explicada": {
      name: "Ley 20.000 explicada",
      description: "Lecturas del archivo DDV para seguir la discusión legal sobre cannabis en Chile y sus cambios.",
      note: "la ley, sin letra chica",
      articles: [
        "concentracion-en-el-trafico-y-no-el-consumidor-propuesta-hacia-la-ley-20-000",
        "la-marihuana-pasa-de-lista-i-a-lista-ii-del-reglamento-de-estupefacientes-y-psicotropicos-de-minsal",
        "ley-antinarco-que-es-y-como-comenzo",
        "ley-antinarco-que-se-aprobo-en-el-tc",
      ],
    },
    "historia-cannabica": {
      name: "Historia cannábica",
      description: "Una colección de historias reales publicadas por DDV sobre cultura, usos y memoria cannábica.",
      note: "memoria para entender el presente",
      articles: [
        "la-marihuana-durante-la-conquista-de-america",
        "el-camino-hasta-el-2015-cuando-todo-empezo-a-cambiar",
        "el-origen-del-sabor",
        "no-todo-es-papel-la-historia-del-blunt",
      ],
    },
  };

  function currentSection() {
    if (currentPath.startsWith("/actualidad") || currentPath === "/categorias/actualidad.html") return "actualidad";
    if (currentPath.startsWith("/cultivo") || currentPath === "/categorias/cultivo.html") return "cultivo";
    if (currentPath.startsWith("/cultura") || currentPath === "/categorias/cultura.html") return "cultura";
    if (currentPath.startsWith("/legislacion") || currentPath === "/categorias/legislacion.html") return "ley";
    if (currentPath === "/categorias/ciencia-salud.html") return "ciencia";
    if (currentPath.startsWith("/eventos")) return "eventos";
    if (currentPath.startsWith("/revista")) return "revista";
    return "";
  }

  function navLink(href, label, key) {
    const current = currentSection() === key ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }

  function globalHeaderMarkup() {
    return `
      <a class="brand ddv-wordmark" href="/index.html" aria-label="Diario de una Volá, inicio">
        <span class="ddv-wordmark-main">Diario</span>
        <span class="ddv-wordmark-small">de una</span>
        <span class="ddv-wordmark-main ddv-wordmark-bottom">Volá</span>
        <svg class="ddv-wordmark-star" aria-hidden="true"><use href="/assets/ddv-doodles.svg#star"></use></svg>
      </a>
      <p class="ddv-header-note" aria-hidden="true">Conocimiento<br>Comunidad<br>Cultura<br>Chile</p>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span></span><span></span><span></span><b>Menú</b>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Navegación principal">
        ${navLink("/actualidad/", "Actualidad", "actualidad")}
        ${navLink("/cultivo/", "Cultivo", "cultivo")}
        ${navLink("/cultura/", "Cultura", "cultura")}
        ${navLink("/legislacion/", "Ley", "ley")}
        ${navLink("/categorias/ciencia-salud.html", "Ciencia", "ciencia")}
        ${navLink("/eventos/", "Eventos", "eventos")}
      </nav>
      <div class="header-actions ddv-header-actions">
        <p class="ddv-header-manifesto" aria-hidden="true">El primer paso<br>para una revolución<br>es tener información.</p>
        <a class="ddv-search-link" href="/buscar.html" aria-label="Buscar en Diario de una Volá">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25"></circle><path d="m15.2 15.2 5 5"></path></svg>
        </a>
        <a class="button nav-cta ddv-revista-button${currentSection() === "revista" ? " is-current" : ""}" href="/revista/">Revista <span aria-hidden="true">→</span></a>
      </div>`;
  }

  function globalFooterMarkup() {
    return `
      <div class="footer-grid ddv-footer-grid">
        <div class="footer-brand">
          <a class="brand ddv-wordmark ddv-footer-wordmark" href="/index.html" aria-label="Diario de una Volá, inicio"><span class="ddv-wordmark-main">DDV</span><span class="ddv-wordmark-small">Diario de una Volá</span></a>
          <p>Hecho en Chile para una cultura más libre y consciente.</p>
          <a href="https://www.instagram.com/ddv.chile/" target="_blank" rel="noopener noreferrer">Instagram @ddv.chile</a>
        </div>
        <nav aria-label="Explora"><strong>Explora</strong><a href="/actualidad/">Actualidad</a><a href="/cultivo/">Cultivo</a><a href="/cultura/">Cultura</a><a href="/legislacion/">Ley</a><a href="/categorias/ciencia-salud.html">Ciencia</a><a href="/eventos/">Eventos</a></nav>
        <nav aria-label="Más DDV"><strong>Más DDV</strong><a href="/revista/">La Revista</a><a href="/comunidad.html">Comunidad</a><a href="/catalogo.html">Catálogo</a><a href="/sobre-ddv.html">Sobre DDV</a><a href="/contacto.html">Contacto</a></nav>
        <nav aria-label="Redes y políticas"><strong>Síguenos</strong><a href="https://www.instagram.com/ddv.chile/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="/politica-editorial.html">Política editorial</a><a href="/politica-privacidad.html">Privacidad</a><a href="/terminos.html">Términos</a></nav>
        <svg class="ddv-footer-leaf" aria-hidden="true"><use href="/assets/ddv-doodles.svg#leaf"></use></svg>
      </div>
      <p class="footer-bottom">© 2026 Diario de una Volá. Cultura cannábica desde Chile.</p>`;
  }

  function installGlobalShell() {
    if (isHome) return;
    body.classList.add("ddv-interior");
    const header = document.querySelector(".site-header");
    const footer = document.querySelector(".site-footer");
    if (header) {
      header.className = "site-header ddv-home-header ddv-global-header";
      header.innerHTML = globalHeaderMarkup();
    }
    if (footer) {
      footer.className = "site-footer ddv-footer ddv-global-footer";
      footer.innerHTML = globalFooterMarkup();
    }

    const toggle = document.querySelector(".ddv-global-header .menu-toggle");
    const nav = document.querySelector(".ddv-global-header #site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      nav.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  function slugify(text) {
    return String(text || "")
      .toLocaleLowerCase("es-CL")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function articleSlug(path = currentPath) {
    const match = path.match(/\/notas\/([^/]+)\.html$/);
    return match ? match[1] : "";
  }

  function seriesForArticle(slug) {
    return Object.entries(seriesRegistry).find(([, series]) => series.articles.includes(slug)) || null;
  }

  class DdvPullQuote extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      this.setAttribute("role", "figure");
      this.innerHTML = `<svg aria-hidden="true"><use href="/assets/ddv-doodles.svg#star"></use></svg><blockquote>${this.innerHTML}</blockquote>`;
    }
  }

  class DdvNote extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      if (this.hasAttribute("decorative")) {
        this.setAttribute("aria-hidden", "true");
        this.innerHTML = `<svg><use href="/assets/ddv-doodles.svg#arrow"></use></svg><span></span>`;
      } else {
        const label = this.getAttribute("label") || "Nota DDV";
        this.innerHTML = `<strong>${escapeHtml(label)}</strong><div>${this.innerHTML}</div>`;
      }
    }
  }

  class DdvFactBox extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const title = this.getAttribute("title") || "En simple";
      this.innerHTML = `<p>${escapeHtml(title)}</p><div>${this.innerHTML}</div>`;
    }
  }

  class ArticleImage extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const src = this.getAttribute("src");
      if (!src) return;
      const alt = this.getAttribute("alt") || "";
      const caption = this.getAttribute("caption") || "";
      this.innerHTML = `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }
  }

  class ArticleAd extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const size = this.getAttribute("size") || "970x250";
      this.innerHTML = `<ddv-ad-banner size="${escapeHtml(size)}" advertiser="Banner de marca"></ddv-ad-banner>`;
    }
  }

  class RelatedArticles extends HTMLElement {
    set articles(items) {
      this._articles = items;
      this.render();
    }

    connectedCallback() {
      this.render();
    }

    render() {
      if (!this.isConnected || !this._articles?.length) return;
      this.innerHTML = `
        <header><p class="ddv-kicker">Lecturas relacionadas</p><h2>Sigue en esta volá <span aria-hidden="true">→</span></h2></header>
        <div class="ddv-related-grid">${this._articles.map((article) => `
          <article>
            <a class="ddv-related-image" href="${escapeHtml(article.href)}"><img src="${escapeHtml(article.image)}" alt="" loading="lazy" decoding="async"></a>
            <a class="ddv-kicker" href="${escapeHtml(article.categoryHref || "#")}">${escapeHtml(article.category || "DDV")}</a>
            <h3><a href="${escapeHtml(article.href)}">${escapeHtml(article.title)}</a></h3>
          </article>`).join("")}</div>`;
    }
  }

  class ArticleNavigation extends HTMLElement {
    set links(value) {
      this._links = value;
      this.render();
    }

    connectedCallback() {
      this.render();
    }

    render() {
      if (!this.isConnected || !this._links) return;
      const { previous, next } = this._links;
      this.innerHTML = `
        ${previous ? `<a rel="prev" href="${escapeHtml(previous.href)}"><span>← Artículo anterior</span><strong>${escapeHtml(previous.title)}</strong></a>` : "<span></span>"}
        ${next ? `<a rel="next" href="${escapeHtml(next.href)}"><span>Siguiente artículo →</span><strong>${escapeHtml(next.title)}</strong></a>` : ""}`;
    }
  }

  const componentDefinitions = [
    ["ddv-pull-quote", DdvPullQuote],
    ["ddv-note", DdvNote],
    ["ddv-fact-box", DdvFactBox],
    ["article-image", ArticleImage],
    ["article-ad", ArticleAd],
    ["related-articles", RelatedArticles],
    ["article-navigation", ArticleNavigation],
  ];
  componentDefinitions.forEach(([name, component]) => {
    if (!customElements.get(name)) customElements.define(name, component);
  });

  function documentFromHtml(html) {
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function fetchDocument(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`No se pudo cargar ${path}: ${response.status}`);
    return documentFromHtml(await response.text());
  }

  function cardData(card) {
    const link = card.querySelector("h3 a, h2 a") || card.querySelector(".editorial-card-media");
    const image = card.querySelector("img");
    const category = card.querySelector(".category-link, .ddv-kicker");
    if (!link || !image) return null;
    return {
      href: new URL(link.getAttribute("href"), window.location.origin).pathname,
      title: link.textContent.trim(),
      image: image.getAttribute("src") || "",
      category: category?.textContent.trim() || "DDV",
      categoryHref: category?.getAttribute("href") || "#",
    };
  }

  async function categoryArticles(categoryPath) {
    const doc = await fetchDocument(categoryPath);
    return [...doc.querySelectorAll(".editorial-card")].map(cardData).filter(Boolean);
  }

  function addArticleToc(articleBody) {
    const headings = [...articleBody.querySelectorAll("h2, h3")];
    if (headings.length < 3) return;
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `${slugify(heading.textContent) || "apartado"}-${index + 1}`;
    });
    const toc = document.createElement("aside");
    toc.className = "ddv-article-toc";
    toc.setAttribute("aria-label", "Índice del artículo");
    toc.innerHTML = `<p>En esta volá</p><ol>${headings.map((heading) => `<li class="is-${heading.tagName.toLowerCase()}"><a href="#${heading.id}">${escapeHtml(heading.textContent.trim())}</a></li>`).join("")}</ol>`;
    const layout = document.createElement("div");
    layout.className = "ddv-article-reading-layout";
    articleBody.before(layout);
    layout.append(toc, articleBody);
  }

  function addSeriesContext(article, slug) {
    const match = seriesForArticle(slug);
    if (!match) return;
    const [seriesSlug, series] = match;
    const index = series.articles.indexOf(slug);
    const previous = index > 0 ? series.articles[index - 1] : "";
    const next = index < series.articles.length - 1 ? series.articles[index + 1] : "";
    const block = document.createElement("aside");
    block.className = "ddv-series-context";
    block.innerHTML = `
      <div><p>Serie DDV</p><h2><a href="/series/${seriesSlug}/">${escapeHtml(series.name)}</a></h2><span>Capítulo ${String(index + 1).padStart(2, "0")} / ${String(series.articles.length).padStart(2, "0")}</span></div>
      <nav aria-label="Navegación de la serie">
        ${previous ? `<a href="/notas/${previous}.html">← Capítulo anterior</a>` : "<span></span>"}
        ${next ? `<a href="/notas/${next}.html">Siguiente capítulo →</a>` : `<a href="/series/${seriesSlug}/">Ver la serie →</a>`}
      </nav>`;
    article.querySelector(".note-hero-figure")?.before(block);
  }

  async function addArticleContinuity(article, categoryPath, slug) {
    let items = [];
    try {
      items = await categoryArticles(categoryPath);
    } catch (error) {
      console.warn("DDV: no se pudo cargar la categoría relacionada", error);
    }
    const currentHref = `/notas/${slug}.html`;
    const currentIndex = items.findIndex((item) => item.href === currentHref);
    const candidates = [];
    const seriesMatch = seriesForArticle(slug);
    if (seriesMatch) {
      const [, series] = seriesMatch;
      const seriesItems = await Promise.all(
        series.articles.filter((articleSlugValue) => articleSlugValue !== slug).map(articleDataFromSlug),
      );
      candidates.push(...seriesItems.map((item) => ({ ...item, categoryHref: categoryPath })));
    }
    candidates.push(...items.filter((item) => item.href !== currentHref));

    if (new Set(candidates.map((item) => item.href)).size < 3) {
      try {
        const archiveItems = await categoryArticles("/notas.html");
        candidates.push(...archiveItems.filter((item) => item.href !== currentHref));
      } catch (error) {
        console.warn("DDV: no se pudo completar la selección desde el archivo", error);
      }
    }

    const related = [...new Map(candidates.map((item) => [item.href, item])).values()].slice(0, 3);
    const relatedBlock = document.createElement("related-articles");
    relatedBlock.articles = related;
    article.append(relatedBlock);

    const nav = document.createElement("article-navigation");
    nav.links = {
      previous: currentIndex > 0 ? items[currentIndex - 1] : null,
      next: currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null,
    };
    article.append(nav);
  }

  function enhanceArticle() {
    const article = document.querySelector(".note-article");
    if (!article) return;
    body.classList.add("ddv-article-page");
    const articleBody = article.querySelector(".note-body");
    const categoryLink = article.querySelector(".note-header .category-link");
    const slug = articleSlug();
    if (!articleBody || !categoryLink || !slug) return;

    article.querySelector(".note-header")?.insertAdjacentHTML("beforeend", `<svg class="ddv-article-star" aria-hidden="true"><use href="/assets/ddv-doodles.svg#star"></use></svg>`);
    const paragraphs = [...articleBody.children].filter((node) => node.matches("p, ul, ol, blockquote, figure"));
    if (paragraphs.length >= 7) {
      const ornament = document.createElement("ddv-note");
      ornament.setAttribute("decorative", "");
      paragraphs[Math.min(4, paragraphs.length - 1)].after(ornament);
    }
    if (paragraphs.length >= 12) {
      const ad = document.createElement("article-ad");
      ad.setAttribute("size", "970x250");
      paragraphs[Math.min(8, paragraphs.length - 1)].after(ad);
    }
    addArticleToc(articleBody);
    addSeriesContext(article, slug);
    addArticleContinuity(article, categoryLink.getAttribute("href"), slug);
  }

  const categoryNotes = {
    cultivo: "cultivar también es observar",
    actualidad: "contexto para cachar qué pasa",
    cultura: "la memoria también se cultiva",
    legislacion: "la ley, en palabras humanas",
    "ciencia-y-salud": "preguntar · investigar · comprender",
    eventos: "la cultura se encuentra en vivo",
    entrevistas: "conversaciones con voz propia",
    opinion: "ideas para abrir la conversación",
  };

  function enhanceCategory() {
    const hero = document.querySelector(".category-hero");
    const grid = document.querySelector(".editorial-grid");
    if (!hero || !grid) return;
    body.classList.add("ddv-category-page");
    const key = slugify(hero.querySelector("h1")?.textContent || "");
    const note = document.createElement("p");
    note.className = "ddv-category-note";
    note.setAttribute("aria-hidden", "true");
    note.textContent = categoryNotes[key] || "una portada para seguir leyendo";
    hero.append(note);
    hero.insertAdjacentHTML("beforeend", `<svg class="ddv-category-arrow" aria-hidden="true"><use href="/assets/ddv-doodles.svg#arrow"></use></svg>`);

    const cards = [...grid.querySelectorAll(":scope > .editorial-card")];
    if (!cards.length) return;
    cards[0].classList.add("ddv-category-feature");
    const recentHeading = document.createElement("div");
    recentHeading.className = "ddv-category-list-heading";
    recentHeading.innerHTML = `<p class="ddv-kicker">Archivo DDV</p><h2>Más publicaciones</h2>`;
    if (cards[1]) cards[1].before(recentHeading);
    if (cards.length > 5) {
      const ad = document.createElement("article-ad");
      ad.className = "ddv-category-ad";
      ad.setAttribute("size", "970x250");
      cards[5].before(ad);
    }
  }

  async function articleDataFromSlug(slug) {
    const path = `/notas/${slug}.html`;
    const doc = await fetchDocument(path);
    return {
      slug,
      href: path,
      title: doc.querySelector(".note-header h1")?.textContent.trim() || slug,
      image: doc.querySelector(".note-hero-image")?.getAttribute("src") || "",
      deck: doc.querySelector(".article-deck")?.textContent.trim() || "",
      category: doc.querySelector(".category-link")?.textContent.trim() || "DDV",
      categoryHref: doc.querySelector(".category-link")?.getAttribute("href") || "#",
    };
  }

  async function enhanceSeriesPage() {
    const root = document.querySelector("[data-ddv-series]");
    if (!root) return;
    body.classList.add("ddv-series-page");
    const seriesSlug = root.dataset.ddvSeries;
    const series = seriesRegistry[seriesSlug];
    if (!series) return;
    const list = root.querySelector(".ddv-series-chapters");
    const title = root.querySelector("h1");
    const description = root.querySelector(".ddv-series-page-description");
    const note = root.querySelector(".ddv-series-page-note");
    if (title) title.textContent = series.name;
    if (description) description.textContent = series.description;
    if (note) note.textContent = series.note;

    const articles = await Promise.all(series.articles.map(articleDataFromSlug));
    if (list) {
      list.innerHTML = articles.map((article, index) => `
        <article class="ddv-series-chapter">
          <span class="ddv-chapter-number">${String(index + 1).padStart(2, "0")}</span>
          <a class="ddv-series-chapter-image" href="${article.href}"><img src="${escapeHtml(article.image)}" alt="" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"></a>
          <div><p class="ddv-kicker">${escapeHtml(article.category)} · Capítulo ${index + 1}</p><h2><a href="${article.href}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.deck)}</p><a class="ddv-text-link" href="${article.href}">Leer capítulo <span aria-hidden="true">→</span></a></div>
        </article>`).join("");
    }
    const start = root.querySelector("[data-series-start]");
    if (start) start.setAttribute("href", articles[0]?.href || "/notas.html");
  }

  function enhanceEvents() {
    if (!currentPath.startsWith("/eventos")) return;
    body.classList.add("ddv-events-page");
    const empty = [...document.querySelectorAll("p, h2, h3")].find((element) => /no hay eventos/i.test(element.textContent));
    empty?.closest("section, article, div")?.remove();
  }

  function enhanceGeneralPage() {
    if (isHome || body.classList.contains("ddv-article-page") || body.classList.contains("ddv-category-page") || body.classList.contains("ddv-series-page")) return;
    body.classList.add("ddv-editorial-page");
    document.querySelector(".page-hero")?.insertAdjacentHTML("beforeend", `<svg class="ddv-page-hero-star" aria-hidden="true"><use href="/assets/ddv-doodles.svg#star"></use></svg>`);
  }

  installGlobalShell();
  enhanceArticle();
  enhanceCategory();
  enhanceSeriesPage().catch((error) => console.warn("DDV: no se pudo construir la serie", error));
  enhanceEvents();
  enhanceGeneralPage();
})();
