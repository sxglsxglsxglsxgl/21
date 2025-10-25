/* script.js — cinematic scroll panels */

(function () {
  // Respect reduced motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll via Lenis
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 2), // quadOut
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.2,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  if (reduceMotion) return;

  // GSAP & ScrollTrigger
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Sync Lenis with ScrollTrigger
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        return arguments.length ? lenis.scrollTo(value) : window.scrollY || window.pageYOffset;
      },
      getBoundingClientRect() { return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }; },
      pinType: document.documentElement.style.transform ? "transform" : "fixed"
    });
  }

  // Horizontal slide for titles
  document.querySelectorAll('.slideX').forEach((el) => {
    gsap.fromTo(el, { xPercent: -28, opacity: 0.001 }, {
      xPercent: 28, opacity: 1, ease: "none",
      scrollTrigger: {
        trigger: el.closest('.panel'),
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  });

  // FadeUp for text blocks
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

  // Parallax background via data-speed (positive — вниз, negative — вверх)
  document.querySelectorAll('.panel').forEach((panel) => {
    const bgImg = panel.querySelector('.panel__bg img');
    if (!bgImg) return;
    const speed = parseFloat(panel.dataset.speed || 0.15);

    gsap.to(bgImg, {
      y: () => window.innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

  // Refresh after images load
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
