"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  Eye,
  History,
  Pencil,
  RotateCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import {
  type ComponentType,
  type RefObject,
  type SVGProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import { retireDemoContentAction } from "../actions";

export type QuestionRow = {
  id: string;
  shortTitle: string;
  subject: string;
  category: string;
  status: string;
  version: number;
  reviewer: string | null;
  updatedAt: string;
  licenseKey: string;
  topic: string;
  hasCompleteRationales: boolean;
  batchId?: string | null;
  provenance?: string | null;
  reviewRequired?: boolean;
  detailHref?: string | null;
};

type QuestionsManagementClientProps = {
  categories: string[];
  licenses: string[];
  questions: QuestionRow[];
  reviewers: string[];
  subjects: string[];
};

type SortKey =
  | "updated-desc"
  | "updated-asc"
  | "key-asc"
  | "subject-asc"
  | "status-asc";

const PAGE_SIZE = 5;
const VALID_SORTS: SortKey[] = [
  "updated-desc",
  "updated-asc",
  "key-asc",
  "subject-asc",
  "status-asc",
];

export function QuestionsManagementClient({
  categories,
  licenses,
  questions,
  reviewers,
  subjects,
}: QuestionsManagementClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    action: "retire" | "submit";
    question: QuestionRow;
    trigger: HTMLElement | null;
  } | null>(null);
  const dialogTitleRef = useRef<HTMLHeadingElement>(null);
  const lastUrlSearchRef = useRef(urlSearch);

  const query = useMemo(() => readQuery(searchParams), [searchParams]);
  const requestError = hasInvalidQuery(searchParams);
  const filteredQuestions = useMemo(
    () => filterAndSortQuestions(questions, query),
    [questions, query],
  );
  const pageCount = Math.max(
    1,
    Math.ceil(filteredQuestions.length / PAGE_SIZE),
  );
  const page = Math.min(query.page, pageCount);
  const paginatedQuestions = filteredQuestions.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const activeFilters = getActiveFilters(query);
  const resultMessage = `${filteredQuestions.length} result${
    filteredQuestions.length === 1 ? "" : "s"
  }`;

  useEffect(() => {
    if (lastUrlSearchRef.current === urlSearch) {
      return;
    }

    lastUrlSearchRef.current = urlSearch;
    const timeout = window.setTimeout(() => setSearchDraft(urlSearch), 0);
    return () => window.clearTimeout(timeout);
  }, [urlSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (searchDraft.trim() !== current) {
        updateQuery({ q: searchDraft.trim(), page: null });
      }
      setIsDebouncing(false);
    }, 250);

    return () => window.clearTimeout(timeout);
    // searchParams changes are handled by the effect above; including them here
    // would restart the debounce after each URL update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  useEffect(() => {
    if (dialog) {
      dialogTitleRef.current?.focus();
    }
  }, [dialog]);

  useEffect(() => {
    if (!dialog) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDialog();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  });

  function updateQuery(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "All" || value === "Any") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const next = params.toString();
    router.replace((next ? `${pathname}?${next}` : pathname) as Route, {
      scroll: false,
    });
  }

  function clearAllFilters() {
    setSearchDraft("");
    setIsDebouncing(false);
    router.replace(pathname as Route, { scroll: false });
  }

  function closeDialog() {
    const trigger = dialog?.trigger;
    setDialog(null);
    window.requestAnimationFrame(() => trigger?.focus());
  }

  return (
    <section
      aria-labelledby="question-results-heading"
      className="rounded-lg border border-stone-200 bg-white"
    >
      <div className="border-b border-stone-200 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium text-stone-800">
            Search
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-500"
              />
              <input
                aria-describedby="question-search-description"
                className="min-h-10 w-full rounded-md border border-stone-300 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                name="q"
                onChange={(event) => {
                  setIsDebouncing(true);
                  setSearchDraft(event.target.value);
                }}
                type="search"
                value={searchDraft}
              />
            </div>
            <span className="sr-only" id="question-search-description">
              Searches question key, subject, category, status, and reviewer.
            </span>
          </label>
          <FilterSelect
            label="Status"
            name="status"
            onChange={(value) => updateQuery({ status: value, page: null })}
            options={[
              "All",
              "DRAFT",
              "LEGAL_REVIEW",
              "EDITORIAL_REVIEW",
              "APPROVED",
              "PUBLISHED",
              "RETIRED",
            ]}
            value={query.status}
          />
          <FilterSelect
            label="Subject"
            name="subject"
            onChange={(value) => updateQuery({ subject: value, page: null })}
            options={["All", ...subjects]}
            value={query.subject}
          />
          <FilterSelect
            label="Category or topic"
            name="category"
            onChange={(value) => updateQuery({ category: value, page: null })}
            options={["All", ...categories]}
            value={query.category}
          />
          <FilterSelect
            label="License"
            name="license"
            onChange={(value) => updateQuery({ license: value, page: null })}
            options={["Any", ...licenses]}
            value={query.license}
          />
          <FilterSelect
            label="Reviewer"
            name="reviewer"
            onChange={(value) => updateQuery({ reviewer: value, page: null })}
            options={["Any", ...reviewers]}
            value={query.reviewer}
          />
          <FilterSelect
            label="Sort"
            name="sort"
            onChange={(value) => updateQuery({ sort: value, page: null })}
            options={VALID_SORTS}
            value={query.sort}
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            onClick={clearAllFilters}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Reset filters
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-sm font-semibold text-stone-950"
              id="question-results-heading"
            >
              Question results
            </h2>
            <p
              aria-live="polite"
              className="mt-1 text-sm text-stone-600"
              role="status"
            >
              {isDebouncing ? "Updating results..." : resultMessage}
            </p>
          </div>
          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <button
                  className="inline-flex min-h-8 items-center rounded-full border border-emerald-700 bg-emerald-50 px-3 text-xs font-medium text-emerald-950 outline-none hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                  key={filter.key}
                  onClick={() => {
                    if (filter.key === "q") {
                      setSearchDraft("");
                    }
                    updateQuery({ [filter.key]: null, page: null });
                  }}
                  type="button"
                >
                  Remove {filter.label}: {filter.value}
                </button>
              ))}
              <button
                className="inline-flex min-h-8 items-center rounded-full border border-stone-300 px-3 text-xs font-medium text-stone-700 outline-none hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                onClick={clearAllFilters}
                type="button"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>

        {requestError ? (
          <div
            className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
            role="alert"
          >
            Some query settings could not be applied. Defaults are being used.
          </div>
        ) : null}
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="p-6 text-sm text-stone-600">
          <p className="font-medium text-stone-950">No results</p>
          <p className="mt-1">Try clearing filters or broadening the search.</p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <div
              aria-label="Question results table"
              className="max-h-[34rem] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              role="region"
              tabIndex={0}
            >
              <table className="w-full min-w-[58rem] text-left text-sm">
                <caption className="sr-only">
                  Filtered question management results
                </caption>
                <thead className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                  <tr>
                    <SortableHeader
                      label="Question"
                      sort="key-asc"
                      currentSort={query.sort}
                      onSort={(sort) => updateQuery({ sort, page: null })}
                    />
                    <SortableHeader
                      label="Subject"
                      sort="subject-asc"
                      currentSort={query.sort}
                      onSort={(sort) => updateQuery({ sort, page: null })}
                    />
                    <th className="px-3 py-2" scope="col">
                      Category
                    </th>
                    <SortableHeader
                      label="Status"
                      sort="status-asc"
                      currentSort={query.sort}
                      onSort={(sort) => updateQuery({ sort, page: null })}
                    />
                    <th className="px-3 py-2" scope="col">
                      Version
                    </th>
                    <th className="px-3 py-2" scope="col">
                      Reviewer
                    </th>
                    <SortableHeader
                      label="Updated"
                      sort={
                        query.sort === "updated-desc"
                          ? "updated-asc"
                          : "updated-desc"
                      }
                      currentSort={query.sort}
                      onSort={(sort) => updateQuery({ sort, page: null })}
                    />
                    <th className="px-3 py-2" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedQuestions.map((question) => (
                    <tr className="border-b border-stone-100" key={question.id}>
                      <th
                        className="px-3 py-3 font-semibold text-stone-950"
                        scope="row"
                      >
                        <span>{question.shortTitle}</span>
                        <span className="block text-xs font-medium text-stone-500">
                          {question.id}
                        </span>
                        {question.provenance ? (
                          <span className="mt-1 inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-950">
                            Original draft
                          </span>
                        ) : null}
                      </th>
                      <td className="px-3 py-3">{question.subject}</td>
                      <td className="px-3 py-3">{question.category}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={question.status} />
                      </td>
                      <td className="px-3 py-3">{question.version}</td>
                      <td className="px-3 py-3">
                        <span>{question.reviewer ?? "Unassigned"}</span>
                        {question.reviewRequired ? (
                          <span className="block text-xs font-medium text-amber-800">
                            Attorney review required
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {formatDate(question.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <RowActionMenu
                          menuFor={menuFor}
                          onDialog={setDialog}
                          onToggle={setMenuFor}
                          question={question}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {paginatedQuestions.map((question) => (
              <article
                className="rounded-lg border border-stone-200 bg-white p-4"
                key={question.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">
                      {question.shortTitle}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">{question.id}</p>
                    {question.provenance ? (
                      <p className="mt-1 inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-950">
                        Original draft
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge status={question.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase text-stone-500">
                      Subject
                    </dt>
                    <dd className="mt-1 text-stone-800">{question.subject}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-stone-500">
                      Updated
                    </dt>
                    <dd className="mt-1 text-stone-800">
                      {formatDate(question.updatedAt)}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-medium uppercase text-stone-500">
                      Category
                    </dt>
                    <dd className="mt-1 text-stone-800">{question.category}</dd>
                  </div>
                  {question.batchId ? (
                    <div className="col-span-2">
                      <dt className="text-xs font-medium uppercase text-stone-500">
                        Batch
                      </dt>
                      <dd className="mt-1 text-stone-800">
                        {question.batchId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="mt-3">
                  <RowActionMenu
                    menuFor={menuFor}
                    onDialog={setDialog}
                    onToggle={setMenuFor}
                    question={question}
                  />
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            updatePage={(nextPage) =>
              updateQuery({ page: nextPage === 1 ? null : String(nextPage) })
            }
          />
        </>
      )}

      {dialog ? (
        <ConfirmationDialog
          dialog={dialog}
          onClose={closeDialog}
          titleRef={dialogTitleRef}
        />
      ) : null}
    </section>
  );
}

function FilterSelect({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-stone-800">
      {label}
      <select
        className="min-h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortableHeader({
  currentSort,
  label,
  onSort,
  sort,
}: {
  currentSort: SortKey;
  label: string;
  onSort: (sort: SortKey) => void;
  sort: SortKey;
}) {
  const active = currentSort === sort;

  return (
    <th className="px-3 py-2" scope="col">
      <button
        aria-label={`Sort by ${label}`}
        className="inline-flex min-h-8 items-center gap-1 rounded-md px-1 font-semibold outline-none hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        onClick={() => onSort(sort)}
        type="button"
      >
        {label}
        {active ? (
          sort.endsWith("desc") ? (
            <ArrowDown aria-hidden="true" className="size-3" />
          ) : (
            <ArrowUp aria-hidden="true" className="size-3" />
          )
        ) : null}
      </button>
    </th>
  );
}

function RowActionMenu({
  menuFor,
  onDialog,
  onToggle,
  question,
}: {
  menuFor: string | null;
  onDialog: (dialog: {
    action: "retire" | "submit";
    question: QuestionRow;
    trigger: HTMLElement | null;
  }) => void;
  onToggle: (id: string | null) => void;
  question: QuestionRow;
}) {
  const open = menuFor === question.id;
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative inline-block text-left">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-9 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        onClick={() => onToggle(open ? null : question.id)}
        ref={triggerRef}
        type="button"
      >
        Actions
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-stone-200 bg-white p-2 shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onToggle(null);
              triggerRef.current?.focus();
            }
          }}
          role="menu"
        >
          <MenuItem icon={Eye} label="Preview" />
          {question.detailHref ? (
            <MenuLink
              href={question.detailHref as Route}
              label="Review details"
            />
          ) : null}
          <MenuItem icon={Pencil} label="Edit" />
          <MenuItem icon={Copy} label="Duplicate" />
          <MenuItem icon={History} label="Report history" />
          {question.status === "DRAFT" ? (
            <MenuItem
              disabledReason="Workflow persistence is not available in this demo."
              icon={Send}
              label="Submit for review"
              onClick={() => {
                onToggle(null);
                onDialog({
                  action: "submit",
                  question,
                  trigger: triggerRef.current,
                });
              }}
            />
          ) : null}
          {question.status === "PUBLISHED" ? (
            <MenuItem
              icon={Trash2}
              label="Retire"
              onClick={() => {
                onToggle(null);
                onDialog({
                  action: "retire",
                  question,
                  trigger: triggerRef.current,
                });
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      href={href}
      role="menuitem"
    >
      <Eye aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

function MenuItem({
  disabledReason,
  icon: Icon,
  label,
  onClick,
}: {
  disabledReason?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}) {
  if (disabledReason) {
    return (
      <button
        aria-describedby={`${label.replaceAll(" ", "-")}-disabled-reason`}
        className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-stone-400 outline-none"
        disabled
        role="menuitem"
        type="button"
      >
        <Icon aria-hidden="true" className="size-4" />
        <span>
          {label}
          <span
            className="block text-xs text-stone-500"
            id={`${label.replaceAll(" ", "-")}-disabled-reason`}
          >
            {disabledReason}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function ConfirmationDialog({
  dialog,
  onClose,
  titleRef,
}: {
  dialog: { action: "retire" | "submit"; question: QuestionRow };
  onClose: () => void;
  titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const isRetire = dialog.action === "retire";

  return (
    <div
      aria-labelledby="question-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-xl">
        <h2
          className="text-lg font-semibold text-stone-950 outline-none"
          id="question-dialog-title"
          ref={titleRef}
          tabIndex={-1}
        >
          {isRetire ? "Retire question?" : "Submit question for review?"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {isRetire
            ? `Retiring ${dialog.question.id} changes its publication status.`
            : "This demonstration screen does not persist submit-for-review changes yet."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          {isRetire ? (
            <form action={retireDemoContentAction}>
              <input name="currentStatus" type="hidden" value="PUBLISHED" />
              <Button type="submit">Confirm retire</Button>
            </form>
          ) : (
            <Button disabled type="button">
              Confirm submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  updatePage,
}: {
  page: number;
  pageCount: number;
  updatePage: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-stone-600">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          className="inline-flex min-h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-50"
          disabled={page === 1}
          onClick={() => updatePage(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="inline-flex min-h-9 items-center rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800 outline-none hover:border-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-50"
          disabled={page === pageCount}
          onClick={() => updatePage(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-md border border-stone-300 bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-800">
      Status: {formatOption(status)}
    </span>
  );
}

function readQuery(searchParams: URLSearchParams) {
  const sortParam = searchParams.get("sort");
  const pageParam = Number(searchParams.get("page") ?? "1");

  return {
    category: searchParams.get("category") ?? "All",
    issue: searchParams.get("issue") ?? "All",
    license: searchParams.get("license") ?? "Any",
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    q: searchParams.get("q") ?? "",
    reviewer: searchParams.get("reviewer") ?? "Any",
    sort: VALID_SORTS.includes(sortParam as SortKey)
      ? (sortParam as SortKey)
      : "updated-desc",
    status: searchParams.get("status") ?? "All",
    subject: searchParams.get("subject") ?? "All",
  };
}

function hasInvalidQuery(searchParams: URLSearchParams) {
  const sortParam = searchParams.get("sort");
  const pageParam = searchParams.get("page");
  const pageNumber = Number(pageParam);

  return Boolean(
    (sortParam && !VALID_SORTS.includes(sortParam as SortKey)) ||
    (pageParam && (!Number.isFinite(pageNumber) || pageNumber < 1)),
  );
}

function filterAndSortQuestions(
  questions: QuestionRow[],
  query: ReturnType<typeof readQuery>,
) {
  return questions
    .filter((question) => {
      const haystack =
        `${question.id} ${question.shortTitle} ${question.subject} ${question.category} ${question.topic} ${question.status} ${question.reviewer ?? ""}`.toLowerCase();

      return (
        (!query.q || haystack.includes(query.q.toLowerCase())) &&
        (query.status === "All" || question.status === query.status) &&
        (query.subject === "All" || question.subject === query.subject) &&
        (query.category === "All" ||
          question.category === query.category ||
          question.topic === query.category) &&
        (query.issue === "All" ||
          (query.issue === "missing-rationales" &&
            !question.hasCompleteRationales)) &&
        (query.license === "Any" || question.licenseKey === query.license) &&
        (query.reviewer === "Any" ||
          (question.reviewer ?? "Unassigned") === query.reviewer)
      );
    })
    .sort((a, b) => {
      switch (query.sort) {
        case "updated-asc":
          return a.updatedAt.localeCompare(b.updatedAt);
        case "key-asc":
          return a.id.localeCompare(b.id);
        case "subject-asc":
          return a.subject.localeCompare(b.subject);
        case "status-asc":
          return a.status.localeCompare(b.status);
        case "updated-desc":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
}

function getActiveFilters(query: ReturnType<typeof readQuery>) {
  return [
    query.q ? { key: "q", label: "Search", value: query.q } : null,
    query.status !== "All"
      ? { key: "status", label: "Status", value: formatOption(query.status) }
      : null,
    query.subject !== "All"
      ? { key: "subject", label: "Subject", value: query.subject }
      : null,
    query.category !== "All"
      ? { key: "category", label: "Category", value: query.category }
      : null,
    query.issue !== "All"
      ? { key: "issue", label: "Issue", value: "Missing rationales" }
      : null,
    query.license !== "Any"
      ? { key: "license", label: "License", value: query.license }
      : null,
    query.reviewer !== "Any"
      ? { key: "reviewer", label: "Reviewer", value: query.reviewer }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}
