import React, { useState, useEffect } from 'react';
import { 
  X, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Bookmark, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  HelpCircle,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestItem, TestResult } from '../types';

interface TestSimulatorModalProps {
  test: TestItem | null;
  onClose: () => void;
}

export const TestSimulatorModal: React.FC<TestSimulatorModalProps> = ({
  test,
  onClose
}) => {
  if (!test) return null;

  // Active question index (0-based)
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  
  // Selected option index per questionId (e.g. {1: 0, 2: 3})
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  
  // Marked for review set
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});

  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState<number>(test.durationMinutes * 60);
  
  // State: 'testing' | 'submitted'
  const [testState, setTestState] = useState<'testing' | 'submitted'>('testing');
  
  // Computed test result
  const [result, setResult] = useState<TestResult | null>(null);

  // Review mode filter: 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  // Timer effect
  useEffect(() => {
    if (testState !== 'testing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectOption = (qId: number, optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: prev[qId] === optIdx ? null : optIdx
    }));
  };

  const handleToggleReview = (qId: number) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleClearResponse = (qId: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleSubmitTest = () => {
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
      timeSpentSeconds: timeSpent,
      answers
    };

    setResult(res);
    setTestState('submitted');

    // Launch celebratory confetti if score is positive
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setMarkedForReview({});
    setCurrentIdx(0);
    setTimeLeft(test.durationMinutes * 60);
    setTestState('testing');
    setResult(null);
  };

  const currentQuestion = test.questions[currentIdx] || test.questions[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center font-extrabold text-sm shadow-md shadow-violet-600/30">
              ASI
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {test.title}
              </h2>
              <p className="text-xs text-violet-300">
                Subject: {test.subject} • NEET CBT Interface (+4 / -1 Marking)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {testState === 'testing' && (
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold ${
                timeLeft < 300 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                  : 'bg-slate-800 text-violet-300 border-violet-800/60'
              }`}>
                <Clock className="w-4 h-4 text-violet-400" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            <button
              id="test-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Test"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        {testState === 'testing' ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Question Area (8 Cols) */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
              <div>
                {/* Question meta */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-lg text-xs font-bold">
                      Question {currentIdx + 1} of {test.questions.length}
                    </span>
                    {currentQuestion.chapter && (
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Chapter: {currentQuestion.chapter}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+4</span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">-1</span>
                  </div>
                </div>

                {/* Question statement */}
                <div className="space-y-4">
                  <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                    {currentQuestion.question}
                  </p>

                  {/* Options */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((option, optIdx) => {
                      const isSelected = answers[currentQuestion.id] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          id={`opt-btn-${currentQuestion.id}-${optIdx}`}
                          onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-violet-600 bg-violet-50 text-violet-950 font-bold shadow-xs'
                              : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected 
                                ? 'bg-violet-600 text-white' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="text-sm sm:text-base">{option}</span>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Question Action Bottom Bar */}
              <div className="pt-8 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleReview(currentQuestion.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      markedForReview[currentQuestion.id]
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>

                  {answers[currentQuestion.id] !== undefined && (
                    <button
                      onClick={() => handleClearResponse(currentQuestion.id)}
                      className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Clear Response
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentIdx < test.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.min(test.questions.length - 1, prev + 1))}
                      className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl flex items-center gap-1 shadow-sm shadow-violet-600/20 cursor-pointer"
                    >
                      <span>Save &amp; Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      id="submit-test-cbt-btn"
                      onClick={handleSubmitTest}
                      className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1 shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Test</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Right Question Palette (4 Cols) */}
            <div className="lg:col-span-4 p-6 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Question Palette
                </h3>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 bg-white p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-violet-600" />
                    <span className="text-slate-600">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-200" />
                    <span className="text-slate-600">Not Attempted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-400" />
                    <span className="text-slate-600">Marked Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded ring-2 ring-violet-600 bg-white" />
                    <span className="text-slate-600">Current Q</span>
                  </div>
                </div>

                {/* Questions Grid */}
                <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
                  {test.questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                    const isMarked = markedForReview[q.id];
                    const isCurrent = idx === currentIdx;

                    let btnClass = "bg-white text-slate-700 border-slate-200 hover:border-violet-300";
                    if (isMarked) {
                      btnClass = "bg-amber-400 text-amber-950 font-bold border-amber-500";
                    } else if (isAnswered) {
                      btnClass = "bg-violet-600 text-white font-bold border-violet-700";
                    }

                    if (isCurrent) {
                      btnClass += " ring-2 ring-violet-900 ring-offset-1";
                    }

                    return (
                      <button
                        key={q.id}
                        id={`palette-q-${idx}`}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette Footer: Summary & Final Submit */}
              <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Answered: <strong>{Object.keys(answers).length}</strong></span>
                  <span>Remaining: <strong>{test.questions.length - Object.keys(answers).length}</strong></span>
                </div>

                <button
                  id="final-submit-test-btn"
                  onClick={handleSubmitTest}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit &amp; View Result</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* Result & Detailed Solutions View */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50/50">
            
            {/* Scorecard Hero Banner */}
            <div className="bg-gradient-to-r from-violet-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                
                <div className="text-center sm:text-left space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Performance Analysis</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Test Completed!
                  </h3>
                  <p className="text-violet-200 text-xs sm:text-sm">
                    {test.title} • All India Percentile calculated against 15,000+ test attempts
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <span className="block text-xs font-medium text-violet-200">Your Score</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      {result?.score}
                      <span className="text-sm font-normal text-violet-300"> / {result?.totalMarks}</span>
                    </span>
                  </div>
                  <div className="h-10 w-px bg-white/20" />
                  <div className="text-center">
                    <span className="block text-xs font-medium text-violet-200">Accuracy</span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-emerald-300">
                      {result?.accuracy}%
                    </span>
                  </div>
                </div>

              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-xs text-violet-200">Correct Answers</span>
                  <p className="text-xl font-bold text-emerald-400">+{result?.correct}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-xs text-violet-200">Incorrect Answers</span>
                  <p className="text-xl font-bold text-rose-400">-{result?.incorrect}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-xs text-violet-200">Unattempted</span>
                  <p className="text-xl font-bold text-slate-300">{result?.unattempted}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl">
                  <span className="text-xs text-violet-200">Time Spent</span>
                  <p className="text-xl font-bold text-amber-300">{formatTime(result?.timeSpentSeconds || 0)}</p>
                </div>
              </div>

            </div>

            {/* Detailed Solutions Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                    <span>Detailed Step-by-Step Solutions</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Review every question with exact NCERT references and conceptual explanations.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      reviewFilter === 'all' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All ({test.questions.length})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      reviewFilter === 'correct' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Correct ({result?.correct})
                  </button>
                  <button
                    onClick={() => setReviewFilter('incorrect')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      reviewFilter === 'incorrect' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Incorrect ({result?.incorrect})
                  </button>
                </div>
              </div>

              {/* Questions Solution List */}
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
                        className={`bg-white rounded-2xl p-6 border transition-all ${
                          isCorrect 
                            ? 'border-emerald-200 shadow-xs' 
                            : isUnattempted 
                            ? 'border-slate-200' 
                            : 'border-rose-200 shadow-xs'
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                              Q.{idx + 1}
                            </span>
                            {q.chapter && (
                              <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                                {q.chapter}
                              </span>
                            )}
                          </div>

                          <div>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+4)
                              </span>
                            ) : isUnattempted ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                                Unattempted (0)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" /> Incorrect (-1)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Statement */}
                        <p className="text-base font-semibold text-slate-900 mb-4">
                          {q.question}
                        </p>

                        {/* Options preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          {q.options.map((opt, optIdx) => {
                            const isThisCorrect = optIdx === q.correctAnswer;
                            const isThisUserSelected = userSelected === optIdx;

                            let optStyle = "bg-slate-50 border-slate-200 text-slate-600";
                            if (isThisCorrect) {
                              optStyle = "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold";
                            } else if (isThisUserSelected) {
                              optStyle = "bg-rose-50 border-rose-300 text-rose-950 font-bold";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${optStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isThisCorrect && (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                    Correct Key
                                  </span>
                                )}
                                {isThisUserSelected && !isThisCorrect && (
                                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        <div className="p-4 bg-violet-50/80 rounded-xl border border-violet-100 text-xs sm:text-sm">
                          <div className="flex items-center justify-between text-violet-900 font-bold mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 text-violet-600" />
                              <span>NCERT Solution Explanation</span>
                            </div>
                            {q.ncertReference && (
                              <span className="text-xs text-violet-700 font-semibold bg-white px-2 py-0.5 rounded border border-violet-200">
                                📖 {q.ncertReference}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>

                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Result Action Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Test</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-600/25 transition-all cursor-pointer"
              >
                Back to All Tests
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
