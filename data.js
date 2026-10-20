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
    "Chahta Yakni (Choctaw)",
    "Eastern Shawnee (Oklahoma)",
    "Shawandasse Tula (Shawanwaki/Shawnee)",
    "Potawatomi-Shawnee (Oklahoma)",
    "Bodwéwadmi (Potawatomi)"
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

// Parses the CSV into GeoJSON point features, one per person with valid coordinates.
function loadPeople(onLoaded) {
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
            institution: (r["Institution"] || r["Current or Most Recent Institution"] || "").trim(),
            gender: (r["Gender"] || "").trim(),
            sources: (r["Notes/Links"] || "").trim(),
            phdLat: r["PhD_Lat"],
            phdLon: r["PhD_Lon"],
            phdInstitution: (r["PhD Institution"] || r["PhD Name"] || "").trim(),
            claims: JSON.stringify(
              ["Claim 1", "Claim 2", "Claim 3", "Claim 4", "Claim 5"].map(k => (r[k] || "").trim()).filter(Boolean)
            )
          }
        }));
      onLoaded(features);
    }
  });
}
