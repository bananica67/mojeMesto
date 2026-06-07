// =================================================================
// NALAGANJE PREDLOGOV IZ STREŽNIKA
// =================================================================

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');
const vsebnikObcina = document.getElementById('predlogi-obcina');

if (vsebnikPredlogov || vsebnikObcina) {
  fetch('/api/vsi-predlogi-uporabnikov')
    .then(res => {
      if (!res.ok) throw new Error("Napaka pri pridobivanju podatkov s strežnika");
      return res.json();
    })
    .then(predlogi => {
      console.log("Prejeti predlogi na frontendu:", predlogi); // Preverba v konzoli (F12)

      if (!predlogi || !Array.isArray(predlogi)) {
        console.error("Podatki niso v pravilnem formatu (tabela).");
        return;
      }

      // Varno filtriranje brez strogih pogojev za status, če ta ponagaja
      const filtriraniUporabniki = predlogi.filter(p => {
        // Preprečimo null napako - če ni id-ja, nastavimo na 0 (kar pomeni navaden uporabnik)
        const avtorId = p.tk_uporabnikid_uporabnik ? parseInt(p.tk_uporabnikid_uporabnik) : 0;
        return avtorId !== 1;
      });

      const filtriranaObcina = predlogi.filter(p => {
        const avtorId = p.tk_uporabnikid_uporabnik ? parseInt(p.tk_uporabnikid_uporabnik) : 0;
        return avtorId === 1;
      });

      console.log("Filtrirani uporabniki:", filtriraniUporabniki);
      console.log("Filtrirana občina:", filtriranaObcina);

      sessionStorage.setItem("vsiPredlogi", JSON.stringify(filtriraniUporabniki));
      sessionStorage.setItem("vsiPredlogiObcine", JSON.stringify(filtriranaObcina));

      // Izpis za stran s predlogi uporabnikov (predlogi.html)
      if (vsebnikPredlogov) {
        vsebnikPredlogov.innerHTML = ""; // Počistimo vsebnik pred izrisom
        if (filtriraniUporabniki.length === 0) {
          vsebnikPredlogov.innerHTML = `<div class="col-12 text-center text-muted my-4"><h5>Trenutno ni nobenih predlogov občanov.</h5></div>`;
        } else {
          prikaziPredloge(filtriraniUporabniki, vsebnikPredlogov, false);
        }
      }

      // Izpis za stran občine
      if (vsebnikObcina) {
        vsebnikObcina.innerHTML = ""; // Počistimo vsebnik pred izrisom
        if (filtriranaObcina.length === 0) {
          vsebnikObcina.innerHTML = `<div class="col-12 text-center text-muted my-4"><h5>Trenutno ni nobenih predlogov občine.</h5></div>`;
        } else {
          prikaziPredloge(filtriranaObcina, vsebnikObcina, true);
        }
      }
    })
    .catch(err => {
      console.error("Kritična napaka v fetch koraku:", err);
      if (vsebnikPredlogov) {
        vsebnikPredlogov.innerHTML = `<div class="col-12 text-center text-danger my-4"><h5>Napaka pri nalaganju predlogov. Poskusite znova.</h5></div>`;
      }
    });
}

function generirajKarticoHTML(predlog, vsecki) {
  
  // Preverimo, če je avtor občina (ID=1), izpišemo uradno ime, drugače ime in priimek občana
  let izpisAvtorja = "";
  if (parseInt(predlog.tk_uporabnikid_uporabnik) === 1) {
    izpisAvtorja = "Mestna občina Maribor";
  } else {
    izpisAvtorja = `${predlog.avtor_ime || 'Neznani'} ${predlog.avtor_priimek || 'Uporabnik'}`;
  }

  return `
    <div class="col-lg-6">
      <div class="card shadow predlog-card">
        <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" 
             onerror="this.onerror=null; this.src='slike/zacetna.jpg';" 
             class="card-img-top predlog-img" alt="slika">
        <div class="card-body p-4">
          <h3 class="fw-bold mb-1">${predlog.naslov}</h3>
          <p class="small fw-bold mb-3">Avtor: ${izpisAvtorja}</p>
          <p class="text-muted">${predlog.opis}</p>
          
          <div class="d-flex gap-3 my-4">
            <button class="btn btn-success glas-btn" onclick="glasuj(${predlog.id_objava})">
              <i class="fas fa-thumbs-up"></i> <span id="span_${predlog.id_objava}_vsecki">${vsecki}</span>
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

window.glasuj = function(id) {
    fetch('/api/posodobi-vsecke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_objava: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.uspeh) {
            const span = document.getElementById(`span_${id}_vsecki`);
            if (span) span.textContent = data.novi_vsecki;
        } else {
            alert("Napaka pri oddaji glasu.");
        }
    })
    .catch(err => console.error(err));
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

    function posljiNaStrezenik(slikaBase64) {
      fetch('/api/dodaj-predlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naslov: naslov,
          opis: opis,
          email: emailPrijavljenega,
          fotografija: slikaBase64,
          koordinate: izbraneKoordinate ? `${izbraneKoordinate.lat},${izbraneKoordinate.lng}` : null
        })
      })
      .then(res => res.json())
      .then(podatki => {
        if (podatki.uspeh) {
          alert(podatki.sporocilo);

          // Če je objavila občina jo vrže na obcina.html
          if (podatki.jeObcina) {
             window.location.href = "obcina.html";
          } else {
             window.location.href = "predlogi.html";
          }
        } else {
          alert("Napaka: " + podatki.sporocilo);
        }
      })
      .catch(err => alert("Prišlo je do napake na strežniku."));
    }

    if (slikaInput && slikaInput.files && slikaInput.files.length > 0) {
      const reader = new FileReader();
      reader.onloadend = function() { 
        posljiNaStrezenik(reader.result); 
      };
      reader.readAsDataURL(slikaInput.files[0]);
    } else {
      // Če uporabnik sploh ni kliknil ali izbral datoteke, pošljemo privzeto sliko
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
