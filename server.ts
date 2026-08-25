  const isScanned = avgCharsPerPage < 100; // Heuristic for scanned PDF

  const clean = fullText
   .replace(/[\t]{2,}/g, " ")
   .replace(/ {3,}/g, " ")
   .replace(/(\w)-\n(\w)/g, "$1$2")
   .trim();

  return { text: clean, pages: pdf.numPages, isScanned };
}

// ================= VALIDATION SCHEMAS =================
const generateTestSchema = z.object({
  prompt: z.string().optional(),
  pdfText: z.string().optional(),
  apiKey: z.string().optional(),
  count: z.number().min(1).max(50).optional().default(15),
}).refine(data => data.prompt || data.pdfText, { message: "Prompt or pdfText required" });

// ================= ROUTES =================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString(), version: "3.0-advanced" });
});

app.post("/api/teacher-auth", (req, res) => {
  try {
    const { email, password } = req.body;
    const expected = process.env.TEACHER_PASSWORD || process.env.TEACHER_ACCESS_KEY || "ASI@2025";
    if (!password || password.trim()!== expected.trim()) {
      return res.status(401).json({ success: false, error: "Galat password! Access denied." });
    }
    const facultyEmail = email?.trim() || "amerj.sir@asi-institute.edu";
    return res.json({
      success: true,
      user: {
        name: "Amerj Sir", email: facultyEmail, role: "teacher",
        department: "Head of NEET & JEE Biology", isLoggedIn: true,
        token: "ASI_FACULTY_" + Buffer.from(facultyEmail + Date.now()).toString("base64")
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ULTIMATE PDF ROUTE
app.post("/api/parse-pdf-upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "PDF file missing. Field name should be 'pdf'" });
    const { apiKey, count = 15 } = req.body;

    console.log(`[PDF] Processing ${req.file.originalname} - ${ (req.file.size/1024).toFixed(1)}KB`);
    const { text: cleanText, pages, isScanned } = await parsePdfAdvanced(req.file.buffer);
    console.log(`[PDF] Extracted ${cleanText.length} chars from ${pages} pages. Scanned: ${isScanned}`);

    if (isScanned || cleanText.length < 100) {
      return res.status(422).json({
        success: false,
        isScanned: true,
        error: "Ye scanned PDF hai. Isme text layer nahi hai. Frontend se /api/extract-pdf-vision use karo (images bhej ke).",
        extractedLength: cleanText.length
      });
    }

    const ai = getGeminiClient(apiKey);
    const prompt = `You are NTA NEET paper setter. From this PDF content, create ${count} high-yield MCQs.
    SOURCE:
    ${cleanText.slice(0, 40000)}

    Return ONLY JSON array: [{question, options:[4 strings], answer:0-3, explanation_hinglish, topic, difficulty}] No markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    let questionsArray: any[] = [];
    try {
      const cleaned = (response.text || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      questionsArray = Array.isArray(parsed)? parsed : parsed.questions || Object.values(parsed).find(v => Array.isArray(v)) as any[] || [];
    } catch (e) {
      throw new Error("AI returned invalid JSON");
    }

    const formatted = questionsArray.map((q: any, idx: number) => ({
      id: idx + 1,
      question: q.question,
      options: q.options?.slice(0, 4).map((o: any) => String(o).trim()) || [],
      correctAnswer: typeof q.answer === 'number'? q.answer : 0,
      explanation: q.explanation_hinglish || q.explanation || "NCERT based",
      chapter: q.topic || "High Yield"
    })).filter((q: any) => q.question && q.options.length === 4);

    return res.json({
      success: true,
      meta: { pages, extractedChars: cleanText.length, originalFile: req.file.originalname },
      extractedTextPreview: cleanText.slice(0, 2000),
      test: {
        title: `Custom Test: ${req.file.originalname.replace('.pdf','')}`,
        subject: "Biology", category: "Custom PDF", duration: formatted.length * 2, difficulty: "Medium",
        questions: formatted
      }
    });

  } catch (err: any) {
    console.error("[PDF Upload Error]", err);
    return res.status(500).json({ error: err.message || "PDF processing failed" });
  }
});

// Vision OCR
app.post("/api/extract-pdf-vision", async (req, res) => {
  try {
    const { images, apiKey } = req.body;
    if (!images ||!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: "images[] required" });
    const ai = getGeminiClient(apiKey);
    const visionPrompt = `You are NEET paper OCR. Extract all MCQs. Return ONLY JSON array: [{question, options:[4], answer:0-3, explanation_hinglish, topic, difficulty}]`;
    const imageParts = images.slice(0, 10).map((imgUrl: string) => {
      const m = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
      return { inlineData: { mimeType: m? m[1] : "image/jpeg", data: m? m[2] : imgUrl } };
    });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: visionPrompt },...imageParts] }],
      config: { responseMimeType: "application/json" }
    });
    const cleaned = (response.text || "").replace(/```json|```/g, "").trim();
    return res.json({ success: true, questions: JSON.parse(cleaned) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Generate test (with validation)
app.post("/api/generate-gemini-test", async (req, res) => {
  try {
    const parsed = generateTestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { prompt, pdfText, apiKey, count } = parsed.data;

    const ai = getGeminiClient(apiKey);
    const userMessage = `Create ${count} high-yield NEET MCQs.
    ${pdfText? `FROM PDF:\n${pdfText.slice(0, 40000)}` : `TOPIC: ${prompt}`}
    Return ONLY valid JSON array with fields: question, options[4], answer(0-3), explanation_hinglish, topic, difficulty.`;

    let lastError: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          config: { responseMimeType: "application/json" }
        });
        const cleaned = (response.text || "").replace(/```json|```/g, "").trim();
        let parsedJson = JSON.parse(cleaned);
        let questionsArray = Array.isArray(parsedJson)? parsedJson : parsedJson.questions || Object.values(parsedJson).find(v => Array.isArray(v)) as any[] || [];

        if (questionsArray.length > 0) {
          const formatted = questionsArray.map((q: any, idx: number) => ({
            id: idx + 1, question: q.question, options: q.options.slice(0,4).map((o:any)=>String(o).trim()),
            correctAnswer: q.answer?? 0, explanation: q.explanation_hinglish || q.explanation || "NCERT concept", chapter: q.topic || "Biology"
          }));
          return res.json({ success: true, test: { title: prompt? `Mock: ${prompt.slice(0,40)}` : "NEET Mock", subject: "Biology", category: "NEET", duration: formatted.length*1.5, difficulty: "Medium", questions: formatted } });
        }
      } catch (e: any) { lastError = e; }
    }
    throw lastError;
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Generation failed" });
  }
});

// --- TERE SAARE /api/ai/* ROUTES SAME TO SAME ---
app.post("/api/ai/question-generator", async (req, res) => {
  try {
    const { topic, format, difficulty, count = 5, apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const prompt = `Generate ${count} NEET MCQs. Topic: ${topic}. Format: ${format}. Difficulty: ${difficulty}. Return JSON array: [{question, options[4], answer, explanation_hinglish, ncertReference, chapter, difficulty}]`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    const parsed = JSON.parse((response.text||"[]").replace(/```json|```/g,"").trim());
    return res.json({ success: true, questions: Array.isArray(parsed)? parsed : parsed.questions || [] });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/improve-question", async (req, res) => {
  try {
    const { question, options, correctAnswer, apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const prompt = `Improve this NEET question keeping answer index ${correctAnswer}. Q: ${question} Options: ${JSON.stringify(options)}. Return JSON: {improvedQuestion, improvedOptions[4], correctAnswer, explanation, ncertReference, changesMade}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    return res.json({ success: true,...JSON.parse((response.text||"{}").replace(/```json|```/g,"").trim()) });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/quality-checker", async (req, res) => {
  try {
    const { questions, apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const prompt = `Audit these NEET questions: ${JSON.stringify(questions)}. Return JSON: {qualityScore, overallVerdict, flags[], syllabusCoverage[], difficultyDistribution{}}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    return res.json({ success: true, audit: JSON.parse((response.text||"{}").replace(/```json|```/g,"").trim()) });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/performance-analysis", async (req, res) => {
  try {
    const { testTitle, totalAttempts, averageScore, studentMetrics, apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const prompt = `Analyze NEET test performance: ${testTitle}, Attempts: ${totalAttempts}, Avg: ${averageScore}, Metrics: ${JSON.stringify(studentMetrics)}. Return JSON: {summary, weakChapters[], strongChapters[], timeAnalysis, difficultyAccuracy{}, actionableSuggestions[]}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    return res.json({ success: true, analysis: JSON.parse((response.text||"{}").replace(/```json|```/g,"").trim()) });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post("/api/ai/blueprint", async (req, res) => {
  try {
    const { subject, totalQuestions = 50, pattern = "NEET 2026", apiKey } = req.body;
    const ai = getGeminiClient(apiKey);
    const prompt = `Generate blueprint for ${subject} pattern ${pattern} total ${totalQuestions}. Return JSON: {patternName, sectionA{count, type, topics[]}, sectionB{count, type, topics[]}, cognitiveTaxonomy{}, recommendations}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
    return res.json({ success: true, blueprint: JSON.parse((response.text||"{}").replace(/```json|```/g,"").trim()) });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[GLOBAL ERROR]", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ================= VITE / STATIC / EXPORT =================
async function attachVite() {
  if (process.env.NODE_ENV!== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}
attachVite();

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV!== "production") {
  app.listen(PORT, () => console.log(`[ASI] Server v3.0 running on ${PORT}`));
}

// Vercel ke liye ye sabse important hai
export default app;
