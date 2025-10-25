/* GSAP pin без межсекционных пробелов + параллакс и «скольжение» */

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

  // 1) Пин каждого .panel__pin без добавления отступов
  document.querySelectorAll('.panel__pin').forEach((pinEl) => {
    ScrollTrigger.create({
      trigger: pinEl,
      start: "top top",
      end: "+=100%",       // один экран скролла на секцию
      pin: true,
      pinSpacing: false,   // <— ключ! не вставлять «прокладки» между секциями
      scrub: true
    });
  });

  // 2) Параллакс для фона внутри секции (по data-speed на .panel)
  document.querySelectorAll('.panel').forEach((panel) => {
    const img = panel.querySelector('.panel__bg img');
    if (!img) return;
    const speed = parseFloat(panel.dataset.speed || 0.15);
    gsap.fromTo(img, { y: 0 }, {
      y: () => innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: panel.querySelector('.panel__pin'),
        start: "top top",
        end: "+=100%",
        scrub: true
      }
    });
  });

  // 3) «Скольжение» заголовка по X
  document.querySelectorAll('.slideX').forEach((el) => {
    gsap.fromTo(el, { xPercent: -28, opacity: 0.001 }, {
      xPercent: 28, opacity: 1, ease: "none",
      scrollTrigger: {
        trigger: el.closest('.panel__pin'),
        start: "top top",
        end: "+=100%",
        scrub: true
      }
    });
  });

  // 4) Мягкий fadeUp текста
  document.querySelectorAll('.fadeUp').forEach((el) => {
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, ease: "power1.out",
      scrollTrigger: {
        trigger: el.closest('.panel__pin'),
        start: "top 65%",
        end: "top 35%",
        scrub: true
      }
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
