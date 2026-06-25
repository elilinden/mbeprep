import { hasRole } from "@/auth/roles";

import type {
  ContentActor,
  ContentWorkflowStatus,
} from "./admin-content-types";

export type WorkflowContext = {
  actor: ContentActor;
  currentStatus: ContentWorkflowStatus;
  nextStatus: ContentWorkflowStatus;
  authorId?: string | null;
  legalReviewerId?: string | null;
  editorialReviewerId?: string | null;
  twoPersonReview: boolean;
};

const allowedTransitions: Record<
  ContentWorkflowStatus,
  ContentWorkflowStatus[]
> = {
  DRAFT: ["LEGAL_REVIEW"],
  LEGAL_REVIEW: ["EDITORIAL_REVIEW", "DRAFT"],
  EDITORIAL_REVIEW: ["APPROVED", "LEGAL_REVIEW"],
  APPROVED: ["PUBLISHED", "LEGAL_REVIEW"],
  PUBLISHED: ["RETIRED"],
  RETIRED: [],
};

export function canTransitionContent(context: WorkflowContext) {
  if (!allowedTransitions[context.currentStatus].includes(context.nextStatus)) {
    return false;
  }

  if (context.nextStatus === "LEGAL_REVIEW") {
    return (
      hasRole(context.actor.roles, "EDITOR") ||
      hasRole(context.actor.roles, "ADMIN")
    );
  }

  if (context.nextStatus === "EDITORIAL_REVIEW") {
    return (
      (hasRole(context.actor.roles, "REVIEWER") ||
        hasRole(context.actor.roles, "ADMIN")) &&
      passesTwoPersonRule(context, "legalReviewerId")
    );
  }

  if (context.nextStatus === "APPROVED") {
    return (
      (hasRole(context.actor.roles, "EDITOR") ||
        hasRole(context.actor.roles, "ADMIN")) &&
      passesTwoPersonRule(context, "editorialReviewerId")
    );
  }

  if (context.nextStatus === "PUBLISHED" || context.nextStatus === "RETIRED") {
    return hasRole(context.actor.roles, "ADMIN");
  }

  if (context.nextStatus === "DRAFT") {
    return (
      hasRole(context.actor.roles, "EDITOR") ||
      hasRole(context.actor.roles, "ADMIN")
    );
  }

  return false;
}

export function assertCanTransitionContent(context: WorkflowContext) {
  if (!canTransitionContent(context)) {
    throw new Error(
      "Actor is not authorized for this content workflow transition.",
    );
  }
}

function passesTwoPersonRule(
  context: WorkflowContext,
  priorReviewerKey: "legalReviewerId" | "editorialReviewerId",
) {
  if (!context.twoPersonReview) {
    return true;
  }

  const actorId = context.actor.id;
  return (
    actorId !== context.authorId &&
    actorId !== context.legalReviewerId &&
    actorId !== context.editorialReviewerId &&
    actorId !== context[priorReviewerKey]
  );
}
