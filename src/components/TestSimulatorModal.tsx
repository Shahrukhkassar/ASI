import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
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
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestItem, TestResult } from '../types';

interface TestSimulatorModalProps {
  test: TestItem | null;
  onClose: () => void;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked';

export const TestSimulatorModal: React.FC<TestSimulatorModalProps> = ({
  test,
  onClose
}) => {
  if (!test) return null;

  // Active question index (0-based)
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  
  // Selected option index per questionId (e.g. {1: 0, 2: 3})
  const [answers, setAnswers] = useState<Record<number, number | null>>(() => {
    try {
      const draft = localStorage.getItem(`cbt_answers_${test.id}`);
      return draft ? JSON.parse(draft) : {};
    } catch {
      return {};
    }
  });
  
  // Marked for review set
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

  // Countdown timer in seconds (persistent)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const savedTime = localStorage.getItem(`cbt_time_${test.id}`);
      if (savedTime) {
        const parsed = parseInt(savedTime, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return test.durationMinutes * 60;
  });
  
  // State: 'testing' | 'submitted'
  const [testState, setTestState] = useState<'testing' | 'submitted'>('testing');
  
  // Submission confirmation dialog modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Mobile Question Palette drawer toggle
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Question Paper view modal
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);

  // Instructions modal
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  // Computed test result
  const [result, setResult] = useState<TestResult | null>(null);

  // Review mode filter: 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  // Selected Section / Subject Tab
  const sections = useMemo(() => {
    const chapters = Array.from(new Set(test.questions.map(q => q.chapter || test.subject || 'Section A')));
    if (chapters.length <= 1) {
      return [
        { name: `${test.subject || 'Biology'} - Section A`, startIdx: 0, count: Math.min(35, test.questions.length) },
        ...(test.questions.length > 35 ? [{ name: `${test.subject || 'Biology'} - Section B`, startIdx: 35, count: test.questions.length - 35 }] : [])
      ];
    }
    let currentStart = 0;
    return chapters.map(ch => {
      const qInCh = test.questions.filter(q => (q.chapter || test.subject) === ch);
      const s = { name: ch, startIdx: currentStart, count: qInCh.length };
      currentStart += qInCh.length;
      return s;
    });
  }, [test]);

  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);

  // Mark current question as visited
  useEffect(() => {
    if (testState === 'testing') {
      setVisitedIndices(prev => {
        if (!prev.has(currentIdx)) {
          const next = new Set(prev);
          next.add(currentIdx);
          return next;
        }
        return prev;
      });
    }
  }, [currentIdx, testState]);

  // Sync state to localStorage for test recovery
  useEffect(() => {
    if (testState === 'testing') {
      try {
        localStorage.setItem(`cbt_answers_${test.id}`, JSON.stringify(answers));
        localStorage.setItem(`cbt_marked_${test.id}`, JSON.stringify(markedForReview));
        localStorage.setItem(`cbt_time_${test.id}`, timeLeft.toString());
      } catch (e) {
        // ignore
      }
    }
  }, [answers, markedForReview, timeLeft, test.id, testState]);

  // Prevent accidental back navigation / reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testState === 'testing') {
        e.preventDefault();
        e.returnValue = 'Your test is in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testState]);

  // Timer effect
  useEffect(() => {
    if (testState !== 'testing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeFinalSubmission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState]);

  // Format time (HH:MM:SS or MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  // Status calculator per question
  const getQuestionStatus = useCallback((idx: number, qId: number): QuestionStatus => {
    const hasAnswer = answers[qId] !== undefined && answers[qId] !== null;
    const isMarked = !!markedForReview[qId];

    if (hasAnswer && isMarked) return 'answered_marked';
    if (hasAnswer) return 'answered';
    if (isMarked) return 'marked_for_review';
    if (visitedIndices.has(idx)) return 'not_answered';
    return 'not_visited';
  }, [answers, markedForReview, visitedIndices]);

  // Status breakdown metrics
  const stats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredMarked = 0;
    let notVisited = 0;

    test.questions.forEach((q, idx) => {
      const status = getQuestionStatus(idx, q.id);
      if (status === 'answered') answered++;
      else if (status === 'not_answered') notAnswered++;
      else if (status === 'marked_for_review') marked++;
      else if (status === 'answered_marked') answeredMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, answeredMarked, notVisited };
  }, [test.questions, getQuestionStatus]);

  const handleSelectOption = (qId: number, optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: prev[qId] === optIdx ? null : optIdx
    }));
  };

  const handleClearResponse = (qId: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIdx < test.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleMarkForReviewAndNext = (qId: number) => {
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: true
    }));
    if (currentIdx < test.questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  // Keyboard navigation for exam mode
  useEffect(() => {
    if (testState !== 'testing' || showSubmitConfirm || showQuestionPaperModal || showInstructionsModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentQ = test.questions[currentIdx];
      if (!currentQ) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const opt = parseInt(e.key, 10) - 1;
        if (opt < currentQ.options.length) handleSelectOption(currentQ.id, opt);
      } else if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        const opt = e.key.toUpperCase().charCodeAt(0) - 65;
        if (opt < currentQ.options.length) handleSelectOption(currentQ.id, opt);
      } else if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.shiftKey)) {
        handleSaveAndNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [testState, currentIdx, test.questions, showSubmitConfirm, showQuestionPaperModal, showInstructionsModal]);

  const executeFinalSubmission = () => {
    setShowSubmitConfirm(false);
    let correctCount = 0;
    let incorrectCount = 0;
    let attemptedCount = 0;

    test.questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected !== undefined && selected !== null) {
        attemptedCount++;
        if (selected === q.correctAnswer) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    const unattemptedCount = test.questions.length - attemptedCount;
    // NEET Marking: +4 for correct, -1 for wrong
    const calculatedScore = (correctCount * 4) - (incorrectCount * 1);
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const timeSpent = (test.durationMinutes * 60) - timeLeft;

    const res: TestResult = {
      testId: test.id,
      testTitle: test.title,
      totalQuestions: test.questions.length,
      attempted: attemptedCount,
      correct: correctCount,
      incorrect: incorrectCount,
      unattempted: unattemptedCount,
      score: calculatedScore,
      totalMarks: test.questions.length * 4,
      accuracy,
      timeSpentSeconds: Math.max(1, timeSpent),
      answers
    };

    // Clean up draft storage
    try {
      localStorage.removeItem(`cbt_answers_${test.id}`);
      localStorage.removeItem(`cbt_marked_${test.id}`);
      localStorage.removeItem(`cbt_time_${test.id}`);
    } catch {
      // ignore
    }

    setResult(res);
    setTestState('submitted');

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 }
      });
    } catch {
      // ignore
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setMarkedForReview({});
    setVisitedIndices(new Set([0]));
    setCurrentIdx(0);
    setTimeLeft(test.durationMinutes * 60);
    setTestState('testing');
    setResult(null);
  };

  const currentQuestion = test.questions[currentIdx] || test.questions[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/90 backdrop-blur-xs flex flex-col items-center justify-center p-0 select-none">
      <div className="bg-white w-full h-full sm:max-w-7xl sm:h-[95vh] sm:rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col font-sans">
        
        {/* =========================================================
            NTA CBT TOP HEADER BAR
        ========================================================= */}
        <header className="px-3 sm:px-6 py-2.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700 shrink-0 select-none">
          
          {/* Exam Title & Subject info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center font-black text-xs text-white border border-blue-400/40 shadow-xs">
              NTA
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-[200px] sm:max-w-md">
                {test.title}
              </h1>
              <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span>{test.subject || 'Biology'}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-400 font-semibold">+4 / -1 Marking</span>
              </p>
            </div>
          </div>

          {/* Center / Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {testState === 'testing' && (
              <>
                {/* Digital Countdown Timer */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs sm:text-sm font-mono font-bold tracking-wider ${
                  timeLeft < 300 
                    ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' 
                    : 'bg-slate-900 text-amber-300 border-slate-700'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-slate-400 text-[10px] uppercase font-sans font-semibold">Time Left:</span>
                  <span>{formatTime(timeLeft)}</span>
                </div>

                {/* Question Paper Quick View Button */}
                <button
                  onClick={() => setShowQuestionPaperModal(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded border border-slate-600 cursor-pointer transition-colors"
                  title="View Complete Question Paper"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Question Paper</span>
                </button>

                {/* Instructions Button */}
                <button
                  onClick={() => setShowInstructionsModal(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded border border-slate-600 cursor-pointer transition-colors"
                  title="Exam Instructions"
                >
                  <Info className="w-3.5 h-3.5 text-violet-300" />
                  <span>Instructions</span>
                </button>

                {/* Mobile Palette Drawer Toggle */}
                <button
                  onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
                  className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded cursor-pointer"
                  title="Toggle Question Palette"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Palette</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </>
            )}

            {/* Close / Exit Button */}
            <button
              id="cbt-modal-close-btn"
              onClick={() => {
                if (testState === 'testing') {
                  if (confirm("Are you sure you want to exit the exam? Your current progress is saved.")) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-rose-800/60 transition-colors cursor-pointer"
              title="Close Test Interface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* =========================================================
            SECTION NAVIGATION BAR (If multiple sections/chapters)
        ========================================================= */}
        {testState === 'testing' && sections.length > 1 && (
          <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide shrink-0">Sections:</span>
            {sections.map((sec, idx) => {
              const isSelected = activeSectionIdx === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveSectionIdx(idx);
                    setCurrentIdx(sec.startIdx);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sec.name} ({sec.count} Qs)
                </button>
              );
            })}
          </div>
        )}

        {/* =========================================================
            MAIN CBT WORKSPACE (2-Column Layout on Desktop)
        ========================================================= */}
        {testState === 'testing' ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
            
            {/* -----------------------------------------------------
                LEFT: QUESTION AREA (Takes Maximum Screen Space)
            ----------------------------------------------------- */}
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-3 sm:p-6 lg:border-r border-slate-200">
              
              <div className="space-y-4">
                
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      Question No. {currentIdx + 1}
                    </span>
                    {currentQuestion.chapter && (
                      <span className="text-slate-500 font-medium hidden sm:inline">
                        • {currentQuestion.chapter}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-600 font-semibold hidden sm:inline">Marking Scheme:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +4.00
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      -1.00
                    </span>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="py-2">
                  <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed select-text space-y-2">
                    <p className="whitespace-pre-line">{currentQuestion.question}</p>
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5 pt-1">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        id={`cbt-option-${currentQuestion.id}-${optIdx}`}
                        onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                        className={`w-full p-3 sm:p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-600 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-600'
                            : 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {/* Radio Check Indicator */}
                        <div className="pt-0.5 shrink-0">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-600' 
                              : 'border-slate-400 bg-white'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Option Label & Text */}
                        <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                          <span className="font-bold mr-2 text-slate-700">
                            ({String.fromCharCode(65 + optIdx)})
                          </span>
                          <span>{option}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* -----------------------------------------------------
                  BOTTOM CBT CONTROLS (NTA Standard Buttons)
              ----------------------------------------------------- */}
              <div className="pt-4 mt-6 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2.5">
                
                {/* Left Side: Save & Mark for Review / Clear Response */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    id="cbt-save-mark-review-btn"
                    onClick={() => handleMarkForReviewAndNext(currentQuestion.id)}
                    className="px-3 sm:px-4 py-2 text-xs font-bold rounded bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Mark for Review &amp; Next</span>
                  </button>

                  <button
                    id="cbt-clear-response-btn"
                    onClick={() => handleClearResponse(currentQuestion.id)}
                    className="px-3 py-2 text-xs font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                  >
                    Clear Response
                  </button>
                </div>

                {/* Right Side: Previous / Save & Next */}
                <div className="flex items-center gap-2">
                  <button
                    id="cbt-previous-btn"
                    disabled={currentIdx === 0}
                    onClick={handlePrevious}
                    className="px-3.5 sm:px-4 py-2 text-xs font-bold rounded bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    id="cbt-save-next-btn"
                    onClick={handleSaveAndNext}
                    className="px-4 sm:px-6 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Save &amp; Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>

            {/* -----------------------------------------------------
                RIGHT: QUESTION PALETTE & CANDIDATE PROFILE (Desktop & Mobile Drawer)
            ----------------------------------------------------- */}
            <div className={`
              lg:w-80 xl:w-96 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between
              ${mobilePaletteOpen ? 'fixed inset-0 z-50 bg-white p-4 overflow-y-auto' : 'hidden lg:flex p-4'}
            `}>
              
              <div className="space-y-4">
                
                {/* Mobile Drawer Header */}
                <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800">Question Palette</h3>
                  <button
                    onClick={() => setMobilePaletteOpen(false)}
                    className="p-1 rounded text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Info Card */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-800 truncate">Candidate Aspirant</p>
                    <p className="text-[10px] text-slate-500">Roll: ASI-NEET-{test.id.slice(0, 6).toUpperCase()}</p>
                  </div>
                </div>

                {/* NTA Status Indicators & Counts */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-2">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    
                    {/* Answered */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-5 rounded-xs bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {stats.answered}
                      </div>
                      <span className="text-slate-700 truncate font-medium">Answered</span>
                    </div>

                    {/* Not Answered */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-5 rounded-xs bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {stats.notAnswered}
                      </div>
                      <span className="text-slate-700 truncate font-medium">Not Answered</span>
                    </div>

                    {/* Not Visited */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-5 rounded-xs bg-white text-slate-700 border border-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {stats.notVisited}
                      </div>
                      <span className="text-slate-700 truncate font-medium">Not Visited</span>
                    </div>

                    {/* Marked for Review */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {stats.marked}
                      </div>
                      <span className="text-slate-700 truncate font-medium">Marked for Review</span>
                    </div>

                  </div>

                  {/* Answered & Marked for Review */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full bg-purple-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {stats.answeredMarked}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                    </div>
                    <span className="text-[10px] text-slate-600 leading-tight">
                      Ans &amp; Marked for Review <span className="text-emerald-700 font-semibold">(evaluated)</span>
                    </span>
                  </div>
                </div>

                {/* Section header in palette */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>Questions ({test.questions.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Click to navigate</span>
                </div>

                {/* Question Grid Buttons */}
                <div className="grid grid-cols-5 gap-1.5 max-h-56 sm:max-h-72 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                  {test.questions.map((q, idx) => {
                    const status = getQuestionStatus(idx, q.id);
                    const isCurrent = idx === currentIdx;

                    let shapeClass = "bg-white text-slate-700 border border-slate-300 hover:border-slate-400"; // not visited

                    if (status === 'answered') {
                      shapeClass = "bg-emerald-600 text-white font-bold border border-emerald-700 rounded-xs";
                    } else if (status === 'not_answered') {
                      shapeClass = "bg-rose-600 text-white font-bold border border-rose-700 rounded-xs";
                    } else if (status === 'marked_for_review') {
                      shapeClass = "bg-purple-700 text-white font-bold rounded-full border border-purple-800";
                    } else if (status === 'answered_marked') {
                      shapeClass = "bg-purple-700 text-white font-bold rounded-full border border-purple-800 relative";
                    }

                    if (isCurrent) {
                      shapeClass += " ring-2 ring-blue-900 ring-offset-1 font-black";
                    }

                    return (
                      <button
                        key={q.id}
                        id={`palette-btn-${idx}`}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setMobilePaletteOpen(false);
                        }}
                        className={`h-8 text-xs flex items-center justify-center transition-all cursor-pointer ${shapeClass}`}
                        title={`Question ${idx + 1}: ${status.replace('_', ' ')}`}
                      >
                        <span>{idx + 1}</span>
                        {status === 'answered_marked' && (
                          <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Submit Test Button at Bottom of Palette */}
              <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
                <button
                  id="cbt-submit-open-modal-btn"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Test</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* =========================================================
              EXAM RESULT & NCERT DETAILED SOLUTIONS VIEW
          ========================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50">
            
            {/* Scorecard Summary Box */}
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Official Score Card</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {test.title}
                  </h2>
                  <p className="text-slate-300 text-xs">
                    NEET CBT Result • Calculated strictly with +4 correct and -1 negative marking.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-800/90 px-6 py-3.5 rounded-xl border border-slate-700">
                  <div className="text-center">
                    <span className="block text-[11px] font-medium text-slate-400">Total Marks</span>
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {result?.score}
                      <span className="text-xs font-normal text-slate-400"> / {result?.totalMarks}</span>
                    </span>
                  </div>
                  <div className="h-9 w-px bg-slate-700" />
                  <div className="text-center">
                    <span className="block text-[11px] font-medium text-slate-400">Accuracy</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      {result?.accuracy}%
                    </span>
                  </div>
                </div>

              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-6 border-t border-slate-800 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400">Correct (+4)</span>
                  <p className="text-lg font-bold text-emerald-400">+{result?.correct}</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400">Incorrect (-1)</span>
                  <p className="text-lg font-bold text-rose-400">-{result?.incorrect}</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400">Unattempted (0)</span>
                  <p className="text-lg font-bold text-slate-300">{result?.unattempted}</p>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                  <span className="text-slate-400">Time Taken</span>
                  <p className="text-lg font-bold text-amber-300">{formatTime(result?.timeSpentSeconds || 0)}</p>
                </div>
              </div>

            </div>

            {/* Solutions & Analysis Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Question-wise Detailed NCERT Solutions</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Review every question with exact NCERT references and step-by-step logic.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    reviewFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All ({test.questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('correct')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    reviewFilter === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Correct ({result?.correct})
                </button>
                <button
                  onClick={() => setReviewFilter('incorrect')}
                  className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                    reviewFilter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Incorrect ({result?.incorrect})
                </button>
              </div>
            </div>

            {/* Solution Cards List */}
            <div className="space-y-4">
              {test.questions
                .filter((q) => {
                  const userSelected = answers[q.id];
                  const isCorrect = userSelected === q.correctAnswer;
                  const isUnattempted = userSelected === undefined || userSelected === null;

                  if (reviewFilter === 'correct') return isCorrect;
                  if (reviewFilter === 'incorrect') return !isCorrect && !isUnattempted;
                  if (reviewFilter === 'unattempted') return isUnattempted;
                  return true;
                })
                .map((q, idx) => {
                  const userSelected = answers[q.id];
                  const isCorrect = userSelected === q.correctAnswer;
                  const isUnattempted = userSelected === undefined || userSelected === null;

                  return (
                    <div
                      key={q.id}
                      className={`bg-white rounded-xl p-5 border text-xs sm:text-sm ${
                        isCorrect 
                          ? 'border-emerald-200 shadow-2xs' 
                          : isUnattempted 
                          ? 'border-slate-200' 
                          : 'border-rose-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 text-xs">
                            Q.{idx + 1}
                          </span>
                          {q.chapter && (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {q.chapter}
                            </span>
                          )}
                        </div>

                        <div>
                          {isCorrect ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Correct (+4)
                            </span>
                          ) : isUnattempted ? (
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Unattempted (0)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Incorrect (-1)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-semibold text-slate-900 mb-3 select-text leading-relaxed">
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {q.options.map((opt, optIdx) => {
                          const isThisCorrect = optIdx === q.correctAnswer;
                          const isThisUserSelected = userSelected === optIdx;

                          let optStyle = "bg-slate-50 border-slate-200 text-slate-700";
                          if (isThisCorrect) {
                            optStyle = "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold";
                          } else if (isThisUserSelected) {
                            optStyle = "bg-rose-50 border-rose-300 text-rose-950 font-bold";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${optStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">({String.fromCharCode(65 + optIdx)})</span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Correct Key
                                </span>
                              )}
                              {isThisUserSelected && !isThisCorrect && (
                                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-100 text-xs">
                        <div className="flex items-center justify-between text-blue-950 font-bold mb-1">
                          <div className="flex items-center gap-1">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                            <span>NCERT Concept Solution</span>
                          </div>
                          {q.ncertReference && (
                            <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                              {q.ncertReference}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 leading-relaxed select-text">
                          {q.explanation}
                        </p>
                      </div>

                    </div>
                  );
                })}
            </div>

            {/* Retake / Exit Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={handleRestart}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Back to Tests Portal
              </button>
            </div>

          </div>
        )}

      </div>

      {/* =========================================================
          NTA FINAL SUBMISSION CONFIRMATION MODAL
      ========================================================= */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Exam Summary &amp; Confirmation</h3>
              </div>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 font-medium">
                Please review your exam summary before final submission. No changes will be allowed after submitting.
              </p>

              {/* NTA Summary Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">No. of Questions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="p-2.5 text-slate-700">Total Questions</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{test.questions.length}</td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="p-2.5 text-emerald-800 font-semibold">Answered</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{stats.answered}</td>
                    </tr>
                    <tr className="bg-rose-50/50">
                      <td className="p-2.5 text-rose-800 font-semibold">Not Answered</td>
                      <td className="p-2.5 text-right font-bold text-rose-700">{stats.notAnswered}</td>
                    </tr>
                    <tr className="bg-purple-50/50">
                      <td className="p-2.5 text-purple-900 font-semibold">Marked for Review</td>
                      <td className="p-2.5 text-right font-bold text-purple-800">{stats.marked}</td>
                    </tr>
                    <tr className="bg-purple-50/80">
                      <td className="p-2.5 text-purple-900 font-semibold">Answered &amp; Marked for Review</td>
                      <td className="p-2.5 text-right font-bold text-purple-800">{stats.answeredMarked}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-600">Not Visited</td>
                      <td className="p-2.5 text-right font-bold text-slate-700">{stats.notVisited}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to submit the test? You have <strong>{formatTime(timeLeft)}</strong> remaining.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded cursor-pointer transition-colors"
                >
                  No, Return to Exam
                </button>

                <button
                  id="confirm-cbt-final-submit-btn"
                  onClick={executeFinalSubmission}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs cursor-pointer transition-colors"
                >
                  Yes, Submit Final Test
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          QUESTION PAPER MODAL (Quick Exam View)
      ========================================================= */}
      {showQuestionPaperModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Full Question Paper View</h3>
              <button onClick={() => setShowQuestionPaperModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {test.questions.map((q, idx) => (
                <div key={q.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">
                    Q{idx + 1}. {q.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="p-1.5 bg-white rounded border border-slate-200">
                        ({String.fromCharCode(65 + oIdx)}) {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EXAM INSTRUCTIONS MODAL
      ========================================================= */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">CBT Exam Instructions</h3>
              <button onClick={() => setShowInstructionsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">General Instructions:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Total test duration is {test.durationMinutes} minutes.</li>
                <li>Each correct question carries <strong>+4 marks</strong>.</li>
                <li>Each incorrect answer carries <strong>-1 mark</strong> negative marking.</li>
                <li>Unattempted questions receive 0 marks.</li>
                <li>Questions marked for review AND answered will be evaluated for final score calculation.</li>
                <li>You can use keyboard keys 1, 2, 3, 4 or A, B, C, D to quickly select options.</li>
              </ul>
              <div className="pt-3">
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="w-full py-2 bg-blue-700 text-white font-bold rounded cursor-pointer"
                >
                  Understood &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
