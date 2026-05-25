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

// Nujno za registracijo 
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
                window.location.href = 'http://127.0.0.1:5500/frontend/prijava.html';
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