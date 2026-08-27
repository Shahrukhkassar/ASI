import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { UserProfile } from '../types';
import { ShieldAlert, RefreshCw, Lock } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin' | 'any';
  currentUser?: UserProfile | null;
  onUnauthorized?: (returnTo: string) => void;
  fallbackRedirect?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'any',
  currentUser = null,
  onUnauthorized,
  fallbackRedirect = '/login'
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        // 1. Check passed user prop or local stored sessions first
        if (currentUser && currentUser.isLoggedIn) {
          if (isMounted) {
            setUserRole(currentUser.role || 'student');
            setIsAuthenticated(true);
            setIsChecking(false);
          }
          return;
        }

        // 2. Check localStorage session tokens
        const studentSessionStr = localStorage.getItem('asi_student_session');
        const adminSessionStr = localStorage.getItem('asi_admin_session');
        const adminToken = localStorage.getItem('asi_admin_token') || localStorage.getItem('asi_teacher_token');

        if (requiredRole === 'admin') {
          if (adminSessionStr && adminToken) {
            try {
              const parsedAdmin = JSON.parse(adminSessionStr);
              if (parsedAdmin.role === 'admin' || parsedAdmin.role === 'teacher') {
                if (isMounted) {
                  setUserRole('admin');
                  setIsAuthenticated(true);
                  setIsChecking(false);
                }
                return;
              }
            } catch {
              // ignore
            }
          }
        } else if (studentSessionStr) {
          try {
            const parsedStudent = JSON.parse(studentSessionStr);
            if (parsedStudent.email && (parsedStudent.isLoggedIn !== false)) {
              if (isMounted) {
                setUserRole(parsedStudent.role || 'student');
                setIsAuthenticated(true);
                setIsChecking(false);
              }
              return;
            }
          } catch {
            // ignore
          }
        }

        // 3. Check Supabase Auth Session
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (!error && session && session.user) {
            const role = session.user.user_metadata?.role || 
              (session.user.email?.includes('admin') || session.user.email?.includes('teacher') ? 'admin' : 'student');

            // Token refresh check
            const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
            if (expiresAt && expiresAt < Date.now()) {
              // Token expired, attempt refresh
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !refreshData.session) {
                // Expired and could not refresh -> auto-logout
                localStorage.removeItem('asi_student_session');
                localStorage.removeItem('asi_admin_session');
                if (isMounted) {
                  setIsAuthenticated(false);
                  setIsChecking(false);
                }
                return;
              }
            }

            if (isMounted) {
              setUserRole(role);
              setIsAuthenticated(true);
              setIsChecking(false);
            }
            return;
          }
        }

        // No active session found
        if (isMounted) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      } catch (err) {
        console.warn('ProtectedRoute auth verification error:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      }
    }

    checkAuthSession();

    // Listen to Supabase auth state changes for real-time logout/login
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          setUserRole(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const role = session.user.user_metadata?.role || 'student';
          setUserRole(role);
          setIsAuthenticated(true);
        }
      });
      authListener = data;
    }

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [currentUser, requiredRole]);

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-white">Verifying Secure Session...</p>
          <p className="text-xs text-slate-400">Checking credentials &amp; permissions</p>
        </div>
      </div>
    );
  }

  // Not authenticated or role mismatch
  const roleAuthorized =
    isAuthenticated &&
    (requiredRole === 'any' ||
      (requiredRole === 'admin' && (userRole === 'admin' || userRole === 'teacher')) ||
      (requiredRole === 'student' && (userRole === 'student' || userRole === 'admin')));

  if (!isAuthenticated || !roleAuthorized) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '/';

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center mx-auto">
            {requiredRole === 'admin' ? <ShieldAlert className="w-7 h-7 text-rose-400" /> : <Lock className="w-7 h-7 text-violet-400" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              {requiredRole === 'admin' ? 'Faculty Authorization Required' : 'Authentication Required'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {requiredRole === 'admin'
                ? 'Only verified Amerj Sir Institute faculty members can access test creation and student performance analytics.'
                : 'Please log in to your student account to access this section and view your test progress.'}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                if (onUnauthorized) {
                  onUnauthorized(currentPath);
                } else if (typeof window !== 'undefined') {
                  if (requiredRole === 'admin') {
                    window.location.hash = '#admin';
                  } else {
                    window.location.hash = '#';
                  }
                }
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              {requiredRole === 'admin' ? 'Open Faculty Login' : 'Log In Now'}
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.hash = '#';
                }
              }}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              &larr; Return to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
