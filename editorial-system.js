/*
 * DDV editorial system
 * Shared interior-page shell, article reading tools, category covers and series.
 * Content is read from the existing HTML pages; this file never rewrites article copy.
 */
(function initDdvEditorialSystem() {
  "use strict";

  if (window.__DDV_EDITORIAL_SYSTEM_LOADED__) return;
  window.__DDV_EDITORIAL_SYSTEM_LOADED__ = true;

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
    if (currentPath === "/catalogo" || currentPath === "/catalogo.html" || currentPath.startsWith("/productos/")) return "tienda";
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
        ${navLink("/catalogo.html", "Tienda", "tienda")}
        <a class="ddv-mobile-revista" href="/revista/"${currentSection() === "revista" ? ' aria-current="page"' : ""}>Revista →</a>
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
        <nav aria-label="Más DDV"><strong>Más DDV</strong><a href="/revista/">La Revista</a><a href="/comunidad.html">Comunidad</a><a href="/catalogo.html">Tienda</a><a href="/sobre-ddv.html">Sobre DDV</a><a href="/contacto.html">Contacto</a></nav>
        <nav aria-label="Redes y políticas"><strong>Síguenos</strong><a href="https://www.instagram.com/ddv.chile/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="/politica-editorial.html">Política editorial</a><a href="/politica-privacidad.html">Privacidad</a><a href="/terminos.html">Términos</a></nav>
        <svg class="ddv-footer-leaf" aria-hidden="true"><use href="/assets/ddv-doodles.svg#leaf"></use></svg>
      </div>
      <p class="footer-bottom">© 2026 Diario de una Volá. Cultura cannábica desde Chile.</p>`;
  }

  class DDVHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const header = document.createElement("header");
      header.className = "site-header ddv-home-header ddv-global-header";
      header.innerHTML = globalHeaderMarkup();
      this.replaceWith(header);
    }
  }

  class DDVFooter extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const footer = document.createElement("footer");
      footer.className = "site-footer ddv-footer ddv-global-footer";
      footer.innerHTML = globalFooterMarkup();
      this.replaceWith(footer);
    }
  }

  class DDVContainer extends HTMLElement {
    static apply(element) {
      element?.classList.add("ddv-container");
      return element;
    }

    connectedCallback() {
      this.classList.add("ddv-container");
    }
  }

  class CategoryHero {
    constructor(element) {
      this.element = element;
    }

    enhance() {
      const hero = DDVContainer.apply(this.element);
      if (!hero) return "";
      const eyebrow = hero.querySelector(".eyebrow");
      if (eyebrow) eyebrow.textContent = "Archivo DDV";
      const key = slugify(hero.querySelector("h1")?.textContent || "");
      if (!hero.querySelector(".ddv-category-note")) {
        const note = document.createElement("p");
        note.className = "ddv-category-note";
        note.setAttribute("aria-hidden", "true");
        note.textContent = categoryNotes[key] || "una portada para seguir leyendo";
        hero.append(note);
      }
      if (!hero.querySelector(".ddv-category-arrow")) {
        hero.insertAdjacentHTML("beforeend", `<svg class="ddv-category-arrow" aria-hidden="true"><use href="/assets/ddv-doodles.svg#arrow"></use></svg>`);
      }
      return key;
    }
  }

  class ArticleCard {
    constructor(element) {
      this.element = element;
    }

    enhance({ featured = false, eager = false } = {}) {
      if (!this.element) return;
      this.element.classList.add("ddv-article-card");
      if (featured) this.element.classList.add("ddv-category-feature");
      const image = this.element.querySelector("img");
      if (image && eager) image.loading = "eager";
    }
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

  function globalNewsletterElement(context = "interior") {
    const section = document.createElement("section");
    const emailId = `newsletter-email-${slugify(context) || "interior"}`;
    section.className = "ddv-newsletter ddv-interior-newsletter";
    section.setAttribute("aria-labelledby", `${emailId}-title`);
    section.innerHTML = `
      <div><h2 id="${emailId}-title">No te pierdas en la volá.</h2><p>Una selección de DDV directo a tu correo. Noticias, artículos, eventos y más.</p></div>
      <form name="newsletter-ddv" method="post" action="/gracias.html" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="newsletter-ddv"><input type="hidden" name="source" value="newsletter-${escapeHtml(context)}">
        <p class="form-hidden" aria-hidden="true"><label>No completar <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <label class="sr-only" for="${emailId}">Tu correo electrónico</label>
        <div class="ddv-newsletter-row"><input id="${emailId}" name="email" type="email" autocomplete="email" placeholder="Tu correo electrónico" required><button class="ddv-newsletter-button" type="submit">Quiero recibir DDV</button></div>
        <label class="ddv-consent" for="${emailId}-consent"><input id="${emailId}-consent" name="consent" type="checkbox" required> Acepto recibir correos de DDV y puedo salir de la lista cuando quiera.</label>
      </form>
      <div class="ddv-newsletter-note">conocimiento · comunidad · cultura<br>directo a tu mail</div>`;
    return section;
  }

  function articleSlug(path = currentPath) {
    const match = path.match(/\/notas\/([^/]+?)(?:\.html)?\/?$/);
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
            ${article.readTime ? `<span class="ddv-related-time">${escapeHtml(article.readTime)}</span>` : ""}
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

  // Empty by default: editors can later map an article slug to real product IDs
  // without coupling commercial recommendations to the article templates.
  window.DDV_RELATED_PRODUCTS = window.DDV_RELATED_PRODUCTS || Object.create(null);

  class DdvProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      const article = this.getAttribute("for") || articleSlug();
      const ids = window.DDV_RELATED_PRODUCTS[article] || [];
      const catalogProducts = window.DDV_CATALOG?.products || [];
      const items = ids.map((id) => catalogProducts.find((product) => product.id === id)).filter(Boolean);
      if (!items.length) {
        this.hidden = true;
        return;
      }
      const productPath = (product) => {
        const clean = String(product.name || "producto")
          .toLocaleLowerCase("es-CL")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 84) || "producto";
        const key = String(product.id || product.sku || "")
          .toLocaleLowerCase("es-CL")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 36);
        return `/productos/${key && key !== clean ? `${clean}-${key}` : clean}.html`;
      };
      const price = (value) => Number.isFinite(value)
        ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Math.round(value))
        : "Consultar";
      this.innerHTML = `
        <header><p class="ddv-kicker">Selección vinculada</p><h2>Puede servirte</h2></header>
        <div>${items.map((product) => `<article><a href="${productPath(product)}"><img src="${escapeHtml(product.image || "")}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async"></a><p>${escapeHtml(product.category || "Tienda DDV")}</p><h3><a href="${productPath(product)}">${escapeHtml(product.name)}</a></h3><strong>${escapeHtml(price(product.finalPrice))}</strong></article>`).join("")}</div>`;
    }
  }

  const componentDefinitions = [
    ["ddv-header", DDVHeader],
    ["ddv-footer", DDVFooter],
    ["ddv-container", DDVContainer],
    ["ddv-pull-quote", DdvPullQuote],
    ["ddv-note", DdvNote],
    ["ddv-fact-box", DdvFactBox],
    ["article-image", ArticleImage],
    ["article-ad", ArticleAd],
    ["related-articles", RelatedArticles],
    ["article-navigation", ArticleNavigation],
    ["ddv-product-recommendations", DdvProductRecommendations],
  ];
  componentDefinitions.forEach(([name, component]) => {
    if (!customElements.get(name)) customElements.define(name, component);
  });
  window.DDVComponents = Object.freeze({
    DDVHeader,
    DDVFooter,
    DDVContainer,
    CategoryHero,
    ArticleCard,
    AdBanner: customElements.get("ddv-ad-banner"),
    DDVNote: DdvNote,
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
    const meta = card.querySelector(".card-meta, .ddv-meta")?.textContent || "";
    const readTime = meta.match(/\b\d+\s*min(?:\s+de\s+lectura)?\b/i)?.[0] || "";
    if (!link || !image) return null;
    return {
      href: new URL(link.getAttribute("href"), window.location.origin).pathname,
      title: link.textContent.trim(),
      image: image.getAttribute("src") || "",
      category: category?.textContent.trim() || "DDV",
      categoryHref: category?.getAttribute("href") || "#",
      readTime,
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
    toc.innerHTML = `<p>En esta volá</p><ol>${headings.map((heading) => `<li class="is-${heading.tagName.toLowerCase()}"><a href="#${heading.id}">${escapeHtml(heading.dataset.tocLabel || heading.textContent.trim())}</a></li>`).join("")}</ol>`;
    const layout = document.createElement("div");
    layout.className = "ddv-article-reading-layout";
    articleBody.before(layout);
    layout.append(toc, articleBody);
  }

  function enhanceStepArticle(articleBody) {
    const directParagraphs = [...articleBody.children].filter((node) => node.matches("p"));
    const materialsLabel = directParagraphs.find((node) => /^materiales:?$/i.test(node.textContent.trim()));
    if (materialsLabel) {
      const materials = document.createElement("section");
      materials.className = "ddv-materials-block";
      const heading = document.createElement("h2");
      heading.textContent = materialsLabel.textContent.trim();
      heading.dataset.tocLabel = materialsLabel.textContent.trim().replace(/:$/, "");
      materialsLabel.before(materials);
      materials.append(heading);
      let cursor = materialsLabel.nextElementSibling;
      materialsLabel.remove();
      while (cursor && cursor.matches("p") && !/^paso\s+n[º°o]?\s*\d+/i.test(cursor.textContent.trim())) {
        const next = cursor.nextElementSibling;
        if (/^(recipiente limpio|papel absorbente|agua destilada)$/i.test(cursor.textContent.trim())) {
          const item = document.createElement("p");
          item.textContent = cursor.textContent;
          materials.append(item);
          cursor.remove();
        } else {
          break;
        }
        cursor = next;
      }
    }

    [...articleBody.children].filter((node) => node.matches("p")).forEach((paragraph) => {
      const match = paragraph.textContent.trim().match(/^paso\s+n[º°o]?\s*(\d+)/i);
      if (!match) return;
      const number = String(Number(match[1])).padStart(2, "0");
      const heading = document.createElement("h2");
      heading.className = "ddv-step-heading";
      heading.id = `paso-${number}`;
      heading.dataset.tocLabel = paragraph.textContent.trim();
      heading.innerHTML = `<span class="ddv-step-number" aria-hidden="true">${number}</span><span>${escapeHtml(paragraph.textContent.trim())}</span>`;
      paragraph.replaceWith(heading);
    });
  }

  function insertArticleAd(articleBody, contentCount) {
    if (contentCount < 12) return;
    const ad = document.createElement("article-ad");
    ad.setAttribute("size", "970x250");
    const steps = [...articleBody.querySelectorAll(".ddv-step-heading")];
    if (steps.length >= 3) {
      steps[2].before(ad);
      return;
    }
    const blocks = [...articleBody.children].filter((node) => node.matches("p, ul, ol, blockquote, figure"));
    blocks[Math.min(8, blocks.length - 1)]?.after(ad);
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
    const categoryLink = article.querySelector(".note-header .category-link");
    if (categoryLink && !article.querySelector(".ddv-series-kicker")) {
      categoryLink.insertAdjacentHTML("afterend", `<span class="ddv-series-kicker"> · Serie DDV</span>`);
    }
    if (next) {
      const continuation = document.createElement("aside");
      continuation.className = "ddv-series-next";
      continuation.innerHTML = `<p>Continúa la serie</p><a href="/notas/${next}.html"><span>Siguiente capítulo →</span><strong>${escapeHtml(series.name)}</strong></a>`;
      const anchor = article.querySelector(".note-products, .newsletter-inline");
      if (anchor) anchor.before(continuation);
      else article.append(continuation);
    }
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
    const insertionAnchor = article.querySelector(".ddv-series-next, .note-products, .ddv-interior-newsletter");
    if (insertionAnchor) insertionAnchor.before(relatedBlock);
    else article.append(relatedBlock);

    const nav = document.createElement("article-navigation");
    nav.links = {
      previous: currentIndex > 0 ? items[currentIndex - 1] : null,
      next: currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null,
    };
    if (insertionAnchor) insertionAnchor.before(nav);
    else article.append(nav);
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
    enhanceStepArticle(articleBody);
    const paragraphs = [...articleBody.children].filter((node) => node.matches("p, ul, ol, blockquote, figure"));
    if (paragraphs.length >= 7) {
      const ornament = document.createElement("ddv-note");
      ornament.setAttribute("decorative", "");
      paragraphs[Math.min(4, paragraphs.length - 1)].after(ornament);
    }
    insertArticleAd(articleBody, paragraphs.length);
    addArticleToc(articleBody);
    addSeriesContext(article, slug);
    const products = article.querySelector(".note-products");
    if (products) {
      const eyebrow = products.querySelector(".eyebrow");
      const title = products.querySelector("h2");
      if (eyebrow) eyebrow.textContent = "Productos relacionados";
      if (title) title.textContent = "Puede servirte";
    }
    const oldNewsletter = article.querySelector(".newsletter-inline");
    oldNewsletter?.replaceWith(globalNewsletterElement(`article-${slug}`));
    addArticleContinuity(article, categoryLink.getAttribute("href"), slug);
  }

  const categoryNotes = {
    cultivo: "cultivar también es observar",
    actualidad: "contexto para cachar qué pasa",
    cultura: "la memoria también se cultiva",
    "cultura-e-historia": "la memoria también se cultiva",
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
    const key = new CategoryHero(hero).enhance();
    DDVContainer.apply(grid.closest(".editorial-section"));

    const cards = [...grid.querySelectorAll(":scope > .editorial-card")];
    if (!cards.length) return;
    cards.forEach((card, index) => new ArticleCard(card).enhance({ featured: index === 0, eager: index === 0 }));
    const recentHeading = document.createElement("div");
    recentHeading.className = "ddv-category-list-heading";
    recentHeading.innerHTML = `<p class="ddv-kicker">Archivo reciente</p><h2>Últimas publicaciones</h2>`;
    if (cards[1]) cards[1].before(recentHeading);
    if (cards.length > 5) {
      const ad = document.createElement("article-ad");
      ad.className = "ddv-category-ad";
      ad.setAttribute("size", "970x250");
      cards[5].before(ad);
    }

    const initialCardCount = 10;
    if (cards.length > initialCardCount) {
      cards.slice(initialCardCount).forEach((card) => card.classList.add("ddv-category-card-hidden"));
      const more = document.createElement("button");
      more.className = "button ddv-category-more";
      more.type = "button";
      more.setAttribute("aria-expanded", "false");
      more.textContent = "Ver más publicaciones ↓";
      more.addEventListener("click", () => {
        const hiddenCards = cards.filter((card) => card.classList.contains("ddv-category-card-hidden"));
        hiddenCards.slice(0, 6).forEach((card) => card.classList.remove("ddv-category-card-hidden"));
        const remaining = cards.some((card) => card.classList.contains("ddv-category-card-hidden"));
        more.setAttribute("aria-expanded", String(!remaining));
        if (!remaining) more.remove();
      });
      grid.append(more);
    }

    if (key === "cultivo") {
      const editorialSection = grid.closest(".editorial-section");
      const series = document.createElement("section");
      series.className = "ddv-category-series ddv-container";
      series.setAttribute("aria-labelledby", "cultivo-series-title");
      series.innerHTML = `
        <header><p class="ddv-kicker">Colecciones reales</p><h2 id="cultivo-series-title">Series de cultivo</h2><p>Recorridos para leer con tiempo y seguir cada proceso en orden.</p></header>
        <div>
          <a href="/series/cultivo-desde-cero/"><span>Serie DDV</span><strong>Cultivo desde cero</strong><small>${seriesRegistry["cultivo-desde-cero"].articles.length} capítulos publicados</small></a>
          <a href="/series/abcdiario-del-cultivo/"><span>Serie DDV</span><strong>ABCDiario del cultivo</strong><small>${seriesRegistry["abcdiario-del-cultivo"].articles.length} capítulos publicados</small></a>
        </div>`;
      editorialSection?.after(series);
    }
  }

  function enhanceCatalog() {
    const productSection = document.querySelector("#catalogo-productos");
    const hero = document.querySelector(".catalog-page-hero");
    if (!productSection || !hero) return;
    body.classList.add("ddv-catalog-page");
    const main = document.querySelector("main");
    main?.querySelectorAll(":scope > .catalog-page-hero, :scope > .catalog-discovery, :scope > .catalog-banner, :scope > .catalog-section")
      .forEach((section) => section.classList.add("ddv-container"));
    const eyebrow = hero.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = "Tienda DDV";
    hero.insertAdjacentHTML("beforeend", `<p class="ddv-catalog-note" aria-hidden="true">elegir mejor<br>también es cultivar</p><svg class="ddv-catalog-arrow" aria-hidden="true"><use href="/assets/ddv-doodles.svg#arrow"></use></svg>`);
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
      readTime: [...doc.querySelectorAll(".article-meta span")].find((node) => /min/i.test(node.textContent))?.textContent.trim() || "",
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

  async function enhanceEvents() {
    if (!currentPath.startsWith("/eventos")) return;
    body.classList.add("ddv-events-page");
    if (currentPath !== "/eventos" && currentPath !== "/eventos/" && currentPath !== "/eventos.html") return;
    const hero = document.querySelector(".page-hero");
    const section = document.querySelector("main .editorial-section");
    const main = document.querySelector("main");
    if (!hero || !section || !main) return;

    hero.classList.add("ddv-events-hero");
    hero.innerHTML = `
      <p class="ddv-kicker">De la escena</p>
      <h1>Agenda DDV</h1>
      <p>Encuentros, ferias y cultura cannábica en Chile.</p>
      <span class="ddv-events-note" aria-hidden="true">cultura / en vivo</span>
      <svg class="ddv-events-arrow" aria-hidden="true"><use href="/assets/ddv-doodles.svg#arrow"></use></svg>`;

    const upcoming = [...section.querySelectorAll(".event-card:not(.is-past)")];
    if (upcoming.length) {
      section.classList.add("ddv-events-landing");
      section.querySelector(".section-heading")?.replaceChildren();
      section.insertAdjacentHTML("afterbegin", `<header class="ddv-events-section-heading"><p class="ddv-kicker">Lo que viene</p><h2>Próximos encuentros</h2></header>`);
    } else {
      const archive = await fetchDocument("/eventos/archivo.html");
      const archiveCards = [...archive.querySelectorAll(".event-card")];
      section.className = "editorial-section ddv-events-landing";
      section.innerHTML = `
        <header class="ddv-events-section-heading"><p class="ddv-kicker">Mientras tanto...</p><h2>Pégate una vuelta por lo que ya pasó.</h2><p>Por ahora no tenemos próximas fechas publicadas.</p></header>`;
      if (archiveCards.length) {
        const lead = document.importNode(archiveCards[0], true);
        lead.classList.add("ddv-event-lead");
        section.append(lead);
        const ad = document.createElement("article-ad");
        ad.className = "ddv-events-ad";
        ad.setAttribute("size", "1200x250");
        section.append(ad);
        if (archiveCards.length > 1) {
          const archiveHeading = document.createElement("header");
          archiveHeading.className = "ddv-events-archive-heading";
          archiveHeading.innerHTML = `<div><p class="ddv-kicker">Archivo DDV</p><h2>Eventos anteriores</h2></div><a class="ddv-text-link" href="/eventos/archivo.html">Ver todo el archivo →</a>`;
          const grid = document.createElement("div");
          grid.className = "event-grid ddv-events-archive-grid";
          archiveCards.slice(1).forEach((card) => grid.append(document.importNode(card, true)));
          section.append(archiveHeading, grid);
        }
      }
    }
    main.append(globalNewsletterElement("eventos"));
  }

  function enhanceGeneralPage() {
    if (isHome || body.classList.contains("ddv-article-page") || body.classList.contains("ddv-category-page") || body.classList.contains("ddv-series-page") || body.classList.contains("ddv-catalog-page")) return;
    body.classList.add("ddv-editorial-page");
    document.querySelector(".page-hero")?.insertAdjacentHTML("beforeend", `<svg class="ddv-page-hero-star" aria-hidden="true"><use href="/assets/ddv-doodles.svg#star"></use></svg>`);
  }

  installGlobalShell();
  enhanceArticle();
  enhanceCategory();
  enhanceCatalog();
  enhanceSeriesPage().catch((error) => console.warn("DDV: no se pudo construir la serie", error));
  enhanceEvents().catch((error) => console.warn("DDV: no se pudo construir la portada de eventos", error));
  enhanceGeneralPage();
})();
