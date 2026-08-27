import React, { useState, useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Mic,
  MicOff,
  BookOpen,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Question } from '../types';
import { supabase } from '../utils/supabaseClient';
import { askGeminiDoubt } from '../lib/gemini';
import { useBackButton } from '../hooks/useBackButton';
import { getOptimizedBackdropClass } from '../utils/performance';

export interface AIDoubtSolverProps {
  question: Question;
  mode?: 'test' | 'result';
  studentId?: string;
  studentName?: string;
  testId?: string;
  currentSelectedOption?: number | null;
  isOpen?: boolean;
  onClose?: () => void;
  // Trigger button variant if rendered inline
  triggerVariant?: 'floating' | 'button' | 'pill';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  ncertRef?: string;
}

/**
 * KaTeX Formula & Markdown Formatter
 */
const MathAndMarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return [];

    // Split by block equations $$...$$ and inline equations $...$
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="block my-2 overflow-x-auto text-violet-200" />;
        } catch {
          return <code key={index} className="text-violet-300 font-mono">{part}</code>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block mx-0.5 text-violet-200" />;
        } catch {
          return <code key={index} className="text-violet-300 font-mono">{part}</code>;
        }
      }

      // Simple Markdown: Bold **text**, Bullet points, italic *text*
      const formattedLines = part.split('\n').map((line, lineIdx) => {
        let processed = line;
        // Bold
        processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 my-1 pl-1">
              <span className="text-violet-400 font-bold">•</span>
              <span dangerouslySetInnerHTML={{ __html: processed.replace(/^[-•]\s*/, '') }} />
            </div>
          );
        }

        return (
          <span
            key={lineIdx}
            dangerouslySetInnerHTML={{ __html: processed }}
            className={lineIdx > 0 ? 'block mt-1' : 'inline'}
          />
        );
      });

      return <span key={index}>{formattedLines}</span>;
    });
  }, [content]);

  return <div className={`leading-relaxed text-xs sm:text-sm ${className}`}>{renderedContent}</div>;
};

/**
 * AIDoubtSolver Component
 */
export const AIDoubtSolver: React.FC<AIDoubtSolverProps> = ({
  question,
  mode = 'result',
  studentId = 'student_default',
  studentName = 'Aspirant',
  testId = 'test_active',
  currentSelectedOption = null,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  triggerVariant = 'floating'
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  // Hardware Back Button: When AI drawer is open, pressing back button closes it with priority 20
  useBackButton(() => {
    if (isOpen) {
      handleClose();
      return true; // back event consumed
    }
    return false;
  }, isOpen, 20);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Load previous doubts from Supabase or Cache on question change
  useEffect(() => {
    if (!question?.id) return;

    const cacheKey = `asi_ai_doubts_${question.id}_${mode}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {
        // ignore parse error
      }
    }

    // Default welcome prompt based on mode
    const welcomeMsg: ChatMessage = {
      id: `welcome_${question.id}`,
      sender: 'ai',
      text:
        mode === 'test'
          ? `Namaste ${studentName}! 🙏 Main hoon **ASI AI Tutor**.\nTest mode me direct answer nahi dunga, par **NCERT concept** aur **sochne ka hint** zaroor bataunga. Poocho kya confusion hai!`
          : `Namaste ${studentName}! 🙏 Main hoon **ASI AI Tutor**.\nIs question ka concept, NCERT trick ya detailed explanation chahiye? Neeche chips select karo ya apna doubt type karo!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ncertRef: question.ncertReference
    };

    setMessages([welcomeMsg]);
  }, [question?.id, mode, studentName]);

  // Auto-suggest Doubt Chips
  const smartChips = useMemo(() => {
    if (mode === 'test') {
      return [
        '💡 Is question ke liye hint do',
        '📖 NCERT ka kaunsa concept lagega?',
        '❌ Options eliminate kaise karein?'
      ];
    }
    return [
      '🧠 Poora Concept samjhao',
      '⚡ Fast Trick / Mnemonic batao',
      '📌 NCERT line-to-line reference do'
    ];
  }, [mode]);

  // Voice Input (SpeechRecognition UI + Web Speech API fallback)
  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition browser me supported nahi hai. Kripya type karein.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hinglish friendly Hindi input
      recognition.interimResults = false;

      if (!isListening) {
        recognition.start();
        setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
      } else {
        recognition.stop();
        setIsListening(false);
      }
    } catch {
      setIsListening(false);
    }
  };

  // Ask AI via Gemini API with streaming & retry
  const handleAskDoubt = async (queryText?: string) => {
    const textToSend = queryText || inputQuery.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `u_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    const aiMsgId = `ai_${Date.now()}`;
    const aiPlaceholder: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: 'AI Tutor soch raha hai... ⏳',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };
    setMessages([...newMessages, aiPlaceholder]);

    try {
      const result = await askGeminiDoubt({
        question,
        doubtQuery: textToSend,
        mode: mode === 'test' ? 'test' : 'result',
        studentName,
        currentSelectedOption,
        onChunk: (_chunk, fullTextSoFar) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, text: fullTextSoFar, isStreaming: true }
                : m
            )
          );
        }
      });

      const finalAiMessage: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: false,
        ncertRef: question.ncertReference
      };

      setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? finalAiMessage : m)));

      // Save conversation history to local storage
      const conversationHistory = [...newMessages, finalAiMessage];
      try {
        localStorage.setItem(`asi_ai_doubts_${question.id}_${mode}`, JSON.stringify(conversationHistory));
      } catch {
        // ignore
      }

      // Save to Supabase 'ai_doubts' table if available
      if (supabase) {
        try {
          await supabase.from('ai_doubts').insert({
            student_id: studentId,
            question_id: question.id,
            test_id: testId,
            doubt: textToSend,
            ai_response: result.text,
            mode
          });
        } catch {
          // ignore error
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: '⚠️ Network error ya API timeout. Kripya dobara try karein.',
                isStreaming: false
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* 1. TRIGGER BUTTONS */}
      {triggerVariant === 'floating' && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl shadow-violet-600/50 border border-violet-400/40 cursor-pointer transition-transform"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span>🤖 AI Se Pucho</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {triggerVariant === 'button' && (
        <button
          onClick={handleOpen}
          className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 hover:text-white border border-violet-500/40 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Bot className="w-4 h-4 text-violet-400" />
          <span>🤖 AI Se Pucho</span>
        </button>
      )}

      {triggerVariant === 'pill' && (
        <button
          onClick={handleOpen}
          className="px-3 py-1.5 rounded-full bg-violet-950/80 hover:bg-violet-900/90 text-violet-300 border border-violet-600/50 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Ask ASI AI</span>
        </button>
      )}

      {/* 2. CHAT DRAWER / BOTTOM SHEET MODAL */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-slate-950/80 ${getOptimizedBackdropClass()} transition-opacity animate-in fade-in`}>
          {/* Backdrop click to dismiss */}
          <div className="absolute inset-0" onClick={handleClose} />

          {/* Chat Window / Drawer */}
          <div className="relative z-10 w-full sm:w-[440px] md:w-[480px] h-[85vh] sm:h-[620px] max-h-[90vh] bg-slate-900 border-t sm:border border-slate-800 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">ASI AI Doubt Solver</h3>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30">
                      {mode === 'test' ? 'Hint Mode' : 'Solution Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Powered by Gemini AI • NCERT Based
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    localStorage.removeItem(`asi_ai_doubts_${question.id}_${mode}`);
                    setMessages([
                      {
                        id: `reset_${Date.now()}`,
                        sender: 'ai',
                        text: 'Chat history cleared. Poocho apna naya doubt!',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  title="Clear Conversation"
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close (or Press Back Button)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Question Preview Header Pill */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-black text-[10px]">
                  Q{question.id}
                </span>
                <span className="truncate font-medium">{question.question}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0 font-bold ml-2">
                {question.chapter || 'Biology'}
              </span>
            </div>

            {/* Chat Message List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${isAi ? 'items-start' : 'items-end justify-end'}`}
                  >
                    {isAi && (
                      <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        isAi
                          ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-md'
                          : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md rounded-br-xs'
                      }`}
                    >
                      <MathAndMarkdownRenderer content={msg.text} />

                      {msg.ncertRef && isAi && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-violet-300/90 font-mono flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-violet-400" />
                          <span>Ref: {msg.ncertRef}</span>
                        </div>
                      )}

                      <div
                        className={`flex items-center justify-between gap-2 mt-1.5 text-[9px] ${
                          isAi ? 'text-slate-400' : 'text-violet-200'
                        }`}
                      >
                        <span>{msg.timestamp}</span>

                        {isAi && (
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="hover:text-slate-200 flex items-center gap-0.5 cursor-pointer ml-auto"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3.5 py-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {smartChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskDoubt(chip)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-violet-950/80 border border-slate-800 hover:border-violet-600/50 text-slate-300 hover:text-violet-200 text-[11px] font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form Area */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskDoubt();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  title="Voice Doubt (Hindi/English)"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Iska answer C kaise hai? Poocho yahan..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden"
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-violet-600/30 transition-all cursor-pointer shrink-0"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
                <span>NCERT High-Yield AI engine</span>
                <span className="text-violet-400 font-bold">Amerj Sir Institute</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIDoubtSolver;
