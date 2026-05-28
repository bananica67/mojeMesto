const vsebnikPredlogov = document.getElementById('predlog-uporabnik');
const vsebnikObcina = document.getElementById('predlogi-obcina');

// Zamenjava lokalnega pomnilnika s FETCH iz baze
if (vsebnikPredlogov || vsebnikObcina) {
  fetch('/api/predlogi')
    .then(res => res.json())
    .then(predlogi => {

      // 1. IZPIS NA STRANI UPORABNIKOV (vse razen ID = 1)
      if (vsebnikPredlogov) {
        vsebnikPredlogov.innerHTML = '';
        const filtriraniUporabniki = predlogi.filter(p => p.tk_uporabnikid_uporabnik !== 1 && p.TK_Uporabnikid_uporabnik !== 1);
        
        filtriraniUporabniki.forEach(predlog => {
          const trenutniVsecki = localStorage.getItem(`glas_${predlog.id_objava}_vsecki`) || 0;
          const trenutniNeradi = localStorage.getItem(`glas_${predlog.id_objava}_neradi`) || 0;

          const karticaHTML = `
            <div class="col-lg-6">
              <div class="card shadow predlog-card">
                <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" class="card-img-top predlog-img" alt="slika">
                <div class="card-body p-4">
                  <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
                  <p class="text-muted">${predlog.opis}</p>
                  
                <div class="d-flex gap-3 my-4">
                  <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id_objava}, 'vsecki')">
                  <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id_objava}_vsecki">${trenutniVsecki}</span>
                  </button>

                  <button class="btn btn-danger glas-btn" onclick="glasuj(${predlog.id_objava}, 'neradi')">
                  <i class="fas fa-thumbs-down"></i> <span id="span_${predlog.id_objava}_neradi">${trenutniNeradi}</span>
                  </button>
                </div>
                  
                <hr>
                  
                <h5 class="fw-bold mb-3">Komentarji</h5>
                <div class="mb-3">
                  <div class="komentar"><small class="text-muted">Komentarji bodo na voljo kmalu.</small></div>
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

      // 2. IZPIS NA STRANI OBČINE (samo ID = 1)
      if (vsebnikObcina) {
        vsebnikObcina.innerHTML = '';
        const filtriranaObcina = predlogi.filter(p => p.tk_uporabnikid_uporabnik === 1 || p.TK_Uporabnikid_uporabnik === 1);
        
        filtriranaObcina.forEach(predlog => {
          const trenutniVseckiObcina = localStorage.getItem(`glas_${predlog.id_objava}_vsecki`) || 0;
          const trenutniNeradiObcina = localStorage.getItem(`glas_${predlog.id_objava}_neradi`) || 0;

          const karticaHTML = `
            <div class="col-lg-6">
              <div class="card shadow predlog-card">
                <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" class="card-img-top predlog-img" alt="slika">
                <div class="card-body p-4">
                  <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
                  <p class="text-muted">${predlog.opis}</p>
                  
                  <div class="d-flex gap-3 my-4">
                    <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id_objava}, 'vsecki')">
                    <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id_objava}_vsecki">${trenutniVseckiObcina}</span>
                    </button>

                    <button class="btn btn-danger glas-btn" onclick="glasuj(${predlog.id_objava}, 'neradi')">
                    <i class="fas fa-thumbs-down"></i> <span id="span_${predlog.id_objava}_neradi">${trenutniNeradiObcina}</span>
                    </button>
                  </div>
                  
                  <hr>
                  
                  <h5 class="fw-bold mb-3">Komentarji</h5>
                  <div class="mb-3">
                    <div class="komentar"><small class="text-muted">Komentarji bodo na voljo kmalu.</small></div>
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

    })
    .catch(err => console.error("Napaka pri nalaganju predlogov:", err));
}

// --- TUKAJ NAPREJ VSE OSTANE TOČNO TAKO, KOT SI IMELA NASTAVLJENO ---

const mapElementId = document.getElementById('map');
let izbraneKoordinate = null;

if (mapElementId) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let trenutniMarker = null;

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

const mapElementObcina = document.getElementById('map-obcina');

if (mapElementObcina) {
  const mapObcina = L.map('map-obcina').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapObcina);

  let trenchesMarkerObcina = null;

  mapObcina.on('click', function(e) {
    izbraneKoordinate = e.latlng; // Povezano na isto spremenljivko kot zgoraj
    if (trenchesMarkerObcina) {
      trenchesMarkerObcina.setLatLng(izbraneKoordinate);
    } else {
      trenchesMarkerObcina = L.marker(izbraneKoordinate).addTo(mapObcina);
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
        lat: izbraneKoordinate ? izbraneKoordinate.lat : null,
        lng: izbraneKoordinate ? izbraneKoordinate.lng : null
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
// SKRIPT ZA FILTRIRANJE (Ostane nedotaknjen)
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