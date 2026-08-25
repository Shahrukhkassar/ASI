import React from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckCircle, 
  Sparkles, 
  Quote, 
  HeartHandshake,
  Star
} from 'lucide-react';
import { INSTITUTE_INFO } from '../data/mockTests';

export const AboutSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Dr. Ananya Sharma (NEET AIR 248)',
      score: '355/360 in Biology',
      college: 'AIIMS New Delhi',
      comment: 'Amerj Sir\'s mock tests and NCERT line-by-line question series were identical to the actual NEET paper. The instant solutions saved hours of revision.'
    },
    {
      name: 'Rohan Verma (NEET AIR 612)',
      score: '350/360 in Biology',
      college: 'MAMC New Delhi',
      comment: 'The timer-based interface removed all my exam hall panic. Genetics and Plant Physiology question sets are the best in the country.'
    }
  ];

  return (
    <section id="about-section" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200 mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>About The Institute &amp; Faculty</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Guiding NEET &amp; JEE Aspirants to Medical Excellence
          </h2>
          <p className="text-slate-600 mt-3 text-base sm:text-lg">
            Amerj Sir Institute (ASI) is dedicated to delivering high-yield Biology preparation through scientific testing, conceptual clarity, and meticulous NCERT analysis.
          </p>
        </div>

        {/* Mentor Spotlight & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          
          {/* Left Avatar / Bio visual */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-700 p-1.5 shadow-xl shadow-violet-600/20">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex flex-col items-center justify-center text-white p-4">
                  <GraduationCap className="w-12 h-12 text-violet-300 mb-1" />
                  <span className="text-lg font-extrabold tracking-wide">Amerj Sir</span>
                  <span className="text-[11px] text-violet-200 font-medium">Head of Biology</span>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-2 bg-amber-400 text-amber-950 font-extrabold text-xs px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>12+ Yrs Exp</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mt-6">Amerj Sir</h3>
            <p className="text-violet-600 font-semibold text-sm">Senior NEET Biology Master Educator</p>
            <p className="text-slate-500 text-xs mt-2 max-w-xs">
              Mentored 500+ students into AIIMS, JIPMER, MAMC, and top Government Medical Colleges across India.
            </p>
          </div>

          {/* Right Mentorship Values & Methodology */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-slate-900">
                Our 3-Pillar Teaching &amp; Testing Methodology
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                At ASI, we believe that Biology isn&apos;t about rote memorization—it is about deep structural understanding and rapid, error-free recall under exam pressure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100">
                <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                  01
                </div>
                <h5 className="text-xs font-bold text-slate-900">100% NCERT Pure</h5>
                <p className="text-[11px] text-slate-600 mt-1">Every line, diagram, summary point, and table converted into active recall questions.</p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                  02
                </div>
                <h5 className="text-xs font-bold text-slate-900">NTA CBT Simulator</h5>
                <p className="text-[11px] text-slate-600 mt-1">Timed interface matching Section A &amp; B exact pattern to eliminate exam hall stress.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-2">
                  03
                </div>
                <h5 className="text-xs font-bold text-slate-900">Instant Diagnosis</h5>
                <p className="text-[11px] text-slate-600 mt-1">Immediate post-test accuracy metrics, negative mark reduction, and step solutions.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Testimonials */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <Quote className="w-8 h-8 text-violet-200 absolute top-4 right-4" />
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 text-sm italic leading-relaxed mb-4">
                &ldquo;{t.comment}&rdquo;
              </p>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <p className="text-xs font-semibold text-violet-600">{t.score} • {t.college}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
