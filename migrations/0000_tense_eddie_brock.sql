CREATE TABLE "criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"weight" real DEFAULT 20 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"judge_id" integer NOT NULL,
	"project_design" real NOT NULL,
	"functionality" real NOT NULL,
	"presentation" real NOT NULL,
	"web_design" real NOT NULL,
	"impact" real NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" text NOT NULL,
	"name" text NOT NULL,
	"project" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "participants_participant_id_unique" UNIQUE("participant_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"allow_edit_evaluations" boolean DEFAULT true,
	"show_scores_to_participants" boolean DEFAULT false,
	"require_comments" boolean DEFAULT true,
	"auto_logout" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'judge' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
