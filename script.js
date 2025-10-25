const ready = (fn) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
};

ready(() => {
  const slidesContainer = document.querySelector(".slides");
  if (!slidesContainer) return;

  const slides = Array.from(slidesContainer.querySelectorAll(".slide"));
  if (!slides.length) return;

  const backgroundHost = slidesContainer.querySelector(".slides__background");
  const backgroundLayers = backgroundHost
    ? slides.map((slide) => {
        const src = slide.getAttribute("data-bg");
        if (!src) return null;
        const layer = document.createElement("div");
        layer.className = "slides__background-layer";
        layer.style.setProperty("--bg-image", `url('${src}')`);
        backgroundHost.appendChild(layer);
        return layer;
      })
    : [];

  const ANIMATION_MS = 1100;
  const WHEEL_THRESHOLD = 6;
  const TOUCH_THRESHOLD = 40;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionQuery.matches;

  slidesContainer.classList.toggle("slides--reduced", reduceMotion);

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (activeIndex < 0) activeIndex = -1;

  const activateBackground = (index) => {
    if (!backgroundLayers.length) return;
    backgroundLayers.forEach((layer, layerIndex) => {
      if (!layer) return;
      if (layerIndex === index) {
        layer.classList.add("is-active");
      } else {
        layer.classList.remove("is-active");
      }
    });
  };

  let isTransitioning = false;

  const setActiveSlide = (index, { immediate = false } = {}) => {
    const next = slides[index];
    const current = activeIndex >= 0 ? slides[activeIndex] : null;

    if (!next || next === current) return false;

    if (current) {
      current.classList.remove("is-active");
      if (!immediate) {
        current.classList.add("is-fading-out");
        window.clearTimeout(current._fadeTimeout);
        current._fadeTimeout = window.setTimeout(() => {
          current.classList.remove("is-fading-out");
          current._fadeTimeout = null;
        }, ANIMATION_MS);
      } else {
        current.classList.remove("is-fading-out");
      }
    }

    next.classList.add("is-active");
    next.classList.remove("is-fading-out");

    activeIndex = index;
    activateBackground(activeIndex);

    if (immediate) return true;

    isTransitioning = true;
    window.setTimeout(() => {
      isTransitioning = false;
    }, ANIMATION_MS);

    return true;
  };

  const startIndex = activeIndex >= 0 ? activeIndex : 0;
  setActiveSlide(startIndex, { immediate: true });

  if (reduceMotion) {
    slides.forEach((slide) => {
      slide.classList.add("is-active");
      slide.classList.remove("is-fading-out");
    });
    activateBackground(startIndex);
  }

  const goToSlide = (index) => {
    if (reduceMotion) return false;
    if (isTransitioning) return false;
    if (index < 0 || index >= slides.length) return false;
    return setActiveSlide(index);
  };

  const shouldIgnoreEvent = () => document.body.classList.contains("has-menu-open");

  const onWheel = (event) => {
    if (reduceMotion) return;
    if (shouldIgnoreEvent()) return;
    const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(delta) < WHEEL_THRESHOLD) return;
    event.preventDefault();
    const direction = delta > 0 ? 1 : -1;
    goToSlide(activeIndex + direction);
  };

  let touchStartY = null;
  let touchStartX = null;

  const onTouchStart = (event) => {
    if (reduceMotion || shouldIgnoreEvent()) {
      touchStartY = null;
      touchStartX = null;
      return;
    }
    if (event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
    touchStartX = event.touches[0].clientX;
  };

  const onTouchMove = (event) => {
    if (reduceMotion) return;
    if (touchStartY === null || touchStartX === null) return;
    const touch = event.touches[0];
    const deltaY = touchStartY - touch.clientY;
    const deltaX = touchStartX - touch.clientX;
    if (Math.abs(deltaY) < Math.abs(deltaX)) return;
    if (Math.abs(deltaY) < TOUCH_THRESHOLD) return;
    event.preventDefault();
    const direction = deltaY > 0 ? 1 : -1;
    if (goToSlide(activeIndex + direction)) {
      touchStartY = null;
      touchStartX = null;
    }
  };

  const onTouchEnd = () => {
    touchStartY = null;
    touchStartX = null;
  };

  const onKeydown = (event) => {
    if (shouldIgnoreEvent()) return;
    let direction = 0;

    switch (event.key) {
      case "ArrowDown":
      case "PageDown":
        direction = 1;
        break;
      case "ArrowUp":
      case "PageUp":
        direction = -1;
        break;
      case "Home":
        event.preventDefault();
        goToSlide(0);
        return;
      case "End":
        event.preventDefault();
        goToSlide(slides.length - 1);
        return;
      case " ":
      case "Spacebar":
        direction = event.shiftKey ? -1 : 1;
        break;
      default:
        break;
    }

    if (!direction) return;
    event.preventDefault();
    goToSlide(activeIndex + direction);
  };

  slidesContainer.addEventListener("wheel", onWheel, { passive: false });
  slidesContainer.addEventListener("touchstart", onTouchStart, { passive: true });
  slidesContainer.addEventListener("touchmove", onTouchMove, { passive: false });
  slidesContainer.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKeydown);

  const handleMotionPreferenceChange = (event) => {
    reduceMotion = event.matches;
    slidesContainer.classList.toggle("slides--reduced", reduceMotion);

    if (reduceMotion) {
      slides.forEach((slide) => {
        slide.classList.add("is-active");
        slide.classList.remove("is-fading-out");
      });
      activateBackground(activeIndex >= 0 ? activeIndex : 0);
    } else {
      slides.forEach((slide, index) => {
        if (index === activeIndex) {
          slide.classList.add("is-active");
          slide.classList.remove("is-fading-out");
        } else {
          slide.classList.remove("is-active");
          slide.classList.remove("is-fading-out");
        }
      });
      setActiveSlide(activeIndex >= 0 ? activeIndex : 0, { immediate: true });
      activateBackground(activeIndex >= 0 ? activeIndex : 0);
    }
  };

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", handleMotionPreferenceChange);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(handleMotionPreferenceChange);
  }
});

// === Line-by-Line wrapper ===
ready(() => {
  const paragraphs = document.querySelectorAll(
    ".slides .slide:not(:first-child) p"
  );

  paragraphs.forEach((p) => {
    const raw = p.innerHTML.trim();
    if (!raw) return;

    // режем по <br> (включая варианты <br>, <br/>, <br />)
    const parts = raw.split(/<br\s*\/?>/i);

    // собираем построчно со span-обёртками и теми же <br> между строками
    const html = parts
      .map((seg, i) => {
        const trimmed = seg.trim();
        if (!trimmed) return "";
        return `
          <span class="line" style="--delay:${(i * 0.08).toFixed(2)}s">
            <span class="line__inner">${trimmed}</span>
          </span>
        `;
      })
      .join("<br />");

    p.innerHTML = html;
  });
});

(() => {
  const el = document.querySelector(".cm-bg-bubbles");
  if (!el) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const TAU = Math.PI * 2;
  const bubbles = [
    {
      xProp: "--x1",
      yProp: "--y1",
      x: {
        base: 28,
        waves: [
          { amp: 16, freq: 0.018, phase: 0.0 },
          { amp: 6.4, freq: 0.051, phase: 0.31 },
          { amp: 3.1, freq: 0.079, phase: 0.17, fn: Math.cos },
        ],
      },
      y: {
        base: 42,
        waves: [
          { amp: 12, freq: 0.023, phase: 0.43 },
          { amp: 4.6, freq: 0.056, phase: 0.11 },
          { amp: 2.4, freq: 0.096, phase: 0.7, fn: Math.cos },
        ],
      },
    },
    {
      xProp: "--x2",
      yProp: "--y2",
      x: {
        base: 68,
        waves: [
          { amp: 18, freq: 0.016, phase: 0.0 },
          { amp: 7.2, freq: 0.048, phase: 0.27 },
          { amp: 2.6, freq: 0.082, phase: 0.62, fn: Math.cos },
        ],
      },
      y: {
        base: 58,
        waves: [
          { amp: 14, freq: 0.02, phase: 0.47 },
          { amp: 6.1, freq: 0.062, phase: 0.29 },
          { amp: 2.2, freq: 0.089, phase: 0.83, fn: Math.cos },
        ],
      },
    },
    {
      xProp: "--x3",
      yProp: "--y3",
      x: {
        base: 46,
        waves: [
          { amp: 14, freq: 0.019, phase: 0.12 },
          { amp: 5.6, freq: 0.045, phase: 0.41 },
          { amp: 3.8, freq: 0.074, phase: 0.93, fn: Math.cos },
        ],
      },
      y: {
        base: 24,
        waves: [
          { amp: 11, freq: 0.021, phase: 0.59 },
          { amp: 4.9, freq: 0.053, phase: 0.15 },
          { amp: 3.2, freq: 0.085, phase: 0.68, fn: Math.cos },
        ],
      },
    },
  ];

  const start = performance.now();

  const sampleWave = (wave, t) => {
    const fn = wave.fn || Math.sin;
    return wave.amp * fn(t * wave.freq * TAU + wave.phase * TAU);
  };

  const sample = (axis, t) => axis.base + axis.waves.reduce((sum, wave) => sum + sampleWave(wave, t), 0);

  const frame = (now) => {
    const t = (now - start) / 1000;

    bubbles.forEach((bubble) => {
      const x = sample(bubble.x, t);
      const y = sample(bubble.y, t);
      el.style.setProperty(bubble.xProp, `${x.toFixed(2)}%`);
      el.style.setProperty(bubble.yProp, `${y.toFixed(2)}%`);
    });

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
})();
