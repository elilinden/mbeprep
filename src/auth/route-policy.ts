export const authenticatedRoutePrefixes = [
  "/onboarding",
  "/dashboard",
  "/plan",
  "/audio",
  "/practice",
  "/review",
  "/essays",
  "/analytics",
  "/settings",
  "/admin",
] as const;

export function isAuthenticatedRoute(pathname: string) {
  return authenticatedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
