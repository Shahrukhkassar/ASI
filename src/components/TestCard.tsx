import React from 'react';
import { 
  Timer, 
  HelpCircle, 
  Dna, 
  Star, 
  ArrowRight, 
  Award,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { TestItem, Difficulty } from '../types';

interface TestCardProps {
  test: TestItem;
  onStartTest: (test: TestItem) => void;
  onViewDetails: (test: TestItem) => void;
}

const getDifficultyBadge = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: 'Easy'
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'Medium'
      };
    case 'Hard':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Hard'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        label: difficulty
      };
  }
};

export const TestCard: React.FC<TestCardProps> = ({
  test,
  onStartTest,
  onViewDetails
}) => {
  const diffBadge = getDifficultyBadge(test.difficulty);

  return (
    <div 
      id={`test-card-${test.id}`}
      className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-violet-300 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
    >
      {/* Top badges & subject */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
              <Dna className="w-3.5 h-3.5" />
              <span>Subject: {test.subject}</span>
            </span>
            {test.isPopular && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ★ Popular
              </span>
            )}
          </div>
          
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${diffBadge.bg}`}>
            {diffBadge.label}
          </span>
        </div>

        {/* Test Name */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
          {test.title}
        </h3>

        {/* Short description */}
        <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {test.description}
        </p>

        {/* Meta details grid (Questions, Duration, Marks) */}
        <div className="grid grid-cols-3 gap-2 py-3.5 my-4 bg-slate-50/80 rounded-xl border border-slate-100 px-3 text-center">
          <div>
            <span className="block text-[11px] text-slate-500 font-medium">Questions</span>
            <span className="text-sm font-bold text-slate-900">{test.totalQuestions} Qs</span>
          </div>

          <div className="border-x border-slate-200/70">
            <span className="block text-[11px] text-slate-500 font-medium">Duration</span>
            <div className="flex items-center justify-center gap-1">
              <Timer className="w-3 h-3 text-violet-600" />
              <span className="text-sm font-bold text-slate-900">{test.durationMinutes} min</span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] text-slate-500 font-medium">Total Marks</span>
            <span className="text-sm font-bold text-violet-700">{test.totalMarks} M</span>
          </div>
        </div>

        {/* Syllabus tags preview */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-600">Key Syllabus Units:</span>
            <button 
              onClick={() => onViewDetails(test)}
              className="text-violet-600 hover:text-violet-800 font-bold hover:underline cursor-pointer"
            >
              View Full &rarr;
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {test.syllabus.slice(0, 2).map((item, idx) => (
              <span 
                key={idx} 
                className="text-[11px] px-2 py-0.5 rounded-md bg-violet-50/70 text-slate-600 border border-violet-100/60 truncate max-w-[180px]"
              >
                {item}
              </span>
            ))}
            {test.syllabus.length > 2 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                +{test.syllabus.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card bottom actions: Attempts + Start Test Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Award className="w-3.5 h-3.5 text-slate-400" />
          <span>{(test.attemptsCount / 1000).toFixed(1)}k attempted</span>
        </div>

        <button
          id={`start-test-btn-${test.id}`}
          onClick={() => onStartTest(test)}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-violet-600/20 transition-all flex items-center gap-1.5 group/btn cursor-pointer"
        >
          <span>Start Test</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
