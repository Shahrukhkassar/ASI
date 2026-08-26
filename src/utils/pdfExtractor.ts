import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is properly configured
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedMCQ {
  id?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
}

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  statusText: string;
  isScanned?: boolean;
  percentage: number;
}

/**
 * Clean extracted text from headers, footers, watermarks, and page numbers
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';
  return text
    // Remove Page headers/footers like "Page 1 of 12", "1 / 15", "Page - 4"
    .replace(/(?:Page\s*\d+\s*(?:of|\/)\s*\d+|\bPage\s*[-:]?\s*\d+\b|\b\d+\s*\/\s*\d+\b)/gi, '')
    // Remove repeated institute watermarks or URL notices
    .replace(/(?:Downloaded from|www\.[^\s]+|https?:\/\/[^\s]+|All rights reserved|Confidential)/gi, '')
    // Replace multiple spaces with single space
    .replace(/[ \t]+/g, ' ')
    // Remove excessive empty lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Robust Regex MCQ Parser with separate Answer Key matrix detector
 */
export function parseMCQTextRobust(text: string, defaultSubject = 'Biology'): ExtractedMCQ[] {
  if (!text || !text.trim()) return [];

  const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if there is an Answer Key section at the bottom (e.g. "ANSWER KEY 1. A 2. C 3. B" or "ANSWERS: 1(a), 2(c)...")
  const answerKeyMap: Record<number, number> = {};
  const answerKeySectionMatch = cleanedText.match(/(?:ANSWER\s*KEY|ANSWERS|KEY|HINTS\s*&\s*SOLUTIONS)[\s\S]*$/i);
  if (answerKeySectionMatch) {
    const keySectionText = answerKeySectionMatch[0];
    const keyItemRegex = /(?:Q[\s.:]*)?(\d+)[\s.:)\-]*\(?([A-Da-d1-4])\)?/g;
    let keyMatch;
    while ((keyMatch = keyItemRegex.exec(keySectionText)) !== null) {
      const qNum = parseInt(keyMatch[1], 10);
      const ansChar = keyMatch[2].toUpperCase();
      let ansIdx = 0;
      if (['A', '1'].includes(ansChar)) ansIdx = 0;
      else if (['B', '2'].includes(ansChar)) ansIdx = 1;
      else if (['C', '3'].includes(ansChar)) ansIdx = 2;
      else if (['D', '4'].includes(ansChar)) ansIdx = 3;
      answerKeyMap[qNum] = ansIdx;
    }
  }

  // Split by questions: matches Q1., Q.1, 1., Question 1:, Q 1:, etc.
  const questionRegex = /(?:^|\n)\s*(?:(?:Q|Question|Que|Ques)[\s.:)]*\s*(\d+)[\s.:)]+|\b(\d+)[\s.:)]+)\s+/gi;
  
  const indices: { index: number; qNum: number }[] = [];
  let match;

  while ((match = questionRegex.exec(cleanedText)) !== null) {
    const qNum = parseInt(match[1] || match[2], 10);
    indices.push({ index: match.index, qNum });
  }

  const extracted: ExtractedMCQ[] = [];

  for (let i = 0; i < indices.length; i++) {
    const currentStart = indices[i].index;
    const nextStart = i + 1 < indices.length ? indices[i + 1].index : cleanedText.length;
    const block = cleanedText.slice(currentStart, nextStart).trim();
    const qNum = indices[i].qNum;

    // Clean block from initial question number label
    const blockWithoutHeader = block.replace(/^(?:(?:Q|Question|Que|Ques)[\s.:)]*\s*\d+[\s.:)]+|\b\d+[\s.:)]+)\s*/i, '').trim();

    // Extract options: matches (A), (B), (C), (D) or A), B), C), D) or (1), (2), (3), (4)
    const optionSplitRegex = /(?:^|\n|\s+)(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])[\.\)])\s+/g;
    
    const optMatches: { index: number; label: string }[] = [];
    let optMatch;
    while ((optMatch = optionSplitRegex.exec(blockWithoutHeader)) !== null) {
      optMatches.push({
        index: optMatch.index,
        label: (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase()
      });
    }

    if (optMatches.length >= 2) {
      const questionPrompt = blockWithoutHeader.slice(0, optMatches[0].index).trim();
      const optionsList: string[] = [];

      for (let j = 0; j < optMatches.length; j++) {
        const optStart = optMatches[j].index;
        const optEnd = j + 1 < optMatches.length ? optMatches[j + 1].index : blockWithoutHeader.length;
        let optText = blockWithoutHeader.slice(optStart, optEnd).trim();
        
        // Remove option indicator like (A) or A.
        optText = optText.replace(/^(?:\([A-Da-d1-4]\)|\[[A-Da-d1-4]\]|[A-Da-d1-4][\.\)])\s*/i, '').trim();
        
        // Check if there is an Answer / Explanation inside the last option
        if (j === optMatches.length - 1) {
          const ansIndex = optText.search(/(?:Answer|Ans|Correct Option|Explanation|Exp)[\s.:]/i);
          if (ansIndex !== -1) {
            optText = optText.slice(0, ansIndex).trim();
          }
        }
        
        if (optText) {
          optionsList.push(optText);
        }
      }

      while (optionsList.length < 4) {
        optionsList.push(`Option ${String.fromCharCode(65 + optionsList.length)}`);
      }

      // Determine correct answer
      let correctIdx = 0;
      if (answerKeyMap[qNum] !== undefined) {
        correctIdx = answerKeyMap[qNum];
      } else {
        const ansMatch = blockWithoutHeader.match(/(?:Answer|Ans|Correct(?:\s+Option)?)[\s.:]*\s*(?:\(?([A-Da-d1-4])\)?)/i);
        if (ansMatch) {
          const rawAns = ansMatch[1].toUpperCase();
          if (['A', '1'].includes(rawAns)) correctIdx = 0;
          else if (['B', '2'].includes(rawAns)) correctIdx = 1;
          else if (['C', '3'].includes(rawAns)) correctIdx = 2;
          else if (['D', '4'].includes(rawAns)) correctIdx = 3;
        }
      }

      // Extract Explanation
      let explanation = '';
      const expMatch = blockWithoutHeader.match(/(?:Explanation|Exp|Sol|Solution)[\s.:]*([\s\S]+?)(?=$)/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
      }

      extracted.push({
        id: extracted.length + 1,
        question: questionPrompt || `Question ${extracted.length + 1}`,
        options: optionsList.slice(0, 4),
        correctAnswer: correctIdx,
        explanation: explanation || 'NCERT concept explanation.',
        chapter: defaultSubject,
        topic: defaultSubject,
        difficulty: 'Medium'
      });
    }
  }

  return extracted;
}

/**
 * Render a PDF page onto an in-memory canvas and return base64 JPEG
 */
export async function renderPdfPageToImage(page: any, scale = 1.4): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Call Server-Side AI Smart Parser for 100% accurate MCQ structuring
 */
export async function parseTextWithServerAI(
  rawText: string,
  subject = 'Biology',
  apiKey?: string
): Promise<ExtractedMCQ[]> {
  try {
    const res = await fetch('/api/extract-pdf-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, subject, apiKey })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (err) {
    console.warn('Server-side AI smart parsing failed, falling back to local:', err);
  }

  return parseMCQTextRobust(rawText, subject);
}

/**
 * Extract questions from scanned PDF page images using Gemini Vision API
 */
export async function extractQuestionsFromImagesWithGemini(
  images: string[],
  apiKey?: string,
  onProgress?: (msg: string) => void
): Promise<ExtractedMCQ[]> {
  if (onProgress) {
    onProgress('Gemini Vision se scanned pages padhe jaa rahe hain...');
  }

  // 1. Try server endpoint
  try {
    const res = await fetch('/api/extract-pdf-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, apiKey })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        return normalizeQuestions(data.questions);
      }
    }
  } catch (err) {
    console.warn('Server Vision OCR failed, checking client fallback:', err);
  }

  // 2. Direct client fallback if API key is provided
  const clientKey = apiKey?.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!clientKey) {
    throw new Error('Scanned PDF detected. Gemini API key required for Vision OCR.');
  }

  const visionPrompt = `You are an expert NEET/JEE paper setter and OCR extractor.
Read all MCQs from the provided scanned exam images.
Return ONLY a valid JSON array matching this schema:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation_hinglish": "NCERT concept explanation in Hinglish",
    "topic": "Biology",
    "difficulty": "Medium"
  }
]`;

  const imageParts = images.slice(0, 6).map((imgUrl) => {
    const matches = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
    return {
      inlineData: {
        mimeType: matches ? matches[1] : 'image/jpeg',
        data: matches ? matches[2] : imgUrl
      }
    };
  });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: visionPrompt }, ...imageParts] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'Gemini Vision Error');
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (Array.isArray(parsed)) {
    return normalizeQuestions(parsed);
  } else if (parsed && Array.isArray(parsed.questions)) {
    return normalizeQuestions(parsed.questions);
  }

  throw new Error('Could not parse questions from scanned images.');
}

/**
 * Normalizes question objects to standard format
 */
function normalizeQuestions(rawList: any[]): ExtractedMCQ[] {
  return rawList.map((item, idx) => ({
    id: idx + 1,
    question: item.question || item.q || `Question ${idx + 1}`,
    options: Array.isArray(item.options) && item.options.length >= 2
      ? item.options.slice(0, 4).map((o: any) => String(o).trim())
      : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: typeof item.answer === 'number' ? item.answer : (typeof item.ans === 'number' ? item.ans : 0),
    explanation: item.explanation_hinglish || item.solution || item.explanation || 'Detailed NCERT step-by-step concept.',
    chapter: item.topic || 'Biology',
    topic: item.topic || 'General',
    difficulty: item.difficulty || 'Medium'
  }));
}

/**
 * Main robust PDF extraction pipeline with scanned fallback & real-time progress
 */
export async function extractFromPdfFile(
  file: File,
  apiKey?: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<{ text: string; isScanned: boolean; directQuestions?: ExtractedMCQ[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  let aggregatedText = '';
  const scannedPageImages: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const percentage = Math.round((i / totalPages) * 70);
    if (onProgress) {
      onProgress({
        currentPage: i,
        totalPages,
        statusText: `Reading Page ${i}/${totalPages}...`,
        percentage
      });
    }

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    
    // If page text is very short (< 30 chars), treat page as scanned image
    if (pageText.trim().length < 30 && i <= 8) {
      try {
        const img = await renderPdfPageToImage(page);
        scannedPageImages.push(img);
      } catch (imgErr) {
        console.warn(`Could not render page ${i} to image:`, imgErr);
      }
    }

    aggregatedText += `\n--- Page ${i} ---\n` + pageText;
  }

  const cleaned = cleanExtractedText(aggregatedText);

  // Check if entire PDF has less than 100 characters
  const isScanned = cleaned.length < 100;

  if (isScanned && scannedPageImages.length > 0) {
    if (onProgress) {
      onProgress({
        currentPage: totalPages,
        totalPages,
        statusText: 'Scanned PDF detected! Reading pages with Gemini Vision OCR...',
        isScanned: true,
        percentage: 85
      });
    }

    const directQuestions = await extractQuestionsFromImagesWithGemini(
      scannedPageImages,
      apiKey,
      (msg) => {
        if (onProgress) {
          onProgress({
            currentPage: totalPages,
            totalPages,
            statusText: msg,
            isScanned: true,
            percentage: 92
          });
        }
      }
    );

    if (onProgress) {
      onProgress({
        currentPage: totalPages,
        totalPages,
        statusText: `Gemini Vision extracted ${directQuestions.length} MCQs!`,
        isScanned: true,
        percentage: 100
      });
    }

    return {
      text: cleaned,
      isScanned: true,
      directQuestions
    };
  }

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      statusText: `Extracted ${cleaned.length} characters across ${totalPages} pages.`,
      isScanned: false,
      percentage: 100
    });
  }

  return {
    text: cleaned,
    isScanned: false
  };
}
