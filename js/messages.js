// ============================================
// messages.js — keepsake messages vault
// ============================================

const MessagesPage = {
  messages: [],
  filter:   'all',

  CATEGORY_ICONS: {
    'Open anytime':          '💛',
    'Open when homesick':    '🏠',
    'Open when celebrating': '🎉',
    'Open when overwhelmed': '🌊',
    'Open when lonely':      '🤍',
    'Open on the final day': '🌟',
  },

  async init() {
    this.messages = await Data.getMessages();
    this.render();
    this.attachEvents();
  },

  render() {
    const grid = document.getElementById('messages-grid');
    if (!grid) return;

    let msgs = this.messages;
    if (this.filter !== 'all') msgs = msgs.filter(m => m.category === this.filter);

    if (!msgs.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-icon">💌</span>
          <h3>No messages here yet</h3>
          <p>Messages from the people who love you will appear here — like little envelopes waiting to be opened.</p>
        </div>`;
      return;
    }

    grid.innerHTML = msgs.map((msg, i) => this.renderEnvelope(msg, i)).join('');
  },

  renderEnvelope(msg, i) {
    const unlocked  = Data.isUnlocked(msg);
    const icon      = this.CATEGORY_ICONS[msg.category] || '💌';
    const lockedCls = unlocked ? '' : 'envelope-locked';

    return `
      <div class="envelope-card ${lockedCls} animate-fade-up"
        style="animation-delay:${i * 0.08}s"
        data-id="${msg.id}"
        data-unlocked="${unlocked}"
        tabindex="0" role="button"
        aria-label="Message from ${msg.sender}">
        <div class="envelope-flap">
          <span class="envelope-icon">${icon}</span>
          ${!unlocked ? '<div style="font-size:0.75rem;font-weight:700;color:var(--ink-light);opacity:0.7;margin-top:4px">🔒 Not yet...</div>' : ''}
        </div>
        <div class="envelope-body">
          <div class="envelope-sender">${msg.sender}</div>
          <div class="envelope-category">${msg.category}</div>
          ${unlocked
            ? '<div style="font-size:0.78rem;color:var(--sage-dark);font-weight:700;margin-top:6px">Tap to open 💌</div>'
            : `<div style="font-size:0.78rem;color:var(--ink-lighter);margin-top:6px">Opens ${msg.unlockDate ? Data.formatDateShort(msg.unlockDate) : 'later'}</div>`
          }
        </div>
      </div>`;
  },

  openMessage(id) {
    const msg = this.messages.find(m => m.id === id);
    if (!msg) return;
    if (!Data.isUnlocked(msg)) {
      showToast('💛 This one isn\'t ready to open yet', 'error');
      return;
    }

    const icon = this.CATEGORY_ICONS[msg.category] || '💌';
    const mediaHTML = (msg.media || []).map(src => {
      if (!src) return '';
      return `
        <div style="margin-top:16px;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-card)">
          ${renderMedia(src, 'w-full', `Message from ${msg.sender}`)}
        </div>`;
    }).join('');

    const modal = document.getElementById('message-modal');
    if (!modal) return;

    modal.querySelector('h2').textContent = `${icon} From ${msg.sender}`;
    modal.querySelector('.modal-body').innerHTML = `
      <div style="margin-bottom:16px">
        <span class="sticker sticker-pink">${msg.category}</span>
      </div>
      <div style="
        background: var(--white);
        border-radius: var(--radius-md);
        padding: 24px;
        font-size: 1.05rem;
        line-height: 1.9;
        color: var(--ink);
        font-family: var(--font-body);
        box-shadow: var(--shadow-card);
        white-space: pre-wrap;
        border-left: 4px solid var(--pink);
      ">${msg.message || ''}</div>
      ${mediaHTML}
      <div style="
        margin-top:20px;
        text-align:right;
        font-family:var(--font-hand);
        font-size:1.3rem;
        color:var(--ink-light)
      ">— ${msg.sender} 💛</div>
    `;

    openModal('message-modal');
  },

  attachEvents() {
    // Category filters
    document.querySelectorAll('.msg-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.msg-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.cat;
        this.render();
      });
    });

    // Click on envelope
    document.getElementById('messages-grid')?.addEventListener('click', e => {
      const card = e.target.closest('.envelope-card');
      if (card) this.openMessage(card.dataset.id);
    });

    document.getElementById('messages-grid')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.envelope-card');
        if (card) this.openMessage(card.dataset.id);
      }
    });
  }
};
