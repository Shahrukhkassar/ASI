import { GoogleGenAI } from '@google/genai';
import { Question } from '../types';

export interface DoubtSolverOptions {
  question: Question;
  doubtQuery: string;
  mode?: 'test' | 'result';
  studentName?: string;
  currentSelectedOption?: number | null;
  onChunk?: (chunkText: string, fullTextSoFar: string) => void;
}

export interface DoubtSolverResponse {
  success: boolean;
  text: string;
  error?: string;
  fromCache?: boolean;
}

/**
 * Safely retrieve the Gemini API key from Vite import.meta or window globals
 */
export function getGeminiApiKey(): string {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_GEMINI_API_KEY) {
      return String(metaEnv.VITE_GEMINI_API_KEY).trim();
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY) {
      return String((window as any).GEMINI_API_KEY).trim();
    }
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      return String(process.env.GEMINI_API_KEY).trim();
    }
  } catch {
    // ignore
  }

  return '';
}

/**
 * Exponential backoff sleep helper
 */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a cache key for caching repeated AI queries
 */
function createCacheKey(questionId: number | string, mode: string, query: string): string {
  const normalized = query.trim().toLowerCase().slice(0, 100);
  return `asi_gemini_cache_q${questionId}_${mode}_${encodeURIComponent(normalized)}`;
}

/**
 * Core AI Doubt Solver with Streaming, Auto-Retry (3x), Caching & NCERT Heuristics
 */
export async function askGeminiDoubt(options: DoubtSolverOptions): Promise<DoubtSolverResponse> {
  const {
    question,
    doubtQuery,
    mode = 'result',
    studentName = 'Aspirant',
    currentSelectedOption = null,
    onChunk
  } = options;

  const trimmedQuery = doubtQuery.trim();
  if (!trimmedQuery) {
    return {
      success: false,
      text: 'Kripya apna question ya doubt type karein.',
      error: 'Empty query'
    };
  }

  // 1. Check LocalStorage Cache to avoid repeat API calls & minimize latency
  const cacheKey = createCacheKey(question.id, mode, trimmedQuery);
  try {
    const cachedResponse = localStorage.getItem(cacheKey);
    if (cachedResponse) {
      if (onChunk) {
        onChunk(cachedResponse, cachedResponse);
      }
      return {
        success: true,
        text: cachedResponse,
        fromCache: true
      };
    }
  } catch {
    // ignore storage error
  }

  const apiKey = getGeminiApiKey();

  // 2. Fallback when API key is not configured in .env
  if (!apiKey || apiKey.includes('placeholder')) {
    const offlineHint =
      mode === 'test'
        ? `💡 **ASI AI Concept Hint (${question.chapter || 'NCERT Biology'}):**\n- Is question me core concept **${question.topic || 'NCERT'}** par focus karo.\n- Un options ko eliminate karo jo basic NCERT definition ke opposite hain.\n- *API key missing: Add \`VITE_GEMINI_API_KEY\` in .env for full live AI responses.*`
        : `🎯 **ASI AI Detailed Solution:**\n- **Sahi Option:** (${String.fromCharCode(65 + (question.correctAnswer || 0))}) ${question.options?.[question.correctAnswer || 0] || ''}\n- **Explanation:** ${question.explanation || 'NCERT line-to-line concept.'}\n📌 **Ref:** ${question.ncertReference || 'NCERT Biology Textbook'}\n*(Add \`VITE_GEMINI_API_KEY\` in .env for custom live doubts)*`;

    if (onChunk) {
      onChunk(offlineHint, offlineHint);
    }
    return {
      success: true,
      text: offlineHint,
      error: 'AI key missing - add in .env'
    };
  }

  // 3. Setup Gemini Client & Prompt
  const systemInstruction = `You are ASI AI, an expert NEET/JEE teacher for Amerj Sir Institute in Mawana/Niwari.
You explain strictly from NCERT Biology/Physics/Chemistry syllabus.
Language: Hinglish (natural Hindi + English mix that Indian aspirants easily understand).
Tone: Highly encouraging, mentor-like, concise and pedagogical.
RULES:
1. If mode is 'test': NEVER give the direct final answer or option letter! Give a clear conceptual hint, guiding question, and elimination trick so the student figures it out themselves.
2. If mode is 'result': Give a crystal clear, step-by-step NCERT explanation, why the correct answer is right, why common traps are wrong, and provide a 1-line mnemonic or trick.
3. Keep the explanation strictly UNDER 90 words.
4. Format key terms in **bold** and any math/chemical formula in KaTeX ($...$ for inline, $$...$$ for block).
5. Always end with exact NCERT chapter/page citation if available.`;

  const promptContext = `
MODE: ${mode.toUpperCase()}
QUESTION: ${question.question}
OPTIONS:
A) ${question.options?.[0] || ''}
B) ${question.options?.[1] || ''}
C) ${question.options?.[2] || ''}
D) ${question.options?.[3] || ''}
CORRECT OPTION: Option ${String.fromCharCode(65 + (question.correctAnswer || 0))} (${question.options?.[question.correctAnswer || 0] || ''})
NCERT REFERENCE: ${question.ncertReference || 'NCERT Textbook'}
OFFICIAL EXPLANATION: ${question.explanation || 'Standard NCERT explanation'}
STUDENT SELECTED OPTION: ${currentSelectedOption !== null && currentSelectedOption !== undefined ? `Option ${String.fromCharCode(65 + currentSelectedOption)}` : 'Not Selected yet'}
STUDENT'S SPECIFIC DOUBT: "${trimmedQuery}"
`;

  // 4. Multi-Attempt Retry with Exponential Backoff (3 attempts)
  let lastErrorMessage = '';
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Preferred model: gemini-2.5-flash (with automatic fallback to gemini-1.5-flash)
      const modelName = attempt === 3 ? 'gemini-1.5-flash' : 'gemini-2.5-flash';

      // Attempt streaming first if onChunk callback provided
      if (onChunk) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: promptContext,
            config: { systemInstruction }
          });

          let accumulatedText = '';
          for await (const chunk of responseStream) {
            const chunkText = chunk.text || '';
            accumulatedText += chunkText;
            onChunk(chunkText, accumulatedText);
          }

          if (accumulatedText.trim()) {
            // Save to Cache
            try {
              localStorage.setItem(cacheKey, accumulatedText);
            } catch {
              // ignore
            }

            return {
              success: true,
              text: accumulatedText
            };
          }
        } catch (streamErr: any) {
          console.warn(`Streaming attempt ${attempt} failed, falling back to standard generateContent:`, streamErr?.message);
        }
      }

      // Standard non-streaming generateContent
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptContext,
        config: { systemInstruction }
      });

      const responseText = response.text || '';
      if (responseText.trim()) {
        // Save to Cache
        try {
          localStorage.setItem(cacheKey, responseText);
        } catch {
          // ignore
        }

        if (onChunk) {
          onChunk(responseText, responseText);
        }

        return {
          success: true,
          text: responseText
        };
      }
    } catch (err: any) {
      lastErrorMessage = err?.message || String(err);
      console.warn(`Gemini doubt request attempt ${attempt}/${maxAttempts} failed:`, lastErrorMessage);

      // Check for Quota Exceeded (429)
      if (lastErrorMessage.includes('429') || lastErrorMessage.toLowerCase().includes('quota') || lastErrorMessage.toLowerCase().includes('resource_exhausted')) {
        const busyMessage = '⚠️ AI busy, try after 1 min (Quota limit reached). NCERT concepts are available in solution mode.';
        if (onChunk) onChunk(busyMessage, busyMessage);
        return {
          success: false,
          text: busyMessage,
          error: 'AI busy, try after 1 min'
        };
      }

      if (attempt < maxAttempts) {
        // Exponential backoff: 800ms -> 1600ms
        await wait(800 * Math.pow(2, attempt - 1));
      }
    }
  }

  // If all 3 attempts failed
  const friendlyError = '⚠️ Network connection issue ya API timeout. Kripya punah prayas karein.';
  if (onChunk) {
    onChunk(friendlyError, friendlyError);
  }

  return {
    success: false,
    text: friendlyError,
    error: lastErrorMessage
  };
}

export default askGeminiDoubt;
