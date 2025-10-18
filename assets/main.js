(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Smooth scrolling for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId.length <= 1) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", targetId);
    });
  });

  // ---- HERO SVG LOADER (generic for all variants) ----
  const heroBgs = document.querySelectorAll(".hero-bg");
  if (!heroBgs.length) return;

  // Allow ?hero=<name> to override the data-graphic value (handy for testing)
  const params = new URLSearchParams(window.location.search);
  const override = params.get("hero");

  heroBgs.forEach((element) => {
    const rawName = (override || element.dataset.graphic || "").trim();
    const safeName = rawName.replace(/[^a-z0-9_-]/gi, "").toLowerCase();

    const paths = [];
    if (safeName) paths.push(`assets/hero-${safeName}.svg`);
    paths.push("assets/hero.svg");

    const injectGraphic = (queue) => {
      if (!queue.length) {
        console.warn(
          `[hero] Could not load SVG for "${rawName || "default"}"; using gradient background.`,
        );
        return;
      }

      const [current, ...rest] = queue;
      fetch(current, { cache: "force-cache" })
        .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
        .then((svg) => {
          element.innerHTML = svg;
        })
        .catch(() => injectGraphic(rest));
    };

    injectGraphic(paths);
  });
})();
