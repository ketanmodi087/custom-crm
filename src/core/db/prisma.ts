import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Cap each serverless instance to 1 DB connection.
 * Supabase Session pooler has a small pool (e.g. 15); without this, Prisma
 * opens many connections per instance and hits EMAXCONNSESSION.
 */
const datasourceUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if (/[?&]connection_limit=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1`;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: { url: datasourceUrl() },
    },
  });

// Reuse client across hot reloads and warm serverless isolates
globalForPrisma.prisma = prisma;
