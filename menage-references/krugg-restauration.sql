-- Filet de securite AVANT toute ecriture liee a Krugg — 2026-08-28T01:56:21.312Z
-- ⛔ Krugg Coeur-Flamboyant EXISTE DEJA : id=82 (joueur Daniel Tarte).
--
-- ══ VOIE A — on a COMPLETE le personnage 82 et on veut revenir en arriere ══
--    Executer la section A ci-dessous, puis la section C (references creees).
--
-- ══ VOIE B — on a CREE un nouveau personnage et on veut revenir en arriere ══
--    npx tsx --env-file=.env.local scripts/import-krugg.ts --rollback=<nouvel id>
--    puis la section C.

-- ─────────────── SECTION A : remettre le personnage 82 a l identique ───────────────
UPDATE characters SET
  nom = 'Krugg Coeur-Flamboyant',
  surnom = NULL,
  photo_url = NULL,
  race_id = 7,
  sexe = 'M',
  taille = '1,88',
  poids = NULL,
  yeux = 'ambre doré.',
  cheveux = 'noirs',
  age = 24,
  alignement = 'CB',
  dieu_id = 25,
  clan_id = NULL,
  xp = 19500,
  historique = NULL,
  notes = 'Très musclé, cicatrices bras et torse, canines visibles modérées
Dieu: Kord: force, du courage et du combatCouleur de peau : Gris olive foncéCheveux noirs et épais, tresses avec anneauxregard intense, animé d’une foi brûlante et d’un esprit indomptableVoit dans le noir à 20 m',
  joueur_prenom = 'Daniel',
  joueur_nom = 'Tarte'
WHERE id = 82;

DELETE FROM character_classes WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_classes (id, personnage_id, classe_id, niveau) VALUES (215, 82, 5, 6);
DELETE FROM character_ability_scores WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_ability_scores (id, personnage_id, for_base, for_magique, dex_base, dex_magique, con_base, con_magique, int_base, int_magique, sag_base, sag_magique, cha_base, cha_magique) VALUES (82, 82, 18, 0, 10, 0, 12, 0, 8, 0, 16, 0, 16, 0);
DELETE FROM character_combat_stats WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_combat_stats (id, personnage_id, pv_max, pv_actuels, ca_base, ca_arme, ca_bouclier, ca_naturelle, ca_deflexion, ca_divers, deplacement, karma, initiative_bonus, bba_corps_a_corps, bba_projectiles, domaine1, domaine2) VALUES (82, 82, 52, 47, 10, 8, 0, 0, 0, 2, 10, 6, 0, 4, 4, NULL, NULL);
DELETE FROM character_saving_throws WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_saving_throws (id, personnage_id, reflexes_base, reflexes_magique, vigueur_base, vigueur_magique, volonte_base, volonte_magique) VALUES (82, 82, 2, 1, 5, 1, 5, 1);
DELETE FROM character_skills WHERE personnage_id = 82;   -- 4 ligne(s) a restaurer
INSERT INTO character_skills (id, personnage_id, skill_id, rangs_investis, modif_divers) VALUES (1229, 82, 15, 1, 0);
INSERT INTO character_skills (id, personnage_id, skill_id, rangs_investis, modif_divers) VALUES (1230, 82, 181, 2, 0);
INSERT INTO character_skills (id, personnage_id, skill_id, rangs_investis, modif_divers) VALUES (1231, 82, 3, 5, 0);
INSERT INTO character_skills (id, personnage_id, skill_id, rangs_investis, modif_divers) VALUES (1232, 82, 191, 2, 0);
DELETE FROM character_feats WHERE personnage_id = 82;   -- 3 ligne(s) a restaurer
INSERT INTO character_feats (id, personnage_id, feat_id, notes) VALUES (1492, 82, 13, NULL);
INSERT INTO character_feats (id, personnage_id, feat_id, notes) VALUES (1493, 82, 467, NULL);
INSERT INTO character_feats (id, personnage_id, feat_id, notes) VALUES (1494, 82, 468, NULL);
DELETE FROM character_weapons WHERE personnage_id = 82;   -- 3 ligne(s) a restaurer
INSERT INTO character_weapons (id, personnage_id, arme_id, bonus_magique, proprietes_speciales, quantite, cote_de_force, bonus_munitions) VALUES (513, 82, 157, 0, NULL, 1, NULL, NULL);
INSERT INTO character_weapons (id, personnage_id, arme_id, bonus_magique, proprietes_speciales, quantite, cote_de_force, bonus_munitions) VALUES (514, 82, 158, 0, NULL, 1, NULL, NULL);
INSERT INTO character_weapons (id, personnage_id, arme_id, bonus_magique, proprietes_speciales, quantite, cote_de_force, bonus_munitions) VALUES (515, 82, 159, 0, NULL, 1, NULL, NULL);
DELETE FROM character_armor WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_magic_items WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_magic_items (id, personnage_id, objet_id, emplacement, notes, charges_restantes) VALUES (806, 82, 71, NULL, NULL, NULL);
DELETE FROM character_currency WHERE personnage_id = 82;   -- 1 ligne(s) a restaurer
INSERT INTO character_currency (id, personnage_id, po, pa, pc, pe, pm, pp) VALUES (82, 82, '0.00', '0.00', '0.00', '0.00', '0.00', '0.00');
DELETE FROM character_languages WHERE personnage_id = 82;   -- 2 ligne(s) a restaurer
INSERT INTO character_languages (id, personnage_id, langue_id) VALUES (480, 82, 14);
INSERT INTO character_languages (id, personnage_id, langue_id) VALUES (481, 82, 27);
DELETE FROM character_companions WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_notes WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_journal WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_potions WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_spells WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_spell_effects WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer
DELETE FROM character_creatures WHERE personnage_id = 82;   -- 0 ligne(s) a restaurer

-- Les 3 armes de Krugg (tables weapons — une ligne PAR PERSONNAGE, pas un catalogue)
UPDATE weapons SET nom = 'Dague lancée', categorie_id = NULL, degats = '1d4', critique_min = 20, critique_mult = 2, portee = NULL, type_degats = NULL, taille = NULL, poids = NULL, prix = NULL, description = NULL WHERE id = 157;
UPDATE weapons SET nom = 'Dague frappée', categorie_id = NULL, degats = '1d4', critique_min = 20, critique_mult = 2, portee = NULL, type_degats = NULL, taille = NULL, poids = NULL, prix = NULL, description = NULL WHERE id = 158;
UPDATE weapons SET nom = 'Épée à deux mains', categorie_id = NULL, degats = '2d6', critique_min = 20, critique_mult = 2, portee = NULL, type_degats = NULL, taille = NULL, poids = NULL, prix = NULL, description = NULL WHERE id = 159;

-- ─────────────── SECTION C : references creees APRES cet instant ───────────────
-- ⛔ A n executer que si l operation est abandonnee, et dans cet ordre.
DELETE FROM clans WHERE id > 2;   -- clans comptait 2 lignes, max(id)=2
DELETE FROM skills WHERE id > 191;   -- skills comptait 88 lignes, max(id)=191
DELETE FROM feats WHERE id > 480;   -- feats comptait 477 lignes, max(id)=480
DELETE FROM weapons WHERE id > 174;   -- weapons comptait 174 lignes, max(id)=174
DELETE FROM armor WHERE id > 5;   -- armor comptait 5 lignes, max(id)=5
DELETE FROM magic_items WHERE id > 274;   -- magic_items comptait 274 lignes, max(id)=274
DELETE FROM potions WHERE id > 12;   -- potions comptait 12 lignes, max(id)=12

-- Verification apres restauration : ces comptes doivent etre retrouves
--   clans = 2
--   skills = 88
--   feats = 477
--   weapons = 174
--   armor = 5
--   magic_items = 274
--   potions = 12
--   characters = 71
--   character_classes = 81
--   character_ability_scores = 71
--   character_combat_stats = 71
--   character_saving_throws = 71
--   character_skills = 509
--   character_feats = 502
--   character_weapons = 193
--   character_armor = 4
--   character_magic_items = 87
--   character_currency = 71
--   character_languages = 158
--   character_companions = 4
--   character_notes = 38
--   character_journal = 61
--   character_potions = 9
--   character_spells = 197
--   character_spell_effects = 4
--   character_creatures = 1