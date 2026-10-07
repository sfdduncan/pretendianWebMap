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
