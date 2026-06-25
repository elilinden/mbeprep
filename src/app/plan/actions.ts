"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/app-auth";
import { requireCompletedOnboarding } from "@/server/onboarding-access";
import {
  completeStudyTaskForUser,
  rebuildStudyPlanForUser,
  rescheduleStudyTaskForUser,
  skipStudyTaskForUser,
  togglePinStudyTaskForUser,
} from "@/server/study-plan-memory-store";

export async function rebuildStudyPlanAction() {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  await rebuildStudyPlanForUser({
    userId: user.id,
    trigger: "EXPLICIT_REQUEST",
  });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  redirect("/plan?rebuilt=1" as Route);
}

export async function completeStudyTaskAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  completeStudyTaskForUser({
    userId: user.id,
    taskId: String(formData.get("taskId") ?? ""),
  });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  redirect("/plan?completed=1" as Route);
}

export async function skipStudyTaskAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  skipStudyTaskForUser({
    userId: user.id,
    taskId: String(formData.get("taskId") ?? ""),
    reason: String(formData.get("skipReason") ?? ""),
  });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  redirect("/plan?skipped=1" as Route);
}

export async function togglePinStudyTaskAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  togglePinStudyTaskForUser({
    userId: user.id,
    taskId: String(formData.get("taskId") ?? ""),
  });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  redirect("/plan?pinned=1" as Route);
}

export async function rescheduleStudyTaskAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const date = new Date(String(formData.get("date") ?? ""));

  if (Number.isNaN(date.getTime())) {
    throw new Error("A valid reschedule date is required.");
  }

  rescheduleStudyTaskForUser({
    userId: user.id,
    taskId: String(formData.get("taskId") ?? ""),
    date,
  });
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  redirect("/plan?rescheduled=1" as Route);
}
