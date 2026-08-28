import React, { useState, useEffect, ReactNode } from 'react';
import {
  Home,
  BookOpen,
  Bot,
  Trophy,
  User,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Flame,
  LogOut,
  Settings,
  GraduationCap,
  Layers,
  Award,
  BarChart3,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useDeviceContext } from '../context/DeviceContext';
import { UserProfile } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { useBackButton, pushHistoryTrap } from '../hooks/useBackButton';

export interface LayoutProps {
  children: ReactNode;
  user: UserProfile | null;
  adminUser: UserProfile | null;
  currentRoute: 'home' | 'student-dashboard' | 'admin';
  activeSection?: string;
  onNavigate: (sectionId: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onAdminLogout: () => void;
  onOpenStudentDashboard: () => void;
  onOpenAdminDashboard: () => void;
  onOpenTeacherLogin: () => void;
  onStartQuickMock?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  adminUser,
  currentRoute,
  activeSection = 'hero',
  onNavigate,
  onOpenAuth,
  onLogout,
  onAdminLogout,
  onOpenStudentDashboard,
  onOpenAdminDashboard,
  onOpenTeacherLogin,
  onStartQuickMock,
}) => {
  const { isMobile, isTablet, isDesktop, isPWA } = useDeviceContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('home');

  // Sync mobile tab state with current route
  useEffect(() => {
    pushHistoryTrap(`asi_${currentRoute}`);
    if (currentRoute === 'student-dashboard') {
      setActiveMobileTab('profile');
    } else if (currentRoute === 'admin') {
      setActiveMobileTab('admin');
    } else {
      if (activeSection === 'tests-section') {
        setActiveMobileTab('tests');
      } else {
        setActiveMobileTab('home');
      }
    }
  }, [currentRoute, activeSection]);

  // Back button handling in Layout: navigate back to Home if in Sub-Dashboard
  useBackButton(() => {
    if (currentRoute !== 'home') {
      onNavigate('hero');
      return true;
    }
    return false;
  }, currentRoute !== 'home', 5);

  // Haptic feedback for native mobile touches
  const triggerHaptic = (duration = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(duration);
      } catch {
        // ignore
      }
    }
  };

  const handleMobileNavClick = (tabKey: string) => {
    triggerHaptic(12);
    setActiveMobileTab(tabKey);

    switch (tabKey) {
      case 'home':
        onNavigate('hero');
        break;
      case 'tests':
        onNavigate('tests-section');
        break;
      case 'doubts':
        // Scroll to doubts / features or trigger interactive solver
        onNavigate('features-section');
        break;
      case 'rankings':
        if (user && user.isLoggedIn) {
          onOpenStudentDashboard();
        } else {
          onNavigate('tests-section');
        }
        break;
      case 'profile':
        if (user && user.isLoggedIn) {
          onOpenStudentDashboard();
        } else {
          onOpenAuth('login');
        }
        break;
      default:
        onNavigate('hero');
    }
  };

  // =========================================================================
  // 1. MOBILE NATIVE-STYLE APP LAYOUT (Android / PWA Feel)
  // =========================================================================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-900 selection:text-purple-100 antialiased overflow-x-hidden pt-safe pb-safe">
        {/* Top Native AppBar */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shadow-md">
          {/* Left: Brand / Logo */}
          <div
            onClick={() => {
              triggerHaptic(8);
              onNavigate('hero');
            }}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">ASI CBT</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase border border-emerald-500/30">
                  NEET
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Amerj Sir Institute</p>
            </div>
          </div>

          {/* Right: Actions (Notification, Teacher & Profile) */}
          <div className="flex items-center gap-1.5">
            <NotificationCenter />

            {user?.isLoggedIn ? (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  onOpenStudentDashboard();
                }}
                className="flex items-center gap-1.5 bg-violet-950/70 border border-violet-700/50 p-1 pl-2 rounded-full text-xs font-bold text-violet-200 active:scale-95 transition-transform"
              >
                <span className="truncate max-w-[80px] text-[11px]">{user.name.split(' ')[0]}</span>
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic(8);
                  onOpenAuth('login');
                }}
                className="px-3 py-1.5 rounded-xl bg-violet-600 active:bg-violet-700 text-white text-xs font-extrabold shadow-md shadow-violet-600/30"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content Body with bottom margin for Bottom Nav */}
        <main className="flex-1 pb-[76px] scroll-area">
          {children}
        </main>

        {/* 5-Tab Native Bottom Navigation Bar (Instagram / PW App style) */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 h-[68px] bg-slate-950/85 backdrop-blur-2xl border-t border-slate-800/80 px-2 flex items-center justify-around shadow-2xl safe-bottom"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {/* Tab 1: Home */}
          <button
            onClick={() => handleMobileNavClick('home')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform ${
              activeMobileTab === 'home' ? 'text-violet-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Home className={`w-5 h-5 ${activeMobileTab === 'home' ? 'stroke-[2.5] text-violet-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Home</span>
            {activeMobileTab === 'home' && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            )}
          </button>

          {/* Tab 2: Tests */}
          <button
            onClick={() => handleMobileNavClick('tests')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform ${
              activeMobileTab === 'tests' ? 'text-violet-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <BookOpen className={`w-5 h-5 ${activeMobileTab === 'tests' ? 'stroke-[2.5] text-violet-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Tests</span>
            {activeMobileTab === 'tests' && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            )}
          </button>

          {/* Tab 3: AI Doubts (Center Floating Badge) */}
          <button
            onClick={() => handleMobileNavClick('doubts')}
            className="flex-1 py-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform"
          >
            <div className="w-10 h-10 -mt-5 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/50 border border-violet-400/40">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-violet-300">ASI AI</span>
          </button>

          {/* Tab 4: Rank / Leaderboard */}
          <button
            onClick={() => handleMobileNavClick('rankings')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform ${
              activeMobileTab === 'rankings' ? 'text-violet-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <Trophy className={`w-5 h-5 ${activeMobileTab === 'rankings' ? 'stroke-[2.5] text-amber-400' : ''}`} />
            <span className="text-[10px] tracking-tight">Ranks</span>
            {activeMobileTab === 'rankings' && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            )}
          </button>

          {/* Tab 5: Profile */}
          <button
            onClick={() => handleMobileNavClick('profile')}
            className={`flex-1 py-1 flex flex-col items-center justify-center gap-1 relative active:scale-90 transition-transform ${
              activeMobileTab === 'profile' ? 'text-violet-400 font-extrabold' : 'text-slate-400 font-medium'
            }`}
          >
            <User className={`w-5 h-5 ${activeMobileTab === 'profile' ? 'stroke-[2.5] text-violet-400' : ''}`} />
            <span className="text-[10px] tracking-tight">{user?.isLoggedIn ? 'Profile' : 'Login'}</span>
            {activeMobileTab === 'profile' && (
              <span className="absolute -top-1 w-8 h-1 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
            )}
          </button>
        </nav>
      </div>
    );
  }

  // =========================================================================
  // 2. DESKTOP PREMIUM WEB APP LAYOUT (PW Web / Dashboard Feel)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-purple-900 selection:text-purple-100 antialiased">
      {/* 2.1 Left Collapsible Sidebar (240px or 76px) */}
      <aside
        className={`sticky top-0 h-screen z-30 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-[76px]' : 'w-[240px]'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div
            onClick={() => onNavigate('hero')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-black text-base text-white tracking-tight">ASI CBT</h1>
                  <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase border border-violet-500/30">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate">Amerj Sir Institute</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Nav Item: Home */}
          <button
            onClick={() => onNavigate('hero')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentRoute === 'home' && activeSection !== 'tests-section'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Home</span>}
          </button>

          {/* Nav Item: Test Series */}
          <button
            onClick={() => onNavigate('tests-section')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentRoute === 'home' && activeSection === 'tests-section'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="NEET Test Series"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>NEET Test Series</span>}
          </button>

          {/* Nav Item: Student Analytics Dashboard */}
          <button
            onClick={() => {
              if (user && user.isLoggedIn) {
                onOpenStudentDashboard();
              } else {
                onOpenAuth('login');
              }
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentRoute === 'student-dashboard'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="My Performance"
          >
            <BarChart3 className="w-5 h-5 shrink-0 text-emerald-400" />
            {!sidebarCollapsed && <span>My Performance</span>}
          </button>

          {/* Nav Item: Features & NCERT Biology */}
          <button
            onClick={() => onNavigate('features-section')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Institute Features"
          >
            <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
            {!sidebarCollapsed && <span>NCERT Biology</span>}
          </button>

          {/* Nav Item: Teacher & Admin Portal */}
          <button
            onClick={onOpenTeacherLogin}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              currentRoute === 'admin'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Faculty & Admin Portal"
          >
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            {!sidebarCollapsed && <span>Faculty Portal</span>}
          </button>

          {/* Quick Mock Test CTA in Sidebar */}
          {!sidebarCollapsed && (
            <div className="pt-4 px-1">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-800/40 space-y-2.5">
                <div className="flex items-center gap-2 text-violet-300 text-xs font-black">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>NEET 2026 Ready?</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Full 200 MCQ NCERT timer simulation with negative marking.
                </p>
                <button
                  onClick={() => onNavigate('tests-section')}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-violet-600/30 cursor-pointer"
                >
                  Start Practice Test &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          {user?.isLoggedIn ? (
            <div className="flex items-center justify-between gap-2">
              <div
                onClick={onOpenStudentDashboard}
                className="flex items-center gap-2.5 cursor-pointer overflow-hidden flex-1"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {!sidebarCollapsed && (
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">Online Aspirant</p>
                  </div>
                )}
              </div>

              {!sidebarCollapsed && (
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-extrabold transition-all cursor-pointer ${
                sidebarCollapsed ? 'p-2' : ''
              }`}
            >
              <User className="w-4 h-4" />
              {!sidebarCollapsed && <span>Student Login</span>}
            </button>
          )}
        </div>
      </aside>

      {/* 2.2 Main Viewport with Top Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
          {/* Left: Breadcrumbs & Active Route */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentRoute === 'admin'
                ? 'Faculty & Admin Center'
                : currentRoute === 'student-dashboard'
                ? 'Student Learning Dashboard'
                : 'CBT Test Series Platform'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-semibold text-violet-400">Niwari Center</span>
          </div>

          {/* Right: Search, Notifications & CTA */}
          <div className="flex items-center gap-3">
            <NotificationCenter />

            {adminUser?.isLoggedIn && (
              <button
                onClick={onOpenAdminDashboard}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}

            {!user?.isLoggedIn && (
              <button
                onClick={() => onOpenAuth('signup')}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold shadow-md shadow-violet-600/30 transition-all cursor-pointer"
              >
                Join Free Test Series
              </button>
            )}
          </div>
        </header>

        {/* Desktop Scrollable Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
