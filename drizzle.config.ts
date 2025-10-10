import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/resources/db/schema.ts",
  out: "./src/resources/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});