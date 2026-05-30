// ----------------------------
// SKRIPT ZA REGISTRACIJO
// ----------------------------





// ----------------------------
// SKRIPT ZA PRIJAVO
// ----------------------------

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prepreči osveževanje strani

            // 1. Preberemo vnosna polja iz HTML-ja
            const emailInput = document.getElementById("email");
            const gesloInput = document.getElementById("geslo");

            const email = emailInput ? emailInput.value.trim() : "";
            const geslo = gesloInput ? gesloInput.value : "";

            // 2. Osnovna regex preverba za email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && !emailRegex.test(email)) {
                emailInput.classList.add('is-invalid');
                loginForm.classList.add("was-validated");
                return;
            } else if (emailInput) {
                emailInput.classList.remove('is-invalid');
            }

            // 3. Preverimo celotno Bootstrap validacijo
            if (!loginForm.checkValidity()) {
                e.stopPropagation();
                loginForm.classList.add("was-validated");
                return;
            }

            try {
                // 4. Pošljemo podatke na Node.js strežnik (Natančna pot s portom 3000!)
                const response = await fetch("http://localhost:3000/prijava", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    // Pošljemo pravilni spremenljivki 'email' in 'geslo'
                    body: JSON.stringify({ email: email, geslo: geslo })
                });

                const rezultat = await response.json();

                if (rezultat.uspeh) {
                    // Če je prijava uspešna, shranimo podatke v LocalStorage
                    localStorage.setItem('profilnoIme', rezultat.ime + " " + rezultat.priimek);
                    localStorage.setItem('profilniEmail', rezultat.email);
                    
                    // TUKAJ JE SPREMEMBA: Preusmeritev glede na vpisani e-mail
                    if (email === "admin@gmail.com") {
                        window.location.href = "obcina-profil.html";
                    } else {
                        window.location.href = "profil.html";
                    }
                } else {
                    // Izpiše napako ("Uporabnik ne obstaja!" ali "Napačno geslo")
                    alert(rezultat.sporocilo);
                }

            } catch (napaka) {
                console.error("Napaka pri povezavi:", napaka);
                alert("Nekaj je šlo narobe pri komunikaciji s strežnikom.");
            }
        });
    }
});



// ----------------------------
// SKRIPT ZA PROFIL
// ----------------------------

// Ko se celotna stran naloži, takoj osvežimo podatke iz LocalStorage
document.addEventListener("DOMContentLoaded", function() {
    prikaziPodatke();
});

// Funkcija za vizualno menjavo barve in dodajanje obrobe izbranemu krogu
    function spremeniBarvo(element, barva) {
      document.querySelectorAll('.barva-krog').forEach(krog => {
        krog.classList.remove('aktivna');
      });
      if (element) {
        element.classList.add('aktivna');
      }
      document.getElementById('uporabnikAvatar').style.backgroundColor = barva;
    }

// Združena funkcija za spremembo barve in takojšnje shranjevanje v LocalStorage
    function profilna(element, barva) {
      spremeniBarvo(element, barva);
      localStorage.setItem('profilnaBarva', barva);
    }

// Funkcija za posodobitev imena na profilu in shranjevanje
    function shraniIme() {
      const vnesenoIme = document.getElementById('vnosIme').value;
      if(vnesenoIme.trim() !== "") {
        document.getElementById('prikazanoIme').textContent = vnesenoIme;
       
        // Shranimo v localStorage
        localStorage.setItem('profilnoIme', vnesenoIme);

        // Zapri modalno okno
        const modalElement = document.getElementById('modalIme');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
      }
    }

// Funkcija, ki ob preklopu ali osvežitvi strani naloži podatke nazaj na zaslon
 function prikaziPodatke() {
    // 1. Nalaganje in izris shranjenega imena
    const shranjenoIme = localStorage.getItem('profilnoIme');
    if (shranjenoIme) {
        document.getElementById('prikazanoIme').textContent = shranjenoIme;
        document.getElementById('vnosIme').value = shranjenoIme; // Nastavi vrednost znotraj modala
    }

    // DODANO: Izris shranjenega e-maila
    const shranjenEmail = localStorage.getItem('profilniEmail');
    const emailElement = document.getElementById('prikazanEmail');
    if (shranjenEmail && emailElement) {
        emailElement.textContent = shranjenEmail;
    }

    // 2. Nalaganje in izris shranjene barve avatarja
    const shranjenaBarva = localStorage.getItem('profilnaBarva');
    if (shranjenaBarva) {
        document.getElementById('uporabnikAvatar').style.backgroundColor = shranjenaBarva;
       
        document.querySelectorAll('.barva-krog').forEach(krog => {
          krog.classList.remove('aktivna');
          if (krog.style.backgroundColor === shranjenaBarva || krog.getAttribute('onclick').includes(shranjenaBarva)) {
            krog.classList.add('aktivna');
          }
        });
    }
    const znackeTab = document.getElementById("znacke-tab");
    if (znackeTab) {
        znackeTab.addEventListener("click", naloziMojeZnacke);
    }
   
    // Značke naložimo tudi takoj ob odpiranju profila
    naloziMojeZnacke();
}

 

// ----------------------------
// SKRIPT ZA ZEMLJEVID - STATUS
// ----------------------------

const mapElement = document.getElementById('map');

if (mapElement) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function odjaviUporabnika() {
    localStorage.clear();
    alert('Odjava uspešna.');
    window.location.href = 'prijava.html';
}

// Funkcija, ki naloži uporabnike iz localStorage in jih izriše v tabelo
// Popolnoma prilagojena funkcija za tvojo SQL bazo
function naloziUporabnikeZaAdmina() {
    const seznamUporabnikovOznaka = document.getElementById('seznamUporabnikov');
    const stetjeUporabnikovOznaka = document.getElementById('stetjeUporabnikov');
    const praznoObvestilo = document.getElementById('praznoObvestiloUporabniki');
    const tabelaKontejner = document.getElementById('tabelaUporabnikovKontejner');

    if (!seznamUporabnikovOznaka) return;

    // TUKAJ POKLIČEŠ SVOJ URL NA STREŽNIKU (npr. /api/uporabniki ali /get_users.php)
    // Zamenjaj '/api/uporabniki' s tvojo točno potjo, ki jo imaš nastavljeno na backendu!
    fetch('/api/vsi-uporabniki')
        .then(response => response.json())
        .then(vsiUporabniki => {
           
            // Posodobi števec (Skupno uporabnikov: X)
            if (stetjeUporabnikovOznaka) {
                stetjeUporabnikovOznaka.textContent = `Skupno uporabnikov: ${vsiUporabniki.length}`;
            }

            // Če je baza prazna
            if (vsiUporabniki.length === 0) {
                praznoObvestilo.classList.remove('d-none');
                tabelaKontejner.classList.add('d-none');
                return;
            }

            praznoObvestilo.classList.add('d-none');
            tabelaKontejner.classList.remove('d-none');
            seznamUporabnikovOznaka.innerHTML = '';

            // Sprehodi se skozi uporabnike iz SQL baze
            vsiUporabniki.forEach((uporabnik) => {
                const vrstica = document.createElement('tr');
                // Uporabiva tvoj id_uporabnik iz SQL baze za ID vrstice
                vrstica.id = `uporabnik-row-${uporabnik.id_uporabnik}`;
               
                // Združiva ime in priimek točno tako, kot jih imaš v SQL tabeli
                const polnoIme = `${uporabnik.ime} ${uporabnik.priimek}`;

                vrstica.innerHTML = `
                    <td class="fw-bold text-muted">#${uporabnik.id_uporabnik}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">${polnoIme}</span>
                        </div>
                    </td>
                    <td class="text-muted">${uporabnik.email}</td>
                    <td>
                        <select class="form-select form-select-sm status-select" onchange="spemeniVlogoUporabnika(${uporabnik.id_uporabnik}, this.value)">
                            <option value="obcan" selected>Občan</option>
                            <option value="obcina">Predstavnik občine</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </td>
                `;
                seznamUporabnikovOznaka.appendChild(vrstica);
            });
        })
        .catch(error => {
            console.error('Napaka pri pridobivanju uporabnikov iz SQL baze:', error);
        });
}

// DODANO: Avtomatski zagon funkcije, ko se naloži HTML stran
document.addEventListener("DOMContentLoaded", () => {
    // Preverimo, če smo sploh na strani, ki vsebuje tabelo za uporabnike
    if (document.getElementById('seznamUporabnikov')) {
        naloziUporabnikeZaAdmina();
    }
});

// Funkcija, ki prebere značke iz baze in jih izriše v HTML vsebnik
async function naloziMojeZnacke() {
    // Vzamemo e-mail iz localStorage (uporablja tvoj ključ 'profilniEmail')
    const email = localStorage.getItem("profilniEmail") || "kaja@student.um.si";
    const vsebnik = document.getElementById("seznamZnack");

    if (!vsebnik) return;

    try {
        const odziv = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odziv.json();

        // Če uporabnik nima nobene značke v bazi
        if (znacke.length === 0) {
            vsebnik.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted mb-0">Trenutno še nimate osvojenih značk. Bodite aktivni v skupnosti!</p>
                </div>
            `;
            return;
        }

        // Če značke obstajajo, spraznimo napis "Nalaganje..." in jih izrišemo
        vsebnik.innerHTML = "";
       
        znacke.forEach(znacka => {
            // Izbira ikone glede na ime značke v bazi
            let ikona = "fa-award";
            if (znacka.naziv.toLowerCase().includes("iniciator")) ikona = "fa-seedling";
            if (znacka.naziv.toLowerCase().includes("aktiven")) ikona = "fa-fire";
            if (znacka.naziv.toLowerCase().includes("debatni")) ikona = "fa-comments";

            vsebnik.innerHTML += `
                <div class="col-6 col-sm-4">
                  <div class="znacka-kartica shadow-sm p-3 text-center rounded bg-white h-100" style="border: 2px solid #ffd700; transition: transform 0.2s;">
                    <div class="znacka-ikona mb-2" style="font-size: 26px; color: #ffd700;"><i class="fas ${ikona}"></i></div>
                    <h6 class="fw-bold mb-1" style="font-size: 14px; color: #000;">${znacka.naziv}</h6>
                    <p class="text-muted small mb-0" style="font-size: 11px; line-height: 1.2;">${znacka.opis}</p>
                  </div>
                </div>
            `;
        });

    } catch (napaka) {
        console.error("Napaka pri nalaganju značk na frontendu:", napaka);
        vsebnik.innerHTML = `<div class="col-12 text-center text-danger small py-3">Napaka pri povezavi s strežnikom.</div>`;
    }
}


// ----------------------------
// PREDLOGI ZA ADMINA
// ----------------------------

function naloziPredlogeZaAdmina() {
    const seznamPredlogovOznaka = document.getElementById('seznamPredlogov');
    const stetjePredlogovOznaka = document.getElementById('stetjePredlogov');
    const praznoObvestiloPredlogi = document.getElementById('praznoObvestiloPredlogi');

    if (!seznamPredlogovOznaka) return;

    // Spremenjeno na splošno pot, ki jo že imaš nastavljeno
    fetch('/api/vsi-predlogi')
        .then(response => {
            if (!response.ok) {
                throw new Error("Strežnik je vrnil status " + response.status);
            }
            return response.json();
        })
        .then(vsiPredlogi => {
            if (stetjePredlogovOznaka) {
                stetjePredlogovOznaka.textContent = `Skupno predlogov: ${vsiPredlogi.length}`;
            }

            if (vsiPredlogi.length === 0) {
                if (praznoObvestiloPredlogi) praznoObvestiloPredlogi.classList.remove('d-none');
                seznamPredlogovOznaka.innerHTML = '';
                return;
            }

            if (praznoObvestiloPredlogi) praznoObvestiloPredlogi.classList.add('d-none');
            seznamPredlogovOznaka.innerHTML = '';

            vsiPredlogi.forEach((predlog) => {
                const vrstica = document.createElement('tr');
                vrstica.id = `predlog-row-${predlog.id_objava}`;
                
                // PostgreSQL vrne izključno male črke za imena stolpcev
                const sID = parseInt(predlog.tk_status_pobudid_status_pobud) || 1; 
                const avtorID = predlog.tk_uporabnikid_uporabnik || "Neznano";

                vrstica.innerHTML = `
                    <td>
                        <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" class="img-fluid rounded-3" style="height: 60px; width: 80px; object-fit: cover;" onerror="this.src='slike/zacetna.jpg'">
                    </td>
                    <td class="fw-bold text-uppercase" style="font-size: 14px;">
                        ${predlog.naslov}
                    </td>
                    <td class="text-muted">
                        ID Uporabnika: ${avtorID}
                    </td>
                    <td>
                        <span class="badge bg-success"><i class="fas fa-thumbs-up me-1"></i> 0</span>
                    </td>
                    <td>
                        <select class="form-select form-select-sm status-select" onchange="osveziStatus(${predlog.id_objava}, this.value)">
                            <option value="1" ${sID === 1 ? 'selected' : ''}>Oddano</option>
                            <option value="2" ${sID === 2 ? 'selected' : ''}>V obravnavi</option>
                            <option value="3" ${sID === 3 ? 'selected' : ''}>Zaključeno</option>
                        </select>
                    </td>
                `;
                seznamPredlogovOznaka.appendChild(vrstica);
            });
        })
        .catch(error => {
            console.error('Napaka pri pridobivanju predlogov:', error);
        });
}

function osveziStatus(idObjava, novStatusId) {
    fetch('/api/posodobi-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            id_objava: parseInt(idObjava), 
            nov_status_id: parseInt(novStatusId) 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.uspeh) {
            alert('Status uspešno posodobljen!');
        } else {
            alert('Napaka pri posodabljanju statusa.');
        }
    })
    .catch(err => console.error('Napaka pri posodabljanju:', err));
}

// Avtomatski zagon ob nalaganju strani za oba zavihka
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('seznamUporabnikov')) {
        naloziUporabnikeZaAdmina();
    }
    if (document.getElementById('seznamPredlogov')) {
        naloziPredlogeZaAdmina();
    }
});