import React, { useState } from 'react';
import { 
  Dna, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  Flame, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TestCard } from './components/TestCard';
import { TestFilter } from './components/TestFilter';
import { Features } from './components/Features';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { TestSimulatorModal } from './components/TestSimulatorModal';
import { TestDetailsModal } from './components/TestDetailsModal';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';

import { MOCK_TESTS, INSTITUTE_INFO } from './data/mockTests';
import { TestItem, TestCategory, Difficulty, UserProfile } from './types';

export default function App() {
  // Navigation active section tracking
  const [activeSection, setActiveSection] = useState<string>('hero');

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);

  // App View State: 'home' or 'dashboard'
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  // Test pool state (Default mock tests + custom published tests)
  const [allTests, setAllTests] = useState<TestItem[]>(() => {
    try {
      const saved = localStorage.getItem('asi_custom_tests');
      if (saved) {
        const parsed: TestItem[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((t) => t.id));
        return [...parsed, ...MOCK_TESTS.filter((t) => !existingIds.has(t.id))];
      }
    } catch (e) {
      console.warn('Error loading custom tests:', e);
    }
    return MOCK_TESTS;
  });

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Test filter states
  const categories: TestCategory[] = [
    'All',
    'NEET Full Syllabus',
    'Class 11 Biology',
    'Class 12 Biology',
    'High Yield',
    'JEE Biology'
  ];
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');

  // Active Modals for Test taking & details
  const [activeTestForTaking, setActiveTestForTaking] = useState<TestItem | null>(null);
  const [activeTestForDetails, setActiveTestForDetails] = useState<TestItem | null>(null);

  // Navigation scroll handler
  const handleNavigate = (sectionId: string) => {
    if (currentView === 'dashboard') {
      setCurrentView('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      setActiveSection(sectionId);
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('home');
  };

  const handleLoginSuccess = (userProfile: UserProfile) => {
    setUser(userProfile);
    setCurrentView('dashboard');
  };

  // Filter tests logic
  const filteredTests = allTests.filter((test) => {
    // Category match
    if (selectedCategory !== 'All' && test.category !== selectedCategory) {
      return false;
    }
    // Difficulty match
    if (selectedDifficulty !== 'All' && test.difficulty !== selectedDifficulty) {
      return false;
    }
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = test.title.toLowerCase().includes(q);
      const matchDesc = test.description.toLowerCase().includes(q);
      const matchSyllabus = test.syllabus.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSyllabus) {
        return false;
      }
    }
    return true;
  });

  // If user is logged in and viewing the dashboard
  if (user && user.isLoggedIn && currentView === 'dashboard') {
    return (
      <>
        {user.role === 'teacher' ? (
          <TeacherDashboard
            user={user}
            tests={allTests}
            onLogout={handleLogout}
            onGoHome={() => setCurrentView('home')}
            onPreviewTest={(test) => setActiveTestForTaking(test)}
            onUpdateTests={(updated) => setAllTests(updated)}
          />
        ) : (
          <StudentDashboard
            user={user}
            tests={allTests}
            onStartTest={(test) => setActiveTestForTaking(test)}
            onViewDetails={(test) => setActiveTestForDetails(test)}
            onLogout={handleLogout}
            onGoHome={() => setCurrentView('home')}
          />
        )}

        {/* Full CBT Test Taking Simulator Modal */}
        {activeTestForTaking && (
          <TestSimulatorModal
            test={activeTestForTaking}
            onClose={() => setActiveTestForTaking(null)}
          />
        )}

        {/* Test Syllabus & Details Modal */}
        {activeTestForDetails && (
          <TestDetailsModal
            test={activeTestForDetails}
            onClose={() => setActiveTestForDetails(null)}
            onStartTest={(t) => {
              setActiveTestForDetails(null);
              setActiveTestForTaking(t);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900 flex flex-col">
      
      {/* 1. Sticky Modern Navbar */}
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onOpenDashboard={() => setCurrentView('dashboard')}
        activeSection={activeSection}
      />

      {/* 2. Hero Section */}
      <main className="flex-1">
        <Hero
          onViewAllTests={() => handleNavigate('tests-section')}
          onOpenAuth={handleOpenAuth}
          isLoggedIn={!!user?.isLoggedIn}
          onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
        />

        {/* 3. Available Online Tests Section (Most Important) */}
        <section 
          id="tests-section"
          className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>NTA Standard Mock Series</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Available Online Tests
              </h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-2xl">
                Select from chapter-wise challenges, unit revisions, and full syllabus grand mocks with instant solutions.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-600 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{allTests.length} Full Tests Ready to Attempt</span>
            </div>
          </div>

          {/* Test Filters & Search */}
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

          {/* Responsive Test Cards Grid (Showing 4+ cards) */}
          {filteredTests.length > 0 ? (
            <div 
              id="available-tests-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredTests.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  onStartTest={(t) => setActiveTestForTaking(t)}
                  onViewDetails={(t) => setActiveTestForDetails(t)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No tests match your filter</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Try clearing your search query or selecting &quot;All&quot; categories to view the available NEET &amp; JEE Biology tests.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Practice Advice Callout banner */}
          <div className="mt-12 bg-violet-50/80 rounded-2xl p-6 border border-violet-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-600/30">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pro Tip from Amerj Sir for NEET 2026:</h4>
                <p className="text-xs text-slate-600">
                  Attempt at least 2 full-syllabus Biology tests every week under strict 60-minute time constraints.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTestForTaking(MOCK_TESTS[0])}
              className="px-5 py-2.5 bg-white hover:bg-violet-100 text-violet-800 text-xs font-bold rounded-xl border border-violet-300 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              Start Recommended Mock &rarr;
            </button>
          </div>
        </section>

        {/* 4. Features Section */}
        <Features />

        {/* 5. About Amerj Sir Institute Section */}
        <AboutSection />
      </main>

      {/* 6. Clean Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Interactive Modals */}
      {/* 1. Full CBT Test Taking Simulator Modal */}
      {activeTestForTaking && (
        <TestSimulatorModal
          test={activeTestForTaking}
          onClose={() => setActiveTestForTaking(null)}
        />
      )}

      {/* 2. Test Syllabus & Details Modal */}
      {activeTestForDetails && (
        <TestDetailsModal
          test={activeTestForDetails}
          onClose={() => setActiveTestForDetails(null)}
          onStartTest={(t) => {
            setActiveTestForDetails(null);
            setActiveTestForTaking(t);
          }}
        />
      )}

      {/* 3. Student / Teacher Auth Modal */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}
