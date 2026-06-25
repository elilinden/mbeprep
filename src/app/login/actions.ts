"use server";

import { signIn } from "../../../auth";

export async function developmentSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  await signIn("dev-login", {
    email,
    redirectTo: "/onboarding",
  });
}
