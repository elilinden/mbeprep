import Link from "next/link";
import type { Route } from "next";
import { ClipboardCheck, Gavel, ListChecks, Plus, Upload } from "lucide-react";

import { requireAdmin } from "@/auth/app-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { MBE_CATEGORIES_BY_SUBJECT } from "@/domain/seed-data";
import { demoLicenses, demoQuestions } from "@/domain/demo-admin-content";
import {
  ORIGINAL_QUESTION_PROVENANCES,
  ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
} from "@/domain/original-question-import";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

import { publishDemoContentAction, retireDemoContentAction } from "../actions";
import {
  QuestionsManagementClient,
  type QuestionRow,
} from "./questions-management-client";

export default async function AdminQuestionsPage() {
  await requireAdmin();

  const taxonomyCategories = Object.entries(MBE_CATEGORIES_BY_SUBJECT).flatMap(
    ([subjectName, categories]) =>
      categories.map((category) => ({
        subject: subjectName,
        category,
      })),
  );
  const importedQuestionRows = await listImportedQuestionRows();
  const questionRows = [
    ...demoQuestions.map(toQuestionRow),
    ...importedQuestionRows,
  ];
  const subjects = getUnique(questionRows.map((question) => question.subject));
  const categories = getUnique(
    questionRows.flatMap((question) => [question.category, question.topic]),
  );
  const licenses = getUnique(
    questionRows.map((question) => question.licenseKey),
  );
  const reviewers = getUnique(
    questionRows.map((question) => question.reviewer ?? "Unassigned"),
  );
  const publishedCount = questionRows.filter(
    (question) => question.status === "PUBLISHED",
  ).length;
  const draftCount = questionRows.filter(
    (question) => question.status === "DRAFT",
  ).length;
  const pendingReviewCount = questionRows.filter((question) =>
    ["LEGAL_REVIEW", "EDITORIAL_REVIEW", "APPROVED"].includes(question.status),
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
            <li aria-current="page" className="font-medium text-stone-950">
              Questions
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Questions
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Manage demonstration question versions, review state, licensing,
              and authoring workflow without exposing answer keys before
              submission.
            </p>
            <dl className="mt-3 flex flex-wrap gap-3 text-sm text-stone-700">
              <div className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1">
                <dt>Published</dt>
                <dd className="font-semibold text-stone-950">
                  {publishedCount}
                </dd>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1">
                <dt>Draft</dt>
                <dd className="font-semibold text-stone-950">{draftCount}</dd>
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1">
                <dt>Pending review</dt>
                <dd className="font-semibold text-stone-950">
                  {pendingReviewCount}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-stone-600">
              <a
                className="rounded-sm font-medium text-emerald-800 outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href="#content-authoring-requirements"
              >
                Content-authoring requirements
              </a>{" "}
              apply to every question version.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <a
              className={cn(buttonVariants(), "shrink-0")}
              href="#create-question"
            >
              <Plus aria-hidden="true" className="size-4" />
              Create question
            </a>
            <Link
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "shrink-0",
              )}
              href={"/admin#import-content" as Route}
            >
              <Upload aria-hidden="true" className="size-4" />
              Import
            </Link>
          </div>
        </div>
      </header>

      <QuestionsManagementClient
        categories={categories}
        licenses={licenses}
        questions={questionRows}
        reviewers={reviewers}
        subjects={subjects}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          className="rounded-lg border border-stone-200 bg-white p-6"
          id="create-question"
        >
          <div className="flex items-center gap-3">
            <ListChecks
              aria-hidden="true"
              className="size-5 text-emerald-700"
            />
            <h2 className="text-lg font-semibold text-stone-950">
              Question editor
            </h2>
          </div>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Stem
              <textarea
                className="min-h-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION placeholder stem."
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Call of the question
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION placeholder call."
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Primary topic
                <select className="min-h-10 rounded-md border border-stone-300 px-3 text-sm">
                  {taxonomyCategories.slice(0, 8).map((topic) => (
                    <option key={`${topic.subject}-${topic.category}`}>
                      {topic.subject}: {topic.category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Item format
                <select className="min-h-10 rounded-md border border-stone-300 px-3 text-sm">
                  <option>SINGLE_SELECT</option>
                  <option>SELECT_TWO</option>
                  <option>SHORT_ANSWER</option>
                  <option>MEDIUM_ANSWER</option>
                  <option>INTEGRATED_SET</option>
                  <option>STANDARD_PERFORMANCE_TASK</option>
                  <option>LEGAL_RESEARCH_PERFORMANCE_TASK</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                License
                <select className="min-h-10 rounded-md border border-stone-300 px-3 text-sm">
                  {demoLicenses.map((licenseItem) => (
                    <option key={licenseItem.key}>{licenseItem.key}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <ClipboardCheck
              aria-hidden="true"
              className="size-5 text-emerald-700"
            />
            <h2 className="text-lg font-semibold text-stone-950">
              Choice-rationale editor and preview
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {demoQuestions[0]?.choices.map((choice) => (
              <div
                className="rounded-md border border-stone-200 p-3"
                key={choice.label}
              >
                <p className="text-sm font-semibold text-stone-950">
                  Choice {choice.label} {choice.isCorrect ? "(correct)" : ""}
                </p>
                <p className="mt-1 text-sm text-stone-600">{choice.text}</p>
                <p className="mt-2 text-xs text-stone-500">
                  {choice.rationale}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-950">Preview</p>
            <p className="mt-2 text-sm text-stone-600">
              {demoQuestions[0]?.stem}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Gavel aria-hidden="true" className="size-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-stone-950">
            Question review queue
          </h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoQuestions
            .filter((question) => question.status !== "PUBLISHED")
            .map((question) => (
              <div
                className="rounded-md border border-stone-200 p-3"
                key={question.id}
              >
                <p className="text-sm font-semibold">{question.id}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {question.status.replaceAll("_", " ")}
                </p>
              </div>
            ))}
        </div>
        <div className="mt-4 flex gap-2">
          <form action={publishDemoContentAction}>
            <input name="currentStatus" type="hidden" value="APPROVED" />
            <Button size="sm" type="submit">
              Publish
            </Button>
          </form>
          <form action={retireDemoContentAction}>
            <input name="currentStatus" type="hidden" value="PUBLISHED" />
            <Button size="sm" type="submit" variant="secondary">
              Retire
            </Button>
          </form>
        </div>
      </section>

      <section
        className="rounded-lg border border-stone-200 bg-white p-6"
        id="content-authoring-requirements"
      >
        <h2 className="text-lg font-semibold text-stone-950">
          Content-authoring requirements
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-600">
          <li>Use only DEMO_NOT_FOR_PUBLICATION fixtures in this workflow.</li>
          <li>
            Do not publish legal content until an approved legal reviewer has
            reviewed it.
          </li>
          <li>
            Do not copy NCBE, Themis, BARBRI, UWorld, or third-party questions.
          </li>
          <li>
            Correct answers and explanations remain unavailable to students
            before submission.
          </li>
        </ul>
      </section>
    </div>
  );
}

function hasCompleteRationales(question: (typeof demoQuestions)[number]) {
  return question.choices.every(
    (choice) =>
      choice.rationale.trim().length > 0 &&
      (choice.isCorrect || choice.distractorType !== "NONE"),
  );
}

function getUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

function toQuestionRow(question: (typeof demoQuestions)[number]): QuestionRow {
  const title = question.id
    .replace(/^demo-/, "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    category: question.category,
    hasCompleteRationales: hasCompleteRationales(question),
    id: question.id,
    licenseKey: question.licenseKey,
    reviewer: question.reviewerId ?? null,
    shortTitle: title,
    status: question.status,
    subject: question.subject,
    topic: question.primaryTopic,
    updatedAt: (
      question.lastReviewedAt ??
      question.effectiveTo ??
      question.effectiveFrom
    ).toISOString(),
    version: question.version,
  };
}

async function listImportedQuestionRows(): Promise<QuestionRow[]> {
  try {
    const importedVersions = await prisma.questionVersion.findMany({
      where: { provenance: { in: [...ORIGINAL_QUESTION_PROVENANCES] } },
      include: {
        choices: true,
        primaryTopic: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
        reviewer: true,
        question: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    return importedVersions.map((version) => {
      const category = version.primaryTopic.parent;
      const subject = category?.parent;

      return {
        batchId: version.batchId,
        category: category?.name ?? version.primaryTopic.name,
        detailHref: `/admin/questions/${version.id}`,
        hasCompleteRationales: version.choices.every(
          (choice) =>
            choice.rationale.trim().length > 0 &&
            (choice.isCorrect || choice.distractorType !== "NONE"),
        ),
        id: version.question.key,
        licenseKey: ORIGINAL_QUESTION_PUBLIC_SOURCE_LABEL,
        provenance: version.provenance,
        reviewer:
          version.reviewer?.displayName ?? version.reviewer?.email ?? null,
        reviewRequired:
          version.status === "LEGAL_REVIEW" && !version.publishable,
        shortTitle: version.question.key,
        status: version.status,
        subject: subject?.name ?? "Imported",
        topic: version.primaryTopic.key,
        updatedAt: version.updatedAt.toISOString(),
        version: version.version,
      };
    });
  } catch {
    return [];
  }
}
