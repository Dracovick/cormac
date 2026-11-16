-- PARTAGER UNE HISTOIRE — UN LIEN QUI S'OUVRE SANS MOT DE PASSE, ET SE RÉVOQUE.
--
-- André, le 2026-11-16 : « J'ai besoin d'être capable de partager l'histoire.
-- Lorsque je copie le lien de la page ce lien amène à l'accueil du site. »
--
-- ── Ce qui se passait, mesuré en production avant d'écrire une ligne ───────
--   GET https://www.dracovick.com/personnage/98/histoire  ->  307 vers /login
-- Tout le Grimoire est derrière un mot de passe partagé (`src/middleware.ts`).
-- Un visiteur sans cookie était renvoyé à `/login` — page qui ressemble à
-- l'accueil (⚔️ Grimoire D&D) — et `actions/auth.login()` terminait par
-- `redirect('/')` EN DUR : la page demandée n'était jamais mémorisée.
--
-- Deux remèdes, et un seul des deux a besoin de la base :
--   1. la destination retenue (`?suite=`) — aucune colonne, voir `lib/partage.ts`;
--   2. le lien public à jeton — c'est cette table.
--
-- ── Pourquoi une TABLE et pas deux colonnes sur `characters` ───────────────
-- `saveCharacter()` réécrit `characters` par `.set({ ...charValues })` à chaque
-- enregistrement de fiche. Une colonne de jeton posée là serait à la merci du
-- jour où ce jeu de valeurs se construit autrement — exactement le défaut qui a
-- vidé le carquois de Bram le 2026-11-12 (`quantite_munitions`) et celui qui
-- faisait compter une armure rangée au sac (`est_portee`, 2026-10-25). Une
-- table à part ne peut pas être écrasée par l'enregistrement d'une fiche.
--
-- ── Les colonnes ───────────────────────────────────────────────────────────
-- `jeton`         — 24 caractères d'un alphabet de 32 (120 bits), généré par
--                   `crypto.getRandomValues`. UNIQUE : c'est la clé d'entrée de
--                   la page publique, et deux histoires ne peuvent pas répondre
--                   à la même adresse. Ni `l` ni `o` ni `0` ni `1` dans
--                   l'alphabet — ce jeton se lit dans une URL et se dicte.
-- `personnage_id` — UNIQUE aussi : un lien actif par histoire. Révoquer est un
--                   DELETE, repartager un INSERT; le lien révoqué est mort pour
--                   de bon, et c'est ce qu'on attend d'une révocation.
-- `cree_le`       — depuis quand ce lien circule. La seule chose qu'on puisse
--                   dire d'honnête à André avant qu'il décide de le couper.
--
-- ⛔ AUCUNE date d'expiration, délibérément. Un lien qui meurt tout seul casse
-- en silence chez celui à qui on l'a donné, et André n'a rien demandé de tel.
-- La révocation est explicite, par un bouton.
--
-- ⛔ Et ce que ce lien N'OUVRE PAS : il ne vaut que pour l'histoire de CE
-- personnage. Pas sa fiche, pas ses chiffres, pas le reste du Grimoire. Le
-- middleware n'exempte le préfixe `/histoire/` qu'en GET et HEAD : un POST —
-- donc toute Server Action, dont le manifeste Next est global à l'application —
-- reste soumis au mot de passe.

CREATE TABLE IF NOT EXISTS character_story_shares (
  id            SERIAL PRIMARY KEY,
  personnage_id INTEGER NOT NULL UNIQUE REFERENCES characters(id),
  jeton         VARCHAR(64) NOT NULL UNIQUE,
  cree_le       TIMESTAMP DEFAULT NOW()
);

-- La page publique cherche par jeton à chaque chargement. L'unicité pose déjà
-- un index; celui-ci n'est donc pas répété.
