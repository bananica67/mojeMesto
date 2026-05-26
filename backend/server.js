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

// 3. Povezava na PostgreSQL bazo (Uporabljena konfiguracija za 'moje_mesto')
const pool = new Pool({
  user: 'postgres',         
  host: 'localhost',
  database: 'moje_mesto',          
  password: 'superVarnoGeslo',      
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

// 6. API pot za odjava
app.get("/api/odjava", (req, res) => {
  req.session.destroy();
  res.redirect("/prijava.html");
});

// API pot za registracijo uporabnika (Uskajeno s tvojo SQL skripto)
app.post("/registracija", async (req, res) => {
  // Iz obrazca poberemo vse podatke, ki jih pošlje HTML
  const { ime, priimek, email, geslo, telefon } = req.body;

  try {
    // 1. Preverimo, če uporabnik s tem e-mailom že obstaja
    const obstajaUporabnik = await pool.query("SELECT * FROM Uporabnik WHERE email = $1", [email]);
    if (obstajaUporabnik.rows.length > 0) {
      return res.status(400).send("Uporabnik s tem e-mail naslovom je že registriran!");
    }

    // 2. Ustvarimo trenutni datum za polje 'datum_registracije' (zahtevano v SQL kot NOT NULL)
    const trenutniDatum = new Date();

    // 3. Vstavljanje v bazo - uporabimo točna imena stolpcev iz tvoje SQL skripte
    const vstavljanjeQuery = `
      INSERT INTO Uporabnik (ime, priimek, email, geslo, telefon, datum_registracije)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    // Če telefon ni bil vpisan, pošljemo null (saj si z ALTER TABLE umaknila NOT NULL)
    const telVnos = telefon === "" ? null : telefon;

    await pool.query(vstavljanjeQuery, [ime, priimek, email, geslo, telVnos, trenutniDatum]);

    // 4. Po uspešni registraciji uporabnika preusmerimo na prijavno stran
    res.redirect("/prijava.html");

  } catch (napaka) {
    console.error("Napaka pri registraciji:", napaka);
    res.status(500).send("Prišlo je do napake na strežniku pri registraciji.");
  }
});

app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});