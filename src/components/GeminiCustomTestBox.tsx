import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check,
  Zap,
  FileText,
  Layers,
  HelpCircle
} from 'lucide-react';
import { TestItem, Question, Difficulty, TestCategory } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { extractFromPdfFile, ExtractionProgress, ExtractedMCQ } from '../utils/pdfExtractor';

const SAMPLE_JSON_SNIPPET = `{
  "title": "NEET 2026 Biology High-Yield Grand Mock",
  "subject": "Biology",
  "category": "NEET Full Syllabus",
  "duration": 30,
  "difficulty": "Medium",
  "questions": [
    {
      "question": "Which cell organelle is known as the powerhouse of the cell?",
      "options": ["Golgi apparatus", "Mitochondria", "Ribosome", "Lysosome"],
      "answer": 1,
      "explanation_hinglish": "Mitochondria cellular respiration ke through ATP synthesize karte hain."
    },
    {
      "question": "During DNA replication, which enzyme is responsible for unwinding the double helix?",
      "options": ["DNA Polymerase", "RNA Primase", "DNA Helicase", "DNA Ligase"],
      "answer": 2,
      "explanation_hinglish": "DNA Helicase replication fork par hydrogen bonds ko un緻p karta hai."
    }
  ]
}`;

interface StatusMessage {
  type: 'info' | 'success' | 'error';
  text: string;
}

export interface GeminiCustomTestBoxProps {
  onTestGenerated?: (test: TestItem) => void;
  onDirectPublish?: ((test: TestItem) => void) | null;
  className?: string;
}

export const GeminiCustomTestBox: React.FC<GeminiCustomTestBoxProps> = ({ 
  onTestGenerated, 
  onDirectPublish,
  className = "" 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [pdfFileName, setPdfFileName] = useState('📁 PDF Upload Karo (Questions wala)');
  const [pdfTextStore, setPdfTextStore] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [jsonInputVisible, setJsonInputVisible] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF File upload & text extraction handler with Scanned PDF Vision Fallback
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    setPdfFileName(`⏳ Padh raha hu... ${file.name}`);
    setStatusMessage({ type: 'info', text: `Analyzing file "${file.name}"...` });

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const key = apiKey.trim() || undefined;
        const result = await extractFromPdfFile(file, key, (progress) => {
          setExtractionProgress(progress);
        });

        if (result.isScanned && result.directQuestions && result.directQuestions.length > 0) {
          // Direct scanned extraction finished with questions
          setPdfFileName(`✅ Scanned PDF Ready: ${file.name} (${result.directQuestions.length} MCQs via Vision)`);
          setStatusMessage({
            type: 'success',
            text: `Scanned PDF padh liya! Gemini Vision ne ${result.directQuestions.length} MCQs extract kar diye.`
          });
          // Auto publish or offer to load
          publishFromDirectQuestions(result.directQuestions, file.name.replace('.pdf', ''));
          return;
        }

        setPdfTextStore(result.text);
        setPdfFileName(`✅ PDF Ready: ${file.name} (${result.text.length} characters)`);
        setStatusMessage({
          type: 'success',
          text: `PDF Text Safaltapoorvak Padh Liya! Ab "Gemini Se Test Banao" button dabayein.`
        });
      } else {
        const text = await file.text();
        setPdfTextStore(text.slice(0, 30000));
        setPdfFileName(`✅ Text File Ready: ${file.name}`);
        setStatusMessage({ type: 'success', text: `Loaded text file (${file.name}).` });
      }
    } catch (err: any) {
      console.error('PDF Read error:', err);
      setPdfFileName('❌ PDF Padhne me dikkat aayi');
      setStatusMessage({ 
        type: 'error', 
        text: `PDF Padhne me dikkat aayi: ${err?.message || 'Check PDF structure or API key for scanned pages.'}` 
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Helper to publish from direct questions array (from Scanned Vision OCR)
  const publishFromDirectQuestions = (qs: ExtractedMCQ[], defaultTitle: string) => {
    const formatted: Question[] = qs.map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || 'Detailed step-by-step NCERT solution.',
      chapter: q.chapter || 'Biology'
    }));

    const testItem: TestItem = {
      id: 'TEST_' + Date.now(),
      title: defaultTitle ? `Scanned Exam: ${defaultTitle}` : 'High Yield Scanned NEET Mock',
      category: 'NEET Full Syllabus',
      subject: 'Biology',
      durationMinutes: Math.max(15, Math.round(formatted.length * 1.5)),
      totalQuestions: formatted.length,
      totalMarks: formatted.length * 4,
      difficulty: 'Medium',
      syllabus: ['NCERT Scanned Questions', 'High Yield Topics'],
      description: 'Extracted directly from scanned question paper via Gemini Vision OCR.',
      questions: formatted,
      attemptsCount: 0,
      rating: 5.0,
      isNew: true
    };

    saveAndTriggerPublish(testItem);
  };

  // Publish / Import normalized test
  const publishTest = (json: any) => {
    // Handle array or wrapped object
    let questionsList: any[] = [];
    if (Array.isArray(json)) {
      questionsList = json;
    } else if (json && Array.isArray(json.questions)) {
      questionsList = json.questions;
    } else if (json && typeof json === 'object') {
      const possibleArr = Object.values(json).find(v => Array.isArray(v));
      if (possibleArr) questionsList = possibleArr as any[];
    }

    if (questionsList.length === 0) {
      alert('Questions nahi mile! Please provide valid questions in JSON.');
      return;
    }

    const normalizedQuestions: Question[] = questionsList.map((x: any, i: number) => ({
      id: i + 1,
      question: x.question || x.q || `Question ${i + 1}`,
      options: Array.isArray(x.options) && x.options.length >= 2 
        ? x.options.slice(0, 4).map((opt: any) => String(opt).trim()) 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof x.answer === 'number' ? x.answer : (typeof x.ans === 'number' ? x.ans : (typeof x.correctAnswer === 'number' ? x.correctAnswer : 0)),
      explanation: x.explanation_hinglish || x.solution || x.explanation || 'Detailed step-by-step NCERT solution.',
      chapter: x.topic || json.subject || 'Biology'
    }));

    const publishedTest: TestItem = {
      id: 'TEST_' + Date.now(),
      title: json.title || (prompt ? `NEET Mock: ${prompt.slice(0, 35)}` : 'NEET High-Yield Biology Mock'),
      category: (json.category || 'NEET Full Syllabus') as TestCategory,
      subject: json.subject || 'Biology',
      durationMinutes: Number(json.duration || Math.max(15, Math.round(normalizedQuestions.length * 1.5))),
      totalQuestions: normalizedQuestions.length,
      totalMarks: normalizedQuestions.length * 4,
      difficulty: (json.difficulty || 'Medium') as Difficulty,
      syllabus: [json.subject || 'Biology', 'High Yield Topics'],
      description: 'High-yield NCERT test curated via Gemini AI Test Creator.',
      questions: normalizedQuestions,
      attemptsCount: 0,
      rating: 5.0,
      isNew: true
    };

    saveAndTriggerPublish(publishedTest);
  };

  const saveAndTriggerPublish = (publishedTest: TestItem) => {
    // Save to localStorage
    try {
      const allPublished = JSON.parse(localStorage.getItem('asi_published_tests') || '[]');
      const allCustom = JSON.parse(localStorage.getItem('asi_custom_tests') || '[]');
      
      const filteredPublished = allPublished.filter((t: TestItem) => t.id !== publishedTest.id);
      const filteredCustom = allCustom.filter((t: TestItem) => t.id !== publishedTest.id);
      
      localStorage.setItem('asi_published_tests', JSON.stringify([publishedTest, ...filteredPublished]));
      localStorage.setItem('asi_custom_tests', JSON.stringify([publishedTest, ...filteredCustom]));

      // Also persist to Firebase Firestore
      if (db) {
        setDoc(doc(db, "tests", publishedTest.id), publishedTest).catch((err) => {
          console.warn("Firestore sync background notice:", err);
        });
      }
    } catch (e) {
      console.warn('Storage warning:', e);
    }

    // Trigger parent callbacks
    if (onTestGenerated) {
      onTestGenerated(publishedTest);
    }
    if (onDirectPublish) {
      onDirectPublish(publishedTest);
    }

    setStatusMessage({
      type: 'success',
      text: `🚀 Test Safaltapoorvak Ban Gaya: "${publishedTest.title}" (${publishedTest.totalQuestions} MCQs). Saved to portal!`
    });
  };

  // JSON Button Click
  const handleJsonButtonClick = () => {
    if (!jsonInputVisible) {
      setJsonInputVisible(true);
      if (!jsonText) {
        setJsonText(SAMPLE_JSON_SNIPPET);
      }
      return;
    }

    if (!jsonText.trim()) {
      alert('Yaha JSON paste karo pehle.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      publishTest(parsed);
    } catch (err: any) {
      alert('JSON Galat hai: ' + err.message);
      setStatusMessage({ type: 'error', text: 'Invalid JSON format: ' + err.message });
    }
  };

  // Gemini AI Generation Trigger with Auto-Retry (2x)
  const handleGeminiGenerate = async () => {
    if (!pdfTextStore && !prompt.trim()) {
      alert('PDF daalo ya Prompt likho!');
      return;
    }

    setIsGenerating(true);
    setStatusMessage({ type: 'info', text: '⏳ Gemini High-Yield Test Bana Raha Hai... Please wait.' });

    const key = apiKey.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    try {
      // 1. Try server endpoint /api/generate-gemini-test
      const serverRes = await fetch('/api/generate-gemini-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          pdfText: pdfTextStore,
          apiKey: key || undefined,
          count: 15
        })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.success && (data.test || data.rawQuestions)) {
          publishTest(data.test || data.rawQuestions);
          setIsGenerating(false);
          return;
        }
      }

      // If server returned 401 or key missing
      const serverErrJson = await serverRes.json().catch(() => ({}));
      if (serverRes.status === 401 || serverErrJson.error?.includes('API Key')) {
        if (!key) {
          throw new Error('API Key missing in Vercel Settings / Environment. Please configure GEMINI_API_KEY or paste key above.');
        }
      }

      // 2. Client-side fallback with auto-retry (up to 2 retries)
      if (key) {
        const systemPrompt = `You are an expert NEET/JEE paper setter. Create high-yield, NCERT-based MCQs only. Return ONLY valid JSON array: [{question, options:[4], answer, explanation_hinglish, topic, difficulty}]`;
        const userContent = `Create 15 high-yield MCQs based on:
${pdfTextStore ? `PDF CONTENT:\n${pdfTextStore.slice(0, 25000)}` : `PROMPT:\n${prompt}`}

Return STRICT JSON ARRAY only.`;

        let clientError: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });

            const data = await res.json();
            if (data.error) {
              throw new Error(data.error.message || 'Gemini API Error');
            }

            const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = candidateText.replace(/```json|```/g, '').trim();
            const parsedJson = JSON.parse(cleaned);

            publishTest(parsedJson);
            setStatusMessage({
              type: 'success',
              text: `✅ Gemini Ne High-Yield Test Bana Diya!`
            });
            setIsGenerating(false);
            return;
          } catch (err) {
            clientError = err;
            console.warn(`Client retry ${attempt} failed:`, err);
          }
        }

        throw new Error(clientError?.message || 'Could not parse valid JSON from AI after retries.');
      } else {
        throw new Error(serverErrJson.error || 'API Key missing in Vercel Settings / Environment. Please configure GEMINI_API_KEY.');
      }
    } catch (err: any) {
      console.error('Gemini Test Creator error:', err);
      setStatusMessage({
        type: 'error',
        text: `❌ Error: ${err.message || 'Could not generate test. Check API key or prompt.'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copySampleJson = () => {
    navigator.clipboard.writeText(SAMPLE_JSON_SNIPPET);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div 
      id="gemini-box" 
      className={`bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs my-4 ${className}`}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      
      {/* Box Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
              <span>🤖 Gemini AI - Custom Test Creator</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-800 text-[11px] font-bold rounded-full border border-violet-200">
              High Yield NEET/JEE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            PDF daalo ya Prompt likho, pura test AI bana dega. Scanned PDFs bhi Vision OCR se auto-extract hoti hain.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Gemini 2.5 &amp; Flash Vision</span>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
        
        {/* Gemini API Key Input */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">
              Gemini API Key <span className="text-slate-400 font-normal">(Optional if already configured in GEMINI_API_KEY env)</span>
            </label>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:underline"
            >
              Get Free Key from Google AI Studio ↗
            </a>
          </div>
          <input 
            id="gemini-key" 
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Gemini API Key (AIza...) or leave empty to use server environment" 
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all font-mono text-slate-900"
          />
        </div>

        {/* PDF Upload Target */}
        <div className="sm:col-span-2">
          <label 
            htmlFor="gemini-pdf"
            className="border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-violet-50/50 transition-all block group"
          >
            <input 
              id="gemini-pdf" 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf,.txt" 
              onChange={handlePdfUpload}
              className="hidden" 
            />
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-violet-700">
              <Upload className="w-4 h-4 text-violet-600 group-hover:scale-110 transition-transform" />
              <span id="gemini-fname">{pdfFileName}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload NEET/JEE question paper PDF (Text or Scanned pages supported)
            </p>
          </label>

          {/* Progress Bar for PDF Extraction */}
          {isPdfLoading && extractionProgress && (
            <div className="mt-2.5 p-3 bg-violet-50/80 border border-violet-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-violet-900">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                  <span>{extractionProgress.statusText}</span>
                </span>
                <span>{extractionProgress.percentage}%</span>
              </div>
              <div className="w-full bg-violet-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${extractionProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Prompt Textarea */}
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Natural Language AI Prompt
          </label>
          <textarea 
            id="gemini-prompt" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: 'NEET 2026 ke Human Physiology & Genetics ke 15 high-yield assertion-reason MCQs banao, 4 options aur detailed Hinglish explanations ke saath'" 
            className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 transition-all h-24 text-slate-800"
          />
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button 
          id="gemini-btn" 
          onClick={handleGeminiGenerate}
          disabled={isGenerating || isPdfLoading}
          className="flex-1 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white border-none rounded-xl py-3 px-4 font-bold text-xs sm:text-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-violet-300" />
              <span>Gemini Test Bana Raha Hai...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>✨ Gemini Se Test Banao</span>
            </>
          )}
        </button>

        <button 
          id="json-btn" 
          onClick={handleJsonButtonClick}
          className="flex-1 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-800 border border-slate-200 rounded-xl py-3 px-4 font-bold text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <Code2 className="w-4 h-4 text-slate-600" />
          <span>{jsonInputVisible ? '✔️ Ab Test Load Karo' : '📄 JSON Se Test Banao'}</span>
        </button>
      </div>

      {/* JSON Format Guide Details */}
      <details className="mt-3.5 group">
        <summary className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1">
          <span>JSON Format Kaise Likhe? (Click here to view format &amp; copy)</span>
        </summary>
        <div className="mt-2 bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono relative overflow-x-auto border border-slate-800">
          <button
            onClick={copySampleJson}
            className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedSample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSample ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <pre className="text-[11px] leading-relaxed">{SAMPLE_JSON_SNIPPET}</pre>
        </div>
      </details>

      {/* Expandable JSON Textarea Input */}
      {jsonInputVisible && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Paste JSON Test Structure:</label>
            <button 
              onClick={() => setJsonText(SAMPLE_JSON_SNIPPET)}
              className="text-[11px] font-bold text-violet-600 hover:underline cursor-pointer"
            >
              Insert Sample JSON
            </button>
          </div>
          <textarea 
            id="json-input" 
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Yaha JSON paste karo aur 'Ab Test Load Karo' dabao" 
            className="w-full border border-slate-200 rounded-xl p-3 font-mono text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 h-28 text-slate-800"
          />
        </div>
      )}

      {/* Live Status Container */}
      <div id="gemini-status" className="mt-3 text-xs font-semibold">
        {statusMessage && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-violet-50 border-violet-200 text-violet-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-violet-600 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

    </div>
  );
};
