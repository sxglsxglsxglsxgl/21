/* Clean Boring-Company style pin + unified parallax */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lenis (если есть)
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 2) });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(v){ return arguments.length ? lenis.scrollTo(v) : window.scrollY; },
      getBoundingClientRect(){ return { top:0, left:0, width:innerWidth, height:innerHeight }; },
      pinType: document.documentElement.style.transform ? "transform" : "fixed"
    });
  }

  const panels = gsap.utils.toArray('.panel');

  // 1) Пин секций: естественный трек на 1 экран, без артефактов
  panels.forEach((panel) => {
    const pinEl = panel.querySelector('.panel__pin');
    ScrollTrigger.create({
      trigger: panel,
      pin: pinEl,
      start: "top top",
      end: "+=100%",
      pinSpacing: true,      // даём GSAP создать «трек» прокрутки
      anticipatePin: 1,
      scrub: true,
      invalidateOnRefresh: true
    });
  });

  // 2) Параллакс: всегда в ОДНУ сторону и с одинаковой амплитудой
  panels.forEach((panel) => {
    const img = panel.querySelector('.panel__bg img');
    if (!img) return;

    // Берём положительную величину спида, жёстко ограничиваем
    const speedRaw = parseFloat(panel.dataset.speed || 0.12);
    const speed = Math.min(Math.max(Math.abs(speedRaw), 0.06), 0.2);

    // Делаем симметричный «вздох» фона: вверх→вниз (мягко и одинаково для всех)
    gsap.fromTo(img, { y: () => -innerHeight * speed * 0.5 }, {
      y: () =>  innerHeight * speed * 0.5,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top top",
        end: "+=100%",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  });

  // 3) «Скольжение» заголовка и fade текста — на том же треке
  gsap.utils.toArray('.slideX').forEach((el) => {
    gsap.fromTo(el, { xPercent: -22, opacity: 0.001 }, {
      xPercent: 22, opacity: 1, ease: "none",
      scrollTrigger: {
        trigger: el.closest('.panel'),
        start: "top top",
        end: "+=100%",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  });

  gsap.utils.toArray('.fadeUp').forEach((el) => {
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, ease: "power1.out",
      scrollTrigger: {
        trigger: el.closest('.panel'),
        start: "top 65%",
        end: "top 35%",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  });

  // Пересчёт после загрузки изображений / ресайза
  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
})();
