const { Pool } = require("pg");

const pool = new Pool({
  user: 'postgres',           // Tvoj PostgreSQL uporabnik (ponavadi 'postgres')
  host: 'localhost',          // Ker baza teče na tvojem računalniku
  database: 'mojeMesto',      // Točno ime baze, ki si jo ustvarila v pgAdminu
  password: 'tvoje_geslo_za_pgadmin', // Geslo, ki ga vpišeš ob zagonu pgAdmina
  port: 5432,                 // Standardni port za Postgres
});

const express = require("express");
const { Pool } = require("pg");
const session = require("express-session");
const path = require("path");

const app = express();

// 1. Nastavitev seje (da si strežnik zapomni, kdo je prijavljen)
app.use(session({
  secret: 'skrivni-kljuc-moje-mesto',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // Seja velja 1 dan
}));

// 2. Podpora za branje podatkov iz obrazcev (JSON in URL-encoded)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Povezava na PostgreSQL bazo (podatki iz tvoje skripte moje_mesto.sql)
const pool = new Pool({
  user: 'uporabnik_vloga',         // Vloga iz tvoje SQL skripte
  host: 'localhost',
  database: 'moje_mesto',          // Ime baze iz tvoje SQL skripte
  password: 'obcan_bralec_1',      // Geslo iz tvoje SQL skripte
  port: 5432,
});

// Statične datoteke (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../frontend")));

// 4. API pot za prijavo
app.post("/api/prijava", async (req, res) => {
  const { email, geslo } = req.body;

  try {
    // Iskanje uporabnika v bazi po e-mailu
    const userQuery = await pool.query("SELECT * FROM Uporabnik WHERE email = $1", [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ uspeh: false, sporocilo: "Uporabnik ne obstaja!" });
    }

    const uporabnik = userQuery.rows[0];

    // Preverjanje gesla (direktna primerjava nizov, kot je v bazi)
    if (uporabnik.geslo !== geslo) {
      return res.status(401).json({ uspeh: false, sporocilo: "Napačno geslo!" });
    }

    // Če sta e-mail in geslo pravilna, shranimo uporabnika v sejo
    req.session.userId = uporabnik.id_uporabnik;
    req.session.ime = uporabnik.ime;
    req.session.priimek = uporabnik.priimek;
    req.session.email = uporabnik.email;

    // Vrnem uspeh
    return res.json({ uspeh: true, sporocilo: "Prijava uspešna!" });

  } catch (napaka) {
    console.error("Napaka pri prijavi:", napaka);
    return res.status(500).json({ uspeh: false, sporocilo: "Napaka na strežniku." });
  }
});

// 5. API pot za pridobivanje podatkov o trenutno prijavljenem uporabniku (za profil.html)
app.get("/api/trenutni-uporabnik", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ prijavljen: false });
  }
  res.json({
    prijavljen: true,
    ime: req.session.ime,
    priimek: req.session.priimek,
    email: req.session.email
  });
});

// 6. API pot za odjavo
app.get("/api/odjava", (req, res) => {
  req.session.destroy();
  res.redirect("/prijava.html");
});

app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});