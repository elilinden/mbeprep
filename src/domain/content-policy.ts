export const DEMO_LABEL = "DEMO_NOT_FOR_PUBLICATION";

export type SubmissionState = "before-submission" | "after-submission";

export function canReleaseReviewContent(state: SubmissionState) {
  return state === "after-submission";
}

export function assertDemoFixtureLabel(label: string) {
  if (label !== DEMO_LABEL) {
    throw new Error(`Demo fixtures must be labeled ${DEMO_LABEL}.`);
  }
}
