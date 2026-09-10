CREATE TABLE "character_gems" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer NOT NULL,
	"nom" varchar(200) NOT NULL,
	"quantite" integer DEFAULT 1,
	"valeur" numeric(12, 2) DEFAULT '0',
	"unite" varchar(4) DEFAULT 'po',
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "character_gems" ADD CONSTRAINT "character_gems_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;