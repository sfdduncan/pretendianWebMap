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

function addPhdLayers() {
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
  applyMovingLineVisibility();
  requestAnimationFrame(animateDots);

  document.getElementById("toggle-moving-line").addEventListener("change", e => {
    showMovingLine = e.target.checked;
    applyMovingLineVisibility();
  });
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
