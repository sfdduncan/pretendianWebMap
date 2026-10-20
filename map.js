mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/sfduncan/cm35a32qx016m01pa7opc4fzi",
  center: [-104, 45],
  zoom: 3.48,
  minZoom: 0,
  maxZoom: 12,
  maxBounds: [[-160, 0], [-40, 75]], // [SW, NE] includes the initial view and limits panning
});
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

let popup = null;

function updateMapStatus() {
  const center = map.getCenter();
  document.getElementById("map-status-zoom").textContent = map.getZoom().toFixed(2);
  document.getElementById("map-status-lat").textContent = center.lat.toFixed(4);
  document.getElementById("map-status-lon").textContent = center.lng.toFixed(4);
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

function clearSelection() {
  resetHighlight();
  clearPhd();
}

function addPeopleLayer(features) {
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

// Only the dots are interactive; any other click clears the selection
function onMapClick(e) {
  const hits = map.queryRenderedFeatures(e.point, { layers: ["people-points"] });
  if (!hits.length) {
    if (popup) popup.remove();
    clearSelection();
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
}

map.on("load", () => {
  updateMapStatus();
  map.on("move", updateMapStatus);
  hideBasemapLabels();
  addTerritoryLayers();

  loadPeople(features => {
    addPhdLayers();
    addPeopleLayer(features);
    revealWhenReady();
  });

  map.on("click", onMapClick);
  map.on("mouseenter", "people-points", () => map.getCanvas().style.cursor = "pointer");
  map.on("mouseleave", "people-points", () => map.getCanvas().style.cursor = "");
});
