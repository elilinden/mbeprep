export type Choice = {
  label: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
  distractorType?: string | null;
};

export type Explanation = {
  testedIssue: string;
  governingRule: string;
  application: string;
  commonTrap: string;
  memoryAid: string;
};

export type Question = {
  id: string;
  sourceFile: string;
  batchId: string;
  subject: string;
  category: string;
  subtopic: string;
  difficulty: string;
  estimatedSeconds: number;
  stem: string;
  call: string;
  choices: Choice[];
  correctChoice: string;
  explanation: Explanation;
  authorityNotes: string[];
  metadata: Record<string, unknown>;
};

export type Attempt = {
  questionId: string;
  selectedChoice: string;
  correctChoice: string;
  isCorrect: boolean;
  subject: string;
  category: string;
  subtopic: string;
  difficulty: string;
  timestamp: string;
  timeSpent: number;
  guessed: boolean;
  markedConfusing: boolean;
};

export type QuestionStats = {
  attempts: number;
  correct: number;
  incorrect: number;
  savedForReview: boolean;
  guessed: number;
  confusing: number;
  totalTime: number;
  lastAttemptAt?: string;
};

export type UserProgress = {
  attempts: Attempt[];
  questionStats: Record<string, QuestionStats>;
  savedQuestionIds: string[];
};

export type SubjectStats = {
  subject: string;
  attempted: number;
  correct: number;
  accuracy: number;
  weaknessScore: number;
  topMissedSubtopics: string[];
};

export type WeakArea = {
  id: string;
  subject: string;
  category: string;
  subtopic: string;
  score: number;
  missed: number;
  guessed: number;
  confusing: number;
  slow: number;
  correctRecovery: number;
  reason: string;
  questionIds: string[];
};

export type DashboardStats = {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  streak: number;
  subjectStats: SubjectStats[];
  weakAreas: WeakArea[];
  recentMistakes: Attempt[];
  commonTraps: { trap: string; count: number }[];
  improving: WeakArea[];
};

export type PracticeMode =
  | "mixed"
  | "subject"
  | "weak"
  | "saved"
  | "single";

export type PodcastEpisode = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  description: string;
  src: string;
  fileName: string;
};

export type Flashcard = {
  id: string;
  subject: string;
  front: string;
  back: string;
};

export type FlashcardDeck = {
  id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
};

export type FlashcardRating = "got-it" | "needs-work";

export type FlashcardProgress = {
  cardId: string;
  attempts: number;
  gotIt: number;
  needsWork: number;
  lastRating: FlashcardRating;
  lastReviewedAt: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  lapses?: number;
  nextReviewAt?: string;
};
