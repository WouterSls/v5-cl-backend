import { pgTable, serial, text, integer, timestamp, unique, pgEnum } from "drizzle-orm/pg-core";

export const tokenStatusEnum = pgEnum("status_type", ["IMPORT", "BLACKLIST"]);

export const token = pgTable("token_preference", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  tokenAddress: text("token_address").notNull(),
  chainId: integer("chain_id").notNull(),
  status: tokenStatusEnum("status").notNull(),
  symbol: text("symbol"),
  name: text("name"),
  decimals: integer("decimals"),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.walletAddress, table.tokenAddress, table.chainId),
]);

export type SelectToken = typeof token.$inferSelect;
export type InsertToken = typeof token.$inferInsert;