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
    TK_Tip_objaveid_tip_objave integer NOT NULL REFERENCES Tip_objave (id_tip_objave),
    TK_Tip_odlocanjaid_tip_odlocanja integer NOT NULL REFERENCES Tip_odlocanja (id_tip_odlocanja),
    TK_Status_pobudid_status_pobud integer NOT NULL REFERENCES Status_pobud (id_status_pobud)
);

CREATE TABLE Komentar (
    id_komentar integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vsebina varchar(255) NOT NULL,
    datum_ure_oddaje date NOT NULL,
    TK_Uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    TK_Objavaid_objava integer NOT NULL REFERENCES Objava (id_objava)
);

CREATE TABLE Podpora (
    id_podpora integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_podpore date NOT NULL,
    TK_Uporabnikid_uporabnik integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    TK_Objavaid_objava integer NOT NULL REFERENCES Objava (id_objava)
);

CREATE TABLE Uporabnik_Znacka (
    id_uporabnik_znacka integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    datum_prejetja date NOT NULL,
    TK_Uporabnikid_član integer NOT NULL REFERENCES Uporabnik (id_uporabnik),
    TK_Značkaid_znacka integer NOT NULL REFERENCES Značka (id_znacka)
);

---pravice--
DROP ROLE IF EXISTS admin_vloga;
DROP ROLE IF EXISTS uporabnik_vloga;

REVOKE ALL PRIVILEGES ON DATABASE moje_mesto FROM admin_vloga;
REVOKE ALL PRIVILEGES ON DATABASE moje_mesto FROM uporabnik_vloga;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM admin_vloga;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM admin_vloga;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM admin_vloga;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM uporabnik_vloga;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM uporabnik_vloga;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM uporabnik_vloga;


CREATE ROLE admin_vloga WITH LOGIN PASSWORD 'mesto_admin_9';
CREATE ROLE uporabnik_vloga WITH LOGIN PASSWORD 'obcan_bralec_1';


GRANT CONNECT ON DATABASE moje_mesto TO admin_vloga;
GRANT CONNECT ON DATABASE moje_mesto TO uporabnik_vloga;


GRANT ALL PRIVILEGES ON SCHEMA public TO admin_vloga;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_vloga;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin_vloga;


GRANT USAGE ON SCHEMA public TO uporabnik_vloga;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO uporabnik_vloga;

GRANT INSERT, UPDATE ON TABLE "Objava" TO uporabnik_vloga;
GRANT INSERT, UPDATE ON TABLE "Uporabnik" TO uporabnik_vloga;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO uporabnik_vloga;


SELECT rolname AS uporabnik, rolcanlogin, rolsuper
FROM pg_roles
WHERE rolname IN ('admin_vloga', 'uporabnik_vloga');
---tip objave ---predlogi ---admin in uporabnik svoji