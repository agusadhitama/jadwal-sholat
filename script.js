/* ═══════════════════════════════════════════════════
   MAWAQIT — JADWAL WAKTU SHOLAT
   script.js
   ═══════════════════════════════════════════════════ */

'use strict';

/* ── PRAYER DATA ── */
const PRAYERS = [
  { key: 'Fajr',    id: 'Subuh',   ar: 'الفَجْر',    icon: 'moon'   },
  { key: 'Dhuhr',   id: 'Dzuhur',  ar: 'الظُّهْر',   icon: 'sun'    },
  { key: 'Asr',     id: 'Ashar',   ar: 'الْعَصْر',   icon: 'cloud'  },
  { key: 'Maghrib', id: 'Maghrib', ar: 'الْمَغْرِب',  icon: 'sunset' },
  { key: 'Isha',    id: 'Isya',    ar: 'الْعِشَاء',  icon: 'stars'  },
];

const ICONS = {
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2"  x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2"  y1="12" x2="4"  y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
  </svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>`,
  sunset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <path d="M17 18a5 5 0 0 0-10 0"/>
    <line x1="12" y1="9" x2="12" y2="2"/>
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
    <line x1="1" y1="18" x2="3" y2="18"/>
    <line x1="21" y1="18" x2="23" y2="18"/>
    <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
    <line x1="23" y1="22" x2="1" y2="22"/>
    <polyline points="16 5 12 9 8 5"/>
  </svg>`,
  stars: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,
};

/* ── STATE ── */
let prayerTimes = {};
let clockInterval = null;
let nextPrayerKey = null;

/* ── HELPERS ── */
function parseMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function fmt12(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function nowMin() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

/* ── STARS CANVAS ── */
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.004,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 1 || s.a < 0) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 232, 213, ${Math.max(0, Math.min(1, s.a))})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

/* ── GEOMETRIC ISLAMIC PATTERN ── */
function initGeoPattern() {
  const svg = document.getElementById('geo-svg');
  if (!svg) return;

  const W = 1000, H = 1000;
  const size = 80;
  let paths = '';

  function star8(cx, cy, r1, r2) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8 - Math.PI / 2;
      const r = i % 2 === 0 ? r1 : r2;
      pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="#c9993a" stroke-width="0.6"/>`;
  }

  function hexagon(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="none" stroke="#c9993a" stroke-width="0.4" opacity="0.7"/>`;
  }

  for (let col = -1; col <= Math.ceil(W / size) + 1; col++) {
    for (let row = -1; row <= Math.ceil(H / size) + 1; row++) {
      const cx = col * size + (row % 2 === 0 ? 0 : size / 2);
      const cy = row * size * 0.866;
      paths += star8(cx, cy, size * 0.42, size * 0.22);
      paths += hexagon(cx, cy, size * 0.18);
      paths += `<circle cx="${cx}" cy="${cy}" r="${size * 0.05}" fill="#c9993a" opacity="0.5"/>`;
    }
  }

  svg.innerHTML = paths;
}

/* ── SCROLL ANIMATIONS ── */
function initAnimations() {
  const els = document.querySelectorAll('[data-anim]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
}

/* ── DATE & HIJRI ── */
async function initDates() {
  const now = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('date-gregorian').textContent =
    now.toLocaleDateString('id-ID', opts).toUpperCase();

  try {
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const res  = await fetch(`https://api.aladhan.com/v1/gToH/${d}-${m}-${y}`);
    const data = await res.json();
    if (data.code === 200) {
      const h = data.data.hijri;
      document.getElementById('date-hijri').textContent =
        `${h.day} ${h.month.en} ${h.year} H`;
    }
  } catch (_) { /* silent */ }
}

/* ── STATUS ── */
function setStatus(msg, isError = false) {
  const el = document.getElementById('search-status');
  el.textContent = msg;
  el.className = 'search-status' + (isError ? ' error' : '');
}

/* ── RENDER PRAYER LIST ── */
function renderList() {
  const nm  = nowMin();
  const nextIdx = PRAYERS.findIndex(p => parseMin(prayerTimes[p.key]) > nm);

  const html = PRAYERS.map((p, i) => {
    let cls = 'prayer-item';
    if      (nextIdx === -1 && i === PRAYERS.length - 1) cls += ' is-active';
    else if (i === nextIdx)                               cls += ' is-next';
    else if (nextIdx !== -1 && i === nextIdx - 1)        cls += ' is-active';
    else if (nextIdx !== -1 && i < nextIdx - 1)          cls += ' is-passed';
    else if (nextIdx === -1 && i < PRAYERS.length - 1)   cls += ' is-passed';

    return `
      <div class="${cls}" role="listitem">
        <span class="prayer-num">0${i + 1}</span>
        <div class="prayer-icon-wrap" aria-hidden="true">${ICONS[p.icon]}</div>
        <div class="prayer-info">
          <div class="prayer-name-id">${p.id}</div>
          <div class="prayer-name-ar" lang="ar">${p.ar}</div>
        </div>
        <div class="prayer-time-display">${fmt12(prayerTimes[p.key])}</div>
      </div>`;
  }).join('');

  const list = document.getElementById('prayer-list');
  list.innerHTML = html;
  list.setAttribute('role', 'list');
}

/* ── RENDER NEXT PRAYER CARD ── */
function renderNext() {
  const nm      = nowMin();
  const nextIdx = PRAYERS.findIndex(p => parseMin(prayerTimes[p.key]) > nm);
  const card    = document.getElementById('next-card');

  if (nextIdx === -1) {
    card.hidden = true;
    nextPrayerKey = null;
    return;
  }

  const next = PRAYERS[nextIdx];
  nextPrayerKey = next.key;
  card.hidden = false;

  document.getElementById('next-name-id').textContent = next.id;
  document.getElementById('next-name-ar').textContent = next.ar;
  document.getElementById('next-time').textContent    = fmt12(prayerTimes[next.key]);

  // Countdown
  const diff = parseMin(prayerTimes[next.key]) - nm;
  const hh   = Math.floor(diff / 60);
  const mm   = diff % 60;
  const cdText = hh > 0
    ? `${hh} jam ${mm} menit lagi`
    : `${mm} menit lagi`;
  document.getElementById('next-countdown').textContent = cdText;

  // Progress bar — how far through the gap to next prayer
  let prevMin = 0;
  if (nextIdx > 0) {
    prevMin = parseMin(prayerTimes[PRAYERS[nextIdx - 1].key]);
  }
  const totalGap  = parseMin(prayerTimes[next.key]) - prevMin;
  const elapsed   = nm - prevMin;
  const pct       = totalGap > 0 ? Math.min(100, Math.round((elapsed / totalGap) * 100)) : 0;
  document.getElementById('next-progress-bar').style.width = pct + '%';
}

/* ── FETCH PRAYER TIMES ── */
async function fetchPrayerTimes() {
  const city = document.getElementById('city-input').value.trim();
  if (!city) return;

  setStatus('Memuat jadwal sholat...');
  document.getElementById('prayer-list').innerHTML = '';
  document.getElementById('next-card').hidden = true;
  document.getElementById('location-tag').hidden = true;

  try {
    const now = new Date();
    const url = [
      'https://api.aladhan.com/v1/timingsByCity/',
      `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`,
      `?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
    ].join('');

    const res  = await fetch(url);
    const data = await res.json();

    if (data.code !== 200) {
      setStatus('Kota tidak ditemukan. Coba nama kota lain.', true);
      return;
    }

    prayerTimes = data.data.timings;
    setStatus('');

    renderList();
    renderNext();

    document.getElementById('location-tag').hidden = false;
    document.getElementById('location-text').textContent =
      city.toUpperCase() + ' · INDONESIA';

    // Refresh every minute
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      renderList();
      renderNext();
    }, 60 * 1000);

  } catch (_) {
    setStatus('Gagal memuat. Periksa koneksi internet.', true);
  }
}

/* ── THEME TOGGLE ── */
function initTheme() {
  const html    = document.documentElement;
  const btn     = document.getElementById('theme-toggle');
  const label   = document.getElementById('toggle-label');

  // Load saved preference, default to dark
  const saved = localStorage.getItem('mawaqit-theme') || 'dark';
  applyTheme(saved);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('mawaqit-theme', theme);
    label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', `Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`);

    // Update star color based on theme
    const canvas = document.getElementById('stars-canvas');
    if (canvas) canvas.dataset.theme = theme;
  }
}

/* ── SEARCH EVENTS ── */
document.getElementById('search-btn').addEventListener('click', fetchPrayerTimes);
document.getElementById('city-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchPrayerTimes();
});

/* ── INIT ── */
initTheme();
initStars();
initGeoPattern();
initAnimations();
initDates();
fetchPrayerTimes();