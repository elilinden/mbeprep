import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";
import { readFile } from "node:fs/promises";
import path from "node:path";

test("admin uploads and publishes a podcast, then listener resumes", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Continue as Development Administrator" })
    .click();
  await page.waitForURL(/\/(onboarding|dashboard)/);

  await page.goto("/admin");
  const fixturePath = path.join(
    process.cwd(),
    "tests/fixtures/DEMO_NOT_FOR_PUBLICATION-podcast.mp3",
  );
  await page.getByLabel("Audio file").setInputFiles({
    name: "DEMO_NOT_FOR_PUBLICATION-podcast.mp3",
    mimeType: "audio/mpeg",
    buffer: await readFile(fixturePath),
  });
  await page
    .getByLabel("Title", { exact: true })
    .fill("DEMO_NOT_FOR_PUBLICATION Playwright podcast");
  await page
    .getByLabel("Manual transcript")
    .fill("DEMO_NOT_FOR_PUBLICATION Playwright transcript target.");
  await page.getByRole("button", { name: "Upload audio" }).click();

  const row = page
    .getByRole("row")
    .filter({ hasText: "DEMO_NOT_FOR_PUBLICATION Playwright podcast" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(row).toContainText("Reviewed");
  await row.getByRole("button", { name: "Publish podcast" }).click();
  await expect(row).toContainText("PUBLISHED");

  await signOut(page);
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/audio");
  await page
    .getByRole("link", { name: /Playwright podcast/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Playwright podcast",
    }),
  ).toBeVisible();
  await expect(page.getByText("Resume at 0 seconds.")).toBeVisible();
  await page.getByRole("button", { name: "Skip forward 30 seconds" }).click();
  await expect(page.getByText("Resume at 30 seconds.")).toBeVisible();

  await page.goto("/dashboard");
  await page.goto("/audio");
  await page
    .getByRole("link", { name: /Playwright podcast/ })
    .first()
    .click();
  await expect(page.getByText("Resume at 30 seconds.")).toBeVisible();

  expect(path.basename(fixturePath)).toContain("DEMO_NOT_FOR_PUBLICATION");
});

test("audio episode cards use keyboard-accessible links without nested controls", async ({
  page,
}) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/audio");

  const nestedInteractiveCount = await page.evaluate(
    () =>
      document.querySelectorAll(
        "a a, a button, a input, button a, button button",
      ).length,
  );
  expect(nestedInteractiveCount).toBe(0);

  const episodeLink = page.getByRole("link", { name: "audio orientation" });
  await episodeLink.focus();
  await expect(episodeLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/audio\/demo-podcast-ready-1/);
});

test("user-provided subject podcasts appear with transcript-pending detail state", async ({
  page,
}) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/audio");

  await expect(page.getByRole("link", { name: "Torts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Real Property" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contracts" })).toBeVisible();

  await page.getByRole("link", { name: "Torts" }).click();
  await expect(page).toHaveURL(/\/audio\/user-podcast-torts/);
  await expect(page.getByRole("heading", { name: "Torts" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Transcript pending" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play episode" }),
  ).toBeVisible();
});

test("episode player exposes one primary playback action and an error state", async ({
  page,
}) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/audio/demo-podcast-ready-1");

  await expect(
    page.getByRole("button", { name: "Play episode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause episode" }),
  ).toHaveCount(0);

  await page.evaluate(() => {
    const audio = document.querySelector("audio");
    audio?.dispatchEvent(new Event("error"));
  });
  await expect(
    page.getByText("Playback failed. The signed audio URL may have expired."),
  ).toBeVisible();
});

test("audio pages have no serious axe violations", async ({ page }) => {
  await signInLearner(page);
  await ensureOnboarded(page);
  await page.goto("/audio");
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

async function signOut(page: Page) {
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/);
}

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
