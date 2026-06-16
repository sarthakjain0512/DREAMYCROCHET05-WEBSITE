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


document.addEventListener('DOMContentLoaded', () => {
  // --- TOAST NOTIFICATIONS ---
  const toastContainer = document.getElementById('toast-container');
  
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '🌸';
    if (type === 'success') icon = '✨';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
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

  // --- PREMIUM CURSOR COMPANION ---
  let refreshCursorHovers = () => {};

  // Check touch devices & reduced motion
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const companion = document.getElementById('cursor-companion');

  if (companion && !isTouchDevice && !prefersReducedMotion) {
    companion.style.display = 'block';
    
    const yarnBall = companion.querySelector('.yarn-ball-svg-wrapper');
    const flower = companion.querySelector('.flower-svg-wrapper');
    
    let mouse = { x: 0, y: 0 };
    let pos = { x: 0, y: 0 };
    const speed = 0.15;
    
    let xSetter = gsap.quickSetter(companion, "x", "px");
    let ySetter = gsap.quickSetter(companion, "y", "px");
    
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    
    gsap.ticker.add(() => {
      const dt = 1.0 - Math.pow(1.0 - speed, gsap.ticker.deltaRatio());
      pos.x += (mouse.x - pos.x) * dt;
      pos.y += (mouse.y - pos.y) * dt;
      
      const time = gsap.ticker.time;
      const floatX = Math.sin(time * 3) * 2;
      const floatY = Math.cos(time * 2.5) * 3;
      
      xSetter(pos.x + floatX);
      ySetter(pos.y + floatY);
    });

    // Unified Hover Animations
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

    refreshCursorHovers = () => {
      // Select hoverable elements
      const targets = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .clickable, .product-card-container, .why-choose-card, img');
      targets.forEach(el => {
        el.removeEventListener('mouseenter', handleHoverStart);
        el.removeEventListener('mouseleave', handleHoverEnd);
        el.addEventListener('mouseenter', handleHoverStart);
        el.addEventListener('mouseleave', handleHoverEnd);
      });
    };

    // Initial binding
    refreshCursorHovers();

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
      const tl = gsap.timeline({
        onComplete: () => {
          loader.style.display = 'none';
          initGSAPScrollAnimations();
        }
      });
      // Animate loader child elements out first (smooth scale and fade)
      tl.to('#loading-screen > *', {
        opacity: 0,
        y: -20,
        scale: 0.95,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.inOut"
      });
      // Fade out the main backdrop
      tl.to(loader, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.25");
    } else {
      initGSAPScrollAnimations();
    }
  }

  // Dismiss on window load or after max 2.5 seconds fallback
  window.addEventListener('load', dismissLoader);
  setTimeout(dismissLoader, 2500);

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

  // --- SCROLL TO TOP BUTTON ---
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
      }
    });
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
  let publicProducts = [];
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
          <img src="${p.img}" alt="${p.name}" class="w-16 h-16 object-contain bg-beige/30 rounded-xl border border-primary/5 shrink-0" onerror="this.onerror=null; this.src='/images/product-placeholder.webp';">
          <div class="flex-grow min-w-0">
            <h4 class="font-serif text-sm font-bold text-darkbrown dark:text-beige truncate">${p.name}</h4>
            <p class="text-xs text-primary font-semibold">₹${p.price}</p>
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
  function renderProductCard(p, isAdmin) {
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
      const imgSrc = p.img || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '/images/product-placeholder.webp');
      imgHtml = `<img src="${imgSrc}" alt="${p.name}" class="w-full h-full object-contain bg-beige/30 group-hover:scale-105 duration-500" loading="lazy" onload="this.parentElement.classList.add('loaded')" onerror="this.onerror=null; this.src='/images/product-placeholder.webp'; this.parentElement.classList.add('loaded')">`;
    }

    // Prefilled inquiry buttons
    let inquiryButtons = '';
    if (!isCustomOrderCard) {
      inquiryButtons = `
        <div class="mt-4 flex gap-2 w-full pt-3 border-t border-primary/5">
          <a href="https://www.instagram.com/dreamycrochet05/" target="_blank" class="w-full py-2.5 rounded-full border border-primary/20 text-xs font-bold text-primary hover:bg-primary-container/20 text-center transition duration-300 clickable flex items-center justify-center gap-1.5">
            🌸 Ask on Instagram
          </a>
        </div>
      `;
    }

    const galleryImages = (p.images && p.images.length > 0) ? p.images : (p.img ? [p.img] : []);
    const showCollectionBtn = !isCustomOrderCard && galleryImages.length > 0;

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
            <h3 class="font-serif text-xl font-bold text-darkbrown line-clamp-1">${p.name}</h3>
            <span class="text-primary font-semibold shrink-0">₹${p.price}</span>
          </div>
          <p class="text-primary/70 text-sm leading-relaxed mb-3 line-clamp-2">${p.desc}</p>
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

    return card;
  }

  async function renderCatalog() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';
    
    try {
      const products = await BackendAPI.getProducts();
      publicProducts = products; // Cache for wishlist/favorites view
      const token = sessionStorage.getItem('admin_token');
      const isAdmin = token ? await verifyAdminToken(token) : false;

      products.forEach(p => {
        productsGrid.appendChild(renderProductCard(p, isAdmin));
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

      // Refresh custom cursor hovers
      if (typeof refreshCursorHovers === 'function') {
        refreshCursorHovers();
      }

      updateWishlistUI();
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

    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send both email and password to backend
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // ✅ Login successful
        sessionStorage.setItem('admin_token', data.token);
        showToast('Portal Access Granted! ✨', 'success');

        // Clear sensitive fields
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
        setLoginError('');

        // Route to dashboard and refresh product catalog
        await handleRouting();
        await renderCatalog();
      } else {
        // ❌ Login failed — show inline error + shake animation
        const errorMsg = data.error || 'Invalid email or password. Please try again.';
        setLoginError(errorMsg);

        // Shake the login card
        const card = adminLoginForm.closest('.modal-content');
        card?.classList.add('error-shake');
        setTimeout(() => card?.classList.remove('error-shake'), 500);

        // Clear password field on failed attempt
        adminPasswordInput.value = '';
      }
    } catch (err) {
      setLoginError('Cannot connect to server. Please check your connection.');
    } finally {
      setLoginLoading(false);
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
        <td class="p-4 pl-6 flex items-center gap-3 font-semibold text-darkbrown">
          <img src="${p.img}" alt="${p.name}" class="w-10 h-10 object-cover rounded-xl border border-primary/10" onerror="this.onerror=null; this.src='/images/product-placeholder.webp';">
          <div class="flex flex-col">
            <span class="font-bold">${p.name}</span>
            ${p.instagramLink ? `<a href="${p.instagramLink}" target="_blank" class="text-[10px] text-primary/60 hover:underline flex items-center gap-0.5 mt-0.5">📸 Insta Link <span class="material-symbols-outlined text-[8px]">open_in_new</span></a>` : ''}
          </div>
        </td>
        <td class="p-4 text-primary font-medium">${p.badge}</td>
        <td class="p-4 font-bold text-darkbrown">₹${p.price}</td>
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
      document.getElementById('settings-hero-title').value = settings.heroTitle || '';
      document.getElementById('settings-subtitle-line1').value = settings.heroSubtitleLine1 || '';
      document.getElementById('settings-subtitle-line2').value = settings.heroSubtitleLine2 || '';
      
      const formPreview = document.getElementById('settings-hero-image-preview');
      const formPlaceholder = document.getElementById('settings-img-placeholder');
      if (settings.heroImage && formPreview) {
        formPreview.src = typeof settings.heroImage === 'object' && settings.heroImage.url ? settings.heroImage.url : settings.heroImage;
        formPreview.classList.remove('hidden');
        if (formPlaceholder) formPlaceholder.style.display = 'none';
      }

    } catch (e) {
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
    
    const featuredInput = document.getElementById('upload-featured');
    if (featuredInput) featuredInput.checked = !!p.featured;

    const visibleInput = document.getElementById('upload-visible');
    if (visibleInput) visibleInput.checked = p.isVisible !== false;

    const instagramInput = document.getElementById('upload-instagram');
    if (instagramInput) instagramInput.value = p.instagramLink || '';

    document.querySelectorAll('.badge-preset').forEach(btn => {
      if (btn.getAttribute('data-badge') === p.badge) {
        btn.classList.add('selected');
      }
    });

    if (p.images && p.images.length > 0) {
      uploadedImages = [...p.images];
      const coverUrl = p.coverImage || p.img || p.image;
      const foundIdx = uploadedImages.indexOf(coverUrl);
      coverImageIndex = foundIdx !== -1 ? foundIdx : 0;
    } else if (p.img || p.image) {
      uploadedImages = [p.img || p.image];
      coverImageIndex = 0;
    }
    
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
      featured: document.getElementById('upload-featured')?.checked || false,
      isVisible: document.getElementById('upload-visible')?.checked !== false,
      instagramLink: document.getElementById('upload-instagram')?.value.trim() || ''
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
  const qvDesc = document.getElementById('qv-desc');
  const qvType = document.getElementById('qv-type');

  function openQuickView(p) {
    if (!quickViewModal) return;
    qvTitle.textContent = p.name;
    qvPrice.textContent = p.price;
    qvDesc.textContent = p.desc;
    qvType.textContent = p.badge;
    
    // Normalize cover image URL
    const imgUrl = (p.img && typeof p.img === 'object') ? p.img.url : (p.img || '');
    qvImg.src = imgUrl || '/images/product-placeholder.webp';

    // Bind click to open gallery
    const galleryImages = (p.images && p.images.length > 0) ? p.images : (p.img ? [p.img] : []);
    qvImg.style.cursor = 'pointer';
    qvImg.onclick = () => {
      quickViewModal.classList.remove('active');
      setTimeout(() => {
        quickViewModal.classList.add('hidden');
        openGallery(galleryImages, 0, p.name);
      }, 300);
    };

    // Increment view counter
    const pId = p._id || p.id;
    if (pId && pId !== 'custom-order-card') {
      BackendAPI.incrementViewCount(pId);
      p.viewCount = (p.viewCount || 0) + 1;
    }

    quickViewModal.classList.remove('hidden');
    setTimeout(() => quickViewModal.classList.add('active'), 50);
    playTone(659.25, 0.25, 'sine', 0.1);
  }

  if (qvCloseBtn) {
    qvCloseBtn.addEventListener('click', () => {
      quickViewModal.classList.remove('active');
      setTimeout(() => quickViewModal.classList.add('hidden'), 400);
    });
  }

  // Quick view triggers
  const qvCustomOrderBtn = document.getElementById('qv-custom-order-btn');
  qvCustomOrderBtn?.addEventListener('click', () => {
    quickViewModal.classList.remove('active');
    setTimeout(() => {
      quickViewModal.classList.add('hidden');
      openCustomOrderModal();
    }, 300);
  });

  // --- PREMIUM FULLSCREEN GALLERY MODAL ---
  let currentGalleryImages = [];
  let currentGalleryIndex = 0;
  let galleryProductName = '';
  let touchStartX = 0;
  let touchEndX = 0;

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

    // Open Modal with GSAP animation
    galleryModal.classList.remove('hidden');
    galleryModal.style.pointerEvents = 'auto';
    gsap.fromTo(galleryModal, 
      { opacity: 0, backdropFilter: 'blur(0px)' }, 
      { opacity: 1, backdropFilter: 'blur(12px)', duration: 0.4, ease: 'power2.out' }
    );

    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    // Play soft sound chime
    if (typeof playTone === 'function') {
      playTone(783.99, 0.2, 'sine', 0.08);
    }
  }

  function closeGallery() {
    if (!galleryModal) return;
    galleryModal.style.pointerEvents = 'none';
    gsap.to(galleryModal, {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        galleryModal.classList.add('hidden');
        document.body.style.overflow = '';
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
      // Crossfade animation
      gsap.to(galleryMainImg, {
        opacity: 0,
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          let animated = false;
          galleryMainImg.onload = () => {
            if (animated) return;
            animated = true;
            gsap.fromTo(galleryMainImg, 
              { opacity: 0, scale: 0.98 },
              { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
            );
          };
          
          galleryMainImg.onerror = () => {
            galleryMainImg.onerror = null;
            galleryMainImg.src = '/images/product-placeholder.webp';
            if (animated) return;
            animated = true;
            gsap.fromTo(galleryMainImg, 
              { opacity: 0, scale: 0.98 },
              { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
            );
          };
          
          galleryMainImg.src = currentGalleryImages[currentGalleryIndex] || '/images/product-placeholder.webp';
          
          if (galleryMainImg.complete && galleryMainImg.naturalWidth !== 0) {
            if (!animated) {
              animated = true;
              gsap.fromTo(galleryMainImg, 
                { opacity: 0, scale: 0.98 },
                { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
              );
            }
          }
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
    
    currentGalleryImages.forEach((img, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `gallery-thumb-item relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 flex-shrink-0 clickable ${idx === currentGalleryIndex ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'}`;
      thumb.innerHTML = `<img src="${img}" alt="thumbnail ${idx}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/images/product-placeholder.webp';">`;
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
    
    [nextIdx, prevIdx].forEach(idx => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = currentGalleryImages[idx];
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
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    galleryImageContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
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
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);
  }

  function initGSAPScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);
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
            start: "top 85%"
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

    const whyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          whyCrochetCards.forEach((card, i) => {
            setTimeout(() => {
              gsap.to(card, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', clearProps: 'transform' });
            }, i * 200);
          });
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
        whyCrochetCards.forEach((card, i) => {
          setTimeout(() => { gsap.to(card, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }); }, i * 200);
        });
      }
    });

    // Hover rotate icons for Why cards
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

    // Why Choose Us cards entrance
    const whyChooseCards = document.querySelectorAll('.why-choose-card');
    whyChooseCards.forEach(card => { card.style.opacity = '0'; card.style.transform = 'translateY(60px) scale(0.9)'; });

    const whyChooseObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          whyChooseCards.forEach((card, i) => {
            setTimeout(() => {
              gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.2)', clearProps: 'transform' });
            }, i * 150);
          });
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
        whyChooseCards.forEach((card, i) => {
          setTimeout(() => { gsap.to(card, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.2)' }); }, i * 150);
        });
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
          start: "top 75%"
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
          start: "top 70%"
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
          start: "top 80%"
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
          start: "top 85%"
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
        start: "top 80%"
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
        start: "top 80%"
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
        start: "top 90%"
      }
    });
  }

  // --- INSTAGRAM PROMOTION INTERACTION ---

  const instaFrame = document.getElementById('instagram-frame');
  if (instaFrame) {
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

  // --- INTERACTIVE PRODUCTS AND CARD SWAYS ---
  document.querySelectorAll('.product-card-container, .why-choose-card, #why-crochet .glass-card').forEach(card => {
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
    
    if (heroBouquetContainer) {
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

  // Initialize wishlist states
  updateWishlistUI();
});



