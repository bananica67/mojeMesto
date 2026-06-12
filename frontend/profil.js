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

    // Povezava na gumb za statistiko
    const statTab = document.querySelector('[data-bs-target="#zavihek-statistika"]');
    if (statTab) {
        statTab.addEventListener('click', prikaziGraf);
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

    const znackeTab = document.getElementById("znacke-tab");
    if (znackeTab) {
        znackeTab.addEventListener("click", naloziMojeZnacke);
    }

    const predlogiTab = document.getElementById("predlogi-tab");
    if (predlogiTab) {
        predlogiTab.addEventListener("click", naloziMojePredloge);
    }
    
    naloziMojePredloge();
    naloziMojeZnacke();
}

function odjaviUporabnika() {
    showSuccess('Odjava uspešna', 'Varno ste se odjavili iz sistema.', function() {
        localStorage.clear();
        window.location.href = 'prijava.html'; 
    });
}

// =================================================================
// FUNKCIJE ZA PREDLOGE
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

        const obstojeceObvestilo = document.querySelector('.alert-success');
        if (obstojeceObvestilo) obstojeceObvestilo.remove();

        const zmagovalniPredlog = predlogi.find(p => p.je_zmagovalec === true);
        const prostorZaObvestilo = document.getElementById("obvestiloZmagovalec");

        if (zmagovalniPredlog && prostorZaObvestilo) {
            prostorZaObvestilo.innerHTML = `
                <div class="text-center p-4 shadow-lg rounded" style="background-color: #fff8e1; border: 2px solid #ffd700;">
                    <i class="fas fa-trophy fa-3x" style="color: #ffd700;"></i>
                    <h2 class="mt-2" style="color: #b8860b;">Čestitamo!</h2>
                    <p class="fs-5">Vaš predlog <strong>"${zmagovalniPredlog.naslov}"</strong> je bil izbran za zmagovalca!</p>
                    <p class="mb-0 fw-bold" style="color: #d35400;">🎁 Prejeli ste eno leto brezplačne uporabe sistema MBajk!</p>
                </div>
            `;
        }

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
            const krajsiOpis = predlog.opis.length > 60 ? predlog.opis.substring(0, 60) + "..." : predlog.opis;

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
    }
}

async function izbrisiPredlog(idObjave) {
    if (!idObjave) return;
 
    // ZAMENJANO: confirm → showConfirmDelete s callbackom
    showConfirmDelete(
        'Izbriši predlog',
        'Ali ste prepričani, da želite trajno odstraniti ta predlog? Tega dejanja ni mogoče razveljaviti.',
        async function() {
            try {
                const odziv = await fetch(`/api/izbrisi-predlog/${idObjave}`, { method: 'DELETE' });
                const data = await odziv.json();
                if (odziv.ok && data.uspeh) {
                    // ZAMENJANO: alert → showSuccess
                    showSuccess('Predlog izbrisan', 'Vaš predlog je bil uspešno odstranjen.', function() {
                        naloziMojePredloge();
                    });
                } else {
                    showError('Napaka', 'Predloga ni bilo mogoče izbrisati. Prosimo, poskusite znova.');
                }
            } catch (napaka) {
                console.error(napaka);
                showError('Napaka', 'Prišlo je do napake na strežniku.');
            }
        }
    );
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

        if (stevilkaZnacke) stevilkaZnacke.textContent = `(${znacke.length})`;

        if (znacke.length === 0) {
            vsebnik.innerHTML = `<div class="col-12 text-center py-4"><p class="text-muted">Ni značk.</p></div>`;
            return;
        }

        vsebnik.innerHTML = ""; 
        znacke.forEach(znacka => {
            let ikona = "fa-award";
            const n = znacka.naziv.toLowerCase();
            if (n.includes("vodja")) ikona = "fa-crown";
            else if (n.includes("glas")) ikona = "fa-shield-alt";
            else if (n.includes("občan")) ikona = "fa-comments";
            else if (n.includes("steber")) ikona = "fa-lightbulb";
            
            vsebnik.innerHTML += `
                <div class="col-6 col-sm-4 mb-3">
                  <div class="shadow-sm p-3 text-center rounded bg-white h-100" style="border: 2px solid #ffd700;">
                    <div class="mb-2" style="font-size: 26px; color: #ffd700;"><i class="fas ${ikona}"></i></div>
                    <h6 class="fw-bold">${znacka.naziv}</h6>
                    <p class="text-muted small">${znacka.opis}</p>
                  </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
}

// =================================================================
// UPRAVLJANJE UPORABNIKOV (ADMIN)
// =================================================================

function naloziUporabnikeZaAdmina() {
    const seznam = document.getElementById('seznamUporabnikov');
    if (!seznam) return;

    fetch('/api/vsi-uporabniki')
        .then(res => res.json())
        .then(uporabniki => {
            seznam.innerHTML = '';
            uporabniki.forEach(u => {
                const uID = parseInt(u.tk_tip_uporabnikaid_tip_uporabnika) || 2;
                seznam.innerHTML += `
                    <tr>
                        <td>#${u.id_uporabnik}</td>
                        <td>${u.ime} ${u.priimek}</td>
                        <td>${u.email}</td>
                        <td>
                            <select class="form-select form-select-sm" onchange="spremeniVlogoUporabnika(${u.id_uporabnik}, this.value)">
                                <option value="1" ${uID === 1 ? 'selected' : ''}>Admin</option>
                                <option value="2" ${uID === 2 ? 'selected' : ''}>Uporabnik</option>
                            </select>
                        </td>
                    </tr>`;
            });
        });
}

function spremeniVlogoUporabnika(id, vloga) {
    fetch('/api/posodobi-vlogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_uporabnik: parseInt(id), nov_vloga_id: parseInt(vloga) })
    }).then(res => res.json()).then(d => { if (d.uspeh) showSuccess('Vloga posodobljena', 'Vloga uporabnika je bila uspešno spremenjena.'); });
}

// =================================================================
// PREDLOGI ZA ADMINA (Z NAGRADO)
// =================================================================

function naloziPredlogeZaAdmina() {
    const seznam = document.getElementById('seznamPredlogov');
    if (!seznam) return;

    fetch('/api/vsi-predlogi')
        .then(res => res.json())
        .then(predlogi => {
            seznam.innerHTML = '';
            predlogi.forEach(p => {
                const sID = parseInt(p.tk_status_pobudid_status_pobud) || 1;
                seznam.innerHTML += `
                    <tr>
                        <td><img src="${p.fotografija || 'slike/zacetna.jpg'}" class="img-fluid rounded-3" style="height: 60px; width: 80px; object-fit: cover;"></td>
                        <td>${p.naslov}</td>
                        <td>${p.avtor_email}</td>
                        <td><span class="badge bg-success">${p.st_vseckov || 0}</span></td>
                        <td>
                            <select class="form-select form-select-sm" onchange="osveziStatus(${p.id_objava}, this.value)">
                                <option value="1" ${sID === 1 ? 'selected' : ''}>Oddano</option>
                                <option value="2" ${sID === 2 ? 'selected' : ''}>V obravnavi</option>
                                <option value="3" ${sID === 3 ? 'selected' : ''}>Zaključeno</option>
                            </select>
                        </td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="odpriModalZmagovalec(${p.id_objava})" ${p.je_zmagovalec ? 'disabled' : ''}>
                                <i class="fas fa-trophy"></i>
                            </button>
                        </td>
                    </tr>`;
            });
        });
}

function osveziStatus(id, status) {
    fetch('/api/posodobi-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_objava: parseInt(id), nov_status_id: parseInt(status) })
    }).then(res => res.json()).then(d => { if (d.uspeh) showSuccess('Status posodobljen', 'Status predloga je bil uspešno spremenjen.'); });
}

let trenutniIdZaZmagovalca = null;
window.odpriModalZmagovalec = function(id) {
    trenutniIdZaZmagovalca = id;
    showConfirmZmagovalec(function() {
        fetch('/api/izberi-zmagovalca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_objava: trenutniIdZaZmagovalca })
        }).then(res => res.json()).then(data => {
            if (data.uspeh) {
                showSuccess('Zmagovalec izbran! 🏆', 'Predlog je bil označen kot zmagovalec. Avtor bo prejel obvestilo.', function() {
                    naloziPredlogeZaAdmina();
                });
            } else {
                showError('Napaka', 'Prišlo je do napake pri izbiri zmagovalca.');
            }
        });
    });
};

// =================================================================
// STATISTIKA (GRAFI IN PODATKI)
// =================================================================

async function prikaziGraf() {
    try {
        const response = await fetch('/api/statistika-statusov');
        const podatki = await response.json();
        
        const ctx = document.getElementById('statusGraf').getContext('2d');
        if (window.myChart instanceof Chart) window.myChart.destroy();

        window.myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: podatki.map(p => p.status),
                datasets: [{
                    label: 'Število predlogov',
                    data: podatki.map(p => p.stetje),
                    backgroundColor: ['#ffc107', '#17a2b8', '#28a745'],
                    borderWidth: 2
                }]
            }
        });

        prikaziTopTri();
        prikaziNovosti();

    } catch (error) { console.error("Napaka pri grafu:", error); }
}

async function prikaziTopTri() {
    try {
        const response = await fetch('/api/top-predlogi');
        const podatki = await response.json();
        const seznam = document.getElementById('topTriSeznam');
        seznam.innerHTML = ''; 

        podatki.forEach((predlog, index) => {
            seznam.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${index + 1}. ${predlog.naslov}
                    <span class="badge bg-primary rounded-pill">${predlog.st_vseckov} všečkov</span>
                </li>`;
        });
    } catch (error) { console.error("Napaka pri Top 3:", error); }
}

async function prikaziNovosti() {
    try {
        const response = await fetch('/api/statistika-novosti');
        const podatki = await response.json();
        document.getElementById('stetjeNovih').innerText = podatki.stetje;
    } catch (error) { console.error("Napaka pri novostih:", error); }
}
