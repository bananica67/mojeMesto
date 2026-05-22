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