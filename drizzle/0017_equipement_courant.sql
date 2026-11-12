-- L'ÉQUIPEMENT COURANT — LA CORDE, LE MIROIR, LES RATIONS.
--
-- André, le 2026-11-12 : « Il manque une section équipement dans les fiches de
-- personnages… l'endroit où inscrire corde de 15 m, miroir, outils de voleur,
-- rations… j'aimerais que cette section soit modifiable tant du côté de la page
-- de modification que directement dans la page du personnage. »
--
-- ── Le trou, mesuré avant d'écrire une ligne de code ────────────────────────
-- Les 45 tables de la base couvrent les armes, les armures, les objets
-- magiques, les potions, les parchemins, les gemmes et la monnaie. AUCUNE ne
-- porte l'équipement non magique du sac à dos. Vérifié aussi qu'il n'avait pas
-- été saisi ailleurs en attendant : les recherches « corde », « miroir »,
-- « rations », « outils », « torche », « gourde » dans `characters.notes`,
-- `characters.historique`, `weapons` et `magic_items` ne ramènent que de vrais
-- objets magiques (Corde d'escalade, Miroir de révélation, Havresac d'Hévard).
-- Personne n'avait contourné le trou — il n'y avait rien.
--
-- ⭐ La feuille imprimée, elle, l'attendait déjà : la table ÉQUIPEMENTS de la
-- page 3 a quatre colonnes — Localisation, Valeur (po), Poids (kg) — rendues
-- VIDES sur chacune de ses lignes depuis toujours. Les colonnes de cette table
-- sont là pour les remplir, exactement comme la case « Divers » des jets de
-- sauvegarde, corrigée le matin même (commits 9a71be96 → 659dfb90).
--
-- ── Pourquoi AUCUN lien vers la table catalogue `equipment` ─────────────────
-- `equipment` existe depuis le premier schéma et contient 0 ligne : un
-- catalogue jamais rempli. Même raisonnement que `character_gems`, et il est
-- écrit dans son commentaire : la valeur d'une gemme appartient au trésor d'un
-- personnage précis. Ici, c'est le NOM qui appartient au joueur — « corde de
-- chanvre, 15 m », « outils de voleur de maître », « rations pour 4 jours » ne
-- se rangent pas sous une entrée unique du Manuel sans la trahir.
-- ⛔ Et surtout : passer par un catalogue obligerait à un findOrCreateByNom,
-- donc à muter une ligne partagée au nom du personnage qui enregistre — c'est
-- ainsi que 45 compétences en étaient devenues 191.
-- Le jour où André veut un rayon 📖 Équipement à la Bibliothèque (table 7-8 du
-- Manuel, « Biens et services »), il se peuplera dans `equipment` et un
-- `catalogue_id` se posera ici. Rien de ce qui est écrit aujourd'hui ne gêne.
--
-- ── Les colonnes, et ce que chacune veut dire ──────────────────────────────
-- `quantite`     — 50 pitons tiennent sur une ligne, comme un lot de gemmes.
-- `emplacement`  — la colonne « Localisation » du papier : sac à dos, ceinture,
--                  botte, sacoche de selle. Facultative : on ne sait pas
--                  toujours où est la corde, et l'inventer serait mentir.
-- `valeur`+`unite` — le prix À LA PIÈCE, comme `character_gems`. L'unité compte
--                  vraiment ici : au Manuel une chandelle vaut 1 pc et une
--                  corde de soie 10 po. Un prix forcé en po écraserait l'écart.
-- `poids`        — en KILOGRAMMES, À LA PIÈCE. Le catalogue d'armes est en kg
--                  (dague 0,50 ; arbalète lourde 4,00) et l'en-tête du papier
--                  dit « Poids (kg) » : c'est l'unité de la maison.
-- ⚠ NULL sur `valeur` et `poids` dit « non pesé, non chiffré », là où 0 dirait
-- « gratuit » et « ne pèse rien ». La fiche n'affiche alors aucun chiffre
-- plutôt qu'un faux zéro, et la charge portée ne compte pas la ligne.
--
-- ⛔ Ce que cette table n'est PAS : un suivi de consommation. Une ration mangée
-- se retire en baissant sa quantité, à la main. Les charges automatiques sont
-- réservées à ce qui en a au livre (potions, parchemins, objets à charges).
CREATE TABLE IF NOT EXISTS "character_equipment" (
  "id"            serial PRIMARY KEY NOT NULL,
  "personnage_id" integer NOT NULL REFERENCES "characters"("id"),
  "nom"           varchar(200) NOT NULL,
  "quantite"      integer DEFAULT 1,
  "emplacement"   varchar(100),
  "valeur"        numeric(10, 2),
  "unite"         varchar(4) DEFAULT 'po',
  "poids"         numeric(6, 2),
  "notes"         text
);

CREATE INDEX IF NOT EXISTS "idx_character_equipment_personnage"
  ON "character_equipment" ("personnage_id");
