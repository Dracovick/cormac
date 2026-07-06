CREATE TABLE "character_journal" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnage_id" integer,
	"type" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"valeur" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_journal" ADD CONSTRAINT "character_journal_personnage_id_characters_id_fk" FOREIGN KEY ("personnage_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;
