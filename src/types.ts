export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TestCategory = 'All' | 'NEET Full Syllabus' | 'Class 11 Biology' | 'Class 12 Biology' | 'High Yield' | 'JEE Biology';

export interface Question {
  id: number;
  question?: string;
  question_en?: string;
  question_hi?: string;
  options?: string[];
  options_en?: string[];
  options_hi?: string[];
  correctAnswer: number; // 0-indexed
  explanation?: string;
  imageUrl?: string | null;
  ncertReference?: string;
  chapter?: string;
  topic?: string;
  subject?: string;
  difficulty?: Difficulty;
  type?: 'MCQ' | 'ASSERTION_REASON' | 'MATCHING' | 'STATEMENT';
}

export interface TestItem {
  id: string;
  title: string;
  category: TestCategory;
  subject: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  difficulty: Difficulty;
  syllabus: string[];
  description: string;
  attemptsCount: number;
  rating: number;
  isPopular?: boolean;
  isNew?: boolean;
  hasNegativeMarking?: boolean;
  questions: Question[];
  created_at?: string;
  isCustom?: boolean;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number | null;
  isMarkedForReview: boolean;
}

export interface TestResult {
  id?: string;
  testId: string;
  testTitle: string;
  studentEmail?: string;
  studentName?: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeSpentSeconds: number;
  answers: Record<number, number | null>;
  submittedAt?: string;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  photoUrl?: string;
  rollNumber?: string;
  targetExam?: 'NEET 2026' | 'NEET 2027' | 'JEE Main/Adv' | string;
  targetScore?: string | number;
  targetCollege?: string;
  phone?: string;
  department?: string;
  token?: string;
  isLoggedIn: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  channelName?: string;
  enabled: boolean;
  notifyOnSubmission?: boolean;
  notifyOnNewTest?: boolean;
}
