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
