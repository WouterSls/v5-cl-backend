ALTER TABLE "token_preference" RENAME TO "token";--> statement-breakpoint
ALTER TABLE "token" DROP CONSTRAINT "token_preference_wallet_address_token_address_chain_id_unique";--> statement-breakpoint
ALTER TABLE "token" ADD CONSTRAINT "token_wallet_address_token_address_chain_id_unique" UNIQUE("wallet_address","token_address","chain_id");