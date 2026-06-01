// =================================================================
// 1. PRIJAVA UPORABNIKA (Povezava z Node.js strežnikom na portu 3000)
// =================================================================
alert("Profil.js se je naložil!");
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email");
            const gesloInput = document.getElementById("geslo");

            const email = emailInput ? emailInput.value.trim() : "";
            const geslo = gesloInput ? gesloInput.value : "";

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && !emailRegex.test(email)) {
                emailInput.classList.add('is-invalid');
                loginForm.classList.add("was-validated");
                return;
            } else if (emailInput) {
                emailInput.classList.remove('is-invalid');
            }

            if (!loginForm.checkValidity()) {
                e.stopPropagation();
                loginForm.classList.add("was-validated");
                return;
            }

            try {
                const response = await fetch("http://localhost:3000/prijava", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, geslo: geslo })
                });

                const rezultat = await response.json();

                if (rezultat.uspeh) {
                    // Shranimo podatke uspešne prijave v brskalnik
                    localStorage.setItem('profilnoIme', rezultat.ime + " " + rezultat.priimek);
                    localStorage.setItem('prijavljenEmail', rezultat.email);
                    window.location.href = "profil.html";
                } else {
                    alert(rezultat.sporocilo);
                }
            } catch (napaka) {
                console.error("Napaka pri povezavi:", napaka);
                alert("Nekaj je šlo narobe pri komunikaciji s strežnikom.");
            }
        });
    }
}); 

// =================================================================
// 2. UPRAVLJANJE PROFILA (Avatar, Ime, Izris e-maila)
// =================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Takoj ko se naloži stran (npr. profil.html), osvežimo vizualne podatke
    prikaziPodatke();
    ///////nova koda 28.5
    if (document.getElementById("seznamZnack")) {
        naloziMojeZnacke();
    }
});

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

    const shranjenEmail = localStorage.getItem('profilniEmail');
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
    
    // Zaženemo nalaganje značk iz baze
    naloziMojeZnacke();
}

function odjaviUporabnika() {
    localStorage.clear(); 
    alert('Odjava uspešna.');
    window.location.href = 'prijava.html'; 
}

// =================================================================
// 3. PRIKAZ IN UPRAVLJANJE UPORABNIKOV (Za Admin panel: obcina-profil.html)
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

                vrstica.innerHTML = `
                    <td class="fw-bold text-muted">#${uporabnik.id_uporabnik}</td>
                    <td><span class="fw-bold">${polnoIme}</span></td>
                    <td class="text-muted">${uporabnik.email}</td>
                    <td>
                        <select class="form-select form-select-sm" onchange="spemeniVlogoUporabnika(${uporabnik.id_uporabnik}, this.value)">
                            <option value="obcan" ${uporabnik.vloga === 'obcan' ? 'selected' : ''}>Občan</option>
                            <option value="obcina" ${uporabnik.vloga === 'obcina' ? 'selected' : ''}>Predstavnik občine</option>
                            <option value="admin" ${uporabnik.vloga === 'admin' ? 'selected' : ''}>Administrator</option>
                        </select>
                    </td>
                    <td style="text-align: center;">
                        <button class="btn btn-link text-danger btn-sm" onclick="izbrisiUporabnikaIzBaze(${uporabnik.id_uporabnik})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                seznamUporabnikovOznaka.appendChild(vrstica);
            });
        })
        .catch(error => console.error('Napaka pri pridobivanju uporabnikov:', error));
}

function spemeniVlogoUporabnika(idUporabnik, novaVloga) {
    fetch(`/api/uporabniki/${idUporabnik}/vloga`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vloga: novaVloga })
    })
    .then(response => {
        if (!response.ok) {
            alert('Napaka pri spreminjanju vloge.');
            naloziUporabnikeZaAdmina();
        }
    })
    .catch(error => console.error('Napaka:', error));
}

function izbrisiUporabnikaIzBaze(idUporabnik) {
    if (confirm('Ali ste prepričani, da želite izbrisati tega uporabnika?')) {
        fetch(`/api/uporabniki/${idUporabnik}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) naloziUporabnikeZaAdmina();
            else alert('Napaka pri brisanju.');
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('seznamUporabnikov')) {
        naloziUporabnikeZaAdmina();
    }
    // Pokličemo nalaganje značk, ko se odpre profil
    naloziMojeZnacke();
});

// =================================================================
// 4. PRAVA SKUPNOSTNA FUNKCIJA ZA ZNAČKE (Povezano z SQL tabelo)
// =================================================================
// Ena sama, čista funkcija za nalaganje značk
//probamo 
async function naloziMojeZnacke() {
    const vsebnik = document.getElementById("seznamZnack");
    if (!vsebnik) return;

    const email = localStorage.getItem("prijavljenEmail") ; 

    try {
        const odziv = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odziv.json();

        // 1. Če uporabnik nima nobene značke
        if (znacke.length === 0) {
            vsebnik.innerHTML = `
                <div class="col-12 text-center py-4">
                    <p class="text-muted mb-0">Trenutno še nimate osvojenih značk. Bodite aktivni v skupnosti!</p>
                </div>
            `;
            return;
        }

        // 2. Izris značk
        vsebnik.innerHTML = ""; 
        
        znacke.forEach(znacka => {
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


   /*async function naloziMojeZnacke() {
    const vsebnik = document.getElementById("seznamZnack");
    if (!vsebnik) return;

    // Zdaj bomo uporabili točno določen ključ, ki ga vidim v tvojem posnetku
    const email = localStorage.getItem("prijavljenEmail"); 

    console.log("Prebran email iz localStorage:", email); // TO TI BO POMAGALO PRI DEBUGIRANJU

    if (!email) {
        vsebnik.innerHTML = '<p class="text-center p-3 text-muted">Niste prijavljeni.</p>';
        return;
    }

    try {
        const odziv = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odziv.json();

        if (znacke && znacke.length > 0) {
            // TUKAJ JE TVOJ DIZAJN (ikona, h6, opis)
            vsebnik.innerHTML = znacke.map(z => `
                <div class="col-md-4">
                    <div class="card shadow-sm text-center p-3">
                        <i class="fas fa-award fa-3x mb-2" style="color: #cb2121;"></i>
                        <h6 class="fw-bold">${z.naziv}</h6>
                        <p class="small text-muted">${z.opis}</p>
                    </div>
                </div>
            `).join('');
        } else {
            vsebnik.innerHTML = '<p class="text-center p-3 text-muted">Še nimate osvojenih značk. Bodite aktivni!</p>';
        }
    } catch (err) {
        console.error("Napaka pri značkah:", err);
        vsebnik.innerHTML = '<p class="text-center p-3 text-danger">Napaka pri nalaganju.</p>';
    }
}

// OSREDNJA TOČKA NALOGE: Vse se zažene tukaj ob nalaganju strani
document.addEventListener("DOMContentLoaded", () => {
    // 1. Naloži podatke uporabnika
    prikaziPodatke();
    
    // 2. Naloži značke (uporabi to enotno funkcijo)
    naloziMojeZnacke();
    
    // 3. Če si na admin strani, naloži še uporabnike
    if (document.getElementById('seznamUporabnikov')) {
        naloziUporabnikeZaAdmina();
    }
});
//zgornja verzija tega je pravilna 
///28.5.2026

/*document.addEventListener("DOMContentLoaded", async () => {
    const email = localStorage.getItem("profilniEmail");
    const vsebnikZnack = document.getElementById("seznamZnack");

    if (!email) {
        vsebnikZnack.innerHTML = '<div class="col-12 text-center py-4 text-muted">Niste prijavljeni.</div>';
        return;
    }

    try {
        // 2. Kliči strežnik
        const odziv = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odziv.json();

        // 3. Izriši značke
        if (znacke.length > 0) {
            let html = '';
            znacke.forEach(z => {
                html += `
                    <div class="col-md-4">
                        <div class="card shadow-sm text-center p-3">
                            <i class="fas fa-award fa-3x mb-2" style="color: #cb2121;"></i>
                            <h6 class="fw-bold">${z.naziv}</h6>
                            <p class="small text-muted">${z.opis}</p>
                        </div>
                    </div>
                `;
            });
            vsebnikZnack.innerHTML = html;
        } else {
            vsebnikZnack.innerHTML = '<div class="col-12 text-center py-4 text-muted">Trenutno še nimate osvojenih značk. Bodite aktivni!</div>';
        }
    } catch (err) {
        console.error("Napaka pri nalaganju značk:", err);
        vsebnikZnack.innerHTML = '<div class="col-12 text-center py-4 text-danger">Napaka pri nalaganju značk.</div>';
    }
});

// Funkcija, ki ob nalaganju strani naloži značke
async function naloziZnacke() {
    // Predpostavimo, da email shranjen v localStorage (tako kot pri prijavi)
    const email = localStorage.getItem('uporabnikEmail'); 
    
    if (!email) return; // Če ni uporabnika, ne počni nič

    try {
        const odgovor = await fetch(`/api/moje-znacke/${email}`);
        const znacke = await odgovor.json();
        
        const vsebnik = document.getElementById('seznamZnack');
        
        if (znacke.length === 0) {
            vsebnik.innerHTML = '<p class="text-muted">Še nimate nobene značke.</p>';
            return;
        }

        vsebnik.innerHTML = ''; // Počisti "Nalaganje..."
        znacke.forEach(z => {
            vsebnik.innerHTML += `
                <div class="col-md-4">
                    <div class="card p-3 shadow-sm text-center">
                        <i class="fas fa-award fa-2x mb-2" style="color: #cb2121;"></i>
                        <h5>${z.naziv}</h5>
                        <p class="small text-muted">${z.opis}</p>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Napaka pri nalaganju značk:", err);
    }
}

// Sproži funkcijo, ko se stran naloži
document.addEventListener('DOMContentLoaded', naloziZnacke);*/