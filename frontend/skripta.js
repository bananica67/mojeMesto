// =================================================================
// SKRIPT ZA ZEMLJEVID IN SPLOŠNE FUNKCIJE STRANI (status.html)
// =================================================================

const mapElement = document.getElementById('map');

if (mapElement) {
  // 1. Inicializacija zemljevida na Maribor
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  // Naložimo OpenStreetMap grafiko
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 2. Pridobivanje vseh predlogov iz strežnika za izris markerjev
  fetch('/api/vsi-predlogi-uporabnikov')
    .then(res => res.json())
    .then(predlogi => {
      console.log("Prejeti predlogi iz baze:", predlogi);

      if (!predlogi || !Array.isArray(predlogi)) {
        console.log("Ni prejetih predlogov ali pa podatki niso tabela.");
        return;
      }
      
      // Gremo skozi vsak predlog
      predlogi.forEach(predlog => {
        
        // PREVERJANJE LOKACIJE: Če lokacije ni ali ni tekst, gremo na naslednjega
        if (!predlog || !predlog.lokacija || typeof predlog.lokacija !== 'string') {
          return; 
        }
          
        const deliLokacije = predlog.lokacija.split(',');
        if (deliLokacije.length === 2) {
          const lat = parseFloat(deliLokacije[0].trim());
          const lng = parseFloat(deliLokacije[1].trim());

          // Preverimo, če sta koordinati uspešno pretvorjeni v številki
          if (!isNaN(lat) && !isNaN(lng)) {
            
            // Ustvarimo marker
            const marker = L.marker([lat, lng]).addTo(map);

            // VARNOSTNO PREVERJANJE AVTORJA:
            let izpisAvtorja = "Uporabnik";
            if (parseInt(predlog.tk_uporabnikid_uporabnik) === 1) {
              izpisAvtorja = "Mestna občina Maribor";
            } else if (predlog.avtor_ime || predlog.avtor_priimek) {
              izpisAvtorja = `${predlog.avtor_ime || ''} ${predlog.avtor_priimek || ''}`.trim();
            } else if (predlog.ime || predlog.priimek) {
              izpisAvtorja = `${predlog.ime || ''} ${predlog.priimek || ''}`.trim();
            }

            // NAJBOLJ VARNO PREVERJANJE OPISA IN NASLOVA (Prepreči vse substring/null napake):
            const varenNaslov = predlog.naslov ? predlog.naslov : "Brez naslova";
            const varenOpis = predlog.opis ? String(predlog.opis) : "Brez opisa.";
            const krajsiOpis = varenOpis.length > 90 ? varenOpis.substring(0, 90) + '...' : varenOpis;

            // Nastavimo oblaček (Popup)
            marker.bindPopup(`
              <div style="font-family: sans-serif; min-width: 210px; padding: 2px;">
                <h5 style="margin: 0 0 6px 0; font-weight: bold; color: #212529;">${varenNaslov}</h5>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6c757d;">
                  <i class="fas fa-user"></i> Oddal: ${izpisAvtorja}
                </p>
                <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.4; color: #495057;">
                  ${krajsiOpis}
                </p>
                <div style="font-size: 12px; font-weight: bold; color: #198754; display: flex; align-items: center; gap: 5px;">
                  <i class="fas fa-thumbs-up"></i> ${predlog.st_vseckov || 0} podpore
                </div>
              </div>
            `);
          }
        }
      });
    })
    .catch(err => console.error("Napaka pri pridobivanju lokacij za zemljevid:", err));
}

// Za odjavo
function odjaviUporabnika() {
    localStorage.clear();
    alert('Odjava uspešna.');
    window.location.href = 'prijava.html';
}