import "dotenv/config";

import { getErrorMessage, isKnownDatabaseUnavailable } from "../src/lib/database-errors";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Prisma database connection succeeded.");
}

main()
  .catch((error: unknown) => {
    console.error("Prisma database connection failed.");
    if (isKnownDatabaseUnavailable(error)) {
      console.error("PostgreSQL is unavailable. Start it with: docker compose up -d postgres");
      const firstMessageLine = getErrorMessage(error)
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean);

      if (firstMessageLine) {
        console.error(firstMessageLine);
      }
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
