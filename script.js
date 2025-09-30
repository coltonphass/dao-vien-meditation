/* Mobile-friendly lightbox with swipe, keyboard, and prev/next controls */
;(() => {
  // slide image elements (inside anchors now)
  const images = Array.from(document.querySelectorAll('.slides img'))

  // Only run the slides/lightbox/preload logic when slides exist on the page.
  if (images.length) {
    let currentIndex = -1

    function createOverlay() {
      const overlay = document.createElement('div')
      overlay.className = 'lightbox-overlay'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      overlay.tabIndex = -1

      // Image element
      const img = document.createElement('img')
      img.className = 'lightbox-img'
      img.alt = ''
      overlay.appendChild(img)

      // Controls container
      const controls = document.createElement('div')
      controls.className = 'lightbox-controls'

      const prevBtn = document.createElement('button')
      prevBtn.className = 'lightbox-btn prev'
      prevBtn.innerHTML = '&#x276E;'
      prevBtn.title = 'Previous'
      prevBtn.ariaLabel = 'Previous slide'

      const nextBtn = document.createElement('button')
      nextBtn.className = 'lightbox-btn next'
      nextBtn.innerHTML = '&#x276F;'
      nextBtn.title = 'Next'
      nextBtn.ariaLabel = 'Next slide'

      controls.appendChild(prevBtn)
      controls.appendChild(nextBtn)
      overlay.appendChild(controls)

      const closeBtn = document.createElement('button')
      closeBtn.className = 'lightbox-close'
      closeBtn.innerHTML = '✕'
      closeBtn.title = 'Close'
      closeBtn.ariaLabel = 'Close'
      overlay.appendChild(closeBtn)

      // Event listeners
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay()
      })

      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        showIndex(currentIndex - 1)
      })
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        showIndex(currentIndex + 1)
      })
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        closeOverlay()
      })

      // touch support: swipe left/right to change
      let touchStartX = 0
      let touchCurrentX = 0
      // moved is scoped to this overlay instance so it doesn't leak globally
      let moved = false
      overlay.addEventListener(
        'touchstart',
        (e) => {
          if (!e.touches || e.touches.length !== 1) return
          touchStartX = e.touches[0].clientX
          touchCurrentX = touchStartX
          moved = false
        },
        { passive: true }
      )

      overlay.addEventListener(
        'touchmove',
        (e) => {
          if (!e.touches || e.touches.length !== 1) return
          touchCurrentX = e.touches[0].clientX
          const delta = touchCurrentX - touchStartX
          if (Math.abs(delta) > 10) moved = true
        },
        { passive: true }
      )

      overlay.addEventListener('touchend', (e) => {
        if (!moved) return
        const delta = touchCurrentX - touchStartX
        if (delta > 50) showIndex(currentIndex - 1)
        else if (delta < -50) showIndex(currentIndex + 1)
      })

      // keyboard navigation
      function onKey(e) {
        if (e.key === 'Escape') closeOverlay()
        else if (e.key === 'ArrowRight') showIndex(currentIndex + 1)
        else if (e.key === 'ArrowLeft') showIndex(currentIndex - 1)
      }

      document.addEventListener('keydown', onKey)

      document.body.appendChild(overlay)
      // trap focus
      overlay.focus()

      overlay._cleanup = () => {
        document.removeEventListener('keydown', onKey)
        overlay.remove()
      }

      return overlay
    }

    let overlayEl = null

    function preload(src) {
      if (!src) return
      const i = new Image()
      i.src = src
    }

    // Preload all images inside a particular .slides element
    function preloadSlides(slidesEl) {
      if (!slidesEl) return
      const imgs = Array.from(slidesEl.querySelectorAll('img'))
      imgs.forEach((img) => preload(img.src))
    }

    // NOTE: image preloading / load listeners removed — visibility is driven
    // by the `.js-open` animation class on the slides container.

    function showIndex(i) {
      if (!overlayEl) return
      if (i < 0) i = images.length - 1
      if (i >= images.length) i = 0
      currentIndex = i
      const imgEl = overlayEl.querySelector('.lightbox-img')
      const src = images[currentIndex].src
      imgEl.src = src
      imgEl.alt = images[currentIndex].alt || ''
      // preload neighbors for snappy next/prev
      preload(images[(currentIndex - 1 + images.length) % images.length].src)
      preload(images[(currentIndex + 1) % images.length].src)
    }

    function openOverlay(startIdx) {
      overlayEl = createOverlay()
      showIndex(startIdx)
    }

    function closeOverlay() {
      if (!overlayEl) return
      overlayEl._cleanup()
      overlayEl = null
    }

    // Decide whether to enable the custom lightbox. On touch devices we prefer
    // the native browser image view (so users can pinch/zoom). We'll treat a
    // device as touch-capable if 'ontouchstart' exists or the pointer media
    // query matches 'coarse'. Desktop mouse users still get the lightbox.
    const isTouch =
      'ontouchstart' in window || matchMedia('(pointer: coarse)').matches

    if (!isTouch) {
      // For non-touch (desktop) users, open custom lightbox when clicking the image.
      images.forEach((img, idx) => {
        // The images are wrapped in <a> so prevent the anchor's default navigation
        // when opening the lightbox.
        const link = img.closest('a')
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault()
            openOverlay(idx)
          })
        } else {
          img.addEventListener('click', () => openOverlay(idx))
        }

        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openOverlay(idx)
          }
        })
      })
    } else {
      // On touch devices, the anchor links allow native image opening. To make
      // that behavior more consistent, ensure the anchors open in a new tab
      // (target="_blank") and do not attach the lightbox handlers.
      // We also remove tabindex from images to avoid accidental keyboard focus.
      images.forEach((img) => img.removeAttribute('tabindex'))
    }

    // Attach preloading behavior to each details summary to improve perceived load speed
    const details = Array.from(document.querySelectorAll('details'))
    details.forEach((d) => {
      const slides = d.querySelector('.slides')
      if (!slides) return

      // When the details is toggled, preload images and add/remove a JS-driven
      // class on the slides element to reliably retrigger the open animation
      d.addEventListener('toggle', () => {
        if (d.open) {
          preloadSlides(slides)
          // remove class first if present to allow reflow-based retrigger
          slides.classList.remove('js-open')
          // force reflow
          // eslint-disable-next-line no-unused-expressions
          slides.offsetHeight
          slides.classList.add('js-open')
        } else {
          slides.classList.remove('js-open')
        }
      })

      // Preload when the user might be about to open (hover/focus/touchstart)
      const preloadOnce = { once: true }
      d.addEventListener(
        'pointerenter',
        () => preloadSlides(slides),
        preloadOnce
      )
      d.addEventListener('focusin', () => preloadSlides(slides), preloadOnce)
      d.addEventListener('touchstart', () => preloadSlides(slides), preloadOnce)
    })

    // No per-image load listeners — image visibility is driven by the
    // `.js-open` class on the slides container.
  }

  // --- Testimonial slider (small, accessible) ---
  function initTestimonialSlider() {
    const slider = document.querySelector('.testimonial-slider')
    if (!slider) return
    const track = slider.querySelector('.slider-track')
    const slides = Array.from(track.children)
    const prev = slider.querySelector('.slider-btn.prev')
    const next = slider.querySelector('.slider-btn.next')
    const dotsWrap = document.querySelector('.slider-dots')
    if (!track || slides.length === 0) return

    let index = 0

    function update() {
      const width = slider.querySelector('.slider-viewport').clientWidth
      const offset = index * width
      track.style.transform = `translateX(-${offset}px)`
      // update dots
      Array.from(dotsWrap.children).forEach((d, i) =>
        d.classList.toggle('active', i === index)
      )
      // update aria
      slides.forEach((s, i) =>
        s.setAttribute('aria-hidden', i === index ? 'false' : 'true')
      )
    }

    // build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button')
      dot.className = 'slider-dot'
      dot.setAttribute('aria-label', `Show testimonial ${i + 1}`)
      dot.addEventListener('click', () => {
        index = i
        update()
      })
      dotsWrap.appendChild(dot)
    })

    prev.addEventListener('click', () => {
      index = (index - 1 + slides.length) % slides.length
      update()
    })
    next.addEventListener('click', () => {
      index = (index + 1) % slides.length
      update()
    })

    // initial
    update()
    // responsive: update on resize to recalc widths
    window.addEventListener('resize', update)
    // touch swipe support for mobile
    let startX = 0
    let currentX = 0
    let swiping = false
    slider.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || e.touches.length !== 1) return
        startX = e.touches[0].clientX
        currentX = startX
        swiping = true
      },
      { passive: true }
    )
    slider.addEventListener(
      'touchmove',
      (e) => {
        if (!swiping || !e.touches || e.touches.length !== 1) return
        currentX = e.touches[0].clientX
      },
      { passive: true }
    )
    slider.addEventListener('touchend', () => {
      if (!swiping) return
      const delta = currentX - startX
      if (delta > 40) {
        index = (index - 1 + slides.length) % slides.length
        update()
      } else if (delta < -40) {
        index = (index + 1) % slides.length
        update()
      }
      swiping = false
    })
  }

  // init the testimonial slider independently
  initTestimonialSlider()

  // Add read-more toggles for long testimonial paragraphs
  function initTestimonialReadMore() {
    const testimonials = Array.from(document.querySelectorAll('.testimonial'))
    const threshold = 120 // px
    testimonials.forEach((t) => {
      // avoid reprocessing the same testimonial
      if (t.dataset.readmoreApplied === 'true') return
      const p = t.querySelector('blockquote > p')
      if (!p) return
      // if the paragraph is taller than a threshold, collapse and add button
      // use scrollHeight to measure full content height
      if (p.scrollHeight > threshold) {
        // Create the toggle button
        const btn = document.createElement('button')
        btn.className = 'read-more-btn'
        btn.type = 'button'
        btn.textContent = 'Read more'
        btn.setAttribute('aria-expanded', 'false')
        btn.addEventListener('click', () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true'
          if (expanded) {
            p.classList.add('collapsed')
            btn.textContent = 'Read more'
            btn.setAttribute('aria-expanded', 'false')
          } else {
            p.classList.remove('collapsed')
            btn.textContent = 'Show less'
            btn.setAttribute('aria-expanded', 'true')
          }
        })

        // insert button into DOM
        p.parentNode.insertBefore(btn, p.nextSibling)

        // Ensure initial collapse animates: start expanded, then add the
        // collapsed class after paint so the max-height transition runs.
        p.classList.remove('collapsed')
        // double rAF to ensure layout has been painted
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            p.classList.add('collapsed')
          })
        })
      }
      // mark as processed so future runs skip it
      t.dataset.readmoreApplied = 'true'
    })
  }

  // run again on load in case fonts/images change measurement
  window.addEventListener('load', initTestimonialReadMore)
  initTestimonialReadMore()

  // observe for testimonials added after initial run (e.g., via CMS or dynamic edits)
  const testimonialContainer = document.querySelector('.testimonials')
  if (testimonialContainer && 'MutationObserver' in window) {
    const mo = new MutationObserver((mutations) => {
      let added = false
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length) {
          added = true
          break
        }
      }
      if (added) {
        // small delay to allow layout to settle
        setTimeout(initTestimonialReadMore, 60)
      }
    })
    mo.observe(testimonialContainer, { childList: true, subtree: true })
  }
})()
