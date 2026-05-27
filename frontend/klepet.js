const ws = new WebSocket('ws://localhost:3000');

let trenutniPrejemnikEmail = null;

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// Pridobivanje podatkov prijavljenega uporabnika iz localStorage
const profilnoIme = localStorage.getItem('profilnoIme') || 'Uporabnik Mesta';
const celotnoImeUporabnika = profilnoIme;
const mojEmail = (localStorage.getItem('profilniEmail') || '').toLowerCase().trim();

console.log("=== POVEZAN UPORABNIK ===");
console.log("Ime in priimek:", celotnoImeUporabnika);
console.log("Moj Email:", mojEmail);

ws.onopen = () => {
    console.log("Uspešno povezan v klepetnico na portu 3000.");
};

ws.onmessage = (event) => {
    try {
        const podatek = JSON.parse(event.data);
        console.log("Prejeto WS sporočilo:", podatek);

        const p_odKoga = (podatek.odKogaEmail || '').toLowerCase().trim();
        const p_komu = (podatek.komuEmail || '').toLowerCase().trim();
        const t_prejemnik = (trenutniPrejemnikEmail || '').toLowerCase().trim();

        const zameVklepetu = (p_komu === mojEmail && p_odKoga === t_prejemnik);
        const odMeneVklepetu = (p_odKoga === mojEmail && p_komu === t_prejemnik);

        if (zameVklepetu || odMeneVklepetu) {
            const sporociloOkvir = document.createElement('div');
            sporociloOkvir.classList.add('sporocilo');

            if (odMeneVklepetu) {
                sporociloOkvir.classList.add('poslano');
            } else {
                sporociloOkvir.classList.add('prejeto');
            }

            const zdaj = new Date();
            const casIzpis = zdaj.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

            sporociloOkvir.innerHTML = `
                <div class="vsebina-mehurcka">
                    <strong>${podatek.avtor}:</strong> ${podatek.tekst}
                    <span class="cas-sporocila">${casIzpis}</span>
                </div>
            `;

            chatMessages.appendChild(sporociloOkvir);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        else if (p_komu === mojEmail && p_odKoga !== t_prejemnik) {
            const uporabnikKartica = document.querySelector(`.uporabnik-kartica[data-email="${p_odKoga}"]`);
            if (uporabnikKartica) {
                uporabnikKartica.style.backgroundColor = "rgba(140, 18, 18, 0.15)";
                const obvestiloTekst = uporabnikKartica.querySelector('.obvestilo-tekst');
                if (obvestiloTekst) {
                    obvestiloTekst.textContent = "Novo sporočilo!";
                    obvestiloTekst.style.color = "#8c1212";
                    obvestiloTekst.style.fontWeight = "bold";
                }
            }
        }
    } catch (e) {
        console.error("Napaka pri prejemu WS sporočila:", e);
    }
};

ws.onerror = (error) => {
    console.error("WebSocket napaka:", error);
};

ws.onclose = () => {
    console.log("Prekinjena povezava s WebSocket strežnikom.");
};

function posljiSporocilo() {
    const tekst = chatInput.value.trim();

    if (!trenutniPrejemnikEmail) {
        alert("Najprej izberi uporabnika na levi strani!");
        return;
    }

    if (tekst !== "") {
        const paket = {
            avtor: celotnoImeUporabnika,
            odKogaEmail: mojEmail,
            komuEmail: trenutniPrejemnikEmail,
            tekst: tekst
        };

        console.log("Pošiljam paket:", paket);
        ws.send(JSON.stringify(paket));
        chatInput.value = "";
    }
}

function izberiUporabnikaZaKlepet(prejemnikEmail, celotnoIme, karticaElement) {
    trenutniPrejemnikEmail = prejemnikEmail.toLowerCase().trim();
    console.log("Klepet odprt z:", trenutniPrejemnikEmail);

    // Omogočimo vnos sporočila
    chatInput.disabled = false;
    chatSendBtn.disabled = false;

    // Varno odstranimo aktivni razred z vseh kartic
    document.querySelectorAll('.uporabnik-kartica').forEach(k => k.classList.remove('aktivna'));

    // Dodamo aktivni razred trenutni kartici, če obstaja
    if (karticaElement) {
        karticaElement.classList.add('aktivna');
        karticaElement.style.backgroundColor = "";
        const obvestiloTekst = karticaElement.querySelector('.obvestilo-tekst');
        if (obvestiloTekst) {
            obvestiloTekst.textContent = "Klikni za klepet";
            obvestiloTekst.style.color = "";
            obvestiloTekst.style.fontWeight = "";
        }
    }

    const glavaIme = document.querySelector('.del-glava h5');
    if (glavaIme) glavaIme.textContent = celotnoIme;

    // Pridobivanje zgodovine
    fetch(`http://localhost:3000/api/zgodovina-klepeta?mojEmail=${mojEmail}&prejemnikEmail=${trenutniPrejemnikEmail}`)
        .then(res => {
            if (!res.ok) throw new Error('Napaka pri pridobivanju zgodovine');
            return res.json();
        })
        .then(zgodovina => {
            chatMessages.innerHTML = '';
            zgodovina.forEach(sp => {
                const sporociloOkvir = document.createElement('div');
                sporociloOkvir.classList.add('sporocilo');

                const posiljatelj = sp.posiljatelj_email.toLowerCase().trim();
                if (posiljatelj === mojEmail) {
                    sporociloOkvir.classList.add('poslano');
                } else {
                    sporociloOkvir.classList.add('prejeto');
                }

                const cas = new Date(sp.datum_vnos).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

                sporociloOkvir.innerHTML = `
                    <div class="vsebina-mehurcka">
                        ${sp.vsebina}
                        <span class="cas-sporocila">${cas}</span>
                    </div>
                `;
                chatMessages.appendChild(sporociloOkvir);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(err => console.error("Napaka pri branju zgodovine:", err));
}

function naloziUporabnikeZaKlepet() {
    const seznamOznaka = document.querySelector('.seznam-uporabnikov');
    if (!seznamOznaka) return;

    fetch('http://localhost:3000/api/vsi-uporabniki')
        .then(response => {
            if (!response.ok) throw new Error('Napaka pri pridobivanju uporabnikov');
            return response.json();
        })
        .then(uporabniki => {
            seznamOznaka.innerHTML = `
                <div class="p-3 bg-light border-bottom">
                    <h6 class="fw-bold m-0 text-dark">Pogovori</h6>
                </div>
            `;

            if (uporabniki.length === 0) {
                seznamOznaka.innerHTML += '<div class="p-3 text-muted">Ni drugih uporabnikov</div>';
                return;
            }

            uporabniki.forEach(uporabnik => {
                const uEmail = uporabnik.email.toLowerCase().trim();

                // Ne prikažemo samega sebe
                if (uEmail === mojEmail) return;

                const kratica = `${uporabnik.ime[0]}${uporabnik.priimek[0]}`.toUpperCase();
                const celotnoIme = `${uporabnik.ime} ${uporabnik.priimek}`;

                const kartica = document.createElement('div');
                kartica.className = 'uporabnik-kartica d-flex align-items-center';
                kartica.style.cursor = 'pointer';
                kartica.setAttribute('data-email', uEmail);

                kartica.innerHTML = `
                    <div class="mini-avatar" style="background-color: #8c1212; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink:0;">${kratica}</div>
                    <div class="ms-3 overflow-hidden" style="flex: 1;">
                        <h6 class="mb-0 fw-bold text-truncate" style="font-size: 14px; color: #000;">${celotnoIme}</h6>
                        <small class="text-muted text-truncate d-block obvestilo-tekst">Klikni za klepet</small>
                    </div>
                `;

                kartica.addEventListener('click', () => {
                    izberiUporabnikaZaKlepet(uEmail, celotnoIme, kartica);
                });

                seznamOznaka.appendChild(kartica);
            });
        })
        .catch(err => console.error("Napaka pri nalaganju uporabnikov:", err));
}

document.addEventListener("DOMContentLoaded", () => {
    if (!mojEmail) {
        alert("Niste prijavljeni! Preusmeravamo vas na prijavo.");
        window.location.href = 'prijava.html';
        return;
    }

    naloziUporabnikeZaKlepet();

    chatSendBtn.addEventListener('click', posljiSporocilo);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            posljiSporocilo();
        }
    });
});
