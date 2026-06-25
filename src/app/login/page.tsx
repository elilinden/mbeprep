import { redirect } from "next/navigation";

import { auth, signIn } from "../../../auth";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { developmentUsers } from "@/auth/dev-users";
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

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const learner =
    developmentUsers.find((user) => user.roles.includes("STUDENT")) ?? null;
  const admin =
    developmentUsers.find((user) => user.roles.includes("ADMIN")) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Use the development accounts to enter the guided setup flow."
        eyebrow="Sign in"
        title="Continue to MBE Prep"
      />
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
