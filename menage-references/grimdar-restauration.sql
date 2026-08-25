-- Filet de securite AVANT l import de Grimdar — 2026-08-25T14:28:32.035Z
--
-- 1) Annuler le personnage et ses tables filles (voie normale) :
--    npx tsx --env-file=.env.local scripts/import-grimdar.ts --rollback=<id>
--
-- 2) Puis retirer les references creees, que le rollback ne touche PAS.
--    Chaque ligne supprime uniquement ce qui a ete cree APRES cet instant.
--    ⛔ A n executer que si l import est abandonne, et dans cet ordre.

DELETE FROM clans WHERE id > 1;   -- clans comptait 1 lignes, max(id)=1
DELETE FROM skills WHERE id > 191;   -- skills comptait 104 lignes, max(id)=191
DELETE FROM feats WHERE id > 478;   -- feats comptait 478 lignes, max(id)=478
DELETE FROM weapons WHERE id > 170;   -- weapons comptait 170 lignes, max(id)=170
DELETE FROM armor WHERE id > 4;   -- armor comptait 4 lignes, max(id)=4
DELETE FROM magic_items WHERE id > 272;   -- magic_items comptait 272 lignes, max(id)=272

-- Verification apres restauration : ces comptes doivent etre retrouves
--   clans = 1
--   skills = 104
--   feats = 478
--   weapons = 170
--   armor = 4
--   magic_items = 272
--   characters = 70
--   character_classes = 80
--   character_ability_scores = 70
--   character_combat_stats = 70
--   character_saving_throws = 70
--   character_skills = 510
--   character_feats = 509
--   character_weapons = 189
--   character_armor = 3
--   character_magic_items = 84
--   character_currency = 70
--   character_languages = 156
--   character_companions = 2
--   character_notes = 37
--   character_journal = 61
--   character_potions = 9
--   character_spells = 197
--   character_spell_effects = 4
--   character_creatures = 1