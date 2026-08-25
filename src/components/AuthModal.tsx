import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, CheckCircle2, ArrowRight, GraduationCap, School } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLoginSuccess
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }
    }

    const newUser: UserProfile = {
      name: name.trim() || (role === 'teacher' ? 'Prof. Amerj' : 'Student Candidate'),
      email: email.trim() || (role === 'teacher' ? 'teacher@asi-institute.edu' : 'student@neetprep.in'),
      role: role,
      targetExam: role === 'student' ? 'NEET 2026' : undefined,
      department: role === 'teacher' ? 'Biology & NEET Coaching' : undefined,
      isLoggedIn: true
    };
    onLoginSuccess(newUser);
    onClose();
  };

  const handleGoogleAuth = () => {
    const googleUser: UserProfile = {
      name: role === 'teacher' ? 'Dr. Amerj (Google)' : 'Student User (Google)',
      email: role === 'teacher' ? 'educator.google@asi.in' : 'student.google@gmail.com',
      role: role,
      targetExam: role === 'student' ? 'NEET 2026' : undefined,
      department: role === 'teacher' ? 'NEET Master Faculty' : undefined,
      isLoggedIn: true
    };
    onLoginSuccess(googleUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-extrabold text-sm shadow-inner">
              ASI
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {mode === 'login' ? 'Sign In to Portal' : 'Create an Account'}
              </h3>
              <p className="text-xs text-violet-200">Amerj Sir Institute • NEET Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 mx-6 mt-5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-white text-violet-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Role selector (Mandatory for Signup and also available for Login) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'student'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${role === 'student' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  role === 'teacher'
                    ? 'border-violet-600 bg-violet-50 text-violet-900 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-slate-50'
                }`}
              >
                <School className={`w-4 h-4 ${role === 'teacher' ? 'text-violet-600' : 'text-slate-400'}`} />
                <span>Teacher / Faculty</span>
              </button>
            </div>
          </div>

          {/* Full Name for Signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'teacher' ? 'e.g. Dr. Amerj Sir' : 'e.g. Priya Sharma'}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'teacher' ? 'faculty@asi-institute.edu' : 'student@neetprep.in'}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>

          {/* Confirm Password for Signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{mode === 'login' ? `Log In as ${role === 'student' ? 'Student' : 'Teacher'}` : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            id="google-auth-btn"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === 'login' ? 'Login with Google' : 'Sign Up with Google'}</span>
          </button>

          <div className="pt-2 text-center">
            <a
              href="#/teacher-login"
              onClick={onClose}
              className="text-xs text-violet-700 hover:text-violet-900 font-semibold hover:underline"
            >
              Faculty / Teacher? Access Dedicated Teacher Login →
            </a>
          </div>

        </form>

      </div>
    </div>
  );
};
