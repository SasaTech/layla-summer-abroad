// ============================================
// diary.js — diary page logic
// ============================================

const DiaryPage = {
  entries: [],
  stops:   [],
  filtered: [],

  async init() {
    this.entries = await Data.getDiary();
    this.stops   = await Data.getStops();
    this.filtered = [...this.entries];
    this.buildFilters();
    this.buildStopDropdown();
    this.render();
    this.attachEvents();
  },

  buildFilters() {
    const places = [...new Set(this.entries.map(e => e.stopId).filter(Boolean))];
    const moods  = ['Joyful','Homesick','Reflective','Chaotic','Peaceful','Curious','Overwhelmed'];
    const types  = ['Quick Thought','Full Journal','Photo Story','Voice/Video Reflection','Memory Snapshot'];

    const bar = document.getElementById('diary-filters');
    if (!bar) return;

    const placeOptions = places.map(pid => {
      const stop = this.stops.find(s => s.id === pid);
      return `<button class="filter-chip" data-filter="place" data-val="${pid}">${stop ? stop.city : pid}</button>`;
    }).join('');

    const moodOptions = moods.map(m =>
      `<button class="filter-chip" data-filter="mood" data-val="${m}">${MOOD_ICONS[m] || ''} ${m}</button>`
    ).join('');

    const typeOptions = types.map(t =>
      `<button class="filter-chip" data-filter="type" data-val="${t}">${t}</button>`
    ).join('');

    bar.innerHTML = `
      <input type="search" class="search-input" id="diary-search" placeholder="🔍 Search diary...">
      <button class="filter-chip active" data-filter="all">All</button>
      <span style="color:var(--ink-lighter);font-size:0.8rem;font-weight:700;">PLACE</span>
      ${placeOptions}
      <span style="color:var(--ink-lighter);font-size:0.8rem;font-weight:700;">MOOD</span>
      ${moodOptions}
      <span style="color:var(--ink-lighter);font-size:0.8rem;font-weight:700;">TYPE</span>
      ${typeOptions}
    `;
  },

  buildStopDropdown() {
    const sel = document.getElementById('entry-stop');
    if (!sel) return;
    sel.innerHTML = '<option value="">— No specific place —</option>' +
      this.stops.map(s => `<option value="${s.id}">${s.city}, ${s.country}</option>`).join('');
  },

  render() {
    const list = document.getElementById('diary-list');
    if (!list) return;

    if (!this.filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📖</span>
          <h3>No entries yet</h3>
          <p>Your diary is waiting. Write your first memory — even just a single line about how today felt.</p>
          <button class="btn btn-primary" onclick="openModal('add-entry-modal')">✏️ Write First Entry</button>
        </div>`;
      return;
    }

    list.innerHTML = `<div class="timeline">${
      this.filtered.map((e, i) => this.renderCard(e, i)).join('')
    }</div>`;
  },

  renderCard(entry, i) {
    const stop = this.stops.find(s => s.id === entry.stopId);
    const moodCls  = MOOD_CLASS[entry.mood] || '';
    const preview  = (entry.body || '').slice(0, 180) + ((entry.body || '').length > 180 ? '…' : '');
    const mediaHTML = (entry.media || []).slice(0, 1).map(src =>
      `<div class="diary-media-thumb">${renderMedia(src, 'diary-thumb-img')}</div>`
    ).join('');

    return `
      <div class="timeline-item animate-fade-up" style="animation-delay:${i * 0.06}s">
        <div class="timeline-dot"></div>
        <div class="diary-card" data-id="${entry.id}">
          <div class="diary-card-header">
            <div>
              <div class="diary-card-title">${entry.title || 'Untitled Entry'}</div>
              <div class="diary-card-date">${Data.formatDateShort(entry.date)}</div>
            </div>
            ${mediaHTML}
          </div>
          <div class="diary-card-body">
            <p class="diary-card-preview">${preview || '<em style="opacity:0.5">No text yet.</em>'}</p>
          </div>
          <div class="diary-card-footer">
            ${entry.mood ? `<span class="mood ${moodCls}">${MOOD_ICONS[entry.mood] || ''} ${entry.mood}</span>` : ''}
            ${stop ? `<span class="sticker sticker-lavender">📍 ${stop.city}</span>` : ''}
            ${entry.entryType ? `<span class="sticker sticker-cream">${entry.entryType}</span>` : ''}
            <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="DiaryPage.openEntry('${entry.id}')">Read →</button>
          </div>
        </div>
      </div>`;
  },

  openEntry(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;
    const stop  = this.stops.find(s => s.id === entry.stopId);
    const modal = document.getElementById('read-entry-modal');
    if (!modal) return;

    const mediaHTML = (entry.media || []).map(src => `
      <div style="margin-bottom:12px">${renderMedia(src, 'w-full', entry.title)}</div>
    `).join('');

    modal.querySelector('.modal-body').innerHTML = `
      <div style="margin-bottom:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span class="sticker sticker-cream">📅 ${Data.formatDate(entry.date)}</span>
        ${stop ? `<span class="sticker sticker-lavender">📍 ${stop.city}</span>` : ''}
        ${entry.mood ? `<span class="mood ${MOOD_CLASS[entry.mood] || ''}">${MOOD_ICONS[entry.mood] || ''} ${entry.mood}</span>` : ''}
        ${entry.entryType ? `<span class="sticker sticker-pink">${entry.entryType}</span>` : ''}
      </div>
      ${mediaHTML}
      <div style="font-size:1rem;line-height:1.9;color:var(--ink);white-space:pre-wrap">${entry.body || ''}</div>
    `;
    modal.querySelector('h2').textContent = entry.title || 'Diary Entry';
    openModal('read-entry-modal');
  },

  applyFilters() {
    const search   = (document.getElementById('diary-search')?.value || '').toLowerCase();
    const activeChips = [...document.querySelectorAll('#diary-filters .filter-chip.active')];
    const hasAll   = activeChips.some(c => c.dataset.filter === 'all');

    let result = [...this.entries];

    if (!hasAll) {
      const places = activeChips.filter(c => c.dataset.filter === 'place').map(c => c.dataset.val);
      const moods  = activeChips.filter(c => c.dataset.filter === 'mood' ).map(c => c.dataset.val);
      const types  = activeChips.filter(c => c.dataset.filter === 'type' ).map(c => c.dataset.val);

      if (places.length) result = result.filter(e => places.includes(e.stopId));
      if (moods.length)  result = result.filter(e => moods.includes(e.mood));
      if (types.length)  result = result.filter(e => types.includes(e.entryType));
    }

    if (search) {
      result = result.filter(e =>
        (e.title  || '').toLowerCase().includes(search) ||
        (e.body   || '').toLowerCase().includes(search)
      );
    }

    this.filtered = result;
    this.render();
  },

  attachEvents() {
    // Filter chips
    document.getElementById('diary-filters')?.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;

      if (chip.dataset.filter === 'all') {
        document.querySelectorAll('#diary-filters .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        document.querySelector('#diary-filters .filter-chip[data-filter="all"]')?.classList.remove('active');
        chip.classList.toggle('active');
        if (!document.querySelectorAll('#diary-filters .filter-chip.active').length) {
          document.querySelector('#diary-filters .filter-chip[data-filter="all"]')?.classList.add('active');
        }
      }
      this.applyFilters();
    });

    // Search
    document.getElementById('diary-search')?.addEventListener('input', () => this.applyFilters());

    // Add entry form
    document.getElementById('add-entry-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const entry = {
        id:        Data.uid('entry'),
        stopId:    form.stopId.value,
        title:     form.title.value.trim(),
        date:      form.date.value,
        mood:      form.mood.value,
        entryType: form.entryType.value,
        body:      form.body.value.trim(),
        media:     form.media.value.trim() ? form.media.value.trim().split('\n').map(s => s.trim()).filter(Boolean) : [],
        _local:    true,
      };

      Storage.saveLocalItem('diary', entry);
      this.entries = await Data.getDiary();
      this.filtered = [...this.entries];
      this.buildFilters();
      this.buildStopDropdown();
      this.render();
      form.reset();
      closeModal('add-entry-modal');
      showToast('✏️ Diary entry saved!');
    });

    // Pre-fill stop if in URL
    const urlStop = new URLSearchParams(window.location.search).get('stopId');
    if (urlStop) {
      const sel = document.getElementById('entry-stop');
      if (sel) sel.value = urlStop;
      openModal('add-entry-modal');
    }
  }
};
