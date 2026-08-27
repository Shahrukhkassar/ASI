import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BookOpen, Flame, ShieldAlert, Smartphone, RefreshCw } from 'lucide-react';
import { DeviceProvider, useDeviceContext } from './context/DeviceContext';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { TestCard } from './components/TestCard';
import { TestFilter } from './components/TestFilter';
import { Features } from './components/Features';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { HomeNotificationBanner } from './components/NotificationCenter';
import { PwaInstallButton } from './components/PwaInstallButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useBackButton, pushHistoryTrap } from './hooks/useBackButton';

import { MOCK_TESTS } from './data/mockTests';
import { TestItem, TestCategory, Difficulty, UserProfile } from './types';
import { subscribeToRealtimeTests, fetchAllTests } from './utils/supabaseClient';

// Lazy load heavy components and sub-dashboards for fast APK cold start & bundle optimization
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherLoginPage = lazy(() => import('./components/TeacherLoginPage'));
const TestSimulatorModal = lazy(() => import('./components/TestSimulatorModal'));
const TestDetailsModal = lazy(() => import('./components/TestDetailsModal'));
const AuthModal = lazy(() => import('./components/AuthModal'));

/**
 * Lightweight Route Loading Skeleton
 */
const RouteLoadingFallback = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
      <RefreshCw className="w-6 h-6 animate-spin" />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-bold text-white">Loading ASI Platform...</p>
      <p className="text-xs text-slate-400">Optimizing resources for your device</p>
    </div>
  </div>
);

function MainAppContent() {
  const { isMobile, isPWA } = useDeviceContext();

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

  // Current Route: 'home' | 'student-dashboard' | 'admin'
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

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTestForTaking, setActiveTestForTaking] = useState<TestItem | null>(null);
  const [activeTestForDetails, setActiveTestForDetails] = useState<TestItem | null>(null);

  // Hardware Back Button Handlers for App-level modals
  useBackButton(() => {
    if (activeTestForDetails) {
      setActiveTestForDetails(null);
      return true;
    }
    return false;
  }, !!activeTestForDetails, 25);

  useBackButton(() => {
    if (authModalOpen) {
      setAuthModalOpen(false);
      return true;
    }
    return false;
  }, authModalOpen, 24);

  // Ensure viewport meta and theme-color for PWA & mobile
  useEffect(() => {
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', '#020617');

    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
    }
  }, []);

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

  // Test pool state
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

  // ================= ROUTE 1: ADMIN PANEL (PROTECTED) =================
  if (currentRoute === 'admin') {
    return (
      <ProtectedRoute
        requiredRole="admin"
        currentUser={adminUser}
        onUnauthorized={() => {
          // Stay on admin hash so TeacherLoginPage shows
        }}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          {adminUser && adminUser.isLoggedIn ? (
            <Layout
              user={studentUser}
              adminUser={adminUser}
              currentRoute={currentRoute}
              activeSection={activeSection}
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
              onLogout={handleStudentLogout}
              onAdminLogout={handleAdminLogout}
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
              onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
            >
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
            </Layout>
          ) : (
            <TeacherLoginPage
              onLoginSuccess={handleAdminLoginSuccess}
              onGoHome={() => {
                window.location.hash = '#';
                setCurrentRoute('home');
              }}
            />
          )}
        </Suspense>
      </ProtectedRoute>
    );
  }

  // ================= ROUTE 2: STUDENT DASHBOARD (PROTECTED) =================
  if (currentRoute === 'student-dashboard') {
    return (
      <ProtectedRoute
        requiredRole="student"
        currentUser={studentUser}
        onUnauthorized={() => {
          handleOpenAuth('login');
        }}
      >
        <Suspense fallback={<RouteLoadingFallback />}>
          <Layout
            user={studentUser}
            adminUser={adminUser}
            currentRoute={currentRoute}
            activeSection={activeSection}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onLogout={handleStudentLogout}
            onAdminLogout={handleAdminLogout}
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
            onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
          >
            {studentUser && (
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
            )}
            {activeTestForTaking && (
              <TestSimulatorModal
                test={activeTestForTaking}
                user={studentUser}
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
          </Layout>
        </Suspense>
      </ProtectedRoute>
    );
  }

  // ================= ROUTE 3: PUBLIC HOME VIEW (ADAPTIVE LAYOUT) =================
  return (
    <Layout
      user={studentUser}
      adminUser={adminUser}
      currentRoute={currentRoute}
      activeSection={activeSection}
      onNavigate={handleNavigate}
      onOpenAuth={handleOpenAuth}
      onLogout={handleStudentLogout}
      onAdminLogout={handleAdminLogout}
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
      onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
    >
      {/* 1. Real-time Notification Banner on Top */}
      <HomeNotificationBanner
        onStartTestNow={() => setActiveTestForTaking(MOCK_TESTS[0])}
        onExploreTests={() => handleNavigate('tests-section')}
      />

      {/* 2. Hero Section */}
      <Hero
        onViewAllTests={() => handleNavigate('tests-section')}
        onOpenAuth={handleOpenAuth}
        isLoggedIn={!!studentUser?.isLoggedIn}
        onStartQuickMock={() => setActiveTestForTaking(MOCK_TESTS[0])}
      />

      {/* 3. Available Online Tests Section */}
      <section
        id="tests-section"
        className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-950/80 text-violet-300 border border-violet-700/50 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>NTA Standard CBT Series</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Available Online Tests
            </h2>
            <p className="text-slate-400 mt-2 text-xs sm:text-base max-w-2xl">
              100% NCERT Biology tests for NEET &amp; JEE aspirants in Niwari with Section A &amp; Section B NTA timer simulation.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800 shadow-xs text-xs font-semibold text-slate-300 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{allTests.length} Full Tests Ready to Attempt</span>
          </div>
        </div>

        {/* Test Filters */}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6"
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
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-8 mt-6">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No tests match your filter</h3>
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

        {/* Practice Advice Callout Banner */}
        <div className="mt-12 bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 rounded-2xl p-5 sm:p-6 border border-violet-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-600/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pro Tip from Amerj Sir for NEET 2026:</h4>
              <p className="text-xs text-slate-400">
                Attempt at least 2 full-syllabus Biology tests every week under strict 60-minute time constraints to master speed &amp; accuracy.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTestForTaking(MOCK_TESTS[0])}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-violet-100 text-violet-950 text-xs font-black rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Start Recommended Mock &rarr;
          </button>
        </div>
      </section>

      {/* 4. Features Section */}
      <Features />

      {/* 5. About Section */}
      <AboutSection />

      {/* 6. Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Floating Bottom PWA Install Banner (Mobile) */}
      <PwaInstallButton variant="floating" />

      {/* Interactive Modals (Lazy Loaded) */}
      <Suspense fallback={null}>
        {activeTestForTaking && (
          <TestSimulatorModal
            test={activeTestForTaking}
            user={studentUser}
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

        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            initialMode={authMode}
            onClose={() => setAuthModalOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <DeviceProvider>
      <ToastProvider>
        <MainAppContent />
      </ToastProvider>
    </DeviceProvider>
  );
}
