(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const range = document.querySelector('#comparison-range');
  const comparison = document.querySelector('.comparison');
  const scrollScene = document.querySelector('.comparison-scroll');
  const heroPhoto = document.querySelector('.hero-photo');
  const hero = document.querySelector('.hero');
  const strip = document.querySelector('.project-strip');
  const projects = [...document.querySelectorAll('[data-drift]')];
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  let manualComparison = false;
  let ticking = false;
  let observer;

  range.hidden = false;
  function setComparison(value) {
    range.value = String(value);
    comparison.style.setProperty('--split', `${100 - value}%`);
    range.setAttribute('aria-valuetext', `${Math.round(value)}% of the finished kitchen revealed`);
  }
  range.addEventListener('input', () => {
    manualComparison = true;
    setComparison(Number(range.value));
  });
  range.addEventListener('pointerdown', () => { manualComparison = true; });
  range.addEventListener('keydown', () => { manualComparison = true; });
  // Map the whole photograph to the native slider's accessible value.
  let dragging = false;
  const drag = event => {
    const bounds = comparison.getBoundingClientRect();
    setComparison(Math.round(100 - clamp((event.clientX - bounds.left) / bounds.width, 0, 1) * 100));
  };
  range.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = true;
    range.setPointerCapture(event.pointerId);
    range.focus({ preventScroll: true });
    event.preventDefault();
    drag(event);
  });
  range.addEventListener('pointermove', event => {
    if (dragging) { event.preventDefault(); drag(event); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => range.addEventListener(type, () => { dragging = false; }));

  function renderScroll() {
    ticking = false;
    if (reducedMotion.matches) return;
    const heroBounds = hero.getBoundingClientRect();
    if (heroBounds.bottom > 0) heroPhoto.style.transform = `translateY(${Math.min(window.scrollY * .17, 160)}px)`;
    if (!manualComparison) {
      const scene = scrollScene.getBoundingClientRect();
      const sticky = scrollScene.querySelector('.comparison-sticky');
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 35;
      const distance = Math.max(1, scene.height - sticky.offsetHeight);
      const progress = clamp((stickyTop - scene.top) / distance, 0, 1);
      setComparison(Math.round(5 + progress * 90));
    }
    const stripBounds = strip.getBoundingClientRect();
    if (stripBounds.top < innerHeight && stripBounds.bottom > 0) {
      const progress = clamp((innerHeight - stripBounds.top) / (innerHeight + stripBounds.height), 0, 1) - .5;
      projects.forEach(project => {
        project.style.transform = `translateY(${progress * Number(project.dataset.drift) * 2}px)`;
      });
    }
  }
  function requestRender() {
    if (!ticking) { ticking = true; requestAnimationFrame(renderScroll); }
  }
  function configureMotion() {
    document.body.classList.toggle('motion-enabled', !reducedMotion.matches);
    observer?.disconnect();
    const reveals = [...document.querySelectorAll('.reveal')];
    reveals.forEach(el => el.classList.remove('is-waiting'));
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-waiting');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .08 });
      reveals.forEach((el, index) => {
        if (el.getBoundingClientRect().top > innerHeight) {
          el.classList.add('is-waiting');
          el.style.transitionDelay = `${index % 3 * 65}ms`;
          observer.observe(el);
        }
      });
    } else {
      heroPhoto.style.transform = '';
      projects.forEach(project => { project.style.transform = ''; });
      if (!manualComparison) setComparison(50);
    }
    requestRender();
  }
  function sizeComparison() {
    const height = scrollScene.querySelector('.comparison-sticky').offsetHeight;
    const oldHeight = innerWidth <= 650 ? innerHeight * .9 : Math.max(innerHeight * 1.55, innerWidth <= 1050 ? 850 : 1000);
    scrollScene.style.setProperty('--comparison-height', `${height}px`);
    scrollScene.style.setProperty('--scrub-run', `${Math.max(160, (oldHeight - height) / 2)}px`);
    requestRender();
  }
  const comparisonObserver = new ResizeObserver(sizeComparison);
  comparisonObserver.observe(scrollScene.querySelector('.comparison-sticky'));
  window.addEventListener('resize', sizeComparison, { passive: true });
  sizeComparison();
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  reducedMotion.addEventListener('change', configureMotion);
  configureMotion();

  document.querySelectorAll('.service-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const active = tile.getAttribute('aria-pressed') !== 'true';
      document.querySelectorAll('.service-tile').forEach(other => other.setAttribute('aria-pressed', 'false'));
      tile.setAttribute('aria-pressed', String(active));
    });
  });

  const quotes = document.querySelector('.quotes');
  const slides = [...quotes.querySelectorAll('.quote-slide')];
  const dots = [...quotes.querySelectorAll('.quote-dot')];
  const controls = quotes.querySelector('.quote-controls');
  const pause = quotes.querySelector('.quote-pause');
  const slideContainer = quotes.querySelector('.quote-slides');
  let currentQuote = 0;
  let quoteTimer;
  let paused = false;
  let hovered = false;
  function scheduleQuote() {
    clearTimeout(quoteTimer);
    const stopped = reducedMotion.matches || paused || hovered || quotes.contains(document.activeElement) || document.hidden;
    slideContainer.setAttribute('aria-live', stopped ? 'polite' : 'off');
    if (!stopped) quoteTimer = setTimeout(() => showQuote(currentQuote + 1), 6000);
  }
  function showQuote(index) {
    currentQuote = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== currentQuote; });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === currentQuote)));
    scheduleQuote();
  }
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => showQuote(i));
    dot.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (i + 1) % dots.length;
      if (event.key === 'ArrowLeft') next = (i + dots.length - 1) % dots.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = dots.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      showQuote(next);
      dots[next].focus();
    });
  });
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.setAttribute('aria-label', paused ? 'Resume testimonials' : 'Pause testimonials');
    pause.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    scheduleQuote();
  });
  quotes.addEventListener('mouseenter', () => { hovered = true; scheduleQuote(); });
  quotes.addEventListener('mouseleave', () => { hovered = false; scheduleQuote(); });
  quotes.addEventListener('focusin', scheduleQuote);
  quotes.addEventListener('focusout', () => queueMicrotask(scheduleQuote));
  document.addEventListener('visibilitychange', scheduleQuote);
  function configureQuotes() {
    controls.hidden = reducedMotion.matches;
    showQuote(reducedMotion.matches ? 0 : currentQuote);
  }
  reducedMotion.addEventListener('change', configureQuotes);
  configureQuotes();

  const dialog = document.querySelector('.lightbox');
  let trigger;
  document.querySelectorAll('.project a').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      trigger = link;
      const source = link.querySelector('img');
      const target = dialog.querySelector('img');
      target.src = link.href;
      target.alt = source.alt;
      dialog.querySelector('p').textContent = source.alt;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    trigger?.focus({ preventScroll: true });
  });
})();
