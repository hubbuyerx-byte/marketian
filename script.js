/* ================================================
   MARKETIAN — Landing Page JavaScript
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initAccordion();
  initScrollAnimations();
  initSmoothScroll();
  initSalesAlerts();
  initSpecialOffer();
  initFaqAccordion();
  initStickyBanner();
  initScarcityBar();
  initVideoPlayer();
});

/* ---------- Sticky Header with Shadow ---------- */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    if (scrollY > 10) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
}



/* ---------- Accordion ---------- */
function initAccordion() {
  const accordionItems = document.querySelectorAll('.accordion__item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion__header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close all other items
      accordionItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('is-open');
          otherItem.querySelector('.accordion__header')?.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current item
      item.classList.toggle('is-open');
      header.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ---------- Scroll Fade-in Animations ---------- */
function initScrollAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (!fadeElements.length) return;

  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    fadeElements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger the animation slightly for adjacent elements
          const delay = index * 80;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, Math.min(delay, 400));
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  fadeElements.forEach(el => observer.observe(el));
}

/* ---------- Smooth Scroll for Anchor Links ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('header')?.offsetHeight || 80;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // Meta Pixel: Track InitiateCheckout when user clicks an enrollment CTA
      if (href === '#purchasebutton') {
        trackMetaEvent('InitiateCheckout', {
          content_name: 'Practical Meta Ads Curriculum',
          content_category: 'Online Course',
          value: 2999,
          currency: 'PKR'
        });
      }
    });
  });
}

/* ---------- Sales Alerts Popup Loop ---------- */
function initSalesAlerts() {
  const popup = document.getElementById('salesPopup');
  const avatar = document.getElementById('salesAvatar');
  const text = document.getElementById('salesText');
  const time = document.getElementById('salesTime');
  const closeBtn = document.getElementById('salesClose');

  if (!popup || !avatar || !text || !time) return;

  const notifications = [
    { name: "Zainab", course: "Practical Meta Ads Curriculum", time: "8 hours ago", initials: "ZM" },
    { name: "Tareq", course: "Practical Meta Ads Curriculum", time: "2 hours ago", initials: "TM" },
    { name: "Sarah", course: "Practical Meta Ads Curriculum", time: "1 hour ago", initials: "SJ" },
    { name: "Hamza", course: "Practical Meta Ads Curriculum", time: "5 hours ago", initials: "HM" },
    { name: "Fatima", course: "Practical Meta Ads Curriculum", time: "30 minutes ago", initials: "FN" }
  ];

  let index = 0;
  let timer = null;

  function showNextNotification() {
    const current = notifications[index];
    avatar.textContent = current.initials;
    avatar.style.background = getAvatarGradient(current.initials);
    text.innerHTML = `<strong>${current.name}</strong> enrolled in the course <strong>'${current.course}'</strong>`;
    time.textContent = current.time;

    popup.classList.add('is-visible');

    // Hide after 6 seconds
    setTimeout(() => {
      popup.classList.remove('is-visible');
    }, 6000);

    index = (index + 1) % notifications.length;
  }

  function getAvatarGradient(initials) {
    const gradients = [
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      "linear-gradient(135deg, #fddb92 0%, #d1f2f9 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    ];
    // Simple hash function for gradient index
    const code = initials.charCodeAt(0) + initials.charCodeAt(1);
    return gradients[code % gradients.length];
  }

  // Start loop
  setTimeout(() => {
    showNextNotification();
    timer = setInterval(showNextNotification, 14000); // cycle every 14 seconds (6s display + 8s wait)
  }, 3000);

  // Close and stop loop
  closeBtn.addEventListener('click', () => {
    popup.classList.remove('is-visible');
    clearInterval(timer);
  });
}

/* ---------- Exit-Intent & Delayed Modal Popup ---------- */
function initSpecialOffer() {
  const modal = document.getElementById('specialOfferModal');
  const closeBtn = document.getElementById('modalClose');
  const declineBtn = document.getElementById('modalDecline');
  const ctaBtn = document.getElementById('modalCta');

  if (!modal) return;

  function showModal() {
    if (sessionStorage.getItem('specialOfferShown') === 'true') return;
    modal.classList.add('is-visible');
    sessionStorage.setItem('specialOfferShown', 'true');
  }

  function closeModal() {
    modal.classList.remove('is-visible');
  }

  // Show after 5 seconds
  setTimeout(showModal, 5000);

  // Show on exit intent (mouse leaving top of screen)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 20) {
      showModal();
    }
  });

  // Attach close events
  closeBtn.addEventListener('click', closeModal);
  declineBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });
  ctaBtn.addEventListener('click', closeModal);

  // Close when clicking overlay background
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/* ---------- FAQ Accordion ---------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const button = item.querySelector('.faq-header-btn');
    const body = item.querySelector('.faq-body');
    const icon = item.querySelector('.faq-icon');
    if (!button || !body || !icon) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('faq-item--open');
      
      // If we are opening, set max-height dynamically
      if (!isOpen) {
        item.classList.add('faq-item--open');
        button.setAttribute('aria-expanded', 'true');
        icon.textContent = '—';
        body.style.maxHeight = `${body.scrollHeight}px`;
      } else {
        // If closing, set max-height to 0
        body.style.maxHeight = `${body.scrollHeight}px`;
        // Force reflow
        body.offsetHeight;
        item.classList.remove('faq-item--open');
        button.setAttribute('aria-expanded', 'false');
        icon.textContent = '+';
        body.style.maxHeight = '0px';
      }
    });
  });
}

/* ---------- Sticky Bottom Banner ---------- */
function initStickyBanner() {
  const banner = document.getElementById('stickyBanner');
  if (!banner) return;

  let ticking = false;

  function updateBanner() {
    if (window.scrollY > 600) {
      banner.classList.add('is-visible');
    } else {
      banner.classList.remove('is-visible');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateBanner);
      ticking = true;
    }
  }, { passive: true });
}

/* ---------- Scarcity Progress Bar Animation ---------- */
function initScarcityBar() {
  const scarcityBar = document.querySelector('.scarcity-progress-bar');
  if (!scarcityBar) return;

  const targetWidth = scarcityBar.getAttribute('data-target-width') || '99%';
  
  // Animate the fill with a slight delay for better UX
  setTimeout(() => {
    scarcityBar.style.width = targetWidth;
  }, 400);
}

/* ---------- Click-to-Play YouTube Player ---------- */
function initVideoPlayer() {
  const videoMock = document.getElementById('youtubeVideoPlayer');
  if (!videoMock) return;

  videoMock.addEventListener('click', () => {
    const youtubeId = videoMock.getAttribute('data-youtube-id');
    if (!youtubeId) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`);
    iframe.setAttribute('title', 'YouTube video player');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = 'var(--radius-md)';

    videoMock.innerHTML = '';
    videoMock.appendChild(iframe);
  });
}
