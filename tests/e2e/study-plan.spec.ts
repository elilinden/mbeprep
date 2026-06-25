import { expect, test, type Page } from "@playwright/test";

test("completing a task updates the adaptive plan", async ({ page }) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/plan");

  await expect(
    page.getByRole("heading", { name: "Adaptive Calendar" }),
  ).toBeVisible();
  await expect(page.getByText("Why this was assigned").first()).toBeVisible();

  const firstTask = page.locator("article").filter({ hasText: "TODO" }).first();
  await expect(firstTask).toBeVisible();
  const title = await firstTask.locator("h4").first().textContent();
  await firstTask.getByRole("button", { name: "Complete" }).click();

  await expect(
    page.getByText("Task completed. The next assignments"),
  ).toBeVisible();
  await expect(
    page.getByText(title ?? "", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("COMPLETED").first()).toBeVisible();
});

async function signInLearner(page: Page) {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue as Development Learner" })
    .click();
  await page.waitForURL(/\/(onboarding|dashboard)/);
}

async function ensureOnboarded(page: Page) {
  await page.goto("/onboarding");

  const examDate = "2026-07-28";
  await page.getByLabel("Jurisdiction").fill("UBE");
  await page.getByLabel("Exam date").fill(examDate);
  await page.getByRole("button", { name: "Resolve track" }).click();
  await expect(page).toHaveURL(/jurisdiction=UBE/);
  await expect(page.getByRole("heading", { name: "Legacy Ube" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const confirmation = page.getByLabel(
    "I confirm this is the exam track I am preparing for.",
  );
  await confirmation.check();
  await expect(confirmation).toBeChecked();
  await page.getByLabel("Attempt status").selectOption("first-time");
  await page.getByLabel("Time zone").fill("America/New_York");
  await page.getByLabel("Study start date").fill("2026-06-24");
  await page.getByLabel("Monday available minutes").fill("45");
  await page.getByLabel("Tuesday available minutes").fill("45");
  await page.getByLabel("Wednesday available minutes").fill("45");
  await page.getByLabel("Thursday available minutes").fill("45");
  await page.getByLabel("Friday available minutes").fill("45");
  await page.getByLabel("Saturday available minutes").fill("30");
  await page.getByLabel("Sunday available minutes").fill("0");
  await page.getByLabel("Rest day").selectOption("Sunday");
  await page.getByLabel("Extended-time multiplier").fill("1");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.waitForURL(/\/dashboard/);
}
