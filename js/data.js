// ============================================
// data.js — load JSON files and merge with localStorage
// ============================================

const Data = {

  // Base path — works both locally and on GitHub Pages
  base: (() => {
    // If running from file://, just use relative
    const s = window.location.href;
    if (s.startsWith('file://')) return '';
    // Otherwise use relative paths (works on any subpath)
    return '';
  })(),

  async fetchJSON(path) {
    try {
      const res = await fetch(path + '?_=' + Date.now());
      if (!res.ok) return [];
      return await res.json();
    } catch { return []; }
  },

  async getStops() {
    const json  = await this.fetchJSON('data/stops.json');
    const local = Storage.getLocalItems('stops');
    return Storage.mergeItems(json, local);
  },

  async getDiary() {
    const json  = await this.fetchJSON('data/diary.json');
    const local = Storage.getLocalItems('diary');
    const all   = Storage.mergeItems(json, local);
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getBucket() {
    const json  = await this.fetchJSON('data/bucket.json');
    const local = Storage.getLocalItems('bucket');
    return Storage.mergeItems(json, local);
  },

  async getMessages() {
    const json  = await this.fetchJSON('data/messages.json');
    const local = Storage.getLocalItems('messages');
    return Storage.mergeItems(json, local);
  },

  async getGallery() {
    const json  = await this.fetchJSON('data/gallery.json');
    const local = Storage.getLocalItems('gallery');
    const all   = Storage.mergeItems(json, local);
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Convenience: get a single stop by id
  async getStop(id) {
    const stops = await this.getStops();
    return stops.find(s => s.id === id) || null;
  },

  // Generate unique IDs
  uid(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  },

  // Format date for display
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  daysBetween(start, end) {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  },

  daysFromToday(start) {
    if (!start) return 0;
    const s = new Date(start), n = new Date();
    return Math.max(0, Math.round((n - s) / (1000 * 60 * 60 * 24)));
  },

  isUnlocked(msg) {
    if (!msg.unlockDate) return true;
    return new Date() >= new Date(msg.unlockDate + 'T00:00:00');
  }
};
