-- Ordre d'initiative dans la vue du MJ : un seul combat actif à la fois,
-- combattants (PJ et adversaires) en JSON — état de table éphémère.
CREATE TABLE IF NOT EXISTS "combats" (
	"id" serial PRIMARY KEY NOT NULL,
	"statut" varchar(20) DEFAULT 'actif' NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"tour_index" integer DEFAULT 0 NOT NULL,
	"combattants" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
