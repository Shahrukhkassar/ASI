import React, { useState, useEffect } from 'react';
import { BookOpen, Flame, ShieldAlert, Smartphone } from 'lucide-react';
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
import { ToastProvider } from './components/Toast';
import { HomeNotificationBanner } from './components/NotificationCenter';
import { PwaInstallButton } from './components/PwaInstallButton';

import { MOCK_TESTS } from './data/mockTests';
import { TestItem, TestCategory, Difficulty, UserProfile } from './types';
import { subscribeToRealtimeTests, fetchAllTests } from './utils/supabaseClient';

function MainAppContent() {
  // Navigation active section tracking
  const [activeSection, setActiveSection] = useState<string>('hero');

  // 1. Separate Student Session (Saved in asi_student_session)
  const [studentUser, setStudentUser] = useState<UserProfile | null>(() => {
    try {
      const savedStudent = localStorage.getItem('asi_student_session');
      if (savedStudent) {
        const parsed = JSON.parse(savedStudent);
        if (parsed.role === 'student' || !parsed.role) {
          return { ...parsed, role: 'student' };
        }
      }
      // Backward compatibility check
      const legacyUser = localStorage.getItem('asi_user_session');
      if (legacyUser) {
        const parsed = JSON.parse(legacyUser);
        if (parsed.role === 'student') return parsed;
      }
    } catch (e) {
      console.warn('Student session load error:', e);
    }
    return null;
  });

  // 2. Separate Admin / Teacher Session (Saved in asi_admin_session)
  const [adminUser, setAdminUser] = useState<UserProfile | null>(() => {
    try {
      const savedAdmin = localStorage.getItem('asi_admin_session');
      const savedToken = localStorage.getItem('asi_admin_token') || localStorage.getItem('asi_teacher_token');
      if (savedAdmin && savedToken) {
        const parsed = JSON.parse(savedAdmin);
        if (parsed.role === 'admin' || parsed.role === 'teacher') {
          return { ...parsed, role: 'admin' };
        }
      }
      // Check legacy teacher token
      const legacyRole = localStorage.getItem('asi_auth_role');
      if (legacyRole === 'teacher' && savedToken) {
        return {
          name: 'Amerj Sir',
          email: 'amerj.sir@asi-institute.edu',
          role: 'admin',
          department: 'Head of NEET & JEE Biology',
          isLoggedIn: true,
          token: savedToken
        };
      }
    } catch (e) {
      console.warn('Admin session load error:', e);
    }
    return null;
  });

  // Current Route: 'home' | 'student-dashboard' | 'admin' | 'teacher-login'
  const [currentRoute, setCurrentRoute] = useState<'home' | 'student-dashboard' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash.includes('admin') || hash.includes('teacher') || path.includes('admin') || path.includes('teacher')) {
        return 'admin';
      }
      if (hash.includes('student') || hash.includes('dashboard') || path.includes('student') || path.includes('dashboard')) {
        return 'student-dashboard';
      }
    }
    return 'home';
  });

  // Listen to browser hash changes for seamless client routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('admin') || hash.includes('teacher')) {
        setCurrentRoute('admin');
      } else if (hash.includes('student') || hash.includes('dashboard')) {
        setCurrentRoute('student-dashboard');
      } else {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 1. Student Session Manager
  const handleSetStudentUser = (newUser: UserProfile | null) => {
    setStudentUser(newUser);
    if (newUser) {
      localStorage.setItem('asi_student_session', JSON.stringify({ ...newUser, role: 'student' }));
    } else {
      localStorage.removeItem('asi_student_session');
      localStorage.removeItem('asi_user_session');
    }
  };

  // 2. Admin Session Manager
  const handleSetAdminUser = (newAdmin: UserProfile | null) => {
    setAdminUser(newAdmin);
    if (newAdmin) {
      localStorage.setItem('asi_admin_session', JSON.stringify({ ...newAdmin, role: 'admin' }));
      if (newAdmin.token) {
        localStorage.setItem('asi_admin_token', newAdmin.token);
      }
    } else {
      localStorage.removeItem('asi_admin_session');
      localStorage.removeItem('asi_admin_token');
      localStorage.removeItem('asi_teacher_token');
      localStorage.removeItem('asi_auth_role');
    }
  };

  // Test pool state (Default mock tests + custom published tests from Supabase)
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
    let isMounted = true;

    const loadTests = async () => {
      try {
        const dbTests = await fetchAllTests();
        if (isMounted && dbTests && dbTests.length > 0) {
          setAllTests(dbTests);
        }
      } catch (err) {
        console.warn('Initial tests fetch error:', err);
      }
    };

    loadTests();

    const unsubscribe = subscribeToRealtimeTests((freshTests) => {
      if (isMounted && freshTests && freshTests.length > 0) {
        setAllTests(freshTests);
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
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

  // Student Auth Handlers
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleStudentLogout = () => {
    handleSetStudentUser(null);
    window.location.hash = '#';
    setCurrentRoute('home');
  };

  const handleAdminLogout = () => {
    handleSetAdminUser(null);
    window.location.hash = '#';
    setCurrentRoute('home');
  };

  const handleLoginSuccess = (userProfile: UserProfile) => {
    handleSetStudentUser(userProfile);
    window.location.hash = '#student-dashboard';
    setCurrentRoute('student-dashboard');
  };

  // Teacher / Admin Login Success Handler
  const handleAdminLoginSuccess = (adminProfile: UserProfile) => {
    handleSetAdminUser(adminProfile);
    window.location.hash = '#admin';
    setCurrentRoute('admin');
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

  // ================= ROUTE 1: ADMIN PANEL =================
  if (currentRoute === 'admin') {
    // If admin is verified and logged in -> Render Admin Dashboard
    if (adminUser && adminUser.isLoggedIn) {
      return (
        <>
          <AdminDashboard
            user={adminUser}
            tests={allTests}
            onLogout={handleAdminLogout}
            onGoHome={() => {
              window.location.hash = '#';
              setCurrentRoute('home');
            }}
            onPreviewTest={(test) => setActiveTestForTaking(test)}
            onUpdateTests={(updated) => setAllTests(updated)}
          />
          {activeTestForTaking && (
            <TestSimulatorModal
              test={activeTestForTaking}
              onClose={() => setActiveTestForTaking(null)}
            />
          )}
        </>
      );
    }

    // Otherwise render secure Teacher/Admin Login Page
    return (
      <TeacherLoginPage
        onLoginSuccess={handleAdminLoginSuccess}
        onGoHome={() => {
          window.location.hash = '#';
          setCurrentRoute('home');
        }}
      />
    );
  }

  // ================= ROUTE 2: STUDENT DASHBOARD =================
  if (currentRoute === 'student-dashboard') {
    if (studentUser && studentUser.isLoggedIn) {
      return (
        <>
          <StudentDashboard
            user={studentUser}
            tests={allTests}
            onStartTest={(test) => setActiveTestForTaking(test)}
            onViewDetails={(test) => setActiveTestForDetails(test)}
            onLogout={handleStudentLogout}
            onGoHome={() => {
              window.location.hash = '#';
              setCurrentRoute('home');
            }}
            onUpdateProfile={(updated) => {
              if (studentUser) {
                handleSetStudentUser({ ...studentUser, ...updated });
              }
            }}
          />
          {activeTestForTaking && (
            <TestSimulatorModal
              test={activeTestForTaking}
              onClose={() => setActiveTestForTaking(null)}
            />
          )}
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

    // If student not logged in, prompt Auth modal and show home
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-4 border border-violet-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto text-white shadow-lg">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Student Login Required</h2>
          <p className="text-sm text-slate-300">
            Please log in with your Student account to access your practice history, test scores, and analytics.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer"
            >
              Log In Student Account
            </button>
            <button
              onClick={() => {
                window.location.hash = '#';
                setCurrentRoute('home');
              }}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              &larr; Back to Home Page
            </button>
          </div>
        </div>

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

  // ================= ROUTE 3: PUBLIC HOME VIEW =================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-200 selection:text-violet-900 flex flex-col">
      
      {/* 1. Real-time Notification Banner on Top of Home */}
      <HomeNotificationBanner
        onStartTestNow={() => setActiveTestForTaking(MOCK_TESTS[0])}
        onExploreTests={() => handleNavigate('tests-section')}
      />

      {/* 2. Sticky Modern Navbar with PWA & Notification Center */}
      <Navbar
        user={studentUser}
        adminUser={adminUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleStudentLogout}
        onAdminLogout={handleAdminLogout}
        onNavigate={handleNavigate}
        onOpenStudentDashboard={() => {
          window.location.hash = '#student-dashboard';
          setCurrentRoute('student-dashboard');
        }}
        onOpenAdminDashboard={() => {
          window.location.hash = '#admin';
          setCurrentRoute('admin');
        }}
        onOpenTeacherLogin={() => {
          window.location.hash = '#admin';
          setCurrentRoute('admin');
        }}
        activeSection={activeSection}
      />

      {/* 3. Main Content Sections */}
      <main className="flex-1">
        <Hero
          onViewAllTests={() => handleNavigate('tests-section')}
          onOpenAuth={handleOpenAuth}
          isLoggedIn={!!studentUser?.isLoggedIn}
          onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
        />

        {/* Available Online Tests Section */}
        <section 
          id="tests-section"
          className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>NTA Standard CBT Series</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Available Online Tests
              </h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-2xl">
                100% NCERT Biology tests for NEET &amp; JEE aspirants in Niwari with Section A &amp; Section B NTA timer simulation.
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
                  Attempt at least 2 full-syllabus Biology tests every week under strict 60-minute time constraints to master speed &amp; accuracy.
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

        {/* Features Section */}
        <Features />

        {/* About Amerj Sir Institute Section */}
        <AboutSection />
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Floating Bottom PWA Install Banner */}
      <PwaInstallButton variant="floating" />

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

      {/* 3. Student Auth Modal */}
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
