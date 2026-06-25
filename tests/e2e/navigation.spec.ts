import { expect, type Page, test } from "@playwright/test";

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

async function signInLearnerWithOnboarding(page: Page) {
  await signIn(page, "learner");
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
  await expect(page).toHaveURL(/\/dashboard/);
}

test("unauthenticated navigation shows only public destinations", async ({
  page,
}) => {
  await page.goto("/");

  const publicNav = page.getByRole("navigation", { name: "Public navigation" });
  await expect(publicNav.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(publicNav.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("authenticated student navigation omits login, completed onboarding, and admin", async ({
  page,
}) => {
  await signInLearnerWithOnboarding(page);

  const studentNav = page.getByRole("navigation", {
    name: "Student primary navigation",
  });
  await expect(
    studentNav.getByRole("link", { name: "Dashboard" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(studentNav.getByRole("link", { name: "Plan" })).toBeVisible();
  await expect(
    studentNav.getByRole("link", { name: "Practice" }),
  ).toBeVisible();
  await expect(studentNav.getByRole("link", { name: "Audio" })).toBeVisible();
  await expect(studentNav.getByRole("link", { name: "Essays" })).toBeVisible();
  await expect(
    studentNav.getByRole("link", { name: "Analytics" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Onboarding" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("admin workspace uses dedicated navigation instead of student links", async ({
  page,
}) => {
  await signIn(page, "admin");
  await page.goto("/admin");

  const workspaceSwitcher = page.getByRole("navigation", {
    name: "Workspace switcher",
  });
  await expect(
    workspaceSwitcher.getByRole("link", { name: "Admin" }),
  ).toHaveAttribute("aria-current", "page");

  const adminNav = page.getByRole("navigation", { name: "Admin sections" });
  await expect(
    adminNav.getByRole("link", { name: "Overview" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(adminNav.getByRole("link", { name: "Questions" })).toBeVisible();
  await expect(
    adminNav.getByRole("link", { name: "Review queue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Student primary navigation" }),
  ).toHaveCount(0);
});

test("user menu is keyboard accessible and restores focus on escape", async ({
  page,
}) => {
  await signInLearnerWithOnboarding(page);

  const menuButton = page.getByRole("button", { name: "User menu" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(menuButton).toBeFocused();
});

test("mobile primary drawer supports keyboard close and has no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInLearnerWithOnboarding(page);

  const trigger = page.getByRole("button", {
    name: "Open primary navigation",
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Student navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Student navigation" }),
  ).toHaveCount(0);
  await expect(trigger).toBeFocused();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("admin page has no horizontal overflow at mobile width", async ({
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
});

test("server-side authorization denies student access to admin workspace", async ({
  page,
}) => {
  await signInLearnerWithOnboarding(page);
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("navigation", { name: "Admin sections" }),
  ).toHaveCount(0);
});
