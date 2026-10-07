mapboxgl.accessToken = MAPBOX_TOKEN;

const CSV_URL = "False Claims Data - Incidents_Coords.csv";
const TERRITORIES_URL = "Indigenous_Territories_NorthAmerica.geojson";
const HEADSHOT_DIR = "pretendianHeadshots/";

// "First Last" -> file in pretendianHeadshots. Fill in or correct as needed.
const HEADSHOTS = {
  "Leila Blackbird": "blackbird_leila.jpeg",
  "Maylei Blackwell": "maylei_blackwell.jpeg",
  "Kent Blansett": "kent-blansett.jpg",
  "Carrie Bourassa": "carrie-bourassa.jpeg",
  "Lisa Brooks": "lisaBrooks.jpg",
  "Alicia Carroll": "alicia_Carrol.jpeg",
  "Qwo-Li Driskill": "quolidriskill.jpeg",
  "Elizabeth Hoover": "ElizabethHoover.jpeg",
  "Lindsay Montgomery": "lindsay-montgomery-portrait.jpg",
  "Sandra Muse Isaacs": "SandraMuseIsaacs.jpeg",
  "Julie Nagam": "JulieNagam.jpg",
  "Andrea Smith": "andreaSmith.jpeg",
  "Vianne Timmons": "VianneTimmons.png",
  "Mary Ellen Turpel-Lafond": "MaryEllenTurpel-Lafond.jpg",
  "Theodore Van Alst": "TheodoreVanAlst.jpeg"
};

// Territories to highlight for each person, by exact `Name` in the territories GeoJSON.
const TERRITORIES_BY_PERSON = {
  "Leila Blackbird": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)",
    "Jicarilla Apache",
    "San Carlos Apache",
    "White Mountain Apache",
    "Yavapai Apache",
    "Chiricahua Apache",
    "Ndee/Nnēē: (Western Apache)",
    "Mescalero Apache",
    "Ndé Kónitsąąíí Gokíyaa (Lipan Apache)"
  ],
  "Maylei Blackwell": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)"
  ],
  "Kent Blansett": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)",
    "Mvskoke (Muscogee)",
    "Muscogee (Oklahoma)",
    "Choctaw (Oklahoma)",
    "Chahta Yakni (Choctaw)"
  ],
  "Carrie Bourassa": [
    "Mountain Métis",
    "Kelly Lake Metis Settlement Society",
    "Sahtu Dene and Metis",
    "Michif Piyii (Métis)",
    "NWT Métis Nation",
    "Anishinabewaki ᐊᓂᔑᓈᐯᐗᑭ",
    "Odawa",
    "Ottawa (Oklahoma)",
    "Teslin Tlingit Council (Yukon)",
    "Lingít Aaní (Tlingit)",
    "Taku River Tlingit",
    "Teslin Tlingit Council (BC)"
  ],
  "Lisa Brooks": [
    "N’dakina (Abenaki / Abénaquis)"
  ],
  "Alicia Carroll": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)"
  ],
  "Qwo-Li Driskill": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)",
    "Munsee Lenape",
    "Lenapehoking (Lenni-Lenape)",
    "Lumbee"
  ],
  "Elizabeth Hoover": [
    "Kanienʼkehá꞉ka (Mohawk)",
    "Mi’kma’ki"
  ],
  "Lindsay Montgomery": [
    "Mvskoke (Muscogee)",
    "Muscogee (Oklahoma)"
  ],
  "Sandra Muse Isaacs": [
    "ᏣᎳᎫᏪᏘᏱ Tsalaguwetiyi (Cherokee, East)",
    "Cherokee (Oklahoma)"
  ],
  "Julie Nagam": [
    "Mountain Métis",
    "Kelly Lake Metis Settlement Society",
    "Sahtu Dene and Metis",
    "Michif Piyii (Métis)",
    "NWT Métis Nation"
  ],
  "Vianne Timmons": [
    "Mi’kma’ki"
  ],
  "Mary Ellen Turpel-Lafond": [
    "Sturgeon Lake Cree",
    "ᓀᐦᐃᔭᐤ ᐊᐢᑭᕀ Nêhiyaw-Askiy (Plains Cree)",
    "Big Stone Cree",
    "As’in’i’wa’chi Niy’yaw Askiy (Rocky Mountain Cree)",
    "Woodland Cree",
    "Beaver Lake Cree",
    "ᐃᓕᓕᐗᔅᑭᔾ Ililiwaskiy (Moose Cree)",
    "Cree"
  ],
  "Theodore Van Alst": [
    "Anishinabewaki ᐊᓂᔑᓈᐯᐗᑭ",
    "Odawa",
    "Ottawa (Oklahoma)",
    "Oohenumpa",
    "Mnicoujou",
    "Itazipco",
    "Hunkpapa",
    "Sicangu"
  ]
};

const BASE_OPACITY = 0.2;
const DIM_OPACITY = 0.05;
const HIGHLIGHT_OPACITY = .5;
const FADE_MS = 1200;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/sfduncan/cm35a32qx016m01pa7opc4fzi",
  center: [-104, 43],
  zoom: 3.48,
});
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

let territoryFeatures = [];
let popup = null;
let phdLine = null; // great-circle coordinates for the selected person
let showMovingLine = true;

const ARC_STEPS = 100;
const DOT_COUNT = 8;
const LOOP_MS = 6000;

const EMPTY_FC = { type: "FeatureCollection", features: [] };

// Interpolates points along the great circle so the line curves in Mercator
function greatCircle([lon1, lat1], [lon2, lat2], steps) {
  const rad = Math.PI / 180;
  const [p1, l1, p2, l2] = [lat1 * rad, lon1 * rad, lat2 * rad, lon2 * rad];
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2
  ));
  if (d === 0) return [[lon1, lat1], [lon2, lat2]];
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(p1) * Math.cos(l1) + b * Math.cos(p2) * Math.cos(l2);
    const y = a * Math.cos(p1) * Math.sin(l1) + b * Math.cos(p2) * Math.sin(l2);
    const z = a * Math.sin(p1) + b * Math.sin(p2);
    pts.push([Math.atan2(y, x) / rad, Math.atan2(z, Math.hypot(x, y)) / rad]);
  }
  return pts;
}

function applyMovingLineVisibility() {
  const v = showMovingLine ? "visible" : "none";
  ["phd-line", "phd-dots"].forEach(id => map.setLayoutProperty(id, "visibility", v));
}

function showPhd(p, destination) {
  const lat = parseFloat(p.phdLat), lon = parseFloat(p.phdLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { clearPhd(); return; }
  const origin = [lon, lat];
  phdLine = greatCircle(origin, destination, ARC_STEPS);
  map.getSource("phd-point").setData({
    type: "Feature", geometry: { type: "Point", coordinates: origin },
    properties: { label: p.phdInstitution }
  });
  map.getSource("phd-line").setData({
    type: "Feature", geometry: { type: "LineString", coordinates: phdLine }, properties: {}
  });
  document.getElementById("filters").style.display = "block";
}

function clearPhd() {
  phdLine = null;
  document.getElementById("filters").style.display = "none";
  map.getSource("phd-point").setData(EMPTY_FC);
  map.getSource("phd-line").setData(EMPTY_FC);
  map.getSource("phd-dots").setData(EMPTY_FC);
}

function animateDots(t) {
  if (phdLine && showMovingLine) {
    const n = phdLine.length - 1;
    const features = [];
    for (let i = 0; i < DOT_COUNT; i++) {
      const f = ((t / LOOP_MS) + i / DOT_COUNT) % 1;
      const idx = f * n;
      const lo = Math.floor(idx), hi = Math.min(lo + 1, n), w = idx - lo;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [
          phdLine[lo][0] + (phdLine[hi][0] - phdLine[lo][0]) * w,
          phdLine[lo][1] + (phdLine[hi][1] - phdLine[lo][1]) * w
        ] },
        properties: {}
      });
    }
    map.getSource("phd-dots").setData({ type: "FeatureCollection", features });
  }
  requestAnimationFrame(animateDots);
}

function hideBasemapLabels() {
  map.getStyle().layers
    .filter(l => l.type === "symbol" || /label/.test(l.id))
    .forEach(l => map.setLayoutProperty(l.id, "visibility", "none"));
  // Standard-style basemaps keep labels inside an import
  ["showPlaceLabels", "showRoadLabels", "showPointOfInterestLabels", "showTransitLabels"].forEach(k => {
    try { map.setConfigProperty("basemap", k, false); } catch (e) { /* not a Standard style */ }
  });
}

function territoryIdsForPerson(personName) {
  const names = new Set(TERRITORIES_BY_PERSON[personName] || []);
  return territoryFeatures
    .filter(f => names.has(f.properties.Name))
    .map(f => f.properties.ID);
}

// Layer-level opacity changes are what Mapbox animates, so the fade drives constant values.
function highlight(ids) {
  const filter = ["in", ["get", "ID"], ["literal", ids]];
  map.setFilter("territories-highlight", filter);
  map.setFilter("territories-highlight-outline", filter);
  map.setFilter("territories-labels", filter);
  map.setPaintProperty("territories-fill", "fill-opacity", DIM_OPACITY);
  map.setPaintProperty("territories-highlight", "fill-opacity", HIGHLIGHT_OPACITY);
  map.setPaintProperty("territories-highlight-outline", "line-opacity", 1);
  map.setPaintProperty("territories-labels", "text-opacity", 1);
}

function resetHighlight() {
  map.setPaintProperty("territories-fill", "fill-opacity", BASE_OPACITY);
  map.setPaintProperty("territories-highlight", "fill-opacity", 0);
  map.setPaintProperty("territories-highlight-outline", "line-opacity", 0);
  map.setPaintProperty("territories-labels", "text-opacity", 0);
}

// Draws a six-armed asterisk as map icon image data (24px, used at 2x pixel ratio)
function makeAsteriskImage(color) {
  const size = 36;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const c = size / 2;
  const r = size / 2 - 4;
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(c - r * Math.cos(a), c - r * Math.sin(a));
    ctx.lineTo(c + r * Math.cos(a), c + r * Math.sin(a));
    ctx.stroke();
  }
  return ctx.getImageData(0, 0, size, size);
}

function buildPopup(p) {
  const el = document.createElement("div");

  const file = HEADSHOTS[p.name];
  if (file) {
    const img = document.createElement("img");
    img.className = "popup-photo";
    img.src = HEADSHOT_DIR + encodeURIComponent(file);
    img.alt = p.name;
    el.appendChild(img);
  } else {
    const empty = document.createElement("div");
    empty.className = "popup-photo popup-photo-empty";
    empty.textContent = "No photo";
    el.appendChild(empty);
  }

  const name = document.createElement("div");
  name.className = "popup-name";
  name.textContent = p.gender ? `${p.name}, ${p.gender}` : p.name;
  el.appendChild(name);

  const inst = document.createElement("div");
  inst.className = "popup-institution";
  inst.textContent = p.institution;
  el.appendChild(inst);

  const claims = JSON.parse(p.claims);
  if (claims.length) {
    const line = document.createElement("div");
    line.className = "popup-line";
    const label = document.createElement("strong");
    label.textContent = "False Claims: ";
    line.append(label, claims.join(", "));
    el.appendChild(line);
  }

  const sources = (p.sources || "").split(/\s+/).filter(Boolean);
  if (sources.length) {
    const line = document.createElement("div");
    line.className = "popup-line";
    const label = document.createElement("strong");
    label.textContent = "Sources: ";
    line.appendChild(label);
    sources.forEach((s, i) => {
      if (i) line.append(", ");
      if (/^https?:\/\//i.test(s)) {
        const a = document.createElement("a");
        a.href = s;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = s;
        line.appendChild(a);
      } else {
        line.append(s);
      }
    });
    el.appendChild(line);
  }
  return el;
}

function clearSelection() {
  resetHighlight();
  clearPhd();
}

map.on("load", () => {
  hideBasemapLabels();

  map.addSource("territories", { type: "geojson", data: TERRITORIES_URL });
  const fadeIn = { duration: FADE_MS };
  const color = ["coalesce", ["get", "color"], "#7a9e6b"];
  const none = ["==", ["get", "ID"], ""];
  map.addLayer({
    id: "territories-fill",
    type: "fill",
    source: "territories",
    paint: {
      "fill-color": color,
      "fill-opacity": BASE_OPACITY,
      "fill-opacity-transition": fadeIn
    }
  });
  map.addLayer({
    id: "territories-highlight",
    type: "fill",
    source: "territories",
    filter: none,
    paint: {
      "fill-color": color,
      "fill-opacity": 0,
      "fill-opacity-transition": fadeIn
    }
  });
  map.addLayer({
    id: "territories-highlight-outline",
    type: "line",
    source: "territories",
    filter: none,
    paint: {
      "line-color": color,
      "line-width": .5,
      "line-opacity": 0,
      "line-opacity-transition": fadeIn
    }
  });
  map.addLayer({
    id: "territories-labels",
    type: "symbol",
    source: "territories",
    filter: none,
    layout: {
      "text-field": ["get", "Name"],
      "text-size": 8,
      "text-max-width": 8
    },
    paint: {
      "text-color": "#222",
      "text-halo-width": 1.5,
      "text-opacity": 0,
      "text-opacity-transition": fadeIn
    }
  });

  // Keep a copy of the territory features for claim matching
  fetch(TERRITORIES_URL).then(r => r.json()).then(g => { territoryFeatures = g.features; });

  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      const features = data
        .map(r => ({ r, lat: parseFloat(r.Lat), lon: parseFloat(r.Long) }))
        .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon))
        .map(({ r, lat, lon }) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: {
            name: `${r["First Name"]} ${r["Last Name"]}`.trim(),
            institution: r["Institution"],
            gender: (r["Gender"] || "").trim(),
            sources: (r["Notes/Links"] || "").trim(),
            phdLat: r["PhD_Lat"],
            phdLon: r["PhD_Lon"],
            phdInstitution: (r["PhD Institution"] || r["PhD Name"] || "").trim(),
            claims: JSON.stringify(
              ["Claim 1", "Claim 2", "Claim 3"].map(k => (r[k] || "").trim()).filter(Boolean)
            )
          }
        }));

      map.addSource("phd-point", { type: "geojson", data: EMPTY_FC });
      map.addSource("phd-line", { type: "geojson", data: EMPTY_FC });
      map.addSource("phd-dots", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "phd-line",
        type: "line",
        source: "phd-line",
        layout: { "line-cap": "round" },
        paint: { "line-color": "#d9381e", "line-width": .5, "line-opacity": 0.5 }
      });
      map.addLayer({
        id: "phd-dots",
        type: "circle",
        source: "phd-dots",
        paint: { "circle-radius": 3, "circle-color": "#d9381e", "circle-stroke-color": "#fff", "circle-stroke-width": 1 }
      });
      map.addLayer({
        id: "phd-point",
        type: "circle",
        source: "phd-point",
        paint: { "circle-radius": 6, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#c50000", "circle-stroke-width": 2 }
      });
      applyMovingLineVisibility();
      map.addLayer({
        id: "phd-label",
        type: "symbol",
        source: "phd-point",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-max-width": 10
        },
        paint: { "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 1.5 }
      });
      requestAnimationFrame(animateDots);

      map.addImage("asterisk", makeAsteriskImage("#d9381e"), { pixelRatio: 2 });
      map.addSource("people", { type: "geojson", data: { type: "FeatureCollection", features } });
      map.addLayer({
        id: "people-points",
        type: "symbol",
        source: "people",
        layout: {
          "icon-image": "asterisk",
          "icon-size": 1,
          "icon-allow-overlap": true
        }
      });
    }
  });

  // Only the dots are interactive; any other click clears the selection
  map.on("click", e => {
    const hits = map.queryRenderedFeatures(e.point, { layers: ["people-points"] });
    if (!hits.length) {
      if (popup) popup.remove();
      resetHighlight();
      clearPhd();
      return;
    }
    const f = hits[0];
    if (popup) popup.off("close", clearSelection).remove();
    popup = new mapboxgl.Popup({ offset: 12 })
      .setLngLat(f.geometry.coordinates)
      .setDOMContent(buildPopup(f.properties))
      .addTo(map);
    popup.on("close", clearSelection);
    highlight(territoryIdsForPerson(f.properties.name));
    showPhd(f.properties, f.geometry.coordinates);
  });

  document.getElementById("toggle-moving-line").addEventListener("change", e => {
    showMovingLine = e.target.checked;
    if (map.getLayer("phd-line")) applyMovingLineVisibility();
  });

  map.on("mouseenter", "people-points", () => map.getCanvas().style.cursor = "pointer");
  map.on("mouseleave", "people-points", () => map.getCanvas().style.cursor = "");
});
