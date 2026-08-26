import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Menu, 
  X, 
  User, 
  LogOut, 
  BookOpen, 
  Sparkles,
  Award,
  ChevronDown,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { UserProfile } from '../types';
import { PwaInstallButton } from './PwaInstallButton';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  user: UserProfile | null;
  adminUser?: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  onAdminLogout?: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenStudentDashboard?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenTeacherLogin?: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  adminUser,
  onOpenAuth,
  onLogout,
  onAdminLogout,
  onNavigate,
  onOpenStudentDashboard,
  onOpenAdminDashboard,
  onOpenTeacherLogin,
  activeSection
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header 
      id="main-navbar"
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-violet-100' 
          : 'bg-white border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div 
            id="navbar-brand-logo"
            onClick={() => handleNavClick('hero')} 
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/20 group-hover:scale-105 transition-transform duration-200">
              <span className="font-extrabold text-lg tracking-wider">ASI</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors">
                  Amerj Sir Institute
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                  Niwari
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                NEET &amp; JEE Biology CBT Platform
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav id="desktop-nav-links" className="hidden lg:flex items-center gap-7">
            <button
              id="nav-link-home"
              onClick={() => handleNavClick('hero')}
              className={`text-sm font-semibold transition-colors relative py-1 ${
                activeSection === 'hero' 
                  ? 'text-violet-600 font-bold' 
                  : 'text-slate-600 hover:text-violet-600'
              }`}
            >
              Home
              {activeSection === 'hero' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-link-tests"
              onClick={() => handleNavClick('tests-section')}
              className={`text-sm font-semibold transition-colors relative py-1 flex items-center gap-1.5 ${
                activeSection === 'tests-section' 
                  ? 'text-violet-600 font-bold' 
                  : 'text-slate-600 hover:text-violet-600'
              }`}
            >
              <BookOpen className="w-4 h-4 text-violet-600" />
              <span>CBT Tests</span>
              <span className="px-1.5 py-0.2 bg-violet-100 text-violet-800 text-[10px] font-bold rounded-full">
                Live
              </span>
              {activeSection === 'tests-section' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-link-features"
              onClick={() => handleNavClick('features-section')}
              className={`text-sm font-semibold transition-colors relative py-1 ${
                activeSection === 'features-section' 
                  ? 'text-violet-600 font-bold' 
                  : 'text-slate-600 hover:text-violet-600'
              }`}
            >
              Features
              {activeSection === 'features-section' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>

            <button
              id="nav-link-about"
              onClick={() => handleNavClick('about-section')}
              className={`text-sm font-semibold transition-colors relative py-1 ${
                activeSection === 'about-section' 
                  ? 'text-violet-600 font-bold' 
                  : 'text-slate-600 hover:text-violet-600'
              }`}
            >
              About Amerj Sir
              {activeSection === 'about-section' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* PWA Install Button */}
            <PwaInstallButton variant="navbar" />

            {/* Notification Bell Dropdown */}
            <NotificationCenter onNavigateToSection={handleNavClick} />

            {/* Admin Portal Direct Link / Status */}
            {adminUser && adminUser.isLoggedIn ? (
              <button
                id="navbar-admin-portal-active-btn"
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                title="Open Admin Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Panel</span>
              </button>
            ) : (
              <button
                id="navbar-faculty-login-btn"
                onClick={onOpenTeacherLogin}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Teacher / Admin Passkey Login"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                <span>Faculty</span>
              </button>
            )}

            {/* Student User Session */}
            {user && user.isLoggedIn ? (
              <div className="relative">
                <button
                  id="user-profile-button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors text-slate-800 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold leading-tight text-slate-900 truncate max-w-[100px]">{user.name}</p>
                    <p className="text-[10px] text-violet-700 font-semibold">{user.targetExam || 'NEET 2026'}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-violet-600" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-violet-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Student Account</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    {onOpenStudentDashboard && (
                      <button
                        id="navbar-go-to-student-dashboard-btn"
                        onClick={() => {
                          onOpenStudentDashboard();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-violet-700 hover:bg-violet-50 flex items-center gap-2 font-bold cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4 text-violet-600" />
                        <span>Student Dashboard</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleNavClick('tests-section');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-violet-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-violet-600" />
                      <span>Attempt Practice Tests</span>
                    </button>
                    <button
                      id="navbar-logout-btn"
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Student</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-violet-600 rounded-xl hover:bg-violet-50 transition-colors cursor-pointer"
                >
                  Student Login
                </button>
                <button
                  id="navbar-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:scale-98 rounded-xl shadow-sm shadow-violet-600/25 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu & Quick Actions Toggle Button */}
          <div className="flex sm:hidden items-center gap-1.5">
            <NotificationCenter onNavigateToSection={handleNavClick} />
            <PwaInstallButton variant="navbar" />
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-violet-600 hover:bg-violet-50 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-drawer-menu" className="sm:hidden bg-white border-b border-violet-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-violet-50 hover:text-violet-600"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('tests-section')}
              className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-violet-50 hover:text-violet-600 flex items-center justify-between"
            >
              <span>Available Tests</span>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-bold rounded-full">
                Live Tests
              </span>
            </button>
            <button
              onClick={() => handleNavClick('features-section')}
              className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-violet-50 hover:text-violet-600"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('about-section')}
              className="text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 hover:bg-violet-50 hover:text-violet-600"
            >
              About Amerj Sir
            </button>
          </div>

          {/* Role Portals & Authentication in Mobile */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user && user.isLoggedIn ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-violet-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-violet-700 font-medium">Student • {user.email}</p>
                </div>
                {onOpenStudentDashboard && (
                  <button
                    onClick={() => {
                      onOpenStudentDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-white bg-violet-600 rounded-xl shadow-xs"
                  >
                    Open Student Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-rose-600 bg-rose-50 rounded-xl"
                >
                  Log Out Student
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 text-center text-xs font-bold text-white bg-violet-600 rounded-xl shadow-md shadow-violet-600/20"
                >
                  Sign Up Free
                </button>
              </div>
            )}

            {/* Faculty Admin Link */}
            <div className="pt-2 border-t border-slate-100">
              {adminUser && adminUser.isLoggedIn ? (
                <button
                  onClick={() => {
                    if (onOpenAdminDashboard) onOpenAdminDashboard();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Admin Panel</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onOpenTeacherLogin) onOpenTeacherLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                  <span>Teacher / Faculty Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
