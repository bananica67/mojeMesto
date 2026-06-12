// =================================================================
// 1. PRIJAVA
// =================================================================
 
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
 
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Prepreči osveževanje strani
 
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
                // Pošljemo podatke na Node.js strežnik na portu 3000
                const response = await fetch("http://localhost:3000/prijava", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, geslo: geslo })
                });
 
                const rezultat = await response.json();
 
                if (rezultat.uspeh) {
                    // Shranimo ID in podatke uspešne prijave v brskalnik
                    localStorage.setItem('trenutniUporabnikId', rezultat.id_uporabnik);
                    localStorage.setItem('profilnoIme', rezultat.ime + " " + rezultat.priimek);
                    localStorage.setItem('prijavljenEmail', rezultat.email);
                    localStorage.setItem('tip_uporabnika', rezultat.tip_uporabnika);
 
                    // Preusmeritev glede na tip uporabnika (1 = Admin/Občina, 2 = Občan)
                    if (rezultat.tip_uporabnika === 1) {
                        window.location.href = "obcina-profil.html";
                    } else {
                        window.location.href = "profil.html";
                    }
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