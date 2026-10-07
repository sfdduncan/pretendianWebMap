const BASE_OPACITY = 0.2;
const DIM_OPACITY = 0.05;
const HIGHLIGHT_OPACITY = .5;
const FADE_MS = 1200;

let territoryFeatures = [];

function hideBasemapLabels() {
  map.getStyle().layers
    .filter(l => l.type === "symbol" || /label/.test(l.id))
    .forEach(l => map.setLayoutProperty(l.id, "visibility", "none"));
  // Standard-style basemaps keep labels inside an import
  ["showPlaceLabels", "showRoadLabels", "showPointOfInterestLabels", "showTransitLabels"].forEach(k => {
    try { map.setConfigProperty("basemap", k, false); } catch (e) { /* not a Standard style */ }
  });
}

function addTerritoryLayers() {
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
