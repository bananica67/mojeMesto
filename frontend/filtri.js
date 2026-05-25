// FILTER ZA UPORABNIKE

const filterUporabnik = document.getElementById("filter-uporabnik");

if (filterUporabnik) {

  filterUporabnik.addEventListener("change", function () {

    let predlogi = JSON.parse(sessionStorage.getItem("vsiPredlogi")) || [];

    if (this.value === "najnovejsi") {

      predlogi.sort((a, b) => b.datum - a.datum);

    }

    else if (this.value === "najstarejsi") {

      predlogi.sort((a, b) => a.datum - b.datum);

    }

    else if (this.value === "vsecki") {

      predlogi.sort((a, b) => b.vsecki - a.vsecki);

    }

    prikaziPredlogeUporabnik(predlogi);

  });

}



// FILTER ZA OBCINO

const filterObcina = document.getElementById("filter-obcina");

if (filterObcina) {

  filterObcina.addEventListener("change", function () {

    let predlogi = JSON.parse(sessionStorage.getItem("vsiPredlogiObcine")) || [];

    if (this.value === "najnovejsi") {

      predlogi.sort((a, b) => b.datum - a.datum);

    }

    else if (this.value === "najstarejsi") {

      predlogi.sort((a, b) => a.datum - b.datum);

    }

    else if (this.value === "vsecki") {

      predlogi.sort((a, b) => b.vsecki - a.vsecki);

    }

    prikaziPredlogeObcina(predlogi);

  });

}