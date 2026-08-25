import React, { useState } from 'react';
import { 
  Dna, 
  BookOpen, 
  LogOut, 
  Sparkles, 
  Award, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Flame, 
  Home, 
  BarChart3, 
  FileText, 
  Target,
  GraduationCap
} from 'lucide-react';
import { UserProfile, TestItem, TestCategory, Difficulty } from '../types';
import { TestCard } from './TestCard';
import { TestFilter } from './TestFilter';

interface StudentDashboardProps {
  user: UserProfile;
  tests: TestItem[];
  onStartTest: (test: TestItem) => void;
  onViewDetails: (test: TestItem) => void;
  onLogout: () => void;
  onGoHome: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  tests,
  onStartTest,
  onViewDetails,
  onLogout,
  onGoHome
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');

  const categories: TestCategory[] = [
    'All',
    'NEET Full Syllabus',
    'Class 11 Biology',
    'Class 12 Biology',
    'High Yield',
    'JEE Biology'
  ];

  const filteredTests = tests.filter((test) => {
    if (selectedCategory !== 'All' && test.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'All' && test.difficulty !== selectedDifficulty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = test.title.toLowerCase().includes(q);
      const matchDesc = test.description.toLowerCase().includes(q);
      const matchSyllabus = test.syllabus.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSyllabus) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Student Portal Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-violet-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-violet-600/20">
                ASI
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                    Amerj Sir Institute
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800">
                    Student Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">NEET Biology Online CBT Dashboard</p>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
              <button
                id="student-view-home-btn"
                onClick={onGoHome}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>View Full Website</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200/80">
                <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-violet-700 font-semibold">{user.targetExam || 'NEET 2026'}</p>
                </div>
              </div>

              <button
                id="student-dashboard-logout-btn"
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. Welcome Message & Stats Banner */}
        <section 
          id="student-welcome-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-xs font-bold backdrop-blur-xs">
                <GraduationCap className="w-3.5 h-3.5 text-violet-300" />
                <span>Student Learning Space</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {user.name}!
              </h1>
              <p className="text-violet-200 text-xs sm:text-sm max-w-xl">
                Targeting <span className="font-bold text-white">{user.targetExam || 'NEET 2026'}</span> • Prepare with authentic NCERT line-by-line questions and real-time NTA CBT test simulations.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="p-2">
                <span className="block text-[11px] text-violet-200 font-medium">Tests Ready</span>
                <span className="text-xl sm:text-2xl font-extrabold text-white">{tests.length}</span>
              </div>
              <div className="p-2 border-x border-white/15">
                <span className="block text-[11px] text-violet-200 font-medium">Completed</span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-300">3</span>
              </div>
              <div className="p-2">
                <span className="block text-[11px] text-violet-200 font-medium">Accuracy</span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-300">92%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-violet-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Current Practice Streak: <strong className="text-white">4 Days</strong></span>
            </div>
            <button 
              onClick={() => onStartTest(tests[0])}
              className="px-4 py-1.5 bg-white text-violet-900 font-bold rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Resume Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* 2. Available Tests Section */}
        <section id="student-available-tests-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                <span>Available Tests ({filteredTests.length})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click on any test to start attempting or view its detailed NCERT syllabus.
              </p>
            </div>

            <button
              onClick={onGoHome}
              className="sm:hidden self-start px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-lg flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>View Full Website</span>
            </button>
          </div>

          {/* Filters */}
          <TestFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
            totalMatches={filteredTests.length}
          />

          {/* Test Cards Grid */}
          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTests.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onStartTest={onStartTest}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No tests match your filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting filters to explore all available mocks.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Clean Dashboard Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Amerj Sir Institute (ASI) • Student Online Learning System</p>
      </footer>

    </div>
  );
};
