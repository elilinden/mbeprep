export type ContentLicenseStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"
  | "ARCHIVED";

export type ContentLicenseRecord = {
  id: string;
  copyrightOwner: string;
  allowedUses: readonly string[];
  attribution: string;
  expiresAt?: Date | null;
  status: ContentLicenseStatus;
};

export function isLicenseExpired(license: ContentLicenseRecord, asOf: Date) {
  if (license.status === "EXPIRED" || license.status === "TERMINATED") {
    return true;
  }

  return (
    license.expiresAt != null && license.expiresAt.getTime() < asOf.getTime()
  );
}

export function detectExpiredLicenses(
  licenses: readonly ContentLicenseRecord[],
  asOf: Date,
) {
  return licenses.filter((license) => isLicenseExpired(license, asOf));
}
