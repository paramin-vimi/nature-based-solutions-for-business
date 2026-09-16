(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';

  const A = 'assets/img/';
  const FALLBACK = [
    'linear-gradient(150deg,#eef4ee 0%,#e2ece4 55%,#d6e4da 100%)',
    'linear-gradient(150deg,#eaf0fb 0%,#dde6f8 55%,#d0dbf4 100%)'
  ];

  const IMAGES = {
    'hero': A + 'hero-rainforest.webp'
  };

  let fbI = 0;

  function paint(el, key) {
    const url = IMAGES[key];
    const fb = FALLBACK[fbI++ % FALLBACK.length];
    if (!url) { el.style.backgroundImage = fb; return; }
    if (el.querySelector('.bgimg')) return;
    const img = new Image();
    img.className = 'bgimg';
    img.alt = el.dataset.alt || '';
    img.decoding = 'async';

    if (key === 'hero') img.fetchPriority = 'high';
    img.onload = () => { el.appendChild(img); };
    img.onerror = () => { el.style.backgroundImage = fb; };
    img.src = new URL(url, document.baseURI).href;
  }

  function initImages() {
    const els = Array.from(document.querySelectorAll('[data-img]'));
    els.filter((e) => e.dataset.img === 'hero').forEach((e) => paint(e, e.dataset.img));

    sweeper(els.filter((e) => e.dataset.img !== 'hero'),
            (e) => !!e.querySelector('.bgimg'),
            (e) => paint(e, e.dataset.img),
            600);
  }

  function initReveals() {
    const els = Array.from(document.querySelectorAll('.reveal, .step'));
    if (reduced) { els.forEach((e) => e.classList.add('in')); return; }
    sweeper(els,
            (e) => e.classList.contains('in'),
            (e) => e.classList.add('in'),
            0,

            () => els.forEach((e) => e.classList.add('in', 'in-now')));
  }

  function sweeper(els, done, act, margin, onFrozen) {
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting) { act(en.target); io.unobserve(en.target); }
      }), margin ? { rootMargin: margin + 'px 0px' } : { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach((e) => io.observe(e));
    }
    const pad = margin || -40;
    const sweep = () => {
      let pending = 0;
      els.forEach((e) => {
        if (done(e)) return;
        const r = e.getBoundingClientRect();
        if (r.top < window.innerHeight + pad && r.bottom > -pad) {
          act(e); if (io) io.unobserve(e);
        } else pending++;
      });
      if (!pending) { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', sweep); }
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      setTimeout(() => { ticking = false; sweep(); }, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sweep);
    setTimeout(sweep, 900);
    if (onFrozen) setTimeout(() => { if (document.hidden) onFrozen(); }, 2500);
  }

  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const on = () => nav.classList.toggle('is-solid', window.scrollY > 30);
    window.addEventListener('scroll', on, { passive: true });
    on();
  }

  let menuEl, burgerEl;
  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove('is-open');
    menuEl.setAttribute('aria-hidden', 'true');
    if (burgerEl) {
      burgerEl.setAttribute('aria-expanded', 'false');
      burgerEl.setAttribute('aria-label', 'Open menu');
    }
    document.body.style.overflow = '';
  }
  function initMenu() {
    menuEl = document.getElementById('menu');
    const b = document.getElementById('burger');
    if (!menuEl || !b) return;
    burgerEl = b;
    b.addEventListener('click', () => {

      const nav = document.getElementById('nav');
      if (nav) menuEl.style.top = Math.round(nav.getBoundingClientRect().bottom) + 'px';
      const open = menuEl.classList.toggle('is-open');
      menuEl.setAttribute('aria-hidden', open ? 'false' : 'true');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuEl.classList.contains('is-open')) { closeMenu(); b.focus(); }
    });
  }

  function initSubmenus() {
    document.querySelectorAll('.nav__item--sub').forEach((li) => {
      const top = li.querySelector('a');
      const reset = () => li.classList.remove('is-dismissed');
      li.addEventListener('mouseleave', reset);
      li.addEventListener('mouseenter', reset);
      li.addEventListener('focusin', (e) => { if (e.target !== top) reset(); });
      li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) reset(); });
      li.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        li.classList.add('is-dismissed');
        if (top) top.focus();
      });
    });
  }

  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      t.focus({ preventScroll: true });
    }));
  }

  function initHero() {

    const late = performance.now() > 1500;

    if (!hasGSAP || reduced || late || document.hidden) return;
    const lines = document.querySelectorAll('.hero__title .line > span');
    if (lines.length) {
      gsap.set(lines, { yPercent: 115 });
      gsap.to(lines, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
    }
    gsap.fromTo('.hero__lead, .hero__cta, .hero__assure',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
    gsap.fromTo('.hero__card',
      { opacity: 0, y: 18, scale: .96 },
      { opacity: 1, y: 0, scale: 1, duration: .8, ease: 'power3.out', stagger: 0.12, delay: 0.9 });

    setTimeout(() => {
      if (lines.length) gsap.set(lines, { yPercent: 0 });
      gsap.set('.hero__lead,.hero__cta,.hero__assure,.hero__card', { opacity: 1, y: 0, scale: 1 });
    }, 2200);
  }

  function initParallax() {
    const bg = document.querySelector('.hero__bg');
    if (!bg || reduced) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) bg.style.transform = 'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0) scale(1.06)';
      ticking = false;
    };
    bg.style.willChange = 'transform';
    bg.style.transform = 'scale(1.06)';
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach((el) => { el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suf = el.dataset.suffix || '';
      const pre = el.dataset.prefix || '';
      if (reduced) { el.textContent = pre + target + suf; return; }
      let s = null;
      const dur = 1400;
      const step = (t) => {
        if (!s) s = t;
        const p = Math.min((t - s) / dur, 1);
        el.textContent = pre + Math.floor((1 - Math.pow(1 - p, 3)) * target) + suf;
        if (p < 1) requestAnimationFrame(step); else el.textContent = pre + target + suf;
      };
      requestAnimationFrame(step);
    }), { threshold: 0.5 });
    nums.forEach((n) => io.observe(n));
  }

  function initProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? (window.scrollY / max).toFixed(4) : 0) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initQuickbar() {
    const bar = document.getElementById('quickbar');
    if (!bar) return;
    const contact = document.getElementById('contact');
    let nearContact = false;
    const update = () => {
      const show = window.scrollY > 600 && !nearContact;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
    };
    window.addEventListener('scroll', update, { passive: true });
    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver((ents) => {
        ents.forEach((e) => { nearContact = e.isIntersecting; });
        update();
      }, { threshold: 0.05 }).observe(contact);
    }
    update();
  }

  function initTop() {
    const btn = document.getElementById('toTop');
    if (!btn) return;
    const t = () => btn.classList.toggle('is-visible', window.scrollY > 700);
    window.addEventListener('scroll', t, { passive: true });
    t();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  function initFaq() {
    const items = Array.from(document.querySelectorAll('.faq__item'));
    items.forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) items.forEach((o) => { if (o !== d) o.open = false; });
    }));
  }

  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    try {
      const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'li_fat_id', 'fbclid'];
      const qs = new URLSearchParams(location.search);
      KEYS.forEach((k) => { const v = qs.get(k); if (v) sessionStorage.setItem('attr_' + k, v); });
      KEYS.forEach((k) => {
        const el = form.elements[k];
        const v = sessionStorage.getItem('attr_' + k);
        if (el && v) el.value = v;
      });
      if (form.elements.landing_url) form.elements.landing_url.value = location.href.split('#')[0];
    } catch (err) {  }
  }

  function initLogos() {
    const root = document.querySelector('.hero__logos');
    if (!root) return;
    const track = root.querySelector('.logos__track');
    const pagesEls = Array.from(track.children);
    const dots = Array.from(root.querySelectorAll('.logos__dot'));
    const toggle = root.querySelector('.logos__pause');
    let page = 0, timer = null, userPaused = reduced, holding = false;
    const go = (n) => {
      page = (n + pagesEls.length) % pagesEls.length;
      track.style.transform = 'translateX(' + (-100 * page) + '%)';
      dots.forEach((d, i) => d.setAttribute('aria-current', i === page ? 'true' : 'false'));
      pagesEls.forEach((el, i) => el.setAttribute('aria-hidden', i === page ? 'false' : 'true'));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      stop();
      if (!userPaused && !holding && pagesEls.length > 1) timer = setInterval(() => go(page + 1), 5000);
    };
    const syncToggle = () => {
      toggle.classList.toggle('is-paused', userPaused);
      toggle.setAttribute('aria-label', userPaused ? 'Play logo carousel' : 'Pause logo carousel');
    };
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
    toggle.addEventListener('click', () => { userPaused = !userPaused; syncToggle(); start(); });
    root.addEventListener('mouseenter', () => { holding = true; stop(); });
    root.addEventListener('mouseleave', () => { holding = false; start(); });
    root.addEventListener('focusin', () => { holding = true; stop(); });
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) { holding = false; start(); } });
    go(0); syncToggle(); start();
  }

  function initVideos() {
    const btns = Array.from(document.querySelectorAll('.video[data-video]'));
    const modal = document.getElementById('videoModal');
    if (!btns.length) return;
    if (!modal || typeof modal.showModal !== 'function') {
      btns.forEach((b) => b.addEventListener('click', () => {
        window.open('https://www.youtube.com/watch?v=' + encodeURIComponent(b.dataset.video), '_blank', 'noopener');
      }));
      return;
    }
    const frame = modal.querySelector('.vmodal__frame');
    btns.forEach((b) => b.addEventListener('click', () => {
      const title = (b.getAttribute('aria-label') || 'Video').replace(/^Play video:\s*/, '');
      const f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.dataset.video) + '?autoplay=1&rel=0&playsinline=1';
      f.title = title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      frame.replaceChildren(f);
      modal.setAttribute('aria-label', title);
      document.body.style.overflow = 'hidden';
      modal.showModal();
    }));

    const cleanup = () => { frame.replaceChildren(); document.body.style.overflow = ''; };
    const closeModal = () => { if (modal.open) modal.close(); cleanup(); };
    modal.querySelector('.vmodal__close').addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modal.addEventListener('cancel', cleanup);
    modal.addEventListener('close', cleanup);
  }

  function init() {
    initImages();
    initReveals();
    initNav();
    initMenu();
    initSubmenus();
    initAnchors();
    initHero();
    initParallax();
    initCounters();
    initProgress();
    initQuickbar();
    initTop();
    initFaq();
    initLogos();
    initVideos();
    initForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
