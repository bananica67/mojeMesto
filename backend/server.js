const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const app = express();



// =================================================================
// POVEZAVA Z BAZO
// =================================================================

const pool = new Pool({
  user: "postgres",          
  host: "localhost",
  database: "moje_mesto",    
  password: "superVarnoGeslo",  
  port: 5432,
});

app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.resolve(__dirname, '../frontend')));



// =================================================================
// REGISTRACIJA
// =================================================================

app.post('/registracija', async (req, res) => {
    const { ime, priimek, email, geslo, telefon } = req.body;
    const vnosTelefon = telefon ? telefon : null;

    try {
        // KOMENTAR: Vsi ključi in tabele so v malih črkah (tk_tip_uporabnikaid_tip_uporabnika)
        const queryText = `
            INSERT INTO uporabnik (ime, priimek, geslo, telefon, email, datum_registracije, tk_tip_uporabnikaid_tip_uporabnika)
            VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, 2)
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



// =================================================================
// PRIJAVA
// =================================================================

app.post('/prijava', async (req, res) => {
    const { email, geslo } = req.body;

    try {
        // KOMENTAR: Preverjanje uporabnika z malimi črkami tabel
        const userCheck = await pool.query('SELECT * FROM uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.json({ uspeh: false, sporocilo: 'Uporabnik s tem e-mailom ne obstaja!' });
        }
        
        const uporabnik = userCheck.rows[0];
        if (uporabnik.geslo !== geslo) {
            return res.json({ uspeh: false, sporocilo: 'Napačno geslo!' });
        }

        return res.json({
            uspeh: true,
            id_uporabnik: uporabnik.id_uporabnik,
            ime: uporabnik.ime,
            priimek: uporabnik.priimek,
            email: uporabnik.email,
            tip_uporabnika: parseInt(uporabnik.tk_tip_uporabnikaid_tip_uporabnika)
        });
        
    } catch (err) {
        console.error("Napaka pri prijava na strežniku:", err);
        return res.json({ uspeh: false, sporocilo: 'Prišlo je do napake na strežniku.' });
    }
});



// =================================================================
// SEZNAM VSEH UPORABNIKOV ZA ADMINA
// =================================================================

app.get('/api/vsi-uporabniki', async (req, res) => {
    try {
        const vsiUporabniki = await pool.query('SELECT id_uporabnik, ime, priimek, email, tk_tip_uporabnikaid_tip_uporabnika FROM uporabnik ORDER BY id_uporabnik ASC');
        return res.json(vsiUporabniki.rows);
    } catch (err) {
        console.error("Napaka pri pridobivanju uporabnikov:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku.' });
    }
});



// =================================================================
// SPREMINJANJE VLOGE UPORABNIKA
// =================================================================

app.post('/api/posodobi-vlogo', async (req, res) => {
    const { id_uporabnik, nov_vloga_id } = req.body; 
    try {
        await pool.query(
            'UPDATE uporabnik SET tk_tip_uporabnikaid_tip_uporabnika = $1 WHERE id_uporabnik = $2', 
            [parseInt(nov_vloga_id), parseInt(id_uporabnik)]
        );
        return res.json({ uspeh: true });
    } catch (err) {
        console.error("Napaka pri posodabljanju vloge:", err);
        return res.status(500).json({ uspeh: false });
    }
});



// =================================================================
// SEZNAM VSEH PREDLOGOV ZA ADMINA
// =================================================================

app.get('/api/vsi-predlogi', async (req, res) => {
    try {
        //Dodan LEFT JOIN z uporabnikom, da admin dobi mail avtorja
        const vsiPredlogi = await pool.query(`
            SELECT o.*, u.email AS avtor_email 
            FROM objava o
            LEFT JOIN uporabnik u ON o.tk_uporabnikid_uporabnik = u.id_uporabnik
            ORDER BY o.id_objava ASC
        `);
        return res.json(vsiPredlogi.rows);
    } catch (err) {
        console.error("Napaka pri branju objav:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku.' });
    }
});



// =================================================================
// POSODABLJANJE STATUSA PREDLOGA
// =================================================================

app.post('/api/posodobi-status', async (req, res) => {
    const { id_objava, nov_status_id } = req.body;
    try {
        await pool.query(
            'UPDATE objava SET tk_status_pobudid_status_pobud = $1 WHERE id_objava = $2', 
            [parseInt(nov_status_id), parseInt(id_objava)]
        );
        return res.json({ uspeh: true });
    } catch (err) {
        console.error("Napaka pri posodabljanju statusa:", err);
        return res.status(500).json({ uspeh: false });
    }
});



// =================================================================
// PRIDOBIVANJE PREDLOGOV
// =================================================================

app.get('/api/vsi-predlogi-uporabnikov', async (req, res) => {
    try {
        // Potegnemo še ime in priimek avtorja ter tk_status_pobudid_status_pobud
        const objaveRez = await pool.query(`
            SELECT o.id_objava, o.naslov, o.opis, o.fotografija, o.st_vseckov, 
                   o.tk_uporabnikid_uporabnik, o.tk_status_pobudid_status_pobud,
                   u.ime AS avtor_ime, u.priimek AS avtor_priimek
            FROM objava o
            LEFT JOIN uporabnik u ON o.tk_uporabnikid_uporabnik = u.id_uporabnik
            WHERE o.tip_objave = 'Predlog'
            ORDER BY o.id_objava DESC
        `);
        const predlogi = objaveRez.rows;

        for (let predlog of predlogi) {
            const komRez = await pool.query(`
                SELECT u.ime AS avtor, k.vsebina AS besedilo
                FROM komentar k
                JOIN uporabnik u ON k.tk_uporabnikid_uporabnik = u.id_uporabnik
                WHERE k.tk_objavaid_objava = $1
                ORDER BY k.id_komentar ASC
            `, [predlog.id_objava]);
            predlog.komentarji = komRez.rows;
        }
        return res.json(predlogi);
    } catch (err) {
        console.error("Napaka pri branju predlogov iz baze:", err);
        return res.status(500).json([]);
    }
});



// =================================================================
// DODAJANJE NOVEGA KOMENTARJA
// =================================================================

app.post('/api/dodaj-komentar', async (req, res) => {
    const { vsebina, idObjaves, email } = req.body;
    const idZaObjavo = idObjaves || req.body.idObjave;

    try {
        const userCheck = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.json({ uspeh: false, sporocilo: 'Uporabnik ne obstaja.' });
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        const vnosKomentarjaQuery = `
            INSERT INTO komentar (vsebina, datum_ure_oddaje, tk_uporabnikid_uporabnik, tk_objavaid_objava)
            VALUES ($1, CURRENT_DATE, $2, $3)
        `;
        await pool.query(vnosKomentarjaQuery, [vsebina, idUporabnika, idZaObjavo]);
        return res.json({ uspeh: true, sporocilo: 'Komentar uspešno dodan!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ uspeh: false, sporocilo: 'Napaka na strežniku.' });
    }
});



// =================================================================
// ODDAJA NOVEGA PREDLOGA
// =================================================================

app.post('/api/dodaj-predlog', async (req, res) => {
    const { naslov, opis, email, fotografija } = req.body;

    if (!naslov || !opis || !email) {
        return res.json({ uspeh: false, sporocilo: "Manjkajoči podatki!" });
    }

    try {
        const userCheck = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.json({ uspeh: false, sporocilo: `Uporabnik ne obstaja.` });
        }
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        // KOMENTAR: Če objavlja admin (Občina Maribor, ID=1), dobi status "V obravnavi" (ID=2), sicer pa "Oddano" (ID=1)
        let statusId = 1; 
        if (parseInt(idUporabnika) === 1) {
            statusId = 2; // V obravnavi
        }

        const odlocanjeRes = await pool.query("SELECT id_tip_odlocanja FROM tip_odlocanja WHERE naziv = 'Prijava težav v lokalnem okolju' LIMIT 1");
        const odlocanjeId = odlocanjeRes.rows[0].id_tip_odlocanja;

        const vnosObjaveQuery = `
            INSERT INTO objava (
                naslov, opis, lokacija, fotografija, datum_objave, tip_objave, st_vseckov, 
                tk_uporabnikid_uporabnik, tk_tip_odlocanjaid_tip_odlocanja, tk_status_pobudid_status_pobud
            )
            VALUES ($1, $2, '46.5547, 15.6459', $3, CURRENT_DATE, 'Predlog', 0, $4, $5, $6)
        `;
        
        await pool.query(vnosObjaveQuery, [
            naslov, 
            opis, 
            fotografija || 'slike/zacetna.jpg', 
            idUporabnika, 
            odlocanjeId, 
            statusId
        ]);

        // Vrnemo informacijo, ali je objavila občina, da frontend ve kam preusmeriti
        return res.json({
            uspeh: true,
            jeObcina: parseInt(idUporabnika) === 1,
            sporocilo: "Predlog je bil uspešno oddan!"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ uspeh: false, sporocilo: "Napaka na strežniku: " + err.message });
    }
});



// =================================================================
// VŠEČKI
// =================================================================

app.post('/api/posodobi-vsecke', async (req, res) => {
    const { id_objava } = req.body;
    try {
        // Posodobimo število všečkov v bazi za določeno objavo
        const rezultat = await pool.query(
            'UPDATE objava SET st_vseckov = COALESCE(st_vseckov, 0) + 1 WHERE id_objava = $1 RETURNING st_vseckov',
            [parseInt(id_objava)]
        );
        
        return res.json({ uspeh: true, novi_vsecki: rezultat.rows[0].st_vseckov });
    } catch (err) {
        console.error("Napaka pri posodabljanju všečkov na strežniku:", err);
        return res.status(500).json({ uspeh: false });
    }
});



// =================================================================
// ZNAČKE
// =================================================================

app.get('/api/moje-znacke/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const userCheck = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.status(404).json({ sporocilo: 'Uporabnik ne obstaja.' });
        const idUporabnik = userCheck.rows[0].id_uporabnik;

        const znackeQuery = `
            SELECT z.naziv, z.opis
            FROM značka z
            JOIN uporabnik_znacka uz ON z.id_znacka = uz.tk_značkaid_znacka
            WHERE uz.tk_uporabnikid_član = $1
        `;
        const rezZnacke = await pool.query(znackeQuery, [idUporabnik]);
        return res.json(rezZnacke.rows);
    } catch (err) {
        return res.status(500).json({ sporocilo: 'Napaka na strežniku.' });
    }
});



app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});
