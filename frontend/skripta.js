// =================================================================
// ZEMLJEVID
// =================================================================

document.addEventListener('DOMContentLoaded', function() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  if (mapElement._leaflet_id) mapElement._leaflet_id = null;

  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  function getMarkerIcon(statusId) {
    const barve = { 1: 'blue', 2: 'orange', 3: 'green' };
    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${barve[statusId] || 'blue'}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  // ← SAMO TO JE NOVO
  const markerCluster = L.markerClusterGroup();

  fetch('/api/vsi-predlogi-uporabnikov?t=' + new Date().getTime())
    .then(res => res.json())
    .then(predlogi => {
      predlogi.forEach(p => {
        if (!p.lokacija) return;

        const [lat, lng] = p.lokacija.split(',').map(c => parseFloat(c.trim()));
        if (isNaN(lat) || isNaN(lng)) return;

        const statusId = parseInt(p.tk_status_pobudid_status_pobud) || 1;
        const statusIme = { 1: "Oddano", 2: "V obdelavi", 3: "Zaključeno" }[statusId] || "Oddano";

        // ← .addTo(map) ZAMENJANO z .addLayer
        const marker = L.marker([lat, lng], { icon: getMarkerIcon(statusId) });

        marker.bindPopup(`
          <div style="width: 260px; padding: 5px;">
            <img src="${p.fotografija || 'slike/zacetna.jpg'}" 
                 style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;">
            <h5 style="font-weight:bold; margin: 0 0 5px 0;">${p.naslov}</h5>
            <p style="margin: 3px 0; font-size: 13px;">${p.avtor_ime || ''} ${p.avtor_priimek || ''}</p>
            <p style="margin: 3px 0; font-size: 13px;">Status: <b>${statusIme}</b></p>
            <div style="color: green; font-weight: bold; margin-top: 8px; font-size: 14px;">
              <i class="fas fa-thumbs-up"></i> ${p.st_vseckov || 0} podpore
            </div>
          </div>
        `);

        marker.on('mouseover', function() { this.openPopup(); });
        marker.on('mouseout', function() { this.closePopup(); });

        markerCluster.addLayer(marker); // ← NOVO
      });

      map.addLayer(markerCluster); // ← NOVO
    })
    .catch(err => console.error("Napaka pri nalaganju predlogov:", err));
});

// =================================================================
// NALAGANJE PREDLOGOV
// =================================================================

const vsebnikObdelava = document.getElementById('obdelava');
const vsebnikZakljuceno = document.getElementById('zakljuceno');

if (vsebnikObdelava || vsebnikZakljuceno) {
  fetch('/api/vsi-predlogi-uporabnikov')
    .then(res => res.json())
    .then(predlogi => {

      // Filtriranje: Status 2 v obdelavo, Status 3 v zaključeno
      const obdelava = predlogi.filter(p => parseInt(p.tk_status_pobudid_status_pobud) === 2);
      const zakljuceno = predlogi.filter(p => parseInt(p.tk_status_pobudid_status_pobud) === 3);

      // Izpis v "obdelava"
      if (vsebnikObdelava) {
        vsebnikObdelava.innerHTML = obdelava.length > 0 
          ? obdelava.map(p => generirajKarticoHTML(p, p.st_vseckov || 0)).join('') 
          : '<p>Ni predlogov v obdelavi.</p>';
      }

      // Izpis v "zakljuceno"
      if (vsebnikZakljuceno) {
        vsebnikZakljuceno.innerHTML = zakljuceno.length > 0 
          ? zakljuceno.map(p => generirajKarticoHTML(p, p.st_vseckov || 0)).join('') 
          : '<p>Ni zaključenih predlogov.</p>';
      }
    })
    .catch(err => console.error("Napaka pri nalaganju predlogov:", err));
}

function generirajKarticoHTML(predlog, vsecki) {
  let avtor = (parseInt(predlog.tk_uporabnikid_uporabnik) === 1) 
              ? "Mestna občina Maribor" 
              : `${predlog.avtor_ime || ''} ${predlog.avtor_priimek || ''}`.trim();

  return `
    <div class="kartica-predloga">
      <img src="${predlog.fotografija || 'slike/zacetna.jpg'}" class="slika-predloga">
      
      <div class="vsebina-besedila">
        <h6 class="fw-bold mb-0">${predlog.naslov}</h6>
        <small class="text-muted">${avtor}</small>
      </div>
      
      <div class="glasovanje-predloga" onclick="glasuj(${predlog.id_objava})">
        <i class="fas fa-thumbs-up"></i>
        <div class="small fw-bold">${vsecki}</div>
      </div>
    </div>
  `;
}
