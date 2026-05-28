// ============================================
// bucket.js — bucket list / quest board
// ============================================

const BucketPage = {
  items:  [],
  stops:  [],
  filter: 'all',

  async init() {
    this.items = await Data.getBucket();
    this.stops = await Data.getStops();
    this.applyCompletedState();
    this.buildStopDropdown();
    this.renderProgress();
    this.render();
    this.attachEvents();
  },

  applyCompletedState() {
    const ids = Storage.getCompletedIds();
    this.items.forEach(item => {
      item._completed = ids.includes(item.id) || item.completed;
    });
  },

  buildStopDropdown() {
    const sel = document.getElementById('bucket-stop');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Optional place —</option>' +
      this.stops.map(s => `<option value="${s.id}">${s.city}</option>`).join('');
  },

  renderProgress() {
    const total     = this.items.length;
    const done      = this.items.filter(i => i._completed).length;
    const pct       = total ? Math.round((done / total) * 100) : 0;

    const el = document.getElementById('bucket-progress');
    if (el) {
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-family:var(--font-hand);font-size:1.3rem;color:var(--ink)">Quest Progress</span>
          <span style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;color:var(--gold-dark)">${done} / ${total}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div style="font-size:0.85rem;color:var(--ink-lighter);margin-top:6px;text-align:right">${pct}% complete</div>
      `;
    }

    // Per-category
    const cats = ['Places to Visit','Food','Experiences','Museums & Landmarks','Soft Goals','Random Fun'];
    const catEl = document.getElementById('bucket-categories');
    if (catEl) {
      catEl.innerHTML = cats.map(cat => {
        const catItems = this.items.filter(i => i.category === cat);
        if (!catItems.length) return '';
        const catDone = catItems.filter(i => i._completed).length;
        const catPct  = Math.round((catDone / catItems.length) * 100);
        return `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:0.85rem;font-weight:700;color:var(--ink)">${CATEGORY_ICONS[cat] || '✦'} ${cat}</span>
              <span style="font-size:0.82rem;color:var(--ink-lighter)">${catDone}/${catItems.length}</span>
            </div>
            <div class="progress-bar" style="height:6px">
              <div class="progress-fill" style="width:${catPct}%;background:linear-gradient(90deg,var(--sage),var(--lavender))"></div>
            </div>
          </div>`;
      }).join('');
    }
  },

  render() {
    const cats = ['Places to Visit','Food','Experiences','Museums & Landmarks','Soft Goals','Random Fun'];
    const container = document.getElementById('bucket-list');
    if (!container) return;

    let items = this.items;
    if (this.filter !== 'all') items = items.filter(i => i.category === this.filter);

    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">✨</span>
          <h3>Your quest board is empty</h3>
          <p>Add adventures, foods to try, places to visit — anything you want to experience this summer.</p>
          <button class="btn btn-primary" onclick="openModal('add-bucket-modal')">＋ Add First Quest</button>
        </div>`;
      return;
    }

    // Group by category
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    container.innerHTML = cats.filter(c => grouped[c]?.length).map(cat => `
      <div class="bucket-category-group" style="margin-bottom:28px">
        <h3 style="font-family:var(--font-hand);font-size:1.4rem;color:var(--ink);
          margin-bottom:12px;display:flex;align-items:center;gap:8px">
          ${CATEGORY_ICONS[cat] || '✦'} ${cat}
        </h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${grouped[cat].map(item => this.renderItem(item)).join('')}
        </div>
      </div>
    `).join('');
  },

  renderItem(item) {
    const done  = item._completed;
    const stop  = this.stops.find(s => s.id === item.stopId);
    return `
      <div class="bucket-item ${done ? 'completed' : ''}" data-id="${item.id}">
        <div class="bucket-checkbox">${done ? '✓' : ''}</div>
        <div style="flex:1">
          <div class="bucket-title">${item.title}</div>
          <div class="bucket-meta">
            ${stop ? `📍 ${stop.city}` : ''}
            ${item.notes ? `· ${item.notes}` : ''}
            ${item.completedDate ? ` · Completed ${Data.formatDateShort(item.completedDate)}` : ''}
          </div>
        </div>
        ${done ? `<span class="bucket-stamp">✅</span>` : ''}
      </div>`;
  },

  toggleItem(id, x, y) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const wasComplete = item._completed;
    item._completed = !wasComplete;
    Storage.toggleComplete(id);

    if (!wasComplete) {
      // Just completed — sparkle!
      spawnSparkle(x, y);
      showToast('✅ Quest complete!');
    }

    this.renderProgress();
    this.render();
  },

  attachEvents() {
    // Filter buttons
    document.querySelectorAll('.bucket-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bucket-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.cat;
        this.render();
      });
    });

    // Toggle completion on click
    document.getElementById('bucket-list')?.addEventListener('click', e => {
      const item = e.target.closest('.bucket-item');
      if (!item) return;
      const rect = item.getBoundingClientRect();
      this.toggleItem(item.dataset.id, rect.left + rect.width/2, rect.top + rect.height/2);
    });

    // Add bucket item form
    document.getElementById('add-bucket-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const item = {
        id:       Data.uid('bucket'),
        title:    form.title.value.trim(),
        category: form.category.value,
        stopId:   form.stopId.value,
        notes:    form.notes.value.trim(),
        completed:false,
        _local:   true,
      };

      Storage.saveLocalItem('bucket', item);
      this.items = await Data.getBucket();
      this.applyCompletedState();
      this.renderProgress();
      this.render();
      form.reset();
      closeModal('add-bucket-modal');
      showToast('✨ Quest added!');
    });
  }
};
