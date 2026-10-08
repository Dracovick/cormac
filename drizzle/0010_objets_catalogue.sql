-- Sépare le CATALOGUE des objets magiques (chapitre 7 du Guide du Maître et les
-- suppléments relevés) des lignes de fiche importées de FileMaker, qui vivent
-- dans la même table — même méthode que les armes (0006, 0007), les dons (0008)
-- et les compétences (0009).
--
-- Pourquoi maintenant : la Bibliothèque affichait 41 entrées portant « La
-- description de cette entrée n'a pas encore été relevée dans les livres ».
-- Mesuré le 2026-10-08 : AUCUNE de ces 41 n'est une fiche de livre restée vide.
-- Les 671 entrées semées des livres (ids 73-276 et 279-745) ont toutes leur
-- description. Les 41 vides sont toutes dans les 74 lignes de la saisie
-- FileMaker (ids 1-72, 277, 278) : des quantités d'inventaire (« 75 flèches »,
-- « 2 potions de soins »), des noms anglais (« Ring of nine lives », « Arrow of
-- ice »), des armes magiques rangées chez les objets merveilleux, et des pièces
-- de la campagne absentes des livres. Le message promettait un relevé qui
-- n'aura jamais lieu : il n'y a rien à relever.
--
-- Aucune ligne n'est supprimée. Les 74 lignes d'André sont portées par des
-- personnages joués (92 lignes de `character_magic_items` chez 77 objets) et
-- disent quelque chose de vrai sur une fiche.
ALTER TABLE "magic_items" ADD COLUMN IF NOT EXISTS "est_catalogue" boolean DEFAULT false NOT NULL;

-- Pour une ligne de fiche : l'entrée de catalogue qui porte les règles.
-- « Ring of counterspelling » est l'anneau de contresort du livre sous son nom
-- anglais ; le 📖 de la fiche de personnage doit ouvrir la règle, pas la ligne
-- d'inventaire. NULL tant que le rattachement n'est pas décidé, et NULL pour
-- toujours sur ce qui n'a pas d'équivalent au livre — ce n'est pas un trou.
ALTER TABLE "magic_items" ADD COLUMN IF NOT EXISTS "catalogue_id" integer;

-- Le rayon Objets magiques de la Bibliothèque s'en sert pour distinguer une
-- règle du livre d'une note de MJ.
CREATE INDEX IF NOT EXISTS "magic_items_est_catalogue_idx" ON "magic_items" ("est_catalogue");
