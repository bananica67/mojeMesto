const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const app = express();

// POVEZAVA Z BAZO
const pool = new Pool({
  user: "postgres",          
  host: "localhost",
  database: "moje_mesto",    
  password: "superVarnoGeslo",  
  port: 5432,
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.resolve(__dirname, '../frontend')));

// --- POT ZA REGISTRACIJO ---
app.post('/registracija', async (req, res) => {
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
    } catch (err) {
        console.error("Napaka pri registraciji:", err);
        res.status(500).send("Prišlo je do napake pri shranjevanju v bazo.");
    }
});

// --- POT ZA PRIJAVO ---
app.post('/prijava', async (req, res) => {
    const { email, geslo } = req.body;

    try {
        const userCheck = await pool.query('SELECT * FROM Uporabnik WHERE email = $1', [email]);

        if (userCheck.rows.length === 0) {
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
        console.error("Napaka pri prijava na strežniku:", err);
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

// --- POT ZA PRIDOBIVANJE VSEH PREDLOGOV ZA ADMINA ---
app.get('/api/vsi-predlogi', async (req, res) => {
    try {
        const vsiPredlogi = await pool.query('SELECT * FROM Objava ORDER BY id_objava ASC');
        return res.json(vsiPredlogi.rows);
    } catch (err) {
        console.error("Napaka pri branju objav:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku pri branju objav.' });
    }
});

// --- POT ZA POSODABLJANJE STATUSA PREDLOGA ---
app.post('/api/posodobi-status', async (req, res) => {
    const { id_objava, nov_status_id } = req.body;
    try {
        await pool.query(
            'UPDATE Objava SET tk_status_pobudid_status_pobud = $1 WHERE id_objava = $2', 
            [parseInt(nov_status_id), parseInt(id_objava)]
        );
        return res.json({ uspeh: true });
    } catch (err) {
        console.error("Napaka pri posodabljanju statusa:", err);
        return res.status(500).json({ uspeh: false });
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

// Zagon strežnika
app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});