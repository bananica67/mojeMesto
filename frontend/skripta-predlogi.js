// ----------------------------
// SKRIPT ZA PREDLOGE 
// ----------------------------

const zacetniPredlogi = [
  {
    id: 1,
    naslov: "Obupna cesta v Melju",
    opis: "A ste videli te luknje v Melju? Vsak dan se vozim tam v službo in samo čakam, kdaj mi bo odletela guma. Ko dežuje, se sploh ne vidi, kako globoke so.",
    slika: "slike/predlog_1.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Janja", besedilo: "Katastrofa je tam, res. Vsak dan cik-cak vozim." },
      { avtor: "Marko", besedilo: "Se strinjam." }
    ]
  },
  {
    id: 2,
    naslov: "Poplava na Smetanovi",
    opis: "Vsakič, ko malo bolj dežuje, se na Smetanovi pri FERI-ju naredi pravo jezero. Voda sploh ne odteka in stoji tam cel dan. Pešci ne moremo čez cesto.",
    slika: "slike/predlog_2.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Nik", besedilo: "Vem prav grozno je." },
      { avtor: "Ana", besedilo: "Pa vozit se je tam mimo tudi obupno, ko je tako." }
    ]
  }
];

if (!localStorage.getItem('vsiPredlogi')) {
  localStorage.setItem('vsiPredlogi', JSON.stringify(zacetniPredlogi));
}

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');

if (vsebnikPredlogov) {
  const predlogi = JSON.parse(localStorage.getItem('vsiPredlogi'));
  
  vsebnikPredlogov.innerHTML = '';

  predlogi.forEach(predlog => {
    
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    const trenutniVsecki = localStorage.getItem(`glas_${predlog.id}_vsecki`) || 0;
    const trenutniNeradi = localStorage.getItem(`glas_${predlog.id}_neradi`) || 0;

    const karticaHTML = `
      <div class="col-lg-6">
        <div class="card shadow predlog-card">
          <img src="${predlog.slika}" class="card-img-top predlog-img" alt="slika">
          <div class="card-body p-4">
            <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
            <p class="text-muted">${predlog.opis}</p>
            
          <div class="d-flex gap-3 my-4">
            <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id}, 'vsecki')">
            <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id}_vsecki">${trenutniVsecki}</span>
            </button>

            <button class="btn btn-danger glas-btn" onclick="glasuj(${predlog.id}, 'neradi')">
            <i class="fas fa-thumbs-down"></i> <span id="span_${predlog.id}_neradi">${trenutniNeradi}</span>
            </button>
          </div>
            
          <hr>
            
          <h5 class="fw-bold mb-3">Komentarji</h5>
          <div class="mb-3">
            ${komentarjiHTML}
          </div>
                            
          <textarea class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
          <button class="btn komentar-gumb fw-bold">Objavi komentar</button>
          </div>
        </div>
      </div>
    `;

    vsebnikPredlogov.innerHTML += karticaHTML;
  });
}

const mapElementId = document.getElementById('map');

if (mapElementId) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let trenutniMarker = null;
  let izbraneKoordinate = null;

  map.on('click', function(e) {
    izbraneKoordinate = e.latlng;
    if (trenutniMarker) {
      trenutniMarker.setLatLng(izbraneKoordinate);
    } else {
      trenutniMarker = L.marker(izbraneKoordinate).addTo(map);
    }
  });
}

const gumbObjavi = document.getElementById('gumb-objavi');

if (gumbObjavi) {
  gumbObjavi.addEventListener('click', function() {
    const naslov = document.getElementById('naslov').value;
    const opis = document.getElementById('opis').value;
    const slikaInput = document.getElementById('slika');

    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    function shraniInPreusmeri(koncnaSlikaUrl) {
      const vsiPredlogi = JSON.parse(localStorage.getItem('vsiPredlogi')) || [];
      const novId = vsiPredlogi.length + 1;

      const novPredlog = {
        id: novId,
        naslov: naslov,
        opis: opis,
        slika: koncnaSlikaUrl, 
        vsecki: 0,
        komentarji: [],
        lat: typeof izbraneKoordinate !== 'undefined' && izbraneKoordinate ? izbraneKoordinate.lat : null,
        lng: typeof izbraneKoordinate !== 'undefined' && izbraneKoordinate ? izbraneKoordinate.lng : null
      };

      vsiPredlogi.push(novPredlog);
      localStorage.setItem('vsiPredlogi', JSON.stringify(vsiPredlogi));
      window.location.href = "predlogi.html";
    }

    if (slikaInput && slikaInput.files && slikaInput.files[0]) {
      const izbranaDatoteka = slikaInput.files[0];
      const reader = new FileReader();

      reader.onloadend = function() {
        shraniInPreusmeri(reader.result);
      };

      reader.readAsDataURL(izbranaDatoteka);
    } else {
      shraniInPreusmeri("slike/zacetna.jpg");
    }
  });
}

const zacetniPredlogiObcine = [
  {
    id: 1,
    naslov: "Nova kolesarska pot",
    opis: "Občina načrtuje izgradnjo nove kolesarske poti med centrom mesta in mestnim parkom za večjo varnost kolesarjev.",
    slika: "slike/kolo.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Mitja", besedilo: "To bi zelo izboljšalo promet v centru." },
      { avtor: "Nina", besedilo: "Super ideja za bolj varno vožnjo s kolesom." }
    ]
  },
  {
    id: 2,
    naslov: "Prenova avtobusnih postaj",
    opis: "Predlagana je prenova avtobusnih postaj z novimi nadstreški, osvetlitvijo in digitalnimi prikazovalniki prihodov.",
    slika: "slike/avtobus.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Miha", besedilo: "Končno nekaj koristnega za javni prevoz." },
      { avtor: "Petra", besedilo: "Upam da pride tudi več avtobusov." }
    ]
  },
  {
    id: 3,
    naslov: "Boljša osvetlitev pešpoti",
    opis: "Uporabniki opozarjajo na slabo osvetljene poti ob robu mesta, kaj zmanjšuje občutek varnosti v večernih urah.",
    slika: "slike/osvetlitev.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Janez", besedilo: "Poti ob gozdu so res popolnoma v temi, nujno rabimo luči." },
      { avtor: "Maja", besedilo: "Se strinjam, pozimi je tam zelo neprijetno hoditi." }
    ]
  },
  {
    id: 4,
    naslov: "Ureditev mestnega parka",
    opis: "Potrebno bi bilo rednejše vzdrževanje klopi in namestitev dodatnih košev za odpadke v osrednjem parku.",
    slika: "slike/park.jpeg",
    vsecki: 0,
    komentarji: [
      { avtor: "Luka", besedilo: "Koši so čez vikend vedno polni, potrebujemo pogostejši odvoz." },
      { avtor: "Anja", besedilo: "Park je nujno potreben prenove, sploh klopi." }
    ]
  }
];

if (!localStorage.getItem('vsiPredlogiObcine')) {
  localStorage.setItem('vsiPredlogiObcine', JSON.stringify(zacetniPredlogiObcine));
}

const vsebnikObcina = document.getElementById('predlogi-obcina');

if (vsebnikObcina) {
  const predlogi = JSON.parse(localStorage.getItem('vsiPredlogiObcine'));
  
  vsebnikObcina.innerHTML = '';

  predlogi.forEach(predlog => {
    
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    const trenutniVseckiObcina = localStorage.getItem(`glas_${predlog.id}_vsecki`) || 0;
    const trenutniNeradiObcina = localStorage.getItem(`glas_${predlog.id}_neradi`) || 0;

    const karticaHTML = `
      <div class="col-lg-6">
        <div class="card shadow predlog-card">
          <img src="${predlog.slika}" class="card-img-top predlog-img" alt="slika">
          <div class="card-body p-4">
            <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
            <p class="text-muted">${predlog.opis}</p>
            
            <div class="d-flex gap-3 my-4">
              <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id}, 'vsecki')">
              <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id}_vsecki">${trenutniVseckiObcina}</span>
              </button>

              <button class="btn btn-danger glas-btn" onclick="glasuj(${predlog.id}, 'neradi')">
              <i class="fas fa-thumbs-down"></i> <span id="span_${predlog.id}_neradi">${trenutniNeradiObcina}</span>
              </button>
            </div>
            
            <hr>
            
            <h5 class="fw-bold mb-3">Komentarji</h5>
            <div class="mb-3">
              ${komentarjiHTML}
            </div>
                            
            <textarea class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
            <button class="btn komentar-gumb fw-bold">Objavi komentar</button>
          </div>
        </div>
      </div>
    `;

    vsebnikObcina.innerHTML += karticaHTML;
  });
}

const mapElementObcina = document.getElementById('map-obcina');
let izbraneKoordinateObcina = null;

if (mapElementObcina) {
  const mapObcina = L.map('map-obcina').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapObcina);

  let trenchesMarkerObcina = null;

  mapObcina.on('click', function(e) {
    izbraneKoordinateObcina = e.latlng;
    if (trenchesMarkerObcina) {
      trenchesMarkerObcina.setLatLng(izbraneKoordinateObcina);
    } else {
      trenchesMarkerObcina = L.marker(izbraneKoordinateObcina).addTo(mapObcina);
    }
  });
}

const gumbObjaviObcina = document.getElementById('gumb-objavi-obcina');

if (gumbObjaviObcina) {
  gumbObjaviObcina.addEventListener('click', function() {
    const naslov = document.getElementById('naslov-obcina').value;
    const opis = document.getElementById('opis-obcina').value;
    const slikaInputObcina = document.getElementById('slika-obcina'); 

    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    function shraniInOsveziObcino(koncnaSlikaUrl) {
      const vsiPredlogiObcine = JSON.parse(localStorage.getItem('vsiPredlogiObcine')) || [];
      const novId = vsiPredlogiObcine.length + 1;

      const novPredlogObcine = {
        id: novId,
        naslov: naslov,
        opis: opis,
        slika: koncnaSlikaUrl, 
        vsecki: 0,
        komentarji: [],
        lat: izbraneKoordinateObcina ? izbraneKoordinateObcina.lat : null,
        lng: izbraneKoordinateObcina ? izbraneKoordinateObcina.lng : null
      };

      vsiPredlogiObcine.push(novPredlogObcine);
      localStorage.setItem('vsiPredlogiObcine', JSON.stringify(vsiPredlogiObcine));
      window.location.reload();
    }

    if (slikaInputObcina && slikaInputObcina.files && slikaInputObcina.files[0]) {
      const izbranaDatoteka = slikaInputObcina.files[0];
      const reader = new FileReader();

      reader.onloadend = function() {
        shraniInOsveziObcino(reader.result);
      };

      reader.readAsDataURL(izbranaDatoteka);
    } else {
      shraniInOsveziObcino("slike/zacetna.jpg");
    }
  });
}

// ----------------------------
// SKRIPT ZA VŠEČKE 
// ----------------------------

window.glasuj = function(id, tip) {
    const kljuc = `glas_${id}_${tip}`;
    
    let trenutnoGlasov = parseInt(localStorage.getItem(kljuc) || 0) + 1;
    localStorage.setItem(kljuc, trenutnoGlasov);
    
    const span = document.getElementById(`span_${id}_${tip}`);
    if (span) {
        span.textContent = trenutnoGlasov;
    }
};

// ----------------------------
// SKRIPT ZA FILTRIRANJE 
// ----------------------------

const filterUporabnik = document.getElementById("filter-uporabnik");
if (filterUporabnik) {
  filterUporabnik.addEventListener("change", function () {
    let predlogi = JSON.parse(sessionStorage.getItem("vsiPredlogi")) || [];

    if (this.value === "najnovejsi") {
      predlogi.sort((a, b) => b.datum - a.datum);
    }
    else if (this.value === "najstarejsi") {
      predlogi.sort((a, b) => a.datum - b.datum);
    }
    else if (this.value === "vsecki") {
      predlogi.sort((a, b) => b.vsecki - a.vsecki);
    }
    prikaziPredlogeUporabnik(predlogi);
  });
}

const filterObcina = document.getElementById("filter-obcina");
if (filterObcina) {
  filterObcina.addEventListener("change", function () {
    let predlogi = JSON.parse(sessionStorage.getItem("vsiPredlogiObcine")) || [];

    if (this.value === "najnovejsi") {
      predlogi.sort((a, b) => b.datum - a.datum);
    }
    else if (this.value === "najstarejsi") {
      predlogi.sort((a, b) => a.datum - b.datum);
    }
    else if (this.value === "vsecki") {
      predlogi.sort((a, b) => b.vsecki - a.vsecki);
    }
    prikaziPredlogeObcina(predlogi);
  });
}