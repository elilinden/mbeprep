import batch001 from "@/data/batch001.json";
import batch002 from "@/data/batch002.json";
import batch003 from "@/data/batch003.json";
import batch004 from "@/data/batch004.json";
import batch005 from "@/data/batch005.json";
import batch006 from "@/data/batch006.json";
import batch007 from "@/data/batch007.json";
import batch008 from "@/data/batch008.json";
import batch009 from "@/data/batch009.json";
import type { Choice, Explanation, Question } from "@/lib/types";

type RawChoice = Partial<Choice>;
type RawQuestion = {
  key?: string;
  id?: string;
  subject?: string;
  category?: string;
  subtopic?: string;
  difficulty?: string;
  estimatedSeconds?: number;
  stem?: string;
  call?: string;
  choices?: RawChoice[];
  correctChoice?: string;
  explanation?: Partial<Explanation>;
  authorityNotes?: string[];
  [key: string]: unknown;
};

type RawBatch = {
  batchId?: string;
  title?: string;
  rights?: unknown;
  coveragePlan?: unknown;
  questions?: RawQuestion[];
  [key: string]: unknown;
};

const batches: { sourceFile: string; raw: RawBatch }[] = [
  { sourceFile: "batch001.json", raw: batch001 as RawBatch },
  { sourceFile: "batch002.json", raw: batch002 as RawBatch },
  { sourceFile: "batch003.json", raw: batch003 as RawBatch },
  { sourceFile: "batch004.json", raw: batch004 as RawBatch },
  { sourceFile: "batch005.json", raw: batch005 as RawBatch },
  { sourceFile: "batch006.json", raw: batch006 as RawBatch },
  { sourceFile: "batch007.json", raw: batch007 as RawBatch },
  { sourceFile: "batch008.json", raw: batch008 as RawBatch },
  { sourceFile: "batch009.json", raw: batch009 as RawBatch }
];

const fallbackExplanation: Explanation = {
  testedIssue: "Issue not specified.",
  governingRule: "Rule not specified.",
  application: "Application not specified.",
  commonTrap: "Common trap not specified.",
  memoryAid: "Memory aid not specified."
};

function normalizeChoice(choice: RawChoice, index: number, correctChoice: string): Choice {
  const label = choice.label || ["A", "B", "C", "D"][index] || String(index + 1);

  return {
    label,
    text: choice.text || "Choice text unavailable.",
    isCorrect: typeof choice.isCorrect === "boolean" ? choice.isCorrect : label === correctChoice,
    rationale: choice.rationale || "Rationale unavailable.",
    distractorType: choice.distractorType ?? null
  };
}

function normalizeQuestion(raw: RawQuestion, sourceFile: string, batchId: string, index: number): Question {
  const correctChoice = raw.correctChoice || raw.choices?.find((choice) => choice.isCorrect)?.label || "";
  const choices = (raw.choices || []).slice(0, 4).map((choice, choiceIndex) => (
    normalizeChoice(choice, choiceIndex, correctChoice)
  ));

  while (choices.length < 4) {
    choices.push(normalizeChoice({}, choices.length, correctChoice));
  }

  const explanation = raw.explanation || {};

  return {
    id: raw.key || raw.id || `${batchId}-${index + 1}`,
    sourceFile,
    batchId,
    subject: raw.subject || "Uncategorized",
    category: raw.category || "General",
    subtopic: raw.subtopic || "General",
    difficulty: raw.difficulty || "UNKNOWN",
    estimatedSeconds: raw.estimatedSeconds || 90,
    stem: raw.stem || "Question stem unavailable.",
    call: raw.call || "What is the best answer?",
    choices,
    correctChoice: correctChoice || choices.find((choice) => choice.isCorrect)?.label || "A",
    explanation: {
      testedIssue: explanation.testedIssue || fallbackExplanation.testedIssue,
      governingRule: explanation.governingRule || fallbackExplanation.governingRule,
      application: explanation.application || fallbackExplanation.application,
      commonTrap: explanation.commonTrap || fallbackExplanation.commonTrap,
      memoryAid: explanation.memoryAid || fallbackExplanation.memoryAid
    },
    authorityNotes: Array.isArray(raw.authorityNotes) ? raw.authorityNotes : [],
    metadata: {
      sourceFile,
      batchId,
      title: undefined,
      authoring: raw.authoring,
      qualityAudit: raw.qualityAudit
    }
  };
}

export function getQuestions(): Question[] {
  const normalized = batches.flatMap(({ sourceFile, raw }) => {
    const batchId = raw.batchId || sourceFile.replace(".json", "");
    return (raw.questions || []).map((question, index) => normalizeQuestion(question, sourceFile, batchId, index));
  });

  const seen = new Set<string>();
  return normalized.map((question) => {
    if (!seen.has(question.id)) {
      seen.add(question.id);
      return question;
    }

    const sourceSuffix = question.sourceFile.replace(".json", "");
    let uniqueId = `${question.id}-${sourceSuffix}`;
    let counter = 2;
    while (seen.has(uniqueId)) {
      uniqueId = `${question.id}-${sourceSuffix}-${counter}`;
      counter += 1;
    }

    seen.add(uniqueId);
    return { ...question, id: uniqueId };
  });
}

export const questions = getQuestions();

export function getQuestionById(id: string): Question | undefined {
  return questions.find((question) => question.id === id);
}

export function getSubjects(): string[] {
  return Array.from(new Set(questions.map((question) => question.subject))).sort();
}

export function getCategories(subject?: string): string[] {
  return Array.from(
    new Set(questions.filter((question) => !subject || question.subject === subject).map((question) => question.category))
  ).sort();
}

export function getSubtopics(subject?: string, category?: string): string[] {
  return Array.from(
    new Set(
      questions
        .filter((question) => !subject || question.subject === subject)
        .filter((question) => !category || question.category === category)
        .map((question) => question.subtopic)
    )
  ).sort();
}
