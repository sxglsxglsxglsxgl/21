/* GSAP-driven cinematic panels: pinning, parallax, and overlays */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lenis (если подключён в index.html)
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.2, easing: t => 1 - Math.pow(1 - t, 2) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  if (reduceMotion) return;

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(v){ return arguments.length ? lenis.scrollTo(v) : window.scrollY; },
      getBoundingClientRect(){ return {top:0,left:0,width:innerWidth,height:innerHeight}; },
      pinType: document.documentElement.style.transform ? "transform" : "fixed"
    });
  }

  // 1) Пин каждой секции: GSAP сам добавит трек высотой ~1 экран
  document.querySelectorAll('.panel').forEach((panel) => {
    const pinEl = panel.querySelector('.panel__pin');
    ScrollTrigger.create({
      trigger: panel,
      pin: pinEl,
      start: "top top",
      end: "+=100%",
      pinSpacing: true,
      anticipatePin: 1,
      scrub: true,
      invalidateOnRefresh: true
    });
  });

  // 2) Параллакс для фона — тот же трек, та же секция
  document.querySelectorAll('.panel').forEach((panel) => {
    const img = panel.querySelector('.panel__bg img');
    if (!img) return;
    const speed = parseFloat(panel.dataset.speed || 0.15);
    gsap.fromTo(img, { y: 0 }, {
      y: () => innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top top",
        end: "+=100%",
        scrub: true
      }
    });
  });

  // 3) «Скольжение» заголовка по X — тоже на треке секции
  document.querySelectorAll('.slideX').forEach((el) => {
    gsap.fromTo(el, { xPercent: -28, opacity: 0.001 }, {
      xPercent: 28, opacity: 1, ease: "none",
      scrollTrigger: {
        trigger: el.closest('.panel'),
        start: "top top",
        end: "+=100%",
        scrub: true
      }
    });
  });

  // 4) FadeUp текста
  document.querySelectorAll('.fadeUp').forEach((el) => {
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, ease: "power1.out",
      scrollTrigger: {
        trigger: el.closest('.panel'),
        start: "top 65%",
        end: "top 35%",
        scrub: true
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
