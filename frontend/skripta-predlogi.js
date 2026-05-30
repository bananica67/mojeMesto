const vsebnikPredlogov = document.getElementById('predlog-uporabnik');
const vsebnikObcina = document.getElementById('predlogi-obcina');

// -------------------------------------------------------------
// 1. NALAGANJE IN FILTRIRANJE OBJAV IZ SQL BAZE
// -------------------------------------------------------------
if (vsebnikPredlogov || vsebnikObcina) {
  fetch('/api/predlogi')
    .then(res => res.json())
    .then(predlogi => {

      // A) IZPIS NA STRANI UPORABNIKOV (Vse objave, kjer avtor NI ID = 1)
      if (vsebnikPredlogov) {
        vsebnikPredlogov.innerHTML = '';
        const filtriraniUporabniki = predlogi.filter(p => parseInt(p.tk_uporabnikid_uporabnik) !== 1);
        
        filtriraniUporabniki.forEach(predlog => {
          // Všečke beremo direktno iz SQL stolpca 'st_vseckov'
          const trenutniVsecki = predlog.st_vseckov || 0; 

          vsebnikPredlogov.innerHTML += generirajKarticoHTML(predlog, trenutniVsecki);
        });
      }

      // B) IZPIS NA STRANI OBČINE (Samo uradne objave, kjer je avtor ID = 1)
      if (vsebnikObcina) {
        vsebnikObcina.innerHTML = '';
        const filtriranaObcina = predlogi.filter(p => parseInt(p.tk_uporabnikid_uporabnik) === 1);
        
        filtriranaObcina.forEach(predlog => {
          const trenutniVseckiObcina = predlog.st_vseckov || 0;

          vsebnikObcina.innerHTML += generirajKarticoHTML(predlog, trenutniVseckiObcina);
        });
      }

    })
    .catch(err => console.error("Napaka pri nalaganju predlogov:", err));
}

// Pomožna funkcija za generiranje izgleda kartice (Gumb za nevšečke je odstranjen)
function generirajKarticoHTML(predlog, vsecki) {
  return `
    <div class="col-lg-6">
      <div class="card shadow predlog-card">
        <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" class="card-img-top predlog-img" alt="slika">
        <div class="card-body p-4">
          <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
          <p class="text-muted">${predlog.opis}</p>
          
          <div class="d-flex gap-3 my-4">
            <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id_objava})">
              <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id_objava}_vsecki">${vsecki}</span>
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
}



// -------------------------------------------------------------
// 2. INICIACIJA ZEMLJEVIDA (Skupni ID: map-predlog)
// -------------------------------------------------------------
const mapElement = document.getElementById('map-predlog');
let izbraneKoordinate = null;

if (mapElement) {
  const map = L.map('map-predlog').setView([46.5547, 15.6459], 13);

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



// ----------------------------
// SKRIPT ZA NOVE PREDLOGE 
// ----------------------------



// ----------------------------
// SKRIPT ZA VŠEČKE
// ----------------------------
window.glasuj = function(id) {
    // Pošljemo posodobitev na strežnik
    fetch('/api/posodobi-vsecke', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_objava: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.uspeh) {
            const span = document.getElementById(`span_${id}_vsecki`);
            if (span) {
                // Dinamično povečamo številko na ekranu za 1 brez ponovnega nalaganja strani
                span.textContent = data.novi_vsecki;
            }
        } else {
            alert("Napaka pri oddaji glasu.");
        }
    })
    .catch(err => console.error("Napaka pri glasovanju:", err));
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