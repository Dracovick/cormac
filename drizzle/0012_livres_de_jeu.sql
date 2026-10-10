-- LES LIVRES DE JEU — un rayon de la Grande Bibliothèque pour les ouvrages
-- consultables en entier, et non dépouillés en fiches.
--
-- Demande d'André le 2026-10-10 : rendre les quatre volumes de l'Encyclopedia
-- Magica accessibles aux joueurs, avec un outil de lecture, la recherche dans
-- le texte et le téléchargement — explicitement SANS en extraire le texte
-- (« c'est trop volumineux »).
--
-- Pourquoi une table et pas une liste en dur dans le code : la qualité de la
-- couche texte doit pouvoir être remesurée quand un fichier est remplacé. Le
-- volume 3 a un OCR cassé (26 % de mots nets, « charges » introuvable sur
-- 417 pages) et André cherche une meilleure copie. Relancer le script de
-- téléversement remplace le blob et réécrit ces colonnes; aucun code à toucher.
--
-- Le PDF lui-même vit dans Vercel Blob, pas dans le dépôt : 180 Mo pour les
-- quatre, très au-delà de ce qu'un déploiement embarque.
--
-- `langue` existe parce que ces volumes sont en ANGLAIS, contrairement à tout
-- le reste du Grimoire — André a demandé que ce soit dit au lecteur.
CREATE TABLE IF NOT EXISTS "game_books" (
  "id" serial PRIMARY KEY NOT NULL,
  -- Clé stable utilisée comme nom de fichier dans le Blob : un retéléversement
  -- écrase le même chemin au lieu d'accumuler des copies.
  "slug" varchar(80) NOT NULL UNIQUE,
  "titre" varchar(200) NOT NULL,
  "volume" integer,
  -- « A – D » : la tranche alphabétique couverte par le volume.
  "tranche" varchar(40),
  -- Code ISO 639-1. 'en' pour l'Encyclopedia Magica.
  "langue" varchar(5) NOT NULL DEFAULT 'fr',
  "pages" integer,
  "taille_octets" bigint,
  "url" text NOT NULL,
  -- 'fiable' | 'partielle' | 'inutilisable' — ce que vaut la RECHERCHE dans ce
  -- fichier, mesuré sur sa couche texte. Un PDF scanné sans OCR exploitable ne
  -- se cherche pas, quel que soit le lecteur : le dire évite de laisser un
  -- joueur conclure que le mot n'est pas dans le livre.
  "qualite_recherche" varchar(20),
  -- Le taux mesuré, pour que le verdict ci-dessus soit vérifiable.
  "taux_ocr" integer,
  "note" text,
  "ordre" integer NOT NULL DEFAULT 0
);

-- ── Ajout du même jour ─────────────────────────────────────────────────────
-- `collection` : regrouper les volumes d'un même ouvrage SANS deviner d'après
-- le slug. La devinette tombait dès le premier cas réel : André a trouvé une
-- seconde copie du volume 3, à l'OCR excellent mais TRONQUÉE (140 pages au lieu
-- de 417, elle s'arrête au milieu des Ring et la section S manque). Les deux
-- copies doivent coexister — la complète pour lire, la partielle pour chercher —
-- et un slug suffixé (« -3b ») n'aurait plus été reconnu comme le même ouvrage.
ALTER TABLE "game_books" ADD COLUMN IF NOT EXISTS "collection" varchar(80);
