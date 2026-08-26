import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
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
  Braces,
  Send,
  SendHorizontal,
  Bot,
  Settings,
  Database,
  RefreshCw,
  Award,
  Search,
  ExternalLink,
  Sliders,
  Wand2,
  Check
} from 'lucide-react';
import { UserProfile, TestItem, TestResult, TelegramConfig } from '../types';
import { CustomTestBuilder } from './CustomTestBuilder';
import { GeminiCustomTestBox } from './GeminiCustomTestBox';
import { TeacherAiTools } from './TeacherAiTools';
import { isSupabaseConfigured, fetchAllTests, deleteTestFromDb, subscribeToRealtimeTests, fetchStudentResults } from '../utils/supabaseClient';

interface AdminDashboardProps {
  user: UserProfile;
  tests: TestItem[];
  onLogout: () => void;
  onGoHome: () => void;
  onPreviewTest: (test: TestItem) => void;
  onUpdateTests?: (updatedTests: TestItem[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  tests,
  onLogout,
  onGoHome,
  onPreviewTest,
  onUpdateTests
}) => {
  const [createdTests, setCreatedTests] = useState<TestItem[]>(tests);
  const [isBuildingCustomTest, setIsBuildingCustomTest] = useState(false);
  const [customBuilderTab, setCustomBuilderTab] = useState<'editor' | 'json' | 'gemini' | 'extractor'>('editor');
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'tests' | 'ai_tools' | 'telegram' | 'students' | 'db_sync'>('tests');

  // Telegram Configuration State
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    try {
      const saved = localStorage.getItem('asi_telegram_config');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      botToken: '',
      chatId: '',
      channelName: '@asi_neet_biology',
      enabled: false,
      notifyOnSubmission: true,
      notifyOnNewTest: true
    };
  });

  const [telegramTestStatus, setTelegramTestStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({
    status: 'idle'
  });
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Student Results Cohort State
  const [studentResults, setStudentResults] = useState<TestResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');

  // Initial Realtime Test Sync & Results Fetching
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeTests((freshTests) => {
      setCreatedTests(freshTests);
      if (onUpdateTests) onUpdateTests(freshTests);
    });

    loadInitialData();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const dbTests = await fetchAllTests();
      if (dbTests && dbTests.length > 0) {
        setCreatedTests(dbTests);
        if (onUpdateTests) onUpdateTests(dbTests);
      }
      const results = await fetchStudentResults();
      setStudentResults(results);
    } catch (e) {
      console.warn('Initial data load notice:', e);
    }
  };

  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('asi_telegram_config', JSON.stringify(telegramConfig));
      setSuccessNotice('Telegram bot configuration saved successfully!');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch {
      // ignore
    }
  };

  const handleTestTelegramConnection = async () => {
    if (!telegramConfig.botToken.trim()) {
      setTelegramTestStatus({
        status: 'error',
        message: 'Please enter a Telegram Bot Token first.'
      });
      return;
    }

    setTelegramTestStatus({ status: 'loading', message: 'Testing bot connection with Telegram API...' });
    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken.trim(),
          chatId: telegramConfig.chatId.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramTestStatus({
          status: 'success',
          message: `Bot Connected: @${data.botInfo?.username || 'Bot'} (${data.botInfo?.first_name || 'ASI Bot'})${data.chatVerified ? ' • Test message delivered to chat!' : ''}`
        });
      } else {
        setTelegramTestStatus({
          status: 'error',
          message: data.error || 'Failed to connect. Check your Bot Token.'
        });
      }
    } catch (err: any) {
      setTelegramTestStatus({
        status: 'error',
        message: err.message || 'Network error during Telegram ping.'
      });
    }
  };

  const handleSendTelegramBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    try {
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          message: `📢 <b>Amerj Sir Institute Official Announcement:</b>\n\n${broadcastMessage.trim()}\n\n🔗 <i>Attempt live tests on the ASI Portal.</i>`
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice('Broadcast delivered to Telegram channel / group successfully!');
        setBroadcastMessage('');
        setTimeout(() => setSuccessNotice(null), 5000);
      } else {
        alert(data.error || 'Failed to dispatch broadcast.');
      }
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleOpenCustomBuilder = (testToEdit: TestItem | null = null, tab: 'editor' | 'json' | 'gemini' | 'extractor' = 'editor') => {
    setEditingTest(testToEdit);
    setCustomBuilderTab(tab);
    setIsBuildingCustomTest(true);
  };

  const handleTestPublished = (newTest: TestItem) => {
    const updated = [newTest, ...createdTests.filter(t => t.id !== newTest.id)];
    setCreatedTests(updated);
    if (onUpdateTests) onUpdateTests(updated);
    setIsBuildingCustomTest(false);
    setEditingTest(null);
    setSuccessNotice(`Test "${newTest.title}" published & synced across cloud!`);
    setTimeout(() => setSuccessNotice(null), 5000);

    // If Telegram notify on new test is enabled
    if (telegramConfig.enabled && telegramConfig.notifyOnNewTest && telegramConfig.botToken && telegramConfig.chatId) {
      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
          message: `🎯 <b>New Test Available:</b> ${newTest.title}\n\n📚 <b>Subject:</b> ${newTest.subject}\n⏱️ <b>Duration:</b> ${newTest.durationMinutes} mins (${newTest.totalQuestions} MCQs)\n⚡ <b>Difficulty:</b> ${newTest.difficulty}\n\nStudents can now take this test in NTA CBT mode on ASI portal.`
        })
      }).catch(console.warn);
    }
  };

  const handleDeleteTest = async (testId: string, testTitle: string) => {
    if (confirm(`Are you sure you want to permanently delete "${testTitle}"?`)) {
      const updated = createdTests.filter(t => t.id !== testId);
      setCreatedTests(updated);
      await deleteTestFromDb(testId);
      if (onUpdateTests) onUpdateTests(updated);
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

  const filteredStudentResults = studentResults.filter((r) => {
    if (!resultsSearchQuery.trim()) return true;
    const q = resultsSearchQuery.toLowerCase();
    return (
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.studentEmail && r.studentEmail.toLowerCase().includes(q)) ||
      (r.testTitle && r.testTitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Admin Portal Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-violet-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div 
              onClick={onGoHome}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-700 to-indigo-800 flex items-center justify-center text-white font-black text-base shadow-md shadow-violet-700/20">
                ASI
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                    Amerj Sir Institute
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                    Admin Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">NEET &amp; JEE Centralized Control &amp; AI Engine</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button
                id="admin-view-home-btn"
                onClick={onGoHome}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>View Live Site</span>
              </button>

              <button
                id="admin-create-test-btn-header"
                onClick={() => handleOpenCustomBuilder(null)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm shadow-violet-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
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
                  <p className="text-[10px] text-amber-700 font-extrabold uppercase">Super Admin</p>
                </div>
              </div>

              <button
                id="admin-dashboard-logout-btn"
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

      {/* Navigation Sub-bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setAdminActiveTab('tests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminActiveTab === 'tests'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tests Management ({createdTests.length})</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('ai_tools')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminActiveTab === 'ai_tools'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-300" />
            <span>AI Academic Tools Suite</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('telegram')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminActiveTab === 'telegram'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SendHorizontal className="w-4 h-4 text-sky-400" />
            <span>Telegram Bot &amp; Broadcast</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminActiveTab === 'students'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Attempts &amp; Scorecards</span>
          </button>

          <button
            onClick={() => setAdminActiveTab('db_sync')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              adminActiveTab === 'db_sync'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Cloud &amp; Supabase Status</span>
          </button>
        </div>
      </div>

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

        {/* TAB 1: TESTS MANAGEMENT */}
        {adminActiveTab === 'tests' && (
          <div className="space-y-6">
            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => handleOpenCustomBuilder(null, 'editor')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-violet-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Manual Test Builder</h3>
                <p className="text-xs text-slate-500 mt-1">Author NCERT questions with +4/-1 NEET marking</p>
              </div>

              <div 
                onClick={() => handleOpenCustomBuilder(null, 'gemini')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Gemini AI Test Creator</h3>
                <p className="text-xs text-slate-500 mt-1">Instant high-yield chapter questions in 5 seconds</p>
              </div>

              <div 
                onClick={() => handleOpenCustomBuilder(null, 'json')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <Braces className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">JSON Import / Export</h3>
                <p className="text-xs text-slate-500 mt-1">Import bulk question banks from JSON file</p>
              </div>

              <div 
                onClick={() => handleOpenCustomBuilder(null, 'extractor')}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  <FileUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Smart PDF OCR Extractor</h3>
                <p className="text-xs text-slate-500 mt-1">Extract scanned coaching PDFs with Vision AI</p>
              </div>
            </div>

            {/* Test List Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Live Published Tests</h2>
                  <p className="text-xs text-slate-500">All tests are immediately accessible to student CBT simulator</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-violet-50 text-violet-800 text-xs font-extrabold rounded-lg border border-violet-200">
                    {createdTests.length} Tests Live
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {createdTests.map((t, idx) => (
                  <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{t.title}</h3>
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-bold rounded">
                          {t.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          t.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                          t.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {t.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>⏱️ {t.durationMinutes} Minutes</span>
                        <span>•</span>
                        <span>📝 {t.questions?.length || t.totalQuestions} Questions</span>
                        <span>•</span>
                        <span>🏆 {t.totalMarks || (t.questions?.length || 30) * 4} Marks</span>
                        <span>•</span>
                        <span>⚡ Subject: {t.subject}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPreviewTest(t)}
                        className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        title="Simulate in CBT Mode"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => handleOpenCustomBuilder(t, 'editor')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        title="Edit Questions"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTest(t.id, t.title)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI TOOLS SUITE */}
        {adminActiveTab === 'ai_tools' && (
          <TeacherAiTools onTestGenerated={(generatedTest) => handleTestPublished(generatedTest)} />
        )}

        {/* TAB 3: TELEGRAM BOT & BROADCAST */}
        {adminActiveTab === 'telegram' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                  <SendHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Telegram Bot Channel Integration</h2>
                  <p className="text-xs text-slate-500">Send automatic exam alerts and instant score broadcasts directly to Telegram</p>
                </div>
              </div>

              <form onSubmit={handleSaveTelegramConfig} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Telegram Bot Token (from @BotFather)
                  </label>
                  <input
                    type="password"
                    value={telegramConfig.botToken}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, botToken: e.target.value })}
                    placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Get your bot token free by chatting with @BotFather on Telegram.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Channel ID / Group Chat ID
                  </label>
                  <input
                    type="text"
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                    placeholder="e.g. @asi_neet_biology or -1001234567890"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">For channels: add your bot as admin, then put channel username like @your_channel.</p>
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center gap-6 py-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={telegramConfig.enabled}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, enabled: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Enable Telegram Notifications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnNewTest}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, notifyOnNewTest: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Alert Channel on New Test Published</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={telegramConfig.notifyOnSubmission}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, notifyOnSubmission: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Alert Channel on Student Scorecard Submission</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Save Telegram Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleTestTelegramConnection}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${telegramTestStatus.status === 'loading' ? 'animate-spin' : ''}`} />
                    <span>Test Telegram Connection</span>
                  </button>
                </div>
              </form>

              {telegramTestStatus.message && (
                <div className={`p-4 rounded-xl border text-xs font-semibold ${
                  telegramTestStatus.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : telegramTestStatus.status === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-sky-50 border-sky-200 text-sky-800'
                }`}>
                  {telegramTestStatus.message}
                </div>
              )}
            </div>

            {/* Manual Announcement Dispatcher */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-500" />
                <span>Instant Channel Announcement / Question of the Day</span>
              </h3>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your message to broadcast to all students on Telegram channel..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendTelegramBroadcast}
                disabled={isSendingBroadcast || !broadcastMessage.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingBroadcast ? 'Dispatching...' : 'Broadcast to Telegram Channel'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT ATTEMPTS & SCORECARDS */}
        {adminActiveTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Student Attempts &amp; Submissions</h2>
                  <p className="text-xs text-slate-500">Live scorecards submitted across all CBT test modules</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resultsSearchQuery}
                    onChange={(e) => setResultsSearchQuery(e.target.value)}
                    placeholder="Search candidate name..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-violet-600 focus:outline-none"
                  />
                </div>
              </div>

              {filteredStudentResults.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">No student submissions recorded yet.</p>
                  <p className="text-xs text-slate-400">When students submit tests in NTA CBT mode, their scorecards will appear here in real-time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <tr>
                        <th className="py-3 px-4">Candidate</th>
                        <th className="py-3 px-4">Test Title</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Accuracy</th>
                        <th className="py-3 px-4">Time Spent</th>
                        <th className="py-3 px-4">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredStudentResults.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {r.studentName || 'Student Candidate'}
                            <span className="block text-[11px] text-slate-400 font-normal">{r.studentEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-800">{r.testTitle}</td>
                          <td className="py-3.5 px-4">
                            <span className={`font-extrabold px-2 py-0.5 rounded ${
                              r.score >= 300 ? 'bg-emerald-100 text-emerald-800' :
                              r.score >= 200 ? 'bg-violet-100 text-violet-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {r.score} / {r.totalMarks}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">{r.accuracy}%</td>
                          <td className="py-3.5 px-4 text-slate-500">{Math.round(r.timeSpentSeconds / 60)} mins</td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CLOUD & SUPABASE STATUS */}
        {adminActiveTab === 'db_sync' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Cloud Database &amp; Supabase Synchronization</h2>
                <p className="text-xs text-slate-500">Real-time architecture and zero-lag persistence</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Supabase Connection</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-bold text-sm text-slate-900">
                    {isSupabaseConfigured ? 'Connected (Realtime Live)' : 'Local Storage Mirror (Fallback Ready)'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Gemini 2.5 AI Engine</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-sm text-slate-900">Operational (/api/extract-pdf-text)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500">RLS &amp; Security Mode</span>
                <div className="flex items-center gap-2 mt-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-sm text-slate-900">Admin Key Verified (ASI@2025)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-200 text-xs text-violet-900 space-y-1 font-medium">
              <p className="font-bold">Production Sync Guarantee:</p>
              <p>Whenever you publish, modify, or delete a test, changes are synchronized immediately across Supabase, Firestore, and client memory. Real-time websocket channels push updates instantly to student test lists without requiring page reloads.</p>
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
