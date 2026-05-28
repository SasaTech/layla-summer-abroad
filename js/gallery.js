// ============================================
// gallery.js — photo/video scrapbook wall
// ============================================

const GalleryPage = {
  media:    [],
  stops:    [],
  filtered: [],
  view:     'grid',
  search:   '',
  stopFilter: 'all',

  async init() {
    this.media  = await Data.getGallery();
    this.stops  = await Data.getStops();
    this.filtered = [...this.media];
    this.buildStopFilters();
    this.buildStopDropdown();
    this.render();
    this.attachEvents();
  },

  buildStopFilters() {
    const bar = document.getElementById('gallery-filters');
    if (!bar) return;

    const stopIds = [...new Set(this.media.map(m => m.stopId).filter(Boolean))];
    const stopBtns = stopIds.map(id => {
      const s = this.stops.find(st => st.id === id);
      return `<button class="filter-chip" data-stop="${id}">${s ? s.city : id}</button>`;
    }).join('');

    bar.innerHTML = `
      <button class="filter-chip active" data-stop="all">All</button>
      ${stopBtns}
      <input type="search" class="search-input" id="gallery-search" placeholder="🔍 Search captions...">
    `;
  },

  buildStopDropdown() {
    const sel = document.getElementById('gallery-stop');
    if (!sel) return;
    sel.innerHTML = '<option value="">— No place —</option>' +
      this.stops.map(s => `<option value="${s.id}">${s.city}</option>`).join('');
  },

  applyFilters() {
    let items = [...this.media];
    if (this.stopFilter !== 'all') items = items.filter(m => m.stopId === this.stopFilter);
    if (this.search) {
      const q = this.search.toLowerCase();
      items = items.filter(m => (m.caption || '').toLowerCase().includes(q));
    }
    this.filtered = items;
    this.render();
  },

  render() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    if (!this.filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📷</span>
          <h3>No photos yet</h3>
          <p>Your scrapbook wall is waiting — add photos and videos from your adventures.</p>
          <button class="btn btn-primary" onclick="openModal('add-media-modal')">＋ Add First Photo</button>
        </div>`;
      return;
    }

    if (this.view === 'polaroid') {
      container.className = 'gallery-polaroid-wall';
      container.innerHTML = this.filtered.map((m, i) => this.renderPolaroid(m, i)).join('');
    } else {
      container.className = 'gallery-grid-wall';
      container.innerHTML = this.filtered.map((m, i) => this.renderCard(m, i)).join('');
    }
  },

  renderCard(item, i) {
    const stop = this.stops.find(s => s.id === item.stopId);
    const isVid = isVideo(item.src);
    const placeholder = placeholderSVG(400, 300, isVid ? '▶ Video' : '📷 Photo', '#c9b8e8');

    return `
      <div class="card gallery-card animate-fade-up" style="animation-delay:${i*0.05}s"
        data-id="${item.id}" tabindex="0" role="button">
        <div class="gallery-thumb">
          ${isVid
            ? `<video src="${item.src}" class="gallery-img" preload="metadata" muted></video>
               <div class="gallery-play-icon">▶</div>`
            : `<img src="${item.src}" alt="${item.caption || ''}" class="gallery-img" loading="lazy"
                 onerror="this.src='${placeholder}'">`
          }
        </div>
        <div class="card-body" style="padding:12px 14px">
          ${item.caption ? `<div style="font-family:var(--font-hand);font-size:1rem;color:var(--ink);margin-bottom:4px">${item.caption}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:0.78rem;color:var(--ink-lighter)">
            ${stop ? `<span>📍 ${stop.city}</span>` : ''}
            ${item.date ? `<span>📅 ${Data.formatDateShort(item.date)}</span>` : ''}
            ${isVid ? '<span>🎬 Video</span>' : ''}
          </div>
        </div>
      </div>`;
  },

  renderPolaroid(item, i) {
    const rotations = [-3, -1, 2, -2, 1, 3, -1.5, 2.5];
    const rot = rotations[i % rotations.length];
    const stop = this.stops.find(s => s.id === item.stopId);
    const isVid = isVideo(item.src);
    const placeholder = placeholderSVG(300, 300, isVid ? '▶ Video' : '📷 Photo', '#f2b8c6');

    return `
      <div class="polaroid" style="--rot:${rot}deg" data-id="${item.id}" tabindex="0" role="button">
        <div class="polaroid-img">
          ${isVid
            ? `<video src="${item.src}" muted preload="metadata" style="width:100%;height:100%;object-fit:cover"></video>
               <div class="gallery-play-icon">▶</div>`
            : `<img src="${item.src}" alt="${item.caption || ''}" loading="lazy"
                 onerror="this.src='${placeholder}'"
                 style="width:100%;height:100%;object-fit:cover">`
          }
        </div>
        <div class="polaroid-caption">${item.caption || (stop ? stop.city : '')}</div>
        ${item.date ? `<div style="font-family:var(--font-hand);font-size:0.75rem;color:var(--ink-lighter);text-align:center">${Data.formatDateShort(item.date)}</div>` : ''}
      </div>`;
  },

  openLightbox(id) {
    const item = this.filtered.find(m => m.id === id) || this.media.find(m => m.id === id);
    if (!item) return;
    const stop = this.stops.find(s => s.id === item.stopId);

    const lb = document.getElementById('lightbox');
    if (!lb) return;

    const content = lb.querySelector('.lightbox-content');
    const isVid   = isVideo(item.src);

    content.innerHTML = `
      <button class="lightbox-close" onclick="GalleryPage.closeLightbox()">✕</button>
      ${isVid
        ? `<video src="${item.src}" controls autoplay playsinline style="max-width:90vw;max-height:80vh;border-radius:var(--radius-md)"></video>`
        : `<img src="${item.src}" alt="${item.caption || ''}" style="max-width:90vw;max-height:80vh;border-radius:var(--radius-md);object-fit:contain">`
      }
      <div class="lightbox-caption">
        ${item.caption || ''}
        ${stop ? ` · 📍 ${stop.city}` : ''}
        ${item.date ? ` · ${Data.formatDateShort(item.date)}` : ''}
      </div>
    `;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeLightbox() {
    const lb = document.getElementById('lightbox');
    lb?.classList.remove('open');
    document.body.style.overflow = '';
    // Pause any videos
    lb?.querySelectorAll('video').forEach(v => v.pause());
  },

  attachEvents() {
    // Filters
    document.getElementById('gallery-filters')?.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      document.querySelectorAll('#gallery-filters .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      this.stopFilter = chip.dataset.stop;
      this.applyFilters();
    });

    document.getElementById('gallery-search')?.addEventListener('input', e => {
      this.search = e.target.value;
      this.applyFilters();
    });

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.view = btn.dataset.view;
        this.render();
      });
    });

    // Open lightbox
    const gridEl = document.getElementById('gallery-grid');
    const openLB = e => {
      const card = e.target.closest('[data-id]');
      if (card && card.dataset.id) this.openLightbox(card.dataset.id);
    };
    gridEl?.addEventListener('click', openLB);
    gridEl?.addEventListener('keydown', e => { if (e.key === 'Enter') openLB(e); });

    // Close lightbox on overlay click
    document.getElementById('lightbox')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) this.closeLightbox();
    });

    // Add media form
    document.getElementById('add-media-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form  = e.target;
      const item  = {
        id:      Data.uid('media'),
        type:    form.type.value,
        src:     form.src.value.trim(),
        caption: form.caption.value.trim(),
        stopId:  form.stopId.value,
        date:    form.date.value,
        _local:  true,
      };
      Storage.saveLocalItem('gallery', item);
      this.media    = await Data.getGallery();
      this.filtered = [...this.media];
      this.buildStopFilters();
      this.buildStopDropdown();
      this.applyFilters();
      form.reset();
      closeModal('add-media-modal');
      showToast('📷 Photo added!');
    });
  }
};
