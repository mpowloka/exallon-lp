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

  // ---- HERO STICKY SCROLL EFFECT ----
  const stickyHero = document.querySelector(".hero[data-scroll-sticky]");
  if (stickyHero) {
    const scrollContainer = stickyHero.closest(".scroll-container");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileBreakpoint = window.matchMedia("(max-width: 768px)");
    const shouldDisableStickyHero = () =>
      prefersReducedMotion.matches || mobileBreakpoint.matches;

    const disableStickyHero = () => {
      stickyHero.style.setProperty("--hero-scale", "1");
      stickyHero.style.setProperty("--hero-progress", "0");
      stickyHero.style.setProperty("--hero-offset", "0px");
      stickyHero.style.setProperty("--hero-radius", "0px");
      if (scrollContainer) {
        scrollContainer.style.removeProperty("--hero-scroll-length");
      }
    };

    if (!scrollContainer) {
      disableStickyHero();
      return;
    }

    const minScale = parseFloat(stickyHero.dataset.shrinkMin || "0.68");
    const distanceFactor = parseFloat(stickyHero.dataset.shrinkDistance || "1");
    const easePower = parseFloat(stickyHero.dataset.shrinkEase || "1");

    let containerTop = 0;
    let containerHeight = 0;
    let viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
    let ticking = false;

    const clamp = (value) => Math.min(Math.max(value, 0), 1);

    const updateMetrics = () => {
      viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const heroRect = stickyHero.getBoundingClientRect();
      const heroHeight = stickyHero.offsetHeight || heroRect.height || viewportHeight;
      const dynamicHeight = Math.max(
        viewportHeight * (1 + distanceFactor),
        heroHeight + viewportHeight * 0.75,
      );

      scrollContainer.style.setProperty("--hero-scroll-length", `${dynamicHeight}px`);

      const containerRect = scrollContainer.getBoundingClientRect();
      containerHeight = scrollContainer.offsetHeight || containerRect.height || dynamicHeight;
      containerTop = containerRect.top + (window.scrollY || window.pageYOffset);
    };

    const applyScale = () => {
      if (shouldDisableStickyHero()) {
        disableStickyHero();
        return;
      }
      if (!containerHeight) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const range = Math.max(containerHeight * distanceFactor - viewportHeight, viewportHeight);
      const rawProgress = range > 0 ? (scrollY - containerTop) / range : 0;
      const progress = clamp(rawProgress);
      const eased = clamp(Math.pow(progress, easePower));
      const scale = 1 - (1 - minScale) * eased;
      const baseHeight = stickyHero.offsetHeight || viewportHeight;
      const anchorOffset = -0.5 * baseHeight * (1 - scale);
      const radius = Math.min(48, 64 * eased);

      stickyHero.style.setProperty("--hero-scale", scale.toFixed(3));
      stickyHero.style.setProperty("--hero-progress", eased.toFixed(3));
      stickyHero.style.setProperty("--hero-offset", `${anchorOffset.toFixed(1)}px`);
      stickyHero.style.setProperty("--hero-radius", `${radius.toFixed(1)}px`);
    };

    const requestTick = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        applyScale();
        ticking = false;
      });
    };

    const handleScroll = () => {
      if (shouldDisableStickyHero()) {
        disableStickyHero();
        return;
      }
      requestTick();
    };

    const handleResize = () => {
      if (shouldDisableStickyHero()) {
        disableStickyHero();
        return;
      }
      updateMetrics();
      requestTick();
    };

    const handlePreferenceChange = () => {
      if (shouldDisableStickyHero()) {
        disableStickyHero();
        return;
      }
      updateMetrics();
      applyScale();
    };

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener("change", handlePreferenceChange);
      mobileBreakpoint.addEventListener("change", handlePreferenceChange);
    } else {
      // Fallback for older browsers
      prefersReducedMotion.addListener(handlePreferenceChange);
      mobileBreakpoint.addListener(handlePreferenceChange);
    }

    if (!shouldDisableStickyHero()) {
      updateMetrics();
      applyScale();
    } else {
      disableStickyHero();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handlePreferenceChange);
    window.addEventListener("load", handlePreferenceChange);
  }
})();
