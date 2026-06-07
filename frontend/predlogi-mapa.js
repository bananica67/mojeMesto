// =================================================================
// ZEMLJEVID Z MARKERJI IN GRUPIRANJEM (CLUSTERING)
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Preveri kateri zemljevid je prisoten in ga inicijaliziraj
  const mapPredlogiElement = document.getElementById('map-predlogi');
  const mapObcineElement = document.getElementById('map-obcine');

  // Funkcija za inicijalizacijo zemljevida
  function initializeMap(mapElement, mapId) {
    if (!mapElement) return;

    // Inicijalizacija Leaflet zemljevida
    const map = L.map(mapId).setView([46.5547, 15.6459], 13);

    // Dodaj OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Ustvari MarkerClusterGroup za grupirane markerje
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16
    });

    // Pridobi vse predloge s koordinatami
    fetch('/api/vsi-predlogi-uporabnikov')
      .then(response => response.json())
      .then(predlogi => {
        let markerCount = 0;

        predlogi.forEach(predlog => {
          // Preskočimo predloge brez koordinat
          if (!predlog.lokacija) return;

          try {
            // Razčlenimo koordinate iz formata "lat,lng"
            const [lat, lng] = predlog.lokacija.split(',').map(coord => parseFloat(coord.trim()));

            if (isNaN(lat) || isNaN(lng)) return;

            let izpisAvtorja = "";

            // Pretvorba ID-ja v številko za preverjanje
            const avtorId = predlog.tk_uporabnikid_uporabnik ? parseInt(predlog.tk_uporabnikid_uporabnik) : null;

            if (avtorId === 1) {
              izpisAvtorja = "Mestna občina Maribor";
            } else if (predlog.avtor_ime || predlog.avtor_priimek) {
              // Če obstajata ime ali priimek v objektu, ju izpišemo
              izpisAvtorja = `${predlog.avtor_ime || ''} ${predlog.avtor_priimek || ''}`.trim();
            } else {
              // Če je oboje prazno (zaradi napake v joinu ali podatkih)
              izpisAvtorja = "Občan (Uporabnik)";
            }

            // Okrajšaj opis na 80 znakov
            const opisPregled = predlog.opis.length > 80
              ? predlog.opis.substring(0, 80) + '...'
              : predlog.opis;

            // Ustvari popup vsebino s predogledom
            const popupContent = `
              <div style="width: 250px; font-family: Arial, sans-serif;">
                <img src="${predlog.fotografija || 'slike/zacetna.jpg'}"
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;"
                     onerror="this.src='slike/zacetna.jpg';" alt="predlog">
                <h6 style="margin: 0 0 4px 0; font-weight: bold; color: #8c1212;">${predlog.naslov}</h6>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">Avtor: ${izpisAvtorja}</p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #333;">${opisPregled}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12px; color: #666;">
                    <i class="fas fa-thumbs-up" style="color: #28a745;"></i> ${predlog.st_vseckov || 0}
                  </span>
                  <button style="padding: 4px 12px; background-color: #8c1212; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;"
                          onclick="window.scrollTo({top: document.getElementById('predlog-uporabnik').offsetTop - 100, behavior: 'smooth'});">
                    Poglej
                  </button>
                </div>
              </div>
            `;

            // Ustvari marker
            const marker = L.marker([lat, lng], {
              title: predlog.naslov
            });

            // Dodaj popup
            marker.bindPopup(popupContent, {
              maxWidth: 300,
              className: 'custom-popup'
            });

            // Dodaj hover effect - prikaži popup ob hoveru
            marker.on('mouseover', function() {
              this.openPopup();
            });
            marker.on('mouseout', function() {
              this.closePopup();
            });

            // Dodaj marker v cluster group
            markerClusterGroup.addLayer(marker);
            markerCount++;

          } catch (e) {
            console.error('Napaka pri parsiranju koordinat:', e, predlog.koordinate);
          }
        });

        // Dodaj cluster group na zemljevid
        map.addLayer(markerClusterGroup);

        // Prilagodi pogled na vse markerje
        if (markerCount > 0) {
          map.fitBounds(markerClusterGroup.getBounds().pad(0.1));
        }

        console.log(`Naloženo ${markerCount} predlogov z lokacijami na zemljevidu ${mapId}`);
      })
      .catch(err => console.error("Napaka pri nalaganju predlogov za zemljevid:", err));

    // Prilagodi velikost zemljevida ob spremembi velikosti okna
    window.addEventListener('resize', function() {
      map.invalidateSize();
    });
  }

  // Inicijaliziraj zemljevide če obstajajo
  if (mapPredlogiElement) {
    initializeMap(mapPredlogiElement, 'map-predlogi');
  }

  if (mapObcineElement) {
    initializeMap(mapObcineElement, 'map-obcine');
  }
});

