const magazineReader = document.querySelector("[data-magazine-reader]");

if (magazineReader) {
  const pages = [...magazineReader.querySelectorAll("[data-magazine-page]")];
  const previousButton = magazineReader.querySelector("[data-magazine-prev]");
  const nextButton = magazineReader.querySelector("[data-magazine-next]");
  const counter = magazineReader.querySelector("[data-magazine-counter]");
  const currentLabel = magazineReader.querySelector("[data-magazine-current-label]");
  const navLabel = magazineReader.querySelector("[data-magazine-nav-label]");
  const progress = magazineReader.querySelector("[data-magazine-progress]");
  const indexDialog = magazineReader.querySelector("[data-magazine-index]");
  const indexOpenButton = magazineReader.querySelector("[data-magazine-index-open]");
  const indexCloseButton = magazineReader.querySelector("[data-magazine-index-close]");
  const fullscreenButton = magazineReader.querySelector("[data-magazine-fullscreen]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activePage = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  const pageIndexFromHash = () => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    return pages.findIndex((page) => page.id === hash);
  };

  const setIndexOpen = (open) => {
    if (!indexDialog) return;
    indexDialog.hidden = !open;
    document.body.classList.toggle("magazine-dialog-open", open);
    if (open) {
      indexCloseButton?.focus();
    } else {
      indexOpenButton?.focus();
    }
  };

  const showPage = (index, { moveFocus = false, updateHash = true } = {}) => {
    const nextIndex = Math.max(0, Math.min(index, pages.length - 1));
    activePage = nextIndex;
    pages.forEach((page, pageIndex) => {
      page.hidden = pageIndex !== activePage;
      page.setAttribute("aria-hidden", String(pageIndex !== activePage));
    });

    const active = pages[activePage];
    const label = active?.dataset.magazineLabel || `Sección ${activePage + 1}`;
    if (counter) counter.textContent = `${activePage + 1} / ${pages.length}`;
    if (currentLabel) currentLabel.textContent = label;
    if (navLabel) navLabel.textContent = label;
    if (progress) progress.style.width = `${((activePage + 1) / pages.length) * 100}%`;
    if (previousButton) previousButton.disabled = activePage === 0;
    if (nextButton) {
      nextButton.disabled = activePage === pages.length - 1;
      const text = nextButton.querySelector("span");
      if (text) text.textContent = activePage === pages.length - 2 ? "Ir al cierre" : "Siguiente";
    }

    magazineReader.querySelectorAll("[data-magazine-go]").forEach((button) => {
      const isCurrent = Number(button.dataset.magazineGo) === activePage;
      button.toggleAttribute("aria-current", isCurrent);
    });

    if (updateHash && active?.id) {
      history.replaceState(null, "", `#${active.id}`);
    }
    if (moveFocus && active) {
      active.setAttribute("tabindex", "-1");
      active.focus({ preventScroll: true });
      magazineReader.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    }
  };

  previousButton?.addEventListener("click", () => showPage(activePage - 1, { moveFocus: true }));
  nextButton?.addEventListener("click", () => showPage(activePage + 1, { moveFocus: true }));
  indexOpenButton?.addEventListener("click", () => setIndexOpen(true));
  indexCloseButton?.addEventListener("click", () => setIndexOpen(false));

  magazineReader.querySelectorAll("[data-magazine-go]").forEach((button) => {
    button.addEventListener("click", () => {
      setIndexOpen(false);
      showPage(Number(button.dataset.magazineGo), { moveFocus: true });
    });
  });

  indexDialog?.addEventListener("click", (event) => {
    if (event.target === indexDialog) setIndexOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    const isTyping = event.target instanceof HTMLInputElement
      || event.target instanceof HTMLTextAreaElement
      || event.target instanceof HTMLSelectElement;
    if (isTyping) return;
    if (event.key === "Escape" && indexDialog && !indexDialog.hidden) {
      setIndexOpen(false);
      return;
    }
    if (event.key === "ArrowLeft") showPage(activePage - 1, { moveFocus: true });
    if (event.key === "ArrowRight") showPage(activePage + 1, { moveFocus: true });
    if (event.key === "Home") showPage(0, { moveFocus: true });
    if (event.key === "End") showPage(pages.length - 1, { moveFocus: true });
  });

  magazineReader.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  magazineReader.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (Math.abs(distanceX) < 60 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    showPage(activePage + (distanceX < 0 ? 1 : -1), { moveFocus: true });
  }, { passive: true });

  if (!document.fullscreenEnabled || !magazineReader.requestFullscreen) {
    fullscreenButton?.setAttribute("hidden", "");
  } else {
    fullscreenButton?.addEventListener("click", async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await magazineReader.requestFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", () => {
      if (fullscreenButton) {
        fullscreenButton.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
      }
    });
  }

  const initialPage = pageIndexFromHash();
  showPage(initialPage >= 0 ? initialPage : 0, { updateHash: false });
}
