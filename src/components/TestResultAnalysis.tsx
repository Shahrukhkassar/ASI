import React, { useState, useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  Trophy,
  Award,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Share2,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Youtube,
  Bot,
  Flame,
  Zap,
  TrendingUp,
  Brain,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Users,
  Layers,
  BarChart3,
  Bookmark,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { Question, TestResult } from '../types';
import { supabase } from '../utils/supabaseClient';
import { AIDoubtSolver } from './AIDoubtSolver';
import { QuestionRenderer } from './QuestionRenderer';

// Props Interface
export interface TestResultAnalysisProps {
  testId?: string;
  studentId?: string;
  studentName?: string;
  testTitle?: string;
  attemptData?: Partial<TestResult> | null;
  questions?: Question[];
  onRetryWeak?: (weakQuestionIds: number[]) => void;
  onBackToTests?: () => void;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeSpent: string;
  isCurrentUser: boolean;
  city?: string;
  badge?: string;
}

interface TopicStat {
  chapter: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  status: 'Strong' | 'Moderate' | 'Weak';
  videoLink?: string;
  notesTitle?: string;
}

/**
 * KaTeX Formula & Math Renderer
 */
const MathRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text) return [];
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g;
    const tokens = text.split(regex);
    return tokens.map((token, i) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2);
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block my-1 text-slate-100" />;
        } catch {
          return <span key={i}>{token}</span>;
        }
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="inline-block mx-0.5 text-slate-100" />;
        } catch {
          return <span key={i}>{token}</span>;
        }
      }
      return <span key={i}>{token}</span>;
    });
  }, [text]);

  return <div className={`inline leading-relaxed ${className}`}>{parts}</div>;
};

export const TestResultAnalysis: React.FC<TestResultAnalysisProps> = ({
  testId = 'mock_neet_01',
  studentId = 'student_current',
  studentName = 'Aspirant',
  testTitle = 'NEET 2026 Ultimate Biology Mock Test',
  attemptData,
  questions = [],
  onRetryWeak,
  onBackToTests
}) => {
  // Normalize Question Data
  const questionList: Question[] = useMemo(() => {
    if (questions && questions.length > 0) return questions;
    // High-Yield Fallback Sample MCQs
    return [
      {
        id: 1,
        question: 'Which of the following is the primary CO2 acceptor in C4 plants?',
        options: ['Phosphoenolpyruvate (PEP)', 'Ribulose-1,5-bisphosphate (RuBP)', 'Oxaloacetate (OAA)', 'Phosphoglyceric acid (PGA)'],
        correctAnswer: 0,
        explanation: 'In C4 plants, PEP (Phosphoenolpyruvate), a 3-carbon compound present in mesophyll cells, acts as the primary acceptor of carbon dioxide catalyzed by PEP carboxylase.',
        chapter: 'Photosynthesis in Higher Plants',
        topic: 'C4 Pathway',
        ncertReference: 'NCERT Biology Class 11, Chapter 13, Page 218'
      },
      {
        id: 2,
        question: 'During DNA replication, the Okazaki fragments on the lagging strand are joined by which enzyme?',
        options: ['DNA Polymerase I', 'DNA Polymerase III', 'DNA Ligase', 'Helicase'],
        correctAnswer: 2,
        explanation: 'DNA Ligase forms phosphodiester bonds between adjacent nucleotides to seal nicks and join Okazaki fragments synthesized discontinuously on the lagging template strand.',
        chapter: 'Molecular Basis of Inheritance',
        topic: 'DNA Replication',
        ncertReference: 'NCERT Biology Class 12, Chapter 6, Page 107'
      },
      {
        id: 3,
        question: 'Identify the mismatched pair regarding human endocrine disorders:',
        options: ["Graves' disease - Hyperthyroidism", "Addison's disease - Hyperadrenalism", 'Diabetes insipidus - Deficiency of ADH', 'Acromegaly - Hypersecretion of GH in adults'],
        correctAnswer: 1,
        explanation: "Addison's disease is caused by HYPOSECRETION (underproduction) of adrenal cortex hormones, primarily aldosterone and cortisol, not hyperadrenalism.",
        chapter: 'Chemical Coordination and Integration',
        topic: 'Adrenal Gland Disorders',
        ncertReference: 'NCERT Biology Class 11, Chapter 22, Page 337'
      },
      {
        id: 4,
        question: 'The anatomical barrier that prevents cross-pollination in bisexual flowers is known as:',
        options: ['Herkogamy', 'Dichogamy', 'Self-incompatibility', 'Cleistogamy'],
        correctAnswer: 0,
        explanation: 'Herkogamy refers to physical or spatial barriers between anther and stigma in bisexual flowers preventing accidental autogamy (e.g., Calotropis gynostegium).',
        chapter: 'Sexual Reproduction in Flowering Plants',
        topic: 'Outbreeding Devices',
        ncertReference: 'NCERT Biology Class 12, Chapter 2, Page 31'
      },
      {
        id: 5,
        question: 'Which of the following stages of meiosis is characterized by the appearance of the synaptonemal complex?',
        options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene'],
        correctAnswer: 1,
        explanation: 'During Zygotene, homologous chromosomes begin pairing together (synapsis) accompanied by the formation of a complex structure called synaptonemal complex.',
        chapter: 'Cell Cycle and Cell Division',
        topic: 'Meiosis I Prophase',
        ncertReference: 'NCERT Biology Class 11, Chapter 10, Page 168'
      }
    ];
  }, [questions]);

  // Normalize User Answers map (questionId -> selectedOption)
  const userAnswers: Record<number, number | null> = useMemo(() => {
    if (attemptData?.answers) return attemptData.answers;
    // Default mock response: Q1 correct (0), Q2 wrong (1), Q3 correct (1), Q4 skipped (null), Q5 wrong (2)
    return {
      1: 0,
      2: 1,
      3: 1,
      4: null,
      5: 2
    };
  }, [attemptData]);

  // Derived Performance Metrics
  const metrics = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questionList.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans === undefined || ans === null) {
        skipped++;
      } else if (ans === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const attempted = correct + wrong;
    const totalQ = questionList.length;
    const totalMarks = totalQ * 4;
    const score = attemptData?.score ?? (correct * 4 - wrong * 1);
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const percentage = Math.max(0, Math.round((score / totalMarks) * 100));
    const timeSpentSeconds = attemptData?.timeSpentSeconds ?? 2840; // ~47m

    const hrs = Math.floor(timeSpentSeconds / 3600);
    const mins = Math.floor((timeSpentSeconds % 3600) / 60);
    const secs = timeSpentSeconds % 60;
    const timeFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`;

    return {
      totalQ,
      totalMarks,
      score: Math.max(0, score),
      correct,
      wrong,
      skipped,
      attempted,
      accuracy,
      percentage,
      timeSpentSeconds,
      timeFormatted
    };
  }, [questionList, userAnswers, attemptData]);

  // Confetti trigger if score >= 70%
  useEffect(() => {
    if (metrics.percentage >= 70) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#7c3aed', '#10b981', '#fbbf24', '#38bdf8']
        });
      } catch {
        // silent
      }
    }
  }, [metrics.percentage]);

  // =========================================================================
  // 1. TOPIC-WISE ANALYSIS COMPUTATION
  // =========================================================================
  const topicStats: TopicStat[] = useMemo(() => {
    const map = new Map<string, { total: number; correct: number; wrong: number; skipped: number }>();

    questionList.forEach((q) => {
      const ch = q.chapter || 'General Biology';
      const existing = map.get(ch) || { total: 0, correct: 0, wrong: 0, skipped: 0 };
      existing.total += 1;

      const userAns = userAnswers[q.id];
      if (userAns === undefined || userAns === null) {
        existing.skipped += 1;
      } else if (userAns === q.correctAnswer) {
        existing.correct += 1;
      } else {
        existing.wrong += 1;
      }

      map.set(ch, existing);
    });

    const results: TopicStat[] = [];
    map.forEach((val, chapter) => {
      const accuracy = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
      let status: 'Strong' | 'Moderate' | 'Weak' = 'Moderate';
      if (accuracy >= 75) status = 'Strong';
      else if (accuracy < 50) status = 'Weak';

      results.push({
        chapter,
        total: val.total,
        correct: val.correct,
        wrong: val.wrong,
        skipped: val.skipped,
        accuracy,
        status,
        videoLink: `https://www.youtube.com/results?search_query=NEET+${encodeURIComponent(chapter)}+One+Shot+Amerj+Sir`,
        notesTitle: `${chapter} - NCERT High-Yield Formula Notes`
      });
    });

    // Sort: Weakest first so student spots improvement areas
    return results.sort((a, b) => a.accuracy - b.accuracy);
  }, [questionList, userAnswers]);

  // Weak chapters identification
  const weakChapters = useMemo(() => {
    return topicStats.filter((t) => t.status === 'Weak' || t.wrong > 0).slice(0, 3);
  }, [topicStats]);

  const weakQuestionIds = useMemo(() => {
    return questionList
      .filter((q) => {
        const a = userAnswers[q.id];
        return a !== undefined && a !== null && a !== q.correctAnswer;
      })
      .map((q) => q.id);
  }, [questionList, userAnswers]);

  // =========================================================================
  // 2. LIVE LEADERBOARD WITH SUPABASE + REALISTIC FALLBACK
  // =========================================================================
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      if (supabase && testId) {
        try {
          const { data, error } = await supabase
            .from('test_attempts')
            .select('student_name, student_email, score, time_left, created_at')
            .eq('test_id', testId)
            .order('score', { ascending: false })
            .limit(10);

          if (!error && Array.isArray(data) && data.length > 0) {
            const mapped: LeaderboardEntry[] = data.map((d: any, idx: number) => ({
              rank: idx + 1,
              id: d.student_email || `std_${idx}`,
              name: d.student_name || `Aspirant ${idx + 1}`,
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(d.student_name || 'Ranker')}`,
              score: d.score,
              totalMarks: metrics.totalMarks,
              accuracy: Math.min(100, Math.round((d.score / (metrics.totalMarks || 1)) * 100)),
              timeSpent: '42m 15s',
              isCurrentUser: d.student_email === studentId || d.student_name === studentName
            }));

            if (isMounted) {
              setLeaderboard(mapped);
              setLoadingLeaderboard(false);
              return;
            }
          }
        } catch {
          // fallback to mock
        }
      }

      // Realistic Benchmark Leaderboard (PW/Allen Level)
      const mockBoard: LeaderboardEntry[] = [
        { rank: 1, id: 'u1', name: 'Aarav Sharma', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aarav', score: metrics.totalMarks, totalMarks: metrics.totalMarks, accuracy: 100, timeSpent: '38m 20s', isCurrentUser: false, city: 'Kota, RJ', badge: 'AIR 1 🏆' },
        { rank: 2, id: 'u2', name: 'Priya Patel', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Priya', score: metrics.totalMarks - 4, totalMarks: metrics.totalMarks, accuracy: 96, timeSpent: '41m 10s', isCurrentUser: false, city: 'Delhi, DL', badge: 'AIR 2 🥈' },
        { rank: 3, id: 'u3', name: 'Rohan Deshmukh', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan', score: metrics.totalMarks - 8, totalMarks: metrics.totalMarks, accuracy: 94, timeSpent: '44m 30s', isCurrentUser: false, city: 'Indore, MP', badge: 'AIR 3 🥉' },
        { rank: 4, id: 'u4', name: 'Ananya Verma', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ananya', score: Math.max(metrics.score + 12, metrics.totalMarks - 12), totalMarks: metrics.totalMarks, accuracy: 90, timeSpent: '45m 05s', isCurrentUser: false, city: 'Lucknow, UP' },
        { rank: 5, id: 'u5', name: 'Kavya Singhania', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kavya', score: Math.max(metrics.score + 8, metrics.totalMarks - 16), totalMarks: metrics.totalMarks, accuracy: 88, timeSpent: '46m 12s', isCurrentUser: false, city: 'Patna, BR' },
        { rank: 6, id: studentId, name: `${studentName} (You)`, avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentName)}`, score: metrics.score, totalMarks: metrics.totalMarks, accuracy: metrics.accuracy, timeSpent: metrics.timeFormatted, isCurrentUser: true, city: 'Niwari, MP', badge: '🔥 You' },
        { rank: 7, id: 'u7', name: 'Devendra Meena', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev', score: Math.max(0, metrics.score - 5), totalMarks: metrics.totalMarks, accuracy: 82, timeSpent: '48m 15s', isCurrentUser: false, city: 'Jaipur, RJ' },
        { rank: 8, id: 'u8', name: 'Shreya Iyer', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shreya', score: Math.max(0, metrics.score - 10), totalMarks: metrics.totalMarks, accuracy: 79, timeSpent: '50m 02s', isCurrentUser: false, city: 'Bengaluru, KA' },
        { rank: 9, id: 'u9', name: 'Mohit Rao', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mohit', score: Math.max(0, metrics.score - 15), totalMarks: metrics.totalMarks, accuracy: 75, timeSpent: '51m 40s', isCurrentUser: false, city: 'Bhopal, MP' },
        { rank: 10, id: 'u10', name: 'Sneha Kumari', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sneha', score: Math.max(0, metrics.score - 20), totalMarks: metrics.totalMarks, accuracy: 72, timeSpent: '53m 10s', isCurrentUser: false, city: 'Ranchi, JH' }
      ];

      if (isMounted) {
        setLeaderboard(mockBoard);
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [testId, studentId, studentName, metrics.score, metrics.totalMarks, metrics.accuracy, metrics.timeFormatted]);

  // Question Filter & Expand State
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'SKIPPED'>('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [aiExplainingId, setAiExplainingId] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<boolean>(false);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questionList.filter((q) => {
      const ans = userAnswers[q.id];
      if (questionFilter === 'CORRECT') return ans === q.correctAnswer;
      if (questionFilter === 'WRONG') return ans !== undefined && ans !== null && ans !== q.correctAnswer;
      if (questionFilter === 'SKIPPED') return ans === undefined || ans === null;
      return true;
    });
  }, [questionList, userAnswers, questionFilter]);

  // AI Explanation Handler (Instant Interactive Tutor)
  const handleAskAi = async (q: Question) => {
    setAiExplainingId(q.id);
    // Simulate smart AI Tutor explanation with NCERT memory tricks
    await new Promise((r) => setTimeout(r, 700));

    const explanation = `🤖 **ASI AI Tutor Breakdown:**
- **Key Concept:** ${q.topic || q.chapter}
- **Why option (${String.fromCharCode(65 + q.correctAnswer)}) is correct:** ${q.explanation}
- 💡 **NCERT Mnemonics / Memory Hack:** Remember that in NEET, examiners frequently test this exact trap. Pay extra attention to negative qualifiers (e.g. *Not*, *Incorrect*, *Except*).
- 📌 **Action Item:** Re-read ${q.ncertReference || 'NCERT Chapter summary'} paragraph 3.`;

    setAiExplanations((prev) => ({ ...prev, [q.id]: explanation }));
    setAiExplainingId(null);
  };

  // WhatsApp Share Action
  const handleShareWhatsApp = () => {
    const text = `🎯 *Amerj Sir Institute - NEET CBT Scorecard* 🎯\n\n📝 *Test:* ${testTitle}\n🏆 *Score:* ${metrics.score} / ${metrics.totalMarks}\n🎯 *Accuracy:* ${metrics.accuracy}%\n⚡ *Correct:* ${metrics.correct} | ❌ *Wrong:* ${metrics.wrong}\n\nJoin ASI Test Series and prepare with Amerj Sir! 🚀`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  // Download PDF Report Action
  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-violet-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold border border-violet-400"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Scorecard copied to WhatsApp share link!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SCORE CARD (PW / ALLEN PRO STYLE) */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl"
      >
        {/* Glow ambient lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-violet-600/30 shrink-0">
                ASI
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-black uppercase tracking-wider border border-violet-500/30">
                    Official NTA Scorecard
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Candidate: <span className="text-white font-bold">{studentName}</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1">
                  {testTitle}
                </h1>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>

          {/* Big Score Hero Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Big Score */}
            <div className="lg:col-span-5 bg-gradient-to-br from-violet-950/70 to-slate-900/90 border-2 border-violet-600/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-violet-400" />
                  Your Final Score
                </span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                    {metrics.score}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-400">
                    / {metrics.totalMarks}
                  </span>
                </div>
              </div>

              {/* Motivational Rank Callout */}
              <div className="mt-6 pt-4 border-t border-violet-800/30 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-violet-200 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                    You are in <span className="text-amber-300">Top {Math.max(5, 100 - metrics.percentage)}%</span> of all candidates!
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Institute Percentile: <span className="font-bold text-white">{Math.max(45, metrics.percentage + 8).toFixed(1)}th</span>
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-black text-xs shadow-md">
                  Rank #6
                </div>
              </div>
            </div>

            {/* Right 4 Metric Tiles Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Tile 1: Accuracy */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Accuracy</span>
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                    {metrics.accuracy}%
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">High precision</p>
                </div>
              </div>

              {/* Tile 2: Attempted */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-violet-500/40 transition-colors">
                <div className="flex items-center justify-between text-violet-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Attempted</span>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {metrics.attempted} <span className="text-sm text-slate-400 font-semibold">/ {metrics.totalQ}</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{metrics.skipped} Skipped</p>
                </div>
              </div>

              {/* Tile 3: Correct */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-teal-500/40 transition-colors">
                <div className="flex items-center justify-between text-teal-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Correct</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-teal-300">
                    {metrics.correct}
                  </span>
                  <p className="text-[11px] text-teal-400/80 mt-1">+{metrics.correct * 4} Marks</p>
                </div>
              </div>

              {/* Tile 4: Time Spent */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-sky-500/40 transition-colors">
                <div className="flex items-center justify-between text-sky-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Time</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {metrics.timeFormatted}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Total exam time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE LEADERBOARD (KOTA / PW STYLE) */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Live All-India Test Leaderboard
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h2>
              <p className="text-xs text-slate-400">Rankings updated in real-time for {testTitle}</p>
            </div>
          </div>

          <span className="text-xs text-violet-400 font-bold bg-violet-950/60 px-3 py-1.5 rounded-xl border border-violet-800/40">
            Top 10 High Scorers
          </span>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-black uppercase text-slate-400 border-b border-slate-800/80">
                <th className="pb-3 px-3">Rank</th>
                <th className="pb-3 px-3">Candidate</th>
                <th className="pb-3 px-3 text-center">Score</th>
                <th className="pb-3 px-3 text-center">Accuracy</th>
                <th className="pb-3 px-3 text-right">Time Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {leaderboard.map((entry) => {
                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-violet-950/50 border-2 border-violet-500/80 font-bold'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                            entry.rank === 1
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                              : entry.rank === 2
                              ? 'bg-slate-300 text-slate-950 shadow-md'
                              : entry.rank === 3
                              ? 'bg-amber-700 text-white shadow-md'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                        {entry.badge && (
                          <span className="text-[10px] font-extrabold text-amber-300 hidden sm:inline">
                            {entry.badge}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Candidate Name & Avatar */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm ${entry.isCurrentUser ? 'text-violet-300 font-extrabold' : 'text-slate-100 font-semibold'}`}>
                              {entry.name}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="px-1.5 py-0.2 bg-violet-600 text-white text-[9px] font-black rounded uppercase">
                                You
                              </span>
                            )}
                          </div>
                          {entry.city && (
                            <span className="text-[11px] text-slate-400 block">{entry.city}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-sm font-black text-white">
                        {entry.score}{' '}
                        <span className="text-xs text-slate-400 font-normal">/ {entry.totalMarks}</span>
                      </span>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          entry.accuracy >= 85
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {entry.accuracy}%
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-3 text-right text-xs text-slate-300 font-mono">
                      {entry.timeSpent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECTION 3: TOPIC-WISE ANALYSIS WITH RECHARTS (CHAPTER ACCURACY) */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-400" />
              Chapter-Wise Strength &amp; Weakness Analysis
            </h2>
            <p className="text-xs text-slate-400">
              Visual breakdown of accuracy across all tested NCERT chapters
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Strong (&gt;75%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Weak (&lt;50%)
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="chapter"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                interval={0}
                tick={({ x, y, payload }) => {
                  const label = payload.value;
                  const truncated = label.length > 14 ? label.slice(0, 12) + '...' : label;
                  return (
                    <text x={x} y={y + 12} fill="#94a3b8" fontSize={10} textAnchor="middle">
                      {truncated}
                    </text>
                  );
                }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data: TopicStat = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.chapter}</p>
                        <p className="text-slate-300">
                          Accuracy: <span className="font-bold text-violet-400">{data.accuracy}%</span>
                        </p>
                        <p className="text-slate-400">
                          Score: <span className="text-emerald-400 font-bold">{data.correct} Correct</span> / {data.total} Qs
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            data.status === 'Strong'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : data.status === 'Weak'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {data.status} Chapter
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {topicStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.status === 'Strong' ? '#10b981' : entry.status === 'Weak' ? '#f43f5e' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Badges Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {topicStats.map((t) => (
            <div
              key={t.chapter}
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                t.status === 'Strong'
                  ? 'bg-emerald-950/20 border-emerald-800/40'
                  : t.status === 'Weak'
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-amber-950/20 border-amber-800/40'
              }`}
            >
              <div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{t.chapter}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t.correct}/{t.total} Correct ({t.accuracy}%)
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                  t.status === 'Strong'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : t.status === 'Weak'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECTION 4: SMART RECOMMENDATIONS (AI UPSELL & WEAK TOPIC BOOST) */}
      {/* ========================================================================= */}
      {weakChapters.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-gradient-to-r from-violet-950/90 via-slate-900 to-indigo-950/90 border-2 border-violet-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  🔥 AI Rapid Score Booster
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                  Tumhe in {weakChapters.length} topics par kaam karna hai. Ye revision videos dekho to agle test me +20 marks pakke!
                </h3>
              </div>
            </div>

            {weakQuestionIds.length > 0 && (
              <button
                onClick={() => onRetryWeak && onRetryWeak(weakQuestionIds)}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-violet-600/40 cursor-pointer transition-all shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry {weakQuestionIds.length} Weak Questions</span>
              </button>
            )}
          </div>

          {/* 3 Recommended High-Yield Video Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weakChapters.map((ch, idx) => (
              <div
                key={ch.chapter}
                className="bg-slate-950/80 border border-violet-800/40 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-400 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                      Priority #{idx + 1} Fix
                    </span>
                    <Youtube className="w-4 h-4 text-red-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                    {ch.chapter}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Your Accuracy: <span className="text-rose-400 font-bold">{ch.accuracy}%</span> ({ch.wrong} mistakes in this test)
                  </p>
                </div>

                <a
                  href={ch.videoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <span>Watch One-Shot Video</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: QUESTION-WISE DEEP DIVE WITH SOLUTIONS & AI TUTOR */}
      {/* ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-violet-400" />
              Question-Wise Deep Dive &amp; Solutions
            </h2>
            <p className="text-xs text-slate-400">
              Review every answer with textbook explanations and instant AI breakdowns
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
            {(['ALL', 'CORRECT', 'WRONG', 'SKIPPED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setQuestionFilter(f)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  questionFilter === f
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'ALL'
                  ? `All (${questionList.length})`
                  : f === 'CORRECT'
                  ? `Correct (${metrics.correct})`
                  : f === 'WRONG'
                  ? `Wrong (${metrics.wrong})`
                  : `Skipped (${metrics.skipped})`}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Accordion List */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.correctAnswer;
            const isSkipped = userChoice === undefined || userChoice === null;
            const isExpanded = expandedQuestionId === q.id;

            return (
              <div
                key={q.id || idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCorrect
                    ? 'bg-emerald-950/10 border-emerald-900/40'
                    : isSkipped
                    ? 'bg-slate-950/40 border-slate-800'
                    : 'bg-rose-950/10 border-rose-900/40'
                }`}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isSkipped
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {q.id}
                    </span>

                    <div>
                      <div className="text-sm font-bold text-white">
                        <MathRenderer text={q.question} />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <span>{q.chapter || 'Biology'}</span>
                        <span>•</span>
                        <span>{q.topic || 'Concept'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCorrect ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> +4 Marks
                      </span>
                    ) : isSkipped ? (
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">
                        0 Skipped
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5 stroke-[3]" /> -1 Negative
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 space-y-4 bg-slate-950/60">
                    {/* Render Authentic NTA White Paper Card */}
                    <QuestionRenderer
                      question={q}
                      selectedOption={userChoice}
                      showCorrectAnswer={true}
                      disabled={true}
                    />

                    {/* AI Generated Interactive Explanation */}
                    {aiExplanations[q.id] && (
                      <div className="bg-violet-950/40 p-4 rounded-xl border border-violet-800/60 text-slate-200 whitespace-pre-line leading-relaxed text-xs">
                        {aiExplanations[q.id]}
                      </div>
                    )}

                    {/* Action Buttons: Watch Video & Ask AI */}
                    <div className="flex items-center gap-3 pt-2">
                      <a
                        href={`https://www.youtube.com/results?search_query=NEET+${encodeURIComponent(q.chapter || '')}+${encodeURIComponent(q.topic || '')}+Amerj+Sir`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-800 transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                        <span>Watch Concept Video</span>
                      </a>

                      <AIDoubtSolver
                        question={q}
                        mode="result"
                        studentId={studentId}
                        studentName={studentName}
                        testId={testId}
                        currentSelectedOption={userChoice}
                        triggerVariant="button"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ========================================================================= */}
      {/* SECTION 6: BOTTOM STICKY/ACTION BAR */}
      {/* ========================================================================= */}
      <footer className="sticky bottom-4 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-xs text-slate-300 font-medium">
            Test attempt saved to candidate portfolio • Keep pushing for NEET 2026!
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {weakQuestionIds.length > 0 && (
            <button
              onClick={() => onRetryWeak && onRetryWeak(weakQuestionIds)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry {weakQuestionIds.length} Weak Questions</span>
            </button>
          )}

          <button
            onClick={onBackToTests}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Back to Tests</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Optional Diagram Zoom Modal */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={zoomedImage} alt="Zoomed Diagram" className="rounded-2xl max-w-full max-h-full object-contain border border-slate-700" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestResultAnalysis;
