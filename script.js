/* Mobile-friendly lightbox with swipe, keyboard, and prev/next controls */
;(() => {
  // slide image elements (inside anchors now)
  const images = Array.from(document.querySelectorAll('.slides img'))
  if (!images.length) return

  let currentIndex = -1
  let startX = 0
  let moved = false

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

    overlay._onKey = onKey
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

  function preload(idx) {
    if (idx < 0 || idx >= images.length) return
    const src = images[idx].src
    const img = new Image()
    img.src = src
  }

  // Preload all images inside a particular .slides element
  function preloadSlides(slidesEl) {
    if (!slidesEl) return
    const imgs = Array.from(slidesEl.querySelectorAll('img'))
    imgs.forEach((i) => {
      if (i.complete) {
        i.classList.add('loaded')
        return
      }
      const tmp = new Image()
      tmp.src = i.src
      tmp.onload = () => i.classList.add('loaded')
      tmp.onerror = () => i.classList.add('loaded')
    })
  }

  function showIndex(i) {
    if (!overlayEl) return
    if (i < 0) i = images.length - 1
    if (i >= images.length) i = 0
    currentIndex = i
    const imgEl = overlayEl.querySelector('.lightbox-img')
    const src = images[currentIndex].src
    imgEl.src = src
    imgEl.alt = images[currentIndex].alt || ''
    // preload neighbors
    preload(currentIndex - 1)
    preload(currentIndex + 1)
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
    d.addEventListener('pointerenter', () => preloadSlides(slides), preloadOnce)
    d.addEventListener('focusin', () => preloadSlides(slides), preloadOnce)
    d.addEventListener('touchstart', () => preloadSlides(slides), preloadOnce)
  })

  // Mark any images already loaded on page load as .loaded
  images.forEach((img) => {
    if (img.complete) img.classList.add('loaded')
    else img.addEventListener('load', () => img.classList.add('loaded'))
  })
})()
