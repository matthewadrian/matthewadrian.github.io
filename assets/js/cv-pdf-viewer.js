(function () {
  const container = document.getElementById("cv-pdf-container");
  if (!container || typeof pdfjsLib === "undefined") return;

  const pdfUrl = container.dataset.pdfUrl;
  if (!pdfUrl) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  async function renderPage(page, containerWidth) {
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const outputScale = Math.min(window.devicePixelRatio || 1, 3);

    const pageEl = document.createElement("div");
    pageEl.className = "cv-pdf-page";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    pageEl.appendChild(canvas);
    container.appendChild(pageEl);

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    await page.render({ canvasContext: context, viewport, transform }).promise;
  }

  let pdfDoc = null;
  let renderToken = 0;

  async function renderPdf() {
    const token = ++renderToken;

    try {
      if (!pdfDoc) {
        pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
      }

      container.innerHTML = "";
      container.removeAttribute("aria-busy");

      // Measure after layout so pages render at the correct display width.
      const measuredWidth = container.getBoundingClientRect().width;
      const containerWidth = measuredWidth > 0 ? measuredWidth : 816;

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (token !== renderToken) return;
        const page = await pdfDoc.getPage(pageNum);
        await renderPage(page, containerWidth);
      }
    } catch (error) {
      container.innerHTML =
        '<p class="cv-pdf-error">Unable to display the CV. Use the download link below.</p>';
      console.error("CV PDF render failed:", error);
    }
  }

  function scheduleRender() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(renderPdf);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleRender);
  } else {
    scheduleRender();
  }

  window.addEventListener("resize", () => {
    window.clearTimeout(window.__cvPdfResizeTimer);
    window.__cvPdfResizeTimer = window.setTimeout(scheduleRender, 150);
  });
})();
