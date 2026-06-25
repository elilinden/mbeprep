import { expect, test } from "@playwright/test";

test("development sign-in, onboarding, and dashboard redirect", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page
    .getByRole("button", { name: /Continue as Development Learner/ })
    .click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.getByLabel("Jurisdiction").fill("UBE");
  await page.getByLabel("Exam date").fill("2026-07-28");
  await page.getByRole("button", { name: "Resolve track" }).click();

  await expect(page).toHaveURL(/jurisdiction=UBE/);
  await expect(page.getByRole("heading", { name: "Legacy Ube" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const confirmation = page.getByLabel(
    "I confirm this is the exam track I am preparing for.",
  );
  await confirmation.check();
  await expect(confirmation).toBeChecked();
  await page.getByLabel("Time zone").fill("America/Los_Angeles");
  await page.getByLabel("Study start date").fill("2026-06-24");
  await page.getByLabel("Extended-time multiplier").fill("1.5");
  await page.getByLabel("Wednesday available minutes").fill("60");
  await page.getByLabel("Preferred text size").selectOption("LARGE");
  await page.getByLabel("High contrast").check();
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await expect(page.getByText("60 minutes available today.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Edit onboarding" }),
  ).toBeVisible();
});
