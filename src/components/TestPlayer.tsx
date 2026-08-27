import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import katex from 'katex';
import confetti from 'canvas-confetti';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Bookmark, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  HelpCircle,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Menu,
  FileText,
  User,
  ShieldAlert,
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  X,
  Award,
  BarChart2,
  Target,
  Trophy,
  Share2,
  Download,
  Flame,
  Zap,
  CheckCheck,
  Smartphone,
  Eye,
  RefreshCw,
  Sliders,
  Keyboard
} from 'lucide-react';
import { TestItem, TestResult, Question, UserProfile } from '../types';
import { supabase, saveStudentResult } from '../utils/supabaseClient';
import { MOCK_TESTS } from '../data/mockTests';
import { AIDoubtSolver } from './AIDoubtSolver';
import { QuestionRenderer } from './QuestionRenderer';

// Props Interface
export interface TestPlayerProps {
  test: TestItem | null;
  user?: UserProfile | null;
  onClose: () => void;
  onFinish?: (result: TestResult) => void;
}

export type QuestionStatus = 
  | 'not_visited' 
  | 'not_answered' 
  | 'answered' 
  | 'marked_for_review' 
  | 'answered_marked';

/**
 * KaTeX Formula Renderer Component
 * Parses $$math$$ and $math$ or plain text seamlessly
 */
export const FormattedMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text) return [];
    // Split by $$...$$ (block) or $...$ (inline)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g;
    const tokens = text.split(regex);
    return tokens.map((token, i) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block my-1 text-slate-900" />;
        } catch {
          return <span key={i}>{token}</span>;
        }
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block mx-0.5 text-slate-900" />;
        } catch {
          return <span key={i}>{token}</span>;
        }
      }
      return <span key={i}>{token}</span>;
    });
  }, [text]);

  return <div className={`inline leading-relaxed ${className}`}>{parts}</div>;
};

/**
 * ULTRA PRO TEST PLAYER (Better than NTA, PhysicsWallah & Unacademy)
 */
export const TestPlayer: React.FC<TestPlayerProps> = ({
  test,
  user,
  onClose,
  onFinish
}) => {
  if (!test) return null;

  // Active question index (0-based)
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Normalize questions array safely
  const questions: Question[] = useMemo(() => {
    if (test.questions && Array.isArray(test.questions) && test.questions.length > 0) {
      return test.questions.map((q, i) => ({
        id: q.id ?? i + 1,
        question: q.question || `Question ${i + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2 
          ? q.options 
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || 'Detailed NCERT textbook explanation.',
        imageUrl: q.imageUrl || null,
        chapter: q.chapter || test.subject || 'Biology',
        topic: q.topic || 'NEET Standard Concept',
        ncertReference: q.ncertReference || 'NCERT Rationalized Syllabus',
        subject: q.subject || test.subject || 'Biology',
        difficulty: q.difficulty || test.difficulty || 'Medium'
      }));
    }
    return MOCK_TESTS[0]?.questions || [];
  }, [test]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx] || questions[0];

  // Selected option index per questionId (e.g. {1: 0, 2: 3})
  const [answers, setAnswers] = useState<Record<number, number | null>>(() => {
    try {
      const draft = localStorage.getItem(`cbt_answers_${test.id}`);
      return draft ? JSON.parse(draft) : {};
    } catch {
      return {};
    }
  });

  // Marked for review map (questionId -> boolean)
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>(() => {
    try {
      const draft = localStorage.getItem(`cbt_marked_${test.id}`);
      return draft ? JSON.parse(draft) : {};
    } catch {
      return {};
    }
  });

  // Visited set of question indices
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(() => new Set([0]));

  // Per-question time tracking (seconds spent on each question)
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<number, number>>({});

  // Countdown timer in seconds (persistent)
  const totalDurationSeconds = useMemo(() => {
    return Math.max(1, (test.durationMinutes || 45) * 60);
  }, [test.durationMinutes]);

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const savedTime = localStorage.getItem(`cbt_time_${test.id}`);
      if (savedTime) {
        const val = parseInt(savedTime, 10);
        if (!isNaN(val) && val > 0 && val <= totalDurationSeconds) {
          return val;
        }
      }
    } catch {
      // ignore
    }
    return totalDurationSeconds;
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile Bottom Drawer Palette Open State
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState<boolean>(false);

  // Image Zoom Modal State
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Cheating / Anti-Switch Tab Security Warnings
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState<number>(0);
  const [showCheatWarningModal, setShowCheatWarningModal] = useState<boolean>(false);

  // Submit confirmation modal & results
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Filter subject/section tabs if multi-subject
  const subjectTabs = useMemo(() => {
    const subs = new Set<string>();
    questions.forEach(q => {
      if (q.subject) subs.add(q.subject);
      else subs.add(test.subject || 'Biology');
    });
    return Array.from(subs);
  }, [questions, test.subject]);
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>(subjectTabs[0] || 'All');

  // Sync Visited Index on Question Switch
  useEffect(() => {
    setVisitedIndices(prev => {
      const next = new Set(prev);
      next.add(currentIdx);
      return next;
    });
  }, [currentIdx]);

  // Track per-second timer and question time
  useEffect(() => {
    if (testResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit on 0
          return 0;
        }
        const updated = prev - 1;
        try {
          localStorage.setItem(`cbt_time_${test.id}`, updated.toString());
        } catch {
          // ignore
        }
        return updated;
      });

      // Increment time spent on current question
      if (currentQuestion) {
        setQuestionTimeSpent(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [test.id, testResult, currentQuestion]);

  // Anti-Cheating: Detect Window / Tab Blur & Fullscreen Exit
  useEffect(() => {
    if (testResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings(prev => {
          const nextCount = prev + 1;
          setShowCheatWarningModal(true);
          if (nextCount >= 3) {
            // Auto submit immediately on 3rd violation
            handleFinalSubmit(true, 'Disqualified / Auto-submitted due to 3 cheating/tab-switching warnings.');
          }
          return nextCount;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testResult]);

  // Auto-Save every answer to localStorage + Supabase draft (table: test_attempts)
  const persistAnswer = useCallback(async (updatedAnswers: Record<number, number | null>, updatedMarked: Record<number, boolean>) => {
    try {
      localStorage.setItem(`cbt_answers_${test.id}`, JSON.stringify(updatedAnswers));
      localStorage.setItem(`cbt_marked_${test.id}`, JSON.stringify(updatedMarked));
    } catch {
      // ignore
    }

    // Auto-save to Supabase test_attempts table if connected
    if (supabase && user?.email) {
      try {
        await supabase.from('test_attempts').upsert({
          test_id: test.id,
          student_email: user.email,
          student_name: user.name || 'Student Candidate',
          answers: updatedAnswers,
          marked: updatedMarked,
          time_left: timeLeft,
          updated_at: new Date().toISOString()
        }, { onConflict: 'test_id,student_email' });
      } catch (e) {
        // silent fail on draft attempt save
      }
    }
  }, [test.id, user, timeLeft]);

  // Option select handler
  const handleSelectOption = (optIdx: number) => {
    const qId = currentQuestion.id;
    const newAnswers = { ...answers, [qId]: optIdx };
    setAnswers(newAnswers);
    persistAnswer(newAnswers, markedForReview);
  };

  // 1. Save & Next Button
  const handleSaveAndNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  // 2. Mark for Review & Next Button
  const handleMarkForReviewAndNext = () => {
    const qId = currentQuestion.id;
    const newMarked = { ...markedForReview, [qId]: true };
    setMarkedForReview(newMarked);
    persistAnswer(answers, newMarked);
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  // 3. Clear Response Button
  const handleClearResponse = () => {
    const qId = currentQuestion.id;
    const newAnswers = { ...answers, [qId]: null };
    const newMarked = { ...markedForReview, [qId]: false };
    setAnswers(newAnswers);
    setMarkedForReview(newMarked);
    persistAnswer(newAnswers, newMarked);
  };

  // 4. Previous Button
  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Keyboard Shortcuts (1,2,3,4 for options, M for Mark, N for Next, P for Prev, C for Clear)
  useEffect(() => {
    if (testResult || showSubmitModal || showCheatWarningModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === '1') handleSelectOption(0);
      else if (key === '2') handleSelectOption(1);
      else if (key === '3') handleSelectOption(2);
      else if (key === '4') handleSelectOption(3);
      else if (key === 'm') handleMarkForReviewAndNext();
      else if (key === 'n' || key === 'arrowright') handleSaveAndNext();
      else if (key === 'p' || key === 'arrowleft') handlePrevious();
      else if (key === 'c') handleClearResponse();
      else if (key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, answers, markedForReview, testResult, showSubmitModal, showCheatWarningModal]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Question Status Resolver for Palette Colors
  const getQuestionStatus = (idx: number): QuestionStatus => {
    const q = questions[idx];
    if (!q) return 'not_visited';

    const hasAnswer = answers[q.id] !== undefined && answers[q.id] !== null;
    const isMarked = !!markedForReview[q.id];
    const isVisited = visitedIndices.has(idx);

    if (hasAnswer && isMarked) return 'answered_marked'; // Purple + Green badge
    if (isMarked) return 'marked_for_review';             // Purple with dot
    if (hasAnswer) return 'answered';                     // Green
    if (isVisited) return 'not_answered';                 // Red (visited but skipped)
    return 'not_visited';                                 // White / Gray
  };

  // Palette Status Counts
  const statusCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    questions.forEach((_, idx) => {
      const st = getQuestionStatus(idx);
      if (st === 'answered') answered++;
      else if (st === 'not_answered') notAnswered++;
      else if (st === 'marked_for_review') marked++;
      else if (st === 'answered_marked') answeredMarked++;
      else if (st === 'not_visited') notVisited++;
    });

    return {
      answered,
      notAnswered,
      marked,
      answeredMarked,
      notVisited,
      totalAnsweredCount: answered + answeredMarked
    };
  }, [questions, answers, markedForReview, visitedIndices]);

  // Final Submit Handler
  const handleFinalSubmit = async (forced = false, violationReason = '') => {
    setIsSubmitting(true);

    // Calculate score according to NTA standard (+4 for correct, -1 for incorrect, 0 for unattempted)
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected === undefined || selected === null) {
        unattemptedCount++;
      } else if (selected === q.correctAnswer) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const attemptedCount = correctCount + incorrectCount;
    const score = (correctCount * 4) - (incorrectCount * 1);
    const totalMarks = questions.length * 4;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const timeSpent = totalDurationSeconds - timeLeft;

    const finalResult: TestResult = {
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      testId: test.id,
      testTitle: test.title,
      studentEmail: user?.email || 'student@asi-institute.edu',
      studentName: user?.name || 'Student Candidate',
      totalQuestions: questions.length,
      attempted: attemptedCount,
      correct: correctCount,
      incorrect: incorrectCount,
      unattempted: unattemptedCount,
      score: Math.max(0, score),
      totalMarks: totalMarks,
      accuracy: accuracy,
      timeSpentSeconds: timeSpent,
      answers: answers,
      submittedAt: new Date().toISOString()
    };

    // Save to Supabase and LocalStorage
    try {
      await saveStudentResult(finalResult, user);
      localStorage.removeItem(`cbt_answers_${test.id}`);
      localStorage.removeItem(`cbt_marked_${test.id}`);
      localStorage.removeItem(`cbt_time_${test.id}`);
    } catch (e) {
      console.warn('Submission persistence notice:', e);
    }

    setTestResult(finalResult);
    setShowSubmitModal(false);
    setIsSubmitting(false);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    if (onFinish) {
      onFinish(finalResult);
    }
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW 1: POST-EXAM INSTANT RESULT ANALYSIS VIEW
  // =========================================================================
  if (testResult) {
    const avgTimePerQuestion = testResult.attempted > 0 
      ? Math.round(testResult.timeSpentSeconds / testResult.attempted) 
      : 0;
    const percentage = Math.round((testResult.score / (testResult.totalMarks || 1)) * 100);

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-extrabold text-[11px] uppercase tracking-wider">
                  Official NTA Scorecard
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1">{test.title}</h1>
                <p className="text-xs text-slate-400">Candidate: <span className="text-white font-semibold">{testResult.studentName}</span> • Submitted: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score & Accuracy Hero Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {/* Total Score */}
            <div className="bg-gradient-to-br from-violet-950/80 to-slate-900 border border-violet-800/40 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-violet-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Your Score</span>
                <Award className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {testResult.score} <span className="text-sm font-semibold text-slate-400">/ {testResult.totalMarks}</span>
              </div>
              <p className="text-[11px] text-violet-300 mt-1.5 font-medium">{percentage}% Marks Obtained</p>
            </div>

            {/* Accuracy */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-800/40 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
                <Target className="w-4 h-4" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-300">
                {testResult.accuracy}%
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1.5 font-medium">{testResult.correct} Correct out of {testResult.attempted}</p>
            </div>

            {/* Time Taken */}
            <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-sky-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Time Spent</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {Math.floor(testResult.timeSpentSeconds / 60)}m {testResult.timeSpentSeconds % 60}s
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Avg: {avgTimePerQuestion}s / question</p>
            </div>

            {/* Attempt Summary */}
            <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Questions</span>
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {testResult.attempted} <span className="text-sm font-semibold text-slate-400">/ {testResult.totalQuestions}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{testResult.unattempted} Unattempted</p>
            </div>
          </div>

          {/* Breakdown Stats Badges */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="p-2">
              <span className="text-xs font-bold text-slate-400 block mb-1">Correct (+4)</span>
              <span className="text-xl font-black text-emerald-400">+{testResult.correct * 4} Marks ({testResult.correct} Qs)</span>
            </div>
            <div className="p-2 border-x border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Incorrect (-1)</span>
              <span className="text-xl font-black text-rose-400">-{testResult.incorrect} Marks ({testResult.incorrect} Qs)</span>
            </div>
            <div className="p-2">
              <span className="text-xs font-bold text-slate-400 block mb-1">Unattempted (0)</span>
              <span className="text-xl font-black text-slate-300">{testResult.unattempted} Qs</span>
            </div>
          </div>

          {/* Solutions & NCERT References Review Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-400" />
                Comprehensive Solutions &amp; Explanations
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{questions.length} Total MCQs</span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 divide-y divide-slate-800">
              {questions.map((q, idx) => {
                const userChoice = testResult.answers[q.id];
                const isCorrect = userChoice === q.correctAnswer;
                const isSkipped = userChoice === undefined || userChoice === null;

                return (
                  <div key={q.id || idx} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                          isCorrect 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isSkipped
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <FormattedMathText text={q.question} className="text-sm font-bold text-slate-100" />
                          {q.imageUrl && (
                            <div className="mt-2">
                              <img 
                                src={q.imageUrl} 
                                alt={`Question ${idx + 1} diagram`} 
                                className="max-h-48 rounded-xl border border-slate-700 object-contain cursor-pointer hover:opacity-90"
                                onClick={() => setZoomedImageUrl(q.imageUrl || null)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> +4 Correct
                          </span>
                        ) : isSkipped ? (
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">
                            0 Unattempted
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                            <X className="w-3.5 h-3.5 stroke-[3]" /> -1 Incorrect
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOption = optIdx === q.correctAnswer;
                        const isUserOption = optIdx === userChoice;

                        let style = 'bg-slate-900 border-slate-800 text-slate-300';
                        if (isCorrectOption) {
                          style = 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-bold';
                        } else if (isUserOption && !isCorrectOption) {
                          style = 'bg-rose-950/60 border-rose-600 text-rose-200 line-through';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${style}`}>
                            <span className="font-bold text-slate-400">({String.fromCharCode(65 + optIdx)})</span>
                            <FormattedMathText text={opt} />
                          </div>
                        );
                      })}
                    </div>

                    {/* NCERT Explanation Box */}
                    <div className="pl-9 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                        <span className="font-extrabold text-violet-400 uppercase text-[10px] tracking-wider block">
                          📖 NCERT Solution &amp; Reference:
                        </span>
                        <FormattedMathText text={q.explanation} className="text-slate-300" />
                        {q.ncertReference && (
                          <p className="text-[11px] text-slate-400 italic mt-1 font-mono">Ref: {q.ncertReference}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-violet-600/30 cursor-pointer transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ULTRA PRO CBT EXAM PLAYER INTERFACE
  // =========================================================================
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-hidden"
    >
      {/* 1. TOP HEADER (NTA + Modern ASI Institute Bar) */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
        {/* Left: Institute & Test Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
            ASI
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {test.title}
              </h2>
              <span className="hidden md:inline px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider">
                NTA CBT Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Subject: <span className="text-violet-400 font-bold">{test.subject}</span> • Marking: <span className="text-emerald-400 font-bold">+4 / -1</span>
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Timer */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 sm:px-4 py-1.5 rounded-2xl shadow-inner">
          <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-violet-400'}`} />
          <div className="text-center">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block -mb-1">Time Left</span>
            <span className={`text-base sm:text-lg font-black font-mono tracking-wider ${
              timeLeft < 300 ? 'text-rose-400 animate-pulse' : 'text-white'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Right Controls: Fullscreen, Palette Drawer toggle (mobile), Submit */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (Press F)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            className="lg:hidden px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <GridIcon className="w-4 h-4 text-violet-400" />
            <span>Palette ({currentIdx + 1}/{totalQuestions})</span>
          </button>

          {/* Submit Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <CheckCheck className="w-4 h-4 stroke-[3]" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (70% Question Area on Desktop, 30% Question Palette on Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: 70% QUESTION WORKSPACE */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden relative">
          {/* Sub-bar: Subject Tabs & Question Meta */}
          <div className="h-12 bg-slate-950/80 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0">
            {/* Subject / Section Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">Section:</span>
              {subjectTabs.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubjectTab(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSubjectTab === sub
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Question Counter & Marks info */}
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                Q {currentIdx + 1} of {totalQuestions}
              </span>
              <span className="hidden sm:inline text-emerald-400 font-extrabold">+4.00</span>
              <span className="hidden sm:inline text-rose-400 font-extrabold">-1.00</span>
            </div>
          </div>

          {/* Question & Options Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
            {/* Top Bar for AIDoubtSolver Pill & Review status */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <AIDoubtSolver
                  question={currentQuestion}
                  mode="test"
                  studentId={user?.id || user?.email || 'student'}
                  studentName={user?.name || 'Aspirant'}
                  testId={test?.id || 'active_test'}
                  currentSelectedOption={answers[currentQuestion.id] ?? null}
                  triggerVariant="pill"
                />
              </div>

              {markedForReview[currentQuestion.id] && (
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 fill-purple-400" /> Marked for Review
                </span>
              )}
            </div>

            {/* NTA NEET Original Paper Style White Card Renderer */}
            <QuestionRenderer
              question={currentQuestion}
              selectedOption={answers[currentQuestion.id] ?? null}
              onSelect={(optIdx) => handleSelectOption(optIdx)}
              showCorrectAnswer={false}
            />
          </div>

          {/* BOTTOM ACTION BUTTONS BAR (PW & NTA Standard) */}
          <footer className="h-20 bg-slate-950 border-t border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0">
            {/* Left Actions: Previous & Clear Response */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Shortcut: P or Left Arrow"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button
                onClick={handleClearResponse}
                disabled={answers[currentQuestion.id] === undefined && !markedForReview[currentQuestion.id]}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-rose-300 hover:text-rose-200 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Shortcut: C"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            {/* Right Actions: Mark for Review & Save & Next */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleMarkForReviewAndNext}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-purple-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Shortcut: M"
              >
                <Bookmark className="w-4 h-4 fill-purple-400" />
                <span>Mark for Review &amp; Next</span>
              </button>

              <button
                onClick={handleSaveAndNext}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/30 cursor-pointer"
                title="Shortcut: N or Right Arrow"
              >
                <span>{currentIdx === totalQuestions - 1 ? 'Save Response' : 'Save & Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </main>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 30% QUESTION PALETTE GRID (DESKTOP) */}
        {/* ========================================================================= */}
        <aside className="w-80 xl:w-96 bg-slate-950 border-l border-slate-800 hidden lg:flex flex-col shrink-0">
          <PaletteDrawerContent 
            questions={questions}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            getQuestionStatus={getQuestionStatus}
            statusCounts={statusCounts}
            onOpenSubmitModal={() => setShowSubmitModal(true)}
          />
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE PALETTE BOTTOM DRAWER */}
      {/* ========================================================================= */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="bg-slate-950 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <GridIcon className="w-4 h-4 text-violet-400" />
                Question Palette
              </h3>
              <button
                onClick={() => setIsMobilePaletteOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <PaletteDrawerContent 
                questions={questions}
                currentIdx={currentIdx}
                setCurrentIdx={(idx) => {
                  setCurrentIdx(idx);
                  setIsMobilePaletteOpen(false);
                }}
                getQuestionStatus={getQuestionStatus}
                statusCounts={statusCounts}
                onOpenSubmitModal={() => {
                  setIsMobilePaletteOpen(false);
                  setShowSubmitModal(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMIT CONFIRMATION SUMMARY MODAL */}
      {/* ========================================================================= */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Submit Examination?</h3>
                <p className="text-xs text-slate-400">Review your exam summary before finalizing.</p>
              </div>
            </div>

            {/* Summary Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Total Questions</span>
                <span className="text-lg font-black text-white">{totalQuestions}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/50">
                <span className="text-emerald-400 block mb-1">Answered</span>
                <span className="text-lg font-black text-emerald-400">{statusCounts.totalAnsweredCount}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/50">
                <span className="text-rose-400 block mb-1">Unanswered</span>
                <span className="text-lg font-black text-rose-400">{totalQuestions - statusCounts.totalAnsweredCount}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-purple-900/50">
                <span className="text-purple-400 block mb-1">Marked for Review</span>
                <span className="text-lg font-black text-purple-400">{statusCounts.marked + statusCounts.answeredMarked}</span>
              </div>
            </div>

            {totalQuestions - statusCounts.totalAnsweredCount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>You have <b>{totalQuestions - statusCounts.totalAnsweredCount} unanswered questions</b>. Are you sure you want to submit now?</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Yes, Final Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ANTI-CHEATING / TAB SWITCH WARNING MODAL */}
      {/* ========================================================================= */}
      {showCheatWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-600/60 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-7 h-7 text-rose-500 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-400">Security Warning #{tabSwitchWarnings}</h3>
                <p className="text-xs text-slate-300">Tab Switching / Window Blur Detected</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-rose-900/40 text-xs space-y-2 text-slate-300">
              <p className="font-bold text-white">
                NTA Anti-Cheating Protocol Active:
              </p>
              <p>
                Navigating away from the test window or opening another app is strictly prohibited.
              </p>
              <p className="text-rose-400 font-extrabold">
                Warning {tabSwitchWarnings} of 3. On 3 warnings, your exam will be automatically locked and submitted!
              </p>
            </div>

            <button
              onClick={() => setShowCheatWarningModal(false)}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition-all"
            >
              I Understand, Return to Test
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ZOOMABLE DIAGRAM IMAGE VIEWER */}
      {/* ========================================================================= */}
      {zoomedImageUrl && (
        <div 
          onClick={() => setZoomedImageUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 p-3 rounded-3xl border border-slate-800 shadow-2xl">
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/80 text-white flex items-center justify-center shadow-lg border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomedImageUrl} 
              alt="Zoomed Diagram"
              className="max-h-[82vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Reusable Palette Drawer Component
 */
const PaletteDrawerContent: React.FC<{
  questions: Question[];
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  getQuestionStatus: (idx: number) => QuestionStatus;
  statusCounts: {
    answered: number;
    notAnswered: number;
    marked: number;
    answeredMarked: number;
    notVisited: number;
    totalAnsweredCount: number;
  };
  onOpenSubmitModal: () => void;
}> = ({
  questions,
  currentIdx,
  setCurrentIdx,
  getQuestionStatus,
  statusCounts,
  onOpenSubmitModal
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Section 1: Legend (NTA Color Codes) */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
          Question Palette Legend
        </h4>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
          {/* Green: Answered */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
              {statusCounts.answered}
            </span>
            <span className="text-slate-300">Answered</span>
          </div>

          {/* Red: Not Answered */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
              {statusCounts.notAnswered}
            </span>
            <span className="text-slate-300">Not Answered</span>
          </div>

          {/* Purple with dot: Marked for review */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 relative">
              {statusCounts.marked}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            </span>
            <span className="text-slate-300">Marked</span>
          </div>

          {/* Purple + Green: Answered & Marked */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 relative">
              {statusCounts.answeredMarked}
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950" />
            </span>
            <span className="text-slate-300">Ans &amp; Marked</span>
          </div>

          {/* Gray: Not Visited */}
          <div className="col-span-2 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-700">
              {statusCounts.notVisited}
            </span>
            <span className="text-slate-300">Not Visited</span>
          </div>
        </div>
      </div>

      {/* Section 2: Numbers Grid (1 to N) */}
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Questions ({questions.length})
          </h4>
          <span className="text-[11px] text-violet-400 font-bold">
            {statusCounts.totalAnsweredCount} / {questions.length} Solved
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-72 lg:max-h-80 overflow-y-auto pr-1">
          {questions.map((_, idx) => {
            const status = getQuestionStatus(idx);
            const isCurrent = idx === currentIdx;

            // Status Styling Matrix
            let btnClass = 'bg-slate-850 text-slate-400 border-slate-800 hover:border-slate-600'; // not_visited

            if (status === 'answered') {
              btnClass = 'bg-emerald-600 text-white font-black shadow-sm border-emerald-500';
            } else if (status === 'not_answered') {
              btnClass = 'bg-rose-600 text-white font-black shadow-sm border-rose-500';
            } else if (status === 'marked_for_review') {
              btnClass = 'bg-purple-600 text-white font-black shadow-sm border-purple-500';
            } else if (status === 'answered_marked') {
              btnClass = 'bg-purple-600 text-white font-black shadow-sm border-purple-500 relative';
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-9 rounded-xl border text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${btnClass} ${
                  isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105 z-10' : ''
                }`}
              >
                {idx + 1}
                {status === 'marked_for_review' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
                {status === 'answered_marked' && (
                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Keyboard Shortcuts Guide Box */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-violet-400 font-extrabold uppercase text-[10px]">
          <Keyboard className="w-3.5 h-3.5" />
          Pro Keyboard Shortcuts
        </div>
        <p><b className="text-slate-200">1, 2, 3, 4:</b> Select Options A-D</p>
        <p><b className="text-slate-200">N / Right Arrow:</b> Save &amp; Next</p>
        <p><b className="text-slate-200">M:</b> Mark for Review &amp; Next</p>
        <p><b className="text-slate-200">C:</b> Clear Response</p>
      </div>

      {/* Section 4: Final Submit Button in Palette */}
      <button
        onClick={onOpenSubmitModal}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
      >
        <CheckCheck className="w-4 h-4 stroke-[3]" />
        <span>Submit Final Exam</span>
      </button>
    </div>
  );
};

// Helper Grid Icon
const GridIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

export default TestPlayer;
