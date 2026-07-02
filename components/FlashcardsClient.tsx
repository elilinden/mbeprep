"use client";

import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Info, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { deleteFlashcardProgressFromCloud, hydrateFlashcardProgressFromCloud, saveFlashcardProgressToCloud } from "@/lib/cloudStudy";
import { applySpacedRepetition, dueLabel, isFlashcardDue } from "@/lib/spacedRepetition";
import type { FlashcardDeck, FlashcardProgress, FlashcardRating } from "@/lib/types";
import { readJsonStorage, scopedStorageKey, writeJsonStorage } from "@/lib/userStorage";

const flashcardProgressBaseKey = "mbe-prep-flashcard-progress-v1";
const smartReviewDescription = "Shows missed cards sooner and mastered cards less often.";
type ReviewMode = "all" | "spaced";

function loadProgress() {
  return readJsonStorage<Record<string, FlashcardProgress>>(scopedStorageKey(flashcardProgressBaseKey), {});
}

function saveProgress(progress: Record<string, FlashcardProgress>) {
  writeJsonStorage(scopedStorageKey(flashcardProgressBaseKey), progress);
  void saveFlashcardProgressToCloud(progress);
}

export function FlashcardsClient({ decks }: { decks: FlashcardDeck[] }) {
  const [selectedDeckId, setSelectedDeckId] = useState(decks[0]?.id || "");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FlashcardRating | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("all");
  const [progress, setProgress] = useState<Record<string, FlashcardProgress>>(() => loadProgress());

  useEffect(() => {
    let active = true;
    const loadStoredProgress = window.setTimeout(() => {
      const localProgress = loadProgress();
      setProgress(localProgress);
      void hydrateFlashcardProgressFromCloud(localProgress).then((cloudProgress) => {
        if (!active) {
          return;
        }

        setProgress(cloudProgress);
        writeJsonStorage(scopedStorageKey(flashcardProgressBaseKey), cloudProgress);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(loadStoredProgress);
    };
  }, []);

  const selectedDeck = useMemo(() => (
    decks.find((deck) => deck.id === selectedDeckId) || decks[0]
  ), [decks, selectedDeckId]);
  const deckCards = useMemo(() => selectedDeck?.cards || [], [selectedDeck]);
  const cards = useMemo(() => {
    if (!activeFilter) {
      if (reviewMode === "spaced") {
        const now = new Date();
        return deckCards
          .filter((card) => isFlashcardDue(progress[card.id], now))
          .sort((first, second) => {
            const firstProgress = progress[first.id];
            const secondProgress = progress[second.id];
            const firstDue = firstProgress?.nextReviewAt ? new Date(firstProgress.nextReviewAt).getTime() : 0;
            const secondDue = secondProgress?.nextReviewAt ? new Date(secondProgress.nextReviewAt).getTime() : 0;
            const firstNeedsWork = firstProgress?.lastRating === "needs-work" ? 1 : 0;
            const secondNeedsWork = secondProgress?.lastRating === "needs-work" ? 1 : 0;
            const firstLapses = firstProgress?.lapses || 0;
            const secondLapses = secondProgress?.lapses || 0;

            return secondNeedsWork - firstNeedsWork || secondLapses - firstLapses || firstDue - secondDue;
          });
      }

      return deckCards;
    }

    return deckCards.filter((card) => progress[card.id]?.lastRating === activeFilter);
  }, [activeFilter, deckCards, progress, reviewMode]);
  const safeIndex = cards.length ? Math.min(index, cards.length - 1) : 0;
  const current = cards[safeIndex];

  const deckStats = useMemo(() => {
    const reviewed = deckCards.filter((card) => progress[card.id]);
    const gotIt = reviewed.filter((card) => progress[card.id].lastRating === "got-it").length;
    const needsWork = reviewed.filter((card) => progress[card.id].lastRating === "needs-work").length;
    const due = deckCards.filter((card) => isFlashcardDue(progress[card.id])).length;
    return { reviewed: reviewed.length, gotIt, needsWork, due };
  }, [deckCards, progress]);

  function chooseDeck(deckId: string) {
    setSelectedDeckId(deckId);
    setActiveFilter(null);
    setIndex(0);
    setRevealed(false);
  }

  function goTo(nextIndex: number) {
    setIndex(Math.min(cards.length - 1, Math.max(0, nextIndex)));
    setRevealed(false);
  }

  function toggleFilter(filter: FlashcardRating) {
    setIndex(0);
    setRevealed(false);
    setReviewMode("all");
    setActiveFilter((value) => value === filter ? null : filter);
  }

  function chooseReviewMode(nextMode: ReviewMode) {
    setIndex(0);
    setRevealed(false);
    setActiveFilter(null);
    setReviewMode(nextMode);
  }

  function rateCard(rating: FlashcardRating) {
    if (!current) {
      return;
    }

    const existing = progress[current.id];
    const reviewedAt = new Date();
    const schedule = applySpacedRepetition(existing, rating, reviewedAt);
    const next = {
      ...progress,
      [current.id]: {
        cardId: current.id,
        attempts: (existing?.attempts || 0) + 1,
        gotIt: (existing?.gotIt || 0) + (rating === "got-it" ? 1 : 0),
        needsWork: (existing?.needsWork || 0) + (rating === "needs-work" ? 1 : 0),
        lastRating: rating,
        lastReviewedAt: reviewedAt.toISOString(),
        ...schedule
      }
    };

    setProgress(next);
    saveProgress(next);
    goTo(safeIndex >= cards.length - 1 ? 0 : safeIndex + 1);
  }

  function resetDeck() {
    if (!selectedDeck) {
      return;
    }

    const next = { ...progress };
    const cardIds = selectedDeck.cards.map((card) => card.id);
    for (const card of selectedDeck.cards) {
      delete next[card.id];
    }
    setProgress(next);
    saveProgress(next);
    void deleteFlashcardProgressFromCloud(cardIds);
    setIndex(0);
    setRevealed(false);
  }

  if (!selectedDeck || !deckCards.length) {
    return (
      <GlassCard>
        <h1 className="text-3xl font-semibold tracking-tight">Flashcards</h1>
        <p className="mt-3 text-slate-950/62">No flashcards have been added yet.</p>
      </GlassCard>
    );
  }

  const progressPercent = Math.round((deckStats.reviewed / deckCards.length) * 100);
  const filteredTitle = activeFilter === "got-it" ? "Got it cards" : activeFilter === "needs-work" ? "Needs work cards" : null;
  const modeTitle = reviewMode === "spaced" ? "Smart Review" : null;

  if (!current) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Flashcards</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Review by recall</h1>
        </div>
        <GlassCard strong className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {reviewMode === "spaced" ? "No cards are due right now." : "No cards in this filter yet."}
          </h2>
          <p className="text-slate-950/64">
            {reviewMode === "spaced"
              ? "You can switch back to all cards, or come back when Smart Review has more cards ready."
              : `Mark some cards as ${activeFilter === "got-it" ? "Got It" : "Needs Work"}, then this view will collect them here.`}
          </p>
          <button
            type="button"
            onClick={() => chooseReviewMode("all")}
            className="w-fit rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Show All Cards
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentProgress = progress[current.id];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">Flashcards</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Review by recall</h1>
          <p className="mt-3 max-w-2xl text-slate-950/64">
            Work the front first, reveal the answer, then mark whether it needs another pass.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => chooseReviewMode("all")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              reviewMode === "all" && !activeFilter ? "bg-indigo-600 text-white" : "bg-white/70 text-slate-950/68 hover:bg-white"
            }`}
          >
            All cards
          </button>
          <button
            type="button"
            onClick={() => chooseReviewMode("spaced")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              reviewMode === "spaced" ? "bg-indigo-600 text-white" : "bg-white/70 text-slate-950/68 hover:bg-white"
            }`}
          >
            <CalendarClock className="mr-2 inline h-4 w-4" />
            Smart Review
            <span className="group/info relative ml-2 inline-flex align-middle" title={smartReviewDescription}>
              <Info className="h-4 w-4" aria-hidden="true" />
              <span className="pointer-events-none absolute right-0 top-7 z-20 hidden w-56 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-700 shadow-xl shadow-slate-900/10 group-hover/info:block">
                {smartReviewDescription}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_1fr]">
        <GlassCard className="space-y-3 self-start">
          <h2 className="text-lg font-semibold">Decks</h2>
          {decks.map((deck) => (
            <button
              key={deck.id}
              type="button"
              onClick={() => chooseDeck(deck.id)}
              className={`w-full rounded-2xl border p-4 text-left ${
                selectedDeck.id === deck.id
                  ? "border-indigo-300 bg-indigo-50/80"
                  : "border-transparent bg-white/62 hover:border-indigo-200 hover:bg-white"
              }`}
            >
              <span className="block text-lg font-semibold">{deck.title}</span>
            </button>
          ))}

          <div className="rounded-3xl border border-slate-200 bg-white/62 p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => chooseReviewMode("spaced")}
                className={`col-span-2 rounded-2xl border p-3 text-left text-indigo-900 transition hover:-translate-y-0.5 ${
                  reviewMode === "spaced" ? "border-indigo-300 bg-indigo-100" : "border-transparent bg-indigo-50 hover:border-indigo-200"
                }`}
                aria-pressed={reviewMode === "spaced"}
              >
                <p className="font-semibold">{deckStats.due}</p>
                <p>Due for Smart Review</p>
              </button>
              <button
                type="button"
                onClick={() => toggleFilter("needs-work")}
                className={`rounded-2xl border p-3 text-left text-amber-900 transition hover:-translate-y-0.5 ${
                  activeFilter === "needs-work" ? "border-amber-300 bg-amber-100" : "border-transparent bg-amber-50 hover:border-amber-200"
                }`}
                aria-pressed={activeFilter === "needs-work"}
              >
                <p className="font-semibold">{deckStats.needsWork}</p>
                <p>Needs work</p>
              </button>
              <button
                type="button"
                onClick={() => toggleFilter("got-it")}
                className={`rounded-2xl border p-3 text-left text-emerald-800 transition hover:-translate-y-0.5 ${
                  activeFilter === "got-it" ? "border-emerald-300 bg-emerald-100" : "border-transparent bg-emerald-50 hover:border-emerald-200"
                }`}
                aria-pressed={activeFilter === "got-it"}
              >
                <p className="font-semibold">{deckStats.gotIt}</p>
                <p>Got it</p>
              </button>
            </div>
            {activeFilter ? (
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                Show all cards
              </button>
            ) : null}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard strong className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700/60">
                  {selectedDeck.subject}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {filteredTitle ? `${filteredTitle}: ` : modeTitle ? `${modeTitle}: ` : ""}Card {safeIndex + 1} of {cards.length}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {reviewMode === "spaced" ? (
                  <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    {dueLabel(currentProgress)}
                  </span>
                ) : null}
                {currentProgress ? (
                  <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                    currentProgress.lastRating === "got-it" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"
                  }`}>
                    {currentProgress.lastRating === "got-it" ? "Last marked got it" : "Last marked needs work"}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              className="min-h-[20rem] w-full rounded-[2rem] border border-slate-200 bg-white/72 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white/86 md:p-8"
              aria-label={revealed ? "Show front of flashcard" : "Show back of flashcard"}
            >
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {revealed ? "Back" : "Front"}
              </div>
              <p className="mt-6 text-2xl font-semibold leading-10 tracking-tight text-slate-950 md:text-3xl md:leading-[3rem]">
                {revealed ? current.back : current.front}
              </p>
            </button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo(safeIndex - 1)}
                  disabled={safeIndex === 0}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-40"
                >
                  <ArrowLeft className="mr-2 inline h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => goTo(safeIndex + 1)}
                  disabled={safeIndex === cards.length - 1}
                  className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {revealed ? (
                  <>
                    <button
                      type="button"
                      onClick={() => rateCard("needs-work")}
                      className="rounded-2xl bg-amber-100 px-5 py-3 font-semibold text-amber-950 hover:bg-amber-200"
                    >
                      Needs Work
                    </button>
                    <button
                      type="button"
                      onClick={() => rateCard("got-it")}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="mr-2 inline h-4 w-4" />
                      Got It
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setRevealed((value) => !value)}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-700"
                >
                  {revealed ? "Show Front" : "Show Back"}
                </button>
              </div>
            </div>
          </GlassCard>

          <button
            type="button"
            onClick={resetDeck}
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            <RotateCcw className="mr-2 inline h-4 w-4" />
            Reset this deck
          </button>
        </div>
      </div>
    </div>
  );
}
