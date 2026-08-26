import React, { useState, useEffect } from 'react';
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
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherLoginPage } from './components/TeacherLoginPage';
import { ToastProvider, useToast } from './components/Toast';

import { MOCK_TESTS, INSTITUTE_INFO } from './data/mockTests';
import { TestItem, TestCategory, Difficulty, UserProfile } from './types';
import { subscribeToRealtimeTests, fetchAllTests } from './utils/supabaseClient';

function MainAppContent() {
  // Navigation active section tracking
  const [activeSection, setActiveSection] = useState<string>('hero');

  // User session state restored from localStorage
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('asi_user_session');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn('Session load error:', e);
    }
    return null;
  });

  // Current Route: 'home' | 'teacher-login' | 'dashboard'
  const [currentRoute, setCurrentRoute] = useState<'home' | 'teacher-login' | 'dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('teacher-login') || path.includes('teacher-login')) {
        return 'teacher-login';
      }
    }
    return 'home';
  });

  // Listen to hash changes for smooth navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('teacher-login')) {
        setCurrentRoute('teacher-login');
      } else if (hash.includes('dashboard')) {
        setCurrentRoute('dashboard');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync user state with localStorage
  const handleSetUser = (newUser: UserProfile | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('asi_user_session', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('asi_user_session');
      localStorage.removeItem('asi_teacher_token');
      localStorage.removeItem('asi_auth_role');
    }
  };

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

  // Listen to Supabase Cloud DB changes in realtime
  useEffect(() => {
    fetchAllTests().then((dbTests) => {
      if (dbTests && dbTests.length > 0) {
        setAllTests(dbTests);
      }
    }).catch(console.warn);

    const unsubscribe = subscribeToRealtimeTests((freshTests) => {
      if (freshTests && freshTests.length > 0) {
        setAllTests(freshTests);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth modal state for students
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
    if (currentRoute !== 'home') {
      window.location.hash = '#';
      setCurrentRoute('home');
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
    handleSetUser(null);
    window.location.hash = '#';
    setCurrentRoute('home');
  };

  const handleLoginSuccess = (userProfile: UserProfile) => {
    handleSetUser(userProfile);
    window.location.hash = '#dashboard';
    setCurrentRoute('dashboard');
  };

  // Teacher Login Success Handler
  const handleTeacherLoginSuccess = (teacherProfile: UserProfile) => {
    handleSetUser(teacherProfile);
    window.location.hash = '#dashboard';
    setCurrentRoute('dashboard');
  };

  // Filter tests logic
  const filteredTests = allTests.filter((test) => {
    if (selectedCategory !== 'All' && test.category !== selectedCategory) {
      return false;
    }
    if (selectedDifficulty !== 'All' && test.difficulty !== selectedDifficulty) {
      return false;
    }
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

  // 1. If viewing dedicated /teacher-login route
  if (currentRoute === 'teacher-login') {
    // If already logged in as teacher, redirect directly to dashboard
    if (user && user.isLoggedIn && user.role === 'teacher') {
      setCurrentRoute('dashboard');
    } else {
      return (
        <TeacherLoginPage
          onLoginSuccess={handleTeacherLoginSuccess}
          onGoHome={() => {
            window.location.hash = '#';
            setCurrentRoute('home');
          }}
        />
      );
    }
  }

  // 2. If logged in and viewing the dashboard
  if (user && user.isLoggedIn && currentRoute === 'dashboard') {
    return (
      <>
        {user.role === 'teacher' || user.role === 'admin' ? (
          <AdminDashboard
            user={user}
            tests={allTests}
            onLogout={handleLogout}
            onGoHome={() => {
              window.location.hash = '#';
              setCurrentRoute('home');
            }}
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
            onGoHome={() => {
              window.location.hash = '#';
              setCurrentRoute('home');
            }}
            onUpdateProfile={(updated) => {
              if (user) {
                handleSetUser({ ...user, ...updated });
              }
            }}
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

  // 3. Public Home / Landing View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900 flex flex-col">
      
      {/* 1. Sticky Modern Navbar */}
      <Navbar
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onOpenDashboard={() => {
          window.location.hash = '#dashboard';
          setCurrentRoute('dashboard');
        }}
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

        {/* 3. Available Online Tests Section */}
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

          {/* Responsive Test Cards Grid */}
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

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
