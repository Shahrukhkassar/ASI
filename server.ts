import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(customKey?: string): GoogleGenAI {
  const key = customKey?.trim() || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured on server and no API key was provided.");
  }
  return new GoogleGenAI({ apiKey: key });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Server-side Gemini Test Generation API
  app.post("/api/generate-gemini-test", async (req, res) => {
    try {
      const { prompt, pdfText, apiKey } = req.body;

      if (!prompt && !pdfText) {
        return res.status(400).json({ error: "Prompt or PDF text is required." });
      }

      const ai = getGeminiClient(apiKey);

      const systemPrompt = `You are an expert test & MCQ creator for NEET, JEE, SSC, Bank, and competitive exams.
Generate a complete, high quality test in STRICT JSON format ONLY, without markdown wrapping or commentary.

Output schema:
{
  "title": "Exam / Test Title (e.g. NEET 2026 Biology Grand Mock or SSC GD Mock)",
  "subject": "Biology / Physics / Chemistry / Maths / General",
  "category": "NEET Full Syllabus / Class 11 Biology / Class 12 Biology / High Yield / General",
  "duration": 30,
  "difficulty": "Easy / Medium / Hard",
  "questions": [
    {
      "q": "Question text with clear scientific or factual phrasing",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "ans": 0,
      "solution": "Detailed step-by-step NCERT explanation"
    }
  ]
}

Rules:
- Generate 10 to 20 MCQs unless the user asks for a specific count.
- 'ans' must be the 0-based integer index of the correct option (0 for A, 1 for B, 2 for C, 3 for D).
- If PDF text is provided, extract and formulate questions STRICTLY from that PDF content.
- If a custom prompt is provided, follow the subject, topic, and difficulty specified.
- Ensure all 4 options are distinct, plausible, and grammatically sound.
- Return ONLY valid JSON.`;

      const contents = `PDF TEXT:
${pdfText ? pdfText.slice(0, 30000) : "NO PDF"}

USER PROMPT:
${prompt || "Generate 15 high-yield competitive exam MCQs."}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\n" + contents }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      const parsedJson = JSON.parse(cleaned);

      return res.json({ success: true, test: parsedJson });
    } catch (err: any) {
      console.error("Gemini generation error:", err);
      return res.status(500).json({
        error: err.message || "Failed to generate test with Gemini AI"
      });
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
