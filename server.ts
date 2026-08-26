import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(customKey?: string): GoogleGenAI {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key missing in Vercel Settings / Environment. Please configure GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey: key });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Teacher & Admin Secure Login Endpoint
  app.post(["/api/teacher-auth", "/api/admin-auth"], (req, res) => {
    try {
      const { email, password } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || process.env.TEACHER_PASSWORD || process.env.TEACHER_ACCESS_KEY || "ASI@2025";

      if (!password || password.trim() !== expectedPassword.trim()) {
        return res.status(401).json({
          success: false,
          error: "Galat password! (Invalid Teacher / Admin Access Key). Access denied."
        });
      }

      const facultyEmail = email?.trim() || "amerj.sir@asi-institute.edu";
      return res.json({
        success: true,
        user: {
          name: "Amerj Sir",
          email: facultyEmail,
          role: "admin",
          department: "Head of NEET & JEE Biology",
          isLoggedIn: true,
          token: "ASI_FACULTY_" + Buffer.from(facultyEmail + Date.now()).toString("base64")
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Auth error" });
    }
  });

  // 2. Telegram Bot Notification & Broadcast Engine
  app.post("/api/telegram/notify", async (req, res) => {
    try {
      const { botToken, chatId, message, parseMode = "HTML" } = req.body;
      const token = botToken?.trim() || process.env.TELEGRAM_BOT_TOKEN;
      const targetChat = chatId?.trim() || process.env.TELEGRAM_CHAT_ID;

      if (!token || !targetChat) {
        return res.status(400).json({
          success: false,
          error: "Telegram Bot Token and Chat ID are required."
        });
      }

      const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChat,
          text: message,
          parse_mode: parseMode,
          disable_web_page_preview: false
        })
      });

      const data = await response.json();
      if (!data.ok) {
        return res.status(400).json({
          success: false,
          error: data.description || "Telegram API failed to dispatch message."
        });
      }

      return res.json({ success: true, telegramResult: data.result });
    } catch (err: any) {
      console.error("Telegram dispatch error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to send Telegram notification" });
    }
  });

  // Telegram Connection Verification Endpoint
  app.post("/api/telegram/test-connection", async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      const token = botToken?.trim() || process.env.TELEGRAM_BOT_TOKEN;
      const targetChat = chatId?.trim() || process.env.TELEGRAM_CHAT_ID;

      if (!token) {
        return res.status(400).json({ success: false, error: "Telegram Bot Token is required." });
      }

      const getMeUrl = `https://api.telegram.org/bot${token}/getMe`;
      const meRes = await fetch(getMeUrl);
      const meData = await meRes.json();

      if (!meData.ok) {
        return res.status(400).json({ success: false, error: "Invalid Bot Token: " + (meData.description || "Unknown") });
      }

      let chatValid = false;
      if (targetChat) {
        const testMsgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
        const testMsg = await fetch(testMsgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChat,
            text: "✅ <b>Amerj Sir Institute</b>: Telegram Bot successfully connected to NEET CBT Platform!",
            parse_mode: "HTML"
          })
        });
        const testData = await testMsg.json();
        chatValid = testData.ok;
      }

      return res.json({
        success: true,
        botInfo: meData.result,
        chatVerified: chatValid
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Smart AI-Assisted Text Extractor for Raw PDFs
  app.post("/api/extract-pdf-text", async (req, res) => {
    try {
      const { rawText, subject = "Biology", apiKey } = req.body;

      if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
        return res.status(400).json({ error: "Extracted text content is empty or too short." });
      }

      const ai = getGeminiClient(apiKey);
      const prompt = `You are a world-class NEET/JEE Examination Paper Parser and OCR Structuring Specialist.
You have been provided with raw text extracted from a coaching PDF or exam paper.

Your Mission:
1. Parse every single MCQ question precisely.
2. Clean option texts: Strip (A), (B), (C), (D) tags so the option string is just the pure answer text.
3. Determine the correct answer (0 for A/1, 1 for B/2, 2 for C/3, 3 for D/4). If no answer key is found, determine the scientifically accurate answer according to NCERT.
4. Provide a rich NCERT-grounded step-by-step Hinglish explanation for each question.
5. Identify the chapter / topic.

Return STRICT JSON ARRAY only:
[
  {
    "question": "Clear, well-punctuated question statement",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": 0,
    "explanation_hinglish": "NCERT step-by-step solution in Hinglish",
    "topic": "${subject}",
    "difficulty": "Medium"
  }
]

RAW EXTRACTED TEXT CONTENT:
${rawText.slice(0, 32000)}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const responseText = response.text || "[]";
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      let parsed = JSON.parse(cleaned);

      let questionsArray: any[] = [];
      if (Array.isArray(parsed)) {
        questionsArray = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        questionsArray = parsed.questions;
      }

      const formatted = questionsArray.map((q: any, idx: number) => ({
        id: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.slice(0, 4).map((opt: any) => String(opt).trim())
          : ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: typeof q.answer === "number" ? q.answer : (typeof q.ans === "number" ? q.ans : 0),
        explanation: q.explanation_hinglish || q.explanation || "NCERT conceptual solution.",
        chapter: q.topic || subject,
        topic: q.topic || subject,
        difficulty: q.difficulty || "Medium"
      }));

      return res.json({ success: true, questions: formatted });
    } catch (err: any) {
      console.error("Smart text parser error:", err);
      return res.status(500).json({ error: err.message || "Failed to parse text with AI." });
    }
  });

  // 2. Scanned PDF Vision OCR Endpoint (Using Gemini Vision for Image-based PDFs)
  app.post("/api/extract-pdf-vision", async (req, res) => {
    try {
      const { images, apiKey } = req.body; // array of base64 data URLs: "data:image/jpeg;base64,..."

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "Scanned PDF page images required." });
      }

      const ai = getGeminiClient(apiKey);
      const visionPrompt = `You are an expert NEET/JEE paper extractor and OCR transcription specialist.
Read all questions from the provided scanned exam paper images.
Extract every MCQ question accurately with all 4 options, identify correct answer if indicated, and provide NCERT explanation in Hinglish.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "question": "Exact question text from the scanned image",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": 0,
    "explanation_hinglish": "NCERT based explanation in Hinglish",
    "topic": "Topic or Subject",
    "difficulty": "Medium"
  }
]

Rules:
- 'answer' must be integer index 0, 1, 2, or 3.
- If options have (A), (B), (C), (D) or 1, 2, 3, 4, clean the option text.
- Do NOT output markdown ticks, backticks, or preamble. Return pure JSON array.`;

      // Build inlineData parts for images (cap at 8 images per request to prevent payload timeout)
      const imageParts = images.slice(0, 8).map((imgUrl: string) => {
        const matches = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          return {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: imgUrl
          }
        };
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: visionPrompt },
              ...imageParts
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      const parsedArray = JSON.parse(cleaned);

      return res.json({ success: true, questions: parsedArray });
    } catch (err: any) {
      console.error("PDF Vision OCR error:", err);
      return res.status(500).json({
        error: err.message || "Failed to extract scanned PDF with Gemini Vision"
      });
    }
  });

  // 3. High Yield AI Generation Endpoint with Auto-Retry (2x)
  app.post("/api/generate-gemini-test", async (req, res) => {
    const { prompt, pdfText, apiKey, count } = req.body;

    if (!prompt && !pdfText) {
      return res.status(400).json({ error: "Prompt ya PDF text provide karein." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient(apiKey);
    } catch (keyErr: any) {
      return res.status(401).json({
        error: "API Key missing in Vercel Settings / Environment. Please configure GEMINI_API_KEY."
      });
    }

    const systemPrompt = `You are an expert NEET/JEE paper setter. Create high-yield, NCERT-based MCQs only. Return ONLY valid JSON array: [{question, options:[4], answer, explanation_hinglish, topic, difficulty}]`;

    const userMessage = `Create ${count || 15} high-yield MCQs for competitive exams (NEET / JEE / SSC).
${pdfText ? `SOURCE PDF TEXT (extract strictly from this content):\n${pdfText.slice(0, 30000)}` : `TOPIC / PROMPT:\n${prompt}`}

Ensure:
1. Every item is an object with 'question', 'options' (array of exactly 4 strings), 'answer' (0-3 integer), 'explanation_hinglish' (detailed NCERT solution in Hinglish), 'topic', and 'difficulty' ('Easy' | 'Medium' | 'Hard').
2. Return ONLY a valid JSON array without any markdown backticks.`;

    // Attempt generation with automatic retry up to 2 times
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userMessage}${attempt > 1 ? "\n\nIMPORTANT: Previous response had invalid JSON. Output strict, valid JSON array only!" : ""}` }]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const responseText = response.text || "";
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        let parsed = JSON.parse(cleaned);

        // Normalize if wrapped in an object { questions: [...] } or direct array
        let questionsArray = [];
        if (Array.isArray(parsed)) {
          questionsArray = parsed;
        } else if (parsed && Array.isArray(parsed.questions)) {
          questionsArray = parsed.questions;
        } else if (parsed && typeof parsed === "object") {
          const possibleArr = Object.values(parsed).find(v => Array.isArray(v));
          if (possibleArr) questionsArray = possibleArr as any[];
        }

        if (questionsArray.length > 0) {
          // Standardize test object
          const formattedQuestions = questionsArray.map((q: any, idx: number) => ({
            id: idx + 1,
            question: q.question || q.q || `Question ${idx + 1}`,
            options: Array.isArray(q.options) && q.options.length >= 2
              ? q.options.slice(0, 4).map((opt: any) => String(opt).trim())
              : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: typeof q.answer === "number" ? q.answer : (typeof q.ans === "number" ? q.ans : 0),
            explanation: q.explanation_hinglish || q.solution || q.explanation || "NCERT line-by-line concept.",
            chapter: q.topic || "Biology High Yield"
          }));

          const testObj = {
            title: (typeof parsed === "object" && !Array.isArray(parsed) && parsed.title) ? parsed.title : (prompt ? `High-Yield Mock: ${prompt.slice(0, 40)}` : "NEET High-Yield Biology Mock"),
            subject: (typeof parsed === "object" && !Array.isArray(parsed) && parsed.subject) ? parsed.subject : "Biology",
            category: (typeof parsed === "object" && !Array.isArray(parsed) && parsed.category) ? parsed.category : "NEET Full Syllabus",
            duration: Math.max(15, Math.round(formattedQuestions.length * 1.5)),
            difficulty: "Medium",
            questions: formattedQuestions
          };

          return res.json({ success: true, test: testObj, rawQuestions: formattedQuestions });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation attempt ${attempt} failed:`, err.message);
      }
    }

    return res.status(500).json({
      error: lastError?.message || "AI se valid JSON test generate nahi ho paya. Please try again."
    });
  });

  // 4. Teacher AI Tools API: Question Generator, Improver, Explanations, Quality Checker, Performance Analysis, Blueprint
  app.post("/api/ai/question-generator", async (req, res) => {
    try {
      const { topic, format, difficulty, count = 5, apiKey } = req.body;
      const ai = getGeminiClient(apiKey);
      const prompt = `You are a premier NTA NEET paper setter.
Generate ${count} high-yield NEET Biology/Science MCQs based on:
Topic/Content: "${topic || 'Cell Biology, Genetics, Human Physiology'}"
Format: ${format || 'Single Choice MCQ (Standard NEET pattern)'} (Options can be Single Choice, Assertion-Reason, Statement I & Statement II, Match the Following List I/II)
Difficulty Level: ${difficulty || 'NEET'} (Options: Easy / Moderate / NEET / Advanced NEET)

Return ONLY a valid JSON array:
[
  {
    "question": "Question statement formatted strictly for NEET CBT",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation_hinglish": "NCERT step-by-step concept explanation in Hinglish",
    "ncertReference": "NCERT Class 11/12 Chapter Name, Page XX",
    "chapter": "${topic || 'General Biology'}",
    "difficulty": "${difficulty || 'Medium'}"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, questions: Array.isArray(parsed) ? parsed : (parsed.questions || []) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to generate questions." });
    }
  });

  app.post("/api/ai/improve-question", async (req, res) => {
    try {
      const { question, options, correctAnswer, apiKey } = req.body;
      const ai = getGeminiClient(apiKey);
      const prompt = `You are an expert NEET question quality improver.
Improve the following question while STRICTLY preserving the core scientific concept and original correct answer key (Option index ${correctAnswer}):

Question: "${question}"
Options: ${JSON.stringify(options)}
Correct Answer Index: ${correctAnswer}

Your Task:
1. Eliminate ambiguity and vague wording.
2. Standardize distractors to true NEET difficulty with plausible scientific options.
3. Ensure no grammatical or scientific inaccuracies.
4. Provide a rich NCERT-grounded step-by-step Hinglish explanation.

Return ONLY a valid JSON object:
{
  "improvedQuestion": "Refined question text",
  "improvedOptions": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": ${correctAnswer},
  "explanation": "NCERT conceptual explanation in Hinglish",
  "ncertReference": "NCERT reference",
  "changesMade": "Summary of improvements made (e.g. removed ambiguous wording in option B, enhanced scientific precision)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, ...parsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to improve question." });
    }
  });

  app.post("/api/ai/quality-checker", async (req, res) => {
    try {
      const { questions, apiKey } = req.body;
      const ai = getGeminiClient(apiKey);
      const prompt = `You are an NTA NEET Paper Quality Auditor.
Audit these questions:
${JSON.stringify(questions)}

Evaluate:
1. Duplicate / repetitive concepts.
2. Key accuracy & potential ambiguous options.
3. Syllabus relevance & alignment with latest NEET pattern.
4. Difficulty balance.

Return ONLY valid JSON:
{
  "qualityScore": 92,
  "overallVerdict": "High quality NEET paper with balanced distribution",
  "flags": [
    { "questionId": 1, "issue": "Option C could be slightly ambiguous", "suggestion": "Clarify enzyme substrate concentration condition." }
  ],
  "syllabusCoverage": ["Genetics: 40%", "Human Physiology: 35%", "Ecology: 25%"],
  "difficultyDistribution": { "Easy": 3, "Medium": 5, "Hard": 2 }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, audit: parsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Quality check failed." });
    }
  });

  app.post("/api/ai/performance-analysis", async (req, res) => {
    try {
      const { testTitle, totalAttempts, averageScore, studentMetrics, apiKey } = req.body;
      const ai = getGeminiClient(apiKey);
      const prompt = `You are an AI NEET Academic Director & Performance Coach.
Analyze the following student test cohort performance:
Test: "${testTitle || 'NEET Full Syllabus Biology Mock'}"
Total Student Attempts: ${totalAttempts || 1240}
Average Score: ${averageScore || 260}/360
Cohort Highlights: ${JSON.stringify(studentMetrics || {})}

Return a comprehensive AI analysis as valid JSON:
{
  "summary": "Brief 2-sentence executive summary of batch performance",
  "weakChapters": ["Genetics & Evolution (42% accuracy)", "Plant Physiology (48% accuracy)"],
  "strongChapters": ["Human Reproduction (88% accuracy)", "Ecology (82% accuracy)"],
  "timeAnalysis": "Average time per question was 45s, students rushed during Assertion-Reason questions leading to negative marks.",
  "difficultyAccuracy": { "Easy": "91%", "Medium": "68%", "Hard": "34%" },
  "actionableSuggestions": [
    "Conduct a 1-hour dedicated live doubt-solving session on Pedigree Analysis & Linkage maps.",
    "Share 20 high-yield Assertion-Reason practice questions for Plant Physiology."
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, analysis: parsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Performance analysis failed." });
    }
  });

  app.post("/api/ai/blueprint", async (req, res) => {
    try {
      const { subject, totalQuestions = 50, pattern = "NEET 2026", apiKey } = req.body;
      const ai = getGeminiClient(apiKey);
      const prompt = `You are an NTA Exam Director. Generate a balanced blueprint for ${subject || 'NEET Biology'} following the ${pattern} pattern.
Total Questions: ${totalQuestions} (Section A: 35 mandatory, Section B: 15 with 10 to attempt).

Return ONLY valid JSON:
{
  "patternName": "${pattern} Standard Blueprint",
  "sectionA": {
    "count": 35,
    "type": "Mandatory",
    "topics": [
      { "chapter": "Cell Biology & Genetics", "questions": 12, "difficulty": "Medium" },
      { "chapter": "Human Physiology", "questions": 11, "difficulty": "Medium" },
      { "chapter": "Plant Physiology & Ecology", "questions": 12, "difficulty": "Easy-Medium" }
    ]
  },
  "sectionB": {
    "count": 15,
    "type": "Attempt any 10",
    "topics": [
      { "chapter": "Biotechnology & Applications", "questions": 5, "difficulty": "Hard" },
      { "chapter": "Reproduction & Genetics Advanced", "questions": 5, "difficulty": "Hard" },
      { "chapter": "Diversity in Living World", "questions": 5, "difficulty": "Medium" }
    ]
  },
  "cognitiveTaxonomy": {
    "Recall/FactBased": "40%",
    "ConceptualUnderstanding": "35%",
    "ApplicationAndAnalytical": "25%"
  },
  "recommendations": "Ensure Assertion-Reason questions are framed with clear, unambiguous reasoning from NCERT lines."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return res.json({ success: true, blueprint: parsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Blueprint generation failed." });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer(); 
