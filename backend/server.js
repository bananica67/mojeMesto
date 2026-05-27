const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const app = express();
const WebSocket = require('ws');

// POVEZAVA Z BAZO
const pool = new Pool({
  user: "postgres",          
  host: "localhost",
  database: "moje_mesto",    
  password: "superVarnoGeslo",  
  port: 5432,
});

const wss = new WebSocket.Server({ port: 3001 });

console.log('WebSocket server is running on ws://localhost:3001');

wss.on('connection', (ws) => {
  console.log('Nov uporabnik se je povezal v klepet.');

  ws.on('message', async (message) => {
    try {
      const podatek = JSON.parse(message.toString());
      console.log('Prejeto sporočilo za bazo:', podatek);

      // 1. Shranimo sporočilo v bazo (vsebovati mora odKogaEmail, komuEmail in tekst)
      const insertQuery = `
        INSERT INTO Sporocilo (posiljatelj_email, prejemnik_email, vsebina, datum_vnos)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `;
      await pool.query(insertQuery, [podatek.odKogaEmail, podatek.komuEmail, podatek.tekst]);

      // 2. AVTOMATSKO BRISANJE: Pobrišemo vsa sporočila, starejša od 7 dni
      const deleteStaraQuery = `
        DELETE FROM Sporocilo 
        WHERE datum_vnos < NOW() - INTERVAL '7 days'
      `;
      await pool.query(deleteStaraQuery);

      // 3. Posredujemo sporočilo naprej vsem povezanim odjemalcem v realnem času
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(podatek));
        }
      });

    } catch (err) {
      console.error("Napaka pri obdelavi WebSocket sporočila:", err);
    }
  });

  ws.on('close', () => {
    console.log('Uporabnik je zapustil klepet.');
  });
});

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
app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});