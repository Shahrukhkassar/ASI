import React from 'react';
import { 
  Timer, 
  BarChart3, 
  BookOpenCheck, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

export const Features: React.FC = () => {
  const coreFeatures = [
    {
      id: 'feature-timer',
      icon: Timer,
      title: 'Timer Based Tests',
      description: 'Experience authentic real-time exam conditions with countdown timers, Section A/B toggles, and time-per-question telemetry just like NTA NEET CBT.',
      badge: 'Real CBT Mode',
      color: 'from-violet-600 to-indigo-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-700',
      borderColor: 'border-violet-100'
    },
    {
      id: 'feature-instant-result',
      icon: BarChart3,
      title: 'Instant Result',
      description: 'Get immediate performance analysis with score reports, All India Rank estimate, accuracy percentages, and section-wise Botany & Zoology breakdown.',
      badge: 'Zero Waiting',
      color: 'from-blue-600 to-cyan-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100'
    },
    {
      id: 'feature-solutions',
      icon: BookOpenCheck,
      title: 'Detailed Solutions',
      description: 'Access in-depth step-by-step rationales for every option, complete with exact NCERT textbook page references, diagrams, and memory mnemonics.',
      badge: '100% NCERT Aligned',
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100'
    },
    {
      id: 'feature-expert-teachers',
      icon: GraduationCap,
      title: 'Created by Expert Teachers',
      description: 'Curated by Amerj Sir (12+ Years NEET Biology expert) and top medical educators ensuring 100% conceptual accuracy and high question predictability.',
      badge: 'Curated by Amerj Sir',
      color: 'from-amber-600 to-orange-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100'
    }
  ];

  return (
    <section 
      id="features-section"
      className="py-16 sm:py-24 bg-white border-b border-slate-100 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why Students Choose Amerj Sir Institute</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for 360/360 in NEET Biology
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Everything you need to master NCERT concepts, conquer exam anxiety, and achieve top ranks in NEET and JEE Biology.
          </p>
        </div>

        {/* 4 Core Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                id={feat.id}
                className="group relative bg-white rounded-2xl p-7 border border-slate-200 hover:border-violet-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Container */}
                  <div className={`w-14 h-14 rounded-2xl ${feat.bgLight} ${feat.textColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200 shadow-xs border ${feat.borderColor}`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Badge */}
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${feat.bgLight} ${feat.textColor} border ${feat.borderColor} mb-3`}>
                    {feat.badge}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                    {feat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 text-sm mt-2.5 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-violet-600 group-hover:text-violet-800">
                  <span>Explore in live tests &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Student Value Bar */}
        <div className="mt-14 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-xs font-semibold">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>NCERT Line-by-Line Mapping</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Every test question mirrors actual NEET exam weightage
              </h3>
              <p className="text-violet-200 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                Practice chapter-wise and full-length test papers crafted with strictly verified answer keys and detailed NCERT book citations.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">99.4% Accuracy Guarantee</h4>
                  <p className="text-xs text-violet-200">Zero error in answer keys</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3">
                <Zap className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Adaptive Difficulty</h4>
                  <p className="text-xs text-violet-200">Easy, Medium to High Yield</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
