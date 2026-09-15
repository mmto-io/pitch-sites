(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const comparison = document.querySelector('.comparison');
  const scrollScene = document.querySelector('.comparison-scroll');
  const heroPhoto = document.querySelector('.hero-photo');
  const hero = document.querySelector('.hero');
  const strip = document.querySelector('.project-strip');
  const projects = [...document.querySelectorAll('[data-drift]')];
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  let keyboardComparison = false;
  let ticking = false;
  let observer;

  // Keyboard navigation gets the same static pair as reduced-motion users.
  document.addEventListener('keydown', event => {
    if (!['Tab', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) || keyboardComparison) return;
    keyboardComparison = true;
    document.body.classList.remove('scroll-reveal');
  });

  function renderScroll() {
    ticking = false;
    if (reducedMotion.matches) return;
    const heroBounds = hero.getBoundingClientRect();
    if (heroBounds.bottom > 0) heroPhoto.style.transform = `translateY(${Math.min(window.scrollY * .17, 160)}px)`;
    if (!keyboardComparison) {
      const scene = scrollScene.getBoundingClientRect();
      const sticky = scrollScene.querySelector('.comparison-sticky');
      const stickyTop = parseFloat(getComputedStyle(sticky).top) || 35;
      const distance = Math.max(1, scene.height - sticky.offsetHeight);
      const progress = clamp((stickyTop - scene.top) / distance, 0, 1);
      comparison.style.setProperty('--uncovered', `${progress * 100}%`);
      comparison.style.setProperty('--p', progress.toFixed(4));
      const cloth = comparison.querySelector('.drop-cloth');
      cloth.style.opacity = progress > .9 ? String(Math.max(0, (1 - progress) / .1)) : '1';
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
    document.body.classList.toggle('scroll-reveal', !reducedMotion.matches && !keyboardComparison);
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
    controls.hidden = false;
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
