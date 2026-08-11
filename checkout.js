/* ================================================
   MARKETIAN — Secure Checkout JavaScript
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
  initCountdownTimer();
});

/* ---------- Meta Attribution Helpers (Skool Method) ---------- */
// Extract Facebook Click ID (fbc) from URL parameters or cookies
function getFbc() {
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    localStorage.setItem('meta_fbc', fbc);
    return fbc;
  }
  const match = document.cookie.match(/(^|;)\s*_fbc=([^;]+)/);
  const fbc = match ? match[2] : null;
  if (fbc) {
    localStorage.setItem('meta_fbc', fbc);
  }
  return fbc || localStorage.getItem('meta_fbc') || null;
}

// Extract Facebook Browser Identifier (fbp) from cookies
function getFbp() {
  const match = document.cookie.match(/(^|;)\s*_fbp=([^;]+)/);
  const fbp = match ? match[2] : null;
  if (fbp) {
    localStorage.setItem('meta_fbp', fbp);
  }
  return fbp || localStorage.getItem('meta_fbp') || null;
}

// Extract Google Click ID (gclid)
function getGclid() {
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');
  if (gclid) {
    localStorage.setItem('google_click_id', gclid);
    return gclid;
  }
  return localStorage.getItem('google_click_id') || null;
}

// Extract TikTok Click ID (ttclid)
function getTtclid() {
  const urlParams = new URLSearchParams(window.location.search);
  const ttclid = urlParams.get('ttclid');
  if (ttclid) {
    localStorage.setItem('tiktok_click_id', ttclid);
    return ttclid;
  }
  return localStorage.getItem('tiktok_click_id') || null;
}

// Capture click identifiers on load to ensure storage
getFbc();
getGclid();
getTtclid();

// Capture client IP address for Meta CAPI matching (same as Skool project)
var clientIPAddress = '';
fetch('https://api.ipify.org?format=json')
  .then(r => r.json())
  .then(d => { clientIPAddress = d.ip || ''; })
  .catch(() => { clientIPAddress = ''; });

/* ---------- 2-Step Pakistani Checkout Widget Logic ---------- */
function initCheckout() {
  const form = document.getElementById('leadCaptureForm');
  const orderBumpCheckbox = document.getElementById('orderBumpCheckbox');
  const submitBtnText = document.getElementById('submitBtnText');
  const step1 = document.getElementById('checkoutStep1');
  const step2 = document.getElementById('checkoutStep2');
  const whatsappVerifyBtn = document.getElementById('whatsappVerifyBtn');
  const widgetToastText = document.getElementById('widgetToastText');

  // Configurable values
  const basePrice = 1499;
  const bumpPrice = 499;
  const whatsappNumber = '923255090258'; // Target WhatsApp verification number (international, no +)
  const webhookUrl = 'https://script.google.com/macros/s/AKfycbyxNAYrkC-4aDY0eB4j_by7yWazjatqR5WiZGEbqerV1Q02ZzYy9V_XacMu9NwVmhyb/exec'; // Active Google Sheets Webhook URL

  // Fire InitiateCheckout immediately upon entering checkout.html (deduplicated)
  trackMetaEvent('InitiateCheckout', {
    content_name: 'Practical Meta Ads Curriculum',
    content_category: 'Online Course',
    value: basePrice,
    currency: 'PKR'
  });

  // 1. Listen to Order Bump checkbox state to update price display
  function updatePriceDisplay() {
    if (!orderBumpCheckbox || !submitBtnText) return;
    const isBumped = orderBumpCheckbox.checked;
    const totalPrice = isBumped ? (basePrice + bumpPrice) : basePrice;
    submitBtnText.textContent = `Reveal Payment Details — Rs. ${totalPrice.toLocaleString()}`;
  }

  if (orderBumpCheckbox) {
    orderBumpCheckbox.addEventListener('change', updatePriceDisplay);
    updatePriceDisplay(); // Initialize on load
  }

  // 2. Handle Lead Form Submission & Webhook Integration
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('leadFullName').value.trim();
      const whatsappInput = document.getElementById('leadWhatsApp').value.trim();
      const city = document.getElementById('leadCity').value.trim();
      const isBumped = orderBumpCheckbox ? orderBumpCheckbox.checked : false;
      const totalPrice = isBumped ? (basePrice + bumpPrice) : basePrice;

      if (!fullName || !whatsappInput || !city) {
        alert('Please fill in all enrollment details.');
        return;
      }

      // Clean and validate Pakistani phone number (Skool method)
      let cleanPhone = whatsappInput.replace(/[\s\-\(\)\+]/g, "");
      // Handle international prefix 0092 -> 92
      if (cleanPhone.startsWith('0092')) {
        cleanPhone = cleanPhone.substring(2);
      }
      const pkPhoneRegex = /^03\d{9}$|^923\d{9}$/;
      if (!pkPhoneRegex.test(cleanPhone)) {
        alert('Please enter a valid Pakistani WhatsApp number starting with 03 (e.g., 03001234567).');
        return;
      }

      // Normalize phone to E.164 format (+923XXXXXXXXX) for tracking matching
      let phone = cleanPhone;
      if (cleanPhone.startsWith('03')) {
        phone = '+92' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('923')) {
        phone = '+' + cleanPhone;
      }

      // Generate unique random Order ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `MKT-${Date.now().toString().slice(-6)}-${randomNum}`;

      // Save order details in session storage for the WhatsApp purchase click trigger & success page tracking
      sessionStorage.setItem('current_order_id', orderId);
      sessionStorage.setItem('current_order_value', totalPrice.toString());
      sessionStorage.removeItem('purchase_tracked'); // Reset tracked flag for new order

      const leadData = {
        orderId: orderId,
        name: fullName,
        whatsapp: phone,
        city: city,
        orderBump: isBumped ? 'Yes' : 'No',
        totalPrice: totalPrice,
        timestamp: new Date().toISOString(),
        fbc: getFbc() || '',
        fbp: getFbp() || '',
        gclid: getGclid() || '',
        ttclid: getTtclid() || '',
        ip: clientIPAddress || '',
        ua: navigator.userAgent || '',
        url: window.location.href || ''
      };

      // Save lead to localStorage (safe local backup)
      try {
        const existingLeads = JSON.parse(localStorage.getItem('marketian_leads') || '[]');
        existingLeads.push(leadData);
        localStorage.setItem('marketian_leads', JSON.stringify(existingLeads));
      } catch (err) {
        console.error('Failed to save lead locally:', err);
      }

      // Asynchronously POST to webhook (non-blocking)
      // NOTE: mode 'no-cors' + 'application/x-www-form-urlencoded' is the ONLY combo
      // that reliably reaches Google Apps Script. JSON gets stripped by no-cors,
      // and removing no-cors causes CORS errors on Google's 302 redirect.
      if (webhookUrl) {
        const formBody = new URLSearchParams();
        Object.entries(leadData).forEach(([key, value]) => {
          formBody.append(key, String(value));
        });

        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formBody.toString()
        }).catch(err => {
          console.error('[Webhook] POST failed (backup saved locally):', err);
        });
      } else {
        console.warn('Google Sheets Webhook URL is not configured. Lead is backed up in localStorage.');
      }

      // Meta Pixel: Track Lead event sharing the exact same Order ID for CAPI deduplication
      trackMetaEvent('Lead', {
        content_name: 'Practical Meta Ads Curriculum',
        content_category: 'Online Course',
        value: totalPrice,
        currency: 'PKR',
        predicted_ltv: totalPrice
      }, orderId);

      // Transition Step 1 to Step 2
      if (step1 && step2) {
        step1.classList.add('hidden');
        step2.classList.remove('hidden');

        // Scroll smoothly to checkout widget
        const headerHeight = document.querySelector('.checkout-header')?.offsetHeight || 70;
        const widgetPosition = document.getElementById('checkoutWidget').getBoundingClientRect().top + window.scrollY - headerHeight - 20;
        window.scrollTo({
          top: widgetPosition,
          behavior: 'smooth'
        });
      }

      // Populate WhatsApp confirmation URL with dynamic parameters & register purchase click event
      if (whatsappVerifyBtn) {
        const message = `Hi, I've transferred the fee of Rs. ${totalPrice.toLocaleString()} for the Meta Ads Course. Here are my details:

Order ID: ${orderId}
Name: ${fullName}
WhatsApp: ${phone}
City: ${city}
AI Cheat Code Upgrade: ${isBumped ? 'Yes' : 'No'}

Please verify my payment and send my access details.`;
        
        whatsappVerifyBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      }
    });
  }



  // 3. Clipboard copy utilities
  const copyButtons = document.querySelectorAll('.btn-copy, .btn-copy-mini');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      copyTextToClipboard(textToCopy, (success) => {
        if (success) {
          const originalText = btn.textContent;
          btn.classList.add('copied');
          btn.textContent = 'Copied!';

          setTimeout(() => {
            btn.classList.remove('copied');
            btn.textContent = originalText;
          }, 2000);
        } else {
          alert('Failed to copy to clipboard. Please copy manually: ' + textToCopy);
        }
      });
    });
  });

  // 4. Toast notification rotation (Local Social Proof)
  if (widgetToastText) {
    widgetToastText.style.transition = 'opacity 0.3s ease';
    const toastNotifications = [
      "Zeeshan from Rawalpindi joined 6 minutes ago",
      "Ayesha from Karachi joined 2 minutes ago",
      "Ali from Lahore joined 15 minutes ago",
      "Fatima from Islamabad joined 9 minutes ago",
      "Usman from Faisalabad joined 22 minutes ago",
      "Sana from Multan joined 5 minutes ago",
      "Bilal from Peshawar joined 11 minutes ago"
    ];
    let toastIndex = 0;
    setInterval(() => {
      toastIndex = (toastIndex + 1) % toastNotifications.length;
      widgetToastText.style.opacity = '0';
      setTimeout(() => {
        widgetToastText.textContent = toastNotifications[toastIndex];
        widgetToastText.style.opacity = '1';
      }, 300);
    }, 8000);
  }

}

// Clipboard helper with modern browser + fallback textarea approach
function copyTextToClipboard(text, callback) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => callback(true))
      .catch((err) => {
        console.error('navigator.clipboard failed, trying fallback:', err);
        fallbackCopyTextToClipboard(text, callback);
      });
  } else {
    fallbackCopyTextToClipboard(text, callback);
  }
}

function fallbackCopyTextToClipboard(text, callback) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    callback(successful);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    callback(false);
  }

  document.body.removeChild(textArea);
}

/* ---------- Meta Pixel Tracking Helpers (Deduplicated with Session Lock) ---------- */
function trackMetaEvent(eventName, customData = {}, overrideEventId = null) {
  // Lock event ID in session storage to prevent duplicate fires (Skool method)
  const sessionKey = `meta_eid_${eventName.toLowerCase()}`;
  let eventId = overrideEventId;
  let isNewEvent = false;

  if (eventId) {
    sessionStorage.setItem(sessionKey, eventId);
    isNewEvent = true; // Force trigger if override ID is explicitly passed for deduplication match
  } else {
    eventId = sessionStorage.getItem(sessionKey);
    if (!eventId) {
      eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(sessionKey, eventId);
      isNewEvent = true;
      console.log(`[MetaPixel] Generated NEW ID for ${eventName}: ${eventId}`);
    } else {
      console.log(`[MetaPixel] Reusing LOCKED ID for ${eventName}: ${eventId} (browser pixel skipped)`);
    }
  }

  // Fire the browser pixel only if it is the first trigger in this session
  if (window.fbq && isNewEvent) {
    fbq('track', eventName, customData, { eventID: eventId });
    console.log(`[MetaPixel] Fired browser event: ${eventName} (ID: ${eventId})`, customData);
  } else if (!window.fbq) {
    console.warn('[MetaPixel] fbq function not found on page.');
  }
}

/* ---------- Evergreen Countdown Timer (48 hours from first visit) ---------- */
function initCountdownTimer() {
  const timers = document.querySelectorAll('.countdown-timer');
  if (!timers.length) return;

  const COUNTDOWN_HOURS = 48;
  const STORAGE_KEY = 'marketian_launch_end';

  // Get or create end time from localStorage
  let endTime = localStorage.getItem(STORAGE_KEY);
  if (!endTime || parseInt(endTime) < Date.now()) {
    endTime = Date.now() + (COUNTDOWN_HOURS * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, String(endTime));
  } else {
    endTime = parseInt(endTime);
  }

  function updateTimers() {
    const now = Date.now();
    const diff = Math.max(0, endTime - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timers.forEach(timer => {
      const dEl = timer.querySelector('[data-unit="days"]');
      const hEl = timer.querySelector('[data-unit="hours"]');
      const mEl = timer.querySelector('[data-unit="minutes"]');
      const sEl = timer.querySelector('[data-unit="seconds"]');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
      if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
    });

    if (diff > 0) {
      setTimeout(updateTimers, 1000);
    }
  }

  updateTimers();
}
