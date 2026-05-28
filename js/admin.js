// ============================================
// admin.js — creator mode (no real auth — casual privacy only)
// Admin passcode is stored in localStorage only.
// This is NOT security — just a gentle friction to avoid
// accidentally editing the site. Anyone who opens dev tools can bypass it.
// ============================================

const AdminPage = {
  // Change this to whatever code you like!
  PASSCODE: 'summer',
  UNLOCK_KEY: 'storybook_admin_unlocked',

  async init() {
    this.checkAccess();
    this.stops = await Data.getStops();
    this.buildStopDropdowns();
    this.attachEvents();
    this.buildSectionNav();
  },

  checkAccess() {
    const unlocked = sessionStorage.getItem(this.UNLOCK_KEY);
    const gate  = document.getElementById('admin-gate');
    const panel = document.getElementById('admin-panel');
    if (unlocked === 'yes') {
      gate?.classList.add('hidden');
      panel?.classList.remove('hidden');
    } else {
      gate?.classList.remove('hidden');
      panel?.classList.add('hidden');
    }
  },

  unlock(code) {
    if (code.trim().toLowerCase() === this.PASSCODE) {
      sessionStorage.setItem(this.UNLOCK_KEY, 'yes');
      this.checkAccess();
      showToast('✨ Creator mode unlocked!');
    } else {
      showToast('Hmm, that\'s not it 🤔', 'error');
      const input = document.getElementById('passcode-input');
      if (input) { input.value = ''; input.focus(); }
    }
  },

  buildStopDropdowns() {
    ['entry-stop', 'bucket-stop-admin', 'gallery-stop-admin', 'msg-stop'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="">— No specific place —</option>' +
        this.stops.map(s => `<option value="${s.id}">${s.city}, ${s.country}</option>`).join('');
    });
  },

  buildSectionNav() {
    const links = document.querySelectorAll('.admin-nav-link');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const target = link.dataset.section;
        document.querySelectorAll('.admin-section').forEach(s => {
          s.classList.toggle('hidden', s.id !== target);
        });
      });
    });
  },

  attachEvents() {
    // Passcode form
    document.getElementById('passcode-form')?.addEventListener('submit', e => {
      e.preventDefault();
      this.unlock(document.getElementById('passcode-input')?.value || '');
    });

    // ---- Add Stop ----
    document.getElementById('add-stop-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const stop = {
        id:            form.id.value.trim() || Data.uid('stop'),
        city:          form.city.value.trim(),
        country:       form.country.value.trim(),
        arrivalDate:   form.arrivalDate.value,
        departureDate: form.departureDate.value,
        status:        form.status.value,
        lat:           parseFloat(form.mapX.value) || null,
        lng:           parseFloat(form.mapY.value) || null,
        icon:          form.icon.value.trim() || '📍',
        quote:         form.quote.value.trim(),
        coverImage:    form.coverImage.value.trim(),
        notes:         form.notes.value.trim(),
        _local:        true,
      };
      Storage.saveLocalItem('stops', stop);
      this.stops = await Data.getStops();
      this.buildStopDropdowns();
      form.reset();
      showToast('📍 Stop added! Check the Journey Map.');
    });

    // ---- Add Diary Entry ----
    document.getElementById('add-entry-form-admin')?.addEventListener('submit', e => {
      e.preventDefault();
      const form  = e.target;
      const entry = {
        id:        Data.uid('entry'),
        stopId:    form.stopId.value,
        title:     form.title.value.trim(),
        date:      form.date.value,
        mood:      form.mood.value,
        entryType: form.entryType.value,
        body:      form.body.value.trim(),
        media:     form.media.value.trim()
          ? form.media.value.trim().split('\n').map(s => s.trim()).filter(Boolean)
          : [],
        _local:    true,
      };
      Storage.saveLocalItem('diary', entry);
      form.reset();
      showToast('✏️ Diary entry saved!');
    });

    // ---- Add Bucket Item ----
    document.getElementById('add-bucket-form-admin')?.addEventListener('submit', e => {
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
      form.reset();
      showToast('✨ Quest added!');
    });

    // ---- Add Message ----
    document.getElementById('add-message-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      const msg  = {
        id:         Data.uid('msg'),
        sender:     form.sender.value.trim(),
        category:   form.category.value,
        message:    form.message.value.trim(),
        unlockDate: form.unlockDate.value,
        media:      form.media.value.trim()
          ? form.media.value.trim().split('\n').map(s => s.trim()).filter(Boolean)
          : [],
        _local:     true,
      };
      Storage.saveLocalItem('messages', msg);
      form.reset();
      showToast('💌 Message saved!');
    });

    // ---- Add Gallery Media ----
    document.getElementById('add-gallery-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const form = e.target;
      const item = {
        id:      Data.uid('media'),
        type:    form.type.value,
        src:     form.src.value.trim(),
        caption: form.caption.value.trim(),
        stopId:  form.stopId.value,
        date:    form.date.value,
        _local:  true,
      };
      Storage.saveLocalItem('gallery', item);
      form.reset();
      showToast('📷 Photo/video added!');
    });

    // ---- Export ----
    document.getElementById('export-btn')?.addEventListener('click', () => {
      Storage.exportAll();
      showToast('💾 Memories exported!');
    });

    // ---- Import ----
    document.getElementById('import-btn')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });

    document.getElementById('import-file')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const ok = Storage.importAll(ev.target.result);
        if (ok) showToast('✅ Memories restored!');
        else    showToast('Could not read that file 🤔', 'error');
        e.target.value = '';
      };
      reader.readAsText(file);
    });

    // ---- Reset ----
    document.getElementById('reset-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure? This clears all locally added content. This cannot be undone.')) {
        Storage.clearLocalData();
        showToast('🗑️ Local data cleared');
        setTimeout(() => location.reload(), 1200);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => AdminPage.init());
