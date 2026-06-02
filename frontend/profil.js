// =================================================================
// SKUPNI ZAGON OB NALAGANJU STRANI
// =================================================================

document.addEventListener("DOMContentLoaded", () => {
    prikaziPodatke();
    
    if (document.getElementById('seznamUporabnikov')) {
        naloziUporabnikeZaAdmina();
    }
    
    if (document.getElementById('seznamPredlogov')) {
        // Zaženemo samo, če smo na admin strani, na profilu se nalaga dinamično spodaj
        naloziPredlogeZaAdmina();
    }
});



// =================================================================
// UPRAVLJANJE PROFILA UPORABNIKA
// =================================================================

function spremeniBarvo(element, barva) {
    document.querySelectorAll('.barva-krog').forEach(krog => {
        krog.classList.remove('aktivna');
    });
    if (element) {
        element.classList.add('aktivna');
    }
    const avatar = document.getElementById('uporabnikAvatar');
    if (avatar) {
        avatar.style.backgroundColor = barva;
    }
}

function profilna(element, barva) {
    spremeniBarvo(element, barva);
    localStorage.setItem('profilnaBarva', barva);
}

function shraniIme() {
    const vnesenoIme = document.getElementById('vnosIme').value;
    if (vnesenoIme.trim() !== "") {
        document.getElementById('prikazanoIme').textContent = vnesenoIme;
        localStorage.setItem('profilnoIme', vnesenoIme);

        const modalElement = document.getElementById('modalIme');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
}

function prikaziPodatke() {
    const shranjenoIme = localStorage.getItem('profilnoIme');
    const prikazanoImeEl = document.getElementById('prikazanoIme');
    const vnosImeEl = document.getElementById('vnosIme');
    
    if (shranjenoIme) {
        if (prikazanoImeEl) prikazanoImeEl.textContent = shranjenoIme;
        if (vnosImeEl) vnosImeEl.value = shranjenoIme;
    }

    const shranjenEmail = localStorage.getItem('prijavljenEmail');
    const emailElement = document.getElementById('prikazanEmail');
    if (shranjenEmail && emailElement) {
        emailElement.textContent = shranjenEmail;
    }

    const shranjenaBarva = localStorage.getItem('profilnaBarva');
    const avatar = document.getElementById('uporabnikAvatar');
    if (shranjenaBarva && avatar) {
        avatar.style.backgroundColor = shranjenaBarva;
        
        document.querySelectorAll('.barva-krog').forEach(krog => {
            krog.classList.remove('aktivna');
            if (krog.style.backgroundColor === shranjenaBarva || 
               (krog.getAttribute('onclick') && krog.getAttribute('onclick').includes(shranjenaBarva))) {
                krog.classList.add('aktivna');
            }
        });
    }

    // Poslušalci dogodkov za klik na zavihke (za osveževanje podatkov)
    const znackeTab = document.getElementById("znacke-tab");
    if (znackeTab) {
        znackeTab.addEventListener("click", naloziMojeZnacke);
    }

    const predlogiTab = document.getElementById("predlogi-tab");
    if (predlogiTab) {
        predlogiTab.addEventListener("click", naloziMojePredloge);
    }
    
    // Začetni prenos vseh podatkov ob nalaganju strani
    naloziMojePredloge();
    naloziMojeZnacke();
}

function odjaviUporabnika() {
    localStorage.clear(); 
    alert('Odjava uspešna.');
    window.location.href = 'prijava.html'; 
}


// =================================================================
// FUNKCIJA ZA PREDLOGE
// =================================================================

async function naloziMojePredloge() {
    const seznamPredlogovOznaka = document.getElementById("seznamUporabnikovihPredlogov");
    const stevilkaPredlogov = document.getElementById("stevilkaPredlogov");
    
    if (!seznamPredlogovOznaka) return;

    const email = localStorage.getItem("prijavljenEmail");
    if (!email) {
        seznamPredlogovOznaka.innerHTML = `<tr><td colspan="5" class="text-center text-danger small py-3">Uporabnik ni prijavljen.</td></tr>`;
        return;
    }

    try {
        const odziv = await fetch(`/api/moji-predlogi/${email}`);
        const predlogi = await odziv.json();

        if (stevilkaPredlogov) {
            stevilkaPredlogov.textContent = `(${predlogi.length})`;
        }

        if (predlogi.length === 0) {
            seznamPredlogovOznaka.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted mb-0">
                        Trenutno še niste oddali nobenega predloga. Delite svoje ideje z nami!
                    </td>
                </tr>
            `;
            return;
        }

        seznamPredlogovOznaka.innerHTML = "";

        predlogi.forEach((predlog) => {
            const vrstica = document.createElement('tr');
            vrstica.id = `predlog-row-${predlog.id_objava}`;
            
            let slikaUrl = predlog.fotografija || 'slike/zacetna.jpg';

            // Kratka obrezava opisa, da ne raztegne vrstice preveč
            const krajsiOpis = predlog.opis.length > 60 ? predlog.opis.substring(0, 60) + "..." : predlog.opis;

            // Struktura vrstice je enaka adminovi: slika, naslov, opis namesto avtorja, všečki in gumb za brisanje
            vrstica.innerHTML = `
                <td>
                    <img src="${slikaUrl}" 
                         onerror="this.onerror=null; this.src='slike/zacetna.jpg';" 
                         class="img-fluid rounded-3" 
                         style="height: 60px; width: 80px; object-fit: cover;">
                </td>
                <td class="fw-bold text-uppercase" style="font-size: 14px;">${predlog.naslov}</td>
                <td class="text-muted small">${krajsiOpis}</td>
                <td>
                    <span class="badge bg-success">
                        <i class="fas fa-thumbs-up me-1"></i> ${predlog.st_vseckov || 0}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-danger w-100" onclick="izbrisiPredlog(${predlog.id_objava})">
                        <i class="fas fa-trash-alt me-1"></i> Izbriši
                    </button>
                </td>
            `;
            seznamPredlogovOznaka.appendChild(vrstica);
        });
    } catch (napaka) {
        console.error("Napaka pri nalaganju predlogov:", napaka);
        seznamPredlogovOznaka.innerHTML = `<tr><td colspan="5" class="text-center text-danger small py-3">Napaka pri povezavi s strežnikom.</td></tr>`;
    }
}

// Funkcija za brisanje predloga
async function izbrisiPredlog(idObjave) {
    if (!idObjave) {
        alert("Napaka: Neveljaven ID predloga.");
        return;
    }

    if (confirm("Ali ste prepričani, da želite trajno odstraniti ta predlog?")) {
        try {
            const odziv = await fetch(`/api/izbrisi-predlog/${idObjave}`, {
                method: 'DELETE'
            });
            const data = await odziv.json();

            if (odziv.ok && data.uspeh) {
                alert("Predlog je bil uspešno izbrisan.");
                naloziMojePredloge(); // Ponovno osvežimo profil
            } else {
                alert("Napaka pri brisanju predloga.");
            }
        } catch (napaka) {
            console.error("Napaka pri brisanju:", napaka);
            alert("Težava s povezavo do strežnika.");
        }
    }
}


// =================================================================
// FUNKCIJA ZA ZNAČKE
// =================================================================

async function naloziMojeZnacke() {
    const vsebnik = document.getElementById("seznamZnack");
    const stevilkaZnacke = document.getElementById("stevilkaZnack");
    if (!vsebnik) return;

    const email = localStorage.getItem("prijavljenEmail"); 
    if (!email) return;

    try {
        const odziv = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odziv.json();

        if (stevilkaZnacke) {
            stevilkaZnacke.textContent = `(${znacke.length})`;
        }

        if (znacke.length === 0) {
            vsebnik.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted mb-0">Trenutno še nimate osvojenih značk. Bodite aktivni v skupnosti!</p>
                </div>
            `;
            return;
        }

        vsebnik.innerHTML = ""; 
        
        znacke.forEach(znacka => {
            let ikona = "fa-award"; 
            const nazivMali = znacka.naziv.toLowerCase();

            if (nazivMali.includes("vodja")) ikona = "fa-crown";
            if (nazivMali.includes("glas")) ikona = "fa-shield-alt";
            if (nazivMali.includes("občan")) ikona = "fa-comments";
            if (nazivMali.includes("steber")) ikona = "fa-lightbulb";

            vsebnik.innerHTML += `
                <div class="col-6 col-sm-4 mb-3">
                  <div class="znacka-kartica shadow-sm p-3 text-center rounded bg-white h-100" style="border: 2px solid #ffd700; transition: transform 0.2s;">
                    <div class="znacka-ikona mb-2" style="font-size: 26px; color: #ffd700;"><i class="fas ${ikona}"></i></div>
                    <h6 class="fw-bold mb-1" style="font-size: 14px; color: #000;">${znacka.naziv}</h6>
                    <p class="text-muted small mb-0" style="font-size: 11px; line-height: 1.2;">${znacka.opis}</p>
                  </div>
                </div>
            `;
        });
    } catch (napaka) {
        console.error("Napaka pri nalaganju značk:", napaka);
        vsebnik.innerHTML = `<div class="col-12 text-center text-danger small py-3">Napaka pri povezavi s strežnikom.</div>`;
    }
}

// =================================================================
// UPRAVLJANJE UPORABNIKOV ZA ADMINA
// =================================================================

function naloziUporabnikeZaAdmina() {
    const seznamUporabnikovOznaka = document.getElementById('seznamUporabnikov');
    const stetjeUporabnikovOznaka = document.getElementById('stetjeUporabnikov');
    const praznoObvestilo = document.getElementById('praznoObvestiloUporabniki');
    const tabelaKontejner = document.getElementById('tabelaUporabnikovKontejner');

    if (!seznamUporabnikovOznaka) return;

    fetch('/api/vsi-uporabniki')
        .then(response => response.json())
        .then(vsiUporabniki => {
            if (stetjeUporabnikovOznaka) {
                stetjeUporabnikovOznaka.textContent = `Skupno uporabnikov: ${vsiUporabniki.length}`;
            }

            if (vsiUporabniki.length === 0) {
                if (praznoObvestilo) praznoObvestilo.classList.remove('d-none');
                if (tabelaKontejner) tabelaKontejner.classList.add('d-none');
                return;
            }

            if (praznoObvestilo) praznoObvestilo.classList.add('d-none');
            if (tabelaKontejner) tabelaKontejner.classList.remove('d-none');
            seznamUporabnikovOznaka.innerHTML = '';

            vsiUporabniki.forEach((uporabnik) => {
                const vrstica = document.createElement('tr');
                vrstica.id = `uporabnik-row-${uporabnik.id_uporabnik}`;
                const polnoIme = `${uporabnik.ime} ${uporabnik.priimek}`;
                const uID = parseInt(uporabnik.tk_tip_uporabnikaid_tip_uporabnika) || 2;

                vrstica.innerHTML = `
                    <td class="fw-bold text-muted">#${uporabnik.id_uporabnik}</td>
                    <td><span class="fw-bold">${polnoIme}</span></td>
                    <td class="text-muted">${uporabnik.email}</td>
                    <td>
                        <select class="form-select form-select-sm status-select" onchange="spremeniVlogoUporabnika(${uporabnik.id_uporabnik}, this.value)">
                          <option value="1" ${uID === 1 ? 'selected' : ''}>Administrator</option>
                          <option value="2" ${uID === 2 ? 'selected' : ''}>Uporabnik</option>
                        </select>
                    </td>
                `;
                seznamUporabnikovOznaka.appendChild(vrstica);
            });
        })
        .catch(error => console.error('Napaka pri pridobivanju uporabnikov:', error));
}

function spremeniVlogoUporabnika(idUporabnik, novVlogaId) {
    fetch('/api/posodobi-vlogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id_uporabnik: parseInt(idUporabnik), 
            nov_vloga_id: parseInt(novVlogaId) 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.uspeh) {
            alert('Vloga uporabnika uspešno posodobljena!');
        } else {
            alert('Napaka pri posodabljanju vloge na strežniku.');
        }
    })
    .catch(err => {
        console.error('Napaka pri omrežni povezavi:', err);
    });
}



// =================================================================
// PREDLOGI ZA ADMINA
// =================================================================

function naloziPredlogeZaAdmina() {
    const seznamPredlogovOznaka = document.getElementById('seznamPredlogov');
    const stetjePredlogovOznaka = document.getElementById('stetjePredlogov');
    const praznoObvestiloPredlogi = document.getElementById('praznoObvestiloPredlogi');

    if (!seznamPredlogovOznaka) return;

    fetch('/api/vsi-predlogi')
        .then(response => {
            if (!response.ok) throw new Error("Strežnik je vrnil status " + response.status);
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
                const sID = parseInt(predlog.tk_status_pobudid_status_pobud) || 1; 
                
                const izpisanEmail = predlog.avtor_email || "Neznano";

                vrstica.innerHTML = `
                    <td>
                        <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" 
                             onerror="this.onerror=null; this.src='slike/zacetna.jpg';" 
                             class="img-fluid rounded-3" 
                             style="height: 60px; width: 80px; object-fit: cover;">
                    </td>
                    <td class="fw-bold text-uppercase" style="font-size: 14px;">${predlog.naslov}</td>
                    <td class="text-muted">${izpisanEmail}</td>
                    <td>
                        <span class="badge bg-success">
                            <i class="fas fa-thumbs-up me-1"></i> ${predlog.st_vseckov || 0}
                        </span>
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
        .catch(error => console.error('Napaka pri pridobivanju predlogov:', error));
}

function osveziStatus(idObjava, novStatusId) {
    fetch('/api/posodobi-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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