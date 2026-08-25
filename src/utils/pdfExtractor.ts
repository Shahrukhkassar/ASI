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
 * Extract questions from scanned PDF page images using Gemini Vision API
 */
export async function extractQuestionsFromImagesWithGemini(
  images: string[],
  apiKey?: string,
  onProgress?: (msg: string) => void
): Promise<ExtractedMCQ[]> {
  if (onProgress) {
    onProgress('Gemini 1.5/2.5 Flash Vision se scanned pages padhe jaa rahe hain...');
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
    throw new Error('Scanned PDF detected (<100 characters text). Gemini API key required for Vision OCR.');
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
    "topic": "Topic",
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
        statusText: `Page ${i}/${totalPages} reading...`,
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
        statusText: `Gemini Vision ne ${directQuestions.length} MCQs extract kar liye!`,
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
