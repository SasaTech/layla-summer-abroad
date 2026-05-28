// ============================================
// main.js — shared nav, utilities, toast
// ============================================

// ---- Navigation HTML ----
const NAV_LINKS = [
  { href: 'index.html',       label: 'Journey Map',  icon: '🗺️'  },
  { href: 'diary.html',       label: 'Diary',        icon: '📖'  },
  { href: 'bucket-list.html', label: 'Bucket List',  icon: '✨'  },
  { href: 'messages.html',    label: 'Messages',     icon: '💌'  },
  { href: 'gallery.html',     label: 'Gallery',      icon: '📷'  },
  { href: 'admin.html',       label: 'Add Memory',   icon: '＋', cls: 'nav-admin' },
];

function buildNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';

  const desktopLinks = NAV_LINKS.map(l => {
    const active = current === l.href || (current === '' && l.href === 'index.html');
    return `<li><a href="${l.href}" class="${l.cls || ''} ${active ? 'active' : ''}">${l.icon} ${l.label}</a></li>`;
  }).join('');

  const mobileLinks = NAV_LINKS.map(l => {
    const active = current === l.href || (current === '' && l.href === 'index.html');
    return `<a href="${l.href}" class="${l.cls || ''} ${active ? 'active' : ''}">${l.icon} ${l.label}</a>`;
  }).join('');

  const nav = document.getElementById('main-nav');
  if (!nav) return;

  nav.innerHTML = `
    <a class="nav-logo" href="index.html"><span>✈️</span> Storybook Summer</a>
    <ul class="nav-links">${desktopLinks}</ul>
    <button class="nav-hamburger" id="hamburger" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  `;

  const mobileMenu = document.getElementById('mobile-nav');
  if (mobileMenu) mobileMenu.innerHTML = mobileLinks;

  document.getElementById('hamburger')?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('open');
  });

  // Close mobile menu on outside click
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !mobileMenu?.contains(e.target)) {
      mobileMenu?.classList.remove('open');
    }
  });
}

// ---- Toast notifications ----
let toastTimer;
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  });
}

// ---- Modal helpers ----
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(el => {
    el.classList.remove('open');
  });
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeAllModals();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});

// ---- Mood icon map ----
const MOOD_ICONS = {
  'Joyful':     '☀️',
  'Homesick':   '🏠',
  'Reflective': '🌙',
  'Chaotic':    '🌀',
  'Peaceful':   '🌿',
  'Curious':    '🔭',
  'Overwhelmed':'🌊',
};

const MOOD_CLASS = {
  'Joyful':     'mood-joyful',
  'Homesick':   'mood-homesick',
  'Reflective': 'mood-reflective',
  'Chaotic':    'mood-chaotic',
  'Peaceful':   'mood-peaceful',
  'Curious':    'mood-curious',
  'Overwhelmed':'mood-overwhelmed',
};

const STATUS_LABELS = {
  completed: '✓ Completed',
  current:   '📍 Here Now',
  upcoming:  '→ Coming Soon',
};

const CATEGORY_ICONS = {
  'Places to Visit': '🗺️',
  'Food':            '🍽️',
  'Experiences':     '✨',
  'Museums & Landmarks': '🏛️',
  'Soft Goals':      '💛',
  'Random Fun':      '🎲',
};

// ---- Sparkle effect ----
function spawnSparkle(x, y) {
  const emojis = ['✨','⭐','🌟','💫','🌸'];
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left   = (x + (Math.random() - 0.5) * 60) + 'px';
    el.style.top    = (y + (Math.random() - 0.5) * 60) + 'px';
    el.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
    el.style.animationDelay = (Math.random() * 0.4) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
}

// ---- Placeholder image generator (SVG data URI) ----
function placeholderSVG(w, h, label, color = '#e8c46a') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="${color}" opacity="0.25"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
      font-family="serif" font-size="14" fill="#3d2c1e" opacity="0.5">${label}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Determine if a media path is video
function isVideo(src) {
  if (!src) return false;
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(src);
}

// Render media element (img or video)
function renderMedia(src, cls = '', alt = '') {
  if (!src) return '';
  if (isVideo(src)) {
    return `<video class="${cls}" src="${src}" controls playsinline></video>`;
  }
  return `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy" onerror="this.src='${placeholderSVG(400,300,'📷 Photo',)}'">`;
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
});
