-- Sépare le CATALOGUE des armes (table 7-5 du Manuel) des LIGNES D'INVENTAIRE
-- importées de FileMaker, qui vivent dans la même table.
--
-- Pourquoi : `weapons` n'a jamais été un catalogue. Elle contient aussi bien
-- « Épée longue » que « Longbow +3, rapid shot », « Tigre BLANC Patte » ou
-- « -------------------- ». Le rayon Armes de la Bibliothèque les servait toutes.
-- Aucune ligne existante n'est supprimée : elles portent l'inventaire des
-- personnages. On ajoute seulement de quoi distinguer les deux populations.
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "est_catalogue" boolean DEFAULT false NOT NULL;
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "famille" varchar(60);

-- Le rayon Armes filtre là-dessus.
CREATE INDEX IF NOT EXISTS "weapons_est_catalogue_idx" ON "weapons" ("est_catalogue");
