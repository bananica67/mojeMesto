// SKRIPT ZA PRIJAVO
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
                const response = await fetch("http://localhost:3000/api/prijava", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    // Pošljemo pravilni spremenljivki 'email' in 'geslo'
                    body: JSON.stringify({ email: email, geslo: geslo })
                });

                const rezultat = await response.json();

                if (rezultat.uspeh) {
                    // Če je prijava uspešna, preusmerimo na profil
                    window.location.href = "profil.html";
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



// SKRIPT ZA PROFIL
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
        document.getElementById('vnosIme').value = shranjenoIme; // Nastavi vrednost tudi znotraj modala
      }

      // 2. Nalaganje in izris shranjene barve avatarja
      const shranjenaBarva = localStorage.getItem('profilnaBarva');
      if (shranjenaBarva) {
        // Spremenimo ozadje avatarja
        document.getElementById('uporabnikAvatar').style.backgroundColor = shranjenaBarva;
        
        // Najdemo krog s to barvo in ga označimo kot aktivnega
        document.querySelectorAll('.barva-krog').forEach(krog => {
          krog.classList.remove('aktivna');
          // Ker RGB vrednosti v slogih včasih povzročajo težave pri primerjavi nizov, 
          // primerjamo neposredno preko sloga (style.backgroundColor)
          if (krog.style.backgroundColor === shranjenaBarva || krog.getAttribute('onclick').includes(shranjenaBarva)) {
            krog.classList.add('aktivna');
          }
        });
      }
    }
  


// SKRIP ZA ZEMLJEVID - status predlogov
const mapElement = document.getElementById('map');

if (mapElement) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}
