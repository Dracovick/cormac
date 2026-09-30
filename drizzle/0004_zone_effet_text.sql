-- zone_effet passait par varchar(100) : 10 sorts y avaient leur zone d'effet
-- coupée en plein mot depuis l'import d'origine. La colonne passe en text.
ALTER TABLE "spells" ALTER COLUMN "zone_effet" SET DATA TYPE text;
