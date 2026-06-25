import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("pre-submission question payload and page source do not expose answers", async ({
  page,
}) => {
  await signInLearner(page);
  await startSession(page, { mode: "LEARNING", count: "1" });

  await expect(
    page.getByRole("heading", { name: "Question 1 of 1" }),
  ).toBeVisible();
  const sessionId = sessionIdFromUrl(page.url());
  const apiPayload = await page.evaluate(async (url) => {
    const response = await fetch(url);
    return response.text();
  }, `/api/practice/questions/${sessionId}/0`);
  const html = await page.content();

  for (const forbidden of [
    "isCorrect",
    "correctChoiceIds",
    "correctAnswer",
    "rationale",
    "distractorType",
    "Correct answer:",
    "DEMO_NOT_FOR_PUBLICATION rationale",
  ]) {
    expect(apiPayload).not.toContain(forbidden);
    expect(html).not.toContain(forbidden);
  }
});

test("wrong answer lowers topic mastery and creates a review item", async ({
  page,
}) => {
  await signInLearner(page);
  await page.goto("/practice/questions");
  await page.getByLabel("Session mode").selectOption("LEARNING");
  await page.getByLabel("Subject").selectOption("Torts");
  await page.getByLabel("Number of questions").fill("1");
  await page.getByRole("button", { name: "Start practice" }).click();

  await page.getByLabel("Choice A").check();
  await page.getByLabel("Confidence").selectOption("HIGH");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Incorrect" })).toBeVisible();

  await page.goto("/analytics");
  const negligenceScore = page.getByRole("heading", {
    name: /Negligence \d+\/100/,
  });
  await expect(negligenceScore).toBeVisible();
  const scoreText = await negligenceScore.textContent();
  const score = Number(scoreText?.match(/(\d+)\/100/)?.[1] ?? "100");
  expect(score).toBeLessThanOrEqual(50);
  await expect(
    page.getByText("Why this score has its value").first(),
  ).toBeVisible();
  await expect(
    page.getByText("Negligence · High-confidence error").first(),
  ).toBeVisible();
  await expect(
    page.getByText("Automatic Error Notebook").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Practice this topic" }).first(),
  ).toBeVisible();
});

test("learning mode reveals explanation after submission", async ({ page }) => {
  await signInLearner(page);
  await startSession(page, { mode: "LEARNING", count: "1" });

  await page.getByLabel("Choice A").check();
  await page.getByLabel("Confidence").selectOption("HIGH");
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByRole("heading", { name: "Correct" })).toBeVisible();
  await expect(page.getByText("Correct answer: A")).toBeVisible();
  await expect(
    page.getByText("DEMO_NOT_FOR_PUBLICATION rationale A"),
  ).toBeVisible();
});

test("NextGen select-two practice supports partial credit", async ({
  page,
}) => {
  await signInLearner(page, "NEXTGEN");
  await page.goto("/practice/questions");
  await page.getByLabel("Session mode").selectOption("LEARNING");
  await page.locator('select[name="category"]').selectOption("Issue spotting");
  await page.getByLabel("Number of questions").fill("1");
  await page.getByRole("button", { name: "Start practice" }).click();

  await expect(page.getByText("SELECT TWO")).toBeVisible();
  await expect(page.getByText("Select exactly two choices.")).toBeVisible();
  await page.getByLabel("Choice A").check();
  await page.getByLabel("Choice C").check();
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByRole("heading", { name: "Incorrect" })).toBeVisible();
  await expect(page.getByText("Score: 1 of 2 points")).toBeVisible();
  await expect(page.getByText("Correct answer: A, B")).toBeVisible();
});

test("NextGen integrated-set practice supports multiple written responses", async ({
  page,
}) => {
  await signInLearner(page, "NEXTGEN");
  await page.goto("/practice/questions");
  await page.getByLabel("Session mode").selectOption("LEARNING");
  await page
    .locator('select[name="category"]')
    .selectOption("Client counseling");
  await page.getByLabel("Number of questions").fill("1");
  await page.getByRole("button", { name: "Start practice" }).click();

  await expect(page.getByText("Common Fact Scenario")).toBeVisible();
  await expect(
    page.getByText("DEMO_NOT_FOR_PUBLICATION legal resource placeholder"),
  ).toBeVisible();
  await page
    .getByLabel("DEMO_NOT_FOR_PUBLICATION short response")
    .fill("DEMO_NOT_FOR_PUBLICATION short response");
  await page
    .getByLabel("DEMO_NOT_FOR_PUBLICATION medium response")
    .fill("DEMO_NOT_FOR_PUBLICATION medium response");
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(page.getByRole("heading", { name: "Correct" })).toBeVisible();
  await expect(page.getByText("Score: 2 of 2 points")).toBeVisible();
  await expect(
    page.getByText("DEMO_NOT_FOR_PUBLICATION rubric-guided response."),
  ).toBeVisible();
});

test("exam mode withholds explanation until end-of-set review", async ({
  page,
}) => {
  await signInLearner(page);
  await startSession(page, { mode: "EXAM", count: "2" });

  await page.getByLabel("Choice A").check();
  await page.getByRole("button", { name: "Submit answer" }).click();

  await expect(
    page.getByRole("heading", { name: "Question 2 of 2" }),
  ).toBeVisible();
  await expect(page.getByText("Correct answer:")).toHaveCount(0);

  await page.getByLabel("Choice B").check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("link", { name: "Review session" }).click();

  await expect(page.getByRole("heading", { name: /Score/ })).toBeVisible();
});

test("refresh and resume preserves flags and choice order", async ({
  page,
}) => {
  await signInLearner(page);
  await startSession(page, { mode: "CUSTOM", count: "1" });

  const choicesBefore = await page.locator("fieldset label").allTextContents();
  await page.getByRole("button", { name: "Flag" }).click();
  await expect(page.getByRole("button", { name: "Unflag" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "Unflag" })).toBeVisible();
  await expect(page.locator("fieldset label")).toHaveText(choicesBefore);
});

test("duplicate submission is idempotent", async ({ page }) => {
  await signInLearner(page);
  await startSession(page, { mode: "LEARNING", count: "1" });

  await page.getByLabel("Choice A").check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Correct" })).toBeVisible();
  await page.getByRole("button", { name: "Submit same answer again" }).click();

  await expect(page.getByText("Duplicate submission ignored.")).toBeVisible();
  await expect(page.getByText("Correct answer: A")).toBeVisible();
});

test("incorrect-answer review supports mistake reasons and bookmarks", async ({
  page,
}) => {
  await signInLearner(page);
  await startSession(page, { mode: "EXAM", count: "2" });

  await page.getByLabel("Choice B").check();
  await page.getByLabel("Confidence").selectOption("HIGH");
  await page.getByLabel("Answer changes").fill("1");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(
    page.getByRole("heading", { name: "Question 2 of 2" }),
  ).toBeVisible();
  await page.getByLabel("Choice B").check();
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByRole("link", { name: "Review session" }).click();
  await page.waitForURL(/\/review/);

  await expect(
    page.getByRole("heading", { name: "Incorrect-Answer Review" }),
  ).toBeVisible();
  await expect(page.getByText("Response B. Correct A.")).toBeVisible();
  await expect(page.getByText("High-confidence errors")).toBeVisible();
  await page.getByLabel("Mistake reason").selectOption("RULE_CONFUSION");
  await page.getByRole("button", { name: "Add reason" }).click();
  await expect(
    page.getByText("Review queue additions: RULE_CONFUSION"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bookmark" }).first().click();
});

async function signInLearner(page: Page, jurisdiction = "UBE") {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue as Development Learner" })
    .click();
  await page.waitForURL(/\/(onboarding|dashboard)/);
  await ensureOnboarded(page, jurisdiction);
}

async function ensureOnboarded(page: Page, jurisdiction = "UBE") {
  await page.goto("/onboarding");
  await page.getByLabel("Jurisdiction").fill(jurisdiction);
  await page.getByLabel("Exam date").fill("2026-07-28");
  await page.getByRole("button", { name: "Resolve track" }).click();
  await expect(page).toHaveURL(new RegExp(`jurisdiction=${jurisdiction}`));
  await expect(
    page.getByRole("heading", {
      name: jurisdiction === "NEXTGEN" ? "Nextgen Ube" : "Legacy Ube",
    }),
  ).toBeVisible();
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

async function startSession(
  page: Page,
  input: { mode: "LEARNING" | "EXAM" | "CUSTOM" | "ADAPTIVE"; count: string },
) {
  await page.goto("/practice/questions");
  await page.getByLabel("Session mode").selectOption(input.mode);
  await page.getByLabel("Number of questions").fill(input.count);

  if (input.mode === "EXAM") {
    await page.getByLabel("Feedback").selectOption("END_OF_SET");
    await page.getByLabel("Timing").selectOption("TIMED");
  }

  await page.getByRole("button", { name: "Start practice" }).click();
  await expect(page).toHaveURL(/\/practice\/questions\/practice-/);
}

function sessionIdFromUrl(url: string) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/");
  return parts.at(-1) ?? "";
}
