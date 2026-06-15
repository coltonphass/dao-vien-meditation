/* ===== SITE NAV (active link, mobile toggle) ===== */
(function initNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Highlight the current page's link
  const path = window.location.pathname.replace(/\/index\.html$/, '/');
  const links = nav.querySelectorAll('.nav-links a[href]');
  let bestMatch = null;
  links.forEach((a) => {
    const href = new URL(a.getAttribute('href'), window.location.origin).pathname
      .replace(/\/index\.html$/, '/');
    if (href === path) bestMatch = a;
    // Section pages: e.g. /lessons/lesson-2.html should light up "Lessons"
    else if (href !== '/' && path.startsWith(href.replace(/\.html$/, '/'))) bestMatch = a;
  });
  if (bestMatch) bestMatch.classList.add('is-active');

  // Mobile menu toggle
  const toggle = nav.querySelector('.nav-toggle');
  const menu = nav.querySelector('.nav-links');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close menu after navigating on mobile
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

/* ===== FOOTER YEAR ===== */
(function setYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();

/* ===== SCAN CAPTIONS ===== */
(function addScanCaptions() {
  function ensureCaptions() {
    document.querySelectorAll('.slides').forEach((slides) => {
      slides.querySelectorAll('a').forEach((a) => {
        const img = a.querySelector('img');
        if (!img) return;

        const parent = a.parentElement;
        if (parent && parent.classList && parent.classList.contains('scan-figure')) {
          if (parent.querySelector('.scan-caption')) return;
          if (img.alt && img.alt.trim()) {
            const cap = document.createElement('figcaption');
            cap.className = 'scan-caption';
            cap.textContent = img.alt;
            parent.appendChild(cap);
          }
        } else {
          const fig = document.createElement('figure');
          fig.className = 'scan-figure';
          a.replaceWith(fig);
          fig.appendChild(a);
          if (img.alt && img.alt.trim()) {
            const cap = document.createElement('figcaption');
            cap.className = 'scan-caption';
            cap.textContent = img.alt;
            fig.appendChild(cap);
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCaptions);
  } else {
    ensureCaptions();
  }

  document.addEventListener('toggle', ensureCaptions, true);
})();

/* ===== DARK MODE TOGGLE ===== */
(function initDarkMode() {
  const checkbox = document.getElementById('checkbox');
  if (!checkbox) return;

  const KEY = 'daoVienDarkMode';
  
  const getSavedPreference = () => {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  };

  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = getSavedPreference();
  const initialDark = saved ? saved === '1' : systemPrefersDark;

  document.body.classList.toggle('dark', initialDark);
  checkbox.checked = initialDark;

  checkbox.addEventListener('change', () => {
    const isDark = checkbox.checked;
    document.body.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(KEY, isDark ? '1' : '0');
    } catch (e) {
      console.warn('Could not save theme preference');
    }
  });

  // Listen for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (getSavedPreference() === null) {
        const isDark = e.matches;
        document.body.classList.toggle('dark', isDark);
        checkbox.checked = isDark;
      }
    });
  }
})();

/* ===== TESTIMONIALS SLIDER ===== */
(function initTestimonials() {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;

  const viewport = slider.querySelector('.slider-viewport');
  const track = slider.querySelector('.slider-track');
  const items = Array.from(track.querySelectorAll('.testimonial'));
  const prevBtn = slider.querySelector('.slider-btn.prev');
  const nextBtn = slider.querySelector('.slider-btn.next');
  const dotsWrap = document.querySelector('.slider-dots');

  if (!viewport || !track || items.length === 0 || !prevBtn || !nextBtn || !dotsWrap) return;

  let currentIndex = 0;
  let isScrolling = false;

  // Create dots
  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Show testimonial ${i + 1}`);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.index = i;
    btn.addEventListener('click', () => scrollToIndex(i));
    dotsWrap.appendChild(btn);
  });

  const dots = Array.from(dotsWrap.children);

  function updateDots(index) {
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-pressed', String(i === index));
    });
  }

  function updateButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === items.length - 1;
  }

  function scrollToIndex(index) {
    if (isScrolling) return;
    if (index < 0) index = 0;
    if (index >= items.length) index = items.length - 1;

    const item = items[index];
    if (!item) return;

    isScrolling = true;
    currentIndex = index;

    // Calculate scroll position to center the item
    const itemLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;
    const viewportWidth = viewport.clientWidth;
    const scrollLeft = itemLeft - (viewportWidth - itemWidth) / 2;

    viewport.scrollTo({
      left: Math.max(0, scrollLeft),
      behavior: 'smooth'
    });

    updateDots(currentIndex);
    updateButtons();

    setTimeout(() => {
      isScrolling = false;
    }, 500);
  }

  // Button handlers
  prevBtn.addEventListener('click', () => scrollToIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => scrollToIndex(currentIndex + 1));

  // Keyboard navigation
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(currentIndex + 1);
    }
  });

  // Touch/scroll detection with debounce
  let scrollTimeout;
  viewport.addEventListener('scroll', () => {
    if (isScrolling) return;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      
      let closestIndex = 0;
      let closestDistance = Infinity;

      items.forEach((item, index) => {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(viewportCenter - itemCenter);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== currentIndex) {
        currentIndex = closestIndex;
        updateDots(currentIndex);
        updateButtons();
      }
    }, 150);
  });

  // Read more functionality
  items.forEach((testimonial) => {
    const blockquote = testimonial.querySelector('blockquote');
    if (!blockquote) return;

    const checkOverflow = () => {
      const lineHeight = parseInt(getComputedStyle(blockquote).lineHeight);
      const maxLines = 8;
      const maxHeight = lineHeight * maxLines;

      if (blockquote.scrollHeight > maxHeight + 20) {
        testimonial.classList.add('is-collapsible');
        blockquote.style.maxHeight = maxHeight + 'px';

        if (!testimonial.querySelector('.read-more')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'read-more';
          btn.textContent = 'Read more';
          btn.setAttribute('aria-expanded', 'false');

          btn.addEventListener('click', () => {
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!isExpanded));

            if (isExpanded) {
              blockquote.style.maxHeight = maxHeight + 'px';
              btn.textContent = 'Read more';
              testimonial.classList.add('is-collapsible');
            } else {
              blockquote.style.maxHeight = blockquote.scrollHeight + 'px';
              btn.textContent = 'Show less';
              testimonial.classList.remove('is-collapsible');
            }
          });

          testimonial.appendChild(btn);
        }
      }
    };

    // Check after fonts load and images load
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(checkOverflow);
    } else {
      setTimeout(checkOverflow, 100);
    }
  });

  // Initialize
  updateDots(0);
  updateButtons();
  scrollToIndex(0);

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scrollToIndex(currentIndex);
    }, 250);
  });
})();

/* ===== SMOOTH SCROLL FOR ANCHOR LINKS ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

/* ===== IMAGE LIGHTBOX ===== */
(function initLightbox() {
  const galleryLinks = Array.from(document.querySelectorAll('.slides a[href]'));
  const figureImgs = Array.from(document.querySelectorAll('.lesson-figure img'));
  if (galleryLinks.length === 0 && figureImgs.length === 0) return;

  // Build the overlay once
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close (Esc)">✕</button>' +
    '<button class="lightbox-nav prev" type="button" aria-label="Previous image">‹</button>' +
    '<button class="lightbox-nav next" type="button" aria-label="Next image">›</button>' +
    '<figure class="lightbox-stage">' +
    '<img class="lightbox-img" alt="" />' +
    '<figcaption class="lightbox-caption"></figcaption>' +
    '</figure>';
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox-img');
  const capEl = overlay.querySelector('.lightbox-caption');
  const stageEl = overlay.querySelector('.lightbox-stage');
  const prevBtn = overlay.querySelector('.prev');
  const nextBtn = overlay.querySelector('.next');
  const closeBtn = overlay.querySelector('.lightbox-close');

  let group = [];
  let index = 0;
  let lastFocus = null;

  function render() {
    const item = group[index];
    if (!item) return;
    imgEl.classList.remove('is-zoomed');
    stageEl.scrollTop = 0;
    stageEl.scrollLeft = 0;
    imgEl.src = item.src;
    imgEl.alt = item.alt || '';
    capEl.textContent = item.alt || '';
    capEl.style.display = item.alt ? '' : 'none';
    const multi = group.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  }

  function open(items, i) {
    group = items;
    index = i;
    lastFocus = document.activeElement;
    render();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function step(delta) {
    if (group.length < 2) return;
    index = (index + delta + group.length) % group.length;
    render();
  }

  // Wire scan galleries (prev/next stays within the same .slides set)
  document.querySelectorAll('.slides').forEach((slides) => {
    const links = Array.from(slides.querySelectorAll('a[href]'));
    const items = links.map((a) => ({
      src: a.getAttribute('href'),
      alt: (a.querySelector('img') && a.querySelector('img').alt) || ''
    }));
    links.forEach((a, i) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        open(items, i);
      });
    });
  });

  // Standalone in-article figures
  figureImgs.forEach((img) => {
    img.addEventListener('click', () => {
      open([{ src: img.getAttribute('src'), alt: img.alt }], 0);
    });
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === stageEl) close();
  });
  imgEl.addEventListener('click', () => imgEl.classList.toggle('is-zoomed'));

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();