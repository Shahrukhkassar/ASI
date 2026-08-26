import React, { useState, useEffect } from 'react';
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
  GraduationCap,
  User,
  Edit2,
  Camera,
  X,
  Check
} from 'lucide-react';
import { UserProfile, TestItem, TestCategory, Difficulty, TestResult } from '../types';
import { TestCard } from './TestCard';
import { TestFilter } from './TestFilter';

interface StudentDashboardProps {
  user: UserProfile;
  tests: TestItem[];
  onStartTest: (test: TestItem) => void;
  onViewDetails: (test: TestItem) => void;
  onLogout: () => void;
  onGoHome: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  tests,
  onStartTest,
  onViewDetails,
  onLogout,
  onGoHome,
  onUpdateProfile
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhoto, setEditPhoto] = useState(user.photoUrl || '');
  const [editTargetExam, setEditTargetExam] = useState(user.targetExam || 'NEET 2026');
  const [editTargetScore, setEditTargetScore] = useState(user.targetScore || '680+ / 720');
  const [editRollNumber, setEditRollNumber] = useState(user.rollNumber || 'ASI-2026-NEET');
  const [editCollege, setEditCollege] = useState(user.targetCollege || 'AIIMS New Delhi');

  // Recent Submissions State
  const [recentResults, setRecentResults] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem('asi_student_results');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      name: editName.trim() || user.name,
      photoUrl: editPhoto.trim(),
      targetExam: editTargetExam.trim(),
      targetScore: editTargetScore.trim(),
      rollNumber: editRollNumber.trim(),
      targetCollege: editCollege.trim()
    };
    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }
    // Update in local session storage as well
    try {
      const session = JSON.parse(localStorage.getItem('asi_user_session') || '{}');
      localStorage.setItem('asi_user_session', JSON.stringify({ ...session, ...updated }));
    } catch {
      // ignore
    }
    setIsProfileModalOpen(false);
  };

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

  // Calculate student statistics
  const completedCount = recentResults.length;
  const avgScore = completedCount > 0 
    ? Math.round(recentResults.reduce((acc, r) => acc + (r.score || 0), 0) / completedCount) 
    : 0;
  const avgAccuracy = completedCount > 0 
    ? Math.round(recentResults.reduce((acc, r) => acc + (r.accuracy || 0), 0) / completedCount) 
    : 92;

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

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100/80 border border-violet-200/80 transition-all cursor-pointer"
                title="Edit Student Profile"
              >
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                    {user.name}
                    <Edit2 className="w-3 h-3 text-violet-500" />
                  </p>
                  <p className="text-[10px] text-violet-700 font-semibold">{user.targetExam || 'NEET 2026'}</p>
                </div>
              </button>

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
            <div className="flex items-center gap-4">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-violet-400 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black text-2xl shrink-0 backdrop-blur-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-violet-200 text-xs font-bold backdrop-blur-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-300" />
                  <span>Target: {user.targetCollege || 'AIIMS New Delhi'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                  Welcome back, {user.name}!
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="p-1 text-violet-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit Name & Photo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </h1>
                <p className="text-violet-200 text-xs sm:text-sm max-w-xl">
                  Roll: <span className="font-mono font-bold text-white">{user.rollNumber || 'ASI-2026-NEET'}</span> • Goal: <strong className="text-amber-300">{user.targetScore || '680+ / 720'}</strong> in {user.targetExam || 'NEET 2026'}.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-center">
              <div className="p-2">
                <span className="block text-[11px] text-violet-200 font-medium">Tests Ready</span>
                <span className="text-xl sm:text-2xl font-extrabold text-white">{tests.length}</span>
              </div>
              <div className="p-2 border-x border-white/15">
                <span className="block text-[11px] text-violet-200 font-medium">Completed</span>
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-300">{completedCount || 3}</span>
              </div>
              <div className="p-2">
                <span className="block text-[11px] text-violet-200 font-medium">Avg Accuracy</span>
                <span className="text-xl sm:text-2xl font-extrabold text-amber-300">{avgAccuracy}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs text-violet-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Current Practice Streak: <strong className="text-white">4 Days Active</strong></span>
            </div>
            {tests.length > 0 && (
              <button 
                onClick={() => onStartTest(tests[0])}
                className="px-4 py-1.5 bg-white text-violet-900 font-bold rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Practice Test</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
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
                Click on any test to start attempting in NTA CBT mode with automatic autosave and countdown timer.
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

      {/* Profile Customization Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-800 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-violet-300" />
                <h3 className="text-base font-bold">Edit Candidate Profile</h3>
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Avatar / Profile Photo URL</label>
                <input
                  type="url"
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/... or leave empty"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Exam</label>
                  <input
                    type="text"
                    value={editTargetExam}
                    onChange={(e) => setEditTargetExam(e.target.value)}
                    placeholder="NEET 2026"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Score</label>
                  <input
                    type="text"
                    value={editTargetScore}
                    onChange={(e) => setEditTargetScore(e.target.value)}
                    placeholder="680+ / 720"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Roll / Application No.</label>
                  <input
                    type="text"
                    value={editRollNumber}
                    onChange={(e) => setEditRollNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dream College</label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="AIIMS New Delhi"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Dashboard Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Amerj Sir Institute (ASI) • Student Online Learning System</p>
      </footer>

    </div>
  );
};
