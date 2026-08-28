import React, { useState, useMemo } from 'react';
import katex from 'katex';
import {
  ZoomIn,
  ZoomOut,
  X,
  Copy,
  Check,
  AlertTriangle,
  Type,
  Maximize2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Question } from '../types';

export interface QuestionRendererProps {
  question: Partial<Question> & {
    id: number;
    question_en?: string;
    question_hi?: string;
    options_en?: string[];
    options_hi?: string[];
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    imageUrl?: string | null;
    type?: 'MCQ' | 'ASSERTION_REASON' | 'MATCHING' | 'STATEMENT' | string;
    ncertReference?: string;
    chapter?: string;
    topic?: string;
    subject?: string;
  };
  language?: 'en' | 'hi';
  onLanguageChange?: (lang: 'en' | 'hi') => void;
  selectedOption?: number | null;
  onSelect?: (optionIndex: number) => void;
  showCorrectAnswer?: boolean; // false in Test mode, true in Result/Review mode
  disabled?: boolean;
}

/**
 * Robust Text Cleanup function for messy Excel imports, tags, entities, and linebreaks
 */
export function cleanQuestionText(rawText?: any): string {
  if (rawText === null || rawText === undefined) return '';

  let text = '';
  if (typeof rawText === 'string') {
    text = rawText;
  } else if (typeof rawText === 'number' || typeof rawText === 'boolean') {
    text = String(rawText);
  } else if (typeof rawText === 'object') {
    try {
      if (typeof rawText.text === 'string') {
        text = rawText.text;
      } else if (typeof rawText.question === 'string') {
        text = rawText.question;
      } else if (typeof rawText.en === 'string') {
        text = rawText.en;
      } else if (typeof rawText.hi === 'string') {
        text = rawText.hi;
      } else {
        text = JSON.stringify(rawText);
      }
    } catch {
      text = Object.prototype.toString.call(rawText);
    }
  } else {
    try {
      text = String(rawText);
    } catch {
      text = '';
    }
  }

  if (!text) return '';

  // 1. Remove HTML tags like <p>, </p>, <br/>, <div>, <span>, <b>, <i>, &nbsp;
  text = text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // 2. Normalize multiple spaces & tabs
  text = text.replace(/[ \t]+/g, ' ');

  // 3. Normalize multiple line breaks to max 2 line breaks
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return text.trim();
}

/**
 * Parses Assertion-Reason structure if question is of AR type or contains Assertion: Reason: text
 */
interface AssertionReasonData {
  isAssertionReason: boolean;
  assertionText?: string;
  reasonText?: string;
  leadingText?: string;
}

function parseAssertionReason(text: string): AssertionReasonData {
  if (!text) return { isAssertionReason: false };

  // Match patterns like:
  // Assertion (A): ... Reason (R): ...
  // Assertion: ... Reason: ...
  // कथन (A): ... कारण (R): ...
  const arRegex = /(?:Assertion|अभिकथन|कथन)\s*(?:\([AА]\))?[:\-–\s]+([\s\S]+?)(?:Reason|कारण)\s*(?:\([R]\))?[:\-–\s]+([\s\S]+)/i;
  const match = text.match(arRegex);

  if (match) {
    const fullPrefix = text.slice(0, match.index || 0).trim();
    return {
      isAssertionReason: true,
      leadingText: fullPrefix,
      assertionText: match[1].trim(),
      reasonText: match[2].trim()
    };
  }

  return { isAssertionReason: false };
}

/**
 * KaTeX Formula & Math Parser Component
 * Supports: $formula$, $$formula$$, \(formula\), \[formula\]
 */
export const MathText: React.FC<{ text: any; className?: string; isHindi?: boolean }> = ({
  text,
  className = '',
  isHindi = false
}) => {
  const parts = useMemo(() => {
    if (!text) return [];

    let stringText = '';
    if (typeof text === 'string') {
      stringText = text;
    } else if (typeof text === 'number' || typeof text === 'boolean') {
      stringText = String(text);
    } else if (typeof text === 'object') {
      try {
        stringText = text.text || text.question || text.en || text.hi || JSON.stringify(text);
      } catch {
        stringText = '';
      }
    } else {
      try {
        stringText = String(text);
      } catch {
        stringText = '';
      }
    }

    if (!stringText) return [];

    // Normalize LaTeX delimiters \(...\) to $...$ and \[...\] to $$...$$
    let normalized = stringText
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

    // Split on block $$...$$ and inline $...$
    const tokens = normalized.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$)/g);

    return tokens.map((token, index) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="block my-2 overflow-x-auto text-slate-900"
            />
          );
        } catch {
          return <span key={index} className="font-mono text-purple-700">{token}</span>;
        }
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-block mx-0.5 text-slate-900"
            />
          );
        } catch {
          return <span key={index} className="font-mono text-purple-700">{token}</span>;
        }
      }

      // Handle simple newlines safely
      const subLines = token.split('\n');
      if (subLines.length > 1) {
        return (
          <span key={index}>
            {subLines.map((l, li) => (
              <React.Fragment key={li}>
                {l}
                {li < subLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }

      return <span key={index}>{token}</span>;
    });
  }, [text]);

  return (
    <span
      className={`leading-relaxed ${
        isHindi ? 'font-["Noto_Sans_Devanagari",_sans-serif]' : 'font-["Inter",_serif]'
      } ${className}`}
    >
      {parts}
    </span>
  );
};

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  language: controlledLanguage,
  onLanguageChange,
  selectedOption = null,
  onSelect,
  showCorrectAnswer = false,
  disabled = false
}) => {
  // 1. Language Toggle State
  const [internalLanguage, setInternalLanguage] = useState<'en' | 'hi'>('en');
  const currentLang = controlledLanguage || internalLanguage;
  const setLanguage = (lang: 'en' | 'hi') => {
    if (onLanguageChange) onLanguageChange(lang);
    setInternalLanguage(lang);
  };

  // Font Size Adjuster State (NTA Pro accessibility)
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0); // -2, 0, +2, +4
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [copiedQuestion, setCopiedQuestion] = useState<boolean>(false);
  const [reportedModal, setReportedModal] = useState<boolean>(false);

  // Check language availability in dataset
  const hasHindi = Boolean(question.question_hi || (question.options_hi && question.options_hi.length > 0));
  const hasEnglish = Boolean(question.question_en || question.question || (question.options_en && question.options_en.length > 0));

  // Determine active text based on current selected language with fallback
  const rawQuestionText = useMemo(() => {
    if (currentLang === 'hi' && question.question_hi) {
      return question.question_hi;
    }
    return question.question_en || question.question || '';
  }, [currentLang, question]);

  const cleanedText = useMemo(() => cleanQuestionText(rawQuestionText), [rawQuestionText]);

  // Determine active options with fallback
  const activeOptions: string[] = useMemo(() => {
    let opts: string[] = [];
    if (currentLang === 'hi' && question.options_hi && question.options_hi.length > 0) {
      opts = question.options_hi;
    } else if (question.options_en && question.options_en.length > 0) {
      opts = question.options_en;
    } else if (question.options && question.options.length > 0) {
      opts = question.options;
    } else {
      // Auto-extract options if embedded inside question text like A) ... B) ...
      const splitMatches = cleanedText.match(/[A-D]\s*[\)\.]\s*([\s\S]+?)(?=[A-D]\s*[\)\.]|$)/gi);
      if (splitMatches && splitMatches.length >= 4) {
        opts = splitMatches.map(m => m.replace(/^[A-D]\s*[\)\.]\s*/i, '').trim());
      } else {
        opts = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
      }
    }
    return opts.map(cleanQuestionText);
  }, [currentLang, question, cleanedText]);

  // Check Assertion-Reason structure
  const arData = useMemo(() => {
    if (question.type === 'ASSERTION_REASON' || question.type === 'STATEMENT') {
      return parseAssertionReason(cleanedText);
    }
    return parseAssertionReason(cleanedText);
  }, [question.type, cleanedText]);

  // Check if diagram is present in question text or imageUrl prop
  const diagramUrl = question.imageUrl || null;

  // Handle Copy Question Text
  const handleCopyQuestion = () => {
    const fullText = `Q.${question.id}: ${cleanedText}\n\nOptions:\n${activeOptions
      .map((opt, i) => `(${String.fromCharCode(65 + i)}) ${opt}`)
      .join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedQuestion(true);
    setTimeout(() => setCopiedQuestion(false), 2000);
  };

  const isHindiMode = currentLang === 'hi';

  return (
    <div className="w-full bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans select-text">
      {/* ========================================================================= */}
      {/* 1. NTA PAPER HEADER & TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Question Number Badge & Type */}
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">Q.No</span>
            <span className="text-base font-black tracking-tight">{question.id}</span>
          </div>

          {question.subject && (
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
              {question.subject}
            </span>
          )}

          {question.chapter && (
            <span className="text-xs text-slate-500 font-medium hidden sm:inline truncate max-w-[220px]">
              • {question.chapter}
            </span>
          )}
        </div>

        {/* Right: Bilingual Switch & Accessibility Toolbar */}
        <div className="flex items-center gap-2">
          {/* Bilingual Language Switcher (NTA Standard) */}
          {(hasHindi || hasEnglish) && (
            <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 border border-slate-300 text-xs font-black">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-white text-purple-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  currentLang === 'hi'
                    ? 'bg-white text-purple-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
            </div>
          )}

          {/* Font Size Adjuster (+ / -) */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5 text-xs text-slate-700 font-bold">
            <button
              type="button"
              onClick={() => setFontSizeOffset(prev => Math.max(-2, prev - 2))}
              title="Decrease Font Size"
              className="px-2 py-1 hover:bg-white rounded cursor-pointer"
            >
              A-
            </button>
            <span className="px-1 text-[11px] text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setFontSizeOffset(prev => Math.min(6, prev + 2))}
              title="Increase Font Size"
              className="px-2 py-1 hover:bg-white rounded cursor-pointer"
            >
              A+
            </button>
          </div>

          {/* Copy Question */}
          <button
            type="button"
            onClick={handleCopyQuestion}
            title="Copy Question Text"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            {copiedQuestion ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Report Error */}
          <button
            type="button"
            onClick={() => setReportedModal(true)}
            title="Report Error in Question"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUESTION STATEMENT (NTA SHEET WHITE BACKGROUND) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* If Question is Assertion & Reason, render NTA style split cards */}
        {arData.isAssertionReason ? (
          <div className="space-y-4">
            {arData.leadingText && (
              <div
                style={{ fontSize: `${17 + fontSizeOffset}px`, lineHeight: '1.7' }}
                className="text-slate-900 font-semibold"
              >
                <MathText text={arData.leadingText} isHindi={isHindiMode} />
              </div>
            )}

            {/* Assertion Box */}
            <div className="bg-purple-50/50 border-2 border-purple-200/80 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
              <span className="px-2.5 py-1 rounded bg-purple-700 text-white font-black text-xs uppercase shrink-0 mt-0.5">
                {isHindiMode ? 'अभिकथन (A)' : 'Assertion (A)'}
              </span>
              <div
                style={{ fontSize: `${16 + fontSizeOffset}px`, lineHeight: '1.65' }}
                className="text-slate-900 font-medium"
              >
                <MathText text={arData.assertionText || ''} isHindi={isHindiMode} />
              </div>
            </div>

            {/* Reason Box */}
            <div className="bg-amber-50/50 border-2 border-amber-200/80 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-xs">
              <span className="px-2.5 py-1 rounded bg-amber-700 text-white font-black text-xs uppercase shrink-0 mt-0.5">
                {isHindiMode ? 'कारण (R)' : 'Reason (R)'}
              </span>
              <div
                style={{ fontSize: `${16 + fontSizeOffset}px`, lineHeight: '1.65' }}
                className="text-slate-900 font-medium"
              >
                <MathText text={arData.reasonText || ''} isHindi={isHindiMode} />
              </div>
            </div>
          </div>
        ) : (
          /* Standard Question Statement */
          <div
            style={{ fontSize: `${17 + fontSizeOffset}px`, lineHeight: '1.75' }}
            className={`text-slate-900 font-medium tracking-normal ${
              isHindiMode ? 'text-[18px]' : ''
            }`}
          >
            <MathText text={cleanedText} isHindi={isHindiMode} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CENTERED HIGH-RES DIAGRAM WITH ZOOM (NTA PAPER RULE) */}
        {/* ========================================================================= */}
        {diagramUrl && (
          <figure className="my-6 flex flex-col items-center justify-center">
            <div
              onClick={() => setIsZoomModalOpen(true)}
              className="relative group bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-zoom-in max-w-full"
            >
              <img
                src={diagramUrl}
                alt={`Figure for Question ${question.id}`}
                className="max-h-[280px] w-auto object-contain rounded-lg mx-auto"
                loading="lazy"
              />

              {/* Hover Zoom Overlay Badge */}
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                <ZoomIn className="w-4 h-4" />
                <span>Click to Zoom Diagram</span>
              </div>
            </div>
            <figcaption className="text-xs font-bold text-slate-500 mt-2 text-center">
              Fig: Given diagram for Q.{question.id}
            </figcaption>
          </figure>
        )}

        {/* ========================================================================= */}
        {/* 4. 2X2 NTA OPTIONS GRID (A, B, C, D) */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-3">
            Select the correct option:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeOptions.map((optionText, optIndex) => {
              const isSelected = selectedOption === optIndex;
              const isCorrectAnswer = showCorrectAnswer && question.correctAnswer === optIndex;
              const isUserWrongAnswer = showCorrectAnswer && isSelected && question.correctAnswer !== optIndex;

              // NTA Style Label (1), (2), (3), (4) or (A), (B), (C), (D)
              const letterLabel = String.fromCharCode(65 + optIndex);
              const numberLabel = `(${optIndex + 1})`;

              let containerClasses =
                'border-2 border-slate-200 bg-white hover:border-purple-400 text-slate-800 shadow-xs hover:shadow-sm';

              if (isSelected && !showCorrectAnswer) {
                // Active Selected in Test Mode (Signature NTA Purple)
                containerClasses =
                  'border-purple-600 bg-purple-50 text-purple-950 shadow-md ring-2 ring-purple-600/20 font-semibold';
              } else if (isCorrectAnswer) {
                // Correct Answer in Result Mode
                containerClasses =
                  'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-md font-semibold';
              } else if (isUserWrongAnswer) {
                // Wrong Answer in Result Mode
                containerClasses =
                  'border-rose-500 bg-rose-50 text-rose-950 line-through opacity-90';
              }

              return (
                <button
                  key={optIndex}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect && onSelect(optIndex)}
                  className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 cursor-pointer group select-none ${containerClasses} ${
                    disabled ? 'cursor-default' : ''
                  }`}
                >
                  {/* Option Letter Circle Box (NTA Style) */}
                  <div
                    className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                      isSelected && !showCorrectAnswer
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isCorrectAnswer
                        ? 'bg-emerald-600 text-white'
                        : isUserWrongAnswer
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 group-hover:bg-purple-100 group-hover:text-purple-900 group-hover:border-purple-300'
                    }`}
                  >
                    {letterLabel}
                  </div>

                  {/* Option Text with Math Formula rendering */}
                  <div
                    style={{ fontSize: `${15 + fontSizeOffset}px`, lineHeight: '1.6' }}
                    className="flex-1 self-center"
                  >
                    <MathText text={optionText} isHindi={isHindiMode} />
                  </div>

                  {/* Radio Indicator */}
                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-slate-300 bg-white group-hover:border-purple-400'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. EXPLANATION & NCERT CITATION (Shown in Result Mode) */}
        {/* ========================================================================= */}
        {showCorrectAnswer && (
          <div className="mt-6 pt-5 border-t border-slate-200 bg-slate-50/80 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-5 sm:p-7 rounded-b-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Correct Answer: Option ({String.fromCharCode(65 + (question.correctAnswer ?? 0))})
              </span>

              {question.ncertReference && (
                <span className="text-xs text-slate-500 font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  📖 {question.ncertReference}
                </span>
              )}
            </div>

            {question.explanation && (
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-white p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">NCERT Explanation:</span>
                <MathText text={cleanQuestionText(question.explanation)} isHindi={isHindiMode} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: HIGH-RES DIAGRAM LIGHTBOX ZOOM */}
      {/* ========================================================================= */}
      {isZoomModalOpen && diagramUrl && (
        <div
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white p-4 sm:p-6 rounded-2xl max-w-4xl max-h-[90vh] shadow-2xl flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Question {question.id} Diagram (High Resolution)
              </span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto max-h-[70vh] flex items-center justify-center">
              <img
                src={diagramUrl}
                alt="Enlarged Question Diagram"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            <p className="text-xs text-slate-400 font-medium mt-2">
              Pinch or scroll to inspect cellular & anatomical labels
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REPORT QUESTION ERROR */}
      {/* ========================================================================= */}
      {reportedModal && (
        <div
          onClick={() => setReportedModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Report Discrepancy (Q.{question.id})</span>
              </div>
              <button
                type="button"
                onClick={() => setReportedModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Did you find a typo, incorrect answer key, or blurry diagram? Let the ASI Academic team know.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Issue Category:</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500">
                <option>Incorrect Answer Key</option>
                <option>Typo in Question or Options</option>
                <option>Blurry / Missing Diagram</option>
                <option>Formula Formatting Error</option>
                <option>Out of NCERT Syllabus</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportedModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Thank you! Question feedback submitted to ASI Academic Team.');
                  setReportedModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;
