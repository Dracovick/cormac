-- Rattache chaque LIGNE D'INVENTAIRE d'arme à son entrée de CATALOGUE.
--
-- Pourquoi : depuis 0006, `weapons` porte deux populations distinguées par
-- `est_catalogue` — les 78 entrées de la table 7-5 du Manuel, et les 158 lignes
-- d'inventaire importées de FileMaker (« Longbow +3, rapid shot », « Dague +2
-- (mêlée) », « Épée courte +4 »). Rien ne disait jusqu'ici que ces trois-là
-- sont un arc long, une dague et une épée courte.
--
-- Ce que cette colonne permet : depuis la fiche d'un personnage, ouvrir les
-- règles officielles de l'arme qu'il porte (zone de critique, facteur de
-- portée, maniement à une ou deux mains, allonge, arme double).
--
-- Ce qu'elle NE fait PAS : elle ne touche à aucune valeur saisie par André.
-- « La saisie fait foi » reste la règle — les dégâts, le critique et la portée
-- affichés sur la fiche restent ceux de sa ligne, parce qu'ils incluent
-- légitimement le bonus magique de l'arme et le modificateur de Force du
-- porteur. Le lien est une référence, pas une substitution.
--
-- NULL est un état valide et durable : 40 lignes ne sont pas des armes du
-- catalogue (attaques de créature, pouvoirs surnaturels, séparateurs de fiche,
-- armes de suppléments), et 10 attendent une décision d'André.
ALTER TABLE "weapons" ADD COLUMN IF NOT EXISTS "catalogue_id" integer REFERENCES "weapons"("id");

CREATE INDEX IF NOT EXISTS "weapons_catalogue_id_idx" ON "weapons" ("catalogue_id");
