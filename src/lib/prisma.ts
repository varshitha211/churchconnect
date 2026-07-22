import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createLibsqlAdapter() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    return new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  const dbPath = path.resolve(process.cwd(), "dev.db");
  return new PrismaLibSql({
    url: `file:${dbPath}`,
  });
}

const libsql = createLibsqlAdapter();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: libsql });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
