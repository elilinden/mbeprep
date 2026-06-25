import { redirect } from "next/navigation";

import { auth, signIn } from "../../../auth";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { developmentUsers } from "@/auth/dev-users";
import { isGitHubAuthConfigured } from "@/auth/providers";
import { env } from "@/env/server";

async function developmentSignIn(formData: FormData) {
  "use server";

  if (env.NODE_ENV === "production") {
    throw new Error("Development sign-in is not available in production.");
  }

  await signIn("dev-login", {
    email: String(formData.get("email") ?? ""),
    redirectTo: "/onboarding",
  });
}

async function githubSignIn() {
  "use server";

  if (env.NODE_ENV !== "production" || !isGitHubAuthConfigured()) {
    throw new Error("GitHub sign-in is not configured.");
  }

  await signIn("github", {
    redirectTo: "/onboarding",
  });
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const isProduction = env.NODE_ENV === "production";
  const learner = isProduction
    ? null
    : (developmentUsers.find((user) => user.roles.includes("STUDENT")) ??
      null);
  const admin = isProduction
    ? null
    : (developmentUsers.find((user) => user.roles.includes("ADMIN")) ?? null);

  return (
    <div className="space-y-6">
      <PageHeader
        description={
          isProduction
            ? "Sign in with GitHub to start onboarding and continue your study workspace."
            : "Use the development accounts to enter the guided setup flow."
        }
        eyebrow="Sign in"
        title="Continue to MBE Prep"
      />
      {isProduction ? (
        isGitHubAuthConfigured() ? (
          <form
            action={githubSignIn}
            className="max-w-xl rounded-lg border border-stone-200 bg-white p-5"
          >
            <h2 className="text-lg font-semibold text-stone-950">
              Production workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              GitHub sign-in protects student progress and administrative
              access. New accounts start as students unless their email is on
              the configured administrator allowlist.
            </p>
            <Button className="mt-5" type="submit">
              Continue with GitHub
            </Button>
          </form>
        ) : (
          <section className="max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            GitHub sign-in is not configured yet. Add
            <code className="mx-1 rounded bg-white px-1 py-0.5">
              GITHUB_CLIENT_ID
            </code>
            and
            <code className="mx-1 rounded bg-white px-1 py-0.5">
              GITHUB_CLIENT_SECRET
            </code>
            in Vercel, then redeploy.
          </section>
        )
      ) : null}
      <section className="grid gap-4 md:grid-cols-2">
        {learner ? (
          <form
            action={developmentSignIn}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <input name="email" type="hidden" value={learner.email} />
            <h2 className="text-lg font-semibold text-stone-950">
              Student workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Start onboarding, build a schedule, and open the student study
              tools.
            </p>
            <Button className="mt-5" type="submit">
              Continue as Development Learner
            </Button>
          </form>
        ) : null}
        {admin ? (
          <form
            action={developmentSignIn}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <input name="email" type="hidden" value={admin.email} />
            <h2 className="text-lg font-semibold text-stone-950">
              Admin workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Review content operations and manage demonstration fixtures.
            </p>
            <Button className="mt-5" type="submit" variant="secondary">
              Continue as Development Administrator
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
