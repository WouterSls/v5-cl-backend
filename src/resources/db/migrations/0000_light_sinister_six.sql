CREATE TYPE "public"."status_type" AS ENUM('IMPORT', 'BLACKLIST');--> statement-breakpoint
CREATE TABLE "token_preference" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"token_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"status" "status_type" NOT NULL,
	"symbol" text,
	"name" text,
	"decimals" integer,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_preference_wallet_address_token_address_chain_id_unique" UNIQUE("wallet_address","token_address","chain_id")
);
