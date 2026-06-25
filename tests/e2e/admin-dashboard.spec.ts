import { expect, type Page, test } from "@playwright/test";
import axe from "axe-core";

async function signIn(page: Page, user: "learner" | "admin") {
  await page.goto("/login");
  await page
    .getByRole("button", {
      name:
        user === "admin"
          ? "Continue as Development Administrator"
          : "Continue as Development Learner",
    })
    .click();
  await page.waitForURL(/\/(onboarding|dashboard)/);
}

test("admin overview metrics link to filtered destinations", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Content operations", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Pending review:/ }),
  ).toHaveAttribute("href", "/admin/questions?status=LEGAL_REVIEW");
  await expect(
    page.getByRole("link", { name: /Draft content:/ }),
  ).toHaveAttribute("href", "/admin/questions?status=DRAFT");
  await expect(
    page.getByRole("link", { name: /Published content:/ }),
  ).toHaveAttribute("href", "/admin/questions?status=PUBLISHED");
  await expect(
    page.getByRole("link", { name: /Open reports:/ }),
  ).toHaveAttribute("href", "#content-reports");
});

test("admin overview moves full question management to /admin/questions", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/admin");

  await expect(
    page.getByRole("region", { name: "Question versions table" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "No recent activity" }),
  ).toBeVisible();

  await page.goto("/admin/questions?status=DRAFT");
  await expect(
    page.getByRole("heading", { name: "Questions", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Question results table" }),
  ).toBeVisible();
  await expect(page.locator('select[name="status"]')).toHaveValue("DRAFT");
});

test("create content menu is keyboard accessible", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin");

  const menu = page.locator("summary").filter({ hasText: "Create content" });
  const menuGroup = page
    .locator("details")
    .filter({ hasText: "Create content" });
  await menu.press("Enter");
  await expect(
    menuGroup.getByRole("link", { name: "Create question" }),
  ).toBeVisible();
  await expect(
    menuGroup.getByRole("link", { name: "Create essay" }),
  ).toBeVisible();
  await expect(
    menuGroup.getByRole("link", { name: "Upload podcast" }),
  ).toBeVisible();
});

test("student is denied server-side access to admin overview", async ({
  page,
}) => {
  await signIn(page, "learner");
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Content operations" }),
  ).toHaveCount(0);
});

test("admin overview has no mobile overflow and no nested controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "admin");
  await page.goto("/admin");

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const nestedInteractiveCount = await page.evaluate(
    () =>
      document.querySelectorAll(
        "a a, a button, a input, button a, button button, summary a, summary button",
      ).length,
  );
  expect(nestedInteractiveCount).toBe(0);
});

test("admin overview has no serious axe violations", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin");
  await page.addScriptTag({ content: axe.source });

  const results = await page.evaluate(async () => {
    const axeRunner = (
      window as typeof window & {
        axe: {
          run: (context: Document) => Promise<{
            violations: Array<{ impact: string | null }>;
          }>;
        };
      }
    ).axe;

    return await axeRunner.run(document);
  });
  const seriousViolations = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );

  expect(seriousViolations).toEqual([]);
});
