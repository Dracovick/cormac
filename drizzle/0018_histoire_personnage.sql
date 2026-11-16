-- L'HISTOIRE DU PERSONNAGE — UN LIEU À ÉCRIRE, PAS UN CHAMP À REMPLIR.
--
-- André, le 2026-11-15 : « J'aimerais développer une section dans le grimoire
-- pour l'histoire des personnages. Quelque chose de différent de leur fiche de
-- personnage. Un lien dans la fiche du personnage qui amène à son histoire
-- détaillée que le joueur pourrait écrire et où l'on pourrait déposer l'histoire
-- d'Azadrielle. »
--
-- ── Ce qui existait, mesuré avant d'écrire une ligne ───────────────────────
-- `characters.historique` (text) existe depuis la migration add-historique. Il
-- EST modifiable — dans `Modifier` → onglet « Notes », un textarea de 6 lignes
-- à côté des compagnons et des quêtes en cours — et il s'affiche sur la fiche
-- en un seul bloc `whitespace-pre-wrap`, sans titres, sans sommaire. Il n'est
-- PAS sur la feuille imprimée (vérifié : aucune occurrence dans
-- `personnage/[id]/imprimer`).
-- ⛔ Ce champ n'est donc pas un début d'histoire : c'est un résumé. L'histoire
-- d'Azadrielle fait près de 20 000 caractères et neuf sections titrées — elle y
-- tiendrait et serait illisible.
--
-- ── Pourquoi des CHAPITRES et pas une seule colonne de texte long ──────────
-- Une histoire de personnage ne s'écrit pas d'un coup : elle s'allonge à chaque
-- séance. « Ce qui s'est passé à Eauprofonde » s'ajoute après coup sans toucher
-- à « Mon village ». Un seul grand texte obligerait à relire 20 000 caractères
-- pour ajouter un paragraphe, et sur un iPad au crayon c'est rédhibitoire.
-- ⭐ Et un chapitre unique reste possible : la table n'impose aucune découpe à
-- qui veut tout écrire d'un trait.
--
-- ── Les colonnes, et ce que chacune veut dire ──────────────────────────────
-- `titre`     — le titre du chapitre, qui DRESSE le sommaire de la page. Non
--               nul : un chapitre sans titre ne se navigue pas. Les écrans
--               refusent la chaîne vide (voir `lib/histoire.ts`).
-- `contenu`   — la prose. Texte libre, rendu avec une mise en forme légère
--               (paragraphes, ### sous-titres, **gras**, > répliques, - listes)
--               interprétée à l'AFFICHAGE, jamais stockée en HTML : ce que le
--               joueur a tapé reste exactement ce qu'il a tapé.
-- `ordre`     — rang d'affichage, 0 d'abord. Des entiers espacés auraient permis
--               d'insérer sans réécrire les voisins, mais le réordonnancement
--               se fait ici par échange de deux rangs voisins (↑ ↓) : la suite
--               reste compacte et lisible en base, ce qui compte le jour où on
--               vient lire la table à la main.
-- `signature` — qui a écrit, retenu SUR L'APPAREIL (clé `cormac.joueur`), même
--               mécanisme que l'identification du MJ du 2026-11-09. ⚠ NULL est
--               permis et fréquent : le Grimoire n'a qu'un seul mot de passe
--               partagé, il ne SAIT pas qui écrit. Un nom inventé serait pire
--               que pas de nom.
-- `updated_at` — affiché sous le chapitre (« revu le … »). C'est la seule trace
--               de fraîcheur d'un texte qui vit des mois.
--
-- ⛔ Ce que cette table n'est PAS : le journal de partie. Le journal est la
-- chronique de ce qui se JOUE, horodatée par le MJ, et il a ses propres tables.
-- L'histoire est le récit du joueur sur son personnage, réécrit à volonté.
-- ⛔ Et elle ne remplace pas `characters.historique`, qui reste le résumé court
-- lu sur la fiche. La page d'histoire sait le reprendre comme premier chapitre
-- d'un geste, sans l'effacer.
CREATE TABLE IF NOT EXISTS "character_story_chapters" (
  "id"            serial PRIMARY KEY NOT NULL,
  "personnage_id" integer NOT NULL REFERENCES "characters"("id"),
  "titre"         varchar(200) NOT NULL,
  "contenu"       text NOT NULL DEFAULT '',
  "ordre"         integer NOT NULL DEFAULT 0,
  "signature"     varchar(60),
  "created_at"    timestamp DEFAULT now(),
  "updated_at"    timestamp DEFAULT now()
);

-- La page d'histoire lit TOUS les chapitres d'un personnage, dans l'ordre : cet
-- index porte les deux colonnes du `where` et du `order by`.
CREATE INDEX IF NOT EXISTS "idx_character_story_personnage"
  ON "character_story_chapters" ("personnage_id", "ordre");
