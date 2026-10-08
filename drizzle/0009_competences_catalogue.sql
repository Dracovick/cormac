-- Sépare le CATALOGUE des compétences (table 4-2 et chapitre 4 du Manuel) des
-- lignes de fiche importées de FileMaker, qui vivent dans la même table.
--
-- Pourquoi : `skills` n'a jamais été un catalogue. Ses 88 lignes croisées au
-- livre donnent 41 noms officiels, 14 spécialisations d'Artisanat / Profession
-- / Représentation, 9 domaines de Connaissances hors Manuel, 12 vestiges de la
-- 3.0 (Alchimie, Dissimulation, Scrutation, Sens de l'orientation, Monture…)
-- et 12 lignes qui ne sont pas des compétences du tout (Volonté, qui est un
-- jet de sauvegarde; Stabilité, un trait racial nain; Langage secret, une
-- capacité de classe; Aura magique, un sort).
-- Aucune des 88 n'a de description : la Bibliothèque n'a pas de rayon
-- Compétences, et la fiche de personnage n'a aucune règle à ouvrir.
--
-- Aucune ligne existante n'est supprimée : les 88 sont toutes portées par au
-- moins un personnage (510 lignes de `character_skills` chez 56 personnages)
-- et disent quelque chose de vrai sur une fiche. On ajoute seulement de quoi
-- distinguer les deux populations — même méthode que les armes (0006, 0007)
-- et les dons (0008).
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "est_catalogue" boolean DEFAULT false NOT NULL;

-- Pour une ligne de fiche : l'entrée de catalogue qui porte les règles.
-- « Connaissances (religion) » et « Artisanat (alchimie) » sont des
-- spécialisations d'UNE compétence du livre, qui porte leurs règles communes.
-- NULL tant que le rattachement n'est pas décidé, et NULL pour toujours sur ce
-- qui n'est pas une compétence — ce n'est pas un trou.
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "catalogue_id" integer;

-- Le malus d'armure aux tests. 9 des 36 compétences le portent (Acrobaties,
-- Déplacement silencieux, Discrétion, Équilibre, Escalade, Escamotage,
-- Évasion, Natation, Saut). C'est une donnée de règle que la table 4-2 écrit
-- en colonne et que la fiche de personnage pourra calculer d'elle-même.
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "malus_armure" boolean DEFAULT false NOT NULL;

-- Le rayon Compétences de la Bibliothèque filtre là-dessus.
CREATE INDEX IF NOT EXISTS "skills_est_catalogue_idx" ON "skills" ("est_catalogue");

-- `class_skill_list` était vide. Le livre liste les compétences de classe en
-- prose, et certaines sont SPÉCIALISÉES : le prêtre a « Connaissances
-- (religion) » et « Connaissances (histoire) », pas toutes les Connaissances.
-- La précision est load-bearing — sans elle, on rendrait de classe à un prêtre
-- des Connaissances (nature) qu'il n'obtient qu'avec le domaine de la Faune ou
-- de la Flore.
ALTER TABLE "class_skill_list" ADD COLUMN IF NOT EXISTS "precision" varchar(80);

-- Une classe ne peut pas porter deux fois la même compétence avec la même
-- précision. Rend le semis rejouable sans produire de doublons.
CREATE UNIQUE INDEX IF NOT EXISTS "class_skill_list_unique_idx"
  ON "class_skill_list" ("classe_id", "skill_id", COALESCE("precision", ''));
