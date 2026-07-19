const magazineReader = document.querySelector("[data-magazine-reader]");

if (magazineReader) {
  const pages = [...magazineReader.querySelectorAll("[data-magazine-leaf]")];
  const pageDeck = magazineReader.querySelector("[data-magazine-page-deck]");
  const previousButton = magazineReader.querySelector("[data-magazine-prev]");
  const nextButton = magazineReader.querySelector("[data-magazine-next]");
  const counter = magazineReader.querySelector("[data-magazine-counter]");
  const currentLabel = magazineReader.querySelector("[data-magazine-current-label]");
  const navLabel = magazineReader.querySelector("[data-magazine-nav-label]");
  const progress = magazineReader.querySelector("[data-magazine-progress]");
  const indexDialog = magazineReader.querySelector("[data-magazine-index]");
  const indexOpenButton = magazineReader.querySelector("[data-magazine-index-open]");
  const indexCloseButton = magazineReader.querySelector("[data-magazine-index-close]");
  const printButton = magazineReader.querySelector("[data-magazine-print]");
  const fullscreenButton = magazineReader.querySelector("[data-magazine-fullscreen]");
  const desktopView = window.matchMedia("(min-width: 901px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeGroup = 0;
  let focusPage = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isTurningPage = false;
  let turnTimer = 0;
  let pageBeforePrint = 0;

  const pageGroups = () => {
    if (!desktopView.matches) return pages.map((_, index) => [index]);
    if (pages.length <= 1) return [[0]];
    const groups = [[0]];
    const lastIndex = pages.length - 1;
    for (let index = 1; index < lastIndex; index += 2) {
      const group = [index];
      if (index + 1 < lastIndex) group.push(index + 1);
      groups.push(group);
    }
    groups.push([lastIndex]);
    return groups;
  };

  const pageIndexFromHash = () => {
    const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    return pages.findIndex((page) => page.id === hash);
  };

  const setIndexOpen = (open) => {
    if (!indexDialog) return;
    indexDialog.hidden = !open;
    document.body.classList.toggle("magazine-dialog-open", open);
    if (open) indexCloseButton?.focus();
    else indexOpenButton?.focus();
  };

  const groupForPage = (pageIndex) => {
    const groups = pageGroups();
    const found = groups.findIndex((group) => group.includes(pageIndex));
    return found >= 0 ? found : 0;
  };

  const fitPageContent = (page) => {
    if (!page || page.hidden) return;
    page.classList.remove("is-dense", "is-very-dense");
    if (page.scrollHeight > page.clientHeight + 2) page.classList.add("is-dense");
    if (page.scrollHeight > page.clientHeight + 2) page.classList.add("is-very-dense");
  };

  const showPage = (pageIndex, {
    direction = "forward",
    moveFocus = false,
    updateHash = true,
    animate = true,
  } = {}) => {
    const safePageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
    const groups = pageGroups();
    activeGroup = groupForPage(safePageIndex);
    focusPage = safePageIndex;
    const visiblePages = groups[activeGroup];

    pages.forEach((page, index) => {
      const isVisible = visiblePages.includes(index);
      page.hidden = !isVisible;
      page.setAttribute("aria-hidden", String(!isVisible));
      page.classList.remove("is-left-page", "is-right-page", "is-entering-forward", "is-entering-backward");
      if (isVisible) {
        page.querySelectorAll("img[loading='lazy']").forEach((image) => { image.loading = "eager"; });
      }
    });

    visiblePages.forEach((index, position) => {
      const page = pages[index];
      page.classList.add(position === 0 && visiblePages.length > 1 ? "is-left-page" : "is-right-page");
      if (animate && !reducedMotion.matches) {
        page.classList.add(direction === "backward" ? "is-entering-backward" : "is-entering-forward");
      }
    });
    pageDeck?.classList.toggle("shows-single-page", visiblePages.length === 1);
    requestAnimationFrame(() => visiblePages.forEach((index) => fitPageContent(pages[index])));

    const firstNumber = visiblePages[0] + 1;
    const lastNumber = visiblePages[visiblePages.length - 1] + 1;
    const pageText = firstNumber === lastNumber ? `${firstNumber}` : `${firstNumber}–${lastNumber}`;
    const labels = visiblePages.map((index) => pages[index]?.dataset.magazineLabel).filter(Boolean);
    const label = [...new Set(labels)].join(" / ");
    if (counter) counter.textContent = `Página ${pageText} de ${pages.length}`;
    if (currentLabel) currentLabel.textContent = label;
    if (navLabel) navLabel.textContent = label;
    if (progress) progress.style.width = `${(lastNumber / pages.length) * 100}%`;
    if (previousButton) previousButton.disabled = activeGroup === 0;
    if (nextButton) {
      nextButton.disabled = activeGroup === groups.length - 1;
      const text = nextButton.querySelector("span");
      if (text) text.textContent = activeGroup === groups.length - 2 ? "Ir al cierre" : "Pasar página";
    }

    magazineReader.querySelectorAll("[data-magazine-go]").forEach((button) => {
      button.toggleAttribute("aria-current", visiblePages.includes(Number(button.dataset.magazineGo)));
    });

    const focusedPage = pages[focusPage];
    if (updateHash && focusedPage?.id) history.replaceState(null, "", `#${focusedPage.id}`);
    if (moveFocus && focusedPage) {
      focusedPage.setAttribute("tabindex", "-1");
      focusedPage.focus({ preventScroll: true });
      magazineReader.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    }
  };

  const createTurnSheet = (page, direction) => {
    const sheet = document.createElement("div");
    sheet.className = `magazine-turn-sheet is-${direction}`;
    sheet.setAttribute("aria-hidden", "true");

    const front = page.cloneNode(true);
    front.removeAttribute("id");
    front.removeAttribute("hidden");
    front.classList.remove("is-entering-forward", "is-entering-backward", "is-left-page", "is-right-page");
    front.classList.add("magazine-turn-face", "magazine-turn-front");
    front.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    front.querySelectorAll("a, button, [tabindex]").forEach((element) => element.setAttribute("tabindex", "-1"));

    const back = document.createElement("div");
    back.className = "magazine-turn-face magazine-turn-back";
    sheet.append(front, back);
    return sheet;
  };

  const turnMobilePage = (targetPage, direction) => {
    if (!pageDeck || desktopView.matches || reducedMotion.matches) {
      showPage(targetPage, { direction, moveFocus: true });
      return;
    }
    if (isTurningPage || targetPage === focusPage) return;

    isTurningPage = true;
    magazineReader.classList.add("is-turning-page");
    const sheetPage = direction === "forward" ? pages[focusPage] : pages[targetPage];
    const sheet = createTurnSheet(sheetPage, direction);
    pageDeck.append(sheet);

    if (direction === "forward") {
      showPage(targetPage, { direction, moveFocus: true, animate: false });
    }

    const finishTurn = () => {
      if (!isTurningPage) return;
      window.clearTimeout(turnTimer);
      if (direction === "backward") {
        showPage(targetPage, { direction, moveFocus: true, animate: false });
      }
      sheet.remove();
      magazineReader.classList.remove("is-turning-page");
      isTurningPage = false;
    };

    sheet.addEventListener("animationend", finishTurn, { once: true });
    turnTimer = window.setTimeout(finishTurn, 850);
    requestAnimationFrame(() => sheet.classList.add("is-turning"));
  };

  const moveGroup = (offset) => {
    const groups = pageGroups();
    const targetGroup = Math.max(0, Math.min(activeGroup + offset, groups.length - 1));
    if (targetGroup === activeGroup) return;
    const direction = offset < 0 ? "backward" : "forward";
    turnMobilePage(groups[targetGroup][0], direction);
  };

  previousButton?.addEventListener("click", () => moveGroup(-1));
  nextButton?.addEventListener("click", () => moveGroup(1));
  indexOpenButton?.addEventListener("click", () => setIndexOpen(true));
  indexCloseButton?.addEventListener("click", () => setIndexOpen(false));

  magazineReader.querySelectorAll("[data-magazine-go]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.magazineGo);
      setIndexOpen(false);
      showPage(target, { direction: target < focusPage ? "backward" : "forward", moveFocus: true });
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
    if (event.key === "ArrowLeft" || event.key === "PageUp") moveGroup(-1);
    if (event.key === "ArrowRight" || event.key === "PageDown") moveGroup(1);
    if (event.key === "Home") showPage(0, { direction: "backward", moveFocus: true });
    if (event.key === "End") showPage(pages.length - 1, { direction: "forward", moveFocus: true });
  });

  magazineReader.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  magazineReader.addEventListener("touchend", (event) => {
    if (isTurningPage) return;
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (Math.abs(distanceX) < 60 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
    moveGroup(distanceX < 0 ? 1 : -1);
  }, { passive: true });

  desktopView.addEventListener("change", () => {
    window.clearTimeout(turnTimer);
    pageDeck?.querySelector(".magazine-turn-sheet")?.remove();
    magazineReader.classList.remove("is-turning-page");
    isTurningPage = false;
    showPage(focusPage, { updateHash: false, animate: false });
  });

  const preparePrintEdition = () => {
    if (magazineReader.classList.contains("is-printing")) return;
    pageBeforePrint = focusPage;
    window.clearTimeout(turnTimer);
    pageDeck?.querySelector(".magazine-turn-sheet")?.remove();
    magazineReader.classList.remove("is-turning-page");
    magazineReader.classList.add("is-printing");
    isTurningPage = false;
    pages.forEach((page) => {
      page.hidden = false;
      page.setAttribute("aria-hidden", "false");
      page.classList.remove("is-left-page", "is-right-page", "is-entering-forward", "is-entering-backward");
    });
  };

  const restoreDigitalEdition = () => {
    if (!magazineReader.classList.contains("is-printing")) return;
    magazineReader.classList.remove("is-printing");
    showPage(pageBeforePrint, { updateHash: false, animate: false });
  };

  printButton?.addEventListener("click", () => {
    preparePrintEdition();
    window.print();
    window.setTimeout(restoreDigitalEdition, 0);
  });
  window.addEventListener("beforeprint", preparePrintEdition);
  window.addEventListener("afterprint", restoreDigitalEdition);

  if (!document.fullscreenEnabled || !magazineReader.requestFullscreen) {
    fullscreenButton?.setAttribute("hidden", "");
  } else {
    fullscreenButton?.addEventListener("click", async () => {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await magazineReader.requestFullscreen();
    });
    document.addEventListener("fullscreenchange", () => {
      if (fullscreenButton) fullscreenButton.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
    });
  }

  const initialPage = pageIndexFromHash();
  showPage(initialPage >= 0 ? initialPage : 0, { updateHash: false });
}
