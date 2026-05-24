//PREDLOGI UPORABNIKOV

const zacetniPredlogi = [
  {
    id: 1,
    naslov: "Obupna cesta v Melju",
    opis: "A ste videli te luknje v Melju? Vsak dan se vozim tam v službo in samo čakam, kdaj mi bo odletela guma. Ko dežuje, se sploh ne vidi, kako globoke so.",
    slika: "slike/predlog_1.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Janja", besedilo: "Katastrofa je tam, res. Vsak dan cik-cak vozim." },
      { avtor: "Marko", besedilo: "Se strinjam." }
    ]
  },
  {
    id: 2,
    naslov: "Poplava na Smetanovi",
    opis: "Vsakič, ko malo bolj dežuje, se na Smetanovi pri FERI-ju naredi pravo jezero. Voda sploh ne odteka in stoji tam cel dan. Pešci ne moremo čez cesto.",
    slika: "slike/predlog_2.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Nik", besedilo: "Vem prav grozno je." },
      { avtor: "Ana", besedilo: "Pa vozit se je tam mimo tudi obupno, ko je tako." }
    ]
  }
];

//to shrani vse predloge v session storage, tude tote ki so ze dolocene
if (!sessionStorage.getItem('vsiPredlogi')) {
  sessionStorage.setItem('vsiPredlogi', JSON.stringify(zacetniPredlogi));
}

//PRIKAZ PREDLOGOV

const vsebnikPredlogov = document.getElementById('predlog-uporabnik');

if (vsebnikPredlogov) {
  //nalozimo vse podatke s session storage
  const predlogi = JSON.parse(sessionStorage.getItem('vsiPredlogi'));
  
  vsebnikPredlogov.innerHTML = '';

  //generiramo predloge za html
  predlogi.forEach(predlog => {
    
    //komentarji
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    //predlog, ki je bil prej v html
    const karticaHTML = `
      <div class="col-lg-6">
        <div class="card shadow predlog-card">
          <img src="${predlog.slika}" class="card-img-top predlog-img" alt="slika">
          <div class="card-body p-4">
            <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
            <p class="text-muted">${predlog.opis}</p>
            
            <div class="d-flex gap-3 my-4">
              <button class="btn btn-success glas-btn">
                <i class="fas fa-thumbs-up"></i>
              </button>
              <button class="btn btn-danger glas-btn">
                <i class="fas fa-thumbs-down"></i>
              </button>
            </div>
            
            <hr>
            
            <h5 class="fw-bold mb-3">Komentarji</h5>
            <div class="mb-3">
              ${komentarjiHTML}
            </div>
                            
            <textarea class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
            <button class="btn komentar-gumb fw-bold">Objavi komentar</button>
          </div>
        </div>
      </div>
    `;

    //predlog se s tem izpise v html
    vsebnikPredlogov.innerHTML += karticaHTML;
  });
}


//DODAJANJE PREDLOGOV - ZA UPORABNIKA

//zemljevid naredi marker in shrani lokacijo v session storage
const mapElement = document.getElementById('map');

if (mapElement) {
  const map = L.map('map').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let trenutniMarker = null;
  let izbraneKoordinate = null;

  map.on('click', function(e) {
    izbraneKoordinate = e.latlng;
    if (trenutniMarker) {
      trenutniMarker.setLatLng(izbraneKoordinate);
    } else {
      trenutniMarker = L.marker(izbraneKoordinate).addTo(map);
    }
  });
}

//to je za objavo na stran predloagi.html
const gumbObjavi = document.getElementById('gumb-objavi');

//prvo prebere vse kar je blo not napisano
if (gumbObjavi) {
  gumbObjavi.addEventListener('click', function() {
    const naslov = document.getElementById('naslov').value;
    const opis = document.getElementById('opis').value;
    const slikaInput = document.getElementById('slika');

    //preveri če sta izpolnjena naslov in opis
    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    //prebere kaj je ze v session storegu in da novemo predlogu id (npr. 3)
    const vsiPredlogi = JSON.parse(sessionStorage.getItem('vsiPredlogi')) || [];
    const novId = vsiPredlogi.length + 1;

     //če ne izbere slika se pokaže tota slika
    let slikaUrl = "slike/zacetna.jpg"; 

    //ustvarimo začasni Blob URL za sliko, ki jo objavimo
    if (slikaInputObcina && slikaInputObcina.files && slikaInputObcina.files[0]) {
      const izbranaDatoteka = slikaInputObcina.files[0];
      slikaUrl = URL.createObjectURL(izbranaDatoteka);
    }

    const novPredlog = {
      id: novId,
      naslov: naslov,
      opis: opis,
      slika: slikaUrl, 
      vsecki: 0,
      komentarji: [],
      lat: typeof izbraneKoordinate !== 'undefined' && izbraneKoordinate ? izbraneKoordinate.lat : null,
      lng: typeof izbraneKoordinate !== 'undefined' && izbraneKoordinate ? izbraneKoordinate.lng : null
    };

    //zgoraj predlog shranimo v session storage
    vsiPredlogi.push(novPredlog);
    sessionStorage.setItem('vsiPredlogi', JSON.stringify(vsiPredlogi));

    //ko kliknemo gumb nas da nazaj na stran predlogi.html
    window.location.href = "predlogi.html";
  });
}



//PREDLOGI OBCINE

const zacetniPredlogiObcine = [
  {
    id: 1,
    naslov: "Nova kolesarska pot",
    opis: "Občina načrtuje izgradnjo nove kolesarske poti med centrom mesta in mestnim parkom za večjo varnost kolesarjev.",
    slika: "slike/kolo.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Mitja", besedilo: "To bi zelo izboljšalo promet v centru." },
      { avtor: "Nina", besedilo: "Super ideja za bolj varno vožnjo s kolesom." }
    ]
  },
  {
    id: 2,
    naslov: "Prenova avtobusnih postaj",
    opis: "Predlagana je prenova avtobusnih postaj z novimi nadstreški, osvetlitvijo in digitalnimi prikazovalniki prihodov.",
    slika: "slike/avtobus.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Miha", besedilo: "Končno nekaj koristnega za javni prevoz." },
      { avtor: "Petra", besedilo: "Upam da pride tudi več avtobusov." }
    ]
  },
  {
    id: 3,
    naslov: "Boljša osvetlitev pešpoti",
    opis: "Uporabniki opozarjajo na slabo osvetljene poti ob robu mesta, kar zmanjšuje občutek varnosti v večernih urah.",
    slika: "slike/osvetlitev.jpg",
    vsecki: 0,
    komentarji: [
      { avtor: "Janez", besedilo: "Poti ob gozdu so res popolnoma v temi, nujno rabimo luči." },
      { avtor: "Maja", besedilo: "Se strinjam, pozimi je tam zelo neprijetno hoditi." }
    ]
  },
  {
    id: 4,
    naslov: "Ureditev mestnega parka",
    opis: "Potrebno bi bilo rednejše vzdrževanje klopi in namestitev dodatnih košev za odpadke v osrednjem parku.",
    slika: "slike/park.jpeg",
    vsecki: 0,
    komentarji: [
      { avtor: "Luka", besedilo: "Koši so čez vikend vedno polni, potrebujemo pogostejši odvoz." },
      { avtor: "Anja", besedilo: "Park je nujno potreben prenove, sploh klopi." }
    ]
  }
];

//to shrani vse predloge v session storage, tude tote ki so ze dolocene
if (!sessionStorage.getItem('vsiPredlogiObcine')) {
  sessionStorage.setItem('vsiPredlogiObcine', JSON.stringify(zacetniPredlogiObcine));
}

//PRIKAZ PREDLOGOV

const vsebnikObcina = document.getElementById('predlogi-obcina');

if (vsebnikObcina) {
  //nalozimo vse podatke s session storage
  const predlogi = JSON.parse(sessionStorage.getItem('vsiPredlogiObcine'));
  
  vsebnikObcina.innerHTML = '';

  //generiramo predloge za html
  predlogi.forEach(predlog => {
    
    //komentarji    
    let komentarjiHTML = '';
    predlog.komentarji.forEach(kom => {
      komentarjiHTML += `<div class="komentar"><strong>${kom.avtor}:</strong> ${kom.besedilo}</div>`;
    });

    //predlog, ki je bil prej v html
    const karticaHTML = `
      <div class="col-lg-6">
        <div class="card shadow predlog-card">
          <img src="${predlog.slika}" class="card-img-top predlog-img" alt="slika">
          <div class="card-body p-4">
            <h3 class="fw-bold mb-3">${predlog.naslov}</h3>
            <p class="text-muted">${predlog.opis}</p>
            
            <div class="d-flex gap-3 my-4">
              <button class="btn btn-success glas-btn">
                <i class="fas fa-thumbs-up"></i>
              </button>
              <button class="btn btn-danger glas-btn">
                <i class="fas fa-thumbs-down"></i>
              </button>
            </div>
            
            <hr>
            
            <h5 class="fw-bold mb-3">Komentarji</h5>
            <div class="mb-3">
              ${komentarjiHTML}
            </div>
                            
            <textarea class="form-control comment-box mb-3" rows="3" placeholder="Dodaj komentar..."></textarea>
            <button class="btn komentar-gumb fw-bold">Objavi komentar</button>
          </div>
        </div>
      </div>
    `;

    //predlog se s tem izpise v html
    vsebnikObcina.innerHTML += karticaHTML;
  });
}

//DODAJANJE PREDLOGOV - ZA OBCINO

//zemljevid naredi marker in shrani lokacijo v session storage
const mapElementObcina = document.getElementById('map-obcina');
let izbraneKoordinateObcina = null;

if (mapElementObcina) {
  const mapObcina = L.map('map-obcina').setView([46.5547, 15.6459], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapObcina);

  let trenutniMarkerObcina = null;

  mapObcina.on('click', function(e) {
    izbraneKoordinateObcina = e.latlng;
    if (trenutniMarkerObcina) {
      trenutniMarkerObcina.setLatLng(izbraneKoordinateObcina);
    } else {
      trenutniMarkerObcina = L.marker(izbraneKoordinateObcina).addTo(mapObcina);
    }
  });
}

//to je za objavo na stran predloagi.html
const gumbObjaviObcina = document.getElementById('gumb-objavi-obcina');

//prvo prebere vse kar je blo not napisano
if (gumbObjaviObcina) {
  gumbObjaviObcina.addEventListener('click', function() {
    const naslov = document.getElementById('naslov-obcina').value;
    const opis = document.getElementById('opis-obcina').value;
    const slikaInputObcina = document.getElementById('slika-obcina');

    //preveri če sta izpolnjena naslov in opis
    if (!naslov || !opis) {
      alert("Prosim, izpolnite naslov in opis problema.");
      return;
    }

    //prebere kaj je ze v session storegu in da novemo predlogu id (npr. 3)
    const vsiPredlogiObcine = JSON.parse(sessionStorage.getItem('vsiPredlogiObcine')) || [];
    const novId = vsiPredlogiObcine.length + 1;

     //če ne izbere slika se pokaže tota slika
    let slikaUrl = "slike/zacetna.jpg"; 

    //ustvarimo začasni Blob URL za sliko, ki jo objavimo
    if (slikaInputObcina && slikaInputObcina.files && slikaInputObcina.files[0]) {
      const izbranaDatoteka = slikaInputObcina.files[0];
      slikaUrl = URL.createObjectURL(izbranaDatoteka);
    }

    const novPredlogObcine = {
      id: novId,
      naslov: naslov,
      opis: opis,
      slika: slikaUrl, 
      vsecki: 0,
      komentarji: [],
      lat: izbraneKoordinateObcina ? izbraneKoordinateObcina.lat : null,
      lng: izbraneKoordinateObcina ? izbraneKoordinateObcina.lng : null
    };

    //zgoraj predlog shranimo v session storage
    vsiPredlogiObcine.push(novPredlogObcine);
    sessionStorage.setItem('vsiPredlogiObcine', JSON.stringify(vsiPredlogiObcine));

    //ko kliknemo gumb nas da nazaj na stran predlogi.html
    window.location.reload();
  });
}
