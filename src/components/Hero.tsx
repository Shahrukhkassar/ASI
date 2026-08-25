import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Timer, 
  FileText, 
  Users, 
  Star,
  Zap,
  HelpCircle,
  Award
} from 'lucide-react';
import { INSTITUTE_INFO } from '../data/mockTests';

interface HeroProps {
  onViewAllTests: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  isLoggedIn: boolean;
  onStartQuickMock: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onViewAllTests,
  onOpenAuth,
  isLoggedIn,
  onStartQuickMock
}) => {
  // Interactive mini quiz sample in hero
  const [selectedHeroAnswer, setSelectedHeroAnswer] = useState<number | null>(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);

  const sampleQuestion = {
    q: "Which cell organelle is known as the powerhouse of the cell and site of ATP synthesis?",
    options: ["Ribosome", "Mitochondria", "Lysosome", "Golgi Body"],
    correct: 1,
    tip: "Mitochondria generate ATP via oxidative phosphorylation across the inner membrane."
  };

  const handleSelectOption = (idx: number) => {
    setSelectedHeroAnswer(idx);
    setShowAnswerFeedback(true);
  };

  return (
    <section 
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-violet-50/70 via-white to-slate-50/50 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-violet-100/60"
    >
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top High-Yield Badge */}
        <div className="flex items-center justify-center lg:justify-start">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>NEET 2026 & JEE Test Series Live</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-violet-600 font-medium">Updated to Latest NTA Pattern</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mt-6">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              NEET & JEE <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                Biology Online Tests
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
              Practice high-quality online tests created by expert teachers. Instant results &amp; detailed solutions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                id="hero-view-all-tests-btn"
                onClick={onViewAllTests}
                className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white text-base font-bold rounded-2xl shadow-lg shadow-violet-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>View All Tests</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {!isLoggedIn ? (
                <button
                  id="hero-auth-cta-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-violet-50/80 active:scale-98 text-violet-700 hover:text-violet-800 text-base font-bold rounded-2xl border-2 border-violet-200/90 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-violet-600" />
                  <span>Login / Sign Up</span>
                </button>
              ) : (
                <button
                  id="hero-start-mock-btn"
                  onClick={onStartQuickMock}
                  className="w-full sm:w-auto px-7 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-base font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  <span>Start Full Mock Test</span>
                </button>
              )}
            </div>

            {/* Micro Highlights & Trust Metrics */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100/80 text-violet-700 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{INSTITUTE_INFO.stats.studentsEnrolled}</p>
                  <p className="text-xs text-slate-500 font-medium">Active Aspirants</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">4.9 / 5.0</p>
                  <p className="text-xs text-slate-500 font-medium">Student Rating</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">100% NCERT</p>
                  <p className="text-xs text-slate-500 font-medium">Line by Line</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">CBT Interface</p>
                  <p className="text-xs text-slate-500 font-medium">Real NTA Timer</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Interactive Practice Widget */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-violet-900/5 border border-violet-100/80">
              
              {/* Header of widget */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Live Question Sample
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
                  +4 Marks • -1 Mark
                </span>
              </div>

              {/* Sample Question Body */}
              <div className="mt-4">
                <div className="flex items-start gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                    Q.1
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                    {sampleQuestion.q}
                  </p>
                </div>

                {/* Options list */}
                <div className="space-y-2.5 mt-4">
                  {sampleQuestion.options.map((opt, idx) => {
                    const isSelected = selectedHeroAnswer === idx;
                    const isCorrect = idx === sampleQuestion.correct;
                    
                    let btnStyle = "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 text-slate-700";
                    if (showAnswerFeedback) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                      } else if (isSelected) {
                        btnStyle = "border-rose-400 bg-rose-50 text-rose-900 font-bold";
                      } else {
                        btnStyle = "border-slate-200 text-slate-400 opacity-60";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-violet-600 bg-violet-50 text-violet-900 font-semibold";
                    }

                    return (
                      <button
                        key={idx}
                        id={`hero-quiz-opt-${idx}`}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {showAnswerFeedback && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Solution Feedback Box */}
                {showAnswerFeedback && (
                  <div className="mt-4 p-3.5 bg-violet-50/90 rounded-xl border border-violet-200 text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-violet-800 font-bold mb-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Instant Solution &amp; NCERT Ref:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal">
                      {sampleQuestion.tip}
                    </p>
                  </div>
                )}

                {/* CTA inside widget */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Join 15,000+ students taking mock tests
                  </span>
                  <button
                    onClick={onViewAllTests}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Start 8 Full Tests &rarr;
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
