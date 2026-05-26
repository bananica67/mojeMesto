// =========================================================================
// 1. SKRIPT ZA PRIJAVO
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prepreči osveževanje strani

            // Preberemo vnosna polja iz HTML-ja
            const emailInput = document.getElementById("email");
            const gesloInput = document.getElementById("geslo");

            const email = emailInput ? emailInput.value.trim() : "";
            const geslo = gesloInput ? gesloInput.value : "";

            // Osnovna regex preverba za email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && !emailRegex.test(email)) {
                emailInput.classList.add('is-invalid');
                loginForm.classList.add("was-validated");
                return;
            } else if (emailInput) {
                emailInput.classList.remove('is-invalid');
            }

            // Preverimo celotno Bootstrap validacijo
            if (!loginForm.checkValidity()) {
                e.stopPropagation();
                loginForm.classList.add("was-validated");
                return;
            }

            try {
                // Pošljemo podatke na Node.js strežnik
                const response = await fetch("http://localhost:3000/api/prijava", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email: email, geslo: geslo })
                });

                const rezultat = await response.json();

                if (rezultat.uspeh) {
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


// =========================================================================
// 2. SKRIPT ZA PROFIL
// =========================================================================

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
    
    // VAROVALO: Preverimo, če avatar sploh obstaja na strani
    const avatar = document.getElementById('uporabnikAvatar');
    if (avatar) {
        avatar.style.backgroundColor = barva;
    }
}

// Združena funkcija za spremembo barve in takojšnje shranjevanje v LocalStorage
function profilna(element, barva) {
    spremeniBarvo(element, barva);
    localStorage.setItem('profilnaBarva', barva);
}

// Funkcija za posodobitev imena na profilu in shranjevanje
function shraniIme() {
    const vnesenoImeInput = document.getElementById('vnosIme');
    if (!vnesenoImeInput) return; // Varovalo, če polja ni

    const vnesenoIme = vnesenoImeInput.value;
    if (vnesenoIme.trim() !== "") {
        const prikazanoIme = document.getElementById('prikazanoIme');
        if (prikazanoIme) {
            prikazanoIme.textContent = vnesenoIme;
        }
        
        // Shranimo v localStorage
        localStorage.setItem('profilnoIme', vnesenoIme);

        // Zapri modalno okno
        const modalElement = document.getElementById('modalIme');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    }
}

// Funkcija, ki ob preklopu ali osvežitvi strani naloži podatke nazaj na zaslon
function prikaziPodatke() {
    // 1. Nalaganje in izris shranjenega imena
    const shranjenoIme = localStorage.getItem('profilnoIme');
    const prikazanoIme = document.getElementById('prikazanoIme');
    const vnosIme = document.getElementById('vnosIme');

    if (shranjenoIme) {
        if (prikazanoIme) prikazanoIme.textContent = shranjenoIme;
        if (vnosIme) vnosIme.value = shranjenoIme; 
    }

    // 2. Nalaganje in izris shranjene barve avatarja
    const shranjenaBarva = localStorage.getItem('profilnaBarva');
    const avatar = document.getElementById('uporabnikAvatar');

    if (shranjenaBarva && avatar) {
        // Spremenimo ozadje avatarja
        avatar.style.backgroundColor = shranjenaBarva;
        
        // Najdemo krog s to barvo in ga označimo kot aktivnega
        document.querySelectorAll('.barva-krog').forEach(krog => {
            krog.classList.remove('aktivna');
            if (krog.style.backgroundColor === shranjenaBarva || (krog.getAttribute('onclick') && krog.getAttribute('onclick').includes(shranjenaBarva))) {
                krog.classList.add('aktivna');
            }
        });
    }
}


// =========================================================================
// 3. SKRIP ZA ZEMLJEVID - status predlogov
// =========================================================================
const mapElement = document.getElementById('map');

if (mapElement) {
    // Koda se bo izvedla SAMO, če element 'map' dejansko obstaja na strani
    const map = L.map('map').setView([46.5547, 15.6459], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    console.log("Zemljevid je bil uspešno naložen!");
}