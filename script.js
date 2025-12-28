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