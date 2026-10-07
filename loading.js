const REVEAL_DELAY_MS = 400;
const REVEAL_TIMEOUT_MS = 400;

function revealMap() {
  document.getElementById("loading").classList.add("done");
}

// Reveals once every source and tile has rendered, with a short buffer
function revealWhenReady() {
  map.once("idle", () => setTimeout(revealMap, REVEAL_DELAY_MS));
  // Never leave the cover up if loading stalls
  setTimeout(revealMap, REVEAL_TIMEOUT_MS);
}
