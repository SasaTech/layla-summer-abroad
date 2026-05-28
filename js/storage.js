// ============================================
// storage.js — localStorage helpers
// ============================================

const KEYS = {
  stops:    'storybook_stops',
  diary:    'storybook_diary',
  bucket:   'storybook_bucket',
  messages: 'storybook_messages',
  gallery:  'storybook_gallery',
  completed:'storybook_bucket_completed',
};

const Storage = {

  // Get locally-saved items for a type
  getLocalItems(type) {
    try {
      const raw = localStorage.getItem(KEYS[type]);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  // Save a new item (adds to local array)
  saveLocalItem(type, item) {
    const items = this.getLocalItems(type);
    items.push(item);
    localStorage.setItem(KEYS[type], JSON.stringify(items));
  },

  // Update an existing item by id
  updateLocalItem(type, id, updates) {
    const items = this.getLocalItems(type);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      localStorage.setItem(KEYS[type], JSON.stringify(items));
      return true;
    }
    return false;
  },

  // Delete an item by id
  deleteLocalItem(type, id) {
    const items = this.getLocalItems(type).filter(i => i.id !== id);
    localStorage.setItem(KEYS[type], JSON.stringify(items));
  },

  // Merge JSON starter data with localStorage additions.
  // localStorage items with same id override JSON items.
  mergeItems(jsonItems, localItems) {
    const map = {};
    jsonItems.forEach(i => { map[i.id] = i; });
    localItems.forEach(i => { map[i.id] = i; }); // local overrides
    return Object.values(map);
  },

  // Bucket completion state (separate key for quick access)
  getCompletedIds() {
    try {
      const raw = localStorage.getItem(KEYS.completed);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  toggleComplete(id, forceState) {
    let ids = this.getCompletedIds();
    const isComplete = ids.includes(id);
    if (forceState === undefined ? isComplete : !forceState) {
      ids = ids.filter(i => i !== id);
    } else {
      if (!ids.includes(id)) ids.push(id);
    }
    localStorage.setItem(KEYS.completed, JSON.stringify(ids));
    return !isComplete;
  },

  isCompleted(id) {
    return this.getCompletedIds().includes(id);
  },

  // Export everything as a downloadable JSON
  exportAll() {
    const data = {
      exportedAt: new Date().toISOString(),
      stops:    this.getLocalItems('stops'),
      diary:    this.getLocalItems('diary'),
      bucket:   this.getLocalItems('bucket'),
      messages: this.getLocalItems('messages'),
      gallery:  this.getLocalItems('gallery'),
      completedBucketIds: this.getCompletedIds(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `storybook-memories-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Import from a previously exported JSON
  importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.stops)    localStorage.setItem(KEYS.stops,    JSON.stringify(data.stops));
      if (data.diary)    localStorage.setItem(KEYS.diary,    JSON.stringify(data.diary));
      if (data.bucket)   localStorage.setItem(KEYS.bucket,   JSON.stringify(data.bucket));
      if (data.messages) localStorage.setItem(KEYS.messages, JSON.stringify(data.messages));
      if (data.gallery)  localStorage.setItem(KEYS.gallery,  JSON.stringify(data.gallery));
      if (data.completedBucketIds) localStorage.setItem(KEYS.completed, JSON.stringify(data.completedBucketIds));
      return true;
    } catch { return false; }
  },

  // Clear only locally-added content (leaves JSON-sourced data alone)
  clearLocalData() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }
};
