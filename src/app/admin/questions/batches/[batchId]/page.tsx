import Link from "next/link";
import type { Route } from "next";

import { requireAdmin } from "@/auth/app-auth";
import { buttonVariants } from "@/components/ui/button";
import {
  ORIGINAL_QUESTION_PROVENANCES,
  ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
} from "@/domain/original-question-import";
import type {
  ContentWorkflowStatus,
  QuestionDifficulty,
} from "@/domain/admin-content-types";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type BatchQuestionRow = {
  id: string;
  key: string;
  subject: string;
  category: string;
  subtopic: string;
  difficulty: QuestionDifficulty;
  answerPosition: string;
  status: ContentWorkflowStatus;
  version: number;
  legalReviewState: string;
  editorialReviewState: string;
  reviewer: string;
  updatedAt: string;
};

type BatchReviewPageProps = {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminQuestionBatchReviewPage({
  params,
  searchParams,
}: BatchReviewPageProps) {
  await requireAdmin();

  const { batchId } = await params;
  const filters = await searchParams;
  const subject = singleValue(filters.subject);
  const difficulty = singleValue(filters.difficulty);
  const status = singleValue(filters.status);
  const rows = await listBatchQuestionRows(batchId);
  const filteredRows = rows.filter(
    (row) =>
      (!subject || row.subject === subject) &&
      (!difficulty || row.difficulty === difficulty) &&
      (!status || row.status === status),
  );
  const subjects = unique(rows.map((row) => row.subject));
  const difficulties = unique(rows.map((row) => row.difficulty));
  const statuses = unique(rows.map((row) => row.status));
  const pendingLegalReview = rows.filter(
    (row) => row.status === "LEGAL_REVIEW",
  ).length;
  const pendingEditorialReview = rows.filter(
    (row) => row.status === "EDITORIAL_REVIEW",
  ).length;

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
              Batch review
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Original AI-assisted draft
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-950">
              {batchId}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Review imported original practice-question drafts before any
              publication decision. These records are not official NCBE content
              and require attorney review.
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

      <section aria-label="Batch summary" className="grid gap-3 md:grid-cols-4">
        <SummaryMetric label="Records" value={rows.length} />
        <SummaryMetric
          label="Pending legal review"
          value={pendingLegalReview}
        />
        <SummaryMetric
          label="Pending editorial review"
          value={pendingEditorialReview}
        />
        <SummaryMetric
          label="Source label"
          value={ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL}
        />
      </section>

      <section
        aria-labelledby="batch-review-warning-title"
        className="rounded-lg border border-amber-300 bg-amber-50 p-4"
      >
        <h2
          className="text-sm font-semibold text-amber-950"
          id="batch-review-warning-title"
        >
          Attorney review required
        </h2>
        <p className="mt-1 text-sm leading-6 text-amber-950">
          Answer keys and reviewer notes are available only in the
          server-authorized admin review workflow. Do not publish these records
          until the configured legal and editorial approvals are complete.
        </p>
      </section>

      <form
        action={`/admin/questions/batches/${batchId}`}
        className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-4"
      >
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Subject
          <select
            className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
            defaultValue={subject ?? ""}
            name="subject"
          >
            <option value="">All subjects</option>
            {subjects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Difficulty
          <select
            className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
            defaultValue={difficulty ?? ""}
            name="difficulty"
          >
            <option value="">All difficulties</option>
            {difficulties.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-stone-800">
          Status
          <select
            className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
            defaultValue={status ?? ""}
            name="status"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button className={cn(buttonVariants(), "min-h-10")} type="submit">
            Apply filters
          </button>
          <Link
            className={cn(buttonVariants({ variant: "secondary" }), "min-h-10")}
            href={`/admin/questions/batches/${batchId}` as Route}
          >
            Reset
          </Link>
        </div>
      </form>

      <section className="rounded-lg border border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-base font-semibold text-stone-950">
            Review queue
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Showing {filteredRows.length} of {rows.length} imported records.
          </p>
        </div>
        {filteredRows.length === 0 ? (
          <div className="p-6 text-sm text-stone-600">
            No imported question records match this batch and filter set.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <caption className="sr-only">
                Imported question batch review records
              </caption>
              <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3" scope="col">
                    Key
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Topic
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Difficulty
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Answer
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Version
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Review state
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Reviewer
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Updated
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr className="border-b border-stone-100" key={row.id}>
                    <th className="px-4 py-3 font-medium" scope="row">
                      {row.key}
                    </th>
                    <td className="px-4 py-3">
                      <span className="block">{row.subject}</span>
                      <span className="block text-xs text-stone-500">
                        {row.category} / {row.subtopic}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.difficulty}</td>
                    <td className="px-4 py-3">{row.answerPosition}</td>
                    <td className="px-4 py-3">{row.version}</td>
                    <td className="px-4 py-3">
                      <span className="block">{row.legalReviewState}</span>
                      <span className="block text-xs text-stone-500">
                        {row.editorialReviewState}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.reviewer}</td>
                    <td className="px-4 py-3">{row.updatedAt}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="rounded-sm font-medium text-emerald-800 outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                        href={`/admin/questions/${row.id}` as Route}
                      >
                        Review details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

async function listBatchQuestionRows(batchId: string) {
  try {
    const versions = await prisma.questionVersion.findMany({
      where: {
        batchId,
        provenance: { in: [...ORIGINAL_QUESTION_PROVENANCES] },
      },
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
        reviewer: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return versions.map((version) => {
      const category = version.primaryTopic.parent;
      const subject = category?.parent;

      return {
        answerPosition:
          version.choices
            .filter((choice) => choice.isCorrect)
            .map((choice) => choice.label)
            .join(", ") || "Unmarked",
        category: category?.name ?? version.primaryTopic.name,
        difficulty: version.difficulty,
        editorialReviewState:
          version.status === "EDITORIAL_REVIEW" ||
          version.status === "APPROVED" ||
          version.status === "PUBLISHED"
            ? "Editorial review started"
            : "Editorial review pending",
        id: version.id,
        key: version.question.key,
        legalReviewState:
          version.status === "LEGAL_REVIEW"
            ? "Legal review pending"
            : "Legal review complete or returned",
        reviewer:
          version.reviewer?.displayName ??
          version.reviewer?.email ??
          "Unassigned",
        status: version.status,
        subject: subject?.name ?? "Imported",
        subtopic: version.primaryTopic.name,
        updatedAt: version.updatedAt.toISOString().slice(0, 10),
        version: version.version,
      } satisfies BatchQuestionRow;
    });
  } catch {
    return [];
  }
}

function singleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}
