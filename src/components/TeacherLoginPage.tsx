import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  School,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';

interface TeacherLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onGoHome: () => void;
}

export const TeacherLoginPage: React.FC<TeacherLoginPageProps> = ({
  onLoginSuccess,
  onGoHome
}) => {
  const [email, setEmail] = useState('amerj.sir@asi-institute.edu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password.trim()) {
      setErrorMsg('Kripya Teacher Access Password daalein.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try secure server endpoint
      const res = await fetch('/api/teacher-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMsg('Authentication Safal! Faculty portal khul raha hai...');
        // Save verified token in storage
        localStorage.setItem('asi_teacher_token', data.user.token || 'ASI_VERIFIED_TEACHER');
        localStorage.setItem('asi_auth_role', 'teacher');
        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 600);
        return;
      }

      // If server returned 401
      if (res.status === 401) {
        throw new Error(data.error || 'Galat password! Access denied.');
      }

      // 2. Fallback client-side verification for static GitHub Pages hosting
      const expectedEnvPass = (import.meta as any).env?.VITE_TEACHER_PASSWORD || 'ASI@2025';
      if (password.trim() === expectedEnvPass.trim()) {
        const teacherProfile: UserProfile = {
          name: 'Amerj Sir',
          email: email.trim() || 'amerj.sir@asi-institute.edu',
          role: 'teacher',
          department: 'Head of NEET & JEE Biology',
          isLoggedIn: true
        };
        setSuccessMsg('Authentication Safal! Faculty portal khul raha hai...');
        localStorage.setItem('asi_teacher_token', 'ASI_VERIFIED_TEACHER_' + Date.now());
        localStorage.setItem('asi_auth_role', 'teacher');
        setTimeout(() => {
          onLoginSuccess(teacherProfile);
        }, 600);
        return;
      } else {
        throw new Error('Galat Password! Only authorized faculty members can login.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Check password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-violet-600 selection:text-white">
      
      {/* Top Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl w-full mx-auto">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Portal</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-extrabold text-xs text-white">
            ASI
          </div>
          <span className="font-bold text-sm text-white hidden sm:inline">Amerj Sir Institute</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          
          {/* Badge & Lock Icon */}
          <div className="text-center space-y-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-violet-600/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-extrabold border border-violet-500/20">
              <School className="w-3.5 h-3.5" />
              <span>Restricted Faculty Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Teacher Secure Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your faculty credentials to manage NEET/JEE tests, review AI generated questions, and publish exam papers.
            </p>
          </div>

          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            
            {/* Faculty Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Faculty Email ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amerj.sir@asi-institute.edu"
                  className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Teacher Access Password
                </label>
                <span className="text-[10px] text-slate-500">Authorized Personnel Only</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter teacher password"
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="teacher-login-submit-btn"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-200" />
                  <span>Verifying Faculty Credentials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>Unlock Faculty Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <p className="text-[11px] text-slate-500">
              Students attempting to access faculty routes are automatically redirected to the student portal.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Amerj Sir Institute (ASI) • Faculty Assessment &amp; CBT Portal</p>
      </footer>

    </div>
  );
};
