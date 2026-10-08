-- Sépare le CATALOGUE des dons (table 5-1 du Manuel) des lignes de fiche
-- importées de FileMaker, qui vivent dans la même table.
--
-- Pourquoi : `feats` n'a jamais été un catalogue. Le classement à la main de
-- ses 477 lignes (menage-references/p10-dons-classement.txt) donne :
--   226 vrais dons du Manuel, mais sous 57 noms seulement, en 4 orthographes
--       et 2 langues (« Improved critical (bastard) », « Science du critique
--       (rapière) », « Sens du critique épée courte »…);
--   115 capacités de classe, 35 traits raciaux, 33 pouvoirs de créature,
--    37 marqueurs de progression (« DON Niv 1 », « NIV01 (bonus) »),
--     4 séparateurs, 14 notes de fiche, 12 dons d'une autre source.
-- Le rayon Dons de la Bibliothèque les servait toutes.
--
-- Aucune ligne existante n'est supprimée : 439 d'entre elles sont portées par
-- un personnage et disent quelque chose de vrai sur sa fiche. On ajoute
-- seulement de quoi distinguer les deux populations, comme pour les armes
-- (voir drizzle/0006 et 0007).
ALTER TABLE "feats" ADD COLUMN IF NOT EXISTS "est_catalogue" boolean DEFAULT false NOT NULL;

-- Pour une ligne de fiche : l'entrée de catalogue qui porte les règles du don.
-- NULL tant que le rattachement n'est pas décidé, et NULL pour toujours sur une
-- capacité de classe, un trait racial ou un séparateur — ce n'est pas un trou.
ALTER TABLE "feats" ADD COLUMN IF NOT EXISTS "catalogue_id" integer;

-- Le rayon Dons filtre là-dessus.
CREATE INDEX IF NOT EXISTS "feats_est_catalogue_idx" ON "feats" ("est_catalogue");
