import { questions } from "@/lib/data";
import type { Attempt, DashboardStats, Question, UserProgress, WeakArea } from "@/lib/types";

function areaKey(question: Pick<Question, "subject" | "category" | "subtopic">) {
  return `${question.subject}|||${question.category}|||${question.subtopic}`;
}

function splitAreaKey(key: string) {
  const [subject, category, subtopic] = key.split("|||");
  return { subject, category, subtopic };
}

export function calculateWeakAreas(progress: UserProgress): WeakArea[] {
  const buckets = new Map<string, WeakArea>();

  progress.attempts.forEach((attempt) => {
    const question = questions.find((item) => item.id === attempt.questionId);
    const key = areaKey(attempt);
    const existing = buckets.get(key) || {
      id: key,
      subject: attempt.subject,
      category: attempt.category,
      subtopic: attempt.subtopic,
      score: 0,
      missed: 0,
      guessed: 0,
      confusing: 0,
      slow: 0,
      correctRecovery: 0,
      reason: "",
      questionIds: []
    };

    const estimated = question?.estimatedSeconds || 90;
    if (!attempt.isCorrect) {
      existing.score += 24;
      existing.missed += 1;
    } else {
      existing.score -= existing.correctRecovery >= 1 ? 14 : 9;
      existing.correctRecovery += 1;
    }

    if (attempt.guessed) {
      existing.score += 10;
      existing.guessed += 1;
    }

    if (attempt.markedConfusing) {
      existing.score += 14;
      existing.confusing += 1;
    }

    if (attempt.timeSpent > estimated * 1.35) {
      existing.score += 8;
      existing.slow += 1;
    }

    if (!existing.questionIds.includes(attempt.questionId)) {
      existing.questionIds.push(attempt.questionId);
    }

    buckets.set(key, existing);
  });

  return Array.from(buckets.values())
    .map((area) => {
      const reasons = [];
      if (area.missed) reasons.push(`missed ${area.missed}`);
      if (area.guessed) reasons.push(`marked guessed ${area.guessed}`);
      if (area.confusing) reasons.push(`marked confusing ${area.confusing}`);
      if (area.slow) reasons.push(`ran long ${area.slow}`);
      return {
        ...area,
        score: Math.max(0, Math.round(area.score)),
        reason: reasons.length ? `You ${reasons.join(", ")} in this area.` : "Recent correct answers are improving this area."
      };
    })
    .filter((area) => area.score > 0)
    .sort((a, b) => b.score - a.score);
}

function currentStreak(attempts: Attempt[]) {
  let streak = 0;
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (!attempts[index].isCorrect) break;
    streak += 1;
  }
  return streak;
}

export function buildDashboardStats(progress: UserProgress): DashboardStats {
  const attemptedQuestionIds = new Set(progress.attempts.map((attempt) => attempt.questionId));
  const correct = progress.attempts.filter((attempt) => attempt.isCorrect).length;
  const incorrect = progress.attempts.length - correct;
  const weakAreas = calculateWeakAreas(progress);

  const bySubject = new Map<string, { attempted: number; correct: number; missedSubtopics: Map<string, number> }>();
  progress.attempts.forEach((attempt) => {
    const current = bySubject.get(attempt.subject) || {
      attempted: 0,
      correct: 0,
      missedSubtopics: new Map<string, number>()
    };
    current.attempted += 1;
    current.correct += attempt.isCorrect ? 1 : 0;
    if (!attempt.isCorrect) {
      current.missedSubtopics.set(attempt.subtopic, (current.missedSubtopics.get(attempt.subtopic) || 0) + 1);
    }
    bySubject.set(attempt.subject, current);
  });

  const subjectStats = Array.from(bySubject.entries()).map(([subject, stats]) => {
    const subjectWeakness = weakAreas
      .filter((area) => area.subject === subject)
      .reduce((total, area) => total + area.score, 0);

    return {
      subject,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0,
      weaknessScore: Math.round(subjectWeakness),
      topMissedSubtopics: Array.from(stats.missedSubtopics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subtopic]) => subtopic)
    };
  }).sort((a, b) => b.attempted - a.attempted);

  const trapCounts = new Map<string, number>();
  progress.attempts.filter((attempt) => !attempt.isCorrect).forEach((attempt) => {
    const question = questions.find((item) => item.id === attempt.questionId);
    const trap = question?.explanation.commonTrap || "Common trap unavailable.";
    trapCounts.set(trap, (trapCounts.get(trap) || 0) + 1);
  });

  return {
    totalQuestions: questions.length,
    attempted: attemptedQuestionIds.size,
    correct,
    incorrect,
    accuracy: progress.attempts.length ? Math.round((correct / progress.attempts.length) * 100) : 0,
    streak: currentStreak(progress.attempts),
    subjectStats,
    weakAreas,
    recentMistakes: progress.attempts.filter((attempt) => !attempt.isCorrect).slice(-5).reverse(),
    commonTraps: Array.from(trapCounts.entries())
      .map(([trap, count]) => ({ trap, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
    improving: weakAreas
      .filter((area) => area.correctRecovery > 0)
      .sort((a, b) => b.correctRecovery - a.correctRecovery)
      .slice(0, 3)
  };
}

export function recommendQuestions(progress: UserProgress, limit = 10): Question[] {
  const weakAreas = calculateWeakAreas(progress);
  if (!weakAreas.length) {
    return questions.slice(0, limit);
  }

  const candidates = weakAreas.flatMap((area) => {
    const parts = splitAreaKey(area.id);
    return questions.filter((question) => (
      question.subject === parts.subject &&
      question.category === parts.category &&
      question.subtopic === parts.subtopic
    ));
  });

  return Array.from(new Map(candidates.map((question) => [question.id, question])).values()).slice(0, limit);
}
