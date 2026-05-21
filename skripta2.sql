ALTER ROLE admin_vloga WITH LOGIN PASSWORD 'mesto_admin_9';
ALTER ROLE uporabnik_vloga WITH LOGIN PASSWORD 'obcan_bralec_1';


DROP VIEW IF EXISTS Vsi_Predlogi CASCADE;
DROP VIEW IF EXISTS Moji_Predlogi CASCADE;

DROP TABLE IF EXISTS Uporabnik_Znacka CASCADE;
DROP TABLE IF EXISTS Znacka CASCADE;
DROP TABLE IF EXISTS Komentar CASCADE;
DROP TABLE IF EXISTS Podpora CASCADE;
DROP TABLE IF EXISTS Objava CASCADE;
DROP TABLE IF EXISTS Status_pobud CASCADE;
DROP TABLE IF EXISTS Tip_odlocanja CASCADE; 
DROP TABLE IF EXISTS Uporabnik CASCADE;

CREATE TABLE Uporabnik (
    id_uporabnik bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ime varchar(255) NOT NULL,
    priimek varchar(255) NOT NULL,
    geslo varchar(255) NOT NULL,
	telefon numeric(19,0) NOT NULL,
	email varchar(255) NOT NULL UNIQUE,
    datum_registracije date NOT NULL
);


CREATE TABLE Tip_odlocanja (
    id_tip_odlocanja bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL
); 

CREATE TABLE Status_pobud (
    id_status_pobud bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL
);

CREATE TABLE Znacka (
    id_znacka bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naziv varchar(255) NOT NULL,
    opis varchar(255) NOT NULL
);

CREATE TABLE Objava (
    id_objava integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    naslov varchar(255) NOT NULL,
    opis varchar(255) NOT NULL,
    lokacija varchar(255) NOT NULL,
    fotografija varchar(255),
    datum_objave date NOT NULL,
	tip_objave varchar(255) NOT NULL,
    TK_Uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    TK_Tip_odlocanjaid_tip_odlocanja integer NOT NULL REFERENCES Tip_odlocanja (id_tip_odlocanja),
    TK_Status_pobudid_status_pobud integer NOT NULL REFERENCES Status_pobud (id_status_pobud)
);

CREATE TABLE Komentar (
    id_komentar integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vsebina varchar(255) NOT NULL,
    datum_ure_oddaje date NOT NULL,
    TK_Uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
);

CREATE TABLE Podpora (
    id_podpora integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_podpore date NOT NULL,
    TK_Uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik)
);

CREATE TABLE Uporabnik_Znacka (
    id_uporabnik_znacka integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_prejetja date NOT NULL,
    TK_Uporabnikid_član integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    TK_Značkaid_znacka integer NOT NULL REFERENCES Značka (id_znacka)
);


CREATE VIEW Vsi_Predlogi AS 
SELECT id_objava, naslov, opis, lokacija, fotografija, datum_objave, TK_Tip_objaveid_tip_objave
FROM Objava;

CREATE VIEW Moji_Predlogi AS 
SELECT o.id_objava, o.naslov, o.opis, o.lokacija, o.fotografija, o.datum_objave, s.naziv AS status
FROM Objava o
JOIN Status_pobud s ON o.TK_Status_pobudid_status_pobud = s.id_status_pobud
JOIN Uporabnik u ON o.TK_Uporabnikid_uporabnik = u.id_uporabnik
WHERE u.email = CURRENT_USER; 



GRANT CONNECT ON DATABASE "MojeMesto_projekt" TO admin_vloga, uporabnik_vloga;
GRANT USAGE ON SCHEMA public TO admin_vloga, uporabnik_vloga;


GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_vloga;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_vloga;


GRANT SELECT ON TABLE Tip_odlocanja, Status_pobud, Znacka, Uporabnik_Znacka TO uporabnik_vloga;
GRANT SELECT ON TABLE Vsi_Predlogi TO uporabnik_vloga;
GRANT SELECT ON TABLE Moji_Predlogi TO uporabnik_vloga;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE Podpora TO uporabnik_vloga;
GRANT SELECT, INSERT ON TABLE Komentar TO uporabnik_vloga;
GRANT INSERT ON TABLE Objava TO uporabnik_vloga;
GRANT INSERT, UPDATE, SELECT ON TABLE Uporabnik TO uporabnik_vloga;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO uporabnik_vloga;



SELECT rolname AS uporabnik, rolcanlogin, rolsuper
FROM pg_roles
WHERE rolname IN ('admin_vloga', 'uporabnik_vloga');