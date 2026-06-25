CREATE TABLE "clans" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"race_id" integer,
	"description" text,
	CONSTRAINT "clans_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "class_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"classe_id" integer NOT NULL,
	"niveau" integer NOT NULL,
	"nom" varchar(200) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "class_skill_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"classe_id" integer NOT NULL,
	"skill_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"de_vie" varchar(10) NOT NULL,
	"bba_progression" varchar(20) NOT NULL,
	"vigueur_progression" varchar(20) NOT NULL,
	"reflexes_progression" varchar(20) NOT NULL,
	"volonte_progression" varchar(20) NOT NULL,
	"competences_par_niveau" integer NOT NULL,
	"description" text,
	CONSTRAINT "classes_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "gods" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"alignement" varchar(30),
	"domaines" text,
	"arme_de_preference" varchar(100),
	"description" text,
	CONSTRAINT "gods_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"script" varchar(100),
	CONSTRAINT "languages_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"bonus_for" integer DEFAULT 0,
	"bonus_dex" integer DEFAULT 0,
	"bonus_con" integer DEFAULT 0,
	"bonus_int" integer DEFAULT 0,
	"bonus_sag" integer DEFAULT 0,
	"bonus_cha" integer DEFAULT 0,
	"taille" varchar(20) DEFAULT 'Moyenne',
	"deplacement_base" integer DEFAULT 9,
	"vision_nocturne" boolean DEFAULT false,
	"description" text,
	CONSTRAINT "races_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "racial_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"race_id" integer NOT NULL,
	"nom" varchar(200) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	"nom_en" varchar(100),
	"caracteristique" varchar(10) NOT NULL,
	"formation_requise" boolean DEFAULT false,
	"description" text,
	CONSTRAINT "skills_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "feats" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"categorie" varchar(100),
	"prerequis" text,
	"description" text,
	"effet_mecanique" text,
	CONSTRAINT "feats_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "spell_class_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"sort_id" integer NOT NULL,
	"classe_id" integer NOT NULL,
	"niveau" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spells" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"ecole" varchar(100),
	"composantes" varchar(50),
	"portee" varchar(100),
	"duree" varchar(100),
	"zone_effet" varchar(100),
	"jet_de_sauvegarde" varchar(100),
	"resistance_magique" varchar(50),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "armor" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"type" varchar(50),
	"bonus_armure" integer DEFAULT 0,
	"max_dex" integer,
	"malus_competence" integer DEFAULT 0,
	"risque_echec_magique" integer DEFAULT 0,
	"deplacement" integer,
	"poids" numeric(6, 2),
	"prix" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "art_objects" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"valeur" numeric(10, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"categorie" varchar(100),
	"poids" numeric(6, 2),
	"prix" numeric(10, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "gems" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"valeur_base" numeric(10, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "magic_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"type" varchar(100),
	"emplacement" varchar(100),
	"bonus" integer,
	"aura_magique" varchar(100),
	"niveau_lanceur" integer,
	"prix" numeric(10, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "potions" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"sort_effet" varchar(200),
	"niveau" integer,
	"charges_max" integer DEFAULT 1,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "weapon_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	CONSTRAINT "weapon_categories_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "weapons" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"categorie_id" integer,
	"degats" varchar(30),
	"critique_min" integer DEFAULT 20,
	"critique_mult" integer DEFAULT 2,
	"portee" integer,
	"type_degats" varchar(50),
	"taille" varchar(20),
	"poids" numeric(6, 2),
	"prix" numeric(10, 2),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "creature_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(100) NOT NULL,
	CONSTRAINT "creature_types_nom_unique" UNIQUE("nom")
);
--> statement-breakpoint
CREATE TABLE "creatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"type_id" integer,
	"taille" varchar(20),
	"de_vie" varchar(30),
	"ca" integer,
	"deplacement" integer,
	"for" integer,
	"dex" integer,
	"con" integer,
	"int" integer,
	"sag" integer,
	"cha" integer,
	"attaques" text,
	"competences" text,
	"dons" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "character_ability_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"for_base" integer DEFAULT 10,
	"for_magique" integer DEFAULT 0,
	"dex_base" integer DEFAULT 10,
	"dex_magique" integer DEFAULT 0,
	"con_base" integer DEFAULT 10,
	"con_magique" integer DEFAULT 0,
	"int_base" integer DEFAULT 10,
	"int_magique" integer DEFAULT 0,
	"sag_base" integer DEFAULT 10,
	"sag_magique" integer DEFAULT 0,
	"cha_base" integer DEFAULT 10,
	"cha_magique" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_armor" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"armure_id" integer NOT NULL,
	"bonus_magique" integer DEFAULT 0,
	"est_portee" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "character_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"classe_id" integer NOT NULL,
	"niveau" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_combat_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"pv_max" integer DEFAULT 0,
	"pv_actuels" integer DEFAULT 0,
	"ca_base" integer DEFAULT 10,
	"ca_arme" integer DEFAULT 0,
	"ca_bouclier" integer DEFAULT 0,
	"ca_naturelle" integer DEFAULT 0,
	"ca_deflexion" integer DEFAULT 0,
	"ca_divers" integer DEFAULT 0,
	"deplacement" integer DEFAULT 9,
	"karma" integer DEFAULT 0,
	"initiative_bonus" integer DEFAULT 0,
	"bba_corps_a_corps" integer DEFAULT 0,
	"bba_projectiles" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_companions" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"nom" varchar(200) NOT NULL,
	"race" varchar(100),
	"classe" varchar(100),
	"joueur" varchar(200),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "character_creatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"creature_id" integer,
	"nom_personnalise" varchar(200),
	"role" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "character_currency" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"po" numeric(10, 2) DEFAULT '0',
	"pa" numeric(10, 2) DEFAULT '0',
	"pc" numeric(10, 2) DEFAULT '0',
	"pe" numeric(10, 2) DEFAULT '0',
	"pm" numeric(10, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "character_feats" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"feat_id" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "character_languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"langue_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_magic_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"objet_id" integer NOT NULL,
	"emplacement" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "character_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"titre" varchar(200),
	"contenu" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "character_potions" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"potion_id" integer NOT NULL,
	"charges_restantes" integer DEFAULT 1,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "character_saving_throws" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"reflexes_base" integer DEFAULT 0,
	"reflexes_magique" integer DEFAULT 0,
	"vigueur_base" integer DEFAULT 0,
	"vigueur_magique" integer DEFAULT 0,
	"volonte_base" integer DEFAULT 0,
	"volonte_magique" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"rangs_investis" integer DEFAULT 0,
	"modif_divers" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_spells" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"sort_id" integer NOT NULL,
	"est_prepare" integer DEFAULT 0,
	"est_connu" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "character_weapons" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"arme_id" integer NOT NULL,
	"bonus_magique" integer DEFAULT 0,
	"proprietes_speciales" text,
	"quantite" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"nom" varchar(200) NOT NULL,
	"surnom" varchar(200),
	"race_id" integer,
	"sexe" varchar(20),
	"taille" varchar(20),
	"poids" integer,
	"yeux" varchar(50),
	"cheveux" varchar(50),
	"age" integer,
	"alignement" varchar(50),
	"dieu_id" integer,
	"clan_id" integer,
	"xp" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clans" ADD CONSTRAINT "clans_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_features" ADD CONSTRAINT "class_features_classe_id_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_skill_list" ADD CONSTRAINT "class_skill_list_classe_id_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racial_features" ADD CONSTRAINT "racial_features_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spell_class_levels" ADD CONSTRAINT "spell_class_levels_sort_id_spells_id_fk" FOREIGN KEY ("sort_id") REFERENCES "public"."spells"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_categorie_id_weapon_categories_id_fk" FOREIGN KEY ("categorie_id") REFERENCES "public"."weapon_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_type_id_creature_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."creature_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_ability_scores" ADD CONSTRAINT "character_ability_scores_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_armor" ADD CONSTRAINT "character_armor_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_classes" ADD CONSTRAINT "character_classes_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_classes" ADD CONSTRAINT "character_classes_classe_id_classes_id_fk" FOREIGN KEY ("classe_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_combat_stats" ADD CONSTRAINT "character_combat_stats_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_companions" ADD CONSTRAINT "character_companions_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_creatures" ADD CONSTRAINT "character_creatures_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_creatures" ADD CONSTRAINT "character_creatures_creature_id_creatures_id_fk" FOREIGN KEY ("creature_id") REFERENCES "public"."creatures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_currency" ADD CONSTRAINT "character_currency_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_feats" ADD CONSTRAINT "character_feats_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_languages" ADD CONSTRAINT "character_languages_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_magic_items" ADD CONSTRAINT "character_magic_items_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_notes" ADD CONSTRAINT "character_notes_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_potions" ADD CONSTRAINT "character_potions_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_saving_throws" ADD CONSTRAINT "character_saving_throws_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_spells" ADD CONSTRAINT "character_spells_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_weapons" ADD CONSTRAINT "character_weapons_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_dieu_id_gods_id_fk" FOREIGN KEY ("dieu_id") REFERENCES "public"."gods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_clan_id_clans_id_fk" FOREIGN KEY ("clan_id") REFERENCES "public"."clans"("id") ON DELETE no action ON UPDATE no action;