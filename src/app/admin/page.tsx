import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileAudio,
  FileText,
  History,
  Import,
  ListChecks,
  Megaphone,
  Mic2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import {
  publishPodcastEpisodeAction,
  reviewPodcastEpisodeAction,
  uploadPodcastAudioAction,
} from "@/app/admin/actions";
import { requireAdmin } from "@/auth/app-auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ContentWorkflowStatus } from "@/domain/admin-content-types";
import { buildCoverageReport } from "@/domain/coverage-report";
import {
  demoEssays,
  demoLicenses,
  demoPodcasts,
  demoQuestions,
  demoReports,
} from "@/domain/demo-admin-content";
import { MBE_CATEGORIES_BY_SUBJECT } from "@/domain/seed-data";
import { cn } from "@/lib/utils";
import { listPodcastEpisodes } from "@/server/podcast-memory-store";

type Metric = {
  title: string;
  count: number;
  description: string;
  href: string;
  status: string;
};

type AttentionItem = {
  issue: string;
  count: number;
  severity: "Action needed" | "Monitor" | "Blocked";
  href: string;
};

const REVIEW_STATUSES: ContentWorkflowStatus[] = [
  "LEGAL_REVIEW",
  "EDITORIAL_REVIEW",
  "APPROVED",
];

export default async function AdminPage() {
  await requireAdmin();

  const taxonomyCategories = Object.entries(MBE_CATEGORIES_BY_SUBJECT).flatMap(
    ([subject, categories]) =>
      categories.map((category) => ({
        subject,
        category,
      })),
  );
  const podcastEpisodes = listPodcastEpisodes();
  const coverage = buildCoverageReport({
    questions: demoQuestions,
    essays: demoEssays,
    podcasts: podcastEpisodes,
    licenses: demoLicenses,
    taxonomyCategories,
    asOf: new Date("2026-06-24T00:00:00.000Z"),
    soonExpiringDays: 45,
    reviewOverdueDays: 90,
  });
  const openReports = demoReports.filter((report) => report.status === "OPEN");
  const pendingReviewCount = countByStatus(REVIEW_STATUSES);
  const draftCount =
    demoQuestions.filter((item) => item.status === "DRAFT").length +
    demoEssays.filter((item) => item.status === "DRAFT").length +
    demoPodcasts.filter((item) => item.status === "DRAFT").length +
    podcastEpisodes.filter((item) => item.status === "DRAFT").length;
  const publishedCount =
    demoQuestions.filter((item) => item.status === "PUBLISHED").length +
    demoEssays.filter((item) => item.status === "PUBLISHED").length +
    demoPodcasts.filter((item) => item.status === "PUBLISHED").length +
    podcastEpisodes.filter((item) => item.status === "PUBLISHED").length;
  const metrics: Metric[] = [
    {
      title: "Pending review",
      count: pendingReviewCount,
      description: "Items waiting for legal, editorial, or publish review.",
      href: "/admin/questions?status=LEGAL_REVIEW",
      status:
        pendingReviewCount > 0 ? "Review queue needs attention" : "All clear",
    },
    {
      title: "Draft content",
      count: draftCount,
      description: "Question, essay, and podcast fixtures still in draft.",
      href: "/admin/questions?status=DRAFT",
      status: draftCount > 0 ? "Drafts exist" : "No drafts",
    },
    {
      title: "Published content",
      count: publishedCount,
      description: "Approved content currently visible in learner workflows.",
      href: "/admin/questions?status=PUBLISHED",
      status: publishedCount > 0 ? "Published inventory available" : "None",
    },
    {
      title: "Open reports",
      count: openReports.length,
      description: "User-submitted content reports awaiting moderation.",
      href: "#content-reports",
      status: openReports.length > 0 ? "Moderation needed" : "No open reports",
    },
  ];
  const podcastsMissingTopicsOrTranscripts = podcastEpisodes.filter(
    (episode) =>
      episode.topics.length === 0 ||
      (!episode.transcriptText?.trim() &&
        !episode.transcriptUri?.trim() &&
        episode.transcriptSegments.length === 0),
  );
  const attentionItems = (
    [
      {
        issue: "Questions missing complete choice rationales",
        count: coverage.questionsMissingCompleteRationales.length,
        severity: "Action needed",
        href: "/admin/questions?issue=missing-rationales",
      },
      {
        issue: "Essays missing rubric items",
        count: coverage.essaysMissingRubrics.length,
        severity: "Action needed",
        href: "#essay-readiness",
      },
      {
        issue: "Podcasts missing transcripts",
        count: coverage.podcastsMissingTranscripts.length,
        severity: "Action needed",
        href: "#podcast-readiness",
      },
      {
        issue: "Open content reports",
        count: openReports.length,
        severity: "Monitor",
        href: "#content-reports",
      },
      {
        issue: "Licenses nearing expiration",
        count: coverage.expiredOrSoonExpiringLicenses.length,
        severity: "Blocked",
        href: "#license-readiness",
      },
      {
        issue: "Content awaiting legal review",
        count: demoQuestions.filter((item) => item.status === "LEGAL_REVIEW")
          .length,
        severity: "Monitor",
        href: "/admin/questions?status=LEGAL_REVIEW",
      },
    ] satisfies AttentionItem[]
  ).filter((item) => item.count > 0);
  const publishedQuestionsBySubject = groupPublishedQuestionsBySubject();
  const essaySubjects = groupEssaysBySubject();
  const maxSubjectQuestionCount = Math.max(
    1,
    ...publishedQuestionsBySubject.map((item) => item.count),
  );

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
              Overview
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
              Content operations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Administrators create, review, publish, and monitor demonstration
              content for the student learning experience.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <details className="group relative">
              <summary
                className={cn(
                  buttonVariants(),
                  "cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden",
                )}
                tabIndex={0}
              >
                <Plus aria-hidden="true" className="size-4" />
                Create content
              </summary>
              <div className="mt-2 w-full rounded-lg border border-stone-200 bg-white p-2 shadow-lg sm:absolute sm:right-0 sm:z-20 sm:w-56">
                <Link
                  className="flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  href={"/admin/questions#create-question" as Route}
                >
                  Create question
                </Link>
                <Link
                  className="flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  href="#essay-readiness"
                >
                  Create essay
                </Link>
                <Link
                  className="flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  href="#podcast-operations"
                >
                  Upload podcast
                </Link>
              </div>
            </details>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="#import-content"
            >
              <Import aria-hidden="true" className="size-4" />
              Import content
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="summary-metrics-heading" className="space-y-3">
        <h2
          className="text-lg font-semibold text-stone-950"
          id="summary-metrics-heading"
        >
          Summary metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="quick-actions-heading"
        className="rounded-lg border border-stone-200 bg-white p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-stone-950"
              id="quick-actions-heading"
            >
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Jump directly to the most common content operations.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/admin/questions#create-question"
              icon={ListChecks}
              label="Create question"
            />
            <QuickAction
              href="#essay-readiness"
              icon={FileText}
              label="Create essay"
            />
            <QuickAction
              href="#podcast-operations"
              icon={Mic2}
              label="Upload podcast"
            />
            <QuickAction
              href="#import-content"
              icon={Import}
              label="Import content"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="needs-attention-heading"
        className="rounded-lg border border-stone-200 bg-white p-5"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle aria-hidden="true" className="size-5 text-amber-700" />
          <h2
            className="text-lg font-semibold text-stone-950"
            id="needs-attention-heading"
          >
            Needs attention
          </h2>
        </div>
        {attentionItems.length > 0 ? (
          <div className="mt-4 divide-y divide-stone-100">
            {attentionItems.map((item) => (
              <AttentionRow item={item} key={item.issue} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            description="No content operations need attention in the current demonstration dataset."
            icon={CheckCircle2}
            title="All clear"
          />
        )}
      </section>

      <section
        aria-labelledby="coverage-heading"
        className="rounded-lg border border-stone-200 bg-white p-5"
      >
        <div className="flex items-center gap-3">
          <ShieldCheck aria-hidden="true" className="size-5 text-emerald-700" />
          <h2
            className="text-lg font-semibold text-stone-950"
            id="coverage-heading"
          >
            Content coverage
          </h2>
        </div>
        <div className="mt-4 grid gap-5 xl:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-950">
              Published questions by subject
            </h3>
            <div className="mt-3 space-y-3">
              {publishedQuestionsBySubject.map((item) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-stone-800">
                      {item.subject}
                    </span>
                    <span className="text-stone-600">
                      {item.count} published
                    </span>
                  </div>
                  <div
                    aria-label={`${item.subject}: ${item.count} published questions`}
                    aria-valuemax={maxSubjectQuestionCount}
                    aria-valuemin={0}
                    aria-valuenow={item.count}
                    className="mt-2 h-2 rounded-full bg-stone-100"
                    role="progressbar"
                  >
                    <div
                      className="h-2 rounded-full bg-emerald-700"
                      style={{
                        width: `${Math.max(
                          4,
                          (item.count / maxSubjectQuestionCount) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CoverageFact
              count={coverage.zeroPublishedQuestionTopics.length}
              label="Categories with no published questions"
            />
            <CoverageFact
              count={coverage.essaysMissingRubrics.length}
              id="essay-readiness"
              label="Essays missing rubric items"
            />
            <CoverageFact
              count={podcastsMissingTopicsOrTranscripts.length}
              id="podcast-readiness"
              label="Podcasts missing topics or transcripts"
            />
            <CoverageFact
              count={coverage.expiredOrSoonExpiringLicenses.length}
              id="license-readiness"
              label="Licenses expiring soon"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <caption className="sr-only">
              Active essay subjects in the demonstration dataset
            </caption>
            <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Active essays</th>
                <th className="py-2 pr-4">Status text</th>
              </tr>
            </thead>
            <tbody>
              {essaySubjects.map((item) => (
                <tr className="border-b border-stone-100" key={item.subject}>
                  <td className="py-3 pr-4 font-medium text-stone-950">
                    {item.subject}
                  </td>
                  <td className="py-3 pr-4">{item.count}</td>
                  <td className="py-3 pr-4 text-stone-600">
                    {item.count > 0 ? "Essay coverage exists" : "No essays"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section
          aria-labelledby="reports-heading"
          className="rounded-lg border border-stone-200 bg-white p-5"
          id="content-reports"
        >
          <div className="flex items-center gap-3">
            <Megaphone aria-hidden="true" className="size-5 text-emerald-700" />
            <h2
              className="text-lg font-semibold text-stone-950"
              id="reports-heading"
            >
              Content reports
            </h2>
          </div>
          {openReports.length > 0 ? (
            <div className="mt-4 space-y-3">
              {openReports.map((report) => (
                <div
                  className="rounded-md border border-stone-200 p-3"
                  key={report.id}
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {report.contentKind} report
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{report.reason}</p>
                  <p className="mt-1 text-xs font-medium text-stone-600">
                    Status: {report.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              description="No demonstration content reports are awaiting moderation."
              icon={Megaphone}
              title="No open reports"
            />
          )}
        </section>

        <section
          aria-labelledby="recent-activity-heading"
          className="rounded-lg border border-stone-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <History aria-hidden="true" className="size-5 text-emerald-700" />
            <h2
              className="text-lg font-semibold text-stone-950"
              id="recent-activity-heading"
            >
              Recent activity
            </h2>
          </div>
          <EmptyState
            className="mt-4"
            description="No audit-log records are available in this demonstration environment."
            icon={History}
            title="No recent activity"
          />
        </section>
      </div>

      <section
        aria-labelledby="podcast-operations-heading"
        className="rounded-lg border border-stone-200 bg-white p-5"
        id="podcast-operations"
      >
        <div className="flex items-center gap-3">
          <FileAudio aria-hidden="true" className="size-5 text-emerald-700" />
          <h2
            className="text-lg font-semibold text-stone-950"
            id="podcast-operations-heading"
          >
            Podcast operations
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Upload reviewed demonstration audio, inspect processing state, and
          publish approved episodes.
        </p>
        <form
          action={uploadPodcastAudioAction}
          className="mt-5 grid gap-4 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Audio file
              <input
                accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a"
                className="min-h-10 rounded-md border border-stone-300 px-3 py-2 text-sm"
                name="audio"
                required
                type="file"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Title
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION uploaded episode"
                name="title"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Instructor
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue="Development Instructor"
                name="instructor"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Subject
                <select
                  className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                  name="subject"
                >
                  {Object.keys(MBE_CATEGORIES_BY_SUBJECT).map((subject) => (
                    <option key={subject}>{subject}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Topics
                <input
                  className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                  defaultValue="Jurisdiction and venue"
                  name="topics"
                />
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Summary
              <textarea
                className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION uploaded audio summary."
                name="summary"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Learning objectives
              <textarea
                className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION listen and resume progress."
                name="learningObjectives"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Manual transcript
              <textarea
                className="min-h-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="DEMO_NOT_FOR_PUBLICATION uploaded transcript segment."
                name="transcriptText"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Timestamped transcript segments
              <textarea
                className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="0|30|DEMO_NOT_FOR_PUBLICATION uploaded transcript segment."
                name="transcriptSegments"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Chapters
              <textarea
                className="min-h-16 rounded-md border border-stone-300 px-3 py-2 text-sm"
                defaultValue="0|Uploaded audio"
                name="chapters"
              />
            </label>
            <Button type="submit">Upload audio</Button>
          </div>
        </form>

        <div
          aria-label="Podcast episodes table"
          className="mt-6 overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          role="region"
          tabIndex={0}
        >
          <table className="w-full min-w-[54rem] text-left text-sm">
            <caption className="sr-only">
              Podcast episodes awaiting review or publication
            </caption>
            <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
              <tr>
                <th className="py-2 pr-4">Episode</th>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Processing</th>
                <th className="py-2 pr-4">Review</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {podcastEpisodes.map((episode) => (
                <tr className="border-b border-stone-100" key={episode.id}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-stone-950">
                      {episode.title}
                    </p>
                    <p className="text-xs text-stone-500">{episode.summary}</p>
                  </td>
                  <td className="py-3 pr-4">{episode.subject}</td>
                  <td className="py-3 pr-4">
                    <span className="font-medium">
                      {episode.processingState}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {episode.reviewed ? "Reviewed" : "Awaiting review"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={reviewPodcastEpisodeAction}>
                        <input
                          name="episodeId"
                          type="hidden"
                          value={episode.id}
                        />
                        <Button size="sm" type="submit" variant="secondary">
                          Mark reviewed
                        </Button>
                      </form>
                      <form action={publishPodcastEpisodeAction}>
                        <input
                          name="episodeId"
                          type="hidden"
                          value={episode.id}
                        />
                        <Button size="sm" type="submit">
                          Publish podcast
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="import-content-heading"
        className="rounded-lg border border-stone-200 bg-white p-5"
        id="import-content"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-stone-950"
              id="import-content-heading"
            >
              Import content
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Import previews are supported; detailed row validation remains on
              the import workflow.
            </p>
          </div>
          <Link
            className={cn(buttonVariants({ variant: "secondary" }))}
            href="#import-content"
          >
            Import content
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Link
      aria-label={`${metric.title}: ${metric.count}. ${metric.description}`}
      className="group block rounded-lg border border-stone-200 bg-white p-5 outline-none transition-colors hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      href={metric.href as Route}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-700">
            {metric.title}
          </h3>
          <p className="mt-2 text-3xl font-semibold text-stone-950">
            {metric.count}
          </p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 size-4 text-stone-500 group-hover:text-emerald-800"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {metric.description}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-700">
        Status: {metric.status}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof ListChecks;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      href={href as Route}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <h3 className="text-sm font-semibold text-stone-950">{item.issue}</h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-stone-600">
          Severity: {item.severity}
        </p>
      </div>
      <p className="text-sm font-semibold text-stone-950">
        {item.count} item{item.count === 1 ? "" : "s"}
      </p>
      <Link
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        href={item.href as Route}
      >
        Open destination
      </Link>
    </div>
  );
}

function CoverageFact({
  count,
  id,
  label,
}: {
  count: number;
  id?: string;
  label: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4" id={id}>
      <p className="text-2xl font-semibold text-stone-950">{count}</p>
      <h3 className="mt-2 text-sm font-semibold text-stone-800">{label}</h3>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-stone-600">
        Status: {count > 0 ? "Attention needed" : "All clear"}
      </p>
    </div>
  );
}

function countByStatus(statuses: ContentWorkflowStatus[]) {
  return (
    demoQuestions.filter((item) => statuses.includes(item.status)).length +
    demoEssays.filter((item) => statuses.includes(item.status)).length +
    demoPodcasts.filter((item) => statuses.includes(item.status)).length
  );
}

function groupPublishedQuestionsBySubject() {
  const subjectCounts = new Map<string, number>();

  for (const question of demoQuestions) {
    if (question.status !== "PUBLISHED") {
      continue;
    }

    subjectCounts.set(
      question.subject,
      (subjectCounts.get(question.subject) ?? 0) + 1,
    );
  }

  return [...subjectCounts.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

function groupEssaysBySubject() {
  const subjectCounts = new Map<string, number>();

  for (const essay of demoEssays) {
    if (essay.status === "RETIRED") {
      continue;
    }

    subjectCounts.set(
      essay.subject,
      (subjectCounts.get(essay.subject) ?? 0) + 1,
    );
  }

  return [...subjectCounts.entries()]
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}
