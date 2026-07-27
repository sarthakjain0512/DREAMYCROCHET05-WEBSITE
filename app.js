// DreamyCrochet05 - Application Script

// API configuration fallback warning
if (typeof API_BASE_URL === 'undefined') {
  console.warn("⚠️ [apiConfig] API_BASE_URL is not defined! API requests will run relative to the current host.");
}

const getApiUrl = (endpoint) => {
  const base = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};



// ─── Price Formatter ──────────────────────────────────────────────────────────
// Always renders price as "Rs. XXX". Strips any leading ₹, ₹, Rs., Rs or spaces.
function formatPrice(raw) {
  if (!raw) return 'Ask Us';
  const s = String(raw).trim();
  if (s.toLowerCase() === 'ask us' || s === '') return 'Ask Us';
  // Strip any currency prefix (₹, Rs., Rs , etc.)
  const cleaned = s.replace(/^(rs\.?\s*|₹\s*|₹\s*)/i, '').trim();
  if (!cleaned) return 'Ask Us';
  return `Rs. ${cleaned}`;
}

// ─── Stock Status Helper ──────────────────────────────────────────────────────
// Returns { text, color } based on stock level. Treats undefined/null as 10.
function getStockStatus(stock) {
  const qty = (stock === undefined || stock === null) ? 10 : Number(stock);
  if (qty === 0)  return { text: '🔴 Out of Stock',    color: '#dc2626' };
  if (qty <= 5)   return { text: `🟠 Only ${qty} left`, color: '#ea580c' };
  return           { text: `🟢 In Stock (${qty} left)`, color: '#16a34a' };
}



document.addEventListener('DOMContentLoaded', () => {
  let publicProducts = [];
  // Check touch devices & reduced motion & mobile screen widths
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (window.navigator && window.navigator.msMaxTouchPoints > 0);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;
  const isMobileOrTouch = isTouchDevice || isMobile;


  // --- SAFE IMAGE LOADING HELPERS ---
  function getImageUrlString(val) {
    if (!val) return '';
    if (typeof val === 'object') {
      return val.url || '';
    }
    return String(val);
  }

  function resolveProductPrimaryImage(product) {
    const placeholder = '/images/product-placeholder.webp';
    if (!product) return placeholder;

    // 1. product.img.url
    if (product.img && typeof product.img === 'object' && product.img.url) {
      if (typeof product.img.url === 'string' && product.img.url.trim() !== '') {
        return product.img.url.trim();
      }
    }

    // 2. product.img (if it is a string)
    if (product.img && typeof product.img === 'string' && product.img.trim() !== '') {
      return product.img.trim();
    }

    // 3. product.images[0].url
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0];
      if (firstImg && typeof firstImg === 'object' && firstImg.url) {
        if (typeof firstImg.url === 'string' && firstImg.url.trim() !== '') {
          return firstImg.url.trim();
        }
      }
      
      // 4. product.images[0] (if it is a string)
      if (firstImg && typeof firstImg === 'string' && firstImg.trim() !== '') {
        return firstImg.trim();
      }
    }

    // 5. placeholder
    return placeholder;
  }

  function resolveProductGalleryImages(product) {
    if (!product) return ['/images/product-placeholder.webp'];
    const primary = resolveProductPrimaryImage(product);
    const list = [primary];
    
    if (Array.isArray(product.images)) {
      product.images.forEach(img => {
        const url = getImageUrlString(img);
        if (url && !list.includes(url)) {
          list.push(url);
        }
      });
    }
    return list;
  }

  function getProductImageUrl(rawUrl, product) {
    const fallbackUrl = '/images/product-placeholder.webp';
    let targetUrl = getImageUrlString(rawUrl) || fallbackUrl;
    if (!product) return targetUrl;
    
    let version = '';
    if (product.updatedAt) {
      version = new Date(product.updatedAt).getTime();
    } else if (product.createdAt) {
      version = new Date(product.createdAt).getTime();
    }

    if (version && targetUrl && !targetUrl.startsWith('data:') && targetUrl !== fallbackUrl) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}updated=${version}`;
    }
    return targetUrl;
  }

  function safeLoadProductImage(imgElement, rawUrl, product = null, options = {}) {
    if (!imgElement) return;
    const fallbackUrl = '/images/product-placeholder.webp';
    const targetUrl = getProductImageUrl(rawUrl, product);

    imgElement.dataset.pendingUrl = targetUrl;
    imgElement.decoding = 'async';

    // Optimize Cloudinary URL format and quality if applicable
    let optimizedUrl = targetUrl;
    if (optimizedUrl.includes('res.cloudinary.com') && optimizedUrl.includes('/image/upload/')) {
      if (options.isFullRes || options.fullRes) {
        if (!optimizedUrl.includes('/f_auto,q_auto')) {
          optimizedUrl = optimizedUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        }
      } else {
        if (!optimizedUrl.includes('/f_auto,q_auto,w_600,c_limit')) {
          optimizedUrl = optimizedUrl.replace(/\/image\/upload\/(?:f_auto,q_auto\/)?/, '/image/upload/f_auto,q_auto,w_600,c_limit/');
        }
      }
    }

    if (!imgElement.src || imgElement.src === window.location.href) {
      imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }

    // Set up skeleton loader container layout
    const container = options.container || (imgElement.parentElement && imgElement.parentElement.classList.contains('image-container') ? imgElement.parentElement : null);
    if (container) {
      container.classList.remove('loaded');
      container.classList.add('shimmer-skeleton');
    }

    const startLoading = () => {
      const tempImg = new Image();
      tempImg.decoding = 'async';
      tempImg.onload = () => {
        if (imgElement.dataset.pendingUrl === targetUrl) {
          imgElement.src = optimizedUrl;
          imgElement.classList.add('fade-in-ready');
          if (container) {
            container.classList.remove('shimmer-skeleton');
            container.classList.add('loaded');
          }
          if (options.onSuccess) options.onSuccess();
          delete imgElement.dataset.pendingUrl;
        }
      };

      tempImg.onerror = () => {
        // Fall back to original URL if optimized URL fails to load due to strict transformation rules
        if (optimizedUrl !== targetUrl) {
          optimizedUrl = targetUrl;
          tempImg.src = targetUrl;
        } else {
          if (imgElement.dataset.pendingUrl === targetUrl) {
            imgElement.src = fallbackUrl;
            imgElement.classList.add('fade-in-ready');
            if (container) {
              container.classList.remove('shimmer-skeleton');
              container.classList.add('loaded');
            }
            if (options.onError) options.onError();
            delete imgElement.dataset.pendingUrl;
          }
        }
      };

      tempImg.src = optimizedUrl;
    };

    if (options.eager) {
      startLoading();
    } else {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              startLoading();
              observer.unobserve(imgElement);
            }
          });
        }, { rootMargin: '200px 0px' });
        observer.observe(imgElement);
      } else {
        startLoading();
      }
    }
  }

  function preloadGalleryImages(p) {
    const images = resolveProductGalleryImages(p);
    images.forEach(url => {
      const targetUrl = getProductImageUrl(url, p);
      let optimizedUrl = targetUrl;
      if (optimizedUrl.includes('res.cloudinary.com') && optimizedUrl.includes('/image/upload/')) {
        if (!optimizedUrl.includes('/f_auto,q_auto')) {
          optimizedUrl = optimizedUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        }
      }
      const img = new Image();
      img.onerror = () => {
        if (optimizedUrl !== targetUrl) {
          optimizedUrl = targetUrl;
          img.src = targetUrl;
        }
      };
      img.src = optimizedUrl;
    });
  }

  // --- CENTRAL DOM REFERENCE CACHE ---
  const DOMCache = {
    get toastContainer() { return this._tc || (this._tc = document.getElementById('toast-container')); },
    get loadingScreen() { return this._ls || (this._ls = document.getElementById('loading-screen')); },
    get searchOverlay() { return this._so || (this._so = document.getElementById('search-overlay')); },
    get searchInput() { return this._si || (this._si = document.getElementById('search-input')); },
    get wishlistCounter() { return this._wc || (this._wc = document.getElementById('wishlist-counter')); }
  };

  function showToast(message, type = 'success') {
    const container = DOMCache.toastContainer;
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '🌸';
    if (type === 'success') icon = '✨';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    // trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // remove after 3sc
    setTimeout(() => {
      toast.classList.replace('show', 'hide');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }
  
  window.showToast = showToast;

  // --- MOUSE PARALLAX MOVEMENT ---
  if (!isMobileOrTouch) {
    document.addEventListener('mousemove', (e) => {
      const amount = 30;
      const x = (window.innerWidth / 2 - e.clientX) / amount;
      const y = (window.innerHeight / 2 - e.clientY) / amount;
      
      document.querySelectorAll('.parallax-layer').forEach(el => {
        const depth = el.getAttribute('data-depth') || 1;
        gsap.to(el, {
          x: x * depth,
          y: y * depth,
          duration: 1.2,
          ease: "power2.out"
        });
      });
    });
  }

  // --- PREMIUM CURSOR COMPANION ---
  let refreshCursorHovers = () => {};

  const companion = document.getElementById('cursor-companion');

  if (companion && !isMobileOrTouch && !prefersReducedMotion) {
    companion.style.display = 'block';
    
    const yarnBall = companion.querySelector('.yarn-ball-svg-wrapper');
    const flower = companion.querySelector('.flower-svg-wrapper');
    
    let mouse = { x: 0, y: 0 };
    let pos = { x: 0, y: 0 };
    const speed = 0.15;
    let isMouseActive = true;
    let lastMouseMoveTime = Date.now();
    
    let xSetter = gsap.quickSetter(companion, "x", "px");
    let ySetter = gsap.quickSetter(companion, "y", "px");
    
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMouseActive = true;
      lastMouseMoveTime = Date.now();
    });
    
    gsap.ticker.add(() => {
      if (!isMouseActive) return;

      const dx = Math.abs(mouse.x - pos.x);
      const dy = Math.abs(mouse.y - pos.y);
      if (dx < 0.05 && dy < 0.05 && (Date.now() - lastMouseMoveTime > 1500)) {
        isMouseActive = false;
        return;
      }

      const dt = 1.0 - Math.pow(1.0 - speed, gsap.ticker.deltaRatio());
      pos.x += (mouse.x - pos.x) * dt;
      pos.y += (mouse.y - pos.y) * dt;
      
      const time = gsap.ticker.time;
      const floatX = Math.sin(time * 3) * 2;
      const floatY = Math.cos(time * 2.5) * 3;
      
      xSetter(pos.x + floatX);
      ySetter(pos.y + floatY);
    });

    // Unified Hover Animations via Event Delegation
    function handleHoverStart() {
      gsap.to(companion, {
        scale: 1.35,
        filter: "drop-shadow(0 0 12px rgba(250, 218, 221, 0.75))",
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(yarnBall, {
        opacity: 0,
        scale: 0.6,
        rotate: -45,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(flower, {
        opacity: 1,
        scale: 1,
        rotate: 45,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    function handleHoverEnd() {
      gsap.to(companion, {
        scale: 1,
        filter: "drop-shadow(0 4px 8px rgba(74, 51, 33, 0.15))",
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(yarnBall, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        duration: 0.3,
        ease: "power2.out"
      });
      gsap.to(flower, {
        opacity: 0,
        scale: 0.6,
        rotate: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    const isHoverTarget = (el) => {
      return el && el.closest && el.closest('a, button, input, select, textarea, [role="button"], .clickable, .product-card-container, .why-choose-card, img');
    };

    let currentHoverTarget = null;
    document.body.addEventListener('mouseover', (e) => {
      const target = isHoverTarget(e.target);
      if (target && target !== currentHoverTarget) {
        currentHoverTarget = target;
        handleHoverStart();
      }
    });

    document.body.addEventListener('mouseout', (e) => {
      if (currentHoverTarget && (!e.relatedTarget || !currentHoverTarget.contains(e.relatedTarget))) {
        currentHoverTarget = null;
        handleHoverEnd();
      }
    });

    refreshCursorHovers = () => {}; // Event delegation handles all elements dynamically

    // Click particles animation
    function spawnClickParticles(x, y) {
      const particleCount = 5;
      const colors = ['#FADADD', '#E7D7FF', '#FFF8EE', '#B58A6A'];
      
      for (let i = 0; i < particleCount; i++) {
        const el = document.createElement('div');
        el.className = 'cursor-particle pointer-events-none fixed z-[10001]';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        
        const isHeart = Math.random() > 0.4;
        if (isHeart) {
          el.innerHTML = `<span style="color: ${colors[i % colors.length]}; font-size: 14px; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">♥</span>`;
        } else {
          el.innerHTML = `<span style="color: ${colors[i % colors.length]}; font-size: 11px; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">✨</span>`;
        }
        
        document.body.appendChild(el);
        
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const distance = 20 + Math.random() * 20;
        const destX = x + Math.cos(angle) * distance;
        const destY = y + Math.sin(angle) * distance;
        
        gsap.fromTo(el, 
          { x: -6, y: -6, opacity: 1, scale: 0.5 },
          { 
            x: destX - x - 6, 
            y: destY - y - 6, 
            opacity: 0, 
            scale: 1.3, 
            rotation: (Math.random() - 0.5) * 180,
            duration: 0.45, 
            ease: "power2.out",
            onComplete: () => el.remove() 
          }
        );
      }
    }

    // Global click listener
    window.addEventListener('click', (e) => {
      gsap.fromTo(companion, 
        { scale: 0.75 }, 
        { scale: 1, duration: 0.35, ease: "back.out(2.2)" }
      );
      spawnClickParticles(e.clientX, e.clientY);
    });
  } else {
    if (companion) companion.style.display = 'none';
  }

  // --- LOADER & INTERFACE INITIALIZATION ---
  const loader = document.getElementById('loading-screen');
  let loaderDismissed = false;

  function dismissLoader() {
    if (loaderDismissed) return;
    loaderDismissed = true;
    
    if (loader) {
      loader.style.pointerEvents = 'none';
      const tl = gsap.timeline({
        onComplete: () => {
          loader.style.display = 'none';
          initGSAPScrollAnimations();
        }
      });
      // Animate loader child elements out first (smooth scale and fade)
      tl.to('#loading-screen > *', {
        opacity: 0,
        y: -16,
        scale: 0.96,
        duration: 0.35,
        stagger: 0.05,
        ease: "power2.inOut"
      });
      // Fade out the main backdrop
      tl.to(loader, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.2");
    } else {
      initGSAPScrollAnimations();
    }
  }

  // Safe Loader Dismissal: Dismiss as soon as Hero image & DOM are ready (eliminates unneeded delay while keeping 0 FOUC)
  function triggerSafeDismissal() {
    const heroImg = document.getElementById('hero-bouquet-img');
    if (!heroImg || heroImg.complete || heroImg.naturalWidth > 0) {
      dismissLoader();
    } else {
      heroImg.addEventListener('load', dismissLoader, { once: true });
      heroImg.addEventListener('error', dismissLoader, { once: true });
      setTimeout(dismissLoader, 800);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    triggerSafeDismissal();
  } else {
    document.addEventListener('DOMContentLoaded', triggerSafeDismissal);
  }
  window.addEventListener('load', dismissLoader);
  setTimeout(dismissLoader, 1500);

  // --- MOBILE NAVIGATION MENU ---
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

  function openMobileMenu() {
    if (!mobileNavDrawer || !mobileNavOverlay) return;
    mobileNavOverlay.classList.remove('hidden');
    mobileNavDrawer.classList.remove('hidden');
    
    setTimeout(() => {
      mobileNavOverlay.classList.add('active');
      mobileNavDrawer.classList.add('active');
      mobileMenuBtn?.setAttribute('aria-expanded', 'true');
    }, 10);
    
    if (lenis) lenis.stop(); // Disable scroll
  }

  function closeMobileMenu() {
    if (!mobileNavDrawer || !mobileNavOverlay) return;
    mobileNavOverlay.classList.remove('active');
    mobileNavDrawer.classList.remove('active');
    mobileMenuBtn?.setAttribute('aria-expanded', 'false');
    
    setTimeout(() => {
      mobileNavOverlay.classList.add('hidden');
      mobileNavDrawer.classList.add('hidden');
    }, 400);
    
    if (lenis) lenis.start(); // Enable scroll
  }

  mobileMenuBtn?.addEventListener('click', openMobileMenu);
  mobileMenuCloseBtn?.addEventListener('click', closeMobileMenu);
  mobileNavOverlay?.addEventListener('click', closeMobileMenu);
  
  // Close menu on navigation click
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // --- PREMIUM FILTER DRAWER SYSTEM ---
  const filterToggleBtn = document.getElementById('filter-toggle-btn');
  const filterDrawerCloseBtn = document.getElementById('filter-drawer-close-btn');
  const filterDrawerOverlay = document.getElementById('filter-drawer-overlay');
  const filterDrawer = document.getElementById('filter-drawer');
  let previouslyFocusedFilterElement = null;

  function openFilterDrawer() {
    if (!filterDrawer || !filterDrawerOverlay) return;

    previouslyFocusedFilterElement = document.activeElement;

    filterDrawerOverlay.classList.remove('hidden');
    filterDrawer.classList.remove('hidden');

    setTimeout(() => {
      filterDrawerOverlay.classList.add('active');
      filterDrawer.classList.add('active');
      filterToggleBtn?.setAttribute('aria-expanded', 'true');
      filterDrawer.setAttribute('aria-hidden', 'false');
      filterDrawerCloseBtn?.focus();
    }, 10);

    if (lenis) lenis.stop(); // Disable Lenis scroll
    document.body.classList.add('overflow-hidden'); // Fallback scroll lock

    filterDrawer.addEventListener('keydown', trapFilterFocus);
  }

  function closeFilterDrawer() {
    if (!filterDrawer || !filterDrawerOverlay) return;

    filterDrawerOverlay.classList.remove('active');
    filterDrawer.classList.remove('active');
    filterToggleBtn?.setAttribute('aria-expanded', 'false');
    filterDrawer.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      filterDrawerOverlay.classList.add('hidden');
      filterDrawer.classList.add('hidden');

      if (previouslyFocusedFilterElement && typeof previouslyFocusedFilterElement.focus === 'function') {
        previouslyFocusedFilterElement.focus();
      }
    }, 400);

    if (lenis) lenis.start(); // Enable Lenis scroll
    document.body.classList.remove('overflow-hidden'); // Restore scroll

    filterDrawer.removeEventListener('keydown', trapFilterFocus);
  }

  function trapFilterFocus(e) {
    if (!filterDrawer) return;

    const focusables = filterDrawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusables.length === 0) return;

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
  }

  filterToggleBtn?.addEventListener('click', openFilterDrawer);
  filterDrawerCloseBtn?.addEventListener('click', closeFilterDrawer);
  filterDrawerOverlay?.addEventListener('click', closeFilterDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (filterDrawer && filterDrawer.classList.contains('active')) {
        closeFilterDrawer();
      }
    }
  });

  // --- PRICE RANGE SELECTOR STATE & LOGIC ---
  const MIN_PRICE_LIMIT = 49;
  const MAX_PRICE_LIMIT = 3999;
  const MIN_PRICE_GAP = 100; // Rs. 100 gap

  let filterState = {
    minPrice: MIN_PRICE_LIMIT,
    maxPrice: MAX_PRICE_LIMIT
  };
  window.filterState = filterState;

  const priceMinInput = document.getElementById('price-min-input');
  const priceMaxInput = document.getElementById('price-max-input');
  const priceSliderTrack = document.getElementById('price-slider-track');
  const priceRangeDisplay = document.getElementById('price-range-display');

  function updatePriceSlider() {
    if (!priceMinInput || !priceMaxInput || !priceSliderTrack || !priceRangeDisplay) return;

    let minVal = parseInt(priceMinInput.value);
    let maxVal = parseInt(priceMaxInput.value);

    // Prevent handles from crossing
    if (maxVal - minVal < MIN_PRICE_GAP) {
      if (document.activeElement === priceMinInput) {
        minVal = maxVal - MIN_PRICE_GAP;
        priceMinInput.value = minVal;
      } else {
        maxVal = minVal + MIN_PRICE_GAP;
        priceMaxInput.value = maxVal;
      }
    }

    // Store selected values in state
    filterState.minPrice = minVal;
    filterState.maxPrice = maxVal;

    // Calculate percentages for visual track highlighting
    const totalRange = MAX_PRICE_LIMIT - MIN_PRICE_LIMIT;
    const minPercent = ((minVal - MIN_PRICE_LIMIT) / totalRange) * 100;
    const maxPercent = ((maxVal - MIN_PRICE_LIMIT) / totalRange) * 100;

    priceSliderTrack.style.left = `${minPercent}%`;
    priceSliderTrack.style.right = `${100 - maxPercent}%`;

    // Live display values update
    priceRangeDisplay.textContent = `₹${minVal} – ₹${maxVal}`;
  }

  // Adjust z-index dynamically so user can always drag overlapping handles
  function handleZIndex() {
    if (!priceMinInput || !priceMaxInput) return;
    if (parseInt(priceMinInput.value) > (MAX_PRICE_LIMIT - MIN_PRICE_LIMIT) / 2) {
      priceMinInput.style.zIndex = '20';
      priceMaxInput.style.zIndex = '10';
    } else {
      priceMinInput.style.zIndex = '10';
      priceMaxInput.style.zIndex = '20';
    }
  }

  // Bind events for live value updates and z-indexing
  priceMinInput?.addEventListener('input', () => {
    updatePriceSlider();
    handleZIndex();
  });
  priceMaxInput?.addEventListener('input', () => {
    updatePriceSlider();
    handleZIndex();
  });

  // Initialize track on load
  updatePriceSlider();

  // --- DISCOUNT FILTER STATE & LOGIC ---
  filterState.discountRanges = [];

  function getProductDiscount(p) {
    if (!p || p.showDiscount === false || p.showDiscount === 'false') return null;
    if (p.mrp === undefined || p.mrp === null || p.mrp === '') return null;
    
    const mrpVal = parseFloat(p.mrp);
    if (isNaN(mrpVal) || mrpVal <= 0) return null;
    
    // Strip currency symbols and parse
    const priceVal = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
    if (isNaN(priceVal) || priceVal <= 0) return null;
    
    if (mrpVal <= priceVal) return null;
    
    const discountPercent = Math.round(((mrpVal - priceVal) / mrpVal) * 100);
    return discountPercent;
  }

  function getDiscountRangeKey(discount) {
    if (discount === null || discount === undefined) return null;
    if (discount >= 0 && discount <= 20) return "0-20";
    if (discount > 20 && discount <= 40) return "21-40";
    if (discount > 40 && discount <= 60) return "41-60";
    if (discount > 60 && discount <= 80) return "61-80";
    if (discount > 80 && discount <= 100) return "81-100";
    return null;
  }

  function updateDiscountCounts() {
    const counts = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0
    };

    const list = (typeof publicProducts !== 'undefined' && Array.isArray(publicProducts)) ? publicProducts : [];
    list.forEach(p => {
      const discount = getProductDiscount(p);
      const range = getDiscountRangeKey(discount);
      if (range && counts[range] !== undefined) {
        counts[range]++;
      }
    });

    Object.keys(counts).forEach(range => {
      const el = document.getElementById(`count-${range}`);
      if (el) el.textContent = counts[range];
    });
  }

  function updateDiscountFilterState() {
    const checkedBoxes = document.querySelectorAll('.discount-row input[type="checkbox"]:checked');
    filterState.discountRanges = Array.from(checkedBoxes).map(cb => cb.value);
  }

  // Bind checkbox events
  const discountRows = document.querySelectorAll('.discount-row');
  discountRows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    
    checkbox?.addEventListener('change', () => {
      if (checkbox.checked) {
        row.classList.add('selected-row');
      } else {
        row.classList.remove('selected-row');
      }
      updateDiscountFilterState();
    });
  });

  // Run initial calculation
  updateDiscountCounts();

  // --- PRICE & DISCOUNT FILTER ENGINES & BUTTON HANDLERS ---
  function applyPriceFilter(productsList) {
    if (!productsList || !Array.isArray(productsList)) return [];
    
    return productsList.filter(p => {
      // Clean and parse product price
      const priceVal = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
      if (isNaN(priceVal)) return false;
      return priceVal >= filterState.minPrice && priceVal <= filterState.maxPrice;
    });
  }

  function applyDiscountFilter(productsList) {
    if (!productsList || !Array.isArray(productsList)) return [];
    
    // If no discount ranges are selected, don't filter (return all)
    if (!filterState.discountRanges || filterState.discountRanges.length === 0) {
      return productsList;
    }
    
    return productsList.filter(p => {
      const discount = getProductDiscount(p);
      const range = getDiscountRangeKey(discount);
      return range && filterState.discountRanges.includes(range);
    });
  }

  // Expose filtering engines globally so other components can reuse them
  window.applyPriceFilter = applyPriceFilter;
  window.applyDiscountFilter = applyDiscountFilter;

  const filterApplyBtn = document.getElementById('filter-apply-btn');
  filterApplyBtn?.addEventListener('click', () => {
    // Combined filtering: Price first, then Discount
    let filteredProducts = applyPriceFilter(publicProducts);
    filteredProducts = applyDiscountFilter(filteredProducts);
    
    renderCatalog(filteredProducts);
    closeFilterDrawer();
    playTone(440, 0.1, 'sine', 0.1);
  });

  const filterResetBtn = document.getElementById('filter-reset-btn');
  filterResetBtn?.addEventListener('click', () => {
    // 1. Reset Price Range inputs
    if (priceMinInput) priceMinInput.value = MIN_PRICE_LIMIT;
    if (priceMaxInput) priceMaxInput.value = MAX_PRICE_LIMIT;
    updatePriceSlider();
    handleZIndex();
    
    // 2. Clear all selected Discount checkboxes & row classes
    const checkboxes = document.querySelectorAll('.discount-row input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    const discountRows = document.querySelectorAll('.discount-row');
    discountRows.forEach(row => {
      row.classList.remove('selected-row');
    });
    
    // 3. Clear state values
    filterState.discountRanges = [];
    
    // 4. Re-render all products
    renderCatalog(publicProducts);
    
    playTone(330, 0.15, 'sine', 0.1);
  });

  // --- SCROLL TO TOP BUTTON ---
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  if (scrollToTopBtn) {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
          if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('show');
          } else {
            scrollToTopBtn.classList.remove('show');
          }
        }, 100);
      }
    }, { passive: true });
    scrollToTopBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // --- MUSIC SYNTHESIS (Web Audio API) ---
  let audioCtx = null;
  let isPlayingMusic = false;
  let melodyIntervalId = null;
  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  
  // Cottagecore scale: Pentatonic C Major (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
  const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [349.23, 440.00, 523.25, 587.33], // Fmaj7 (F, A, C, D)
    [392.00, 493.88, 587.33, 659.25], // G6 (G, B, D, E)
    [220.00, 261.63, 329.63, 392.00]  // Am7 (A, C, E, G)
  ];
  
  let currentChordIndex = 0;

  function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playTone(freq, duration, type = 'triangle', gainStart = 0.1) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const delay = audioCtx.createDelay();
    const delayFeedback = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Warm filtering
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

    // Dynamic Envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gainStart, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    // Echo effect
    delay.delayTime.setValueAtTime(0.35, audioCtx.currentTime);
    delayFeedback.gain.setValueAtTime(0.3, audioCtx.currentTime);

    // Routing
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Feedback loop for echo
    gainNode.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCozyMelody() {
    if (!audioCtx) return;
    
    // Play warm background chord pad on every measure
    const chord = chords[currentChordIndex];
    chord.forEach((freq, index) => {
      // Arpeggiate background chimes slightly
      setTimeout(() => {
        playTone(freq, 3.5, 'sine', 0.04);
      }, index * 150);
    });

    // Play randomized, high chimes melody notes
    let steps = 8;
    for (let i = 0; i < steps; i++) {
      const timeOffset = i * 400 + Math.random() * 80;
      setTimeout(() => {
        if (!isPlayingMusic) return;
        // 60% chance to play a melody chime
        if (Math.random() > 0.4) {
          const randomNote = notes[Math.floor(Math.random() * 5) + 5]; // take high notes
          playTone(randomNote, 1.8, 'triangle', 0.06);
        }
      }, timeOffset);
    }

    currentChordIndex = (currentChordIndex + 1) % chords.length;
  }

  function startMusic() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    isPlayingMusic = true;
    musicIcon.textContent = 'music_note';
    musicToggle.classList.add('bg-primary-container', 'text-on-primary-container');
    
    // Play once immediately
    playCozyMelody();
    // Schedule intervals
    melodyIntervalId = setInterval(playCozyMelody, 3600);
  }

  function stopMusic() {
    isPlayingMusic = false;
    musicIcon.textContent = 'music_off';
    musicToggle.classList.remove('bg-primary-container', 'text-on-primary-container');
    if (melodyIntervalId) {
      clearInterval(melodyIntervalId);
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (isPlayingMusic) {
        stopMusic();
      } else {
        startMusic();
      }
    });
  }

  // --- INTERFACE FALLBACK INITIALIZATION ---
  const mainBoutique = document.getElementById('main-boutique');

  // Nuclear fallback: after 3.8s, if elements in boutique are still invisible, force reveal them
  setTimeout(() => {
    const whyCardsF = document.querySelectorAll('#why-crochet .glass-card');
    const whyChooseCardsF = document.querySelectorAll('.why-choose-card');
    whyCardsF.forEach(c => { if (c.style.opacity === '0' || parseFloat(c.style.opacity) < 0.5) { c.style.opacity = '1'; c.style.transform = 'none'; } });
    whyChooseCardsF.forEach(c => { if (c.style.opacity === '0' || parseFloat(c.style.opacity) < 0.5) { c.style.opacity = '1'; c.style.transform = 'none'; } });
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
      ScrollTrigger.refresh();
    }
  }, 3800);

  // --- DARK MODE TOGGLE ---
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-mode');
      if (document.documentElement.classList.contains('dark-mode')) {
        themeIcon.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
      } else {
        themeIcon.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
      }
    });
    
    // Apply local storage preference
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark-mode');
      themeIcon.textContent = 'light_mode';
    }
  }

  // --- WISHLIST FUNCTIONALITY ---
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const wishlistCounter = document.getElementById('wishlist-counter');
  const wishlistModal = document.getElementById('wishlist-modal');
  const wishlistItemsContainer = document.getElementById('wishlist-items-container');
  
  const renderWishlistModalItems = () => {
    if (!wishlistItemsContainer) return;
    wishlistItemsContainer.innerHTML = '';

    if (wishlist.length === 0) {
      wishlistItemsContainer.innerHTML = `
        <div class="text-center py-10 px-4 flex flex-col items-center gap-3">
          <span class="text-4xl animate-bounce">🌷</span>
          <p class="font-serif text-base font-bold text-darkbrown dark:text-beige">Your Favorites is empty</p>
          <p class="text-xs text-primary/60 max-w-[200px] mx-auto">Browse our collection and tap the heart icon to save products here!</p>
        </div>
      `;
      return;
    }

    wishlist.forEach(prodName => {
      const p = publicProducts.find(item => item.name === prodName);
      if (p) {
        const itemEl = document.createElement('div');
        itemEl.className = 'flex items-center gap-4 bg-white/60 dark:bg-darkbrown/40 p-3 rounded-2xl border border-primary/5 hover:border-primary/10 transition-all duration-300';
        itemEl.innerHTML = `
          <img alt="${p.name}" class="w-16 h-16 object-contain bg-beige/30 rounded-xl border border-primary/5 shrink-0">
          <div class="flex-grow min-w-0">
            <h4 class="font-serif text-sm font-bold text-darkbrown dark:text-beige truncate">${p.name}</h4>
            <p class="text-xs text-primary font-semibold">${formatPrice(p.price)}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="view-wishlist-item-btn w-8 h-8 rounded-full hover:bg-beige/80 dark:hover:bg-beige/20 text-darkbrown dark:text-beige flex items-center justify-center transition clickable" title="View details">
              <span class="material-symbols-outlined text-lg">visibility</span>
            </button>
            <button class="delete-wishlist-item-btn w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 flex items-center justify-center transition clickable" title="Remove from favorites">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        `;

        const imgEl = itemEl.querySelector('img');
        safeLoadProductImage(imgEl, resolveProductPrimaryImage(p), p);

        // Bind view button
        itemEl.querySelector('.view-wishlist-item-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          closeWishlistModal();
          setTimeout(() => {
            openQuickView(p);
          }, 300);
        });

        // Bind delete button
        itemEl.querySelector('.delete-wishlist-item-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = wishlist.indexOf(prodName);
          if (idx > -1) {
            wishlist.splice(idx, 1);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            playTone(220, 0.2, 'sine', 0.1);
            showToast("Removed from wishlist", "success");
            updateWishlistUI();
          }
        });

        wishlistItemsContainer.appendChild(itemEl);
      } else {
        const itemEl = document.createElement('div');
        itemEl.className = 'flex items-center gap-4 bg-white/60 dark:bg-darkbrown/40 p-3 rounded-2xl border border-primary/5 hover:border-primary/10 transition-all duration-300';
        itemEl.innerHTML = `
          <div class="w-16 h-16 bg-beige/30 border border-primary/5 shrink-0 flex items-center justify-center rounded-xl">
            <span class="text-xl">🌸</span>
          </div>
          <div class="flex-grow min-w-0">
            <h4 class="font-serif text-sm font-bold text-darkbrown dark:text-beige truncate">${prodName}</h4>
            <p class="text-xs text-primary/50">Product not available</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="delete-wishlist-item-btn w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 flex items-center justify-center transition clickable" title="Remove from favorites">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        `;

        itemEl.querySelector('.delete-wishlist-item-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = wishlist.indexOf(prodName);
          if (idx > -1) {
            wishlist.splice(idx, 1);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            playTone(220, 0.2, 'sine', 0.1);
            showToast("Removed from wishlist", "success");
            updateWishlistUI();
          }
        });

        wishlistItemsContainer.appendChild(itemEl);
      }
    });
  };

  const openWishlistModal = async () => {
    if (!wishlistModal) return;
    if (publicProducts.length === 0) {
      try {
        publicProducts = await BackendAPI.getProducts();
      } catch (err) {
        console.error("Failed to load products for wishlist modal:", err);
      }
    }
    renderWishlistModalItems();
    wishlistModal.classList.remove('hidden');
    setTimeout(() => wishlistModal.classList.add('active'), 50);
    playTone(523.25, 0.3, 'sine', 0.1);
  };

  const closeWishlistModal = () => {
    if (!wishlistModal) return;
    wishlistModal.classList.remove('active');
    setTimeout(() => wishlistModal.classList.add('hidden'), 400);
  };

  const updateWishlistUI = () => {
    if (wishlistCounter) {
      wishlistCounter.textContent = wishlist.length;
      wishlistCounter.style.display = wishlist.length > 0 ? 'flex' : 'none';
    }
    
    // Update active hearts on cards
    document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
      const prodName = btn.getAttribute('data-product-name');
      const icon = btn.querySelector('.material-symbols-outlined');
      if (wishlist.includes(prodName)) {
        icon.style.fontVariationSettings = "'FILL' 1";
        icon.classList.add('text-red-400');
      } else {
        icon.style.fontVariationSettings = "'FILL' 0";
        icon.classList.remove('text-red-400');
      }
    });

    // Also re-render wishlist modal items if it's currently open
    if (wishlistModal && !wishlistModal.classList.contains('hidden')) {
      renderWishlistModalItems();
    }
  };

  // Bind hearts
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-heart-btn');
    if (btn) {
      e.stopPropagation();
      const prodName = btn.getAttribute('data-product-name');
      const idx = wishlist.indexOf(prodName);
      if (idx > -1) {
        wishlist.splice(idx, 1);
        playTone(220, 0.2, 'sine', 0.1); // lower chimes tone for remove
        showToast("Removed from wishlist", "success");
      } else {
        wishlist.push(prodName);
        playTone(880, 0.4, 'triangle', 0.15); // sparkle chime for add
        createFloatingHeart(e.clientX, e.clientY);
        showToast("Added to wishlist!", "success");
      }
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      updateWishlistUI();
    }
  });

  // Bind wishlist modal open/close
  const headerWishlistBtn = document.getElementById('header-wishlist-btn');
  const closeWishlistModalBtn = document.getElementById('close-wishlist-modal-btn');
  
  if (headerWishlistBtn) {
    headerWishlistBtn.addEventListener('click', openWishlistModal);
  }
  if (closeWishlistModalBtn) {
    closeWishlistModalBtn.addEventListener('click', closeWishlistModal);
  }
  if (wishlistModal) {
    wishlistModal.addEventListener('click', (e) => {
      if (e.target === wishlistModal) {
        closeWishlistModal();
      }
    });
  }

  function createFloatingHeart(x, y) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.position = 'fixed';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.style.fontSize = '24px';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    document.body.appendChild(heart);

    gsap.to(heart, {
      y: y - 100,
      x: x + (Math.random() - 0.5) * 60,
      opacity: 0,
      scale: 1.5,
      rotation: (Math.random() - 0.5) * 45,
      duration: 1.2,
      ease: "power1.out",
      onComplete: () => heart.remove()
    });
  }



  // --- RECOMMENDATION QUIZ ---
  const quizModal = document.getElementById('quiz-modal');
  const startQuizBtn = document.getElementById('start-quiz-btn');
  const closeQuizBtn = document.getElementById('close-quiz-btn');
  const quizNextBtn = document.getElementById('quiz-next-btn');
  const quizPrevBtn = document.getElementById('quiz-prev-btn');
  const quizSlideContainer = document.getElementById('quiz-slide-container');
  const quizResultScreen = document.getElementById('quiz-result');
  const quizResultName = document.getElementById('quiz-result-name');
  const quizResultImg = document.getElementById('quiz-result-img');
  const quizResetBtn = document.getElementById('quiz-reset-btn');

  let currentQuizStep = 0;
  let quizAnswers = {};

  const openQuiz = () => {
    if (quizModal) {
      quizModal.classList.remove('hidden');
      setTimeout(() => quizModal.classList.add('active'), 50);
      currentQuizStep = 0;
      quizAnswers = {};
      showQuizStep(0);
    }
  };

  const closeQuiz = () => {
    if (quizModal) {
      quizModal.classList.remove('active');
      setTimeout(() => quizModal.classList.add('hidden'), 400);
    }
  };

  const showQuizStep = (step) => {
    const slides = document.querySelectorAll('.quiz-slide');
    slides.forEach((slide, idx) => {
      slide.style.display = idx === step ? 'block' : 'none';
    });

    if (quizPrevBtn) quizPrevBtn.style.display = step === 0 ? 'none' : 'inline-block';
    
    if (step === slides.length - 1) {
      if (quizNextBtn) quizNextBtn.style.display = 'none';
      if (quizResultScreen) quizResultScreen.classList.remove('hidden');
      calculateQuizResult();
    } else {
      if (quizNextBtn) quizNextBtn.style.display = 'inline-block';
      if (quizResultScreen) quizResultScreen.classList.add('hidden');
    }
  };

  const calculateQuizResult = () => {
    const who = quizAnswers[0];
    const vibe = quizAnswers[1];
    
    let resultName = "Pastel Tulips Bouquet";
    let resultImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuASmYaUEqtiY2wH3jiCgJSFQYGyJM8BYwkgd4vITCkMeXBwumXyg8otUSXlDZcHr0ticf5nPN_Uuv5ZQCbXK5YuU5ySXM3V7cwAgH3GL6fHLJgiTzzx_d3y92WHJo6mYNi8QV6jsOuHUqoLabccynhPombFczjW2m0y1ujUtl-rba6TJ3BX1ZQzeCttbwyJq1fL17n6wtPctDJVX2fCHCgLNXfUGllvz1RWswUXxiGX4cWdkOyi4UU15cd7jhuqfeeuHDF_wq3Vtjs";

    if (vibe === 'bright') {
      resultName = "Sunny Sunflower Stem";
      resultImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuCiVZ-eOCmlOjwt7GPfBrywqnFIFVUwYFQWZ9GAIhw-DNiz66dJJNAYvy0i-wnZL5ej2W7DIAQ-nyk5okomL5Otc21LSGDj8QKBh__dbYiWkmyad4YNYb9dSD4ax92a4pue9_HQp7JScwzkybuqoxOadiaI3jxgdqnFEWGDBT19qG64Vks7QaAk_ROe3zrheOwJCupdbPJSpDZF8uXTLWH5WsEtIUE2dB8XfM_a_t4caw7P18bFtyQ2vaRAcUmc38UgUPeiQSB_nro";
    } else if (vibe === 'cozy') {
      resultName = "Cozy Amigurumi Plushies";
      resultImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuARR88LBW3NDWz5nd3y8nZwPYAfvrWSOw2BPY4xpERv-Z5xHGx_S_C8NsGyEhUJvZkmYGFKsTm2Rj7Pf9uXMFxQZKpN-tcYRS3xK-Rqnailc-56fhBrP-IPEWfFPfLopND0sKlbC8n7dl24KL3bxTKXd-CEpF4i-8REMoZtcf1gfT2vWfmsDNij_zi2nxMRWJ5xLk5ObsLWYUNLMjLMU7gM-cHJaNxO3MND5fibBeIG2wV-XHW2dM2Th4DZ7md-eqBTYfGG70LBj2U";
    }

    if (quizResultName) quizResultName.textContent = resultName;
    if (quizResultImg) quizResultImg.src = resultImg;
  };

  if (startQuizBtn) startQuizBtn.addEventListener('click', openQuiz);
  if (closeQuizBtn) closeQuizBtn.addEventListener('click', closeQuiz);
  
  if (quizNextBtn) {
    quizNextBtn.addEventListener('click', () => {
      // Find selected radio in current slide
      const selected = document.querySelector(`.quiz-slide:nth-child(${currentQuizStep + 1}) input:checked`);
      if (!selected) {
        showToast("Please select an option before continuing! ✨", "error");
        return;
      }
      quizAnswers[currentQuizStep] = selected.value;
      currentQuizStep++;
      showQuizStep(currentQuizStep);
      playTone(587.33, 0.1, 'sine', 0.05);
    });
  }

  if (quizPrevBtn) {
    quizPrevBtn.addEventListener('click', () => {
      if (currentQuizStep > 0) {
        currentQuizStep--;
        showQuizStep(currentQuizStep);
        playTone(392.00, 0.1, 'sine', 0.05);
      }
    });
  }

  if (quizResetBtn) {
    quizResetBtn.addEventListener('click', () => {
      currentQuizStep = 0;
      quizAnswers = {};
      showQuizStep(0);
      document.querySelectorAll('#quiz-modal input[type="radio"]').forEach(rad => rad.checked = false);
    });
  }

  // ============================================================
  //  PRODUCTION ADMIN AUTHENTICATION, REST CLIENT & PORTAL LOGIC
  // ============================================================

  // REST API Client Layer
  const BackendAPI = {
    // ── Products ────────────────────────────────────────────────────────────────────────
    getProducts: async () => {
      const res = await fetch(getApiUrl('/api/products'));
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    getAllProducts: async (token) => {
      const res = await fetch(getApiUrl('/api/products'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch all products');
      return res.json();
    },
    getProductStats: async (token) => {
      const res = await fetch(getApiUrl('/api/products/admin/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    addProduct: (token, data, onProgress) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getApiUrl('/api/products'));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const resData = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(resData);
            } else {
              reject(new Error(resData.error || 'Failed to add product'));
            }
          } catch (err) {
            reject(new Error('Failed to parse server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection failure.'));
        xhr.send(JSON.stringify(data));
      });
    },
    editProduct: (token, id, data, onProgress) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', getApiUrl(`/api/products/${id}`));
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const resData = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(resData);
            } else {
              reject(new Error(resData.error || 'Failed to update product'));
            }
          } catch (err) {
            reject(new Error('Failed to parse server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection failure.'));
        xhr.send(JSON.stringify(data));
      });
    },
    deleteProduct: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      return data;
    },
    toggleVisibility: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/products/${id}/visibility`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle visibility');
      return data;
    },
    toggleFeatured: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/products/${id}/featured`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle featured');
      return data;
    },
    incrementViewCount: async (id) => {
      try { await fetch(getApiUrl(`/api/products/${id}/view`), { method: 'POST' }); } catch (_) {}
    },
    // ── Custom Orders (NEW /api/custom-orders endpoint) ──────────────────────
    getCustomOrders: async (token) => {
      const res = await fetch(getApiUrl('/api/custom-orders'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    getCustomOrderStats: async (token) => {
      const res = await fetch(getApiUrl('/api/custom-orders/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch order stats');
      return res.json();
    },
    getCustomOrderById: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/custom-orders/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      return res.json();
    },
    submitCustomOrder: (formData, onProgress) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getApiUrl('/api/custom-orders'));
        
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Failed to submit order'));
            }
          } catch (err) {
            reject(new Error('Failed to parse server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection failure.'));
        xhr.send(formData);
      });
    },
    updateCustomOrderStatus: async (token, id, status) => {
      const res = await fetch(getApiUrl(`/api/custom-orders/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    deleteCustomOrder: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/custom-orders/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete order');
      return res.json();
    },
    // ── Settings ───────────────────────────────────────────────────────────────
    getHomepageSettings: async () => {
      const res = await fetch(getApiUrl('/api/settings'));
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
    updateHomepageSettings: async (token, settingsData) => {
      const res = await fetch(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settingsData)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    submitOverallReview: (formData, onProgress) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getApiUrl('/api/reviews/overall'));
        
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Failed to submit review'));
            }
          } catch (err) {
            reject(new Error('Failed to parse server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection failure.'));
        xhr.send(formData);
      });
    },
    submitProductReview: (formData, onProgress) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getApiUrl('/api/reviews/product'));
        
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Failed to submit review'));
            }
          } catch (err) {
            reject(new Error('Failed to parse server response'));
          }
        };

        xhr.onerror = () => reject(new Error('Network connection failure.'));
        xhr.send(formData);
      });
    },
    getOverallReviews: async () => {
      const res = await fetch(getApiUrl('/api/reviews/overall'));
      if (!res.ok) throw new Error('Failed to fetch overall reviews');
      return res.json();
    },
    getProductReviews: async (productId) => {
      const res = await fetch(getApiUrl(`/api/reviews/product/${productId}`));
      if (!res.ok) throw new Error('Failed to fetch product reviews');
      return res.json();
    },
    getPendingOverallReviewsAdmin: async (token) => {
      const res = await fetch(getApiUrl('/api/reviews/overall/admin/pending'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending overall reviews');
      return res.json();
    },
    getApprovedOverallReviewsAdmin: async (token) => {
      const res = await fetch(getApiUrl('/api/reviews/overall/admin/approved'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch approved overall reviews');
      return res.json();
    },
    getPendingProductReviewsAdmin: async (token) => {
      const res = await fetch(getApiUrl('/api/reviews/product/admin/pending'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending product reviews');
      return res.json();
    },
    getApprovedProductReviewsAdmin: async (token) => {
      const res = await fetch(getApiUrl('/api/reviews/product/admin/approved'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch approved product reviews');
      return res.json();
    },
    approveOverallReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/overall/admin/${id}/approve`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve review');
      return res.json();
    },
    rejectOverallReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/overall/admin/${id}/reject`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject review');
      return res.json();
    },
    deleteOverallReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/overall/admin/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete review');
      return res.json();
    },
    approveProductReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/product/admin/${id}/approve`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve product review');
      return res.json();
    },
    rejectProductReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/product/admin/${id}/reject`), {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject product review');
      return res.json();
    },
    deleteProductReviewAdmin: async (token, id) => {
      const res = await fetch(getApiUrl(`/api/reviews/product/admin/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete product review');
      return res.json();
    }
  };


  // Verify JWT via backend verification endpoint
  async function verifyAdminToken(token) {
    if (!token) return false;
    try {
      const res = await fetch(getApiUrl('/api/admin/verify'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      return !!data.valid;
    } catch (err) {
      return false;
    }
  }

  // --- HOMEPAGE DYNAMIC INJECTION ---
  async function applyHomepageSettings() {
    try {
      const s = await BackendAPI.getHomepageSettings();
      const titleEl = document.querySelector('#hero-content h1');
      if (titleEl && s.heroTitle) {
        const parts = s.heroTitle.split('.');
        const line1 = parts[0] ? parts[0] + '.' : 'Flowers That Never Fade.';
        const line2 = parts[1] ? parts[1].trim() : 'Memories That Make Forever.';
        
        const l1Words = line1.split(' ').map(w => `<span class="inline-block overflow-hidden"><span class="reveal-word inline-block mr-2">${w}</span></span>`).join(' ');
        
        titleEl.innerHTML = `
          ${l1Words}
          <br>
          <span class="inline-block overflow-hidden mt-3">
            <span class="reveal-word inline-block text-primary dark:text-primary-container bg-gradient-to-r from-primary-container/50 to-secondary/40 dark:from-primary/30 dark:to-secondary/20 px-6 py-2 rounded-2xl filter drop-shadow-sm border border-primary/10 shadow-sm">${line2}</span>
          </span>
        `;
      }

      const sub1 = document.getElementById('hero-subtitle-line1');
      const sub2 = document.getElementById('hero-subtitle-line2');
      if (sub1 && s.heroSubtitleLine1) {
        sub1.textContent = s.heroSubtitleLine1;
      }
      if (sub2 && s.heroSubtitleLine2) {
        sub2.textContent = s.heroSubtitleLine2;
      }

      const coverImg = document.getElementById('hero-bouquet-img');
      if (coverImg && s.heroImage) {
        coverImg.src = typeof s.heroImage === 'object' && s.heroImage.url ? s.heroImage.url : s.heroImage;
      }
    } catch (e) {
      console.error('Failed to apply settings:', e);
    }
  }

  // --- PRODUCTS RENDERING (DYNAMIC CATALOG) ---
  const productsGrid = document.getElementById('products-grid');
  const layoutBtns = document.querySelectorAll('.layout-btn');
  let currentLayout = localStorage.getItem('shopLayout') || '3col';

  const layoutMap = {
    '1col':  { cls: 'layout-1',    id: 'layout-1col' },
    '2col':  { cls: 'layout-2',    id: 'layout-2col' },
    '3col':  { cls: 'layout-3',    id: 'layout-3col' },
    'list':  { cls: 'layout-list', id: 'layout-list' }
  };

  function applyLayout(key) {
    if (!productsGrid) return;
    currentLayout = key;
    localStorage.setItem('shopLayout', key);
    Object.values(layoutMap).forEach(v => productsGrid.classList.remove(v.cls));
    productsGrid.classList.add(layoutMap[key].cls);
    layoutBtns.forEach(b => b.classList.remove('active-layout'));
    const activeBtn = document.getElementById(layoutMap[key].id);
    if (activeBtn) activeBtn.classList.add('active-layout');
  }

  // Bind layout buttons
  document.getElementById('layout-1col')?.addEventListener('click', () => applyLayout('1col'));
  document.getElementById('layout-2col')?.addEventListener('click', () => applyLayout('2col'));
  document.getElementById('layout-3col')?.addEventListener('click', () => applyLayout('3col'));
  document.getElementById('layout-list')?.addEventListener('click', () => applyLayout('list'));

  // Render a single product card
  function renderProductCard(p, isAdmin, index) {
    const isCustomOrderCard = p.id === 'custom-order-card';
    const card = document.createElement('div');
    card.className = `product-card-container glass-card rounded-cozy p-4 relative group flex flex-col h-full cursor-pointer`;
    card.setAttribute('data-product-name', p.name);
    card.setAttribute('data-product-id', p.id || p._id);
    
    let heartButton = '';
    if (!isCustomOrderCard) {
      heartButton = `
        <button class="wishlist-heart-btn absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-primary hover:bg-white transition-colors duration-200 clickable" data-product-name="${p.name}">
          <span class="material-symbols-outlined text-xl">favorite</span>
        </button>
      `;
    }
    
    let labelSpan = '';
    if (p.label) {
      labelSpan = `<span class="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-darkbrown">${p.label}</span>`;
    }

    let adminControls = '';
    if (isAdmin && !isCustomOrderCard) {
      const pId = p._id || p.id;
      adminControls = `
        <div class="absolute top-4 left-4 flex gap-2 z-20">
          <button class="admin-edit-btn w-9 h-9 rounded-full bg-white/95 text-primary shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 clickable" title="Edit Product" data-id="${pId}">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button class="admin-delete-btn w-9 h-9 rounded-full bg-white/95 text-red-600 shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 clickable" title="Delete Product" data-id="${pId}">
            <span class="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      `;
    }

    let imgHtml = '';
    if (isCustomOrderCard) {
      imgHtml = `
        <div class="w-full h-full bg-gradient-to-br from-secondary/50 via-primary-container/40 to-beige flex flex-col items-center justify-center gap-3">
          <span class="text-6xl">🎁</span>
          <span class="text-sm font-semibold text-primary px-3 text-center">Your dream design, made by Mom</span>
        </div>
      `;
    } else {
      imgHtml = `<img alt="${p.name}" class="w-full h-full object-contain bg-beige/30 group-hover:scale-105 duration-500" loading="lazy">`;
    }

    // Prefilled inquiry buttons
    let inquiryButtons = '';
    if (!isCustomOrderCard) {
      inquiryButtons = `
        <div class="mt-4 flex gap-2 w-full pt-3 border-t border-primary/5">
          <a href="https://www.instagram.com/dreamycrochet05/" target="_blank" class="w-full py-2.5 rounded-full border border-primary/20 text-xs font-bold text-primary hover:bg-primary-container/20 text-center transition duration-300 clickable flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            DM on Instagram
          </a>
        </div>

      `;
    }

    const galleryImages = resolveProductGalleryImages(p);
    const showCollectionBtn = !isCustomOrderCard && galleryImages.length > 0;

    let priceHtml = `<span class="text-primary font-semibold shrink-0">${formatPrice(p.price)}</span>`;
    if (!isCustomOrderCard) {
      const priceNum = Number(String(p.price).replace(/[^\d.]/g, ''));
      const mrpNum = Number(p.mrp);
      if (mrpNum && !isNaN(mrpNum) && !isNaN(priceNum) && mrpNum > priceNum) {
        const showBadge = !!p.showDiscount;
        const discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        priceHtml = `
          <div class="flex flex-col items-end shrink-0">
            <span class="text-primary font-bold">${formatPrice(p.price)}</span>
            <div class="flex items-center gap-1.5 mt-0.5">
              <del class="text-xs text-primary opacity-80 line-through decoration-2 decoration-current">${formatPrice(p.mrp)}</del>
              ${showBadge ? `<span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#e2ece9] text-[#2e5a44] border border-[#2e5a44]/10 shrink-0 select-none">${discount}% OFF</span>` : ''}
            </div>
          </div>
        `;
      }
    }

    card.innerHTML = `
      <div class="relative overflow-hidden rounded-cozy-sm mb-6 aspect-[4/3] image-container ${isCustomOrderCard ? 'loaded' : ''}">
        ${imgHtml}
        ${heartButton}
        ${labelSpan}
        ${adminControls}
        ${showCollectionBtn ? `
          <button class="view-collection-btn absolute bottom-4 right-4 bg-white/90 dark:bg-darkbrown/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-primary hover:bg-white text-[10px] font-bold shadow-md hover:scale-105 transition-all duration-200 clickable flex items-center gap-1 z-20">
            <span class="material-symbols-outlined text-xs" style="font-size: 14px;">photo_library</span> View Collection
          </button>
        ` : ''}
      </div>
      <div class="flex-grow flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2 gap-2">
            <h3 class="font-serif text-xl font-bold text-darkbrown line-clamp-2 leading-snug">${p.name}</h3>
            ${priceHtml}
          </div>
        </div>
        <div class="mt-auto">
          <span class="inline-block px-3 py-1 text-xs rounded-full bg-primary-container text-on-primary-container font-semibold">${p.badge}</span>
          ${inquiryButtons}
        </div>
      </div>

    `;

    // Bind card clicks
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-heart-btn') || e.target.closest('.admin-edit-btn') || e.target.closest('.admin-delete-btn') || e.target.closest('a') || e.target.closest('.view-collection-btn')) {
        return;
      }
      if (isCustomOrderCard) {
        openCustomOrderModal();
      } else {
        openQuickView(p);
      }
    });

    if (showCollectionBtn) {
      card.querySelector('.view-collection-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openGallery(galleryImages, 0, p.name);
      });
    }

    // Bind Admin Edit/Delete click events
    if (isAdmin && !isCustomOrderCard) {
      const pId = p._id || p.id;
      card.querySelector('.admin-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditProductModal(p);
      });
      card.querySelector('.admin-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteProduct(pId, p.name);
      });
    }

    if (!isCustomOrderCard) {
      const imgEl = card.querySelector('.image-container img');
      const containerEl = card.querySelector('.image-container');
      const rawSrc = resolveProductPrimaryImage(p);
      const isEager = (index !== undefined && index < 3);
      safeLoadProductImage(imgEl, rawSrc, p, { container: containerEl, eager: isEager });
    }

    return card;
  }

  async function renderCatalog(productsToRender) {
    if (!productsGrid) return;
    
    try {
      let products = productsToRender;
      const isFiltered = Array.isArray(productsToRender);

      if (!isFiltered) {
        products = await BackendAPI.getProducts();
        publicProducts = products; // Cache for wishlist/favorites view
        if (typeof updateDiscountCounts === 'function') {
          updateDiscountCounts();
        }
      }

      const token = sessionStorage.getItem('admin_token');
      const isAdmin = token ? await verifyAdminToken(token) : false;

      productsGrid.innerHTML = '';

      products.forEach((p, index) => {
        productsGrid.appendChild(renderProductCard(p, isAdmin, index));
      });

      // Append static Custom Order card for customers
      const customOrderCardData = {
        id: 'custom-order-card',
        name: 'Custom Order',
        price: 'Ask Us',
        desc: 'Design your own crochet gift — any flower, any color, any size.',
        badge: 'Custom',
        label: 'Made-to-Order ✨'
      };
      productsGrid.appendChild(renderProductCard(customOrderCardData, false));

      // Admin dashboard "Add Product" dotted card inside grid
      if (isAdmin) {
        const addCard = document.createElement('button');
        addCard.id = 'add-product-card-btn';
        addCard.className = 'upload-card-btn glass-card rounded-cozy p-4 relative group overflow-hidden cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 flex flex-col items-center justify-center min-h-[420px] transition-all duration-300 hover:bg-primary-container/10 clickable';
        addCard.innerHTML = `
          <div class="flex flex-col items-center gap-4 text-center px-6 pointer-events-none">
            <div class="w-20 h-20 rounded-full bg-primary-container/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <span class="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
            </div>
            <div>
              <p class="font-serif font-bold text-xl text-darkbrown mb-1">Add Your Product</p>
              <p class="text-sm text-primary/60">Upload a photo &amp; add product details</p>
            </div>
            <div class="flex flex-wrap justify-center gap-2 mt-2">
              <span class="px-3 py-1 text-xs rounded-full bg-primary-container/50 text-on-primary-container">📸 Photo Upload</span>
              <span class="px-3 py-1 text-xs rounded-full bg-secondary/50 text-darkbrown">💾 Secured</span>
            </div>
          </div>
        `;
        addCard.addEventListener('click', () => {
          openAddProductModal();
        });
        productsGrid.appendChild(addCard);
      }

      // Smooth fade-in animation of grid elements
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(productsGrid, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }

      // Refresh custom cursor hovers
      if (typeof refreshCursorHovers === 'function') {
        refreshCursorHovers();
      }

      updateWishlistUI();
      renderRecentlyViewed();
    } catch (err) {
      console.error('Failed to render catalog:', err);
    }
  }

  // --- SECTIONS ROUTE GUARDS & SEO PROTECTION ---
  function setRobotsMeta(isStandard) {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    if (isStandard) {
      meta.content = 'index, follow';
    } else {
      meta.content = 'noindex, nofollow';
    }
  }

  const adminLoginOverlay = document.getElementById('admin-login-overlay');
  const adminDashboardOverlay = document.getElementById('admin-dashboard-overlay');

  async function handleRouting() {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    // Support secret route '/dreamycrochet05-admin' alongside query parameter fallbacks
    const isAdminRoute = pathname === '/dreamycrochet05-admin' || pathname === '/dreamycrochet05-admin/' || hash === '#/admin-login' || hash === '#/admin' || searchParams.has('admin');

    if (isAdminRoute) {
      // 1. Guard SEO Search Indexing
      setRobotsMeta(false);

      // 2. Validate token via backend verify route
      const token = sessionStorage.getItem('admin_token');
      const isTokenValid = await verifyAdminToken(token);

      if (isTokenValid) {
        // Logged in!
        adminLoginOverlay?.classList.add('hidden');
        adminDashboardOverlay?.classList.remove('hidden');
        await renderAdminDashboard();
      } else {
        // Not logged in. Show login screen.
        adminDashboardOverlay?.classList.add('hidden');
        adminLoginOverlay?.classList.remove('hidden');
        setTimeout(() => adminLoginOverlay?.classList.add('active'), 50);
      }
    } else {
      // Normal customer screen
      setRobotsMeta(true);
      adminLoginOverlay?.classList.remove('active');
      adminLoginOverlay?.classList.add('hidden');
      adminDashboardOverlay?.classList.add('hidden');

      // Deep-link support for shared product URLs (?product=...)
      if (searchParams.has('product')) {
        const rawParam = searchParams.get('product');
        if (rawParam && publicProducts && publicProducts.length > 0) {
          const targetName = decodeURIComponent(rawParam).trim().toLowerCase();
          const foundProduct = publicProducts.find(p => p.name && p.name.trim().toLowerCase() === targetName);
          if (foundProduct) {
            const productsSec = document.getElementById('best-sellers') || document.getElementById('products-grid');
            if (productsSec) {
              if (typeof lenis !== 'undefined' && lenis && typeof lenis.scrollTo === 'function') {
                lenis.scrollTo(productsSec);
              } else {
                productsSec.scrollIntoView({ behavior: 'smooth' });
              }
            }
            setTimeout(() => {
              openQuickView(foundProduct);
            }, 400);

            // Remove query parameter from URL without page reload
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }
      }
    }
  }

  window.addEventListener('hashchange', handleRouting);

  // Close admin login form & return home
  const adminLoginCloseBtn = document.getElementById('admin-login-close');
  adminLoginCloseBtn?.addEventListener('click', () => {
    // Redirect unauthenticated escapees back to landing boutique
    window.location.href = '/';
  });

  // Toggle password field visibility
  const adminPasswordToggle = document.getElementById('admin-password-toggle');
  const adminPasswordInput = document.getElementById('admin-password');
  adminPasswordToggle?.addEventListener('click', () => {
    const icon = adminPasswordToggle.querySelector('.material-symbols-outlined');
    if (adminPasswordInput.type === 'password') {
      adminPasswordInput.type = 'text';
      if (icon) icon.textContent = 'visibility_off';
    } else {
      adminPasswordInput.type = 'password';
      if (icon) icon.textContent = 'visibility';
    }
  });

  // Helper: Show/hide the inline error message on the login form
  function setLoginError(message) {
    const errorBox = document.getElementById('admin-login-error');
    const errorMsg = document.getElementById('admin-login-error-msg');
    if (!errorBox) return;
    if (message) {
      errorMsg.textContent = message;
      errorBox.classList.remove('hidden');
      errorBox.classList.add('flex');
    } else {
      errorBox.classList.add('hidden');
      errorBox.classList.remove('flex');
    }
  }

  // Helper: Set login button loading state
  function setLoginLoading(isLoading) {
    const btn = document.getElementById('admin-login-submit');
    const btnText = document.getElementById('admin-login-btn-text');
    const icon = btn?.querySelector('.material-symbols-outlined');
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
      if (btnText) btnText.textContent = 'Verifying...';
      if (icon) icon.textContent = 'hourglass_top';
    } else {
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      if (btnText) btnText.textContent = 'Access Owner Portal';
      if (icon) icon.textContent = 'verified_user';
    }
  }

  // ─── ADMIN LOGIN FORM SUBMIT ──────────────────────────────────────────────
  // Sends { email, password } to POST /api/admin/login
  // On success: stores JWT in sessionStorage, shows dashboard
  // On failure: shows inline error + shake animation
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminEmailInput = document.getElementById('admin-email');

  adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = adminEmailInput?.value?.trim();
    const password = adminPasswordInput?.value;

    // Clear any previous error
    setLoginError('');

    // Basic client-side validation
    if (!email || !password) {
      setLoginError('Please enter both your email and password.');
      return;
    }

    // Show loading state
    setLoginLoading(true);

    let loginSuccess = false;

    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // ✅ Login successful
        sessionStorage.setItem('admin_token', data.token);
        showToast('Portal Access Granted! ✨', 'success');

        // Clear sensitive fields
        if (adminEmailInput) adminEmailInput.value = '';
        if (adminPasswordInput) adminPasswordInput.value = '';
        setLoginError('');
        loginSuccess = true;
      } else {
        // ❌ Login failed — show specific server error message or generic invalid credentials
        const errorMsg = data.error || data.message || (res.status === 401 ? 'Invalid email or password. Please try again.' : 'Authentication failed. Please try again.');
        setLoginError(errorMsg);

        // Shake the login card
        const card = adminLoginForm.closest('.modal-content');
        card?.classList.add('error-shake');
        setTimeout(() => card?.classList.remove('error-shake'), 500);

        if (adminPasswordInput) adminPasswordInput.value = '';
      }
    } catch (err) {
      console.error('❌ Login network request failed:', err);
      setLoginError(err.message || 'Cannot connect to server. Please check your network connection.');
    } finally {
      setLoginLoading(false);
    }

    // Execute post-login routing and UI rendering outside the login fetch catch block
    if (loginSuccess) {
      try {
        await handleRouting();
        await renderCatalog();
      } catch (postLoginErr) {
        console.error('❌ Error rendering admin dashboard post-login:', postLoginErr);
      }
    }
  });

  // ─── FETCH ADMIN PROFILE ──────────────────────────────────────────────────
  // Calls GET /api/admin/profile to get the logged-in admin's email
  // Displays it in the dashboard sidebar (#admin-email-display)
  async function fetchAdminProfile() {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    try {
      const res = await fetch(getApiUrl('/api/admin/profile'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const profile = await res.json();
        const emailDisplay = document.getElementById('admin-email-display');
        if (emailDisplay && profile.email) {
          // Show a masked version: e.g. "explo***@gmail.com"
          const parts = profile.email.split('@');
          const maskedName = parts[0].substring(0, 5) + '***';
          emailDisplay.textContent = `${maskedName}@${parts[1]}`;
          emailDisplay.title = profile.email; // Full email on hover (title attr)
        }
      }
    } catch (err) {
      // Silently fail — profile display is cosmetic
      console.warn('Could not fetch admin profile:', err.message);
    }
  }

  // ─── ADMIN LOGOUT ─────────────────────────────────────────────────────────
  // Calls POST /api/admin/logout (server acknowledges)
  // Then clears local session storage and redirects to homepage
  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  adminLogoutBtn?.addEventListener('click', async () => {
    const token = sessionStorage.getItem('admin_token');

    // Notify server (optional but clean — ready for future token blacklisting)
    if (token) {
      try {
        await fetch(getApiUrl('/api/admin/logout'), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (_) {
        // Ignore server errors during logout — still clear local session
      }
    }

    // Clear JWT from browser session
    sessionStorage.removeItem('admin_token');
    showToast('Securely Logged Out! 🌸', 'success');

    // Redirect to homepage after a brief toast display
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  });

  // --- ADMIN DASHBOARD TAB SYSTEM ---
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(c => {
        if (c.id === `tab-${activeTab}`) {
          c.classList.remove('hidden');
        } else {
          c.classList.add('hidden');
        }
      });
    });
  });

  // --- RENDER ADMIN DASHBOARD DATA ---
  let adminProductsList = [];

  // Local Search, Filter, and Sort Handlers
  const adminSearchInput = document.getElementById('admin-search-products');
  const adminFilterCategory = document.getElementById('admin-filter-category');
  const adminSortBy = document.getElementById('admin-sort-by');

  if (adminSearchInput) adminSearchInput.addEventListener('input', filterAndRenderAdminProducts);
  if (adminFilterCategory) adminFilterCategory.addEventListener('change', filterAndRenderAdminProducts);
  if (adminSortBy) adminSortBy.addEventListener('change', filterAndRenderAdminProducts);

  function filterAndRenderAdminProducts() {
    if (!adminProductsList.length) {
      renderAdminProductsTable([]);
      return;
    }
    
    let filtered = [...adminProductsList];
    
    // Search
    const searchVal = adminSearchInput?.value.trim().toLowerCase() || '';
    if (searchVal) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchVal) || 
        (p.desc || '').toLowerCase().includes(searchVal) || 
        (p.badge || '').toLowerCase().includes(searchVal)
      );
    }
    
    // Category Filter
    const catVal = adminFilterCategory?.value || 'all';
    if (catVal !== 'all') {
      filtered = filtered.filter(p => (p.badge || '').toLowerCase() === catVal.toLowerCase());
    }
    
    // Sort
    const sortVal = adminSortBy?.value || 'newest';
    if (sortVal === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'views') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sortVal === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortVal === 'price-low') {
      filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortVal === 'price-high') {
      filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }
    
    renderAdminProductsTable(filtered);
  }

  function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[^0-9]/g, '');
    return clean ? parseInt(clean, 10) : 0;
  }

  function renderAdminProductsTable(products) {
    const productsTableBody = document.getElementById('admin-products-table-body');
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '';
    
    const token = sessionStorage.getItem('admin_token');
    
    if (products.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-primary/60 italic">No products found matching filters.</td>
        </tr>
      `;
      return;
    }
    
    products.forEach(p => {
      const pId = p._id || p.id;
      const row = document.createElement('tr');
      row.className = 'border-b border-primary/5 hover:bg-beige/10 transition';
      
      const featuredIcon = p.featured ? 'star' : 'star_outline';
      const featuredClass = p.featured ? 'text-yellow-500 font-semibold' : 'text-primary/45';
      
      const visibleIcon = p.isVisible !== false ? 'visibility' : 'visibility_off';
      const visibleClass = p.isVisible !== false ? 'text-primary' : 'text-primary/35';
      
      row.innerHTML = `
        <td class="p-4 pl-6 font-semibold text-darkbrown">
          <div class="flex items-center gap-3">
            <img alt="${p.name}" class="w-10 h-10 object-cover rounded-xl border border-primary/10">
            <div class="flex flex-col">
              <span class="font-bold">${p.name}</span>
              ${p.instagramLink ? `<a href="${p.instagramLink}" target="_blank" class="text-[10px] text-primary/60 hover:underline flex items-center gap-0.5 mt-0.5">📸 Insta Link <span class="material-symbols-outlined text-[8px]">open_in_new</span></a>` : ''}
            </div>
          </div>
        </td>
        <td class="p-4 text-primary font-medium">${p.badge}</td>
        <td class="p-4 font-bold text-darkbrown">${formatPrice(p.price)}</td>
        <td class="p-4 text-xs text-primary/70">${p.label || '<span class="text-primary/30">N/A</span>'}</td>
        <td class="p-4 text-xs text-primary/80 font-bold text-center">${p.viewCount || 0}</td>
        <td class="p-4 text-center">
          <button class="toggle-featured-btn p-1.5 rounded-full hover:bg-primary-container/30 transition clickable" data-id="${pId}" title="Toggle Featured">
            <span class="material-symbols-outlined ${featuredClass} text-xl">${featuredIcon}</span>
          </button>
        </td>
        <td class="p-4 text-center">
          <button class="toggle-visible-btn p-1.5 rounded-full hover:bg-primary-container/30 transition clickable" data-id="${pId}" title="Toggle Visibility">
            <span class="material-symbols-outlined ${visibleClass} text-xl">${visibleIcon}</span>
          </button>
        </td>
        <td class="p-4 pr-6 text-right">
          <div class="flex justify-end gap-1">
            <button class="row-edit-btn p-2 rounded-xl text-primary hover:bg-primary-container/40 transition clickable" title="Edit details" data-id="${pId}">
              <span class="material-symbols-outlined text-lg">edit</span>
            </button>
            <button class="row-delete-btn p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition clickable" title="Delete product" data-id="${pId}">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </td>
      `;

      const rowImgEl = row.querySelector('img');
      if (rowImgEl) {
        safeLoadProductImage(rowImgEl, resolveProductPrimaryImage(p), p);
      }
      
      row.querySelector('.toggle-featured-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await BackendAPI.toggleFeatured(token, pId);
          showToast(`Featured status toggled! ⭐`, 'success');
          await renderAdminDashboard();
          await renderCatalog();
        } catch (err) {
          showToast('Failed to toggle featured status! ⚠️', 'error');
        }
      });
      
      row.querySelector('.toggle-visible-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await BackendAPI.toggleVisibility(token, pId);
          showToast(`Visibility toggled! 👁`, 'success');
          await renderAdminDashboard();
          await renderCatalog();
        } catch (err) {
          showToast('Failed to toggle visibility! ⚠️', 'error');
        }
      });
      
      row.querySelector('.row-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditProductModal(p);
      });
      
      row.querySelector('.row-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteProduct(pId, p.name);
      });
      
      productsTableBody.appendChild(row);
    });
  }

  // ─── Render Admin Dashboard ─────────────────────────────────────────────────
  async function renderAdminDashboard() {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    await fetchAdminProfile();

    try {
      const stats = await BackendAPI.getProductStats(token);
      const products = await BackendAPI.getAllProducts(token);
      const orders = await BackendAPI.getCustomOrders(token);

      adminProductsList = products;

      // Update overview counters
      document.getElementById('stat-products-count').textContent = stats.total || 0;
      document.getElementById('stat-orders-count').textContent = orders.length;

      // Update products stats row
      document.getElementById('prod-stat-total').textContent = stats.total || 0;
      document.getElementById('prod-stat-featured').textContent = stats.featured || 0;
      document.getElementById('prod-stat-visible').textContent = stats.visible || 0;
      document.getElementById('prod-stat-hidden').textContent = stats.hidden || 0;
      document.getElementById('prod-stat-views').textContent = stats.totalViews || 0;

      filterAndRenderAdminProducts();

      // ── Orders: Fetch analytics stats ────────────────────────────────────────
      try {
        const orderStats = await BackendAPI.getCustomOrderStats(token);
        animateCounter('o-stat-total', orderStats.total || 0);
        animateCounter('o-stat-new', orderStats.statusCounts?.New || 0);
        animateCounter('o-stat-contacted', orderStats.statusCounts?.Contacted || 0);
        animateCounter('o-stat-accepted', orderStats.statusCounts?.Accepted || 0);
        animateCounter('o-stat-completed', orderStats.statusCounts?.Completed || 0);
        animateCounter('o-stat-month', orderStats.thisMonthCount || 0);
        const occasionEl = document.getElementById('o-stat-occasion');
        if (occasionEl) occasionEl.textContent = orderStats.mostRequestedOccasion || '—';
      } catch (e) {
        console.warn('Could not load order stats:', e.message);
      }

      // ── Render order inquiry cards ──────────────────────────────────────────
      renderAdminOrderCards(orders, token);

      // ── Homepage settings ─────────────────────────────────────────────────
      const settings = await BackendAPI.getHomepageSettings();
      const heroTitleInput = document.getElementById('settings-hero-title');
      const sub1Input = document.getElementById('settings-subtitle-line1');
      const sub2Input = document.getElementById('settings-subtitle-line2');
      if (heroTitleInput) heroTitleInput.value = settings.heroTitle || '';
      if (sub1Input) sub1Input.value = settings.heroSubtitleLine1 || '';
      if (sub2Input) sub2Input.value = settings.heroSubtitleLine2 || '';
      
      const formPreview = document.getElementById('settings-hero-image-preview');
      const formPlaceholder = document.getElementById('settings-img-placeholder');
      if (settings.heroImage && formPreview) {
        formPreview.src = typeof settings.heroImage === 'object' && settings.heroImage.url ? settings.heroImage.url : settings.heroImage;
        formPreview.classList.remove('hidden');
        if (formPlaceholder) formPlaceholder.style.display = 'none';
      }

      // Load admin reviews counts and stats
      await loadAdminReviewsDashboard();

    } catch (e) {
      console.error('Error rendering admin dashboard:', e);
      showToast('Error displaying dashboard data! ⚠️', 'error');
    }
  }

  // ─── GSAP Animated Counter ────────────────────────────────────────────────
  function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: targetValue,
      duration: 1.2,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.val); }
    });
  }

  // --- ACTIONS INTERFACES ---
  let editingProductId = null;
  let uploadedImages = []; // In-memory array of base64 strings or existing URLs
  let coverImageIndex = 0; // Index of the cover image

  const uploadModal        = document.getElementById('upload-product-modal');
  const uploadInput        = document.getElementById('upload-photo-input');
  const adminImagePreviews = document.getElementById('admin-image-previews');
  const uploadPlaceholder  = document.getElementById('upload-placeholder');
  const uploadDropZone     = document.getElementById('upload-drop-zone');
  const uploadSubmitBtn    = document.getElementById('upload-submit-btn');
  
  const uploadNameInput  = document.getElementById('upload-name');
  const uploadPriceInput = document.getElementById('upload-price');
  const uploadDescInput  = document.getElementById('upload-desc');
  const uploadBadgeInput = document.getElementById('upload-badge');
  const uploadLabelInput = document.getElementById('upload-label');
  const uploadStockInput = document.getElementById('upload-stock');
  const uploadMrpInput   = document.getElementById('upload-mrp');
  const uploadShowDiscountInput = document.getElementById('upload-show-discount');

  function validateDiscountFields() {
    if (!uploadPriceInput || !uploadMrpInput || !uploadShowDiscountInput) return;

    const priceRaw = uploadPriceInput.value || '';
    const mrpRaw = uploadMrpInput.value || '';

    // Clean price (e.g. ₹250 -> 250)
    const cleanedPrice = priceRaw.replace(/[^\d.]/g, '');
    const priceNum = Number(cleanedPrice);

    const helperText = document.getElementById('mrp-helper-text');

    if (mrpRaw.trim() === '') {
      // MRP is empty: Disable and uncheck show discount
      uploadShowDiscountInput.disabled = true;
      uploadShowDiscountInput.checked = false;
      if (helperText) {
        helperText.textContent = 'Leave empty to display only the selling price.';
        helperText.className = 'text-xs text-primary/60 mt-1';
      }
      return;
    }

    const mrpNum = Number(mrpRaw);
    if (isNaN(mrpNum) || mrpNum < 0) {
      uploadShowDiscountInput.disabled = true;
      uploadShowDiscountInput.checked = false;
      if (helperText) {
        helperText.textContent = 'MRP must be a non-negative number.';
        helperText.className = 'text-xs text-primary/60 mt-1';
      }
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      uploadShowDiscountInput.disabled = true;
      uploadShowDiscountInput.checked = false;
      if (helperText) {
        helperText.textContent = 'Enter a valid selling price first.';
        helperText.className = 'text-xs text-primary/60 mt-1';
      }
      return;
    }

    if (mrpNum <= priceNum) {
      uploadShowDiscountInput.disabled = true;
      uploadShowDiscountInput.checked = false;
      if (helperText) {
        helperText.textContent = 'MRP must be greater than the selling price to enable discounts.';
        helperText.className = 'text-xs text-primary font-medium mt-1';
      }
    } else {
      uploadShowDiscountInput.disabled = false;
      if (helperText) {
        helperText.textContent = 'Leave empty to display only the selling price.';
        helperText.className = 'text-xs text-primary/60 mt-1';
      }
    }
  }

  // Bind input listeners
  uploadPriceInput?.addEventListener('input', validateDiscountFields);
  uploadMrpInput?.addEventListener('input', validateDiscountFields);

  function openUploadModal() {
    if (!uploadModal) return;
    uploadModal.classList.remove('hidden');
    setTimeout(() => uploadModal.classList.add('active'), 50);
  }

  function closeUploadModal() {
    if (!uploadModal) return;
    uploadModal.classList.remove('active');
    setTimeout(() => uploadModal.classList.add('hidden'), 400);
    resetUploadForm();
  }

  function resetUploadForm() {
    editingProductId = null;
    uploadedImages = [];
    coverImageIndex = 0;
    if (uploadInput) uploadInput.value = '';
    renderUploadedPreviews();
    if (uploadNameInput)   uploadNameInput.value = '';
    if (uploadPriceInput)  uploadPriceInput.value = '';
    if (uploadDescInput)   uploadDescInput.value = '';
    if (uploadBadgeInput)  uploadBadgeInput.value = '';
    if (uploadLabelInput)  uploadLabelInput.value = '';
    if (uploadStockInput)  uploadStockInput.value = '10';
    if (uploadMrpInput)    uploadMrpInput.value = '';
    if (uploadShowDiscountInput) {
      uploadShowDiscountInput.checked = false;
      uploadShowDiscountInput.disabled = true;
    }
    const helperText = document.getElementById('mrp-helper-text');
    if (helperText) {
      helperText.textContent = 'Leave empty to display only the selling price.';
      helperText.className = 'text-xs text-primary/60 mt-1';
    }
    
    const featuredInput = document.getElementById('upload-featured');
    if (featuredInput) featuredInput.checked = false;

    const visibleInput = document.getElementById('upload-visible');
    if (visibleInput) visibleInput.checked = true;

    const instagramInput = document.getElementById('upload-instagram');
    if (instagramInput) instagramInput.value = '';

    document.querySelectorAll('.badge-preset').forEach(b => b.classList.remove('selected'));
    
    const modalTitle = uploadModal?.querySelector('.modal-content h3');
    if (modalTitle) modalTitle.textContent = 'Add New Product';
  }

  function renderUploadedPreviews() {
    if (!adminImagePreviews) return;
    adminImagePreviews.innerHTML = '';

    if (uploadedImages.length === 0) {
      adminImagePreviews.innerHTML = `
        <div class="col-span-3 text-center py-6 text-primary/40 text-xs italic">
          No images uploaded yet.
        </div>
      `;
      return;
    }

    uploadedImages.forEach((imgSrc, index) => {
      const isCover = index === coverImageIndex;
      const previewCard = document.createElement('div');
      previewCard.className = `relative rounded-xl overflow-hidden aspect-square border-2 ${isCover ? 'border-primary shadow-md' : 'border-primary/20'} bg-beige/10 group flex flex-col items-center justify-center`;

      previewCard.innerHTML = `
        <img src="${imgSrc}" class="w-full h-full object-contain bg-beige/30">
        
        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2 text-white z-20">
          <div class="flex justify-between items-center w-full">
            <!-- Cover status -->
            <button type="button" class="cover-toggle-btn text-[10px] font-bold px-2 py-0.5 rounded-full ${isCover ? 'bg-primary text-white' : 'bg-white/25 hover:bg-white/45'} transition clickable" title="Set as Cover">
              ${isCover ? '⭐ Cover' : 'Make Cover'}
            </button>
            <!-- Delete button -->
            <button type="button" class="delete-img-btn w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition clickable" title="Remove Image">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
          
          <!-- Reordering controls -->
          <div class="flex justify-center gap-2 w-full">
            <button type="button" class="move-left-btn w-7 h-7 rounded-full bg-white/25 hover:bg-white/45 flex items-center justify-center transition clickable" ${index === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Move Left">
              <span class="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <button type="button" class="move-right-btn w-7 h-7 rounded-full bg-white/25 hover:bg-white/45 flex items-center justify-center transition clickable" ${index === uploadedImages.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Move Right">
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      `;

      // Event Listeners
      previewCard.querySelector('.cover-toggle-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        coverImageIndex = index;
        renderUploadedPreviews();
      });

      previewCard.querySelector('.delete-img-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        uploadedImages.splice(index, 1);
        if (coverImageIndex >= uploadedImages.length) {
          coverImageIndex = Math.max(0, uploadedImages.length - 1);
        }
        renderUploadedPreviews();
      });

      if (index > 0) {
        previewCard.querySelector('.move-left-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = uploadedImages[index];
          uploadedImages[index] = uploadedImages[index - 1];
          uploadedImages[index - 1] = temp;
          
          if (coverImageIndex === index) coverImageIndex = index - 1;
          else if (coverImageIndex === index - 1) coverImageIndex = index;
          
          renderUploadedPreviews();
        });
      }

      if (index < uploadedImages.length - 1) {
        previewCard.querySelector('.move-right-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const temp = uploadedImages[index];
          uploadedImages[index] = uploadedImages[index + 1];
          uploadedImages[index + 1] = temp;
          
          if (coverImageIndex === index) coverImageIndex = index + 1;
          else if (coverImageIndex === index + 1) coverImageIndex = index;
          
          renderUploadedPreviews();
        });
      }

      adminImagePreviews.appendChild(previewCard);
    });
  }

  function openAddProductModal() {
    resetUploadForm();
    openUploadModal();
  }

  function openEditProductModal(p) {
    resetUploadForm();
    editingProductId = p._id || p.id;
    
    if (uploadNameInput)   uploadNameInput.value = p.name;
    if (uploadPriceInput)  uploadPriceInput.value = p.price;
    if (uploadDescInput)   uploadDescInput.value = p.desc;
    if (uploadBadgeInput)  uploadBadgeInput.value = p.badge;
    if (uploadLabelInput)  uploadLabelInput.value = p.label || '';
    if (uploadStockInput)  uploadStockInput.value = (p.stock !== undefined && p.stock !== null) ? p.stock : 10;
    
    const featuredInput = document.getElementById('upload-featured');
    if (featuredInput) featuredInput.checked = !!p.featured;

    const visibleInput = document.getElementById('upload-visible');
    if (visibleInput) visibleInput.checked = p.isVisible !== false;

    const instagramInput = document.getElementById('upload-instagram');
    if (instagramInput) instagramInput.value = p.instagramLink || '';
    
    if (uploadMrpInput) uploadMrpInput.value = (p.mrp !== undefined && p.mrp !== null) ? p.mrp : '';
    if (uploadShowDiscountInput) uploadShowDiscountInput.checked = !!p.showDiscount;
    validateDiscountFields();

    document.querySelectorAll('.badge-preset').forEach(btn => {
      if (btn.getAttribute('data-badge') === p.badge) {
        btn.classList.add('selected');
      }
    });

    const gallery = resolveProductGalleryImages(p);
    uploadedImages = [...gallery];
    const coverUrl = resolveProductPrimaryImage(p);
    const foundIdx = uploadedImages.indexOf(coverUrl);
    coverImageIndex = foundIdx !== -1 ? foundIdx : 0;
    
    renderUploadedPreviews();

    const modalTitle = uploadModal?.querySelector('.modal-content h3');
    if (modalTitle) modalTitle.textContent = 'Edit Product Details';

    openUploadModal();
  }

  function handleAdminError(e, fallbackMessage) {
    console.error(e);
    const msg = e.message || fallbackMessage;
    showToast(msg, 'error');
    if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('auth')) {
      sessionStorage.removeItem('admin_token');
      showToast('Session expired. Redirecting to login... 🔒', 'error');
      setTimeout(() => {
        window.location.hash = '#/admin-login';
        window.location.reload();
      }, 1500);
    }
  }

  async function handleDeleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    try {
      await BackendAPI.deleteProduct(token, id);
      showToast('Product successfully deleted! 🌸', 'success');
      await renderCatalog();
      await renderAdminDashboard();
    } catch (e) {
      handleAdminError(e, 'Action forbidden! ⚠️');
    }
  }

  // ─── STATUS BADGE HELPER ─────────────────────────────────────────────────
  function getStatusBadge(status) {
    const map = {
      'New':       { emoji: '🟡', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      'Contacted': { emoji: '🔵', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
      'Accepted':  { emoji: '🟣', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
      'Making':    { emoji: '🧶', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
      'Ready':     { emoji: '📦', cls: 'bg-teal-100 text-teal-700 border-teal-200' },
      'Completed': { emoji: '✅', cls: 'bg-green-100 text-green-700 border-green-200' }
    };
    const s = map[status] || map['New'];
    return `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${s.cls}">${s.emoji} ${status}</span>`;
  }

  // ─── RENDER ADMIN ORDER CARDS (Premium Card Layout) ──────────────────────
  function renderAdminOrderCards(orders, token) {
    const grid = document.getElementById('admin-orders-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!orders || orders.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full glass-card p-12 rounded-3xl text-center space-y-3 border border-primary/10">
          <div class="text-5xl">📭</div>
          <h3 class="font-heading font-bold text-xl text-darkbrown">No inquiries yet</h3>
          <p class="text-sm text-primary/60">When customers submit their crochet inspiration, they will appear here.</p>
        </div>`;
      return;
    }

    orders.forEach(order => {
      const oId = order.id || order._id;
      const firstImage = order.referenceImages && order.referenceImages.length > 0 ? order.referenceImages[0] : null;
      const imgCount = (order.referenceImages || []).length;
      const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'glass-card rounded-3xl overflow-hidden border border-primary/10 flex flex-col hover:shadow-xl transition-shadow duration-300';
      card.innerHTML = `
        <!-- Image Preview Banner -->
        <div class="relative h-36 bg-gradient-to-br from-primary-container/40 via-secondary/20 to-beige overflow-hidden">
          ${firstImage
            ? `<img src="${firstImage}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<div class=\'w-full h-full flex items-center justify-center text-4xl\'>🧶</div>'">` 
            : `<div class="w-full h-full flex items-center justify-center text-4xl">🧶</div>`
          }
          ${imgCount > 1 ? `<span class="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-black/40 text-white rounded-full backdrop-blur-sm">+${imgCount - 1} more</span>` : ''}
          <div class="absolute top-2 left-2">${getStatusBadge(order.status)}</div>
          ${imgCount > 0 ? `<button class="card-open-images-btn absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition clickable" title="View all images" data-id="${oId}">
            <span class="material-symbols-outlined text-sm text-darkbrown">photo_library</span>
          </button>` : ''}
        </div>

        <!-- Card Body -->
        <div class="p-4 flex flex-col flex-1 gap-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h3 class="font-bold text-darkbrown text-base leading-tight">${order.customerName}</h3>
              <span class="text-[10px] text-primary/50">${formattedDate}</span>
            </div>
            <span class="px-2 py-0.5 text-[10px] rounded-full bg-primary-container text-on-primary-container font-semibold shrink-0">${order.occasion || '—'}</span>
          </div>

          <!-- Contact Row -->
          <div class="flex flex-col gap-1 text-xs text-primary/70">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">phone</span>${order.phone}</span>
            ${order.instagramUsername ? `<span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">photo_camera</span>${order.instagramUsername}</span>` : ''}
          </div>

          <!-- Status Selector -->
          <select class="order-status-select w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/20 bg-white/60 text-darkbrown focus:outline-none focus:ring-2 focus:ring-primary/25 transition clickable" data-id="${oId}">
            <option value="New" ${order.status === 'New' ? 'selected' : ''}>🟡 New</option>
            <option value="Contacted" ${order.status === 'Contacted' ? 'selected' : ''}>🔵 Contacted</option>
            <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>🟣 Accepted</option>
            <option value="Making" ${order.status === 'Making' ? 'selected' : ''}>🧶 Making</option>
            <option value="Ready" ${order.status === 'Ready' ? 'selected' : ''}>📦 Ready</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
          </select>

          <!-- Action Buttons -->
          <div class="grid grid-cols-3 gap-1.5 mt-auto pt-2 border-t border-primary/5">
            <button class="card-view-details-btn flex flex-col items-center gap-1 p-2 rounded-xl border border-primary/10 hover:bg-primary-container/20 transition clickable text-center" data-id="${oId}">
              <span class="material-symbols-outlined text-sm text-primary">info</span>
              <span class="text-[9px] font-bold text-darkbrown">Details</span>
            </button>
            <a href="tel:${order.phone}" class="flex flex-col items-center gap-1 p-2 rounded-xl border border-primary/10 hover:bg-primary-container/20 transition clickable text-center">
              <span class="material-symbols-outlined text-sm text-primary">phone</span>
              <span class="text-[9px] font-bold text-darkbrown">Call</span>
            </a>
            <button class="card-copy-email-btn flex flex-col items-center gap-1 p-2 rounded-xl border border-primary/10 hover:bg-primary-container/20 transition clickable text-center" data-email="${order.email}">
              <span class="material-symbols-outlined text-sm text-primary">content_copy</span>
              <span class="text-[9px] font-bold text-darkbrown">Email</span>
            </button>
            ${order.instagramUsername ? `
            <a href="https://instagram.com/${order.instagramUsername.replace('@','').trim()}" target="_blank" class="flex flex-col items-center gap-1 p-2 rounded-xl border border-pink-100 hover:bg-pink-50 transition clickable text-center">
              <span class="text-sm">📸</span>
              <span class="text-[9px] font-bold text-darkbrown">Instagram</span>
            </a>` : ''}
            <a href="https://wa.me/${order.phone.replace(/[^0-9]/g,'')}" target="_blank" class="flex flex-col items-center gap-1 p-2 rounded-xl border border-green-100 hover:bg-green-50 transition clickable text-center">
              <span class="text-sm">💬</span>
              <span class="text-[9px] font-bold text-darkbrown">WhatsApp</span>
            </a>
            <button class="card-delete-btn flex flex-col items-center gap-1 p-2 rounded-xl border border-red-100 hover:bg-red-50 transition clickable text-center" data-id="${oId}" data-name="${order.customerName}">
              <span class="material-symbols-outlined text-sm text-red-500">delete</span>
              <span class="text-[9px] font-bold text-red-600">Delete</span>
            </button>
          </div>
        </div>`;

      // Bind Status Change
      card.querySelector('.order-status-select').addEventListener('change', async (e) => {
        await handleUpdateOrderStatus(oId, e.target.value);
        // Update badge without full reload
        const badge = card.querySelector('.absolute.top-2.left-2');
        if (badge) badge.innerHTML = getStatusBadge(e.target.value);
      });

      // Bind View Details
      card.querySelector('.card-view-details-btn').addEventListener('click', () => {
        openOrderDetailsModal(order, token);
      });

      // Bind Copy Email
      card.querySelector('.card-copy-email-btn').addEventListener('click', (e) => {
        const email = e.currentTarget.getAttribute('data-email');
        navigator.clipboard.writeText(email).then(() => {
          showToast(`Email copied: ${email} 📧`, 'success');
        });
      });

      // Bind Open Images
      const openImagesBtn = card.querySelector('.card-open-images-btn');
      if (openImagesBtn && order.referenceImages && order.referenceImages.length > 0) {
        openImagesBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openGallery(order.referenceImages, 0, `${order.customerName}'s Reference Images`);
        });
      }

      // Bind Delete
      card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
        const name = e.currentTarget.getAttribute('data-name');
        handleDeleteOrder(oId, name);
      });

      grid.appendChild(card);
    });
  }

  // Refresh button
  document.getElementById('admin-refresh-orders-btn')?.addEventListener('click', async () => {
    await renderAdminDashboard();
    showToast('Inquiries refreshed! 🌸', 'success');
  });

  // ─── ORDER DETAILS MODAL ─────────────────────────────────────────────────
  let currentOpenOrderId = null;

  function openOrderDetailsModal(order, token) {
    currentOpenOrderId = order.id || order._id;
    const modal = document.getElementById('order-details-modal');
    if (!modal) return;

    // Populate fields
    const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('odm-date').textContent = `Submitted: ${dateStr}`;
    document.getElementById('odm-name').textContent = order.customerName;
    document.getElementById('odm-email').textContent = order.email;
    document.getElementById('odm-email-link').href = `mailto:${order.email}`;
    document.getElementById('odm-phone').textContent = order.phone;
    document.getElementById('odm-phone-link').href = `tel:${order.phone}`;
    document.getElementById('odm-occasion').textContent = order.occasion || '—';
    document.getElementById('odm-message').textContent = order.message || '—';
    document.getElementById('odm-img-count').textContent = (order.referenceImages || []).length;
    document.getElementById('odm-status').outerHTML = `<span id="odm-status" class="px-2 py-0.5 rounded-full text-xs font-bold">${getStatusBadge(order.status)}</span>`;

    // Instagram
    const igLink = document.getElementById('odm-instagram-link');
    const igSpan = document.getElementById('odm-instagram');
    if (order.instagramUsername) {
      igSpan.textContent = order.instagramUsername;
      igLink.href = `https://instagram.com/${order.instagramUsername.replace('@','').trim()}`;
      igLink.style.display = '';
    } else {
      igSpan.textContent = 'Not provided';
      igLink.style.display = 'none';
    }

    // Images grid
    const imagesGrid = document.getElementById('odm-images-grid');
    if (imagesGrid) {
      imagesGrid.innerHTML = '';
      if (order.referenceImages && order.referenceImages.length > 0) {
        order.referenceImages.forEach((imgSrc, idx) => {
          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = `Reference ${idx + 1}`;
          img.className = 'w-full aspect-square object-cover rounded-xl cursor-pointer border border-primary/10 hover:scale-105 transition-transform duration-200';
          img.addEventListener('click', () => openGallery(order.referenceImages, idx, `${order.customerName}'s Reference`));
          imagesGrid.appendChild(img);
        });
      } else {
        imagesGrid.innerHTML = `<p class="text-sm text-primary/40 italic col-span-3">No reference images uploaded.</p>`;
      }
    }

    // Quick action buttons
    document.getElementById('odm-insta-btn').href = order.instagramUsername
      ? `https://instagram.com/${order.instagramUsername.replace('@','').trim()}`
      : 'https://instagram.com/dreamycrochet05/';
    document.getElementById('odm-call-btn').href = `tel:${order.phone}`;

    document.getElementById('odm-copy-email-btn').onclick = () => {
      navigator.clipboard.writeText(order.email).then(() => showToast(`Email copied! 📧`, 'success'));
    };

    document.getElementById('odm-complete-btn').onclick = async () => {
      await handleUpdateOrderStatus(currentOpenOrderId, 'Completed');
      closeOrderDetailsModal();
      await renderAdminDashboard();
    };

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 50);
  }

  function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 400);
    currentOpenOrderId = null;
  }

  document.getElementById('close-order-details-modal')?.addEventListener('click', closeOrderDetailsModal);
  document.getElementById('order-details-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('order-details-modal')) closeOrderDetailsModal();
  });

  async function handleUpdateOrderStatus(id, status) {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;
    try {
      await BackendAPI.updateCustomOrderStatus(token, id, status);
      showToast(`Status updated to ${status}! ✨`, 'success');
    } catch (e) {
      handleAdminError(e, 'Failed to update status! ⚠️');
    }
  }

  async function handleDeleteOrder(id, name) {
    if (!confirm(`Delete inquiry from "${name}"? This will also remove their uploaded images.`)) return;
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;
    try {
      await BackendAPI.deleteCustomOrder(token, id);
      showToast('Inquiry deleted! 🌸', 'success');
      await renderAdminDashboard();
    } catch (e) {
      handleAdminError(e, 'Action forbidden! ⚠️');
    }
  }

  const adminHomepageForm = document.getElementById('admin-homepage-form');
  adminHomepageForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    const data = {
      heroTitle: document.getElementById('settings-hero-title').value.trim(),
      heroSubtitleLine1: document.getElementById('settings-subtitle-line1').value.trim(),
      heroSubtitleLine2: document.getElementById('settings-subtitle-line2').value.trim(),
      heroImage: document.getElementById('settings-hero-image-preview').src
    };

    try {
      await BackendAPI.updateHomepageSettings(token, data);
      showToast('Homepage contents saved! 🌸', 'success');
      await applyHomepageSettings();
      await renderAdminDashboard();
    } catch (err) {
      handleAdminError(err, 'Action forbidden! ⚠️');
    }
  });

  const settingsHeroImageInput = document.getElementById('settings-hero-image-input');
  const settingsImageDropzone = document.getElementById('settings-image-dropzone');
  const settingsHeroImagePreview = document.getElementById('settings-hero-image-preview');
  const settingsImgPlaceholder = document.getElementById('settings-img-placeholder');

  settingsHeroImageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (settingsHeroImagePreview) {
          settingsHeroImagePreview.src = ev.target.result;
          settingsHeroImagePreview.classList.remove('hidden');
          if (settingsImgPlaceholder) settingsImgPlaceholder.style.display = 'none';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  settingsImageDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    settingsImageDropzone.classList.add('drag-over');
  });
  settingsImageDropzone?.addEventListener('dragleave', () => settingsImageDropzone.classList.remove('drag-over'));
  settingsImageDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    settingsImageDropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (settingsHeroImagePreview) {
          settingsHeroImagePreview.src = ev.target.result;
          settingsHeroImagePreview.classList.remove('hidden');
          if (settingsImgPlaceholder) settingsImgPlaceholder.style.display = 'none';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('admin-add-product-btn')?.addEventListener('click', openAddProductModal);

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    let loadedCount = 0;
    const allowedFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const totalFiles = Math.min(allowedFiles.length, 100 - uploadedImages.length);
    
    if (totalFiles === 0) return;

    for (let i = 0; i < totalFiles; i++) {
      const file = allowedFiles[i];
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedImages.push(ev.target.result);
        loadedCount++;
        if (loadedCount === totalFiles) {
          renderUploadedPreviews();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  uploadInput?.addEventListener('change', (e) => handleFiles(e.target.files));

  uploadDropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropZone.classList.add('drag-over');
  });
  uploadDropZone?.addEventListener('dragleave', () => uploadDropZone.classList.remove('drag-over'));
  uploadDropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  document.querySelectorAll('.badge-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.badge-preset').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (uploadBadgeInput) uploadBadgeInput.value = btn.getAttribute('data-badge');
    });
  });

  uploadSubmitBtn?.addEventListener('click', async () => {
    const name = uploadNameInput?.value.trim();
    if (!name) { showToast('Please enter a product name! 🌸', 'error'); return; }
    if (uploadedImages.length === 0) { showToast('Please upload at least one photo! 📸', 'error'); return; }

    const token = sessionStorage.getItem('admin_token');
    if (!token) { showToast('Portal session expired! ⚠️', 'error'); return; }

    const data = {
      title: name,
      imagesBase64: uploadedImages,
      coverImageIndex: coverImageIndex,
      price: uploadPriceInput?.value.trim() || 'Ask Us',
      description: uploadDescInput?.value.trim() || '',
      category: uploadBadgeInput?.value.trim() || 'New',
      label: uploadLabelInput?.value.trim() || '',
      stock: parseInt(uploadStockInput?.value, 10) >= 0 ? parseInt(uploadStockInput?.value, 10) : 10,
      featured: document.getElementById('upload-featured')?.checked || false,
      isVisible: document.getElementById('upload-visible')?.checked !== false,
      instagramLink: document.getElementById('upload-instagram')?.value.trim() || '',
      mrp: uploadMrpInput?.value.trim() || '',
      showDiscount: uploadShowDiscountInput?.checked || false
    };

    const progressContainer = document.getElementById('admin-upload-progress-container');
    const progressBar = document.getElementById('admin-upload-progress-bar');
    const progressPercent = document.getElementById('admin-upload-progress-percent');
    const progressStatus = document.getElementById('admin-upload-progress-status');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading to Cloudinary...';

    if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;

    try {
      const onProgress = (percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (percent === 100 && progressStatus) {
          progressStatus.textContent = 'Optimizing on Cloudinary... ☁️';
        }
      };

      if (editingProductId) {
        await BackendAPI.editProduct(token, editingProductId, data, onProgress);
        showToast('Product successfully edited! ✨', 'success');
      } else {
        await BackendAPI.addProduct(token, data, onProgress);
        showToast('Product successfully added! ✨', 'success');
      }
      
      if (progressContainer) progressContainer.classList.add('hidden');
      if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
      closeUploadModal();
      await renderCatalog();
      await renderAdminDashboard();
    } catch (e) {
      if (progressContainer) progressContainer.classList.add('hidden');
      if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
      handleAdminError(e, 'Save failed! ⚠️');
    }
  });

  uploadModal?.addEventListener('click', (e) => {
    if (e.target === uploadModal) closeUploadModal();
  });

  // ─── PREMIUM MULTI-IMAGE CUSTOMER INQUIRY FORM ─────────────────────────────
  // Replaces the old single-image form. Uses FormData + fetch to send
  // multipart/form-data to POST /api/custom-orders

  const customOrderModal = document.getElementById('custom-order-modal');
  const customOrderForm  = document.getElementById('custom-order-form');
  const inquiryDropzone  = document.getElementById('inquiry-dropzone');
  const inquiryInput     = document.getElementById('inquiry-images-input');
  const inquiryPreview   = document.getElementById('inquiry-images-preview');
  const inquiryCountEl   = document.getElementById('inquiry-img-count');
  const inquiryPlaceholder = document.getElementById('inquiry-placeholder');

  let inquiryImageFiles = []; // Array of File objects (max 5)
  const MAX_INQUIRY_IMAGES = 5;
  const MAX_IMG_SIZE_MB = 10;

  function openCustomOrderModal() {
    if (!customOrderModal) return;
    resetInquiryForm();
    customOrderModal.classList.remove('hidden');
    setTimeout(() => customOrderModal.classList.add('active'), 50);
  }

  function closeCustomOrderModal() {
    if (!customOrderModal) return;
    customOrderModal.classList.remove('active');
    setTimeout(() => {
      customOrderModal.classList.add('hidden');
      resetInquiryForm();
    }, 400);
  }

  function resetInquiryForm() {
    customOrderForm?.reset();
    inquiryImageFiles = [];
    renderInquiryPreviews();
    const successDiv = document.getElementById('custom-order-success');
    if (successDiv) successDiv.classList.add('hidden');
    if (customOrderForm) customOrderForm.classList.remove('hidden');
    const submitBtn = document.getElementById('inquiry-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      const textEl = document.getElementById('inquiry-submit-text');
      if (textEl) textEl.textContent = 'Send My Inspiration 🌷';
    }
  }

  // Render thumbnails grid for selected images
  function renderInquiryPreviews() {
    if (!inquiryPreview) return;
    inquiryPreview.innerHTML = '';
    if (inquiryCountEl) inquiryCountEl.textContent = `${inquiryImageFiles.length} / 5 images`;
    if (inquiryPlaceholder) inquiryPlaceholder.style.display = inquiryImageFiles.length > 0 ? 'none' : '';

    inquiryImageFiles.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const wrapper = document.createElement('div');
      wrapper.className = 'relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 group';
      wrapper.innerHTML = `
        <img src="${url}" class="w-full h-full object-contain bg-beige/30">
        <button type="button" class="remove-inquiry-img absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold" data-idx="${idx}">
          ✕
        </button>`;
      wrapper.querySelector('.remove-inquiry-img').addEventListener('click', (e) => {
        e.stopPropagation();
        inquiryImageFiles.splice(idx, 1);
        renderInquiryPreviews();
      });
      inquiryPreview.appendChild(wrapper);
    });
  }

  // Handle selected/dropped files
  function handleInquiryFiles(files) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} is not a supported format (JPG/PNG/WEBP only) ⚠️`, 'error');
        return;
      }
      if (file.size > MAX_IMG_SIZE_MB * 1024 * 1024) {
        showToast(`${file.name} exceeds 10MB limit ⚠️`, 'error');
        return;
      }
      if (inquiryImageFiles.length >= MAX_INQUIRY_IMAGES) {
        showToast('Maximum 5 images allowed 📸', 'error');
        return;
      }
      inquiryImageFiles.push(file);
    });
    renderInquiryPreviews();
  }

  // Wire up file input
  inquiryInput?.addEventListener('change', (e) => {
    handleInquiryFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-added if removed
  });

  // Drag & Drop on dropzone
  inquiryDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    inquiryDropzone.classList.add('drag-over', 'border-primary/60');
  });
  inquiryDropzone?.addEventListener('dragleave', () => {
    inquiryDropzone.classList.remove('drag-over', 'border-primary/60');
  });
  inquiryDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    inquiryDropzone.classList.remove('drag-over', 'border-primary/60');
    handleInquiryFiles(e.dataTransfer.files);
  });

  // Close modal handlers
  document.getElementById('close-custom-order-modal')?.addEventListener('click', closeCustomOrderModal);
  customOrderModal?.addEventListener('click', (e) => {
    if (e.target === customOrderModal) closeCustomOrderModal();
  });

  // Open modal from hero section CTA button
  document.getElementById('open-inquiry-btn')?.addEventListener('click', openCustomOrderModal);

  // FORM SUBMIT — multipart/form-data
  console.log("CUSTOM ORDER SCRIPT LOADED");

  customOrderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("FORM SUBMITTED");

    // Honeypot spam check
    const honeypot = customOrderForm.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) {
      console.warn('[Spam] Honeypot triggered.');
      return;
    }

    // Collect form values
    const customerName = document.getElementById('order-name')?.value.trim();
    const email = document.getElementById('order-email')?.value.trim();
    const phone = document.getElementById('order-phone')?.value.trim();
    const instagram = document.getElementById('order-instagram')?.value.trim();
    const occasion = document.getElementById('order-occasion')?.value;
    const message = document.getElementById('order-message')?.value.trim();

    // Frontend validation
    if (!customerName) { showToast('Please enter your full name 🌸', 'error'); return; }
    if (!email || !email.includes('@')) { showToast('Please enter a valid email address 📧', 'error'); return; }
    if (!phone || phone.length < 6) { showToast('Please enter your phone number 📱', 'error'); return; }
    if (!occasion) { showToast('Please select an occasion 🎀', 'error'); return; }
    if (!message) { showToast('Please describe your idea 💬', 'error'); return; }

    // Set loading state
    const submitBtn = document.getElementById('inquiry-submit-btn');
    const submitText = document.getElementById('inquiry-submit-text');
    
    const progressContainer = document.getElementById('inquiry-upload-progress-container');
    const progressBar = document.getElementById('inquiry-upload-progress-bar');
    const progressPercent = document.getElementById('inquiry-upload-progress-percent');
    const progressStatus = document.getElementById('inquiry-upload-progress-status');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading reference photos...';

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Sending... 🌷';

    try {
      // Build FormData (multipart/form-data for images)
      console.log("customerName:", customerName);
console.log("email:", email);
console.log("phone:", phone);
console.log("occasion:", occasion);
console.log("message:", message);
console.log("images:", inquiryImageFiles);
      const formData = new FormData();
      formData.append('customerName', customerName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('instagramUsername', instagram || '');
      formData.append('occasion', occasion);
      formData.append('message', message);
      inquiryImageFiles.forEach(file => formData.append('referenceImages', file));

      const onProgress = (percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (percent === 100 && progressStatus) {
          progressStatus.textContent = 'Processing on Cloudinary... ☁️';
        }
      };

      await BackendAPI.submitCustomOrder(formData, onProgress);

      if (progressContainer) progressContainer.classList.add('hidden');

      // Celebration!
      if (audioCtx) {
        playTone(523.25, 0.3, 'sine', 0.1);
        setTimeout(() => playTone(659.25, 0.4, 'sine', 0.1), 120);
        setTimeout(() => playTone(783.99, 0.5, 'sine', 0.15), 240);
      }
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.75 }, colors: ['#B58A6A', '#FADADD', '#E7D7FF', '#F5E6D3'] });
      }

      // Show success screen
      customOrderForm.classList.add('hidden');
      const successDiv = document.getElementById('custom-order-success');
      if (successDiv) successDiv.classList.remove('hidden');
      inquiryImageFiles = [];

    } catch (err) {
      if (progressContainer) progressContainer.classList.add('hidden');
      showToast(`Failed to send inquiry: ${err.message || 'Please try again'} ⚠️`, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Send My Inspiration 🌷';
    }
  });

  document.getElementById('success-close-btn')?.addEventListener('click', closeCustomOrderModal);

  // --- LIGHTBOX INTERACTIVE COMPONENT ---
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  
  function openLightbox(src) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxModal.classList.remove('hidden');
    setTimeout(() => lightboxModal.classList.add('active'), 50);
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    setTimeout(() => lightboxModal.classList.add('hidden'), 400);
  }

  document.getElementById('close-lightbox')?.addEventListener('click', closeLightbox);
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  // --- DYNAMIC QUICK VIEW HANDLER FOR CUSTOMERS ---
  const quickViewModal = document.getElementById('quick-view-modal');
  const qvCloseBtn = document.getElementById('qv-close-btn');
  const qvImg = document.getElementById('qv-img');
  const qvTitle = document.getElementById('qv-title');
  const qvPrice = document.getElementById('qv-price');
  const qvType = document.getElementById('qv-type');
  const qvDetailsAccordion = document.getElementById('qv-details-accordion');
  const qvDetailsToggleBtn = document.getElementById('qv-details-toggle-btn');
  const qvDetailsPanel = document.getElementById('qv-details-panel');
  const qvFaqAccordion = document.getElementById('qv-faq-accordion');
  const qvFaqToggleBtn = document.getElementById('qv-faq-toggle-btn');
  const qvFaqPanel = document.getElementById('qv-faq-panel');
  const qvFullDesc = document.getElementById('qv-full-desc');
  const qvThumbnailsContainer = document.getElementById('qv-thumbnails');
  const qvPrevBtn = document.getElementById('qv-prev-btn');
  const qvNextBtn = document.getElementById('qv-next-btn');

  // --- DYNAMIC MOBILE PRODUCT DETAIL PAGE HANDLER ---
  const mobileProductDetail = document.getElementById('mobile-product-detail');
  const mobQvBackBtn = document.getElementById('mob-qv-back-btn');
  const mobQvGalleryScroll = document.getElementById('mob-qv-gallery-scroll');
  const mobQvGalleryCounter = document.getElementById('mob-qv-gallery-counter');
  const mobQvGalleryDots = document.getElementById('mob-qv-gallery-dots');
  const mobQvWishlistBtn = document.getElementById('mob-qv-wishlist-btn');
  const mobQvTitle = document.getElementById('mob-qv-title');
  const mobQvPrice = document.getElementById('mob-qv-price');
  const mobQvType = document.getElementById('mob-qv-type');
  const mobQvDetailsAccordion = document.getElementById('mob-qv-details-accordion');
  const mobQvDetailsToggleBtn = document.getElementById('mob-qv-details-toggle-btn');
  const mobQvDetailsPanel = document.getElementById('mob-qv-details-panel');
  const mobFaqAccordion = document.getElementById('mob-faq-accordion');
  const mobFaqToggleBtn = document.getElementById('mob-faq-toggle-btn');
  const mobFaqPanel = document.getElementById('mob-faq-panel');
  const mobQvFullDesc = document.getElementById('mob-qv-full-desc');
  const mobQvPrevBtn = document.getElementById('mob-qv-prev-btn');
  const mobQvNextBtn = document.getElementById('mob-qv-next-btn');

  // --- RECENTLY VIEWED PRODUCTS CONTROLLER ---
  const recentlyViewedSection = document.getElementById('recently-viewed-section');
  const recentlyViewedGrid = document.getElementById('recently-viewed-grid');

  function saveToRecentlyViewed(p) {
    if (!p || p.id === 'custom-order-card' || !p.name) return;
    try {
      let items = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      items = items.filter(name => name !== p.name);
      items.unshift(p.name);
      items = items.slice(0, 4);
      localStorage.setItem('recentlyViewed', JSON.stringify(items));
      renderRecentlyViewed();
    } catch (err) {
      console.warn('Could not save to recently viewed:', err);
    }
  }

  function renderCompactProductCard(p) {
    const card = document.createElement('div');
    const isWishlisted = typeof wishlist !== 'undefined' && Array.isArray(wishlist) && wishlist.includes(p.name);
    const imgSrc = resolveProductPrimaryImage(p);

    card.className = 'rv-compact-card flex-shrink-0 w-56 sm:w-64 md:w-auto snap-start glass-card rounded-2xl p-3 relative group overflow-hidden cursor-pointer border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-md clickable flex flex-col justify-between';

    card.innerHTML = `
      <div class="relative overflow-hidden rounded-xl aspect-[4/3] mb-2.5 bg-beige/30">
        <img alt="${p.name}" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy">
        <button class="wishlist-heart-btn absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 dark:bg-darkbrown/80 backdrop-blur-sm flex items-center justify-center text-primary hover:scale-110 active:scale-95 transition-all duration-200 z-10 clickable" data-product-name="${p.name}">
          <span class="material-symbols-outlined text-sm ${isWishlisted ? 'text-red-400' : ''}" style="${isWishlisted ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
        </button>
      </div>
      <div class="flex items-center justify-between gap-2 pt-0.5">
        <h4 class="font-serif font-bold text-xs md:text-sm text-darkbrown dark:text-beige line-clamp-1">${p.name}</h4>
        <span class="text-xs font-semibold text-primary shrink-0">${formatPrice(p.price)}</span>
      </div>
    `;

    const imgEl = card.querySelector('img');
    safeLoadProductImage(imgEl, imgSrc, p);

    // Click card opens Quick View
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-heart-btn')) return;
      openQuickView(p);
    });

    return card;
  }

  function renderRecentlyViewed() {
    if (!recentlyViewedSection || !recentlyViewedGrid) return;
    try {
      const items = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      if (items.length === 0 || !publicProducts || publicProducts.length === 0) {
        recentlyViewedSection.classList.add('hidden');
        return;
      }

      const foundProducts = items
        .map(name => publicProducts.find(p => p && p.name === name))
        .filter(Boolean);

      if (foundProducts.length === 0) {
        recentlyViewedSection.classList.add('hidden');
        return;
      }

      recentlyViewedSection.classList.remove('hidden');
      recentlyViewedGrid.innerHTML = '';

      foundProducts.forEach(p => {
        const card = renderCompactProductCard(p);
        recentlyViewedGrid.appendChild(card);
      });

      if (typeof refreshCursorHovers === 'function') {
        refreshCursorHovers();
      }

      if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.refresh === 'function') {
        setTimeout(() => ScrollTrigger.refresh(), 100);
      }
    } catch (err) {
      console.warn('Could not render recently viewed:', err);
      recentlyViewedSection.classList.add('hidden');
    }
  }

  function navigateQuickViewProduct(targetProduct) {
    if (!quickViewModal || !targetProduct) return;
    const modalContent = quickViewModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transition = 'opacity 150ms ease';
      modalContent.style.opacity = '0.35';
      setTimeout(() => {
        openQuickView(targetProduct);
        modalContent.style.opacity = '1';
        setTimeout(() => {
          modalContent.style.transition = '';
        }, 150);
      }, 150);
    } else {
      openQuickView(targetProduct);
    }
  }

  // --- RELATED PRODUCTS ("YOU MAY ALSO LIKE") LOGIC ---
  function getRelatedProducts(currentProduct) {
    const list = (typeof publicProducts !== 'undefined' && Array.isArray(publicProducts)) ? publicProducts : [];
    const currentId = currentProduct._id || currentProduct.id;
    const currentCategory = currentProduct.category || currentProduct.badge || '';

    // Filter candidate products (excluding current product and custom order card)
    const candidates = list.filter(prod => {
      const prodId = prod._id || prod.id;
      return prodId !== currentId && prodId !== 'custom-order-card';
    });

    // Priority 1: Same category
    const sameCategory = candidates.filter(prod => {
      const cat = prod.category || prod.badge || '';
      return cat.toLowerCase() === currentCategory.toLowerCase();
    });

    // Priority 2: Featured products
    const featured = candidates.filter(prod => !!prod.featured);

    const selected = [];
    const selectedIds = new Set();

    // 1. Add same category products
    for (const prod of sameCategory) {
      if (selected.length >= 3) break;
      const prodId = prod._id || prod.id;
      selected.push(prod);
      selectedIds.add(prodId);
    }

    // 2. Fill remaining slots with featured products
    for (const prod of featured) {
      if (selected.length >= 3) break;
      const prodId = prod._id || prod.id;
      if (!selectedIds.has(prodId)) {
        selected.push(prod);
        selectedIds.add(prodId);
      }
    }

    // 3. Fill remaining slots with any candidates if still less than 3
    for (const prod of candidates) {
      if (selected.length >= 3) break;
      const prodId = prod._id || prod.id;
      if (!selectedIds.has(prodId)) {
        selected.push(prod);
        selectedIds.add(prodId);
      }
    }

    return selected;
  }

  function renderRelatedProducts(p, isMobileView) {
    const related = getRelatedProducts(p);

    if (isMobileView) {
      const container = document.getElementById('mob-qv-related-products-section');
      const listEl = document.getElementById('mob-qv-related-products-list');
      if (!container || !listEl) return;

      if (related.length === 0) {
        container.classList.add('hidden');
        return;
      }

      listEl.innerHTML = '';
      related.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'related-product-card flex-shrink-0 w-[110px] snap-start flex flex-col gap-1.5 p-2 rounded-2xl bg-beige/10 dark:bg-white/5 border border-primary/5 hover:bg-beige/35 dark:hover:bg-white/10 transition duration-200 cursor-pointer';

        const priceText = formatPrice(prod.price);
        const nameText = prod.name || prod.title || '';
        const imgUrl = resolveProductPrimaryImage(prod);

        card.innerHTML = `
          <div class="aspect-[4/3] rounded-xl overflow-hidden bg-beige/30 flex items-center justify-center">
            <img src="${imgUrl}" alt="${nameText}" class="w-full h-full object-contain" loading="lazy">
          </div>
          <div class="flex flex-col flex-grow justify-between gap-0.5">
            <h5 class="text-[10px] font-bold text-darkbrown dark:text-beige leading-tight line-clamp-2 min-h-[24px]">${nameText}</h5>
            <span class="text-[10px] font-semibold text-primary">${priceText}</span>
          </div>
        `;

        card.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigateMobileProductDetail(prod);
        };

        listEl.appendChild(card);
      });
      container.classList.remove('hidden');
    } else {
      const container = document.getElementById('qv-related-products-section');
      const listEl = document.getElementById('qv-related-products-list');
      if (!container || !listEl) return;

      if (related.length === 0) {
        container.classList.add('hidden');
        return;
      }

      listEl.innerHTML = '';
      related.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'related-product-card flex flex-col gap-1.5 p-2 rounded-2xl bg-beige/10 dark:bg-white/5 border border-primary/5 hover:bg-beige/35 dark:hover:bg-white/10 transition duration-200 cursor-pointer';

        const priceText = formatPrice(prod.price);
        const nameText = prod.name || prod.title || '';
        const imgUrl = resolveProductPrimaryImage(prod);

        card.innerHTML = `
          <div class="aspect-[4/3] rounded-xl overflow-hidden bg-beige/30 flex items-center justify-center">
            <img src="${imgUrl}" alt="${nameText}" class="w-full h-full object-contain" loading="lazy">
          </div>
          <div class="flex flex-col flex-grow justify-between gap-0.5">
            <h5 class="text-[10px] font-bold text-darkbrown dark:text-beige leading-tight line-clamp-2 min-h-[24px]">${nameText}</h5>
            <span class="text-[10px] font-semibold text-primary">${priceText}</span>
          </div>
        `;

        card.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigateQuickViewProduct(prod);
        };

        listEl.appendChild(card);
      });
      container.classList.remove('hidden');
    }
  }

  function renderDetailsPriceHtml(p, isMobile = false) {
    const isCustomOrder = (p._id || p.id) === 'custom-order-card';
    if (isCustomOrder) {
      return formatPrice(p.price);
    }
    const priceNum = Number(String(p.price).replace(/[^\d.]/g, ''));
    const mrpNum = Number(p.mrp);

    if (mrpNum && !isNaN(mrpNum) && !isNaN(priceNum) && mrpNum > priceNum) {
      const showBadge = !!p.showDiscount;
      const discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      const priceClass = isMobile ? 'text-xl font-bold text-primary' : 'text-2xl font-bold text-primary';
      return `
        <span class="flex flex-col items-start gap-1">
          <span class="${priceClass}">${formatPrice(p.price)}</span>
          <span class="flex items-center gap-2">
            <del class="text-xs text-primary opacity-80 line-through decoration-2 decoration-current">${formatPrice(p.mrp)}</del>
            ${showBadge ? `<span class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#e2ece9] text-[#2e5a44] border border-[#2e5a44]/10 shrink-0 select-none">${discount}% OFF</span>` : ''}
          </span>
        </span>
      `;
    } else {
      return formatPrice(p.price);
    }
  }

  // --- MOBILE PRODUCT DETAIL PAGE LOGIC ---
  let currentMobileProduct = null;
  let openedGalleryFromMobileDetail = false;

  function openMobileProductDetail(p, pushState = true) {
    if (!mobileProductDetail) return;
    currentMobileProduct = p;

    // Collapse reviews accordion by default
    const mobReviewsToggle = document.getElementById('mob-reviews-toggle-btn');
    const mobReviewsPanel = document.getElementById('mob-reviews-panel');
    const mobReviewsArrow = document.getElementById('mob-reviews-arrow');
    if (mobReviewsToggle) mobReviewsToggle.setAttribute('aria-expanded', 'false');
    if (mobReviewsPanel) mobReviewsPanel.classList.add('hidden');
    if (mobReviewsArrow) mobReviewsArrow.textContent = '▼';

    saveToRecentlyViewed(p);
    
    mobQvTitle.textContent = p.name;
    mobQvPrice.innerHTML = renderDetailsPriceHtml(p, true);
    mobQvType.textContent = p.badge;

    // ── Stock status (below price) ────────────────────────────────────────────
    const mobStockEl = document.getElementById('mob-qv-stock');
    const isCustomOrder = (p._id || p.id) === 'custom-order-card';
    if (mobStockEl) {
      if (isCustomOrder) {
        mobStockEl.textContent = '';
      } else {
        const ss = getStockStatus(p.stock);
        mobStockEl.textContent  = ss.text;
        mobStockEl.style.color  = ss.color;
      }
    }

    // ── Disable inquiry buttons when out of stock (not hidden) ───────────────
    const mobOrderBtn = document.getElementById('mob-qv-custom-order-btn');
    const mobInstaBtn = document.getElementById('mob-qv-insta-btn');
    const outOfStock  = !isCustomOrder && Number(p.stock === undefined ? 10 : p.stock) === 0;
    if (mobOrderBtn) {
      mobOrderBtn.disabled = outOfStock;
      mobOrderBtn.style.opacity  = outOfStock ? '0.45' : '';
      mobOrderBtn.style.cursor   = outOfStock ? 'not-allowed' : '';
      mobOrderBtn.style.pointerEvents = outOfStock ? 'none' : '';
    }
    if (mobInstaBtn) {
      mobInstaBtn.style.opacity  = outOfStock ? '0.45' : '';
      mobInstaBtn.style.cursor   = outOfStock ? 'not-allowed' : '';
      mobInstaBtn.style.pointerEvents = outOfStock ? 'none' : '';
    }

    // Update Previous / Next Navigation Buttons
    const productList = (typeof publicProducts !== 'undefined' && publicProducts.length > 0) ? publicProducts : [];
    const currentIndex = productList.findIndex(item => (item._id || item.id) === (p._id || p.id) || item.name === p.name);

    if (mobQvPrevBtn && mobQvNextBtn) {
      if (currentIndex === -1 || productList.length <= 1) {
        mobQvPrevBtn.disabled = true;
        mobQvNextBtn.disabled = true;
      } else {
        mobQvPrevBtn.disabled = (currentIndex === 0);
        mobQvNextBtn.disabled = (currentIndex === productList.length - 1);

        mobQvPrevBtn.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex > 0) {
            navigateMobileProductDetail(productList[currentIndex - 1]);
          }
        };

        mobQvNextBtn.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex < productList.length - 1) {
            navigateMobileProductDetail(productList[currentIndex + 1]);
          }
        };
      }
    }

    // Populate Product Details Accordion
    if (mobQvFullDesc) {
      mobQvFullDesc.textContent = p.desc || '';
    }

    // Reset Accordion state
    if (mobQvDetailsAccordion && mobQvDetailsToggleBtn && mobQvDetailsPanel) {
      mobQvDetailsAccordion.classList.remove('expanded');
      mobQvDetailsPanel.classList.remove('expanded');
      mobQvDetailsPanel.classList.add('hidden');
      mobQvDetailsToggleBtn.setAttribute('aria-expanded', 'false');

      mobQvDetailsToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = !mobQvDetailsPanel.classList.contains('expanded');
        if (isCollapsed) {
          mobQvDetailsPanel.classList.remove('hidden');
          requestAnimationFrame(() => {
            mobQvDetailsPanel.classList.add('expanded');
            mobQvDetailsAccordion.classList.add('expanded');
          });
          mobQvDetailsToggleBtn.setAttribute('aria-expanded', 'true');
        } else {
          mobQvDetailsPanel.classList.remove('expanded');
          mobQvDetailsAccordion.classList.remove('expanded');
          mobQvDetailsToggleBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            if (!mobQvDetailsPanel.classList.contains('expanded')) {
              mobQvDetailsPanel.classList.add('hidden');
            }
          }, 350);
        }
      };
    }

    // Reset FAQ Accordion state
    if (mobFaqAccordion && mobFaqToggleBtn && mobFaqPanel) {
      mobFaqAccordion.classList.remove('expanded');
      mobFaqPanel.classList.remove('expanded');
      mobFaqPanel.classList.add('hidden');
      mobFaqToggleBtn.setAttribute('aria-expanded', 'false');

      mobFaqToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = !mobFaqPanel.classList.contains('expanded');
        if (isCollapsed) {
          mobFaqPanel.classList.remove('hidden');
          requestAnimationFrame(() => {
            mobFaqPanel.classList.add('expanded');
            mobFaqAccordion.classList.add('expanded');
          });
          mobFaqToggleBtn.setAttribute('aria-expanded', 'true');
        } else {
          mobFaqPanel.classList.remove('expanded');
          mobFaqAccordion.classList.remove('expanded');
          mobFaqToggleBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            if (!mobFaqPanel.classList.contains('expanded')) {
              mobFaqPanel.classList.add('hidden');
            }
          }, 350);
        }
      };
    }

    // Product Images snap gallery rendering
    const allImages = resolveProductGalleryImages(p);
    const primaryImgUrl = resolveProductPrimaryImage(p);
    const galleryUrls = allImages.length > 0 ? allImages : [primaryImgUrl];

    if (mobQvGalleryScroll) {
      mobQvGalleryScroll.innerHTML = '';
      galleryUrls.forEach((url, idx) => {
        const slide = document.createElement('div');
        slide.className = 'w-full h-full flex-shrink-0 snap-start flex items-center justify-center bg-beige/30 dark:bg-black/20';
        
        const img = document.createElement('img');
        img.className = 'w-full h-full object-contain transition-opacity duration-200 cursor-pointer';
        img.alt = `${p.name} view ${idx + 1}`;
        img.setAttribute('decoding', 'async');
        safeLoadProductImage(img, url, p, { eager: idx === 0 });

        // Bind main image click to open Fullscreen Gallery
        img.onclick = () => {
          openedGalleryFromMobileDetail = true;
          mobileProductDetail.classList.remove('active');
          setTimeout(() => {
            mobileProductDetail.classList.add('hidden');
            openGallery(galleryUrls, idx, p.name);
          }, 300);
        };

        slide.appendChild(img);
        mobQvGalleryScroll.appendChild(slide);
      });
      // Scroll to start
      mobQvGalleryScroll.scrollLeft = 0;
    }

    // Dot Indicators & Counter Setup
    if (mobQvGalleryDots) {
      mobQvGalleryDots.innerHTML = '';
      if (galleryUrls.length > 1) {
        mobQvGalleryDots.classList.remove('hidden');
        galleryUrls.forEach((_, idx) => {
          const dot = document.createElement('div');
          dot.className = `transition-all duration-300 ${idx === 0 ? 'w-4 h-2 bg-white rounded-full' : 'w-2 h-2 bg-white/40 rounded-full'}`;
          mobQvGalleryDots.appendChild(dot);
        });
      } else {
        mobQvGalleryDots.classList.add('hidden');
      }
    }

    if (mobQvGalleryCounter) {
      mobQvGalleryCounter.textContent = `1 / ${galleryUrls.length}`;
      if (galleryUrls.length > 1) {
        mobQvGalleryCounter.classList.remove('hidden');
      } else {
        mobQvGalleryCounter.classList.add('hidden');
      }
    }

    // Throttle & scroll logic to update active indicators
    if (mobQvGalleryScroll) {
      let lastActiveIndex = 0;
      
      // Clean up previous scroll listener just in case
      if (mobQvGalleryScroll._onScroll) {
        mobQvGalleryScroll.removeEventListener('scroll', mobQvGalleryScroll._onScroll);
      }

      mobQvGalleryScroll._onScroll = () => {
        const scrollLeft = mobQvGalleryScroll.scrollLeft;
        const width = mobQvGalleryScroll.clientWidth;
        if (width <= 0) return;
        const activeIndex = Math.round(scrollLeft / width);
        if (activeIndex !== lastActiveIndex) {
          lastActiveIndex = activeIndex;
          
          // Update dot visuals
          if (mobQvGalleryDots) {
            const dots = mobQvGalleryDots.querySelectorAll('div');
            dots.forEach((dot, idx) => {
              if (idx === activeIndex) {
                dot.className = 'w-4 h-2 bg-white rounded-full transition-all duration-300';
              } else {
                dot.className = 'w-2 h-2 bg-white/40 rounded-full transition-all duration-300';
              }
            });
          }

          // Update counter text
          if (mobQvGalleryCounter) {
            mobQvGalleryCounter.textContent = `${activeIndex + 1} / ${galleryUrls.length}`;
          }
        }
      };

      mobQvGalleryScroll.addEventListener('scroll', mobQvGalleryScroll._onScroll, { passive: true });
    }

    // Set up floating wishlist button attribute and sync
    if (mobQvWishlistBtn) {
      mobQvWishlistBtn.setAttribute('data-product-name', p.name);
      
      const wishlistIcon = mobQvWishlistBtn.querySelector('.material-symbols-outlined');
      if (wishlistIcon) {
        const isWishlisted = typeof wishlist !== 'undefined' && Array.isArray(wishlist) && wishlist.includes(p.name);
        if (isWishlisted) {
          wishlistIcon.style.fontVariationSettings = "'FILL' 1";
          wishlistIcon.classList.add('text-red-400');
        } else {
          wishlistIcon.style.fontVariationSettings = "'FILL' 0";
          wishlistIcon.classList.remove('text-red-400');
        }
      }
    }

    // Product Share Setup
    const mobQvShareBtn = document.getElementById('mob-qv-share-btn');
    const mobQvSharePopup = document.getElementById('mob-qv-share-popup');
    const mobQvShareCopyBtn = document.getElementById('mob-qv-share-copy-btn');
    const mobQvShareWaBtn = document.getElementById('mob-qv-share-wa-btn');
    const mobQvShareEmailBtn = document.getElementById('mob-qv-share-email-btn');

    if (mobQvSharePopup) {
      mobQvSharePopup.classList.add('hidden');
    }

    if (mobQvShareBtn) {
      const shareUrl = `${window.location.origin}/?product=${encodeURIComponent(p.name)}`;
      const shareText = `🌸 Check out this handmade crochet product:\n\n${p.name}\n${shareUrl}`;

      mobQvShareBtn.onclick = async (e) => {
        e.stopPropagation();

        if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          try {
            await navigator.share({
              title: p.name,
              text: `🌸 Check out this handmade crochet product: ${p.name}`,
              url: shareUrl
            });
            return;
          } catch (_) {}
        }

        if (mobQvSharePopup) {
          mobQvSharePopup.classList.toggle('hidden');
        }
      };

      if (mobQvShareCopyBtn) {
        mobQvShareCopyBtn.onclick = (e) => {
          e.stopPropagation();
          mobQvSharePopup?.classList.add('hidden');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
              showToast('✓ Link copied!', 'success');
            }).catch(() => {
              showToast('✓ Link copied!', 'success');
            });
          } else {
            showToast('✓ Link copied!', 'success');
          }
        };
      }

      if (mobQvShareWaBtn) {
        mobQvShareWaBtn.onclick = (e) => {
          e.stopPropagation();
          mobQvSharePopup?.classList.add('hidden');
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
        };
      }

      if (mobQvShareEmailBtn) {
        mobQvShareEmailBtn.onclick = (e) => {
          e.stopPropagation();
          mobQvSharePopup?.classList.add('hidden');
          const mailSubject = `Check out this handmade crochet product: ${p.name}`;
          const mailBody = `Hi,\n\nI found this beautiful handmade crochet product.\n\n${p.name}\n${shareUrl}`;
          const mailUrl = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
          window.open(mailUrl, '_self');
        };
      }
    }

    // Increment view counter
    const pId = p._id || p.id;
    if (pId && pId !== 'custom-order-card') {
      BackendAPI.incrementViewCount(pId);
      p.viewCount = (p.viewCount || 0) + 1;
    }

    // Custom Order Request Button
    const mobQvCustomOrderBtn = document.getElementById('mob-qv-custom-order-btn');
    if (mobQvCustomOrderBtn) {
      mobQvCustomOrderBtn.onclick = () => {
        closeMobileProductDetail(false);
        setTimeout(() => {
          openCustomOrderModal();
        }, 300);
      };
    }

    // History PushState
    if (pushState) {
      window.history.pushState({ page: 'mobile-detail', product: p.name }, '', '?product=' + encodeURIComponent(p.name));
    }

    // Render Related Products
    renderRelatedProducts(p, true);
    preloadGalleryImages(p);

    mobileProductDetail.classList.remove('hidden');
    requestAnimationFrame(() => {
      mobileProductDetail.classList.add('active');
    });
    document.body.style.overflow = 'hidden';
    playTone(659.25, 0.25, 'sine', 0.1);
  }

  function closeMobileProductDetail(shouldGoBackInHistory = true) {
    if (!mobileProductDetail) return;
    mobileProductDetail.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      mobileProductDetail.classList.add('hidden');
    }, 300);

    if (shouldGoBackInHistory) {
      if (window.history.state && window.history.state.page === 'mobile-detail') {
        window.history.back();
      } else {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }

  function navigateMobileProductDetail(targetProduct) {
    if (!mobileProductDetail || !targetProduct) return;
    mobileProductDetail.style.transition = 'opacity 150ms ease';
    mobileProductDetail.style.opacity = '0.35';
    setTimeout(() => {
      openMobileProductDetail(targetProduct, false);
      mobileProductDetail.style.opacity = '1';
      setTimeout(() => {
        mobileProductDetail.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease';
      }, 150);
    }, 150);
  }

  // Bind Native Back Button
  if (mobQvBackBtn) {
    mobQvBackBtn.addEventListener('click', () => closeMobileProductDetail(true));
  }

  // Bind popstate listener for browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page === 'mobile-detail') {
      const prodName = e.state.product;
      const p = publicProducts.find(item => item.name === prodName);
      if (p) {
        openMobileProductDetail(p, false);
      }
    } else {
      closeMobileProductDetail(false);
    }
  });

  let currentDesktopProduct = null;

  function openQuickView(p) {
    if (window.innerWidth < 768) {
      openMobileProductDetail(p);
      return;
    }
    if (!quickViewModal) return;
    currentDesktopProduct = p;
    
    // Collapse reviews accordion by default
    const qvReviewsToggle = document.getElementById('qv-reviews-toggle-btn');
    const qvReviewsPanel = document.getElementById('qv-reviews-panel');
    const qvReviewsArrow = document.getElementById('qv-reviews-arrow');
    if (qvReviewsToggle) qvReviewsToggle.setAttribute('aria-expanded', 'false');
    if (qvReviewsPanel) qvReviewsPanel.classList.add('hidden');
    if (qvReviewsArrow) qvReviewsArrow.textContent = '▼';

    saveToRecentlyViewed(p);
    qvTitle.textContent = p.name;
    qvPrice.innerHTML = renderDetailsPriceHtml(p, false);
    qvType.textContent = p.badge;

    // ── Stock status (below price) ────────────────────────────────────────────
    const qvStockEl = document.getElementById('qv-stock');
    const isCustomOrderQV = (p._id || p.id) === 'custom-order-card';
    if (qvStockEl) {
      if (isCustomOrderQV) {
        qvStockEl.textContent = '';
      } else {
        const ss = getStockStatus(p.stock);
        qvStockEl.textContent  = ss.text;
        qvStockEl.style.color  = ss.color;
      }
    }

    // ── Disable inquiry buttons when out of stock (not hidden) ───────────────
    const qvOrderBtn  = document.getElementById('qv-custom-order-btn');
    const qvInstaBtn  = document.getElementById('qv-insta-btn');
    const qvOutOfStock = !isCustomOrderQV && Number(p.stock === undefined ? 10 : p.stock) === 0;
    if (qvOrderBtn) {
      qvOrderBtn.disabled = qvOutOfStock;
      qvOrderBtn.style.opacity  = qvOutOfStock ? '0.45' : '';
      qvOrderBtn.style.cursor   = qvOutOfStock ? 'not-allowed' : '';
      qvOrderBtn.style.pointerEvents = qvOutOfStock ? 'none' : '';
    }
    if (qvInstaBtn) {
      qvInstaBtn.style.opacity  = qvOutOfStock ? '0.45' : '';
      qvInstaBtn.style.cursor   = qvOutOfStock ? 'not-allowed' : '';
      qvInstaBtn.style.pointerEvents = qvOutOfStock ? 'none' : '';
    }

    // Update Previous / Next Navigation Buttons
    const productList = (typeof publicProducts !== 'undefined' && publicProducts.length > 0) ? publicProducts : [];
    const currentIndex = productList.findIndex(item => (item._id || item.id) === (p._id || p.id) || item.name === p.name);

    if (qvPrevBtn && qvNextBtn) {
      if (currentIndex === -1 || productList.length <= 1) {
        qvPrevBtn.disabled = true;
        qvNextBtn.disabled = true;
      } else {
        qvPrevBtn.disabled = (currentIndex === 0);
        qvNextBtn.disabled = (currentIndex === productList.length - 1);

        qvPrevBtn.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex > 0) {
            navigateQuickViewProduct(productList[currentIndex - 1]);
          }
        };

        qvNextBtn.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex < productList.length - 1) {
            navigateQuickViewProduct(productList[currentIndex + 1]);
          }
        };
      }
    }

    // Populate Product Details Accordion full description
    if (qvFullDesc) {
      qvFullDesc.textContent = p.desc || '';
    }

    // Reset Accordion state to collapsed whenever a product modal opens
    if (qvDetailsAccordion && qvDetailsToggleBtn && qvDetailsPanel) {
      qvDetailsAccordion.classList.remove('expanded');
      qvDetailsPanel.classList.remove('expanded');
      qvDetailsPanel.classList.add('hidden');
      qvDetailsToggleBtn.setAttribute('aria-expanded', 'false');

      qvDetailsToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = !qvDetailsPanel.classList.contains('expanded');
        if (isCollapsed) {
          qvDetailsPanel.classList.remove('hidden');
          requestAnimationFrame(() => {
            qvDetailsPanel.classList.add('expanded');
            qvDetailsAccordion.classList.add('expanded');
          });
          qvDetailsToggleBtn.setAttribute('aria-expanded', 'true');
        } else {
          qvDetailsPanel.classList.remove('expanded');
          qvDetailsAccordion.classList.remove('expanded');
          qvDetailsToggleBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            if (!qvDetailsPanel.classList.contains('expanded')) {
              qvDetailsPanel.classList.add('hidden');
            }
          }, 350);
        }
      };
    }

    // Reset FAQ Accordion state
    if (qvFaqAccordion && qvFaqToggleBtn && qvFaqPanel) {
      qvFaqAccordion.classList.remove('expanded');
      qvFaqPanel.classList.remove('expanded');
      qvFaqPanel.classList.add('hidden');
      qvFaqToggleBtn.setAttribute('aria-expanded', 'false');

      qvFaqToggleBtn.onclick = (e) => {
        e.stopPropagation();
        const isCollapsed = !qvFaqPanel.classList.contains('expanded');
        if (isCollapsed) {
          qvFaqPanel.classList.remove('hidden');
          requestAnimationFrame(() => {
            qvFaqPanel.classList.add('expanded');
            qvFaqAccordion.classList.add('expanded');
          });
          qvFaqToggleBtn.setAttribute('aria-expanded', 'true');
        } else {
          qvFaqPanel.classList.remove('expanded');
          qvFaqAccordion.classList.remove('expanded');
          qvFaqToggleBtn.setAttribute('aria-expanded', 'false');
          setTimeout(() => {
            if (!qvFaqPanel.classList.contains('expanded')) {
              qvFaqPanel.classList.add('hidden');
            }
          }, 350);
        }
      };
    }
    
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    }
    const modalContent = quickViewModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.setAttribute('data-lenis-prevent', '');
      modalContent.scrollTop = 0;
    }

    // Product Images & Thumbnail Strip Setup
    const allImages = resolveProductGalleryImages(p);
    const primaryImgUrl = resolveProductPrimaryImage(p);
    qvImg.style.transform = 'scale(1)';
    qvImg.style.transformOrigin = 'center center';
    safeLoadProductImage(qvImg, primaryImgUrl, p, { eager: true });
    preloadGalleryImages(p);

    // Desktop Hover Zoom Controller for Main Image
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      qvImg.onmouseenter = () => {
        qvImg.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      };

      qvImg.onmousemove = (e) => {
        const rect = qvImg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        qvImg.style.transformOrigin = `${x}% ${y}%`;
        qvImg.style.transform = 'scale(1.8)';
      };

      qvImg.onmouseleave = () => {
        qvImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
        qvImg.style.transform = 'scale(1)';
        setTimeout(() => {
          qvImg.style.transformOrigin = 'center center';
        }, 350);
      };
    } else {
      qvImg.onmouseenter = null;
      qvImg.onmousemove = null;
      qvImg.onmouseleave = null;
    }

    if (qvThumbnailsContainer) {
      qvThumbnailsContainer.innerHTML = '';
      if (allImages.length > 1) {
        qvThumbnailsContainer.classList.remove('hidden');
        allImages.forEach((url, idx) => {
          const thumb = document.createElement('img');
          thumb.alt = `${p.name} view ${idx + 1}`;
          thumb.className = `qv-thumb-item ${idx === 0 ? 'active' : ''}`;

          safeLoadProductImage(thumb, url, p);

          thumb.onclick = (e) => {
            e.stopPropagation();
            const cacheBustedUrl = getProductImageUrl(url, p);
            if (qvImg.dataset.pendingUrl === cacheBustedUrl) return;
            qvThumbnailsContainer.querySelectorAll('.qv-thumb-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');

            qvImg.style.transform = 'scale(1)';
            qvImg.style.transformOrigin = 'center center';
            qvImg.style.opacity = '0.4';
            safeLoadProductImage(qvImg, url, p, {
              onSuccess: () => {
                qvImg.style.opacity = '1';
              },
              onError: () => {
                qvImg.style.opacity = '1';
              }
            });
          };
          qvThumbnailsContainer.appendChild(thumb);
        });
      } else {
        qvThumbnailsContainer.classList.add('hidden');
      }
    }

    // Bind main image click to open Fullscreen Gallery
    qvImg.style.cursor = 'pointer';
    qvImg.onclick = () => {
      quickViewModal.classList.remove('active');
      setTimeout(() => {
        quickViewModal.classList.add('hidden');
        openGallery(allImages.length > 0 ? allImages : [primaryImgUrl], 0, p.name);
      }, 300);
    };

    // Product Share Setup
    const qvShareBtn = document.getElementById('qv-share-btn');
    const qvSharePopup = document.getElementById('qv-share-popup');
    const qvShareCopyBtn = document.getElementById('qv-share-copy-btn');
    const qvShareWaBtn = document.getElementById('qv-share-wa-btn');
    const qvShareEmailBtn = document.getElementById('qv-share-email-btn');

    if (qvSharePopup) {
      qvSharePopup.classList.add('hidden');
    }

    if (qvShareBtn) {
      const shareUrl = `${window.location.origin}/?product=${encodeURIComponent(p.name)}`;
      const shareText = `🌸 Check out this handmade crochet product:\n\n${p.name}\n${shareUrl}`;

      qvShareBtn.onclick = async (e) => {
        e.stopPropagation();

        if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          try {
            await navigator.share({
              title: p.name,
              text: `🌸 Check out this handmade crochet product: ${p.name}`,
              url: shareUrl
            });
            return;
          } catch (_) {}
        }

        if (qvSharePopup) {
          qvSharePopup.classList.toggle('hidden');
        }
      };

      if (qvShareCopyBtn) {
        qvShareCopyBtn.onclick = (e) => {
          e.stopPropagation();
          qvSharePopup?.classList.add('hidden');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
              showToast('✓ Link copied!', 'success');
            }).catch(() => {
              showToast('✓ Link copied!', 'success');
            });
          } else {
            showToast('✓ Link copied!', 'success');
          }
        };
      }

      if (qvShareWaBtn) {
        qvShareWaBtn.onclick = (e) => {
          e.stopPropagation();
          qvSharePopup?.classList.add('hidden');
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
          window.open(waUrl, '_blank');
        };
      }

      if (qvShareEmailBtn) {
        qvShareEmailBtn.onclick = (e) => {
          e.stopPropagation();
          qvSharePopup?.classList.add('hidden');
          const mailSubject = `Check out this handmade crochet product: ${p.name}`;
          const mailBody = `Hi,\n\nI found this beautiful handmade crochet product.\n\n${p.name}\n${shareUrl}`;
          const mailUrl = `mailto:?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
          window.open(mailUrl, '_self');
        };
      }
    }

    // Increment view counter
    const pId = p._id || p.id;
    if (pId && pId !== 'custom-order-card') {
      BackendAPI.incrementViewCount(pId);
      p.viewCount = (p.viewCount || 0) + 1;
    }

    // Render Related Products
    renderRelatedProducts(p, false);

    quickViewModal.classList.remove('quick-view-closing');
    quickViewModal.classList.remove('hidden');
    setTimeout(() => quickViewModal.classList.add('active'), 20);
    playTone(659.25, 0.25, 'sine', 0.1);
  }

  function closeQuickViewModal() {
    if (!quickViewModal) return;
    quickViewModal.classList.remove('active');
    quickViewModal.classList.add('quick-view-closing');
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.start === 'function') {
      lenis.start();
    }
    setTimeout(() => {
      quickViewModal.classList.add('hidden');
      quickViewModal.classList.remove('quick-view-closing');
    }, 300);
  }

  if (qvCloseBtn) {
    qvCloseBtn.addEventListener('click', closeQuickViewModal);
  }

  if (quickViewModal) {
    quickViewModal.addEventListener('click', (e) => {
      if (e.target === quickViewModal) {
        closeQuickViewModal();
      }
    });

    quickViewModal.addEventListener('wheel', (e) => {
      const modalContent = quickViewModal.querySelector('.modal-content');
      if (modalContent && modalContent.scrollHeight > modalContent.clientHeight) {
        e.stopPropagation();
        modalContent.scrollTop += e.deltaY;
      }
    }, { passive: true });
  }

  // Close share popup on click outside or Escape
  document.addEventListener('click', (e) => {
    const qvSharePopup = document.getElementById('qv-share-popup');
    if (qvSharePopup && !qvSharePopup.classList.contains('hidden')) {
      if (!e.target.closest('#qv-share-popup') && !e.target.closest('#qv-share-btn')) {
        qvSharePopup.classList.add('hidden');
      }
    }
  });

  // Global Keyboard Shortcuts for Quick View Modal
  document.addEventListener('keydown', (e) => {
    // Input safety guard: Ignore when user is typing in form controls
    const activeEl = document.activeElement;
    const isEditing = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.isContentEditable
    );
    if (isEditing) return;

    // Close share popup on Escape
    const qvSharePopup = document.getElementById('qv-share-popup');
    if (qvSharePopup && !qvSharePopup.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        qvSharePopup.classList.add('hidden');
        return;
      }
    }

    // Quick View Modal Shortcuts (only active when modal is open)
    if (quickViewModal && !quickViewModal.classList.contains('hidden') && quickViewModal.classList.contains('active')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeQuickViewModal();
      } else if (e.key === 'ArrowLeft') {
        const qvPrevBtn = document.getElementById('qv-prev-btn');
        if (qvPrevBtn && !qvPrevBtn.disabled) {
          e.preventDefault();
          qvPrevBtn.click();
        }
      } else if (e.key === 'ArrowRight') {
        const qvNextBtn = document.getElementById('qv-next-btn');
        if (qvNextBtn && !qvNextBtn.disabled) {
          e.preventDefault();
          qvNextBtn.click();
        }
      }
    }
  });

  // Quick view triggers
  const qvCustomOrderBtn = document.getElementById('qv-custom-order-btn');
  qvCustomOrderBtn?.addEventListener('click', () => {
    closeQuickViewModal();
    setTimeout(() => {
      openCustomOrderModal();
    }, 300);
  });

  // --- PREMIUM FULLSCREEN GALLERY MODAL ---
  let currentGalleryImages = [];
  let currentGalleryIndex = 0;
  let galleryProductName = '';
  let touchStartX = 0;
  let touchEndX = 0;
  let isMultiTouchGesture = false;

  const galleryModal = document.getElementById('gallery-modal');
  const galleryMainImg = document.getElementById('gallery-main-img');
  const galleryProductTitle = document.getElementById('gallery-product-title');
  const galleryCounter = document.getElementById('gallery-counter');
  const galleryThumbnails = document.getElementById('gallery-thumbnails');
  const galleryCloseBtn = document.getElementById('gallery-close-btn');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');

  function openGallery(images, startIndex, name) {
    if (!galleryModal) return;
    
    // Reset touch gesture state
    touchStartX = 0;
    touchEndX = 0;
    isMultiTouchGesture = false;

    // Normalize images (handle array or single string) to ensure string URLs
    const imgArray = Array.isArray(images) ? images : (images ? [images] : []);
    currentGalleryImages = imgArray.map(img => {
      if (img && typeof img === 'object') {
        return img.url || '';
      }
      return img || '';
    }).filter(Boolean);
    
    currentGalleryIndex = startIndex || 0;
    galleryProductName = name || '';

    // Update static content
    if (galleryProductTitle) galleryProductTitle.textContent = galleryProductName;

    // Render thumbnails
    renderGalleryThumbnails();

    // Show active image
    showGalleryImage(currentGalleryIndex);

    // Stop Lenis smooth scroll cleanly while gallery is open
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    }

    // Open Modal with GSAP animation
    galleryModal.classList.remove('hidden');
    galleryModal.style.pointerEvents = 'auto';
    gsap.fromTo(galleryModal, 
      { opacity: 0, backdropFilter: 'blur(0px)' }, 
      { opacity: 1, backdropFilter: 'blur(12px)', duration: 0.4, ease: 'power2.out' }
    );

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Play soft sound chime
    if (typeof playTone === 'function') {
      playTone(783.99, 0.2, 'sine', 0.08);
    }
  }

  function closeGallery() {
    if (!galleryModal) return;

    let wasFromMobileDetail = false;
    if (typeof openedGalleryFromMobileDetail !== 'undefined' && openedGalleryFromMobileDetail) {
      wasFromMobileDetail = true;
      openedGalleryFromMobileDetail = false;
    }

    // Instantly reset touch gesture state & locks
    touchStartX = 0;
    touchEndX = 0;
    isMultiTouchGesture = false;

    // Restore body & html scroll restrictions immediately (do not wait for GSAP animation)
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.style.pointerEvents = '';

    galleryModal.style.pointerEvents = 'none';

    // Resume Lenis smooth scroll immediately if present
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.start === 'function') {
      lenis.start();
      if (typeof lenis.resize === 'function') {
        lenis.resize();
      }
    }

    // Next animation frame guarantee for reflow & ScrollTrigger
    requestAnimationFrame(() => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger) {
        if (typeof ScrollTrigger.update === 'function') ScrollTrigger.update();
      }
    });

    gsap.to(galleryModal, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        galleryModal.classList.add('hidden');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger && typeof ScrollTrigger.refresh === 'function') {
          ScrollTrigger.refresh();
        }
        if (wasFromMobileDetail && currentMobileProduct) {
          openMobileProductDetail(currentMobileProduct, false);
        }
      }
    });

    if (typeof playTone === 'function') {
      playTone(523.25, 0.15, 'sine', 0.05);
    }
  }

  function showGalleryImage(index) {
    if (!currentGalleryImages.length) return;
    
    if (index < 0) index = currentGalleryImages.length - 1;
    if (index >= currentGalleryImages.length) index = 0;
    currentGalleryIndex = index;

    if (galleryCounter) {
      galleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
    }

    if (galleryMainImg) {
      const product = publicProducts ? publicProducts.find(prod => prod.name === galleryProductName) : null;
      const targetUrl = currentGalleryImages[currentGalleryIndex] || '/images/product-placeholder.webp';

      // Crossfade animation
      gsap.to(galleryMainImg, {
        opacity: 0,
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          let animated = false;
          
          safeLoadProductImage(galleryMainImg, targetUrl, product, {
            onSuccess: () => {
              if (animated) return;
              animated = true;
              gsap.fromTo(galleryMainImg, 
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
              );
            },
            onError: () => {
              if (animated) return;
              animated = true;
              gsap.fromTo(galleryMainImg, 
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
              );
            }
          });
        }
      });
    }

    // Update thumbnails highlighting and centering
    updateActiveThumbnail();

    // Lazy Prefetch adjacent images
    prefetchGalleryImages();
  }

  function renderGalleryThumbnails() {
    if (!galleryThumbnails) return;
    galleryThumbnails.innerHTML = '';
    
    const product = publicProducts ? publicProducts.find(prod => prod.name === galleryProductName) : null;
    
    currentGalleryImages.forEach((img, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `gallery-thumb-item relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 flex-shrink-0 clickable ${idx === currentGalleryIndex ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'}`;
      
      const thumbImg = document.createElement('img');
      thumbImg.alt = `thumbnail ${idx}`;
      thumbImg.className = 'w-full h-full object-cover';
      
      safeLoadProductImage(thumbImg, img, product);
      thumb.appendChild(thumbImg);

      thumb.addEventListener('click', () => {
        if (idx !== currentGalleryIndex) {
          showGalleryImage(idx);
          if (typeof playTone === 'function') {
            playTone(587.33, 0.05, 'sine', 0.03);
          }
        }
      });
      galleryThumbnails.appendChild(thumb);
    });
  }

  function updateActiveThumbnail() {
    if (!galleryThumbnails) return;
    const thumbs = galleryThumbnails.querySelectorAll('.gallery-thumb-item');
    thumbs.forEach((thumb, idx) => {
      if (idx === currentGalleryIndex) {
        thumb.classList.add('border-primary', 'scale-105', 'shadow-md');
        thumb.classList.remove('border-transparent', 'opacity-60');
        
        // Smooth center scrolling
        const containerWidth = galleryThumbnails.clientWidth;
        const thumbOffset = thumb.offsetLeft;
        const thumbWidth = thumb.clientWidth;
        const scrollTarget = thumbOffset - (containerWidth / 2) + (thumbWidth / 2);
        
        galleryThumbnails.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
      } else {
        thumb.classList.remove('border-primary', 'scale-105', 'shadow-md');
        thumb.classList.add('border-transparent', 'opacity-60');
      }
    });
  }

  function prefetchGalleryImages() {
    if (currentGalleryImages.length <= 1) return;
    const nextIdx = (currentGalleryIndex + 1) % currentGalleryImages.length;
    const prevIdx = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    
    const product = publicProducts ? publicProducts.find(prod => prod.name === galleryProductName) : null;
    
    [nextIdx, prevIdx].forEach(idx => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getProductImageUrl(currentGalleryImages[idx], product);
      document.head.appendChild(link);
      setTimeout(() => link.remove(), 1000);
    });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      showGalleryImage(currentGalleryIndex + 1);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      showGalleryImage(currentGalleryIndex - 1);
    }
  }

  // Bind Gallery Listeners
  if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGallery);
  if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', () => showGalleryImage(currentGalleryIndex - 1));
  if (galleryNextBtn) galleryNextBtn.addEventListener('click', () => showGalleryImage(currentGalleryIndex + 1));
  
  galleryModal?.addEventListener('click', (e) => {
    if (e.target === galleryModal || e.target.id === 'gallery-image-container') {
      closeGallery();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!galleryModal || galleryModal.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') {
      showGalleryImage(currentGalleryIndex - 1);
    } else if (e.key === 'ArrowRight') {
      showGalleryImage(currentGalleryIndex + 1);
    } else if (e.key === 'Escape') {
      closeGallery();
    }
  });

  const galleryImageContainer = document.getElementById('gallery-image-container');
  if (galleryImageContainer) {
    galleryImageContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 1) {
        isMultiTouchGesture = true;
        return;
      }
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].screenX;
      }
    }, { passive: true });

    galleryImageContainer.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 1) {
        isMultiTouchGesture = true;
      }
    }, { passive: true });

    galleryImageContainer.addEventListener('touchend', (e) => {
      if (isMultiTouchGesture) {
        if (e.touches && e.touches.length === 0) {
          isMultiTouchGesture = false;
        }
        return;
      }
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }
    }, { passive: true });

    galleryImageContainer.addEventListener('touchcancel', () => {
      isMultiTouchGesture = false;
      touchStartX = 0;
      touchEndX = 0;
    }, { passive: true });
  }

  // Seeding/rendering initial states on load
  (async () => {
    await applyHomepageSettings();
    await renderCatalog();
    await handleRouting();
  })();

  // --- GSAP & SCROLLTRIGGER & LENIS ANIMATIONS ---

  let lenis;
  function initLenis() {
    if (isMobileOrTouch) {
      console.log("Lenis smooth scroll disabled on mobile/touch devices.");
      return;
    }
    
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    function raf(time) {
      if (lenis) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
    }
    requestAnimationFrame(raf);

    // Sync ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);
  }

  function initGSAPScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    if (prefersReducedMotion) {
      // Force reveal all animated elements immediately and do not register triggers
      document.querySelectorAll('.reveal-section .text-center').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
      document.querySelectorAll('#why-crochet .glass-card, .why-choose-card').forEach(el => gsap.set(el, { opacity: 1, y: 0, scale: 1 }));
      document.querySelectorAll('.timeline-item').forEach(el => gsap.set(el, { opacity: 1, y: 0, scale: 1 }));
      const storyMask = document.querySelector('#founder-story-image-card .story-mask');
      if (storyMask) gsap.set(storyMask, { scaleX: 0 });
      document.querySelectorAll('#founder h2 .reveal-char').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
      document.querySelectorAll('#founder p, #founder h4, #founder .text-primary').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
      document.querySelectorAll('#instagram-promo .instagram-frame-wrapper, #instagram-promo .space-y-8 > *').forEach(el => gsap.set(el, { opacity: 1, x: 0 }));
      document.querySelectorAll('footer > div > *').forEach(el => gsap.set(el, { opacity: 1, y: 0 }));
      document.querySelectorAll('.scroll-reveal').forEach(el => gsap.set(el, { opacity: 1, y: 0, scale: 1 }));
      return;
    }

    // Ensure ScrollTrigger uses the document as scroller (Lenis smooth scroll)
    ScrollTrigger.defaults({ scroller: document.body });
    // Initialize Lenis smooth scroll
    initLenis();

    // Reveal section headers on scroll using GSAP ScrollTrigger
    document.querySelectorAll('.reveal-section').forEach(sec => {
      const header = sec.querySelector('.text-center');
      if (header) {
        gsap.from(header, {
          opacity: 0,
          y: 20,
          duration: 1.0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 85%",
            once: true
          }
        });
      }
    });

    // Refresh layout positions to let ScrollTrigger compute correctly
    // Need longer delay because #main-boutique was just revealed
    setTimeout(() => {
      ScrollTrigger.refresh();
      // After refresh, force-reveal anything already in viewport
      ScrollTrigger.getAll().forEach(t => t.refresh());
    }, 800);
    setTimeout(() => ScrollTrigger.refresh(), 1500);

    // Hero headline word-by-word reveal
    const heroTitle = document.getElementById('main-hero-title');
    if (heroTitle) {
      heroTitle.innerHTML = `
        <span class="inline-block overflow-hidden"><span class="reveal-word inline-block mr-2">Flowers</span></span>
        <span class="inline-block overflow-hidden"><span class="reveal-word inline-block mr-2">That</span></span>
        <span class="inline-block overflow-hidden"><span class="reveal-word inline-block mr-2">Never</span></span>
        <span class="inline-block overflow-hidden"><span class="reveal-word inline-block mr-2">Fade.</span></span>
        <br>
        <span class="inline-block overflow-hidden mt-3">
          <span class="reveal-word inline-block text-primary dark:text-primary-container bg-gradient-to-r from-primary-container/50 to-secondary/40 dark:from-primary/30 dark:to-secondary/20 px-6 py-2 rounded-2xl filter drop-shadow-sm border border-primary/10 shadow-sm text-2xl md:text-4xl font-serif">Memories That Make Forever.</span>
        </span>
      `;
      gsap.from('#main-hero-title .reveal-word', {
        yPercent: 100,
        opacity: 0,
        duration: 1.4,
        stagger: 0.12,
        ease: "power4.out",
        delay: 0.2
      });
    }

    // ── Premium Hero Subtitle Animation ──────────────────────────────
    const subtitleBlock = document.getElementById('hero-subtitle-block');
    const subtitleLine1 = document.getElementById('hero-subtitle-line1');
    const subtitleLine2 = document.getElementById('hero-subtitle-line2');

    if (subtitleBlock && subtitleLine1 && subtitleLine2) {
      // Word-by-word wrapping for Line 1
      const line1Words = subtitleLine1.textContent.trim().split(/\s+/);
      subtitleLine1.innerHTML = line1Words.map(w =>
        `<span class="sub-word inline-block" style="opacity:0;transform:translateY(18px)">${w}</span>`
      ).join(' ');

      // Word-by-word wrapping for Line 2
      const line2Words = subtitleLine2.textContent.trim().split(/\s+/);
      subtitleLine2.innerHTML = line2Words.map(w =>
        `<span class="sub-word2 inline-block" style="opacity:0;transform:translateY(12px)">${w}</span>`
      ).join(' ');

      // GSAP timeline: container fade-up → words cascade in → decos appear → pulse
      const subTl = gsap.timeline({ delay: 1.2 });

      // 1. Fade-up the container
      subTl.to(subtitleBlock, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);

      // 2. Line 1 words stagger in
      subTl.to('#hero-subtitle-line1 .sub-word', {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: 'power3.out'
      }, 0.25);

      // Also reveal line1 itself
      subTl.to(subtitleLine1, { opacity: 1, duration: 0.01 }, 0.24);

      // 3. Line 2 words fade up
      subTl.to('#hero-subtitle-line2 .sub-word2', {
        opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power2.out'
      }, 0.85);
      subTl.to(subtitleLine2, { opacity: 1, duration: 0.01 }, 0.84);

      // 4. Reveal decorative floaters after text is visible
      subTl.to('.hero-deco', {
        opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out'
      }, 1.3);

      // 5. Activate gentle breathing pulse on container
      subTl.call(() => {
        subtitleBlock.classList.add('pulse-active');
      }, [], 2.0);
    }

    // Hero CTA button scale in gently
    const heroCta = document.getElementById('open-box-btn');
    if (heroCta) {
      gsap.from(heroCta, {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "back.out(1.4)",
        delay: 1.1
      });
    }

    // "Why Crochet Flowers" cards staged reveals
    // Use IntersectionObserver as reliable fallback alongside ScrollTrigger
    const whyCrochetCards = document.querySelectorAll('#why-crochet .glass-card');
    whyCrochetCards.forEach(card => { card.style.opacity = '0'; card.style.transform = 'translateY(50px)'; });

    let whyCrochetAnimated = false;
    const animateWhyCrochet = () => {
      if (whyCrochetAnimated) return;
      whyCrochetAnimated = true;
      whyCrochetCards.forEach((card, i) => {
        setTimeout(() => {
          gsap.to(card, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', clearProps: 'transform' });
        }, i * 200);
      });
    };

    const whyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateWhyCrochet();
          whyObserver.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const whySec = document.querySelector('#why-crochet');
    if (whySec) whyObserver.observe(whySec);

    // Also set up ScrollTrigger as bonus animation layer
    ScrollTrigger.create({
      trigger: '#why-crochet',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        animateWhyCrochet();
      }
    });

    // Hover rotate icons for Why cards
    if (!isMobileOrTouch) {
      document.querySelectorAll('#why-crochet .glass-card').forEach(card => {
        const icon = card.querySelector('.material-symbols-outlined');
        if (icon) {
          card.addEventListener('mouseenter', () => {
            gsap.to(icon, { rotate: 12, scale: 1.15, duration: 0.4, ease: "power2.out" });
          });
          card.addEventListener('mouseleave', () => {
            gsap.to(icon, { rotate: 0, scale: 1, duration: 0.4, ease: "power2.out" });
          });
        }
      });
    }

    // Why Choose Us cards entrance
    const whyChooseCards = document.querySelectorAll('.why-choose-card');
    whyChooseCards.forEach(card => { card.style.opacity = '0'; card.style.transform = 'translateY(60px) scale(0.9)'; });

    let whyChooseAnimated = false;
    const animateWhyChoose = () => {
      if (whyChooseAnimated) return;
      whyChooseAnimated = true;
      whyChooseCards.forEach((card, i) => {
        setTimeout(() => {
          gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.2)', clearProps: 'transform' });
        }, i * 150);
      });
    };

    const whyChooseObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateWhyChoose();
          whyChooseObserver.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const whyChooseSec = document.querySelector('#why-choose-us');
    if (whyChooseSec) whyChooseObserver.observe(whyChooseSec);

    // Also set up ScrollTrigger
    ScrollTrigger.create({
      trigger: '#why-choose-us',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        animateWhyChoose();
      }
    });

    // Timeline connecting line draw
    gsap.to('.timeline-path', {
      strokeDashoffset: 0,
      scrollTrigger: {
        trigger: '.timeline-container',
        start: "top 70%",
        end: "bottom 70%",
        scrub: true
      }
    });

    // Timeline items pop in with bounce
    gsap.utils.toArray('.timeline-item').forEach(item => {
      gsap.from(item, {
        opacity: 0,
        scale: 0.85,
        y: 40,
        duration: 1.2,
        ease: "back.out(1.4)",
        scrollTrigger: {
          trigger: item,
          start: "top 75%",
          once: true
        }
      });
    });

    // Same-day delivery path route line tracing & vehicle movement
    const deliveryPath = document.querySelector('.delivery-path-active');
    const scooter = document.querySelector('.delivery-truck');
    if (deliveryPath && scooter) {
      const pathLength = deliveryPath.getTotalLength();
      deliveryPath.style.strokeDasharray = pathLength;
      deliveryPath.style.strokeDashoffset = pathLength;

      ScrollTrigger.create({
        trigger: '#delivery-section',
        start: "top 70%",
        end: "bottom 70%",
        scrub: 1.5,
        onUpdate: (self) => {
          const progress = self.progress;
          deliveryPath.style.strokeDashoffset = pathLength * (1 - progress);
          const point = deliveryPath.getPointAtLength(progress * pathLength);
          gsap.set(scooter, {
            x: point.x,
            y: point.y
          });
        }
      });
    }

    // Story Section mask reveal
    const storyCard = document.getElementById('founder-story-image-card');
    const storyMask = storyCard ? storyCard.querySelector('.story-mask') : null;
    if (storyCard && storyMask) {
      gsap.to(storyMask, {
        scaleX: 0,
        duration: 1.5,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: '#founder',
          start: "top 70%",
          once: true
        }
      });
    }

    // Story Section character heading split
    const storyTitle = document.querySelector('#founder h2');
    if (storyTitle) {
      const text = storyTitle.innerText;
      storyTitle.innerHTML = text.split('').map(char => {
        if (char === ' ') return ' ';
        return `<span class="reveal-char inline-block" style="opacity: 0; transform: translateY(15px);">${char}</span>`;
      }).join('');

      gsap.to('#founder h2 .reveal-char', {
        opacity: 1,
        y: 0,
        stagger: 0.04,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: '#founder h2',
          start: "top 80%",
          once: true
        }
      });
    }

    // Story paragraphs reveal
    document.querySelectorAll('#founder p, #founder h4, #founder .text-primary').forEach(el => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true
        }
      });
    });

    // Instagram Promo scroll animations
    gsap.from('#instagram-promo .instagram-frame-wrapper', {
      opacity: 0,
      x: -60,
      duration: 1.4,
      ease: "power3.out",
      scrollTrigger: {
        trigger: '#instagram-promo',
        start: "top 80%",
        once: true
      }
    });

    gsap.from('#instagram-promo .space-y-8 > *', {
      opacity: 0,
      x: 60,
      stagger: 0.12,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: '#instagram-promo',
        start: "top 80%",
        once: true
      }
    });

    // Follow button soft pulse
    const followBtn = document.querySelector('#instagram-promo .instagram-glow-btn');
    if (followBtn) {
      gsap.to(followBtn, {
        scale: 1.05,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }

    // Footer content reveal
    gsap.from('footer > div > *', {
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: 'footer',
        start: "top 90%",
        once: true
      }
    });

    // Premium Scroll Reveal Animation
    gsap.utils.toArray(".scroll-reveal").forEach(sec => {
      gsap.from(sec, {
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.9,
        ease: "power3.out",
        clearProps: "all",
        scrollTrigger: {
          trigger: sec,
          start: "top 85%",
          once: true
        }
      });
    });
  }

  // --- INSTAGRAM PROMOTION INTERACTION ---

  const instaFrame = document.getElementById('instagram-frame');
  if (instaFrame && !isMobileOrTouch) {
    let lastHeartSpawn = 0;
    
    instaFrame.addEventListener('mousemove', (e) => {
      const rect = instaFrame.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const tiltX = (y / (rect.height / 2)) * -8; // max 8 deg tilt
      const tiltY = (x / (rect.width / 2)) * 8;
      
      gsap.to(instaFrame, {
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 1000,
        duration: 0.3,
        ease: "power2.out"
      });

      // Spawn rising hearts periodically on mouse move
      const now = Date.now();
      if (now - lastHeartSpawn > 180) {
        const emojis = ['❤️', '💕', '💖', '✨', '🌸', '🧶'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const element = document.createElement('div');
        element.innerHTML = emoji;
        element.style.position = 'fixed';
        element.style.left = `${e.clientX}px`;
        element.style.top = `${e.clientY}px`;
        element.style.fontSize = '20px';
        element.style.pointerEvents = 'none';
        element.style.zIndex = '9999';
        document.body.appendChild(element);

        gsap.to(element, {
          y: e.clientY - 120,
          x: e.clientX + (Math.random() - 0.5) * 80,
          opacity: 0,
          scale: 1.5,
          rotation: (Math.random() - 0.5) * 60,
          duration: 1.5,
          ease: "power1.out",
          onComplete: () => element.remove()
        });
        
        lastHeartSpawn = now;
      }
    });
    
    instaFrame.addEventListener('mouseleave', () => {
      gsap.to(instaFrame, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: "power2.out"
      });
    });
  }

  // --- MOUSE FOLLOW GLOW EFFECT ---
  const followGlow = document.getElementById('mouse-follow-glow');
  if (followGlow) {
    if (isMobileOrTouch) {
      followGlow.style.display = 'none';
    } else {
      document.addEventListener('mouseenter', () => {
        followGlow.style.opacity = '1';
      });
      document.addEventListener('mouseleave', () => {
        followGlow.style.opacity = '0';
      });
      document.addEventListener('mousemove', (e) => {
        gsap.to(followGlow, {
          left: e.clientX,
          top: e.clientY,
          duration: 0.8,
          ease: "power2.out"
        });
        if (followGlow.style.opacity === '0' || followGlow.style.opacity === '') {
          followGlow.style.opacity = '1';
        }
      });
    }
  }

  // --- LUXURY CLICK RIPPLE EFFECT ---
  document.body.addEventListener('click', (e) => {
    const target = e.target.closest('button, a, .clickable, .product-card-container, .why-choose-card');
    if (target) {
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '30px';
      ripple.style.height = '30px';
      
      // Ensure target has relative overflow hidden for ripple framing
      const oldPos = target.style.position;
      const oldOverflow = target.style.overflow;
      
      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      // Unified premium click bounce animation
      gsap.to(target, {
        scale: 0.96,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
      
      setTimeout(() => {
        ripple.remove();
        target.style.position = oldPos;
        target.style.overflow = oldOverflow;
      }, 700);
    }
  });

  // --- MAGNETIC BUTTONS INTERACTION ---
  if (!isMobileOrTouch) {
    document.querySelectorAll('.clickable, button, a').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(btn, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1.2, 0.4)"
        });
      });
    });
  }

  // --- INTERACTIVE PRODUCTS AND CARD SWAYS ---
  if (!isMobileOrTouch) {
    document.querySelectorAll('.why-choose-card, #why-crochet .glass-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * -8;
        const rotateY = (x / rect.width) * 8;
        
        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power2.out"
        });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      });
    });
  }

  // Hero bouquet floating yoyo and cursor movement
  const heroBouquetImg = document.getElementById('hero-bouquet-img');
  const heroBouquetContainer = document.getElementById('hero-bouquet-container');
  if (heroBouquetImg) {
    gsap.to(heroBouquetImg, {
      y: -15,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    if (heroBouquetContainer && !isMobileOrTouch) {
      heroBouquetContainer.addEventListener('mousemove', (e) => {
        const rect = heroBouquetContainer.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (y / rect.height) * -12;
        const rotateY = (x / rect.width) * 12;
        
        gsap.to(heroBouquetImg, {
          rotateX: rotateX,
          rotateY: rotateY,
          transformPerspective: 1000,
          duration: 0.4,
          ease: "power2.out"
        });
      });
      heroBouquetContainer.addEventListener('mouseleave', () => {
        gsap.to(heroBouquetImg, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.6,
          ease: "power2.out"
        });
      });
    }
  }

  // --- MOBILE ADMIN SIDEBAR DRAWER CONTROLLER ---
  const adminHamburgerBtn = document.getElementById('admin-hamburger-btn');
  const adminDrawerOverlay = document.getElementById('admin-drawer-overlay');
  const adminAside = document.querySelector('#admin-dashboard-overlay aside');

  function openAdminDrawer() {
    if (adminAside) adminAside.classList.add('active-drawer');
    if (adminDrawerOverlay) {
      adminDrawerOverlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        adminDrawerOverlay.style.opacity = '1';
      });
    }
    // Prevent background scrolling while open
    document.body.style.overflow = 'hidden';
  }

  function closeAdminDrawer() {
    if (adminAside) adminAside.classList.remove('active-drawer');
    if (adminDrawerOverlay) {
      adminDrawerOverlay.style.opacity = '0';
      setTimeout(() => {
        adminDrawerOverlay.classList.add('hidden');
      }, 300);
    }
    // Restore scrolling on close
    document.body.style.overflow = '';
  }

  if (adminHamburgerBtn) {
    adminHamburgerBtn.addEventListener('click', openAdminDrawer);
  }

  if (adminDrawerOverlay) {
    adminDrawerOverlay.addEventListener('click', closeAdminDrawer);
  }

  // Escape key support to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAdminDrawer();
    }
  });

  // Close drawer when selecting any navigation link
  const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
  adminTabBtns.forEach(btn => {
    btn.addEventListener('click', closeAdminDrawer);
  });

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', closeAdminDrawer);
  }

  // --- PREMIUM FULL SCREEN SEARCH OVERLAY CONTROLLER ---
  const searchToggle = document.getElementById('search-toggle');
  const searchOverlay = document.getElementById('search-overlay');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchInput = document.getElementById('search-input');
  const searchStatusMessage = document.getElementById('search-status-message');
  const searchResultsGrid = document.getElementById('search-results-grid');

  function openSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      searchOverlay.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      searchOverlay.classList.add('opacity-100', 'translate-y-0');
    });
    document.body.style.overflow = 'hidden';
    
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.stop === 'function') {
      lenis.stop();
    }

    // Auto-focus search input
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 150);
    }
  }

  function closeSearchOverlay() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('opacity-100', 'translate-y-0');
    searchOverlay.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    document.body.style.overflow = '';
    
    if (typeof lenis !== 'undefined' && lenis && typeof lenis.start === 'function') {
      lenis.start();
    }

    // Clear search query
    if (searchInput) {
      searchInput.value = '';
    }
    renderSearchResults('');

    setTimeout(() => {
      if (searchOverlay.classList.contains('opacity-0')) {
        searchOverlay.classList.add('hidden');
      }
    }, 300);
  }

  function renderSearchResults(query) {
    if (!searchResultsGrid || !searchStatusMessage) return;
    searchResultsGrid.innerHTML = '';

    const cleanQuery = (query || '').trim().toLowerCase();
    if (!cleanQuery) {
      searchStatusMessage.textContent = 'Search your favourite crochet products...';
      return;
    }

    const list = (typeof publicProducts !== 'undefined' && Array.isArray(publicProducts)) ? publicProducts : [];
    // Filter custom order cards out of normal search
    const filtered = list.filter(p => {
      if (p.id === 'custom-order-card' || p._id === 'custom-order-card') return false;
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || p.badge || '').toLowerCase();
      return name.includes(cleanQuery) || cat.includes(cleanQuery);
    });

    if (filtered.length === 0) {
      searchStatusMessage.textContent = 'No products found.';
      return;
    }

    searchStatusMessage.textContent = `Found ${filtered.length} product${filtered.length > 1 ? 's' : ''} matching your search:`;

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'glass-card rounded-2xl p-3 flex flex-col gap-3 cursor-pointer hover:scale-[1.02] transition duration-200';
      
      const priceText = formatPrice(p.price);
      const nameText = p.name || '';
      const badgeText = p.badge || p.category || '';
      const imgUrl = resolveProductPrimaryImage(p);

      card.innerHTML = `
        <div class="aspect-[4/3] rounded-xl overflow-hidden bg-beige/30 flex items-center justify-center relative image-container">
          <img src="" alt="${nameText}" class="w-full h-full object-contain" loading="lazy">
        </div>
        <div class="flex flex-col flex-grow justify-between gap-1.5">
          <div>
            <h4 class="text-xs font-bold text-darkbrown dark:text-beige leading-tight line-clamp-2">${nameText}</h4>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[9px] font-bold uppercase tracking-wider">${badgeText}</span>
          </div>
          <span class="text-xs font-semibold text-primary block mt-auto">${priceText}</span>
        </div>
      `;

      // Load image safely with skeleton shimmer loader
      const imgEl = card.querySelector('img');
      const containerEl = card.querySelector('.image-container');
      safeLoadProductImage(imgEl, imgUrl, p, { container: containerEl });

      // Click card opens details
      card.addEventListener('click', (e) => {
        closeSearchOverlay();
        if (window.innerWidth < 768) {
          openMobileProductDetail(p);
        } else {
          openQuickView(p);
        }
      });

      searchResultsGrid.appendChild(card);
    });
  }

  // Bind Event Listeners
  if (searchToggle) {
    searchToggle.addEventListener('click', openSearchOverlay);
  }
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', closeSearchOverlay);
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  // Escape key support to close search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && !searchOverlay.classList.contains('hidden')) {
      closeSearchOverlay();
    }
  });

  // ─── CUSTOMER REVIEWS (Phase 2 Review Submission UI) ──────────────────────────
  
  // Focus trapping helper
  function initFocusTrap(modalEl) {
    modalEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusableEls = modalEl.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]');
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });
  }

  // 1. Overall Review UI Setup
  const overallRevModal = document.getElementById('overall-review-modal');
  const overallRevForm = document.getElementById('overall-review-form');
  const overallStarsContainer = document.getElementById('overall-stars-container');
  const overallRatingVal = document.getElementById('overall-rating-val');
  const overallRevImagesInput = document.getElementById('overall-rev-images-input');
  const overallRevImagesPreview = document.getElementById('overall-rev-images-preview');
  const overallRevDropzone = document.getElementById('overall-rev-dropzone');
  
  let overallRevImageFiles = [];
  const MAX_REV_IMAGES = 5;
  const MAX_REV_IMG_SIZE_MB = 10;
  
  if (overallRevModal) {
    initFocusTrap(overallRevModal);
  }
  
  function openOverallReviewModal() {
    if (!overallRevModal) return;
    resetOverallReviewForm();
    overallRevModal.classList.remove('hidden');
    setTimeout(() => {
      overallRevModal.classList.add('active');
      document.getElementById('close-overall-review-modal')?.focus();
    }, 50);
  }
  
  function closeOverallReviewModal() {
    if (!overallRevModal) return;
    overallRevModal.classList.remove('active');
    setTimeout(() => {
      overallRevModal.classList.add('hidden');
      resetOverallReviewForm();
    }, 400);
  }
  
  function resetOverallReviewForm() {
    overallRevForm?.reset();
    overallRevImageFiles = [];
    if (overallRatingVal) overallRatingVal.value = '0';
    renderOverallStars(0);
    renderOverallRevPreviews();
    document.getElementById('overall-review-success')?.classList.add('hidden');
    overallRevForm?.classList.remove('hidden');
    const submitBtn = document.getElementById('overall-rev-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      const textEl = document.getElementById('overall-rev-submit-text');
      if (textEl) textEl.textContent = 'Submit Review';
    }
    const progressContainer = document.getElementById('overall-rev-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
  }
  
  function renderOverallStars(rating) {
    if (!overallStarsContainer) return;
    const stars = overallStarsContainer.querySelectorAll('.overall-star-btn');
    stars.forEach((star, idx) => {
      if (idx < rating) {
        star.classList.remove('text-primary/20');
        star.classList.add('text-yellow-400', 'font-bold');
        star.setAttribute('aria-checked', 'true');
      } else {
        star.classList.remove('text-yellow-400', 'font-bold');
        star.classList.add('text-primary/20');
        star.setAttribute('aria-checked', 'false');
      }
    });
  }
  
  overallStarsContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('.overall-star-btn');
    if (!btn) return;
    const val = parseInt(btn.getAttribute('data-value'), 10);
    if (overallRatingVal) overallRatingVal.value = val.toString();
    renderOverallStars(val);
  });
  
  function renderOverallRevPreviews() {
    if (!overallRevImagesPreview) return;
    overallRevImagesPreview.innerHTML = '';
    overallRevImageFiles.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const wrapper = document.createElement('div');
      wrapper.className = 'relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 group';
      wrapper.innerHTML = `
        <img src="${url}" class="w-full h-full object-contain bg-beige/30" loading="lazy">
        <button type="button" class="remove-rev-img absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
          ✕
        </button>`;
      wrapper.querySelector('.remove-rev-img').addEventListener('click', (e) => {
        e.stopPropagation();
        overallRevImageFiles.splice(idx, 1);
        renderOverallRevPreviews();
      });
      overallRevImagesPreview.appendChild(wrapper);
    });
  }
  
  function handleOverallRevFiles(files) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} format is not supported (JPG/PNG/WEBP only) ⚠️`, 'error');
        return;
      }
      if (file.size > MAX_REV_IMG_SIZE_MB * 1024 * 1024) {
        showToast(`${file.name} exceeds 10MB limit ⚠️`, 'error');
        return;
      }
      if (overallRevImageFiles.length >= MAX_REV_IMAGES) {
        showToast('Maximum 5 images allowed 📸', 'error');
        return;
      }
      overallRevImageFiles.push(file);
    });
    renderOverallRevPreviews();
  }
  
  overallRevImagesInput?.addEventListener('change', (e) => {
    handleOverallRevFiles(e.target.files);
    e.target.value = '';
  });
  
  overallRevDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    overallRevDropzone.classList.add('drag-over', 'border-primary/60');
  });
  overallRevDropzone?.addEventListener('dragleave', () => {
    overallRevDropzone.classList.remove('drag-over', 'border-primary/60');
  });
  overallRevDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    overallRevDropzone.classList.remove('drag-over', 'border-primary/60');
    handleOverallRevFiles(e.dataTransfer.files);
  });
  
  document.getElementById('open-overall-review-btn')?.addEventListener('click', openOverallReviewModal);
  document.getElementById('close-overall-review-modal')?.addEventListener('click', closeOverallReviewModal);
  document.getElementById('cancel-overall-review-btn')?.addEventListener('click', closeOverallReviewModal);
  document.getElementById('success-close-overall-btn')?.addEventListener('click', closeOverallReviewModal);
  
  overallRevModal?.addEventListener('click', (e) => {
    if (e.target === overallRevModal) closeOverallReviewModal();
  });
  
  overallRevForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('overall-rev-name')?.value.trim();
    const email = document.getElementById('overall-rev-email')?.value.trim();
    const rating = overallRatingVal ? parseInt(overallRatingVal.value, 10) : 0;
    const review = document.getElementById('overall-rev-text')?.value.trim();
    
    if (rating === 0) { showToast('Please select a rating star 🌟', 'error'); return; }
    if (!name) { showToast('Please enter your name 👤', 'error'); return; }
    if (!review) { showToast('Please write your review text 💬', 'error'); return; }
    
    const submitBtn = document.getElementById('overall-rev-submit-btn');
    const submitText = document.getElementById('overall-rev-submit-text');
    const progressContainer = document.getElementById('overall-rev-progress-container');
    const progressBar = document.getElementById('overall-rev-progress-bar');
    const progressPercent = document.getElementById('overall-rev-progress-percent');
    const progressStatus = document.getElementById('overall-rev-progress-status');
    
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading review photos...';
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Submitting...';
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email || '');
      formData.append('rating', rating.toString());
      formData.append('review', review);
      overallRevImageFiles.forEach(file => formData.append('images', file));
      
      const onProgress = (percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (percent === 100 && progressStatus) {
          progressStatus.textContent = 'Processing on Cloudinary... ☁️';
        }
      };
      
      await BackendAPI.submitOverallReview(formData, onProgress);
      if (progressContainer) progressContainer.classList.add('hidden');
      
      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.75 }, colors: ['#B58A6A', '#FADADD', '#E7D7FF', '#F5E6D3'] });
      }
      
      overallRevForm.classList.add('hidden');
      document.getElementById('overall-review-success')?.classList.remove('hidden');
      
    } catch (err) {
      if (progressContainer) progressContainer.classList.add('hidden');
      showToast(`Failed to submit review: ${err.message || 'Please try again'} ⚠️`, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Submit Review';
    }
  });

  // 2. Product Review UI Setup
  const productRevModal = document.getElementById('product-review-modal');
  const productRevForm = document.getElementById('product-review-form');
  const productStarsContainer = document.getElementById('product-stars-container');
  const productRatingVal = document.getElementById('product-rating-val');
  const productRevImagesInput = document.getElementById('product-rev-images-input');
  const productRevImagesPreview = document.getElementById('product-rev-images-preview');
  const productRevDropzone = document.getElementById('product-rev-dropzone');
  
  let productRevImageFiles = [];
  
  if (productRevModal) {
    initFocusTrap(productRevModal);
  }
  
  function openProductReviewModal() {
    if (!productRevModal) return;
    resetProductReviewForm();
    
    // Auto attach product details
    const activeProd = (window.innerWidth < 768) ? currentMobileProduct : currentDesktopProduct;
    if (!activeProd) {
      showToast('No active product found to review ⚠️', 'error');
      return;
    }
    
    const inputId = document.getElementById('product-rev-id');
    if (inputId) inputId.value = activeProd._id || activeProd.id || '';
    const subtitle = document.getElementById('product-rev-subtitle');
    if (subtitle) subtitle.textContent = `Review for: ${activeProd.title || activeProd.name}`;
    
    productRevModal.classList.remove('hidden');
    setTimeout(() => {
      productRevModal.classList.add('active');
      document.getElementById('close-product-review-modal')?.focus();
    }, 50);
  }
  
  function closeProductReviewModal() {
    if (!productRevModal) return;
    productRevModal.classList.remove('active');
    setTimeout(() => {
      productRevModal.classList.add('hidden');
      resetProductReviewForm();
    }, 400);
  }
  
  function resetProductReviewForm() {
    productRevForm?.reset();
    productRevImageFiles = [];
    if (productRatingVal) productRatingVal.value = '0';
    renderProductStars(0);
    renderProductRevPreviews();
    document.getElementById('product-review-success')?.classList.add('hidden');
    productRevForm?.classList.remove('hidden');
    const submitBtn = document.getElementById('product-rev-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      const textEl = document.getElementById('product-rev-submit-text');
      if (textEl) textEl.textContent = 'Submit Review';
    }
    const progressContainer = document.getElementById('product-rev-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
  }
  
  function renderProductStars(rating) {
    if (!productStarsContainer) return;
    const stars = productStarsContainer.querySelectorAll('.product-star-btn');
    stars.forEach((star, idx) => {
      if (idx < rating) {
        star.classList.remove('text-primary/20');
        star.classList.add('text-yellow-400', 'font-bold');
        star.setAttribute('aria-checked', 'true');
      } else {
        star.classList.remove('text-yellow-400', 'font-bold');
        star.classList.add('text-primary/20');
        star.setAttribute('aria-checked', 'false');
      }
    });
  }
  
  productStarsContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-star-btn');
    if (!btn) return;
    const val = parseInt(btn.getAttribute('data-value'), 10);
    if (productRatingVal) productRatingVal.value = val.toString();
    renderProductStars(val);
  });
  
  function renderProductRevPreviews() {
    if (!productRevImagesPreview) return;
    productRevImagesPreview.innerHTML = '';
    productRevImageFiles.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const wrapper = document.createElement('div');
      wrapper.className = 'relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 group';
      wrapper.innerHTML = `
        <img src="${url}" class="w-full h-full object-contain bg-beige/30" loading="lazy">
        <button type="button" class="remove-product-rev-img absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
          ✕
        </button>`;
      wrapper.querySelector('.remove-product-rev-img').addEventListener('click', (e) => {
        e.stopPropagation();
        productRevImageFiles.splice(idx, 1);
        renderProductRevPreviews();
      });
      productRevImagesPreview.appendChild(wrapper);
    });
  }
  
  function handleProductRevFiles(files) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    Array.from(files).forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name} format is not supported (JPG/PNG/WEBP only) ⚠️`, 'error');
        return;
      }
      if (file.size > MAX_REV_IMG_SIZE_MB * 1024 * 1024) {
        showToast(`${file.name} exceeds 10MB limit ⚠️`, 'error');
        return;
      }
      if (productRevImageFiles.length >= MAX_REV_IMAGES) {
        showToast('Maximum 5 images allowed 📸', 'error');
        return;
      }
      productRevImageFiles.push(file);
    });
    renderProductRevPreviews();
  }
  
  productRevImagesInput?.addEventListener('change', (e) => {
    handleProductRevFiles(e.target.files);
    e.target.value = '';
  });
  
  productRevDropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    productRevDropzone.classList.add('drag-over', 'border-primary/60');
  });
  productRevDropzone?.addEventListener('dragleave', () => {
    productRevDropzone.classList.remove('drag-over', 'border-primary/60');
  });
  productRevDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    productRevDropzone.classList.remove('drag-over', 'border-primary/60');
    handleProductRevFiles(e.dataTransfer.files);
  });
  
  document.getElementById('write-product-review-btn')?.addEventListener('click', openProductReviewModal);
  document.getElementById('write-product-review-btn-mob')?.addEventListener('click', openProductReviewModal);
  document.getElementById('close-product-review-modal')?.addEventListener('click', closeProductReviewModal);
  document.getElementById('cancel-product-review-btn')?.addEventListener('click', closeProductReviewModal);
  document.getElementById('success-close-product-btn')?.addEventListener('click', closeProductReviewModal);
  
  productRevModal?.addEventListener('click', (e) => {
    if (e.target === productRevModal) closeProductReviewModal();
  });
  
  productRevForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('product-rev-id')?.value;
    const name = document.getElementById('product-rev-name')?.value.trim();
    const email = document.getElementById('product-rev-email')?.value.trim();
    const rating = productRatingVal ? parseInt(productRatingVal.value, 10) : 0;
    const review = document.getElementById('product-rev-text')?.value.trim();
    
    if (!productId) { showToast('Missing product identification ⚠️', 'error'); return; }
    if (rating === 0) { showToast('Please select a rating star 🌟', 'error'); return; }
    if (!name) { showToast('Please enter your name 👤', 'error'); return; }
    if (!review) { showToast('Please write your review text 💬', 'error'); return; }
    
    const submitBtn = document.getElementById('product-rev-submit-btn');
    const submitText = document.getElementById('product-rev-submit-text');
    const progressContainer = document.getElementById('product-rev-progress-container');
    const progressBar = document.getElementById('product-rev-progress-bar');
    const progressPercent = document.getElementById('product-rev-progress-percent');
    const progressStatus = document.getElementById('product-rev-progress-status');
    
    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
    if (progressStatus) progressStatus.textContent = 'Uploading review photos...';
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Submitting...';
    
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('name', name);
      formData.append('email', email || '');
      formData.append('rating', rating.toString());
      formData.append('review', review);
      productRevImageFiles.forEach(file => formData.append('images', file));
      
      const onProgress = (percent) => {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (percent === 100 && progressStatus) {
          progressStatus.textContent = 'Processing on Cloudinary... ☁️';
        }
      };
      
      await BackendAPI.submitProductReview(formData, onProgress);
      if (progressContainer) progressContainer.classList.add('hidden');
      
      if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.75 }, colors: ['#B58A6A', '#FADADD', '#E7D7FF', '#F5E6D3'] });
      }
      
      productRevForm.classList.add('hidden');
      document.getElementById('product-review-success')?.classList.remove('hidden');
      
    } catch (err) {
      if (progressContainer) progressContainer.classList.add('hidden');
      showToast(`Failed to submit review: ${err.message || 'Please try again'} ⚠️`, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Submit Review';
    }
  });

  // 3. Accordions toggling logic inside quick view
  const qvReviewsToggle = document.getElementById('qv-reviews-toggle-btn');
  const qvReviewsPanel = document.getElementById('qv-reviews-panel');
  const qvReviewsArrow = document.getElementById('qv-reviews-arrow');
  
  qvReviewsToggle?.addEventListener('click', () => {
    if (!qvReviewsPanel || !qvReviewsArrow) return;
    const isExpanded = qvReviewsToggle.getAttribute('aria-expanded') === 'true';
    qvReviewsToggle.setAttribute('aria-expanded', !isExpanded);
    if (isExpanded) {
      qvReviewsPanel.classList.add('hidden');
      qvReviewsArrow.textContent = '▼';
    } else {
      qvReviewsPanel.classList.remove('hidden');
      qvReviewsArrow.textContent = '▲';
    }
  });

  const mobReviewsToggle = document.getElementById('mob-reviews-toggle-btn');
  const mobReviewsPanel = document.getElementById('mob-reviews-panel');
  const mobReviewsArrow = document.getElementById('mob-reviews-arrow');
  
  mobReviewsToggle?.addEventListener('click', () => {
    if (!mobReviewsPanel || !mobReviewsArrow) return;
    const isExpanded = mobReviewsToggle.getAttribute('aria-expanded') === 'true';
    mobReviewsToggle.setAttribute('aria-expanded', !isExpanded);
    if (isExpanded) {
      mobReviewsPanel.classList.add('hidden');
      mobReviewsArrow.textContent = '▼';
    } else {
      mobReviewsPanel.classList.remove('hidden');
      mobReviewsArrow.textContent = '▲';
    }
  });

  // ESC key support to close active review modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (overallRevModal && !overallRevModal.classList.contains('hidden')) {
        closeOverallReviewModal();
      }
      if (productRevModal && !productRevModal.classList.contains('hidden')) {
        closeProductReviewModal();
      }
    }
  });

  // ─── REVIEW DISPLAY SYSTEM (Phase 2 Review Rendering & Display) ───────────

  let cacheOverallReviews = null;
  const cacheProductReviews = {}; // productId -> reviews array

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function getRelativeTimeString(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (isNaN(date.getTime())) return 'Recently';
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const verifiedBadge = `
    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
      <span class="material-symbols-outlined text-[10px] font-bold">verified</span> Verified Buyer
    </span>`;

  function generateStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        html += '★';
      } else {
        html += '<span class="text-primary/20">★</span>';
      }
    }
    return html;
  }

  function createReviewCardHTML(review) {
    const relativeTime = getRelativeTimeString(review.createdAt);
    const starsHTML = generateStarsHTML(review.rating);
    
    let galleryHTML = '';
    if (review.images && review.images.length > 0) {
      galleryHTML = `
        <div class="flex gap-2 flex-wrap mt-3">
          ${review.images.map(img => `
            <div class="w-16 h-16 rounded-xl overflow-hidden border border-primary/10 cursor-zoom-in hover:scale-105 active:scale-95 transition duration-200 shadow-sm relative">
              <img src="${img.url || img}" class="w-full h-full object-cover review-gallery-img" loading="lazy" alt="Review photo">
            </div>
          `).join('')}
        </div>
      `;
    }
    
    return `
      <div class="glass-card p-5 rounded-3xl relative flex flex-col justify-between shadow-sm border border-primary/5 hover:shadow-md transition-shadow duration-300">
        <div class="space-y-3">
          <div class="flex justify-between items-center gap-2">
            <div class="flex items-center gap-0.5 text-sm text-yellow-400">
              ${starsHTML}
            </div>
            <span class="text-[10px] text-primary/50 font-medium">${relativeTime}</span>
          </div>
          
          <p class="text-xs text-primary/80 leading-relaxed font-medium whitespace-pre-wrap">${escapeHTML(review.review)}</p>
          
          ${galleryHTML}
        </div>
        
        <div class="flex items-center gap-3 pt-4 border-t border-primary/5 mt-4">
          <div class="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center font-bold text-xs text-primary">
            ${(review.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div class="flex flex-col">
            <span class="text-xs font-bold text-darkbrown dark:text-beige leading-none mb-1">${escapeHTML(review.name)}</span>
            ${verifiedBadge}
          </div>
        </div>
      </div>
    `;
  }

  // Load and Render Overall reviews
  async function loadOverallReviews() {
    const gridEl = document.getElementById('overall-reviews-grid');
    const emptyEl = document.getElementById('overall-reviews-empty');
    const statsEl = document.getElementById('overall-rating-stats');
    const viewAllBtn = document.getElementById('view-all-reviews-btn');
    
    if (!gridEl) return;
    
    try {
      if (!cacheOverallReviews) {
        cacheOverallReviews = await BackendAPI.getOverallReviews();
      }
      
      const approved = cacheOverallReviews.filter(r => r.status === 'approved');
      const count = approved.length;
      
      if (count === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        gridEl.classList.add('hidden');
        statsEl?.classList.add('hidden');
        viewAllBtn?.classList.add('hidden');
        return;
      }
      
      // Calculate Stats
      const totalRating = approved.reduce((sum, r) => sum + r.rating, 0);
      const avg = (totalRating / count).toFixed(1);
      
      // Populate Stats
      if (statsEl) {
        statsEl.classList.remove('hidden');
        const avgEl = document.getElementById('overall-avg-rating');
        const countEl = document.getElementById('overall-total-count');
        const starsEl = document.getElementById('overall-agg-stars');
        
        if (avgEl) avgEl.textContent = avg;
        if (countEl) countEl.textContent = count.toString();
        if (starsEl) starsEl.innerHTML = generateStarsHTML(Math.round(parseFloat(avg)));
      }
      
      if (emptyEl) emptyEl.classList.add('hidden');
      gridEl.classList.remove('hidden');
      gridEl.innerHTML = '';
      
      // Render first 3 reviews on homepage
      const homepageReviews = approved.slice(0, 3);
      homepageReviews.forEach(rev => {
        gridEl.innerHTML += createReviewCardHTML(rev);
      });
      
      // Show/Hide View All Button
      if (count > 3 && viewAllBtn) {
        viewAllBtn.classList.remove('hidden');
      } else {
        viewAllBtn?.classList.add('hidden');
      }
      
    } catch (err) {
      console.error('Failed to load overall reviews:', err);
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }

  // View All Reviews Modal Setup
  const viewAllModal = document.getElementById('view-all-reviews-modal');
  const viewAllCloseBtn = document.getElementById('close-view-all-reviews-modal');
  const allReviewsListContainer = document.getElementById('all-reviews-list-container');
  
  if (viewAllModal) {
    initFocusTrap(viewAllModal);
  }

  function openViewAllModal() {
    if (!viewAllModal || !allReviewsListContainer || !cacheOverallReviews) return;
    
    allReviewsListContainer.innerHTML = '';
    const approved = cacheOverallReviews.filter(r => r.status === 'approved');
    
    // Grid of all reviews in modal
    const wrapperGrid = document.createElement('div');
    wrapperGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    
    approved.forEach(rev => {
      wrapperGrid.innerHTML += createReviewCardHTML(rev);
    });
    
    allReviewsListContainer.appendChild(wrapperGrid);
    
    viewAllModal.classList.remove('hidden');
    setTimeout(() => {
      viewAllModal.classList.add('active');
      viewAllCloseBtn?.focus();
    }, 50);
  }

  function closeViewAllModal() {
    if (!viewAllModal) return;
    viewAllModal.classList.remove('active');
    setTimeout(() => viewAllModal.classList.add('hidden'), 400);
  }

  document.getElementById('view-all-reviews-btn')?.addEventListener('click', openViewAllModal);
  viewAllCloseBtn?.addEventListener('click', closeViewAllModal);
  viewAllModal?.addEventListener('click', (e) => {
    if (e.target === viewAllModal) closeViewAllModal();
  });

  // ESC key support to close view all modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewAllModal && !viewAllModal.classList.contains('hidden')) {
      closeViewAllModal();
    }
  });

  // Product reviews rendering
  async function loadProductReviews(productId, panelEl) {
    if (!panelEl) return;
    
    panelEl.innerHTML = `
      <div class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    `;
    
    try {
      if (!cacheProductReviews[productId]) {
        cacheProductReviews[productId] = await BackendAPI.getProductReviews(productId);
      }
      
      const approved = cacheProductReviews[productId].filter(r => r.status === 'approved');
      const count = approved.length;
      
      if (count === 0) {
        panelEl.innerHTML = `
          <div class="flex flex-col items-center justify-center py-6 text-center space-y-3">
            <p class="text-primary/70 dark:text-beige/70 font-semibold text-xs">No Reviews Yet</p>
            <p class="text-[11px] text-primary/50 font-medium">Be the first to review this product.</p>
            <button type="button" class="write-product-review-trigger px-5 py-2 rounded-full bg-primary text-white font-bold text-xs hover:bg-primary/90 hover:scale-105 active:scale-95 duration-300 shadow-sm clickable">
              Write Review
            </button>
          </div>
        `;
      } else {
        const totalRating = approved.reduce((sum, r) => sum + r.rating, 0);
        const avg = (totalRating / count).toFixed(1);
        
        const cardsHTML = approved.map(rev => createReviewCardHTML(rev)).join('');
        
        panelEl.innerHTML = `
          <div class="space-y-4">
            <!-- Aggregate Stats -->
            <div class="flex items-center justify-between border-b border-primary/10 pb-3 flex-wrap gap-2">
              <div class="flex items-center gap-1.5">
                <div class="flex items-center text-yellow-400 text-xs gap-0.5">
                  ${generateStarsHTML(Math.round(parseFloat(avg)))}
                </div>
                <span class="font-bold text-darkbrown dark:text-beige text-xs">${avg} / 5.0 (${count} reviews)</span>
              </div>
              <button type="button" class="write-product-review-trigger px-4 py-1.5 rounded-full bg-primary text-white font-bold text-[11px] hover:bg-primary/90 hover:scale-105 active:scale-95 duration-200 shadow-sm clickable">
                Write Review
              </button>
            </div>
            
            <!-- Scrollable Reviews List -->
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              ${cardsHTML}
            </div>
          </div>
        `;
      }
      
      // Wire up write review button click listeners dynamically
      panelEl.querySelectorAll('.write-product-review-trigger').forEach(btn => {
        btn.addEventListener('click', openProductReviewModal);
      });
      
    } catch (err) {
      console.error('Failed to load product reviews:', err);
      panelEl.innerHTML = `
        <div class="text-center py-4 text-xs text-red-500 font-medium">
          Failed to load reviews. Please try again.
        </div>
      `;
    }
  }

  // Handle accordion toggle clicks and load reviews on demand
  const desktopToggle = document.getElementById('qv-reviews-toggle-btn');
  const desktopPanel = document.getElementById('qv-reviews-panel');
  desktopToggle?.addEventListener('click', () => {
    const isExpanded = desktopToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded && currentDesktopProduct) {
      const pId = currentDesktopProduct._id || currentDesktopProduct.id;
      if (pId) loadProductReviews(pId, desktopPanel);
    }
  });

  const mobileToggle = document.getElementById('mob-reviews-toggle-btn');
  const mobilePanel = document.getElementById('mob-reviews-panel');
  mobileToggle?.addEventListener('click', () => {
    const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded && currentMobileProduct) {
      const pId = currentMobileProduct._id || currentMobileProduct.id;
      if (pId) loadProductReviews(pId, mobilePanel);
    }
  });

  // Event Delegation for review gallery image clicks
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.review-gallery-img');
    if (img) {
      openLightbox(img.src);
    }
  });

  // Bust cache and reload reviews on successful submission
  document.getElementById('success-close-overall-btn')?.addEventListener('click', () => {
    cacheOverallReviews = null;
    loadOverallReviews();
  });
  
  document.getElementById('success-close-product-btn')?.addEventListener('click', () => {
    const activeProd = (window.innerWidth < 768) ? currentMobileProduct : currentDesktopProduct;
    if (activeProd) {
      const pId = activeProd._id || activeProd.id;
      if (pId) {
        delete cacheProductReviews[pId];
        const panel = (window.innerWidth < 768) ? mobilePanel : desktopPanel;
        loadProductReviews(pId, panel);
      }
    }
  });

  // Cross-browser idle task runner
  const runWhenIdle = (fn, fallbackMs = 400) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(fn);
    } else {
      setTimeout(fn, fallbackMs);
    }
  };

  // Fetch overall reviews when main thread is idle after critical initial render
  runWhenIdle(() => {
    loadOverallReviews();
  });

  // ─── ADMIN REVIEWS MANAGEMENT SYSTEM ───────────────────────────────────────

  let adminOverallReviewsPending = [];
  let adminOverallReviewsApproved = [];
  let adminProductReviewsPending = [];
  let adminProductReviewsApproved = [];

  let currentReviewsTab = 'overall';  // 'overall' | 'product'
  let currentReviewsSubtab = 'pending'; // 'pending' | 'approved'
  let adminReviewsSearchVal = '';
  let adminReviewsFilterStars = 'all';
  let adminReviewsFilterSort = 'newest';
  let adminReviewsPage = 1;
  const ADMIN_REVIEWS_PER_PAGE = 25;

  async function loadAdminReviewsDashboard() {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;

    try {
      const [pendingOverall, approvedOverall, pendingProduct, approvedProduct] = await Promise.all([
        BackendAPI.getPendingOverallReviewsAdmin(token),
        BackendAPI.getApprovedOverallReviewsAdmin(token),
        BackendAPI.getPendingProductReviewsAdmin(token),
        BackendAPI.getApprovedProductReviewsAdmin(token)
      ]);

      adminOverallReviewsPending = pendingOverall;
      adminOverallReviewsApproved = approvedOverall;
      adminProductReviewsPending = pendingProduct;
      adminProductReviewsApproved = approvedProduct;

      // Update Statistic counters
      const statPending = document.getElementById('stat-pending-reviews');
      const statApproved = document.getElementById('stat-approved-reviews');
      const statProduct = document.getElementById('stat-product-reviews');
      const statOverall = document.getElementById('stat-overall-reviews');

      if (statPending) statPending.textContent = (pendingOverall.length + pendingProduct.length).toString();
      if (statApproved) statApproved.textContent = (approvedOverall.length + approvedProduct.length).toString();
      if (statProduct) statProduct.textContent = (pendingProduct.length + approvedProduct.length).toString();
      if (statOverall) statOverall.textContent = (pendingOverall.length + approvedOverall.length).toString();

      filterAndRenderAdminReviews();

    } catch (e) {
      console.error('Failed to load admin reviews dashboard:', e);
      showToast('Failed to load review records! ⚠️', 'error');
    }
  }

  function filterAndRenderAdminReviews() {
    const gridEl = document.getElementById('admin-reviews-grid');
    const emptyEl = document.getElementById('admin-reviews-empty');
    const loadMoreContainer = document.getElementById('admin-reviews-loadmore-container');
    
    if (!gridEl) return;

    // Select source array
    let source = [];
    if (currentReviewsTab === 'overall') {
      source = (currentReviewsSubtab === 'pending') ? adminOverallReviewsPending : adminOverallReviewsApproved;
    } else {
      source = (currentReviewsSubtab === 'pending') ? adminProductReviewsPending : adminProductReviewsApproved;
    }

    // Apply Search
    let filtered = [...source];
    if (adminReviewsSearchVal) {
      const query = adminReviewsSearchVal.toLowerCase();
      filtered = filtered.filter(r => {
        const name = (r.name || '').toLowerCase();
        const email = (r.email || '').toLowerCase();
        const review = (r.review || '').toLowerCase();
        const prodTitle = (r.productTitle || '').toLowerCase();
        return name.includes(query) || email.includes(query) || review.includes(query) || prodTitle.includes(query);
      });
    }

    // Apply Stars Filter
    if (adminReviewsFilterStars !== 'all') {
      const starRating = parseInt(adminReviewsFilterStars, 10);
      filtered = filtered.filter(r => r.rating === starRating);
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return adminReviewsFilterSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const totalFiltered = filtered.length;

    if (totalFiltered === 0) {
      gridEl.innerHTML = '';
      gridEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      loadMoreContainer?.classList.add('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    gridEl.classList.remove('hidden');

    // Pagination bounds
    const endIdx = adminReviewsPage * ADMIN_REVIEWS_PER_PAGE;
    const paginated = filtered.slice(0, endIdx);

    gridEl.innerHTML = '';
    paginated.forEach(rev => {
      gridEl.innerHTML += createAdminReviewCardHTML(rev);
    });

    // Wire up actions dynamically
    gridEl.querySelectorAll('.admin-rev-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => handleApproveReview(btn.getAttribute('data-id')));
    });
    gridEl.querySelectorAll('.admin-rev-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => handleRejectReview(btn.getAttribute('data-id')));
    });
    gridEl.querySelectorAll('.admin-rev-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteReview(btn.getAttribute('data-id')));
    });

    // Show/hide load more
    if (totalFiltered > endIdx && loadMoreContainer) {
      loadMoreContainer.classList.remove('hidden');
    } else {
      loadMoreContainer?.classList.add('hidden');
    }
  }

  function createAdminReviewCardHTML(rev) {
    const isApproved = rev.status === 'approved';
    const isProduct = !!rev.productId;
    const dateStr = getRelativeTimeString(rev.createdAt);
    const starsHTML = generateStarsHTML(rev.rating);
    
    // Status Badge
    let statusBadge = '';
    if (rev.status === 'pending') {
      statusBadge = `<span class="px-2.5 py-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full uppercase">Pending</span>`;
    } else if (rev.status === 'approved') {
      statusBadge = `<span class="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full uppercase">Approved</span>`;
    } else {
      statusBadge = `<span class="px-2.5 py-1 text-[10px] font-bold bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full uppercase">Rejected</span>`;
    }

    // Images gallery
    let galleryHTML = '';
    if (rev.images && rev.images.length > 0) {
      galleryHTML = `
        <div class="flex gap-2 flex-wrap mt-3">
          ${rev.images.map(img => `
            <div class="w-14 h-14 rounded-xl overflow-hidden border border-primary/10 cursor-zoom-in hover:scale-105 transition duration-200 shadow-sm relative">
              <img src="${img.url || img}" class="w-full h-full object-cover review-gallery-img" loading="lazy" alt="Review photo">
            </div>
          `).join('')}
        </div>
      `;
    }

    // Action buttons area
    let actionsArea = '';
    if (rev.status === 'pending') {
      actionsArea = `
        <div class="flex flex-wrap gap-2 pt-4 border-t border-primary/5 mt-4">
          <button class="admin-rev-approve-btn flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition clickable" data-id="${rev._id || rev.id}">
            Approve
          </button>
          <button class="admin-rev-reject-btn flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition clickable" data-id="${rev._id || rev.id}">
            Reject
          </button>
          <button class="admin-rev-delete-btn px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs transition clickable" data-id="${rev._id || rev.id}" title="Delete Review">
            Delete
          </button>
        </div>
      `;
    } else {
      actionsArea = `
        <div class="flex gap-2 pt-4 border-t border-primary/5 mt-4">
          <button class="admin-rev-delete-btn w-full py-2.5 rounded-xl border-2 border-red-100 hover:border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs transition clickable flex items-center justify-center gap-2" data-id="${rev._id || rev.id}">
            <span class="material-symbols-outlined text-sm">delete</span> Delete Review
          </button>
        </div>
      `;
    }

    const emailHTML = rev.email ? `<p class="text-[10px] text-primary/60 font-medium lowercase truncate">${escapeHTML(rev.email)}</p>` : '';
    const prodHTML = isProduct ? `<div class="bg-primary-container/20 text-on-primary-container px-3 py-1.5 rounded-xl text-[10px] font-bold border border-primary/5 mb-3 flex items-center gap-1.5 truncate"><span>🛍️</span> ${escapeHTML(rev.productTitle || 'Product Review')}</div>` : '';

    return `
      <div class="glass-card p-5 rounded-[2rem] flex flex-col justify-between shadow-sm border border-primary/5 hover:shadow-md transition-shadow duration-300">
        <div>
          <!-- Title & Status -->
          <div class="flex justify-between items-start gap-2 mb-3">
            <div class="flex items-center text-yellow-400 text-sm gap-0.5">${starsHTML}</div>
            ${statusBadge}
          </div>

          <!-- Product Name Context -->
          ${prodHTML}

          <!-- Review text -->
          <p class="text-xs text-primary/80 leading-relaxed font-medium mb-4 whitespace-pre-wrap">${escapeHTML(rev.review)}</p>

          <!-- Images -->
          ${galleryHTML}
        </div>

        <div>
          <!-- Reviewer -->
          <div class="flex items-center gap-3 pt-4 border-t border-primary/5 mt-4">
            <div class="w-8 h-8 rounded-full bg-primary-container/40 flex items-center justify-center font-bold text-xs text-primary">
              ${(rev.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-darkbrown dark:text-beige truncate leading-none mb-1">${escapeHTML(rev.name)}</p>
              ${emailHTML}
            </div>
            <span class="text-[9px] text-primary/40 font-semibold shrink-0">${dateStr}</span>
          </div>

          <!-- Actions -->
          ${actionsArea}
        </div>
      </div>
    `;
  }

  // Action Handlers
  async function handleApproveReview(id) {
    const token = sessionStorage.getItem('admin_token');
    if (!token || !id) return;

    const confirmed = await showAdminConfirm('Are you sure you want to approve this review and publish it live?');
    if (!confirmed) return;

    try {
      if (currentReviewsTab === 'overall') {
        await BackendAPI.approveOverallReviewAdmin(token, id);
      } else {
        await BackendAPI.approveProductReviewAdmin(token, id);
      }
      showToast('Review approved successfully! ✅', 'success');
      
      // Update local state without reload
      loadAdminReviewsDashboard();
    } catch (err) {
      console.error(err);
      showToast(`Failed to approve review: ${err.message} ⚠️`, 'error');
    }
  }

  async function handleRejectReview(id) {
    const token = sessionStorage.getItem('admin_token');
    if (!token || !id) return;

    const confirmed = await showAdminConfirm('Are you sure you want to reject this review?');
    if (!confirmed) return;

    try {
      if (currentReviewsTab === 'overall') {
        await BackendAPI.rejectOverallReviewAdmin(token, id);
      } else {
        await BackendAPI.rejectProductReviewAdmin(token, id);
      }
      showToast('Review marked as rejected! ❌', 'success');
      loadAdminReviewsDashboard();
    } catch (err) {
      console.error(err);
      showToast(`Failed to reject review: ${err.message} ⚠️`, 'error');
    }
  }

  async function handleDeleteReview(id) {
    const token = sessionStorage.getItem('admin_token');
    if (!token || !id) return;

    const confirmed = await showAdminConfirm('Warning: This action is permanent and will completely delete the review and any associated images. Proceed?');
    if (!confirmed) return;

    try {
      if (currentReviewsTab === 'overall') {
        await BackendAPI.deleteOverallReviewAdmin(token, id);
      } else {
        await BackendAPI.deleteProductReviewAdmin(token, id);
      }
      showToast('Review deleted permanently! 🗑️', 'success');
      loadAdminReviewsDashboard();
    } catch (err) {
      console.error(err);
      showToast(`Failed to delete review: ${err.message} ⚠️`, 'error');
    }
  }

  function showAdminConfirm(message) {
    return new Promise((resolve) => {
      const confirmModal = document.getElementById('admin-confirm-modal');
      const msgEl = document.getElementById('admin-confirm-message');
      const okBtn = document.getElementById('admin-confirm-ok');
      const cancelBtn = document.getElementById('admin-confirm-cancel');
      
      if (!confirmModal || !msgEl || !okBtn || !cancelBtn) {
        resolve(true); // fallback
        return;
      }
      
      msgEl.textContent = message;
      confirmModal.classList.remove('hidden');
      setTimeout(() => {
        confirmModal.classList.add('active');
        okBtn.focus();
      }, 50);
      
      // Focus trapping
      initFocusTrap(confirmModal);
      
      const cleanUp = (result) => {
        confirmModal.classList.remove('active');
        setTimeout(() => confirmModal.classList.add('hidden'), 400);
        
        okBtn.replaceWith(okBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        
        resolve(result);
      };
      
      document.getElementById('admin-confirm-ok').addEventListener('click', () => cleanUp(true));
      document.getElementById('admin-confirm-cancel').addEventListener('click', () => cleanUp(false));
      
      // Close on ESC
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          cleanUp(false);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  // Event Listeners for Filters & Tab Switchers
  const overallTabBtn = document.getElementById('admin-overall-reviews-tab');
  const productTabBtn = document.getElementById('admin-product-reviews-tab');
  const subtabPendingBtn = document.getElementById('admin-subtab-pending');
  const subtabApprovedBtn = document.getElementById('admin-subtab-approved');
  const searchReviewsInput = document.getElementById('admin-reviews-search');
  const starsFilterSelect = document.getElementById('admin-reviews-filter-stars');
  const sortFilterSelect = document.getElementById('admin-reviews-filter-sort');
  const loadMoreBtn = document.getElementById('admin-reviews-loadmore-btn');

  function togglePrimaryTabs(tab) {
    currentReviewsTab = tab;
    adminReviewsPage = 1;
    if (tab === 'overall') {
      overallTabBtn?.classList.add('border-primary', 'text-darkbrown');
      overallTabBtn?.classList.remove('border-transparent', 'text-primary/50');
      productTabBtn?.classList.remove('border-primary', 'text-darkbrown');
      productTabBtn?.classList.add('border-transparent', 'text-primary/50');
    } else {
      productTabBtn?.classList.add('border-primary', 'text-darkbrown');
      productTabBtn?.classList.remove('border-transparent', 'text-primary/50');
      overallTabBtn?.classList.remove('border-primary', 'text-darkbrown');
      overallTabBtn?.classList.add('border-transparent', 'text-primary/50');
    }
    filterAndRenderAdminReviews();
  }

  function toggleSecondaryTabs(subtab) {
    currentReviewsSubtab = subtab;
    adminReviewsPage = 1;
    if (subtab === 'pending') {
      subtabPendingBtn?.classList.add('bg-white', 'text-darkbrown', 'shadow-sm');
      subtabPendingBtn?.classList.remove('text-primary/60');
      subtabApprovedBtn?.classList.remove('bg-white', 'text-darkbrown', 'shadow-sm');
      subtabApprovedBtn?.classList.add('text-primary/60');
    } else {
      subtabApprovedBtn?.classList.add('bg-white', 'text-darkbrown', 'shadow-sm');
      subtabApprovedBtn?.classList.remove('text-primary/60');
      subtabPendingBtn?.classList.remove('bg-white', 'text-darkbrown', 'shadow-sm');
      subtabPendingBtn?.classList.add('text-primary/60');
    }
    filterAndRenderAdminReviews();
  }

  overallTabBtn?.addEventListener('click', () => togglePrimaryTabs('overall'));
  productTabBtn?.addEventListener('click', () => togglePrimaryTabs('product'));
  subtabPendingBtn?.addEventListener('click', () => toggleSecondaryTabs('pending'));
  subtabApprovedBtn?.addEventListener('click', () => toggleSecondaryTabs('approved'));

  searchReviewsInput?.addEventListener('input', (e) => {
    adminReviewsSearchVal = e.target.value.trim();
    adminReviewsPage = 1;
    filterAndRenderAdminReviews();
  });

  starsFilterSelect?.addEventListener('change', (e) => {
    adminReviewsFilterStars = e.target.value;
    adminReviewsPage = 1;
    filterAndRenderAdminReviews();
  });

  sortFilterSelect?.addEventListener('change', (e) => {
    adminReviewsFilterSort = e.target.value;
    adminReviewsPage = 1;
    filterAndRenderAdminReviews();
  });

  loadMoreBtn?.addEventListener('click', () => {
    adminReviewsPage++;
    filterAndRenderAdminReviews();
  });

  // Initialize wishlist states
  updateWishlistUI();
});



