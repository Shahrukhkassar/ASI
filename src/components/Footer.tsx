import React from 'react';
import { 
  Dna, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Sparkles, 
  Shield, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { INSTITUTE_INFO } from '../data/mockTests';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenAuth
}) => {
  return (
    <footer id="main-footer" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Institute Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-violet-600/30">
                ASI
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">Amerj Sir Institute</span>
                <p className="text-xs text-violet-400 font-medium">NEET &amp; JEE Biology Online Platform</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              India&apos;s specialized online testing &amp; mentorship ecosystem for NEET and JEE Biology. Curated by Amerj Sir with 100% NCERT line-by-line fidelity.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>NTA CBT Pattern</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>15,000+ Students</span>
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links (2.5 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Online Test Series
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button 
                  onClick={() => onNavigate('tests-section')} 
                  className="hover:text-violet-300 transition-colors text-left"
                >
                  NEET Full Syllabus Mock Tests
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('tests-section')} 
                  className="hover:text-violet-300 transition-colors text-left"
                >
                  Class 11th Biology Chapter Tests
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('tests-section')} 
                  className="hover:text-violet-300 transition-colors text-left"
                >
                  Class 12th Biology Chapter Tests
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('tests-section')} 
                  className="hover:text-violet-300 transition-colors text-left"
                >
                  High-Yield Genetics &amp; Physiology
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('tests-section')} 
                  className="hover:text-violet-300 transition-colors text-left"
                >
                  JEE / IAT Biology Diagnostics
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Resources (2.5 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button 
                  onClick={() => onNavigate('hero')} 
                  className="hover:text-violet-300 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('features-section')} 
                  className="hover:text-violet-300 transition-colors"
                >
                  Key Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('about-section')} 
                  className="hover:text-violet-300 transition-colors"
                >
                  About Amerj Sir
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenAuth('login')} 
                  className="hover:text-violet-300 transition-colors"
                >
                  Student Login
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenAuth('signup')} 
                  className="hover:text-violet-300 transition-colors"
                >
                  Sign Up Free
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Helpdesk (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Student Helpdesk
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>{INSTITUTE_INFO.contact.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                <a href={`mailto:${INSTITUTE_INFO.contact.email}`} className="hover:text-violet-300 transition-colors">
                  {INSTITUTE_INFO.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{INSTITUTE_INFO.contact.phone} (10 AM - 7 PM)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {INSTITUTE_INFO.name} ({INSTITUTE_INFO.shortName}). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Honor Code</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
