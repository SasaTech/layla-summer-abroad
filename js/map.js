// ============================================
// map.js — Leaflet map with watercolour tiles
// Stamen Watercolor via Stadia Maps (free, no key needed for low usage)
// Stops use lat/lng instead of mapX/mapY percentages.
// Falls back gracefully if stops have no lat/lng (just skips those pins).
// ============================================

const MapRenderer = {

  stops:      [],
  map:        null,
  markers:    [],
  routeLine:  null,
  onPinClick: null,

  // Default view — centred on Europe
  DEFAULT_CENTER: [48.5, 15.0],
  DEFAULT_ZOOM:   5,

  async init(containerId, onPinClick) {
    this.onPinClick = onPinClick;
    this.stops = await Data.getStops();
    this._initLeaflet(containerId);
  },

  _initLeaflet(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destroy any previous instance (for refresh)
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers = [];
      this.routeLine = null;
    }

    // ---- Create map ----
    this.map = L.map(containerId, {
      center:          this.DEFAULT_CENTER,
      zoom:            this.DEFAULT_ZOOM,
      zoomControl:     true,
      attributionControl: true,
      scrollWheelZoom: false,   // nicer UX embedded in page
    });

    // ---- OpenStreetMap tiles — works everywhere, no key needed ----
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom:     2,
      maxZoom:     19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    // ---- Add stops ----
    this._addStops();

    // ---- Fit map to pins if we have any ----
    const geoStops = this.stops.filter(s => s.lat && s.lng);
    if (geoStops.length > 1) {
      const bounds = L.latLngBounds(geoStops.map(s => [s.lat, s.lng]));
      this.map.fitBounds(bounds, { padding: [48, 48] });
    } else if (geoStops.length === 1) {
      this.map.setView([geoStops[0].lat, geoStops[0].lng], 8);
    }

    // ---- Legend ----
    this._addLegend();
  },

  _makeIcon(stop) {
    const color  = stop.status === 'completed' ? '#e8c46a'
                 : stop.status === 'current'   ? '#f2b8c6'
                 : '#c9b8e8';
    const stroke = stop.status === 'completed' ? '#c49a2a'
                 : stop.status === 'current'   ? '#e8879a'
                 : '#9b84d4';
    const size   = stop.status === 'current' ? 44 : 36;
    const pulse  = stop.status === 'current'
      ? `<circle cx="22" cy="22" r="20" fill="${color}" opacity="0.25">
           <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
           <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/>
         </circle>`
      : stop.status === 'completed'
      ? `<circle cx="18" cy="18" r="16" fill="${color}" opacity="0.2">
           <animate attributeName="r" values="13;18;13" dur="3s" repeatCount="indefinite"/>
           <animate attributeName="opacity" values="0.3;0.08;0.3" dur="3s" repeatCount="indefinite"/>
         </circle>`
      : '';

    const cx = size / 2;
    const cy = size / 2;
    const r  = stop.status === 'current' ? 14 : 12;
    const opacity = stop.status === 'upcoming' ? 0.65 : 1;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" style="overflow:visible">
        <g opacity="${opacity}">
          ${pulse.replace(/cx="22"/g, `cx="${cx}"`).replace(/cy="22"/g, `cy="${cy}"`).replace(/cx="18"/g, `cx="${cx}"`).replace(/cy="18"/g, `cy="${cy}"`)}
          <!-- Drop shadow -->
          <circle cx="${cx}" cy="${cy + 2}" r="${r}" fill="rgba(61,44,30,0.18)"/>
          <!-- Pin body -->
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
          <!-- Icon -->
          <text x="${cx}" y="${cy}" dominant-baseline="middle" text-anchor="middle"
            font-size="${stop.status === 'current' ? 13 : 11}">${stop.icon || '📍'}</text>
          <!-- City label -->
          <text x="${cx}" y="${cy + r + 10}" dominant-baseline="middle" text-anchor="middle"
            font-family="Lato, sans-serif" font-weight="700" font-size="10"
            fill="#3d2c1e"
            stroke="white" stroke-width="3" paint-order="stroke">${stop.city}</text>
        </g>
      </svg>`;

    return L.divIcon({
      html:        svg,
      className:   '',
      iconSize:    [size, size + 8],
      iconAnchor:  [size / 2, size / 2],
      popupAnchor: [0, -(size / 2) - 4],
    });
  },

  _addStops() {
    const geoStops = this.stops.filter(s => s.lat && s.lng);

    // Route polyline
    if (geoStops.length > 1) {
      const latlngs = geoStops.map(s => [s.lat, s.lng]);
      if (this.routeLine) this.map.removeLayer(this.routeLine);
      this.routeLine = L.polyline(latlngs, {
        color:     '#e8c46a',
        weight:    2.5,
        opacity:   0.7,
        dashArray: '8, 6',
        lineCap:   'round',
      }).addTo(this.map);
    }

    // Markers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    geoStops.forEach(stop => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon:      this._makeIcon(stop),
        title:     stop.city,
        riseOnHover: true,
      }).addTo(this.map);

      marker.on('click', () => {
        if (this.onPinClick) this.onPinClick(stop);
      });

      this.markers.push(marker);
    });
  },

  _addLegend() {
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML = `
        <div style="
          background: rgba(253,248,240,0.92);
          border-radius: 10px;
          padding: 10px 14px;
          font-family: Lato, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #3d2c1e;
          box-shadow: 0 2px 10px rgba(61,44,30,0.12);
          border: 1px solid rgba(61,44,30,0.08);
          line-height: 1.8;
          backdrop-filter: blur(4px);
        ">
          <div style="display:flex;align-items:center;gap:7px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#e8c46a;border:2px solid #c49a2a;flex-shrink:0"></span>
            Visited
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#f2b8c6;border:2px solid #e8879a;flex-shrink:0"></span>
            Here now
          </div>
          <div style="display:flex;align-items:center;gap:7px">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#c9b8e8;border:2px solid #9b84d4;flex-shrink:0"></span>
            Coming up
          </div>
        </div>`;
      return div;
    };
    legend.addTo(this.map);
  },

  async refresh(containerId) {
    this.stops = await Data.getStops();
    this._addStops();
    const geoStops = this.stops.filter(s => s.lat && s.lng);
    if (geoStops.length > 1) {
      const bounds = L.latLngBounds(geoStops.map(s => [s.lat, s.lng]));
      this.map.fitBounds(bounds, { padding: [48, 48] });
    }
  }
};
