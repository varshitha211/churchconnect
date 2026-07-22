import "dotenv/config";
import { defineConfig } from "prisma/config";

const tursoUrl = process.env["TURSO_DATABASE_URL"];
const dbUrl = tursoUrl || process.env["DATABASE_URL"] || "file:./dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.mts",
  },
  datasource: {
    url: dbUrl,
  },
});
