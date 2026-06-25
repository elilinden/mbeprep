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

test("question filters serialize to the URL and restore after reload", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions");

  await page.locator('input[name="q"]').fill("torts");
  await page.waitForURL(/q=torts/);
  await page.locator('select[name="status"]').selectOption("DRAFT");
  await expect(page).toHaveURL(/status=DRAFT/);
  await expect(page.getByRole("status")).toHaveText("1 result");

  await page.reload();
  await expect(page.locator('input[name="q"]')).toHaveValue("torts");
  await expect(page.locator('select[name="status"]')).toHaveValue("DRAFT");
  await expect(
    page.getByRole("button", { name: "Remove Search: torts" }),
  ).toBeVisible();
});

test("question filters can be cleared", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions?status=DRAFT&q=torts");

  await expect(page.locator('select[name="status"]')).toHaveValue("DRAFT");
  await page.getByRole("button", { name: "Clear all" }).click();

  await expect(page).toHaveURL(/\/admin\/questions$/);
  await expect(page.locator('select[name="status"]')).toHaveValue("All");
  await expect(page.locator('input[name="q"]')).toHaveValue("");
});

test("question search announces updated result counts", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions");

  await expect(page.getByRole("status")).toHaveText("9 results");
  await page.locator('input[name="q"]').fill("legal research");
  await expect(page.getByRole("status")).toHaveText(
    /Updating results|1 result/,
  );
  await page.waitForURL(/q=legal\+research/);
  await expect(page.getByRole("status")).toHaveText("1 result");
});

test("question sorting and pagination update URL state", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions");

  await page.getByRole("button", { name: "Sort by Subject" }).click();
  await expect(page).toHaveURL(/sort=subject-asc/);

  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page).not.toHaveURL(/page=2/);
});

test("question row actions reflect workflow state", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions?status=PUBLISHED");

  await page.getByRole("button", { name: "Actions" }).first().click();
  await expect(page.getByRole("menuitem", { name: "Retire" })).toBeVisible();

  await page.goto("/admin/questions?status=DRAFT");
  await page.getByRole("button", { name: "Actions" }).first().click();
  await expect(
    page.getByRole("menuitem", { name: /Submit for review/ }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("menu")
      .getByText("Workflow persistence is not available in this demo."),
  ).toBeVisible();
});

test("question action dialogs manage focus", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions?status=PUBLISHED");

  const actionsButton = page.getByRole("button", { name: "Actions" }).first();
  await actionsButton.click();
  await page.getByRole("menuitem", { name: "Retire" }).click();

  await expect(
    page.getByRole("dialog", { name: "Retire question?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Retire question?" }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(actionsButton).toBeFocused();
});

test("question action menu supports keyboard-only operation", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions?status=PUBLISHED");

  const actionsButton = page.getByRole("button", { name: "Actions" }).first();
  await actionsButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("menuitem", { name: "Preview" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(actionsButton).toBeFocused();
});

test("question management uses a mobile card layout without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "admin");
  await page.goto("/admin/questions");

  await expect(
    page.getByRole("region", { name: "Question results table" }),
  ).toBeHidden();
  await expect(page.getByRole("heading", { name: "Question 1" })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("student is denied server-side access to question management", async ({
  page,
}) => {
  await signIn(page, "learner");
  await page.goto("/admin/questions");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Questions", level: 1 }),
  ).toHaveCount(0);
});

test("question management has no serious axe violations", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/questions");
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
