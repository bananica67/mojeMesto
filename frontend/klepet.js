const ws = new WebSocket('ws://localhost:3001');

let trenutniPrejemnikEmail = null;

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

// Pridobimo ime iz localStorage (nastavljeno ob uspešni prijavi)
const prijavljenIme = localStorage.getItem('ime') || 'Uporabnik';
const prijavljenPriimek = localStorage.getItem('priimek') || 'Mesta';
const celotnoImeUporabnika = `${prijavljenIme} ${prijavljenPriimek}`;

ws.onopen = () => {
    console.log("Uspešno povezan v IDE-JA klepetnico na portu 3001.");
};

ws.onmessage = (event) => {
    try {
        const podatek = JSON.parse(event.data);
        const mojEmail = localStorage.getItem('email');

        // --- FILTRIRANJE ZASEBNIH SPOROČIL ---
        // Sporočilo izrišemo samo, če:
        // 1. Smo ga MI poslali TRENUTNEMU prejemniku
        // 2. Je TRENUTNI prejemnik poslal sporočilo NAM
        const zame = (podatek.komuEmail === mojEmail && podatek.odKogaEmail === trenutniPrejemnikEmail);
        const odMene = (podatek.odKogaEmail === mojEmail && podatek.komuEmail === trenutniPrejemnikEmail);

        if (zame || odMene) {
            const sporociloOkvir = document.createElement('div');
            sporociloOkvir.classList.add('sporocilo');
            
            if (odMene) {
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
    } catch (e) {
        console.log("Sistemsko obvestilo:", event.data);
    }
};

function izberiUporabnikaZaKlepet(prejemnikEmail, celotnoIme) {
    trenutniPrejemnikEmail = prejemnikEmail;
    const mojEmail = localStorage.getItem('email');
    const prijavljenIme = localStorage.getItem('ime') || 'Uporabnik';

    // Posodobimo glavo klepeta desno zgoraj
    document.querySelector('.del-glava h5').textContent = celotnoIme;

    // Pridobimo zgodovino iz baze
    fetch(`/api/zgodovina-klepeta?mojEmail=${mojEmail}&prejemnikEmail=${prejemnikEmail}`)
        .then(res => res.json())
        .then(zgodovina => {
            chatMessages.innerHTML = ''; // Počistimo okno

            zgodovina.forEach(sp => {
                const sporociloOkvir = document.createElement('div');
                sporociloOkvir.classList.add('sporocilo');

                // Če je pošiljatelj moj email, je poslano, drugače prejeto
                if (sp.posiljatelj_email === mojEmail) {
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

            chatMessages.scrollTop = chatMessages.scrollHeight; // Pomik na dno
        })
        .catch(err => console.error("Napaka pri nalaganju zgodovine:", err));
}

function posljiSporocilo() {
    const tekst = chatInput.value.trim();
    
    // Če nismo izbrali nikogar na levi strani, ne pustimo poslati sporočila
    if (!trenutniPrejemnikEmail) {
        alert("Najprej na levi strani izberi uporabnika, s katerim želiš klepetati!");
        return;
    }

    if (tekst !== "") {
        const paket = {
            avtor: celotnoImeUporabnika,
            odKogaEmail: localStorage.getItem('email'), // Moj e-mail
            komuEmail: trenutniPrejemnikEmail,          // E-mail izbranega uporabnika
            tekst: tekst
        };
        
        ws.send(JSON.stringify(paket));
        chatInput.value = "";
    }
}

// Klik na gumb za pošiljanje
chatSendBtn.addEventListener('click', posljiSporocilo);

// Pritisk na tipko Enter znotraj polja
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        posljiSporocilo();
    }
});

// Funkcija, ki naloži prave uporabnike iz baze in skrije trenutno prijavljenega
function naloziUporabnikeZaKlepet() {
    const seznamOznaka = document.querySelector('.seznam-uporabnikov');
    
    // Pridobimo e-mail trenutno prijavljenega uporabnika
    const mojEmail = localStorage.getItem('email');

    fetch('/api/vsi-uporabniki')
        .then(response => response.json())
        .then(uporabniki => {
            // Počistimo statični HTML in pustimo le naslov
            seznamOznaka.innerHTML = `
                <div class="p-3 bg-white border-bottom">
                    <h5 class="fw-bold m-0 text-dark" style="font-size: 18px;">Pogovori</h5>
                </div>
            `;

            uporabniki.forEach(uporabnik => {
                // --- KLJUČNI POPRAVEK: Če se e-mail ujema z mojim, ga preskočimo ---
                if (uporabnik.email === mojEmail) {
                    return; 
                }

                const kratica = `${uporabnik.ime[0]}${uporabnik.priimek[0]}`.toUpperCase();
                const celotnoIme = `${uporabnik.ime} ${uporabnik.priimek}`;

                const kartica = document.createElement('div');
                kartica.className = 'uporabnik-kartica d-flex align-items-center p-3 border-bottom';
                kartica.style.cursor = 'pointer';
                
                kartica.dataset.email = uporabnik.email;
                kartica.dataset.ime = celotnoIme;

                kartica.innerHTML = `
                    <div class="mini-avatar" style="background-color: #8c1212; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${kratica}</div>
                    <div class="ms-3 overflow-hidden">
                        <h6 class="mb-0 fw-bold text-truncate" style="font-size: 14px;">${celotnoIme}</h6>
                        <small class="text-muted text-truncate d-block">Klikni za klepet</small>
                    </div>
                `;

                // Ko kliknemo na kartico, se zažene klepet s to osebo
                kartica.addEventListener('click', () => {
                    document.querySelectorAll('.uporabnik-kartica').forEach(k => k.classList.remove('aktivna'));
                    kartica.classList.add('aktivna');
                    izberiUporabnikaZaKlepet(uporabnik.email, celotnoIme);
                });

                seznamOznaka.appendChild(kartica);
            });
        })
        .catch(err => console.error("Napaka pri nalaganju uporabnikov:", err));
}

// Pokličemo funkcijo ob naložitvi strani
document.addEventListener("DOMContentLoaded", () => {
    // Če imaš kakšno inicializacijo, jo pusti tukaj
    if (document.querySelector('.seznam-uporabnikov')) {
        naloziUporabnikeZaKlepet();
    }
});

// Sprožimo nalaganje takoj ko se skripta naloži
naloziUporabnikeZaKlepet();