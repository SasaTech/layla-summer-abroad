# ✈️ Storybook Summer Abroad

A beautiful, cozy digital travel scrapbook — built as a static website with no backend, no login, no server required.

---

## 🏃 Running Locally

Because the site uses `fetch()` to load JSON files, you need a simple local server (not just double-clicking `index.html`). Here are easy options:

**Option A — VS Code (recommended)**
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html`, and choose *Open with Live Server*.

**Option B — Python (no install needed)**
```bash
cd storybook-summer-abroad
python3 -m http.server 8080
# then open http://localhost:8080
```

**Option C — Node**
```bash
npx serve .
```

---

## 🚀 Deploying to GitHub Pages

1. Push the entire folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under *Source*, choose **Deploy from a branch → main → / (root)**.
4. Click Save. Your site will be live at `https://yourusername.github.io/your-repo-name/`.

> **Important:** All paths in the code are relative (`data/stops.json`, `assets/photos/photo.jpg`), so GitHub Pages works without any changes.

---

## 💌 Adding Messages (the gift part)

Messages are the "Letters from people who love you" treasure chest. You set these up **before** sharing the site.

1. Put image/video files in `assets/messages/`:
   ```
   assets/messages/mom-letter.png
   assets/messages/mom-video.mp4
   assets/messages/bestfriend.mov
   ```

2. Edit `data/messages.json`:
   ```json
   [
     {
       "id": "msg-001",
       "sender": "Mom",
       "category": "Open when homesick",
       "message": "We are so proud of you. Every single day.",
       "unlockDate": "",
       "media": [
         "assets/messages/mom-letter.png",
         "assets/messages/mom-video.mp4"
       ]
     },
     {
       "id": "msg-002",
       "sender": "Best Friend",
       "category": "Open when celebrating",
       "message": "YOU DID IT!! I'm screaming!!",
       "unlockDate": "2026-07-14",
       "media": []
     }
   ]
   ```

3. Supported media: `.png` `.jpg` `.jpeg` `.gif` `.webp` `.mp4` `.mov` `.webm`
4. `unlockDate` — leave empty to allow opening anytime. Set a future date (YYYY-MM-DD) to lock until then.

---

## 📝 How the recipient adds content

Everything the recipient adds goes into **localStorage** automatically. They just use the site normally:

- **Diary** → click "New Entry"
- **Bucket List** → click "Add Quest", check items off
- **Gallery** → add photo/video paths
- **Admin page** → full creator mode (passcode: `summer` — change it in `js/admin.js`)

---

## 💾 How localStorage works

The site stores all user-added content in the browser's localStorage under these keys:

| Key | Content |
|-----|---------|
| `storybook_stops` | User-added travel stops |
| `storybook_diary` | Diary entries |
| `storybook_bucket` | Bucket list items |
| `storybook_messages` | User-added messages |
| `storybook_gallery` | Gallery media |
| `storybook_bucket_completed` | Completed bucket item IDs |

**JSON files** (in `data/`) are the permanent starter content — always there.
**localStorage** is the personal layer on top — saved in that browser only.

---

## 💾 Exporting and Backing Up Memories

Go to **Admin → Export / Reset → Download Backup**.

This downloads a `storybook-memories-YYYY-MM-DD.json` file with everything saved locally. Keep this file safe!

To restore: **Admin → Import Memories → Upload Backup File**.

---

## 🗺️ Adding starter data manually (JSON)

### stops.json
```json
[
  {
    "id": "amsterdam",
    "city": "Amsterdam",
    "country": "Netherlands",
    "arrivalDate": "2026-06-08",
    "departureDate": "2026-06-13",
    "status": "completed",
    "lat": 52.3676,
    "lng": 4.9041,
    "icon": "🚲",
    "quote": "Canal reflections and stroopwafels.",
    "coverImage": "assets/photos/amsterdam-cover.jpg",
    "notes": "Stayed in Jordaan."
  }
]
```

- `lat` / `lng` — decimal coordinates. Google "Amsterdam lat lng" to find them. The Leaflet map will place the pin at the exact real-world location.
- `status` — `"upcoming"` | `"current"` | `"completed"`

### diary.json
```json
[
  {
    "id": "entry-001",
    "stopId": "amsterdam",
    "title": "First Day",
    "date": "2026-06-08",
    "mood": "Joyful",
    "entryType": "Full Journal",
    "body": "Today was incredible...",
    "media": ["assets/photos/photo1.jpg"]
  }
]
```

### bucket.json
```json
[
  {
    "id": "bucket-001",
    "title": "Try a stroopwafel",
    "category": "Food",
    "stopId": "amsterdam",
    "completed": false,
    "notes": "From a street cart only."
  }
]
```

Valid categories: `"Places to Visit"` `"Food"` `"Experiences"` `"Museums & Landmarks"` `"Soft Goals"` `"Random Fun"`

### gallery.json
```json
[
  {
    "id": "media-001",
    "type": "image",
    "src": "assets/photos/canal.jpg",
    "caption": "The canals at sunset.",
    "stopId": "amsterdam",
    "date": "2026-06-09"
  }
]
```

---

## 🔒 Admin Passcode

The default passcode is `summer`. To change it, open `js/admin.js` and edit:

```js
PASSCODE: 'summer',
```

> This is **not real security** — it's just a friendly barrier. Anyone with browser dev tools can bypass it. That's fine — this is a personal gift site, not an app with sensitive data.

---

## 📁 Assets folder guide

```
assets/
  messages/     ← Pre-loaded birthday/gift messages (PNG, MP4, MOV)
  photos/       ← Travel photos and videos
  map/          ← Optional custom map background image
  textures/     ← Optional paper texture overlays
  icons/        ← Optional custom icons
```

---

## 💡 Tips

- The map auto-generates from your stops' `mapX`/`mapY` coordinates — no image needed.
- If you have a custom Europe map image, add it to `assets/map/europe.png` and reference it in `js/map.js`.
- All pages work independently — share a direct link to any page.
- The site works offline after first load (if files are local).

---

Made with 💛 for one very special summer abroad.
