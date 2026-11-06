import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { PrismaClient } from "@prisma/client";

// Existing shell variables take precedence over the local Prisma environment.
if (existsSync(".env")) loadEnvFile(".env");

const prisma = new PrismaClient();

try {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const [connection] = await tx.$queryRaw`
      SELECT current_database() AS database, current_setting('server_version') AS version
    `;
    const healthRows = await tx.databaseHealthCheck.count();
    const migrations = await tx.$queryRaw`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY migration_name
    `;
    return { ...connection, healthRows, migrations };
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Database check failed (${error.code ?? error.name}). Check the local database and DATABASE_URL.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
