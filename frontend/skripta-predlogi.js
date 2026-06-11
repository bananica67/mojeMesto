// =================================================================
// NALAGANJE PREDLOGOV IZ STREŽNIKA
// =================================================================

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');
const vsebnikObcina = document.getElementById('predlogi-obcina');

if (vsebnikPredlogov || vsebnikObcina) {
  fetch('/api/vsi-predlogi-uporabnikov')
    .then(res => res.json())
    .then(predlogi => {

      // Razdelimo predloge glede na to ali je avtor Občina (ID=1) ali navaden občan
      const filtriraniUporabniki = predlogi.filter(p => 
      parseInt(p.tk_uporabnikid_uporabnik) !== 1 && parseInt(p.tk_status_pobudid_status_pobud) === 1
      );

      const filtriranaObcina = predlogi.filter(p => 
      parseInt(p.tk_uporabnikid_uporabnik) === 1 && parseInt(p.tk_status_pobudid_status_pobud) === 1
      );

      sessionStorage.setItem("vsiPredlogi", JSON.stringify(filtriraniUporabniki));
      sessionStorage.setItem("vsiPredlogiObcine", JSON.stringify(filtriranaObcina));

      // Izpis za stran s predlogi uporabnikov (predlogi.html)
      if (vsebnikPredlogov) {
        vsebnikPredlogov.innerHTML = '';
        filtriraniUporabniki.forEach(predlog => {
          const trenutniVsecki = predlog.st_vseckov || 0; 
          vsebnikPredlogov.innerHTML += generirajKarticoHTML(predlog, trenutniVsecki);
        });
      }

      // Izpis za stran obcina.html (predlogi občine)
      if (vsebnikObcina) {
        vsebnikObcina.innerHTML = '';
        filtriranaObcina.forEach(predlog => {
          const trenutniVseckiObcina = predlog.st_vseckov || 0;
          vsebnikObcina.innerHTML += generirajKarticoHTML(predlog, trenutniVseckiObcina);
        });
      }

    })
    .catch(err => console.error("Napaka pri nalaganju predlogov:", err));
}

function generirajKarticoHTML(predlog, vsecki) {
  
  // Preverimo, če je avtor občina (ID=1), izpišemo uradno ime, drugače ime in priimek občana
  let izpisAvtorja = "";
  if (parseInt(predlog.tk_uporabnikid_uporabnik) === 1) {
    izpisAvtorja = "Mestna občina Maribor";
  } else {
    izpisAvtorja = `${predlog.avtor_ime || 'Neznani'} ${predlog.avtor_priimek || 'Uporabnik'}`;
  }

  const prikazPoz = vsecki > 0 ? vsecki : '';
  const prikazNeg = vsecki < 0 ? vsecki : '';

  return `
    <div class="col-lg-6">
      <div class="card shadow predlog-card">
        <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" 
             onerror="this.onerror=null; this.src='slike/zacetna.jpg';" 
             class="card-img-top predlog-img" alt="slika">
        <div class="card-body p-4">
          <h3 class="fw-bold mb-1">${predlog.naslov}</h3>
          <p class="small fw-bold mb-3">${izpisAvtorja}</p>
          <p class="text-muted">${predlog.opis}</p>
          

<div class="d-flex gap-2 my-4">
  <button 
    id="btn-poz-${predlog.id_objava}"
    class="btn gumb-vsecek"
    style="background-color: white; color: #198754; border: 2px solid #198754; padding: 8px 18px; border-radius: 50px;"
    onclick="spremeniVsecke(${predlog.id_objava}, 1, this)">
    <i class="fas fa-thumbs-up"></i>
    <span id="span_poz_${predlog.id_objava}">${prikazPoz}</span>
  </button>

  <button 
    id="btn-neg-${predlog.id_objava}"
    class="btn gumb-vsecek"
    style="background-color: white; color: #dc3545; border: 2px solid #dc3545; padding: 8px 18px; border-radius: 50px;"
    onclick="spremeniVsecke(${predlog.id_objava}, -1, this)">
    <i class="fas fa-thumbs-down"></i>
    <span id="span_neg_${predlog.id_objava}">${prikazNeg}</span>
  </button>
</div>
        

          <hr>
          <h5 class="fw-bold mb-3">Komentarji</h5>
          <div class="mb-3">
             ${predlog.komentarji && predlog.komentarji.length > 0 ? 
               predlog.komentarji.map(k => `<div class="mb-1"><strong>${k.avtor}:</strong> ${k.besedilo}</div>`).join('') :
               `<div class="komentar"><small class="text-muted">Še ni komentarjev. Bodite prvi!</small></div>`
             }
          </div>
                          
          <textarea id="komentar-input-${predlog.id_objava}" class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
          <button class="btn komentar-gumb fw-bold" onclick="objaviKomentar(${predlog.id_objava})">Objavi komentar</button>
        </div>
      </div>
    </div>
  `;
}



// =================================================================
// ZEMLJEVID
// =================================================================

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



// =================================================================
// VŠEČKANJE
// =================================================================

window.spremeniVsecke = function(id, sprememba, element) {
    const email = localStorage.getItem('prijavljenEmail');
    if (!email) {
        alert('Za glasovanje se moraš prijaviti.');
        return;
    }

    fetch('/api/glasuj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_objava: id, sprememba: sprememba, email: email })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.uspeh) return;

        const noviVsecki = data.novi_vsecki;

        const btnPoz = document.getElementById(`btn-poz-${id}`);
        const btnNeg = document.getElementById(`btn-neg-${id}`);
        const spanPoz = document.getElementById(`span_poz_${id}`);
        const spanNeg = document.getElementById(`span_neg_${id}`);

        // Ponastavi oba gumba na privzet izgled
        btnPoz.style.backgroundColor = 'white';
        btnPoz.style.color = '#198754';
        btnNeg.style.backgroundColor = 'white';
        btnNeg.style.color = '#dc3545';

        if (!data.razveljavljen) {
            // Invertaj kliknjenega
            if (sprememba === 1) {
                btnPoz.style.backgroundColor = '#198754';
                btnPoz.style.color = 'white';
            } else {
                btnNeg.style.backgroundColor = '#dc3545';
                btnNeg.style.color = 'white';
            }
        }

        // Posodobi števce — pozitivno ob thumbs-up, negativno ob thumbs-down
        spanPoz.textContent = noviVsecki > 0 ? noviVsecki : '';
        spanNeg.textContent = noviVsecki < 0 ? noviVsecki : '';
    })
    .catch(err => console.error("Napaka pri glasovanju:", err));
};



// =================================================================
// ODDAJA NOVEGA PREDLOGA
// =================================================================

const gumbObjavi = document.getElementById('gumb-objavi-predlog');

if (gumbObjavi) {
  gumbObjavi.addEventListener('click', function(e) {
    e.preventDefault();

    const naslovElement = document.getElementById('naslov-predlog');
    const opisElement = document.getElementById('opis-predlog');
    const slikaInput = document.getElementById('slika-predlog');
    const emailPrijavljenega = localStorage.getItem('prijavljenEmail');

    // Preverjanje prijave
    if (!emailPrijavljenega) {
      alert("Za oddajo predloga morate biti prijavljeni!");
      return;
    }

    const naslov = naslovElement.value.trim();
    const opis = opisElement.value.trim();

    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    // Tukaj definiramo koordinate preden jih pošljemo
    // izbraneKoordinate so tiste, ki si jih zajela s klikom na zemljevid
    const koordinateString = izbraneKoordinate 
        ? `${izbraneKoordinate.lat.toFixed(6)}, ${izbraneKoordinate.lng.toFixed(6)}` 
        : "46.5547, 15.6459"; // Default, če uporabnik ni kliknil na mapo

    function posljiNaStrezenik(slikaBase64) {
      fetch('/api/dodaj-predlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naslov: naslov,
          opis: opis,
          email: emailPrijavljenega,
          fotografija: slikaBase64,
          lokacija: koordinateString // Zdaj je to definirano!
        })
      })
      .then(res => res.json())
      .then(podatki => {
        if (podatki.uspeh) {
          alert(podatki.sporocilo);
          
          if (podatki.jeObcina) {
             window.location.href = "obcina.html";
          } else {
             window.location.href = "predlogi.html";
          }
        } else {
          alert("Napaka: " + podatki.sporocilo);
        }
      })
      .catch(err => {
          console.error(err);
          alert("Prišlo je do napake na strežniku.");
      });
    }

    // Obdelava slike
    if (slikaInput && slikaInput.files && slikaInput.files.length > 0) {
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
// OBJAVA NOVEGA KOMENTARJA
// =================================================================

window.objaviKomentar = async function(idObjave) {
  const input = document.getElementById(`komentar-input-${idObjave}`);
  const vsebina = input ? input.value.trim() : "";
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
      body: JSON.stringify({ vsebina, idObjaves: idObjave, email })
    });
    const rez = await response.json();
    
    if (rez.uspeh) {
      // Poiščemo vnosno polje (textarea) za to specifično objavo
      const trenutniInput = document.getElementById(`komentar-input-${idObjave}`);
      if (trenutniInput) {
        // Pomaknemo se en element nazaj (gor), da najdemo točno tisti div s komentarji, ki je nad textarea
        const vsebnikKomentarjev = trenutniInput.previousElementSibling;
        
        if (vsebnikKomentarjev) {
          // Če je bil prej izpisan napis "Še ni komentarjev...", ga počistimo
          if (vsebnikKomentarjev.innerHTML.includes("Še ni komentarjev")) {
            vsebnikKomentarjev.innerHTML = "";
          }
          
          // Iz emaila potegnemo ime pred @ za lepši začasni prikaz avtorja
          const zacasniAvtor = email.split('@')[0];
          
          // Ustvarimo nov element za komentar in ga dodamo na konec seznama pod naslov Komentarji
          const novKomentarDiv = document.createElement('div');
          novKomentarDiv.className = 'mb-1';
          novKomentarDiv.innerHTML = `<strong>${zacasniAvtor}:</strong> ${vsebina}`;
          vsebnikKomentarjev.appendChild(novKomentarDiv);
        }
      }

      // Počistimo vnosno polje
      input.value = '';
    } else {
      alert(rez.sporocilo);
    }
  } catch (err) {
    console.error("Napaka pri pošiljanju komentarja:", err);
  }
};



// =================================================================
// FILTRIRANJE
// =================================================================

const filterUporabnik = document.getElementById('filter-uporabnik');
const filterObcina = document.getElementById('filter-obcina');

// Skupna funkcija za obdelavo filtriranja
// Globalna spremenljivka, da ne beremo vedno iz storage-a
let trenutniPredlogiCache = [];

function nastaviFiltriranje(element, kljucSessionStorage, idVsebnika) {
  if (!element) return;

  element.addEventListener('change', function() {
    // 1. Pridobi podatke
    const podatki = JSON.parse(sessionStorage.getItem(kljucSessionStorage) || "[]");
    let sortirani = [...podatki];

    // 2. Sortiraj
    if (this.value === 'maxvseckov') {
      sortirani.sort((a, b) => (parseInt(b.st_vseckov) || 0) - (parseInt(a.st_vseckov) || 0));
    } else if (this.value === 'minvseckov') {
      sortirani.sort((a, b) => (parseInt(a.st_vseckov) || 0) - (parseInt(b.st_vseckov) || 0));
    }

    // 3. Osveži izris
    const vsebnik = document.getElementById(idVsebnika);
    if (vsebnik) {
      vsebnik.innerHTML = '';
      sortirani.forEach(predlog => {
        // VŠČEČKI: Zagotovimo, da pošljemo pravilno številko v funkcijo
        const vsecki = predlog.st_vseckov || 0;
        vsebnik.innerHTML += generirajKarticoHTML(predlog, vsecki);
      });
    }
  });
}

// Inicializacija za obe strani
// Za navadne uporabnike (predlogi.html)
nastaviFiltriranje(filterUporabnik, "vsiPredlogi", "predlog-uporabnik");

// Za občinske predloge (obcina.html)
nastaviFiltriranje(filterObcina, "vsiPredlogiObcine", "predlogi-obcina");