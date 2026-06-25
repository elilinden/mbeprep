import { expect, test, type Page } from "@playwright/test";

test("student writes, submits, reviews, self-assesses, and creates review item", async ({
  page,
}) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/essays");

  await expect(
    page.getByRole("heading", { name: "Timed Writing Practice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start essay" }).click();
  await expect(page).toHaveURL(/\/essays\/essay-attempt-/);

  const attemptId = page.url().split("/").at(-1) ?? "";
  const forbiddenBeforeSubmit = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return `${response.status}:${await response.text()}`;
  }, `/api/essays/${attemptId}/review`);
  const html = await page.content();

  expect(forbiddenBeforeSubmit).toContain("403");
  for (const forbidden of [
    "sampleAnswer",
    "issueChecklist",
    "maxPoints",
    "ruleStatement",
    "factApplicationGuidance",
    "DEMO_NOT_FOR_PUBLICATION sample answer placeholder",
  ]) {
    expect(forbiddenBeforeSubmit).not.toContain(forbidden);
    expect(html).not.toContain(forbidden);
  }

  await page.getByLabel("Outline").fill("DEMO_NOT_FOR_PUBLICATION outline");
  await page
    .getByLabel("Answer")
    .fill("DEMO_NOT_FOR_PUBLICATION student essay answer");
  await expect(page.getByText("Local backup saved")).toBeVisible();
  await expect(page.getByText("Word count")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Server saved")).toBeVisible();

  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Submit this essay");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Submit essay" }).click();

  await expect(
    page.getByRole("heading", { name: "Essay Review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sample Answer" }),
  ).toBeVisible();
  await expect(
    page.getByText("DEMO_NOT_FOR_PUBLICATION sample answer placeholder"),
  ).toBeVisible();
  await expect(page.getByText("Rubric Self-Assessment")).toBeVisible();

  await page.getByLabel("Mark as missed").first().check();
  await page
    .getByLabel("Notes")
    .fill("DEMO_NOT_FOR_PUBLICATION missed issue note");
  await page.getByRole("button", { name: "Save self-assessment" }).click();

  await expect(
    page.getByText("Missed issues were added to the review system."),
  ).toBeVisible();
  await page.getByRole("link", { name: "View analytics" }).click();
  await page.waitForURL(/\/analytics/);
  await expect(
    page.getByRole("heading", { name: "Automatic Error Notebook" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Formation · Essay rubric item missed."),
  ).toBeVisible();
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
  await page.getByLabel("Jurisdiction").fill("UBE");
  await page.getByLabel("Exam date").fill("2026-07-28");
  await page.getByRole("button", { name: "Resolve track" }).click();
  await expect(page).toHaveURL(/jurisdiction=UBE/);
  await expect(page.getByRole("heading", { name: "Legacy Ube" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page
    .getByLabel("I confirm this is the exam track I am preparing for.")
    .check();
  await page.getByLabel("Time zone").fill("America/Los_Angeles");
  await page.getByLabel("Study start date").fill("2026-06-24");
  await page.getByLabel("Wednesday available minutes").fill("60");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.waitForURL(/\/dashboard/);
}
