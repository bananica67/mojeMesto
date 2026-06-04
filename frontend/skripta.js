// =================================================================
// SKRIPT ZA ZEMLJEVID IN SPLOŠNE FUNKCIJE STRANI
// =================================================================

const mapElement = document.getElementById('map');

if (mapElement) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);
  //to je da je nastavleno na maribor

  //to je da se tiles naložijo not
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

//za odjavo, potem zbriše id ven iz local storaga, das elahko drugi prijavi
function odjaviUporabnika() {
    localStorage.clear();
    alert('Odjava uspešna.');
    window.location.href = 'prijava.html';
}



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
        <small class="text-muted">Avtor: ${avtor}</small>
      </div>
      
      <div class="glasovanje-predloga" onclick="glasuj(${predlog.id_objava})">
        <i class="fas fa-thumbs-up"></i>
        <div class="small fw-bold">${vsecki}</div>
      </div>
    </div>
  `;
}
