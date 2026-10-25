-- LES PARCHEMINS — une section à eux, liée à la Bibliothèque des sorts.
--
-- Demande d'André le 2026-10-25, au sortir d'une partie : « j'avais un parchemin
-- lors de la partie d'aujourd'hui… avec une gorgée ! » Les parchemins étaient
-- rangés dans `potions`, donc le journal écrivait « Boit « Parchemin Porte
-- dimensionnelle » (0 gorgée restante) ». Ce n'était pas une faute de libellé :
-- c'était le modèle qui parlait.
--
-- ── Pourquoi PAS de table catalogue, contrairement aux potions ──────────────
-- Une potion a besoin d'un catalogue (`potions`) parce que son effet n'existe
-- nulle part ailleurs. Un parchemin, lui, n'est que le support d'un sort — et le
-- sort est déjà décrit, avec sa portée, sa durée, son école et son jet de
-- sauvegarde, dans les 1221 fiches de `spells`. Lui donner un catalogue à part
-- aurait recopié ces données, donc permis qu'elles divergent.
--
-- `sort_id` est donc le cœur de cette table, et c'est exactement ce qu'André a
-- demandé : « un lien avec les sorts […] pour être capable de lire la
-- description facilement ».
--
-- ── Pourquoi `nom_libre` ────────────────────────────────────────────────────
-- Le catalogue couvre le Manuel des Joueurs et six suppléments, pas tout. Un
-- parchemin dont le sort manque ne doit pas être impossible à inscrire en pleine
-- partie : `sort_id` NULL + `nom_libre` rempli donne une ligne honnête, qui dit
-- d'elle-même qu'elle n'a pas de fiche à ouvrir. Les deux colonnes ne sont jamais
-- remplies ensemble; le code lit `sort_id` d'abord.
--
-- ── Pourquoi pas de DD stocké ───────────────────────────────────────────────
-- Le DD du jet de sauvegarde d'un parchemin vaut 10 + niveau du sort + le
-- modificateur de caractéristique de CELUI QUI L'A ÉCRIT (SRD, Magic Items —
-- Scrolls). Ce dernier terme est inconnaissable pour un parchemin trouvé. Un
-- chiffre faux imprimé sur une fiche devient la règle qu'on applique à la table :
-- on préfère la case vide. `notes` reste là si le MJ veut fixer le sien.
CREATE TABLE IF NOT EXISTS "character_scrolls" (
  "id" serial PRIMARY KEY NOT NULL,
  "personnage_id" integer NOT NULL REFERENCES "characters"("id"),

  -- Le lien vers la Bibliothèque. NULL quand le sort n'est pas au catalogue.
  "sort_id" integer REFERENCES "spells"("id"),
  -- Secours, et seulement ça : rempli uniquement quand `sort_id` est NULL.
  "nom_libre" varchar(200),

  -- Niveau du sort TEL QU'INSCRIT SUR CE PARCHEMIN. Un même sort n'a pas le même
  -- niveau selon la classe (Ténèbres profondes est prêtre 3 et magicien 2), et
  -- c'est le niveau inscrit qui fixe le DD du test de niveau de lanceur. On le
  -- stocke au lieu de le relire : le parchemin ne change pas quand le catalogue,
  -- lui, peut être corrigé.
  "niveau_sort" integer,

  -- Niveau de lanceur du parchemin (NLS). C'est lui qui fixe la portée, la durée
  -- et les dégâts du sort qui en sort — pas le niveau du lecteur. NULL = non
  -- précisé, et la fiche le dit plutôt que de supposer le minimum.
  "niveau_lanceur" integer,

  -- 'profane' | 'divin'. Détermine qui peut le lire sans Utilisation d'objets
  -- magiques. Déduit de la liste de classes du sort quand on le choisit, mais
  -- stocké : un parchemin divin d'un sort présent dans les deux listes existe.
  "type" varchar(10),

  -- Plusieurs exemplaires du même parchemin se cumulent sur une ligne, comme les
  -- gemmes. 0 = lu, la ligne reste pour mémoire (le joueur la jette avec ✕).
  "quantite" integer NOT NULL DEFAULT 1,

  "notes" text
);

CREATE INDEX IF NOT EXISTS "idx_character_scrolls_personnage"
  ON "character_scrolls" ("personnage_id");

-- ── Déménagement des parchemins déjà saisis ─────────────────────────────────
-- Relevé le 2026-10-25 avant d'écrire : 89 entrées dans `potions`, dont 2 dont
-- le nom commence par « Parchemin » (ids 100 et 101), et UNE seule ligne
-- d'inventaire — celle de Cormac, à 0 charge, lue pendant la partie du jour.
-- Le déménagement est fait par `scripts/migrer-parchemins.mjs`, qui remesure
-- l'état au lieu de se fier à ces chiffres : ils dataient déjà quand je les ai
-- écrits ici.
