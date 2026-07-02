"use client";

import { BookOpenText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import type { Outline, OutlineBlock, OutlineSection } from "@/lib/outlines";

function sectionText(section: OutlineSection) {
  return section.blocks?.map((block) => block.text).join(" ") || section.body.join(" ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchTerms(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .map((term) => term.toLowerCase())
    .filter(Boolean);
}

function renderHighlighted(text: string, query: string) {
  const terms = searchTerms(query);

  if (!terms.length) {
    return text;
  }

  const matcher = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(matcher);

  return parts.map((part, index) => (
    terms.includes(part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1 text-slate-950">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  ));
}

function renderBlock(block: OutlineBlock, section: OutlineSection, index: number, query: string) {
  if (index === 0 && block.type === "subheading" && block.text === section.title) {
    return null;
  }

  if (block.type === "subheading") {
    return <h4 key={`${section.id}-${index}`} className="pt-3 text-lg font-semibold text-slate-950">{renderHighlighted(block.text, query)}</h4>;
  }

  if (block.type === "minorHeading") {
    return <h5 key={`${section.id}-${index}`} className="pt-2 text-base font-semibold text-slate-900">{renderHighlighted(block.text, query)}</h5>;
  }

  if (block.type === "quote") {
    return (
      <div key={`${section.id}-${index}`} className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-50/80 px-4 py-3 font-medium leading-8 text-slate-950/78">
        {renderHighlighted(block.text, query)}
      </div>
    );
  }

  if (block.type === "compact") {
    return (
      <p key={`${section.id}-${index}`} className="rounded-2xl bg-white/62 px-4 py-2 text-sm font-semibold text-slate-950/70">
        {renderHighlighted(block.text, query)}
      </p>
    );
  }

  if (block.type === "chartHeader" || block.type === "chartRow") {
    const cells = block.text.split(" — ");
    const isHeader = block.type === "chartHeader";
    const columnClass = cells.length === 4 ? "md:grid-cols-4" : cells.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

    return (
      <div
        key={`${section.id}-${index}`}
        className={`grid gap-2 rounded-2xl p-4 text-sm ${columnClass} ${
          isHeader ? "bg-slate-950 font-semibold text-white" : "bg-white/70"
        }`}
      >
        {cells.map((cell, cellIndex) => (
          <p
            key={`${section.id}-${index}-${cellIndex}`}
            className={isHeader ? "leading-6 text-white" : "leading-6 text-slate-950/72"}
          >
            {renderHighlighted(cell || "", query)}
          </p>
        ))}
      </div>
    );
  }

  return <p key={`${section.id}-${index}`} className="leading-8 text-slate-950/72">{renderHighlighted(block.text, query)}</p>;
}

export function OutlinesClient({ outlines }: { outlines: Outline[] }) {
  const [selectedId, setSelectedId] = useState(outlines[0]?.id || "");
  const [query, setQuery] = useState("");
  const selected = outlines.find((outline) => outline.id === selectedId) || outlines[0];

  const visibleSections = useMemo(() => {
    if (!selected) {
      return [];
    }

    const terms = searchTerms(query);
    if (!terms.length) {
      return selected.sections;
    }

    return selected.sections.filter((section) => (
      terms.every((term) => (
        section.title.toLowerCase().includes(term) ||
        sectionText(section).toLowerCase().includes(term)
      ))
    ));
  }, [query, selected]);

  if (!selected) {
    return (
      <GlassCard>
        <h1 className="text-3xl font-semibold tracking-tight">Outlines</h1>
        <p className="mt-3 text-slate-950/62">No outlines have been added yet.</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Outlines</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Rule outlines</h1>
          <p className="mt-3 max-w-2xl text-slate-950/64">
            Clean, searchable topic outlines for quick review before practice.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-950/42" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search outline"
            className="w-full rounded-2xl border border-slate-200 bg-white/76 py-3 pl-11 pr-4 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
        <GlassCard className="space-y-3 self-start lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:overscroll-contain">
          <h2 className="text-lg font-semibold">Topics</h2>
          {outlines.map((outline) => (
            <button
              key={outline.id}
              type="button"
              onClick={() => setSelectedId(outline.id)}
              className={`w-full rounded-2xl border p-4 text-left ${
                selected.id === outline.id
                  ? "border-indigo-300 bg-indigo-50/80 text-slate-950"
                  : "border-transparent bg-white/62 text-slate-950 hover:border-indigo-200 hover:bg-white"
              }`}
            >
              <span className="block text-lg font-semibold">{outline.title}</span>
            </button>
          ))}
        </GlassCard>

        <div className="space-y-4">
          <GlassCard strong>
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                <BookOpenText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-900/55">{selected.subject}</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight">{renderHighlighted(selected.title, query)}</h2>
                <p className="mt-3 leading-7 text-slate-950/66">{renderHighlighted(selected.summary, query)}</p>
              </div>
            </div>
          </GlassCard>

          {visibleSections.length ? visibleSections.map((section) => (
            <details key={section.id} id={section.id} className="glass rounded-[2rem] p-5 md:p-7" open>
              <summary className="cursor-pointer text-xl font-semibold tracking-tight">{renderHighlighted(section.title, query)}</summary>
              <div className="mt-4 space-y-4">
                {section.blocks?.length
                  ? section.blocks.map((block, index) => renderBlock(block, section, index, query))
                  : section.body.map((paragraph, index) => (
                    <p key={`${section.id}-${index}`} className="leading-8 text-slate-950/72">{renderHighlighted(paragraph, query)}</p>
                  ))}
              </div>
            </details>
          )) : (
            <GlassCard>
              <p className="text-slate-950/62">No sections match that search.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
