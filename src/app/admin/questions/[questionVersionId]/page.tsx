import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckSquare, FileText } from "lucide-react";

import { requireAdmin } from "@/auth/app-auth";
import { buttonVariants } from "@/components/ui/button";
import {
  ORIGINAL_QUESTION_PROVENANCES,
  ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
} from "@/domain/original-question-import";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type AdminQuestionDetailPageProps = {
  params: Promise<{ questionVersionId: string }>;
};

export default async function AdminQuestionDetailPage({
  params,
}: AdminQuestionDetailPageProps) {
  await requireAdmin();
  const { questionVersionId } = await params;
  const version = await prisma.questionVersion.findUnique({
    where: { id: questionVersionId },
    include: {
      choices: { orderBy: { sortOrder: "asc" } },
      primaryTopic: {
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      },
      question: true,
      source: true,
      license: true,
      reviews: {
        include: { reviewer: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!version) {
    notFound();
  }

  const category = version.primaryTopic.parent;
  const subject = category?.parent;
  const correctChoices = version.choices.filter((choice) => choice.isCorrect);
  const reviewChecklist = asReviewChecklist(version.reviewChecklist);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <li>
              <Link
                className="rounded-sm outline-none hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href="/admin"
              >
                Admin
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                className="rounded-sm outline-none hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href="/admin/questions"
              >
                Questions
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-stone-950">
              Review
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Question review
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Review original AI-assisted draft content before any publication
              decision.
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: "secondary" }), "shrink-0")}
            href="/admin/questions"
          >
            Back to questions
          </Link>
        </div>
      </header>

      {ORIGINAL_QUESTION_PROVENANCES.includes(
        version.provenance as (typeof ORIGINAL_QUESTION_PROVENANCES)[number],
      ) ? (
        <section
          aria-labelledby="review-warning-title"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4"
        >
          <div className="flex gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-amber-700"
            />
            <div>
              <h2
                className="text-sm font-semibold text-amber-950"
                id="review-warning-title"
              >
                Attorney review required
              </h2>
              <p className="mt-1 text-sm leading-6 text-amber-950">
                This is an original AI-assisted draft. A qualified legal
                reviewer and an editorial reviewer must independently verify the
                same version before publication.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <FileText aria-hidden="true" className="size-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-stone-950">Metadata</h2>
        </div>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <MetadataItem label="Question key" value={version.question.key} />
          <MetadataItem label="Status" value={version.status} />
          <MetadataItem label="Version" value={String(version.version)} />
          <MetadataItem
            label="Source label"
            value={
              version.publicSourceLabel ?? ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL
            }
          />
          <MetadataItem label="Batch" value={version.batchId ?? "Unbatched"} />
          <MetadataItem
            label="Provenance"
            value={version.provenance ?? "Unspecified"}
          />
          <MetadataItem label="Subject" value={subject?.name ?? "Unknown"} />
          <MetadataItem label="Category" value={category?.name ?? "Unknown"} />
          <MetadataItem label="Subtopic" value={version.primaryTopic.name} />
          <MetadataItem label="License" value={version.license.key} />
          <MetadataItem label="Source" value={version.source.key} />
          <MetadataItem
            label="Publishable"
            value={version.publishable ? "Yes" : "No"}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-950">
          Reviewer-only answer material
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">Stem</h3>
            <p className="mt-1 text-sm leading-6 text-stone-700">
              {version.stem}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-950">Call</h3>
            <p className="mt-1 text-sm leading-6 text-stone-700">
              {version.callOfQuestion}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-950">
              Correct answer
            </h3>
            <p className="mt-1 text-sm text-stone-700">
              {correctChoices.map((choice) => choice.label).join(", ")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">
                Choices, correctness, rationales, and distractor classifications
              </caption>
              <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <tr>
                  <th className="py-2 pr-4" scope="col">
                    Choice
                  </th>
                  <th className="py-2 pr-4" scope="col">
                    Text
                  </th>
                  <th className="py-2 pr-4" scope="col">
                    Status
                  </th>
                  <th className="py-2 pr-4" scope="col">
                    Rationale
                  </th>
                  <th className="py-2 pr-4" scope="col">
                    Distractor
                  </th>
                </tr>
              </thead>
              <tbody>
                {version.choices.map((choice) => (
                  <tr className="border-b border-stone-100" key={choice.id}>
                    <th className="py-3 pr-4" scope="row">
                      {choice.label}
                    </th>
                    <td className="py-3 pr-4">{choice.text}</td>
                    <td className="py-3 pr-4">
                      {choice.isCorrect ? "Correct" : "Incorrect"}
                    </td>
                    <td className="py-3 pr-4">{choice.rationale}</td>
                    <td className="py-3 pr-4">
                      {choice.distractorType.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-950">
          Legal-review aids
        </h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <MetadataItem
            label="Tested issue"
            value={version.testedIssue ?? "Not provided"}
          />
          <MetadataItem
            label="Governing rule"
            value={version.governingRule ?? "Not provided"}
          />
          <MetadataItem
            label="Application"
            value={version.application ?? "Not provided"}
          />
          <MetadataItem
            label="Common trap"
            value={version.commonTrap ?? "Not provided"}
          />
          <MetadataItem
            label="Memory aid"
            value={version.memoryAid ?? "Not provided"}
          />
          <MetadataItem
            label="Authority notes"
            value={
              version.authorityNotes.length > 0
                ? version.authorityNotes.join("; ")
                : "Not provided"
            }
          />
        </dl>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <CheckSquare aria-hidden="true" className="size-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-stone-950">
            Review checklist
          </h2>
        </div>
        <ul className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {Object.entries(reviewChecklist).map(([key, value]) => (
            <li className="rounded-md border border-stone-200 p-3" key={key}>
              <span className="font-medium text-stone-950">
                {formatChecklistLabel(key)}
              </span>
              <span className="mt-1 block text-stone-600">
                {value ? "Complete" : "Not yet complete"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 leading-6 text-stone-800">{value}</dd>
    </div>
  );
}

function asReviewChecklist(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      legalAccuracy: false,
      oneBestAnswer: false,
      distractorPlausibility: false,
      biasReview: false,
      grammar: false,
      accessibility: false,
    };
  }

  return value as Record<string, boolean>;
}

function formatChecklistLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
