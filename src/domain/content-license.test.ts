import { describe, expect, it } from "vitest";

import {
  detectExpiredLicenses,
  isLicenseExpired,
  type ContentLicenseRecord,
} from "./content-license";

const asOf = new Date("2026-06-24T00:00:00.000Z");

const licenses: ContentLicenseRecord[] = [
  {
    id: "expired-by-date",
    copyrightOwner: "Demo Owner",
    allowedUses: ["internal-development"],
    attribution: "Demo attribution",
    expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    status: "ACTIVE",
  },
  {
    id: "active",
    copyrightOwner: "Demo Owner",
    allowedUses: ["internal-development"],
    attribution: "Demo attribution",
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    status: "ACTIVE",
  },
  {
    id: "terminated",
    copyrightOwner: "Demo Owner",
    allowedUses: ["internal-development"],
    attribution: "Demo attribution",
    status: "TERMINATED",
  },
];

describe("content license expiry", () => {
  it("detects expiration by date and terminal status", () => {
    expect(isLicenseExpired(licenses[0]!, asOf)).toBe(true);
    expect(isLicenseExpired(licenses[1]!, asOf)).toBe(false);
    expect(isLicenseExpired(licenses[2]!, asOf)).toBe(true);
  });

  it("returns only expired licenses", () => {
    expect(
      detectExpiredLicenses(licenses, asOf).map((license) => license.id),
    ).toEqual(["expired-by-date", "terminated"]);
  });
});
