export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TestCategory = 'All' | 'NEET Full Syllabus' | 'Class 11 Biology' | 'Class 12 Biology' | 'High Yield' | 'JEE Biology';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  ncertReference?: string;
  chapter?: string;
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
  questions: Question[];
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number | null;
  isMarkedForReview: boolean;
}

export interface TestResult {
  testId: string;
  testTitle: string;
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
}

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  targetExam?: 'NEET 2026' | 'NEET 2027' | 'JEE Main/Adv' | string;
  department?: string;
  isLoggedIn: boolean;
}
