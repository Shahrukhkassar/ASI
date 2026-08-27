import React from 'react';
import { X, CheckCircle2, Timer, Award, AlertTriangle, ArrowRight, Dna } from 'lucide-react';
import { TestItem } from '../types';

interface TestDetailsModalProps {
  test: TestItem | null;
  onClose: () => void;
  onStartTest: (test: TestItem) => void;
}

export const TestDetailsModal: React.FC<TestDetailsModalProps> = ({
  test,
  onClose,
  onStartTest
}) => {
  if (!test) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Dna className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <span className="text-xs text-violet-200 font-bold uppercase tracking-wider">Test Overview</span>
              <h3 className="text-lg font-bold text-white leading-tight">{test.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-violet-50/70 p-4 rounded-2xl border border-violet-100 text-center">
            <div>
              <span className="text-xs text-slate-500 font-medium">Questions</span>
              <p className="text-base font-bold text-slate-900">{test.totalQuestions} Qs</p>
            </div>
            <div className="border-x border-violet-200">
              <span className="text-xs text-slate-500 font-medium">Duration</span>
              <p className="text-base font-bold text-slate-900">{test.durationMinutes} Minutes</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Total Marks</span>
              <p className="text-base font-bold text-violet-700">{test.totalMarks} Marks</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed">{test.description}</p>
          </div>

          {/* Syllabus Covered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Chapters &amp; Syllabus Covered</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {test.syllabus.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/70">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Instructions & Marking Scheme */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1.5 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              <span>NTA Marking Scheme &amp; Instructions</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              <li><strong>+4 Marks</strong> awarded for every correct answer.</li>
              <li><strong>-1 Mark</strong> deducted for every incorrect response (Negative marking).</li>
              <li><strong>0 Marks</strong> for unattempted questions.</li>
              <li>The test timer will run automatically once you click &quot;Start Test Now&quot;.</li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            id="modal-start-test-btn"
            onClick={() => {
              onClose();
              onStartTest(test);
            }}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-violet-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Start Test Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default TestDetailsModal;
