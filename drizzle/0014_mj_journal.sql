-- QUI MÈNE LA PARTIE — le journal du MJ apprend à se signer.
--
-- Demande d'André le 2026-11-09 : « Comme nous sommes plusieurs maîtres de Donjons
-- à mener des parties avec le Grimoire, il faudrait un champ pour s'identifier dans
-- le journal du Maître. »
--
-- Le journal signait déjà les joueurs : une note d'aventure porte la pastille de son
-- personnage, et `personnage_id` suffit à la rattacher. Les entrées du MJ, elles,
-- sont GLOBALES (`personnage_id` NULL) — note du MJ, ordre d'initiative, marqueurs
-- de round, bilan de combat, photo de la map. Rien ne disait d'où elles venaient.
-- Avec un seul MJ, l'anonymat se devine. À plusieurs, non.
--
-- ── Pourquoi une colonne de texte, et pas une table `maitres_de_jeu` ────────
-- Un MJ n'a pas de données à lui : ni fiche, ni droits, ni réglages. Une table
-- n'apporterait qu'une clé étrangère à tenir et un écran de gestion à écrire.
-- Le nom libre suffit — et la liste de choix du champ est construite à la lecture
-- (`select distinct mj`), donc elle se tient à jour toute seule sans que personne
-- n'ait à « créer » un maître de jeu avant de jouer.
--
-- ── Pourquoi NULL est permis ────────────────────────────────────────────────
-- Les 141 entrées déjà au journal (mesuré le 2026-11-09, 12 journées ludiques)
-- n'ont pas d'auteur connu, et leur en inventer un serait écrire une fausseté
-- dans une chronique. NULL dit « on ne sait pas », ce qui est la vérité.
-- Surtout : en pleine partie, une colonne NOT NULL ferait ÉCHOUER une note du MJ
-- qui ne s'est pas identifié. Le journal ne doit jamais faire perdre une note.
--
-- 60 caractères : un prénom, un pseudonyme, « André (chez Sylvain) » au besoin.
ALTER TABLE "character_journal" ADD COLUMN IF NOT EXISTS "mj" varchar(60);

-- Sert la liste de choix du champ d'identification (`select distinct mj`) : l'index
-- la rend indépendante de la taille du journal, même après des années de campagne.
CREATE INDEX IF NOT EXISTS "idx_character_journal_mj"
  ON "character_journal" ("mj") WHERE "mj" IS NOT NULL;
