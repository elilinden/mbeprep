import { env } from "@/env/server";

let developmentDatabaseWarningEmitted = false;

export function isKnownDatabaseUnavailable(error: unknown) {
  if (hasErrorCode(error, "ECONNREFUSED") || hasErrorCode(error, "P1001")) {
    return true;
  }

  const message = getErrorMessage(error);

  return (
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("P1001")
  );
}

function hasErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export function handleDevelopmentDatabaseFallback(input: {
  area: string;
  error: unknown;
}) {
  if (env.NODE_ENV === "production" || !isKnownDatabaseUnavailable(input.error)) {
    throw input.error;
  }

  if (!developmentDatabaseWarningEmitted) {
    developmentDatabaseWarningEmitted = true;
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "database_unavailable_development_fallback",
        area: input.area,
        message:
          "PostgreSQL is unavailable; using the development-only in-memory fallback for eligible local flows.",
      }),
    );
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
