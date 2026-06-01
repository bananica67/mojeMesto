//PREDLOGI UPORABNIKOV

// =================================================================
// 1. GENERIRANJE IN PRIKAZ PREDLOGOV (UPORABNIKI + OBČINA)
// =================================================================

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');
const vsebnikObcina = document.getElementById('predlogi-obcina');

// Funkcija, ki naloži predloge uporabnikov iz baze (preko API strežnika)
async function naloziPredlogeUporabnikov() {
  if (!vsebnikPredlogov) return;
  
  try {
    const response = await fetch('/api/vsi-predlogi-uporabnikov');
    const predlogi = await response.json();
    
    vsebnikPredlogov.innerHTML = '';

    if (predlogi.length === 0) {
      vsebnikPredlogov.innerHTML = '<p class="text-muted">Ni še nobenih predlogov.</p>';
      return;
    }

    predlogi.forEach(predlog => {
      let komentarjiHTML = '';
      if (predlog.komentarji && predlog.komentarji.length > 0) {
        predlog.komentarji.forEach(kom => {
          komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
        });
      } else {
        komentarjiHTML = '<p class="text-muted smaill">Ni še komentarjev.</p>';
      }

      // Vsečke zaenkrat obdrživa v localStorage, dokler ne narediva tabele v bazi
      const trenutniVsecki = localStorage.getItem(`glas_${predlog.id}_vsecki`) || 0;
      const trenutniNeradi = localStorage.getItem(`glas_${predlog.id}_neradi`) || 0;

      // Če ni slike, damo privzeto
      const slikaPrikaz = predlog.fotografija || 'slike/zacetna.jpg';

      const karticaHTML = `
        <div class="col-lg-6">
          <div class="card shadow predlog-card">
            <img src="${slikaPrikaz}" class="card-img-top predlog-img" alt="slika">
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
              <div class="mb-3">${komentarjiHTML}</div>
                              
              <textarea id="komentar-input-${predlog.id}" class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
              <button class="btn komentar-gumb fw-bold" onclick="objaviKomentar(${predlog.id})">Objavi komentar</button>
            </div>
          </div>
        </div>
      `;
      vsebnikPredlogov.innerHTML += karticaHTML;
    });
  } catch (err) {
    console.error("Napaka pri pridobivanju predlogov:", err);
  }
}

// Ker občina še nima API-ja v bazi, jo začasno pustiva na localStorage, da se stran ne sesuje
const zacetniPredlogiObcine = [
  {
    id: 101,
    naslov: "Nova kolesarska pot",
    opis: "Občina načrtuje izgradnjo nove kolesarske poti med centrom mesta in mestnim parkom.",
    slika: "slike/kolo.jpg",
    komentarji: []
  }
];
if (!localStorage.getItem('vsiPredlogiObcine')) {
  localStorage.setItem('vsiPredlogiObcine', JSON.stringify(zacetniPredlogiObcine));
}

function prikaziPredlogeObcine() {
  if (!vsebnikObcina) return;
  const predlogi = JSON.parse(localStorage.getItem('vsiPredlogiObcine'));
  vsebnikObcina.innerHTML = '';
  
  predlogi.forEach(predlog => {
    const karticaHTML = `
      <div class="col-lg-6">
        <div class="card shadow predlog-card">
          <img src="${predlog.slika}" class="card-img-top predlog-img" alt="slika">
          <div class="card-body p-4">
            <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
            <p class="text-muted">${predlog.opis}</p>
          </div>
        </div>
      </div>
    `;
    vsebnikObcina.innerHTML += karticaHTML;
  });
}

// Zaženemo nalaganje ob odpiranju strani
document.addEventListener("DOMContentLoaded", () => {
  naloziPredlogeUporabnikov();
  prikaziPredlogeObcine();
});

// =================================================================
// 2. DODAJANJE NOVEGA PREDLOGA NA STREŽNIK (ZEMLJEVID + FILEREADER)
// =================================================================

const mapElement = document.getElementById('map');
let izbraneKoordinate = null;

if (mapElement) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

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
    const emailPrijavljenega = localStorage.getItem('prijavljenEmail'); // Preberemo email prijavljenega uporabnika

    if (!emailPrijavljenega) {
      alert("Za oddajo predloga morate biti prijavljeni!");
      return;
    }
    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    function posljiNaStrezenik(slikaBase64) {
      fetch('/api/dodaj-predlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naslov: naslov,
          opis: opis,
          email: emailPrijavljenega,
          fotografija: slikaBase64
        })
      })
      .then(res => res.json())
      .then(podatki => {
        if (podatki.uspeh) {
          if (podatki.novaZnacka) {
            alert(`Čestitke! Prejeli ste novo značko: ${podatki.novaZnacka}`);
          } else {
            alert(podatki.sporocilo);
          }
          window.location.href = "predlogi.html";
        } else {
          alert("Napaka: " + podatki.sporocilo);
        }
      })
      .catch(err => console.error("Napaka pri fetchu:", err));
    }

    if (slikaInput && slikaInput.files && slikaInput.files[0]) {
      const reader = new FileReader();
      reader.onloadend = function() {
        posljiNaStrezenik(reader.result);
      };
      reader.readAsDataURL(slikaInput.files[0]);
    } else {
      posljiNaStrezenik("slike/zacetna.jpg");
    }
  });
}

// =================================================================
// 3. DODAJANJE KOMENTARJEV IN GLASOVANJE
// =================================================================

window.objaviKomentar = async function(idObjave) {
  const input = document.getElementById(`komentar-input-${idObjave}`);
  const vsebina = input.value;
  const email = localStorage.getItem('prijavljenEmail');

  if (!email) {
    alert("Za komentiranje morate biti prijavljeni!");
    return;
  }
  if (!vsebina) {
    alert("Vpišite besedilo komentarja!");
    return;
  }

  try {
    const response = await fetch('/api/dodaj-komentar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vsebina, idObjave, email })
    });
    const rez = await response.json();
    
    if (rez.uspeh) {
      input.value = '';
      naloziPredlogeUporabnikov(); // Ponovno osvežimo iz baze
    } else {
      alert(rez.sporocilo);
    }
  } catch (err) {
    console.error("Napaka pri pošiljanju komentarja:", err);
  }
};

window.glasuj = function(id, tip) {
  const kljuc = `glas_${id}_${tip}`;
  let trenutnoGlasov = parseInt(localStorage.getItem(kljuc) || 0) + 1;
  localStorage.setItem(kljuc, trenutnoGlasov);
  
  const span = document.getElementById(`span_${id}_${tip}`);
  if (span) {
    span.textContent = trenutnoGlasov;
  }
};




/*const zacetniPredlogi = [
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

//shranjevanje v localStorage
if (!localStorage.getItem('vsiPredlogi')) {
  localStorage.setItem('vsiPredlogi', JSON.stringify(zacetniPredlogi));
}

//PRIKAZ PREDLOGOV

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');

if (vsebnikPredlogov) {
  const predlogi = JSON.parse(localStorage.getItem('vsiPredlogi'));
  
  vsebnikPredlogov.innerHTML = '';

  //generiramo predloge za html
  predlogi.forEach(predlog => {
    
    //komentarji
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    //Pred izrisom HTML-ja preberemo trenutno shranjeno število glasov iz localStorage
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

    //predlog se s tem izpise v html
    vsebnikPredlogov.innerHTML += karticaHTML;
  });
}


//DODAJANJE PREDLOGOV - ZA UPORABNIKA

//zemljevid naredi marker in shrani lokacijo v localStorage
const mapElement = document.getElementById('map');

if (mapElement) {
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

// to je za objavo na stran predlogi.html
const gumbObjavi = document.getElementById('gumb-objavi');

if (gumbObjavi) {
  gumbObjavi.addEventListener('click', function() {
    const naslov = document.getElementById('naslov').value;
    const opis = document.getElementById('opis').value;
    const slikaInput = document.getElementById('slika');

    // preveri če sta izpolnjena naslov in opis
    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }
      
     // to je za objavo na stran predlogi.html
// to je za objavo na stran predlogi.html

  

//9999999999999999999999999
    // Funkcija, ki dejansko shrani predlog
   // Namesto tvoje trenutne funkcije shraniInPreusmeri, uporabi to:
function shraniInPreusmeri(koncnaSlikaUrl) {
      //
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
      //Shranjevanje v localStorage 
      localStorage.setItem('vsiPredlogi', JSON.stringify(vsiPredlogi));

      // ko kliknemo gumb nas da nazaj na stran predlogi.html
      window.location.href = "predlogi.html";
    }

    // Preverjanje slike in pretvorba v Base64
    if (slikaInput && slikaInput.files && slikaInput.files[0]) {
      const izbranaDatoteka = slikaInput.files[0];
      const reader = new FileReader();

      // Ko reader konča z branjem, dobimo Base64 string v reader.result
      reader.onloadend = function() {
        shraniInPreusmeri(reader.result);
      };

      // Zaženemo branje datoteke kot Data URL (Base64)
      reader.readAsDataURL(izbranaDatoteka);
    } else {
      // Če ni izbrane slike, uporabimo privzeto
      shraniInPreusmeri("slike/zacetna.jpg");
    }
  });
}

//PREDLOGI-UPORABNIKOV
app.get('/api/vsi-predlogi-uporabnikov', async (req, res) => {
    try {
        // 1. Preberemo vse objave, ki so tipa 'Predlog'
        const objaveRez = await pool.query(`
            SELECT id_objava AS id, naslov, opis, slika, stevilo_podpor 
            FROM Objava 
            WHERE tip_objave = 'Predlog'
            ORDER BY id_objava DESC
        `);

        const predlogi = objaveRez.rows;

        // 2. Za vsak predlog poiščemo še pripadajoče komentarje
        for (let predlog of predlogi) {
            const komRez = await pool.query(`
                SELECT u.ime AS avtor, k.vsebina AS besedilo 
                FROM Komentar k
                JOIN Uporabnik u ON k.tk_uporabnikid_uporabnik = u.id_uporabnik
                WHERE k.tk_objavaid_objava = $1
                ORDER BY k.id_komentar ASC
            `, [predlog.id]);
            
            predlog.komentarji = komRez.rows;
        }

        return res.json(predlogi);
    } catch (err) {
        console.error("Napaka pri branju predlogov iz baze:", err);
        return res.status(500).json([]);
    }
});

  


//PREDLOGI OBCINE

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

//PRIKAZ PREDLOGOV OBCINE

const vsebnikObcina = document.getElementById('predlogi-obcina');

if (vsebnikObcina) {
  const predlogi = JSON.parse(localStorage.getItem('vsiPredlogiObcine'));
  
  vsebnikObcina.innerHTML = '';

  //generiramo predloge za html
  predlogi.forEach(predlog => {
    
    //komentarji    
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    //preberemo shranjene glasove za občinske kartice pred izrisom HTML-ja
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

    //predlog se s tem izpise v html
    vsebnikObcina.innerHTML += karticaHTML;
  });
}

//DODAJANJE PREDLOGOV - ZA OBCINO

//zemljevid naredi marker in shrani lokacijo v localStorage
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

// to je za objavo na stran obcina.html
const gumbObjaviObcina = document.getElementById('gumb-objavi-obcina');

if (gumbObjaviObcina) {
  gumbObjaviObcina.addEventListener('click', function() {
    const naslov = document.getElementById('naslov-obcina').value;
    const opis = document.getElementById('opis-obcina').value;
    const slikaInputObcina = document.getElementById('slika-obcina'); 

    // preveri če sta izpolnjena naslov in opis
    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    // Funkcija za shranjevanje občinskega predloga
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

      // ko kliknemo gumb nas osveži stran
      window.location.reload();
    }

    // Preverjanje slike in pretvorba v Base64 za občino
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


//vsecki
window.glasuj = function(id, tip) {
    const kljuc = `glas_${id}_${tip}`;
    
    // SPREMEMBA: Dodana varovalka `|| 0`, če ključ v localStorage še sploh ne obstaja, da ne dobimo napake NaN
    let trenutnoGlasov = parseInt(localStorage.getItem(kljuc) || 0) + 1;
    localStorage.setItem(kljuc, trenutnoGlasov);
    
    const span = document.getElementById(`span_${id}_${tip}`);
    if (span) {
        span.textContent = trenutnoGlasov;
    }
};
*/



