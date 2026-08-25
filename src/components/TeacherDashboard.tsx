import React, { useState, useEffect } from 'react';
import { 
  School, 
  Plus, 
  LogOut, 
  Sparkles, 
  BookOpen, 
  Users, 
  BarChart3, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Home, 
  Layers, 
  X, 
  Edit3, 
  Trash2, 
  Eye,
  AlertCircle,
  FileUp,
  Upload,
  BrainCircuit,
  Braces
} from 'lucide-react';
import { UserProfile, TestItem, TestCategory, Difficulty } from '../types';
import { CustomTestBuilder } from './CustomTestBuilder';
import { GeminiCustomTestBox } from './GeminiCustomTestBox';
import { TeacherAiTools } from './TeacherAiTools';

interface TeacherDashboardProps {
  user: UserProfile;
  tests: TestItem[];
  onLogout: () => void;
  onGoHome: () => void;
  onPreviewTest: (test: TestItem) => void;
  onUpdateTests?: (updatedTests: TestItem[]) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  tests,
  onLogout,
  onGoHome,
  onPreviewTest,
  onUpdateTests
}) => {
  const [createdTests, setCreatedTests] = useState<TestItem[]>(() => {
    // Merge provided tests with any saved tests from localStorage
    try {
      const saved = localStorage.getItem('asi_custom_tests');
      if (saved) {
        const parsed: TestItem[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(t => t.id));
        const merged = [...parsed, ...tests.filter(t => !existingIds.has(t.id))];
        return merged;
      }
    } catch (e) {
      console.warn('Error loading custom tests:', e);
    }
    return tests;
  });

  const [isBuildingCustomTest, setIsBuildingCustomTest] = useState(false);
  const [customBuilderTab, setCustomBuilderTab] = useState<'editor' | 'json' | 'gemini' | 'extractor'>('editor');
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [facultyActiveView, setFacultyActiveView] = useState<'tests' | 'ai_tools'>('tests');

  const handleOpenCustomBuilder = (testToEdit: TestItem | null = null, tab: 'editor' | 'json' | 'gemini' | 'extractor' = 'editor') => {
    setEditingTest(testToEdit);
    setCustomBuilderTab(tab);
    setIsBuildingCustomTest(true);
  };

  const handleGeminiTestGenerated = (newTest: TestItem) => {
    const updated = [newTest, ...createdTests.filter(t => t.id !== newTest.id)];
    setCreatedTests(updated);
    if (onUpdateTests) {
      onUpdateTests(updated);
    }
    setGeminiModalOpen(false);
    setSuccessNotice(`Gemini AI Test "${newTest.title}" published with ${newTest.totalQuestions} questions!`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleTestPublished = (newTest: TestItem) => {
    const updated = [newTest, ...createdTests.filter(t => t.id !== newTest.id)];
    setCreatedTests(updated);
    if (onUpdateTests) {
      onUpdateTests(updated);
    }
    setIsBuildingCustomTest(false);
    setEditingTest(null);
    setSuccessNotice(`Test "${newTest.title}" saved and published successfully!`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleDeleteTest = (testId: string, testTitle: string) => {
    if (confirm(`Are you sure you want to remove "${testTitle}"?`)) {
      const updated = createdTests.filter(t => t.id !== testId);
      setCreatedTests(updated);
      try {
        const saved = JSON.parse(localStorage.getItem('asi_custom_tests') || '[]');
        const filteredSaved = saved.filter((t: TestItem) => t.id !== testId);
        localStorage.setItem('asi_custom_tests', JSON.stringify(filteredSaved));
      } catch (e) {
        console.warn(e);
      }
      if (onUpdateTests) {
        onUpdateTests(updated);
      }
      setSuccessNotice(`Removed "${testTitle}".`);
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  // If in custom test creator mode, show CustomTestBuilder
  if (isBuildingCustomTest) {
    return (
      <CustomTestBuilder
        existingTest={editingTest}
        initialTab={customBuilderTab}
        onBack={() => {
          setIsBuildingCustomTest(false);
          setEditingTest(null);
        }}
        onTestCreated={handleTestPublished}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Faculty Portal Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-violet-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-700 to-purple-800 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-violet-700/20">
                ASI
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                    Amerj Sir Institute
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    Faculty Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Educator &amp; Test Management System</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                id="teacher-view-home-btn"
                onClick={onGoHome}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>View Full Website</span>
              </button>

              <button
                id="teacher-create-test-btn-header"
                onClick={() => handleOpenCustomBuilder(null)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm shadow-violet-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test</span>
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200">
                <div className="w-7 h-7 rounded-lg bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-violet-700 font-semibold">{user.department || 'Faculty'}</p>
                </div>
              </div>

              <button
                id="teacher-dashboard-logout-btn"
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Success Banner */}
        {successNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-sm font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Welcome Faculty Banner */}
        <section 
          id="teacher-welcome-banner"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-xs font-bold backdrop-blur-xs">
                <School className="w-3.5 h-3.5 text-violet-300" />
                <span>Faculty Administration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {user.name}!
              </h1>
              <p className="text-violet-200 text-xs sm:text-sm max-w-xl">
                Manage your NEET &amp; JEE Biology tests, publish new chapter mocks, and monitor student test performance live.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="teacher-toggle-ai-tools-btn"
                onClick={() => setFacultyActiveView(facultyActiveView === 'ai_tools' ? 'tests' : 'ai_tools')}
                className={`px-5 py-3 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0 ${
                  facultyActiveView === 'ai_tools'
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BrainCircuit className="w-4 h-4 text-violet-700" />
                <span>{facultyActiveView === 'ai_tools' ? '📋 Back to Test Library' : '🤖 Open AI Tools Studio'}</span>
              </button>

              <button
                id="teacher-create-test-hero-btn"
                onClick={() => handleOpenCustomBuilder(null)}
                className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 shrink-0"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Custom Test Builder</span>
              </button>

              <button
                id="teacher-json-import-hero-btn"
                onClick={() => handleOpenCustomBuilder(null, 'json')}
                className="px-4 py-3 bg-violet-700/80 hover:bg-violet-700 text-white font-bold text-sm rounded-xl border border-violet-500/50 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Braces className="w-4 h-4 text-violet-200" />
                <span>Import JSON (File / Text)</span>
              </button>

              <button
                id="teacher-pdf-extract-hero-btn"
                onClick={() => handleOpenCustomBuilder(null, 'extractor')}
                className="px-4 py-3 bg-violet-700/70 hover:bg-violet-700 text-white font-bold text-sm rounded-xl border border-violet-500/50 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <FileUp className="w-4 h-4 text-violet-200" />
                <span>Auto-Extract from PDF</span>
              </button>
            </div>
          </div>

          {/* Key Faculty Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
            <div className="bg-white/5 p-3 rounded-xl">
              <span className="text-xs text-violet-200">Published Tests</span>
              <p className="text-xl sm:text-2xl font-bold text-white">{createdTests.length}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl">
              <span className="text-xs text-violet-200">Total Attempts</span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-300">15,480+</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl">
              <span className="text-xs text-violet-200">Active Students</span>
              <p className="text-xl sm:text-2xl font-bold text-amber-300">1,240</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl">
              <span className="text-xs text-violet-200">Avg. Batch Accuracy</span>
              <p className="text-xl sm:text-2xl font-bold text-sky-300">84.6%</p>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setFacultyActiveView('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              facultyActiveView === 'tests'
                ? 'bg-white text-violet-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-violet-600" />
            <span>Test Management &amp; Mock Library ({createdTests.length})</span>
          </button>

          <button
            id="tab-btn-ai-tools"
            onClick={() => setFacultyActiveView('ai_tools')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              facultyActiveView === 'ai_tools'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-300" />
            <span>🤖 AI Question &amp; Paper Setter Studio</span>
          </button>
        </div>

        {/* Dynamic View: AI Tools Studio vs Tests Management */}
        {facultyActiveView === 'ai_tools' ? (
          <TeacherAiTools
            onPublishTest={handleTestPublished}
            existingTests={createdTests}
          />
        ) : (
          /* 2. Manage Tests Section */
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-violet-600" />
                  <span>Test Management &amp; Mock Library ({createdTests.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Active tests available for students to attempt in the portal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCustomBuilder(null)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 self-start cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Custom Test Builder</span>
                </button>
              </div>
            </div>

            {/* Test Table List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Test Title &amp; Category</th>
                      <th className="px-6 py-4">Questions / Duration</th>
                      <th className="px-6 py-4">Difficulty</th>
                      <th className="px-6 py-4">Attempts</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {createdTests.map((test) => (
                      <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{test.title}</span>
                            {test.isNew && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-violet-700 font-semibold">{test.category}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">{test.totalQuestions || test.questions.length} Qs</span> • {test.durationMinutes} mins ({test.totalMarks} marks)
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            test.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : test.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {test.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">{test.attemptsCount.toLocaleString()}</span> attempts
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenCustomBuilder(test)}
                              className="p-2 text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Questions in Custom Test Builder"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onPreviewTest(test)}
                              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                              title="Preview Test Simulator"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test.id, test.title)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Test"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Gemini AI Custom Test Creator Modal */}
      {geminiModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-300" />
                <h3 className="text-base font-bold">🤖 Gemini AI - Custom Test Creator</h3>
              </div>
              <button
                onClick={() => setGeminiModalOpen(false)}
                className="p-1 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <GeminiCustomTestBox
                onTestGenerated={(test) => {
                  handleGeminiTestGenerated(test);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clean Dashboard Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Amerj Sir Institute (ASI) • Faculty Assessment System</p>
      </footer>

    </div>
  );
};
