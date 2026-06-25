import { NextResponse } from "next/server";

import { getErrorMessage, isKnownDatabaseUnavailable } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ready",
      database: "ready",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_ready",
        database: "unavailable",
        error: isKnownDatabaseUnavailable(error)
          ? "PostgreSQL is unavailable."
          : getErrorMessage(error),
      },
      { status: 503 },
    );
  }
}
