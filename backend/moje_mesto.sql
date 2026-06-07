DROP TABLE IF EXISTS Uporabnik_Znacka CASCADE;
DROP TABLE IF EXISTS Značka CASCADE;
DROP TABLE IF EXISTS Komentar CASCADE;
DROP TABLE IF EXISTS Podpora CASCADE;
DROP TABLE IF EXISTS Objava CASCADE;
DROP TABLE IF EXISTS Status_pobud CASCADE;
DROP TABLE IF EXISTS Tip_odlocanja CASCADE;
DROP TABLE IF EXISTS Sporocilo CASCADE;
DROP TABLE IF EXISTS Uporabnik CASCADE;
DROP TABLE IF EXISTS Tip_uporabnika CASCADE;

CREATE TABLE tip_uporabnika (
    id_tip_uporabnika bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL
);

INSERT INTO tip_uporabnika (naziv) VALUES ('Administrator'), ('Uporabnik');

CREATE TABLE Uporabnik (
    id_uporabnik bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ime varchar(255) NOT NULL,
    priimek varchar(255) NOT NULL,
    geslo varchar(255) NOT NULL,
    telefon numeric(19,0) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    datum_registracije date NOT NULL DEFAULT CURRENT_DATE,
    tk_tip_uporabnikaid_tip_uporabnika integer NOT NULL DEFAULT 2 REFERENCES tip_uporabnika (id_tip_uporabnika)
);

CREATE TABLE Sporocilo (
    id_sporocilo bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    posiljatelj_email varchar(255) NOT NULL REFERENCES Uporabnik(email),
    prejemnik_email varchar(255) NOT NULL REFERENCES Uporabnik(email),
    vsebina text NOT NULL,
    datum_vnos timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Tip_odlocanja (
    id_tip_odlocanja bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL
);

INSERT INTO tip_odlocanja (naziv) VALUES ('Prijava težav v lokalnem okolju');

CREATE TABLE Status_pobud (
    id_status_pobud bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL
);

INSERT INTO status_pobud (naziv) VALUES ('Oddano'), ('V obravnavi'), ('Zaključeno');

CREATE TABLE Značka (
    id_znacka bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL,
    opis varchar(255) NOT NULL
);

INSERT INTO značka (naziv, opis) VALUES 
('Prvi korak', 'Oddali ste svoj prvi predlog!'),
('Aktivni občan', 'Oddali ste vsaj 5 predlogov.');

CREATE TABLE Objava (
    id_objava integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naslov varchar(255) NOT NULL,
    opis varchar(255) NOT NULL,
    lokacija varchar(255) NOT NULL,
    fotografija text,
    koordinate varchar(255),
    datum_objave date NOT NULL DEFAULT CURRENT_DATE,
    tip_objave varchar(255) NOT NULL,
    st_vseckov integer DEFAULT 0 NOT NULL,
    tk_uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    tk_tip_odlocanjaid_tip_odlocanja integer NOT NULL REFERENCES Tip_odlocanja (id_tip_odlocanja),
    tk_status_pobudid_status_pobud integer NOT NULL REFERENCES Status_pobud (id_status_pobud)
);

CREATE TABLE Komentar (
    id_komentar integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vsebina varchar(255) NOT NULL,
    datum_ure_oddaje date NOT NULL DEFAULT CURRENT_DATE,
    tk_uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    tk_objavaid_objava integer NOT NULL REFERENCES Objava (id_objava)
);

CREATE TABLE Podpora (
    id_podpora integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_podpore date NOT NULL DEFAULT CURRENT_DATE,
    tk_uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    tk_objavaid_objava integer NOT NULL REFERENCES Objava (id_objava)
);

CREATE TABLE Uporabnik_Znacka (
    id_uporabnik_znacka integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_prejetja date NOT NULL DEFAULT CURRENT_DATE,
    tk_uporabnikid_član integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    tk_značkaid_znacka integer NOT NULL REFERENCES Značka (id_znacka)
);