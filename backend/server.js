const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const app = express();
const WebSocket = require('ws');
const http = require('http');

// POVEZAVA Z BAZO
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "moje_mesto",
  password: "superVarnoGeslo",
  port: 5432,
});

// Ustvarimo HTTP strežnik in WebSocket server na istem portu
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Spremljanje povezanih uporabnikov: Map<email, WebSocket>
const connectedUsers = new Map();

wss.on('connection', (ws) => {
  console.log('Nov uporabnik se je povezal v klepet.');

  ws.userEmail = null;

  ws.on('message', async (message) => {
    try {
      const podatek = JSON.parse(message.toString());
      console.log('Prejeto sporočilo:', podatek);

      // Shranimo pošiljateljev email za kasnejšo identifikacijo
      if (!ws.userEmail) {
        ws.userEmail = podatek.odKogaEmail;
        connectedUsers.set(podatek.odKogaEmail, ws);
      }

      // 1. Shranimo sporočilo v bazo
      const insertQuery = `
        INSERT INTO Sporocilo (posiljatelj_email, prejemnik_email, vsebina)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [podatek.odKogaEmail, podatek.komuEmail, podatek.tekst]);

      // 2. Posredujemo sporočilo SAMO pošiljatelju in prejemniku (zasebno sporočilo)
      const response = JSON.stringify(podatek);

      // Pošlji pošiljatelju
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(response);
      }

      // Pošlji prejemniku, če je povezan
      const recipientWs = connectedUsers.get(podatek.komuEmail);
      if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
        recipientWs.send(response);
      }

    } catch (err) {
      console.error("Napaka pri obdelavi WebSocket sporočila:", err);
    }
  });

  ws.on('close', () => {
    if (ws.userEmail) {
      connectedUsers.delete(ws.userEmail);
      console.log(`Uporabnik ${ws.userEmail} je zapustil klepet.`);
    }
  });
});

// --- POT ZA PRIKAZ ZGODOVINE KLEPETA ---
app.get('/api/zgodovina-klepeta', async (req, res) => {
    const { mojEmail, prejemnikEmail } = req.query;

    try {
        const queryText = `
            SELECT posiljatelj_email, prejemnik_email, vsebina, datum_vnos
            FROM Sporocilo
            WHERE (posiljatelj_email = $1 AND prejemnik_email = $2)
               OR (posiljatelj_email = $2 AND prejemnik_email = $1)
            ORDER BY datum_vnos ASC
        `;
        const rez = await pool.query(queryText, [mojEmail, prejemnikEmail]);
        return res.json(rez.rows);
    } catch (err) {
        console.error("Napaka pri pridobivanju zgodovine klepeta:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku.' });
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.resolve(__dirname, '../frontend')));

// --- POT ZA REGISTRACIJO ---
app.post('/registracija', async (req, res) => {
    // Strežnik tukaj prebere VSE podatke, ki jih pošlje tvoj HTML obrazec
    const { spol, ime, priimek, email, geslo, telefon, naslov, hisna_st, posta_kraj, datum_rojstva, opombe } = req.body;

    const vnosTelefon = telefon ? telefon : null;

    try {
        const queryText = `
            INSERT INTO Uporabnik (ime, priimek, geslo, telefon, email, datum_registracije)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
        `;
       
        await pool.query(queryText, [ime, priimek, geslo, vnosTelefon, email]);

        res.send(`
            <script>
                alert('Registracija uspešna! Zdaj se lahko prijavite.');
                window.location.href = 'http://localhost:3000/prijava.html';
            </script>
        `);
    //napaka v bazi //
    } catch (err) {
        console.error("Napaka pri registraciji:", err);
        res.status(500).send("Prišlo je do napake pri shranjevanju v bazo.");
    }
});

// --- POT ZA PRIJAVO (Prestavljeno nad listen!) ---
app.post('/prijava', async (req, res) => {
    const { email, geslo } = req.body;

    try {
        const userCheck = await pool.query('SELECT * FROM Uporabnik WHERE email = $1', [email]);

        if (userCheck.rows.length === 0) {
            // Vrnemo JSON z uspeh: false, da ga skripta prebere
            return res.json({ uspeh: false, sporocilo: 'Uporabnik s tem e-mailom ne obstaja!' });
        }

        const uporabnik = userCheck.rows[0];

        if (uporabnik.geslo !== geslo) {
            return res.json({ uspeh: false, sporocilo: 'Napačno geslo!' });
        }

        // === SPREMEMBA ZA ZNAČKE: SAMO PRILEPI TOLE SPODAJ ===
        const idUporabnika = uporabnik.id_uporabnik;

        // 1. Preštejemo vse objave uporabnika iz tvoje tabele Objava
        const preveriPredloge = await pool.query(
            'SELECT COUNT(*) FROM Objava WHERE TK_Uporabnikid_uporabnik = $1',
            [idUporabnika]
        );
        const steviloObjav = parseInt(preveriPredloge.rows[0].count);

        // ZNAČKA ID 1: "Iniciator" (Uporabnik ima vsaj 1 objavo)
        if (steviloObjav >= 1) {
            const imaPrvo = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE TK_Uporabnikid_član = $1 AND TK_Značkaid_znacka = 1', [idUporabnika]);
            if (imaPrvo.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, TK_Uporabnikid_član, TK_Značkaid_znacka) VALUES (CURRENT_DATE, $1, 1)', [idUporabnika]);
            }
        }

        // ZNAČKA ID 2: "Aktiven občan" (Uporabnik ima vsaj 3 objave)
        if (steviloObjav >= 3) {
            const imaDrugo = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE TK_Uporabnikid_član = $1 AND TK_Značkaid_znacka = 2', [idUporabnika]);
            if (imaDrugo.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, TK_Uporabnikid_član, TK_Značkaid_znacka) VALUES (CURRENT_DATE, $1, 2)', [idUporabnika]);
            }
        }

        // ZNAČKA ID 3: "Debatni mojster" (Uporabnik ima vsaj 5 komentarjev)
        const preveriKomentarje = await pool.query(
            'SELECT COUNT(*) FROM Komentar WHERE TK_Uporabnikid_uporabnik = $1',
            [idUporabnika]
        );
        if (parseInt(preveriKomentarje.rows[0].count) >= 5) {
            const imaTretjo = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE TK_Uporabnikid_član = $1 AND TK_Značkaid_znacka = 3', [idUporabnika]);
            if (imaTretjo.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, TK_Uporabnikid_član, TK_Značkaid_znacka) VALUES (CURRENT_DATE, $1, 3)', [idUporabnika]);
            }
        }
        // === KONEC SPREMEMBE ZA ZNAČKE ===

        return res.json({
            uspeh: true,
            ime: uporabnik.ime,
            priimek: uporabnik.priimek,
            email: uporabnik.email
        });
       
    } catch (err) {
        console.error("Napaka pri prijavi na strežniku:", err);
        return res.json({ uspeh: false, sporocilo: 'Prišlo je do napake na strežniku pri povezavi z bazo.' });
    }
});

// --- POT ZA PRIDOBIVANJE VSEH UPORABNIKOV ZA ADMINA ---
app.get('/api/vsi-uporabniki', async (req, res) => {
    try {
        // Iz baze poberemo ID, ime, priimek in email vseh registriranih uporabnikov
        const vsiUporabniki = await pool.query('SELECT id_uporabnik, ime, priimek, email FROM Uporabnik ORDER BY id_uporabnik ASC');
       
        return res.json(vsiUporabniki.rows);
    } catch (err) {
        console.error("Napaka pri pridobivanju uporabnikov:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku pri branju uporabnikov.' });
    }
});

// --- POT ZA PRIDOBIVANJE ZNAČK PRIJAVLJENEGA UPORABNIKA ---
app.get('/api/moje-znacke/:email', async (req, res) => {
    const { email } = req.params;

    try {
        // 1. Najprej poiščemo ID uporabnika preko e-maila (saj e-mail hranimo v localStorage)
        const userCheck = await pool.query('SELECT id_uporabnik FROM Uporabnik WHERE email = $1', [email]);
       
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ sporocilo: 'Uporabnik ne obstaja.' });
        }

        const idUporabnik = userCheck.rows[0].id_uporabnik;

        // 2. Izvedemo JOIN z natančnimi imeni stolpcev iz tvoje SQL skripte
        const znackeQuery = `
            SELECT z.naziv, z.opis
            FROM Značka z
            JOIN Uporabnik_Znacka uz ON z.id_znacka = uz.TK_Značkaid_znacka
            WHERE uz.TK_Uporabnikid_član = $1
        `;
       
        const rezZnacke = await pool.query(znackeQuery, [idUporabnik]);
        return res.json(rezZnacke.rows); // Vrnemo seznam značk (naziv, opis)

    } catch (err) {
        console.error("Napaka pri pridobivanju značk iz baze:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku.' });
    }
});

// Zagon strežnika je čisto na koncu datoteke
server.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
  console.log("WebSocket server deluje na ws://localhost:3000");
});