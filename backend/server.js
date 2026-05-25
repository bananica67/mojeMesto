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


app.listen(3000, () => {
  console.log("Strežnik deluje na http://localhost:3000");
});

//prijava
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