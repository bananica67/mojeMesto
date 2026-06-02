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

// =================================================================
// POTI ZA UPORABNIKE (PRIJAVA, REGISTRACIJA, ADMIN, ZNAČKE)
// =================================================================

app.post('/registracija', async (req, res) => {
    const { ime, priimek, email, geslo, telefon } = req.body;
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

        return res.json({
            uspeh: true,
            ime: uporabnik.ime,
            priimek: uporabnik.priimek,
            email: uporabnik.email
        });
    } catch (err) {
        console.error("Napaka pri prijavi:", err);
        return res.json({ uspeh: false, sporocilo: 'Prišlo je do napake na strežniku.' });
    }
});

app.get('/api/vsi-uporabniki', async (req, res) => {
    try {
        const vsiUporabniki = await pool.query('SELECT id_uporabnik, ime, priimek, email FROM Uporabnik ORDER BY id_uporabnik ASC');
        return res.json(vsiUporabniki.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ sporocilo: 'Napaka pri branju uporabnikov.' });
    }
});
//nova koda za prikaz značk
// Pot za pridobitev vseh značk (katalog značk)
app.get('/api/vse-znacke', async (req, res) => {
    try {
        const rez = await pool.query('SELECT * FROM značka');
        res.json(rez.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ sporocilo: 'Napaka pri branju značk.' });
    }
});

app.get('/api/moje-znacke/:email', async (req, res) => {
    const email = req.params.email;
    try {
        // Ta poizvedba pridobi vse značke za prijavljenega uporabnika
        const query = `
            SELECT z.naziv, z.opis 
            FROM značka z
            JOIN uporabnik_znacka uz ON z.id_znacka = uz.tk_značkaid_znacka
            JOIN uporabnik u ON uz.tk_uporabnikid_član = u.id_uporabnik
            WHERE u.email = $1`;
        
        const result = await pool.query(query, [email]);
        res.json(result.rows); //  v obliki JSON
    } catch (err) {
        console.error("Napaka pri pridobivanju značk:", err);
        res.status(500).json({ error: "Napaka na strežniku" });
    }
});

//takoj daj nazaj če ne dela
/*app.get('/api/moje-znacke/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const userCheck = await pool.query('SELECT id_uporabnik FROM Uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.json([]);

        const idUporabnik = userCheck.rows[0].id_uporabnik;
        const znackeQuery = `
            SELECT z.naziv, z.opis 
            FROM Značka z
            JOIN Uporabnik_Znacka uz ON z.id_znacka = uz.tk_značkaid_znacka
            WHERE uz.tk_uporabnikid_član = $1
        `;
        const rezZnacke = await pool.query(znackeQuery, [idUporabnik]);
        return res.json(rezZnacke.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json([]);
    }
});
*/



// =================================================================
// POTI ZA PREDLOGE IN KOMENTARJE (BAZA)
// =================================================================

// 1. Pridobivanje vseh predlogov in njihovih komentarjev
app.get('/api/vsi-predlogi-uporabnikov', async (req, res) => {
    try {
        const objaveRez = await pool.query(`
            SELECT id_objava AS id, naslov, opis, fotografija 
            FROM objava 
            WHERE tip_objave = 'Predlog'
            ORDER BY id_objava DESC
        `);
        const predlogi = objaveRez.rows;

        for (let predlog of predlogi) {
            const komRez = await pool.query(`
                SELECT u.ime AS avtor, k.vsebina AS besedilo 
                FROM komentar k
                JOIN uporabnik u ON k.tk_uporabnikid_uporabnik = u.id_uporabnik
                WHERE k.tk_objavaid_objava = $1
                ORDER BY k.id_komentar ASC
            `, [predlog.id]);
            predlog.komentarji = komRez.rows;
        }
        return res.json(predlogi);
    } catch (err) {
        console.error("Napaka pri branju predlogov iz baze:", err);
        return res.status(500).json([]);
    }
});
app.post('/api/dodaj-komentar', async (req, res) => {
    const { vsebina, idObjaves, email } = req.body; // idObjaves preberemo iz bodyja (ujemanje s frontendom)
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



app.post('/api/dodaj-predlog', async (req, res) => {
    const { naslov, opis, email, fotografija } = req.body;
    if (!naslov || !opis || !email) return res.status(400).json({ uspeh: false });

    try {
        // 1. Poišči uporabnika
        const userCheck = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) return res.status(404).json({ uspeh: false, sporocilo: "Uporabnik ne obstaja" });
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        // 2. Poišči ID-je za status in tip
        const statusRes = await pool.query("SELECT id_status_pobud FROM status_pobud WHERE naziv = 'Oddano' LIMIT 1");
        const odlocanjeRes = await pool.query("SELECT id_tip_odlocanja FROM tip_odlocanja WHERE naziv = 'Glasovanje' LIMIT 1");
        
        const statusId = statusRes.rows[0].id_status_pobud;
        const odlocanjeId = odlocanjeRes.rows[0].id_tip_odlocanja;

        // 3. Vstavi objavo
        const vnosObjaveQuery = `
            INSERT INTO objava (naslov, opis, lokacija, fotografija, datum_objave, 
                                tip_objave, tk_uporabnikid_uporabnik, tk_tip_odlocanjaid_tip_odlocanja, tk_status_pobudid_status_pobud) 
            VALUES ($1, $2, 'Maribor', $3, CURRENT_DATE, 'Predlog', $4, $5, $6)
        `;
        await pool.query(vnosObjaveQuery, [naslov, opis, fotografija, idUporabnika, odlocanjeId, statusId]);

        // 4. LOGIKA ZA ZNAČKO (dinamično preverjanje)
        let imeNoveZnacke = null;
        const countRes = await pool.query('SELECT COUNT(*) FROM objava WHERE tk_uporabnikid_uporabnik = $1', [idUporabnika]);
        const stObjav = parseInt(countRes.rows[0].count);
        
// Preveri mejnik za "Idejni vodja" (ID 1)
        if (stObjav === 1) {
            const znackaRes = await pool.query("SELECT id_znacka FROM značka WHERE naziv = 'Idejni vodja' LIMIT 1");
            if (znackaRes.rows.length > 0) {
                const idZnacke = znackaRes.rows[0].id_znacka;
                await pool.query(
                    'INSERT INTO uporabnik_znacka (tk_uporabnikid_član, tk_značkaid_znacka, datum_prejetja) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING',
                    [idUporabnika, idZnacke]
                );
                imeNoveZnacke = "Idejni vodja";
            }
        }

        // 5. VRNI USPEŠEN ODGOVOR
        return res.json({ 
            uspeh: true, 
            sporocilo: "Predlog je bil uspešno oddan!", 
            novaZnacka: imeNoveZnacke 
        });

    } catch (err) {
        console.error("Napaka pri dodajanju predloga:", err);
        return res.status(500).json({ uspeh: false, sporocilo: "Prišlo je do napake." });
    }
});


// 2. Dodajanje novega predloga v bazo z logiko za značke
/*app.post('/api/dodaj-predlog', async (req, res) => {
    const { naslov, opis, email, fotografija } = req.body;
    if (!naslov || !opis || !email) return res.status(400).json({ uspeh: false });

    try {
        // 1. Poišči uporabnika
        const userCheck = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        // 2. Dinamično poišči ID-je (namesto ročnega vpisovanja 2, 2)
        const statusRes = await pool.query("SELECT id_status_pobud FROM status_pobud WHERE naziv = 'Oddano' LIMIT 1");
        const odlocanjeRes = await pool.query("SELECT id_tip_odlocanja FROM tip_odlocanja WHERE naziv = 'Glasovanje' LIMIT 1");
        
        const statusId = statusRes.rows[0].id_status_pobud;
        const odlocanjeId = odlocanjeRes.rows[0].id_tip_odlocanja;

        // 3. Vstavi objavo s pridobljenimi ID-ji
        const vnosObjaveQuery = `
            INSERT INTO objava (naslov, opis, lokacija, fotografija, datum_objave, 
                                tip_objave, tk_uporabnikid_uporabnik, tk_tip_odlocanjaid_tip_odlocanja, tk_status_pobudid_status_pobud) 
            VALUES ($1, $2, 'Maribor', $3, CURRENT_DATE, 'Predlog', $4, $5, $6)
        `;
        await pool.query(vnosObjaveQuery, [naslov, opis, fotografija, idUporabnika, odlocanjeId, statusId]);


        // --- LOGIKA ZA VSE ZNAČKE ---
        let imeNoveZnacke = null;
        const countRes = await pool.query('SELECT COUNT(*) FROM objava WHERE tk_uporabnikid_uporabnik = $1', [idUporabnika]);
        const stObjav = parseInt(countRes.rows[0].count);

        let znackaId = null;

        // Določi ID značke glede na mejnik (prilagodi ID-je, če so v bazi drugačni!)
        if (stObjav === 1) { 
            imeNoveZnacke = 'Idejni vodja'; 
            znackaId = 1; 
        } else if (stObjav === 5) { 
            imeNoveZnacke = 'Glas skupnosti'; 
            znackaId = 3; 
        } else if (stObjav === 10) { 
            imeNoveZnacke = 'Aktivni občan'; 
            znackaId = 4; 
        } else if (stObjav === 20) { 
            imeNoveZnacke = 'Steber skupnosti'; 
            znackaId = 5; 
        }

        // Če je bil dosežen mejnik, vpiši v bazo
        if (znackaId) {
            await pool.query(
                'INSERT INTO uporabnik_znacka (tk_uporabnikid_član, tk_značkaid_znacka, datum_prejetja) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING',
                [idUporabnika, znackaId]
            );
        }

        return res.json({ uspeh: true, sporocilo: "Predlog je bil uspešno oddan!" });
    } catch (err) {
        console.error(err);
        // TUKAJ dodaš sporočilo za napako:
        return res.status(500).json({ uspeh: false, sporocilo: "Prišlo je do napake pri shranjevanju predloga." });
    }
});
*/


// 3. Dodajanje komentarja v bazo
/*app.post('/api/dodaj-komentar', async (req, res) => {
    const { vsebina, idObjaves, email } = req.body; // idObjaves preberemo iz bodyja (ujemanje s frontendom)
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
*/



// Zagon strežnika
app.listen(3000, () => {
  console.log("Strežnik laufa na portu 3000...");
});


/*
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
// --- POT ZA PRIJAVO ---
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
        // ID uporabnika preko e-maila 
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
// --- POT ZA POSODOBITEV VLOGE UPORABNIKA (ADMIN) ---
app.put('/api/uporabniki/:id/vloga', async (req, res) => {
    const idUporabnika = req.params.id;
    const { vloga } = req.body; // Prejmemo novo vlogo ("obcan", "obcina", "admin")

    try {
        // POSODOBLJENO: Posodobimo stolpec 'vloga' v tvoji tabeli Uporabnik
        await pool.query('UPDATE Uporabnik SET vloga = $1 WHERE id_uporabnik = $2', [vloga, idUporabnika]);
        
        return res.sendStatus(200); // Vrnemo status 200 (Vse je OK)
    } catch (err) {
        console.error("Napaka pri spreminjanju vloge uporabnika:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku pri posodabljanju vloge.' });
    }
});

// --- POT ZA BRISANJE UPORABNIKA IZ BAZE (ADMIN) ---
app.delete('/api/uporabniki/:id', async (req, res) => {
    const idUporabnika = req.params.id;

    try {
        // Najprej izbrišemo odvisne vrstice v vmesni tabeli za značke, da ne pride do napake tujega ključa (Foreign Key)
        await pool.query('DELETE FROM Uporabnik_Znacka WHERE TK_Uporabnikid_član = $1', [idUporabnika]);
        
        // Nato varno izbrišemo samega uporabnika
        await pool.query('DELETE FROM Uporabnik WHERE id_uporabnik = $1', [idUporabnika]);
        
        return res.sendStatus(200); // Vrnemo status 200 (Uspešno izbrisano)
    } catch (err) {
        console.error("Napaka pri brisanju uporabnika iz baze:", err);
        return res.status(500).json({ sporocilo: 'Napaka na strežniku pri brisanju uporabnika.' });
    }
});

// Ta pot bo iz baze prebrala značke uporabnika in jih vrnila profilu
app.get('/api/moje-znacke/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const userCheck = await pool.query('SELECT id_uporabnik FROM Uporabnik WHERE email = $1', [email]);
        
        if (userCheck.rows.length === 0) {
            return res.json([]); // Če uporabnik ne obstaja, vrnemo prazen seznam
        }

        const idUporabnik = userCheck.rows[0].id_uporabnik;

        const znackeQuery = `
            SELECT z.naziv, z.opis 
            FROM Značka z
            JOIN Uporabnik_Znacka uz ON z.id_znacka = uz.tk_značkaid_znacka
            WHERE uz.tk_uporabnikid_član = $1
        `;
        
        const rezZnacke = await pool.query(znackeQuery, [idUporabnik]);
        return res.json(rezZnacke.rows);

    } catch (err) {
        console.error("Napaka pri branju značk:", err);
        return res.status(500).json([]);
    }
});

// --- POT ZA ODDAJO NOVEGA PREDLOGA + AVTOMATSKO PODELJEVANJE ZNAČK -----
//----------------------------------------------------------------//
//------------//
//----//
app.post('/api/dodaj-predlog', async (req, res) => {
    // Frontend mora poslati naslov, opis in email uporabnika, ki predlog oddaja
    const { naslov, opis, email } = req.body;

    if (!naslov || !opis || !email) {
        return res.status(400).json({ uspeh: false, sporocilo: 'Vsa polja so obvezna!' });
    }

    try {
        // 1. Najprej poiščemo id_uporabnika na podlagi njegovega emaila
        const userCheck = await pool.query('SELECT id_uporabnik FROM Uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ uspeh: false, sporocilo: 'Uporabnik ne obstaja.' });
        }
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        
      
const vnosObjaveQuery = `
    INSERT INTO Objava (
        naslov, opis, lokacija, fotografija, datum_objave, 
        tip_objave, tk_uporabnikid_uporabnik, tk_tip_odlocanjaid_tip_odlocanja, tk_status_pobudid_status_pobud
    ) 
    VALUES ($1, $2, $3, $4, CURRENT_DATE, 'Predlog', $5, 1, 1)
`;


await pool.query(vnosObjaveQuery, [
    naslov,        
    opis,          
    'Maribor',     
    slika,         
    idUporabnika   
]);
        await pool.query(vnosObjaveQuery, [naslov, opis, idUporabnika]);

        // =================================================================
        // 3. LOGIKA ZA ZNAČKE
        // =================================================================
        
        // Preštejemo trenutno število objav uporabnika
        const preveriPredloge = await pool.query(
            'SELECT COUNT(*) FROM Objava WHERE tk_uporabnikid_uporabnik = $1', 
            [idUporabnika]
        );
        const steviloObjav = parseInt(preveriPredloge.rows[0].count);

        let prejetaZnacka = null;

        // Če je to njegova 1. objava -> Dobi značko ID 1 ("Idejni vodja")
        if (steviloObjav === 1) {
            const imaPrvo = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE tk_uporabnikid_član = $1 AND tk_značkaid_znacka = 1', [idUporabnika]);
            if (imaPrvo.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, tk_uporabnikid_član, tk_značkaid_znacka) VALUES (CURRENT_DATE, $1, 1)', [idUporabnika]);
                prejetaZnacka = "Idejni vodja";
            }
        }

        // Če je to njegova 3. objava -> Dobi značko ID 3 ("Aktivni občan")
        if (steviloObjav === 3) {
            const imaTretjo = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE tk_uporabnikid_član = $1 AND tk_značkaid_znacka = 3', [idUporabnika]);
            if (imaTretjo.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, tk_uporabnikid_član, tk_značkaid_znacka) VALUES (CURRENT_DATE, $1, 3)', [idUporabnika]);
                prejetaZnacka = "Aktivni občan";
            }
        }

        // Vrnemo uspeh frontendu in mu sporočimo, če je uporabnik ravnokar prejel novo značko!
        return res.json({ 
            uspeh: true, 
            sporocilo: 'Predlog uspešno objavljen!', 
            novaZnacka: prejetaZnacka 
        });

    } catch (err) {
        console.error("Napaka pri dodajanju predloga:", err);
        return res.status(500).json({ uspeh: false, sporocilo: 'Napaka na strežniku pri shranjevanju predloga.' });
    }
});
//////proba
app.get('/api/vsi-predlogi-uporabnikov', async (req, res) => {
    try {
        // Uporabljamo točna imena iz tvoje slike (vse male črke!)
        const objaveRez = await pool.query(`
            SELECT id_objava AS id, naslov, opis, fotografija 
            FROM objava 
            WHERE tip_objave = 'Predlog'
            ORDER BY id_objava DESC
        `);

        const predlogi = objaveRez.rows;

        // Za vsak predlog poiščemo pripadajoče komentarje
        // Preveri v pgAdminu, če se tabela imenuje 'komentar' in stolpci 'tk_uporabnikid_uporabnik'
        for (let predlog of predlogi) {
            const komRez = await pool.query(`
                SELECT u.ime AS avtor, k.vsebina AS besedilo 
                FROM komentar k
                JOIN uporabnik u ON k.tk_uporabnikid_uporabnik = u.id_uporabnik
                WHERE k.tk_objavaid_objava = $1
                ORDER BY k.id_komentar ASC
            `, [predlog.id]);
            
            predlog.komentarji = komRez.rows;
        }

        return res.json(predlogi);
    } catch (err) {
        console.error("Napaka pri branju predlogov iz baze:", err);
        return res.status(500).json([]);
    }
});
// =================================================================
// POT ZA DODAJANJE KOMENTARJEV IN PREVERJANJE ZNAČK 26.5
// =================================================================
app.post('/api/dodaj-komentar', async (req, res) => {
    const { vsebina, idObjave, email } = req.body;

    // Varovalka, če podatki niso pravilno prispeli
    if (!vsebina || !idObjave || !email) {
        return res.json({ uspeh: false, sporocilo: 'Manjkajo podatki za komentar (vsebina, ID ali email).' });
    }

    try {
        // 1. Poiščemo ID uporabnika v bazi glede na njegov email
        const userCheck = await pool.query('SELECT id_uporabnik FROM Uporabnik WHERE email = $1', [email]);
        if (userCheck.rows.length === 0) {
            return res.json({ uspeh: false, sporocilo: 'Uporabnik s tem emailom ne obstaja v bazi.' });
        }
        const idUporabnika = userCheck.rows[0].id_uporabnik;

        // 2. Vstavimo komentar v tabelo Komentar
        // Preveri, če se tvoja imena stolpcev ujemajo (vsebina, datum_ure_oddaje, tk_uporabnikid_uporabnik, tk_objavaid_objava)
        const vnosKomentarjaQuery = `
            INSERT INTO Komentar (vsebina, datum_ure_oddaje, tk_uporabnikid_uporabnik, tk_objavaid_objava)
            VALUES ($1, CURRENT_DATE, $2, $3)
        `;
        await pool.query(vnosKomentarjaQuery, [vsebina, idUporabnika, idObjave]);

        // 3. LOGIKA ZA ZNAČKE: Preverimo število komentarjev uporabnika
        const preveriKomentarje = await pool.query('SELECT COUNT(*) FROM Komentar WHERE tk_uporabnikid_uporabnik = $1', [idUporabnika]);
        const steviloKomentarjev = parseInt(preveriKomentarje.rows[0].count);

        // Če ima uporabnik 5 ali več komentarjev, mu podelimo značko z ID = 2 ("Glas skupnosti")
        if (steviloKomentarjev >= 5) {
            const imaZnacko = await pool.query('SELECT * FROM Uporabnik_Znacka WHERE tk_uporabnikid_član = $1 AND tk_značkaid_znacka = 2', [idUporabnika]);
            if (imaZnacko.rows.length === 0) {
                await pool.query('INSERT INTO Uporabnik_Znacka (datum_prejetja, tk_uporabnikid_član, tk_značkaid_znacka) VALUES (CURRENT_DATE, $1, 2)', [idUporabnika]);
            }
        }

        return res.json({ uspeh: true, sporocilo: 'Komentar uspešno dodan v bazo!' });
    } catch (err) {
        console.error("Napaka na strežniku pri komentarju:", err);
        return res.status(500).json({ uspeh: false, sporocilo: 'Napaka na strežniku pri zapisovanju komentarja.' });
    }
});
/////////////////////////////proba
app.post('/api/dodaj-objavo', async (req, res) => {
    const { naslov, opis, slika, email } = req.body;
    try {
        const uporabnik = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        const idUporabnika = uporabnik.rows[0].id_uporabnik;

        // Popravljeno: tabela 'objava' in stolpci 'fotografija' (namesto 'slika')
        await pool.query(`
            INSERT INTO objava (naslov, opis, fotografija, tk_uporabnikid_uporabnik, tip_objave) 
            VALUES ($1, $2, $3, $4, 'Predlog')`, 
            [naslov, opis, slika, idUporabnika]
        );

        res.json({ uspeh: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ uspeh: false, sporocilo: err.message });
    }
});
////console log
app.post('/api/dodaj-predlog', async (req, res) => {
    const { naslov, opis, email, slika } = req.body;
    
    // Tole bo izpisalo v terminal, ali so podatki sploh prišli iz frontenda
    console.log("Prejeti podatki:", { naslov, opis, email });

    try {
        const user = await pool.query('SELECT id_uporabnik FROM uporabnik WHERE email = $1', [email]);
        
        // Tole bo izpisalo, ali je našel uporabnika
        console.log("Najden uporabnik:", user.rows[0]);

        const idUporabnika = user.rows[0].id_uporabnik;

        const vnosObjave = `
            INSERT INTO objava (
                naslov, opis, fotografija, datum_objave, 
                tk_uporabnikid_uporabnik, tk_tip_objaveid_tip_objave, 
                tk_tip_odlocanjaid_tip_odlocanja, tk_status_pobudid_status_pobud
            ) 
            VALUES ($1, $2, $3, CURRENT_DATE, $4, 1, 1, 1)
        `;
        
        await pool.query(vnosObjave, [naslov, opis, slika, idUporabnika]);
        
        console.log("INSERT uspešno izveden!"); // Če to vidiš v terminalu, je podatek šel v bazo
        res.json({ uspeh: true });
    } catch (err) {
        console.error("KRITIČNA NAPAKA:", err);
        res.status(500).json({ uspeh: false, sporocilo: err.message });
    }
});


// Zagon strežnika je čisto na koncu datoteke
app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});
*/






