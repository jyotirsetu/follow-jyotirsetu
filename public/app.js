const cfg = window.FOLLOW_CONFIG;
const API = {
  variant: () => `${cfg.apiBase}/api/follow-hub/variant`,
  event: () => `${cfg.apiBase}/api/follow-hub/event`,
};

const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

document.getElementById('year').textContent = new Date().getFullYear();

function getDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|iphone|android|ipad|silk/.test(ua)) return "mobile";
  if (/tablet|ipad/.test(ua)) return "tablet";
  return "desktop";
}

function getReferrerSource() {
  const ref = document.referrer.toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("whatsapp")) return "whatsapp";
  if (ref.includes("instagram")) return "instagram";
  if (ref.includes("facebook")) return "facebook";
  if (ref.includes("google")) return "google";
  if (ref.includes("youtube")) return "youtube";
  return "other";
}

function getUtmQuery() {
  const qs = window.location.search;
  const params = new URLSearchParams(qs);
  const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
  const present = keys.filter(k => params.has(k));
  return present.length ? present.map(k => `${k}=${params.get(k)}`).join("&") : "";
}

async function fetchVariant() {
  try {
    const res = await fetch(API.variant(), { method: "GET", credentials: "omit" });
    if (!res.ok) throw new Error("variant fetch failed");
    const data = await res.json();
    return data?.cta_variant || "A";
  } catch {
    return "A";
  }
}

async function logEvent(event_type, details = {}) {
  const payload = {
    event_type,
    device: getDevice(),
    source: getReferrerSource(),
    referrer: document.referrer || "",
    utm_query: getUtmQuery(),
    variant: window.__variant || "A",
    session_id: sessionId,
    ...details
  };

  try {
    await fetch(API.event(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
    });
  } catch (e) {
    console.warn("event logging failed", e);
  }
}

function choosePrimaryCTA(device, source, variant) {
  if (source === "whatsapp") return "whatsapp";
  if (source === "google") return "google_review";
  if (source === "instagram" || source === "facebook") {
    return variant === "B" ? "google_review" : "whatsapp";
  }
  if (device === "mobile") return variant === "B" ? "google_review" : "whatsapp";
  return "google_review";
}

function getCtaUrl(cta) {
  switch (cta) {
    case "whatsapp": {
      const text = encodeURIComponent(cfg.whatsappPrefill);
      return `https://wa.me/${cfg.whatsappNumber}?text=${text}`;
    }
    case "google_review":
      return cfg.googleReviewUrl;
    case "instagram":
      return cfg.instagramUrl;
    case "facebook":
      return cfg.facebookUrl;
    case "youtube":
      return cfg.youtubeUrl;
    default:
      return "#";
  }
}

function iconFor(cta) {
  return cfg.icons?.[cta] || null;
}

function appendLink(containerId, ct) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const li = document.createElement("li");
  li.className = 'link-item';
  const a = document.createElement("a");
  a.href = getCtaUrl(ct);
  a.target = "_blank";
  a.rel = "noopener";
  a.className = "link";

  const icon = iconFor(ct);
  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.className = 'link-icon';
    img.alt = ct + ' icon';
    a.appendChild(img);
  }

  const text = document.createElement('span');
  text.className = 'link-text';
  text.textContent = ({
    whatsapp: "WhatsApp",
    google_review: "Google Review",
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
  })[ct];
  a.appendChild(text);

  li.appendChild(a);
  container.appendChild(li);

  a.addEventListener("click", () => {
    logEvent("cta_click", { cta_clicked: ct });
  });
}

function renderSections(primary) {
  const slot = document.getElementById("cta-slot");
  slot.innerHTML = "";
  // Primary CTA
  const primaryBtn = document.createElement("a");
  primaryBtn.className = "btn primary";
  primaryBtn.href = getCtaUrl(primary);
  const primaryIcon = iconFor(primary);
  if (primaryIcon) {
    const img = document.createElement('img');
    img.src = primaryIcon;
    img.className = 'link-icon';
    img.alt = primary + ' icon';
    primaryBtn.appendChild(img);
  }
  const label = document.createElement('span');
  label.textContent = primary === "whatsapp" ? "Chat on WhatsApp" : "Leave a Google Review";
  primaryBtn.appendChild(label);
  primaryBtn.target = "_blank";
  primaryBtn.rel = "noopener";
  slot.appendChild(primaryBtn);
  primaryBtn.addEventListener("click", () => logEvent("cta_click", { cta_clicked: primary }));

  // Instagram + Facebook
  const instafb = document.getElementById('links-instafb');
  if (instafb) {
    instafb.innerHTML = '';
    appendLink('links-instafb', 'instagram');
    appendLink('links-instafb', 'facebook');
  }
  // WhatsApp
  const wlist = document.getElementById('links-whatsapp');
  if (wlist) {
    wlist.innerHTML = '';
    appendLink('links-whatsapp', 'whatsapp');
  }
  // YouTube
  const ylist = document.getElementById('links-youtube');
  if (ylist) {
    ylist.innerHTML = '';
    appendLink('links-youtube', 'youtube');
  }
}

function setupShareTop() {
  const btn = document.getElementById("share-top");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const shareData = {
      title: 'Follow JyotirSetu',
      text: 'Check out JyotirSetu Astrology',
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); logEvent('share', { method: 'navigator' }); } catch {}
    } else {
      const url = encodeURIComponent(window.location.href);
      const msg = encodeURIComponent("Check out JyotirSetu: ");
      const shareUrl = `https://wa.me/?text=${msg}${url}`;
      window.open(shareUrl, "_blank", "noopener");
      logEvent("share", { method: 'whatsapp' });
    }
  });
}

function initAstroBackground() {
  const canvas = document.getElementById('astro-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = []; let zodiac = [];
  function resize() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const count = Math.floor(canvas.width * canvas.height / 18000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      tw: Math.random() * Math.PI * 2,
      spd: 0.002 + Math.random() * 0.004,
    }));
    const glyphs = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
    zodiac = glyphs.map((g, i) => ({
      g,
      x: canvas.width * (0.15 + i * 0.07 % 0.8),
      y: canvas.height * (0.2 + (i % 6) * 0.1),
      a: Math.random() * Math.PI * 2,
      spd: (0.0002 + (i % 3) * 0.00015),
      size: Math.max(28, Math.min(canvas.width, canvas.height) / 18),
    }));
  }
  function draw(ts) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const s of stars) {
      const twinkle = 0.6 + 0.4 * Math.sin(ts * s.spd + s.tw);
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#9ecdf8';
    ctx.font = `${Math.floor(zodiac[0]?.size || 28)}px Georgia, serif`;
    for (const z of zodiac) {
      ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(z.a); ctx.fillText(z.g, 0, 0); ctx.restore(); z.a += z.spd;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  resize(); requestAnimationFrame(draw); window.addEventListener('resize', resize);
}

document.addEventListener("DOMContentLoaded", async () => {
  const gLink = document.getElementById('google-rating-link');
  if (gLink) {
    gLink.href = cfg.googleReviewUrl;
    gLink.addEventListener('click', () => logEvent('cta_click', { cta_clicked: 'google_review', location: 'hero' }));
  }
  const gBtn = document.getElementById('google-review-btn');
  if (gBtn) {
    gBtn.href = cfg.googleReviewUrl;
    gBtn.addEventListener('click', () => logEvent('cta_click', { cta_clicked: 'google_review', location: 'connect_now' }));
  }
  const rc = document.getElementById('rating-count');
  if (rc) rc.textContent = `${cfg.ratingCount}+`;

  const wb = document.getElementById('visit-website');
  if (wb) wb.addEventListener('click', () => logEvent('cta_click', { cta_clicked: 'website' }));

  const variant = await fetchVariant();
  window.__variant = variant;
  const device = getDevice();
  const source = getReferrerSource();
  const primary = choosePrimaryCTA(device, source, variant);

  renderSections(primary);
  setupShareTop();
  initAstroBackground();

  await logEvent("page_view");
  await logEvent("cta_impression", { cta_primary: primary });
});
