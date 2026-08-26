import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Layers, 
  Check, 
  X, 
  Save, 
  Eye, 
  ArrowLeft, 
  Copy, 
  FileUp, 
  ListOrdered, 
  ToggleLeft, 
  ToggleRight,
  Database,
  RefreshCw,
  HelpCircle,
  Bot,
  FileCode,
  Download,
  Braces,
  Wand2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { GeminiCustomTestBox } from './GeminiCustomTestBox';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { extractFromPdfFile, parseTextWithServerAI, parseMCQTextRobust } from '../utils/pdfExtractor';
import { saveTestToDb } from '../utils/supabaseClient';

// Set up pdf.js worker fallback for browser environment
if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

// Sample raw text for testing instant extraction
const SAMPLE_MOCK_TEXT = `Q1. Which of the following organelles is known as the powerhouse of the cell?
(A) Golgi apparatus
(B) Mitochondria
(C) Ribosome
(D) Lysosome
Answer: (B)
Explanation: Mitochondria generate most of the cell's supply of ATP through cellular respiration.

Q2. During DNA replication, which enzyme is primarily responsible for unzipping the double helix?
(A) DNA Polymerase
(B) RNA Primase
(C) DNA Helicase
(D) DNA Ligase
Answer: (C)
Explanation: DNA Helicase unwinds the double helix at the replication fork.

Q3. In Mendelian genetics, what is the phenotypic ratio of a standard monohybrid cross in the F2 generation?
(A) 9:3:3:1
(B) 1:2:1
(C) 3:1
(D) 1:1
Answer: (C)
Explanation: The F2 generation of a monohybrid cross gives 3 dominant to 1 recessive phenotype.

Q4. Which hormone is directly responsible for the 'fight or flight' response in humans?
(A) Insulin
(B) Epinephrine (Adrenaline)
(C) Thyroxine
(D) Estrogen
Answer: (B)
Explanation: Epinephrine is secreted by the adrenal medulla during acute stress.`;

// Sample JSON Test format (Full Test with Metadata)
const SAMPLE_JSON_FULL_TEST = `{
  "title": "NEET 2026 High-Yield Genetics & Cell Biology Mock",
  "subject": "Biology",
  "category": "NEET Full Syllabus",
  "difficulty": "Medium",
  "durationMinutes": 45,
  "hasNegativeMarking": true,
  "syllabus": ["Genetics", "Cell: The Unit of Life", "Molecular Biology"],
  "description": "NCERT-aligned high-yield test imported via JSON format.",
  "questions": [
    {
      "question": "Which of the following organelles is known as the powerhouse of the cell?",
      "options": [
        "Golgi apparatus",
        "Mitochondria",
        "Ribosome",
        "Lysosome"
      ],
      "correctAnswer": 1,
      "explanation": "Mitochondria generate most of the cell's ATP through aerobic cellular respiration.",
      "chapter": "Cell: The Unit of Life"
    },
    {
      "question": "During DNA replication, which enzyme is primarily responsible for unzipping the double helix?",
      "options": [
        "DNA Polymerase",
        "RNA Primase",
        "DNA Helicase",
        "DNA Ligase"
      ],
      "correctAnswer": 2,
      "explanation": "DNA Helicase unwinds the double helix at the replication fork by breaking hydrogen bonds.",
      "chapter": "Molecular Basis of Inheritance"
    },
    {
      "question": "In Mendelian genetics, what is the phenotypic ratio of a standard monohybrid cross in the F2 generation?",
      "options": [
        "9:3:3:1",
        "1:2:1",
        "3:1",
        "1:1"
      ],
      "correctAnswer": 2,
      "explanation": "The F2 generation of a monohybrid cross gives 3 dominant to 1 recessive phenotype.",
      "chapter": "Principles of Inheritance"
    },
    {
      "question": "Which hormone is directly responsible for the 'fight or flight' response in humans?",
      "options": [
        "Insulin",
        "Epinephrine (Adrenaline)",
        "Thyroxine",
        "Estrogen"
      ],
      "correctAnswer": 1,
      "explanation": "Epinephrine is secreted by the adrenal medulla during acute stress.",
      "chapter": "Chemical Coordination and Integration"
    }
  ]
}`;

// Sample JSON array of questions only
const SAMPLE_JSON_QUESTIONS_ARRAY = `[
  {
    "question": "What is the primary function of stomata in plant leaves?",
    "options": [
      "Water absorption from soil",
      "Gas exchange and transpiration",
      "Photosynthesis in guard cells exclusively",
      "Mineral transport to roots"
    ],
    "correctAnswer": 1,
    "explanation": "Stomata facilitate exchange of gases (CO2 & O2) and regulate transpiration.",
    "chapter": "Plant Physiology"
  },
  {
    "question": "Which phase of mitosis is characterized by chromosomes aligning at the equatorial plate?",
    "options": [
      "Prophase",
      "Metaphase",
      "Anaphase",
      "Telophase"
    ],
    "correctAnswer": 1,
    "explanation": "During metaphase, chromosomes align along the spindle equator (metaphase plate).",
    "chapter": "Cell Cycle and Cell Division"
  }
]`;

export const CustomTestBuilder = ({ onBack, onTestCreated, existingTest = null, initialTab = 'editor' }) => {
  // Test Metadata
  const [testTitle, setTestTitle] = useState(existingTest ? existingTest.title : '');
  const [subject, setSubject] = useState(existingTest ? existingTest.subject : 'Biology');
  const [durationMinutes, setDurationMinutes] = useState(existingTest ? existingTest.durationMinutes : 45);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(true);
  const [category, setCategory] = useState(existingTest ? existingTest.category : 'NEET Full Syllabus');
  const [difficulty, setDifficulty] = useState(existingTest ? existingTest.difficulty : 'Medium');
  const [syllabusInput, setSyllabusInput] = useState(existingTest ? existingTest.syllabus.join(', ') : 'NCERT Class 11 & 12 Biology');
  const [description, setDescription] = useState(existingTest ? existingTest.description : 'Custom test authored and published via Amerj Sir Faculty Portal.');

  // Questions State
  const [questions, setQuestions] = useState(existingTest ? existingTest.questions : []);
  const [activeTab, setActiveTab] = useState(initialTab); // 'gemini' | 'editor' | 'json' | 'extractor' | 'preview'
  
  // Extraction state
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionLog, setExtractionLog] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);

  // JSON Import & Export State
  const [jsonText, setJsonText] = useState('');
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonValidationLog, setJsonValidationLog] = useState(null);
  const [jsonImportMode, setJsonImportMode] = useState('replace'); // 'replace' | 'append'
  const [jsonApplyMetadata, setJsonApplyMetadata] = useState(true);
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const jsonFileInputRef = useRef(null);

  // Manual Question Edit Modal / Inline State
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    chapter: ''
  });

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  // Marks calculation (+4 for correct, -1 for negative or 0)
  const marksPerQuestion = 4;
  const totalCalculatedMarks = questions.length * marksPerQuestion;

  // Comprehensive JSON Test Parser Function
  const parseJsonTestData = (rawInput) => {
    if (!rawInput || !rawInput.trim()) {
      throw new Error("JSON data is empty. Please enter or paste valid JSON text.");
    }

    let parsed;
    try {
      parsed = typeof rawInput === 'object' ? rawInput : JSON.parse(rawInput);
    } catch (err) {
      throw new Error(`JSON Syntax Error: ${err.message}. Please verify brackets, quotes, and commas.`);
    }

    let metadata = {};
    let rawQuestionsList = [];

    if (Array.isArray(parsed)) {
      rawQuestionsList = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Extract optional test-level metadata
      if (parsed.title || parsed.testTitle || parsed.name) {
        metadata.title = String(parsed.title || parsed.testTitle || parsed.name).trim();
      }
      if (parsed.subject) metadata.subject = String(parsed.subject).trim();
      if (parsed.durationMinutes || parsed.duration || parsed.timeMinutes) {
        metadata.durationMinutes = Number(parsed.durationMinutes || parsed.duration || parsed.timeMinutes);
      }
      if (parsed.category) metadata.category = String(parsed.category).trim();
      if (parsed.difficulty) metadata.difficulty = String(parsed.difficulty).trim();
      if (parsed.hasNegativeMarking !== undefined) metadata.hasNegativeMarking = Boolean(parsed.hasNegativeMarking);
      if (parsed.syllabus) {
        metadata.syllabus = Array.isArray(parsed.syllabus) ? parsed.syllabus.join(', ') : String(parsed.syllabus);
      }
      if (parsed.description) metadata.description = String(parsed.description).trim();

      // Extract array of questions
      if (Array.isArray(parsed.questions)) {
        rawQuestionsList = parsed.questions;
      } else if (Array.isArray(parsed.rawQuestions)) {
        rawQuestionsList = parsed.rawQuestions;
      } else if (Array.isArray(parsed.items)) {
        rawQuestionsList = parsed.items;
      } else if (Array.isArray(parsed.mcqs)) {
        rawQuestionsList = parsed.mcqs;
      } else {
        throw new Error("Could not find a 'questions' array in the JSON object. Please provide an array of questions or an object with a 'questions' field.");
      }
    } else {
      throw new Error("JSON must be either an array of questions or an object containing a 'questions' property.");
    }

    if (rawQuestionsList.length === 0) {
      throw new Error("The 'questions' array in the JSON file is empty.");
    }

    // Format and sanitize each question item
    const formattedQuestions = rawQuestionsList.map((item, idx) => {
      if (!item || typeof item !== 'object') {
        throw new Error(`Item at index ${idx} is not a valid question object.`);
      }

      const questionPrompt = item.question || item.questionText || item.prompt || item.text || `Question ${idx + 1}`;
      
      // Normalize options
      let optionsList = [];
      if (Array.isArray(item.options)) {
        optionsList = item.options.map(opt => String(opt || '').trim());
      } else if (typeof item.options === 'object' && item.options !== null) {
        const standardKeys = ['A', 'B', 'C', 'D'];
        const found = [];
        standardKeys.forEach(k => {
          if (item.options[k] !== undefined) found.push(String(item.options[k]).trim());
          else if (item.options[k.toLowerCase()] !== undefined) found.push(String(item.options[k.toLowerCase()]).trim());
        });
        optionsList = found.length >= 2 ? found : Object.values(item.options).map(v => String(v).trim());
      }

      while (optionsList.length < 4) {
        optionsList.push(`Option ${String.fromCharCode(65 + optionsList.length)}`);
      }
      optionsList = optionsList.slice(0, 4);

      // Normalize correctAnswer (0, 1, 2, 3)
      let correctIdx = 0;
      const ansKey = item.correctAnswer !== undefined 
        ? item.correctAnswer 
        : (item.answer !== undefined 
            ? item.answer 
            : (item.correctOption !== undefined 
                ? item.correctOption 
                : (item.correctIndex !== undefined 
                    ? item.correctIndex 
                    : item.key)));

      if (typeof ansKey === 'number') {
        if (ansKey >= 0 && ansKey < 4) {
          correctIdx = ansKey;
        } else if (ansKey >= 1 && ansKey <= 4) {
          // 1-based index support
          correctIdx = ansKey - 1;
        }
      } else if (typeof ansKey === 'string') {
        const cleaned = ansKey.trim().toUpperCase().replace(/[\(\)\[\]\.]/g, '');
        if (cleaned === 'A' || cleaned === '1') correctIdx = 0;
        else if (cleaned === 'B' || cleaned === '2') correctIdx = 1;
        else if (cleaned === 'C' || cleaned === '3') correctIdx = 2;
        else if (cleaned === 'D' || cleaned === '4') correctIdx = 3;
      }

      const explanation = item.explanation || item.explanation_hinglish || item.ncertReference || item.solution || item.reason || 'Refer to NCERT textbook concepts.';
      const chapter = item.chapter || item.topic || item.subject || metadata.subject || subject;

      return {
        id: idx + 1,
        question: questionPrompt,
        options: optionsList,
        correctAnswer: correctIdx,
        explanation,
        chapter
      };
    });

    return {
      metadata,
      questions: formattedQuestions
    };
  };

  // JSON File Upload Handler
  const handleJsonFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonFileName(file.name);
    setIsProcessingJson(true);
    setJsonValidationLog({ status: 'info', message: `Reading JSON file "${file.name}"...` });

    try {
      const text = await file.text();
      setJsonText(text);

      const parsedData = parseJsonTestData(text);
      setJsonValidationLog({
        status: 'success',
        message: `Valid JSON! Found ${parsedData.questions.length} questions${parsedData.metadata.title ? ` and metadata for "${parsedData.metadata.title}"` : ''}. Click "Apply JSON Import" to load into test.`,
        previewCount: parsedData.questions.length,
        metadata: parsedData.metadata
      });
    } catch (err) {
      console.error('JSON parse error:', err);
      setJsonValidationLog({
        status: 'error',
        message: err.message
      });
    } finally {
      setIsProcessingJson(false);
    }
  };

  // Run JSON Parser and Apply to Test
  const handleApplyJsonImport = () => {
    if (!jsonText.trim()) {
      setJsonValidationLog({ status: 'error', message: 'Please paste JSON text or select a .json file.' });
      return;
    }

    setIsProcessingJson(true);
    try {
      const parsedData = parseJsonTestData(jsonText);
      const incomingQuestions = parsedData.questions;

      // Apply metadata if enabled and present
      if (jsonApplyMetadata && parsedData.metadata) {
        const m = parsedData.metadata;
        if (m.title) setTestTitle(m.title);
        if (m.subject) setSubject(m.subject);
        if (m.durationMinutes) setDurationMinutes(m.durationMinutes);
        if (m.category) setCategory(m.category);
        if (m.difficulty) setDifficulty(m.difficulty);
        if (m.hasNegativeMarking !== undefined) setHasNegativeMarking(m.hasNegativeMarking);
        if (m.syllabus) setSyllabusInput(m.syllabus);
        if (m.description) setDescription(m.description);
      }

      if (jsonImportMode === 'replace') {
        const indexedQuestions = incomingQuestions.map((q, idx) => ({ ...q, id: idx + 1 }));
        setQuestions(indexedQuestions);
      } else {
        // Append mode
        const existingCount = questions.length;
        const appended = incomingQuestions.map((q, idx) => ({ ...q, id: existingCount + idx + 1 }));
        setQuestions([...questions, ...appended]);
      }

      setPublishStatus({
        type: 'success',
        message: `JSON imported successfully! ${incomingQuestions.length} MCQs loaded in ${jsonImportMode === 'replace' ? 'Replacement' : 'Append'} mode.`
      });

      setActiveTab('editor');
    } catch (err) {
      setJsonValidationLog({
        status: 'error',
        message: err.message
      });
    } finally {
      setIsProcessingJson(false);
    }
  };

  // Load Sample JSON Templates
  const handleLoadSampleJson = (type = 'full') => {
    const template = type === 'full' ? SAMPLE_JSON_FULL_TEST : SAMPLE_JSON_QUESTIONS_ARRAY;
    setJsonText(template);
    setJsonFileName(type === 'full' ? 'sample_full_test.json' : 'sample_questions_array.json');
    try {
      const parsed = parseJsonTestData(template);
      setJsonValidationLog({
        status: 'success',
        message: `Loaded ${type === 'full' ? 'Full Test Template' : 'Questions Array Template'} with ${parsed.questions.length} MCQs. Ready to import or customize!`,
        previewCount: parsed.questions.length,
        metadata: parsed.metadata
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Download Sample JSON file template
  const handleDownloadSampleJson = () => {
    const blob = new Blob([SAMPLE_JSON_FULL_TEST], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asi_sample_neet_test.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Current Test to JSON file
  const handleExportCurrentTestJson = () => {
    const syllabusArray = syllabusInput.split(',').map((s) => s.trim()).filter(Boolean);
    const currentTestObj = {
      title: testTitle || 'Untitled NEET Mock Test',
      subject: subject || 'Biology',
      category: category || 'NEET Full Syllabus',
      difficulty: difficulty || 'Medium',
      durationMinutes: Number(durationMinutes) || 45,
      hasNegativeMarking: Boolean(hasNegativeMarking),
      syllabus: syllabusArray.length > 0 ? syllabusArray : ['NEET Biology Syllabus'],
      description: description || 'Custom test authored via ASI Faculty Portal.',
      questions: questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        chapter: q.chapter || subject
      }))
    };

    const jsonString = JSON.stringify(currentTestObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (testTitle || 'test').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    a.download = `${safeTitle}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy JSON to Clipboard
  const handleCopyJsonToClipboard = () => {
    const syllabusArray = syllabusInput.split(',').map((s) => s.trim()).filter(Boolean);
    const currentTestObj = {
      title: testTitle || 'Untitled NEET Mock Test',
      subject: subject || 'Biology',
      category: category || 'NEET Full Syllabus',
      difficulty: difficulty || 'Medium',
      durationMinutes: Number(durationMinutes) || 45,
      hasNegativeMarking: Boolean(hasNegativeMarking),
      syllabus: syllabusArray.length > 0 ? syllabusArray : ['NEET Biology Syllabus'],
      description: description || 'Custom test authored via ASI Faculty Portal.',
      questions: questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        chapter: q.chapter || subject
      }))
    };
    navigator.clipboard.writeText(JSON.stringify(currentTestObj, null, 2));
    alert('Current test JSON copied to clipboard!');
  };

  // Regex MCQ Parser Function
  const parseMCQText = (text) => {
    if (!text || !text.trim()) return [];

    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split by questions: matches Q1., Q.1, 1., Question 1:, Q 1:, etc.
    const questionRegex = /(?:^|\n)\s*(?:(?:Q|Question|Que|Ques)[\s.:)]*\s*(\d+)[\s.:)]+|\b(\d+)[\s.:)]+)\s+/gi;
    
    const matches = [];
    let match;
    const indices = [];

    while ((match = questionRegex.exec(cleanedText)) !== null) {
      indices.push({
        index: match.index,
        qNum: match[1] || match[2]
      });
    }

    const extracted = [];

    for (let i = 0; i < indices.length; i++) {
      const currentStart = indices[i].index;
      const nextStart = i + 1 < indices.length ? indices[i + 1].index : cleanedText.length;
      const block = cleanedText.slice(currentStart, nextStart).trim();

      // Clean block from initial question number label
      const blockWithoutHeader = block.replace(/^(?:(?:Q|Question|Que|Ques)[\s.:)]*\s*\d+[\s.:)]+|\b\d+[\s.:)]+)\s*/i, '').trim();

      // Extract options: matches (A), (B), (C), (D) or A), B), C), D) or [A], [B] or 1), 2), 3), 4)
      const optionSplitRegex = /(?:^|\n|\s+)(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])[\.\)])\s+/g;
      
      const optMatches = [];
      let optMatch;
      while ((optMatch = optionSplitRegex.exec(blockWithoutHeader)) !== null) {
        optMatches.push({
          index: optMatch.index,
          label: (optMatch[1] || optMatch[2] || optMatch[3]).toUpperCase()
        });
      }

      if (optMatches.length >= 2) {
        const questionPrompt = blockWithoutHeader.slice(0, optMatches[0].index).trim();
        const optionsList = [];

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
          
          optionsList.push(optText);
        }

        // Ensure 4 options
        while (optionsList.length < 4) {
          optionsList.push(`Option ${String.fromCharCode(65 + optionsList.length)}`);
        }

        // Extract Correct Answer
        let correctIdx = 0;
        const ansMatch = blockWithoutHeader.match(/(?:Answer|Ans|Correct(?:\s+Option)?)[\s.:]*\s*(?:\(?([A-Da-d1-4])\)?)/i);
        if (ansMatch) {
          const rawAns = ansMatch[1].toUpperCase();
          if (['A', '1'].includes(rawAns)) correctIdx = 0;
          else if (['B', '2'].includes(rawAns)) correctIdx = 1;
          else if (['C', '3'].includes(rawAns)) correctIdx = 2;
          else if (['D', '4'].includes(rawAns)) correctIdx = 3;
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
          explanation: explanation || 'Refer to standard NCERT Biology diagrams and theory.',
          chapter: subject
        });
      }
    }

    return extracted;
  };

  // PDF Text Extraction Handler with Progress & Scanned PDF Vision Fallback
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsExtracting(true);
    setExtractionLog({ status: 'info', message: `Reading "${file.name}"...` });

    try {
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        const text = await file.text();
        setJsonText(text);
        setJsonFileName(file.name);
        const parsedJson = parseJsonTestData(text);
        if (parsedJson.questions.length > 0) {
          if (parsedJson.metadata.title) setTestTitle(parsedJson.metadata.title);
          if (parsedJson.metadata.subject) setSubject(parsedJson.metadata.subject);
          setQuestions((prev) => [...prev, ...parsedJson.questions]);
          setExtractionLog({
            status: 'success',
            message: `JSON format detected! Successfully loaded ${parsedJson.questions.length} MCQs from "${file.name}"!`
          });
          setActiveTab('editor');
          return;
        }
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const result = await extractFromPdfFile(file, undefined, (progress) => {
          setExtractionLog({
            status: 'info',
            message: `${progress.statusText} (${progress.percentage}%)`
          });
        });

        if (result.isScanned && result.directQuestions && result.directQuestions.length > 0) {
          const directQs = result.directQuestions.map((q, idx) => ({
            id: questions.length + idx + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'Detailed step-by-step NCERT solution.',
            chapter: q.chapter || subject
          }));
          setQuestions((prev) => [...prev, ...directQs]);
          setExtractionLog({
            status: 'success',
            message: `Scanned PDF detected! Gemini Vision ne ${directQs.length} MCQs successfully extract kar diye!`
          });
          setActiveTab('editor');
          return;
        }

        setRawText(result.text);
        let parsed = [];
        try {
          setExtractionLog({
            status: 'info',
            message: `Structuring ${result.text.length} characters using Smart AI Parser...`
          });
          parsed = await parseTextWithServerAI(result.text, subject);
        } catch {
          parsed = parseMCQTextRobust(result.text, subject);
        }
        
        if (parsed.length > 0) {
          const indexed = parsed.map((q, idx) => ({
            id: questions.length + idx + 1,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || 'NCERT line-by-line solution.',
            chapter: q.chapter || subject
          }));
          setQuestions((prev) => [...prev, ...indexed]);
          setExtractionLog({
            status: 'success',
            message: `Successfully extracted and structured ${indexed.length} MCQs from PDF!`
          });
          setActiveTab('editor');
        } else {
          setExtractionLog({
            status: 'warning',
            message: `Extracted ${result.text.length} characters of clean text. You can review the raw text below or click "Gemini AI Creator" tab for automatic AI parsing.`
          });
        }
      } else {
        // Text file fallback
        const text = await file.text();
        setRawText(text);
        const parsed = parseMCQTextRobust(text, subject);
        if (parsed.length > 0) {
          setQuestions((prev) => [...prev, ...parsed]);
          setExtractionLog({
            status: 'success',
            message: `Successfully parsed ${parsed.length} MCQs from text file!`
          });
          setActiveTab('editor');
        } else {
          setExtractionLog({
            status: 'warning',
            message: 'Could not auto-detect MCQ format in text file. Check formatting.'
          });
        }
      }
    } catch (err) {
      console.error('Extraction error:', err);
      setExtractionLog({
        status: 'error',
        message: `Failed to extract from file: ${err.message || 'Unknown error'}. You can paste text directly.`
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Run Regex Parser on Raw Text
  const handleParseRawText = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      let parsed = [];
      try {
        parsed = await parseTextWithServerAI(rawText, subject);
      } catch {
        parsed = parseMCQTextRobust(rawText, subject);
      }
      if (parsed.length > 0) {
        setQuestions((prev) => [...prev, ...parsed]);
        setExtractionLog({
          status: 'success',
          message: `Parsed ${parsed.length} questions successfully!`
        });
        setActiveTab('editor');
      } else {
        setExtractionLog({
          status: 'error',
          message: 'No questions matched the Q1 / (A)(B)(C)(D) pattern. Check example format.'
        });
      }
    } catch (err) {
      setExtractionLog({ status: 'error', message: err.message });
    } finally {
      setIsExtracting(false);
    }
  };

  // Load Sample Mock MCQs
  const handleLoadSample = () => {
    setRawText(SAMPLE_MOCK_TEXT);
    const parsed = parseMCQText(SAMPLE_MOCK_TEXT);
    setQuestions(parsed);
    if (!testTitle) setTestTitle('NEET 2026 High-Yield Biology Mock 01');
    setExtractionLog({
      status: 'success',
      message: `Loaded 4 sample MCQs for instant editing and preview!`
    });
    setActiveTab('editor');
  };

  // Manual Question Handlers
  const handleOpenAddManual = () => {
    setManualForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      chapter: subject
    });
    setEditingQuestionIndex(null);
    setManualModalOpen(true);
  };

  const handleOpenEditManual = (index) => {
    const q = questions[index];
    setManualForm({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      chapter: q.chapter || subject
    });
    setEditingQuestionIndex(index);
    setManualModalOpen(true);
  };

  const handleSaveManualQuestion = (e) => {
    e.preventDefault();
    if (!manualForm.question.trim()) return;

    const formattedQ = {
      id: editingQuestionIndex !== null ? questions[editingQuestionIndex].id : questions.length + 1,
      question: manualForm.question.trim(),
      options: manualForm.options.map((opt, i) => opt.trim() || `Option ${String.fromCharCode(65 + i)}`),
      correctAnswer: Number(manualForm.correctAnswer),
      explanation: manualForm.explanation.trim() || 'Refer to standard NCERT Biology reference notes.',
      chapter: manualForm.chapter || subject
    };

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = formattedQ;
      setQuestions(updated);
    } else {
      setQuestions([...questions, formattedQ]);
    }

    setManualModalOpen(false);
  };

  const handleDeleteQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index).map((q, idx) => ({ ...q, id: idx + 1 }));
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const handleUpdateQuestionText = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].question = value;
    setQuestions(updated);
  };

  const handleUpdateCorrectAnswer = (qIndex, correctIdx) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = correctIdx;
    setQuestions(updated);
  };

  const handleUpdateExplanation = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].explanation = value;
    setQuestions(updated);
  };

  // Load Gemini AI Generated Test into state
  const handleGeminiTestLoaded = (testData) => {
    if (!testData) return;
    if (testData.title) setTestTitle(testData.title);
    if (testData.subject) setSubject(testData.subject);
    if (testData.durationMinutes) setDurationMinutes(Number(testData.durationMinutes));
    if (testData.category) setCategory(testData.category);
    if (testData.difficulty) setDifficulty(testData.difficulty);
    if (testData.syllabus && Array.isArray(testData.syllabus)) setSyllabusInput(testData.syllabus.join(', '));
    if (testData.questions && Array.isArray(testData.questions)) {
      setQuestions(testData.questions);
    }
    setPublishStatus({
      type: 'success',
      message: `Gemini AI loaded ${testData.questions?.length || 0} MCQs! All questions are ready in the editor table below.`
    });
    setActiveTab('editor');
  };

  // Auto-Fix & Enrich Questions with AI
  const [isFixingWithAi, setIsFixingWithAi] = useState(false);
  const handleAutoFixQuestionsWithAi = async () => {
    if (questions.length === 0) return;
    setIsFixingWithAi(true);
    setPublishStatus({
      type: 'info',
      message: 'AI Quality Engine is analyzing and structuring all questions with NCERT solutions...'
    });

    try {
      const fixedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        try {
          const res = await fetch('/api/ai/improve-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              fixedQuestions.push({
                id: i + 1,
                question: data.improvedQuestion || q.question,
                options: Array.isArray(data.improvedOptions) && data.improvedOptions.length >= 2 ? data.improvedOptions : q.options,
                correctAnswer: typeof data.correctAnswer === 'number' ? data.correctAnswer : q.correctAnswer,
                explanation: data.explanation || q.explanation,
                chapter: q.chapter || subject
              });
              continue;
            }
          }
        } catch {
          // keep original
        }
        fixedQuestions.push({ ...q, id: i + 1 });
      }

      setQuestions(fixedQuestions);
      setPublishStatus({
        type: 'success',
        message: `Successfully verified and enhanced ${fixedQuestions.length} MCQs with NCERT solutions and clean options!`
      });
    } catch (err) {
      setPublishStatus({
        type: 'error',
        message: `AI improvement notice: ${err.message}`
      });
    } finally {
      setIsFixingWithAi(false);
    }
  };

  // Publish Test Handler (localStorage + Supabase + Firebase)
  const handlePublishTest = async () => {
    if (!testTitle.trim()) {
      alert('Please provide a Test Title before publishing.');
      return;
    }

    if (questions.length === 0) {
      alert('Please add or extract at least 1 question before publishing.');
      return;
    }

    setIsPublishing(true);
    setPublishStatus({ type: 'info', message: 'Publishing test to Supabase & Realtime Cloud...' });

    const syllabusArray = syllabusInput.split(',').map((s) => s.trim()).filter(Boolean);

    const publishedTest = {
      id: existingTest ? existingTest.id : `test-custom-${Date.now()}`,
      title: testTitle.trim(),
      category,
      subject,
      totalQuestions: questions.length,
      durationMinutes: Number(durationMinutes),
      totalMarks: totalCalculatedMarks,
      difficulty,
      hasNegativeMarking,
      markingScheme: hasNegativeMarking ? '+4 / -1' : '+4 / 0',
      syllabus: syllabusArray.length > 0 ? syllabusArray : ['NEET Biology Syllabus'],
      description: description.trim() || 'Custom educator-curated mock test.',
      attemptsCount: existingTest ? existingTest.attemptsCount : 0,
      rating: 5.0,
      isNew: true,
      questions: questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'Detailed NCERT solution provided.',
        chapter: q.chapter || subject
      })),
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save to Supabase Cloud DB & Local Storage mirror
      await saveTestToDb(publishedTest);

      // 2. Firebase Firestore Integration Attempt (if configured)
      try {
        if (db) {
          await setDoc(doc(db, "tests", publishedTest.id), publishedTest);
        }
      } catch (fbErr) {
        console.warn('Firestore sync notice:', fbErr);
      }

      setPublishStatus({
        type: 'success',
        message: `Test "${publishedTest.title}" published successfully to Supabase! (${questions.length} MCQs, ${publishedTest.durationMinutes}m)`
      });

      if (onTestCreated) {
        onTestCreated(publishedTest);
      }

      setTimeout(() => {
        if (onBack) onBack();
      }, 1200);

    } catch (err) {
      console.error('Publish error:', err);
      setPublishStatus({
        type: 'error',
        message: `Failed to save test: ${err.message}`
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-16">
      
      {/* Top SaaS Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-violet-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Left Back & Title */}
            <div className="flex items-center gap-3">
              <button
                id="builder-back-btn"
                onClick={onBack}
                className="p-2.5 rounded-xl text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer border border-slate-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Custom Test Builder
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
                    Teacher SaaS Studio
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Auto MCQ Extraction (PDF/Text) • Editable Table • CBT Exam Publisher
                </p>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-3">
              <button
                id="builder-json-top-btn"
                onClick={() => setActiveTab('json')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 cursor-pointer transition-colors"
                title="Import or Export JSON"
              >
                <Braces className="w-4 h-4 text-violet-600" />
                <span>JSON Import / Export</span>
              </button>

              <button
                id="builder-load-sample-btn"
                onClick={handleLoadSample}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-slate-600" />
                <span>Sample MCQs</span>
              </button>

              <button
                id="builder-publish-top-btn"
                onClick={handlePublishTest}
                disabled={isPublishing || questions.length === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-violet-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Publish Test'}</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Status Notice */}
        {publishStatus && (
          <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between ${
            publishStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : publishStatus.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-violet-50 border-violet-200 text-violet-800'
          }`}>
            <div className="flex items-center gap-2.5">
              {publishStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{publishStatus.message}</span>
            </div>
            <button onClick={() => setPublishStatus(null)} className="p-1 text-slate-500 hover:text-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Test Parameters Configuration Card */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Test Configuration &amp; Metadata
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Total Questions: <strong className="text-violet-700">{questions.length}</strong></span>
              <span>•</span>
              <span>Total Marks: <strong className="text-violet-700">{totalCalculatedMarks}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Test Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Test Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-test-name"
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g. NEET 2026 Biology Grand Mock Test 05"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-test-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium text-slate-800"
              >
                <option value="Biology">Biology (Botany &amp; Zoology)</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="General Science">General Science</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Duration (Minutes)</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                id="input-test-duration"
                type="number"
                min={5}
                max={240}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium text-slate-800"
              >
                <option value="NEET Full Syllabus">NEET Full Syllabus</option>
                <option value="Class 11 Biology">Class 11 Biology</option>
                <option value="Class 12 Biology">Class 12 Biology</option>
                <option value="High Yield">High Yield</option>
                <option value="JEE Biology">JEE / IAT Biology</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 font-medium text-slate-800"
              >
                <option value="Easy">Easy (Foundation / NCERT Facts)</option>
                <option value="Medium">Medium (NTA NEET Standard)</option>
                <option value="Hard">Hard (Assertion-Reason / Multi-statement)</option>
              </select>
            </div>

            {/* Negative Marking Toggle */}
            <div className="flex flex-col justify-between">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Negative Marking Scheme
              </label>
              <div 
                onClick={() => setHasNegativeMarking(!hasNegativeMarking)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  hasNegativeMarking 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasNegativeMarking ? (
                    <ToggleRight className="w-6 h-6 text-rose-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                  <span className="text-xs font-bold">
                    {hasNegativeMarking ? 'NEET Pattern (+4 / -1)' : 'No Negative Marking (+4 / 0)'}
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  hasNegativeMarking ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {hasNegativeMarking ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Syllabus Chapters (comma-separated)
              </label>
              <input
                type="text"
                value={syllabusInput}
                onChange={(e) => setSyllabusInput(e.target.value)}
                placeholder="e.g. Genetics, Molecular Biology, Plant Physiology"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instructions / Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. NCERT line-by-line questions for comprehensive revision"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>

        </section>

        {/* 2. Builder Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'gemini'
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4 text-violet-600" />
            <span>🤖 Gemini AI Creator</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Question Editor Table ({questions.length})</span>
          </button>

          <button
            id="tab-json-import-btn"
            onClick={() => setActiveTab('json')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Braces className="w-4 h-4 text-violet-600" />
            <span>📄 JSON File &amp; Text Import</span>
          </button>

          <button
            onClick={() => setActiveTab('extractor')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'extractor'
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>PDF &amp; Regex Auto-Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-5 py-3 font-bold text-xs sm:text-sm border-b-2 flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Live Student CBT Preview</span>
          </button>
        </div>

        {/* TAB: GEMINI AI CREATOR */}
        {activeTab === 'gemini' && (
          <section className="space-y-4">
            <GeminiCustomTestBox 
              onTestGenerated={handleGeminiTestLoaded}
              onDirectPublish={(publishedTest) => {
                if (onTestCreated) onTestCreated(publishedTest);
              }}
            />
          </section>
        )}

        {/* TAB: JSON FILE & TEXT IMPORT */}
        {activeTab === 'json' && (
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Braces className="w-5 h-5 text-violet-600" />
                    <span>JSON File Upload &amp; Raw JSON Text Import</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate tests directly from standard JSON files or paste raw JSON arrays and test objects.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadSampleJson}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download template .json file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download JSON Template</span>
                  </button>

                  {questions.length > 0 && (
                    <button
                      onClick={handleExportCurrentTestJson}
                      className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-xl border border-violet-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Export current test as JSON"
                    >
                      <FileCode className="w-3.5 h-3.5 text-violet-600" />
                      <span>Export Test ({questions.length} MCQs)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Drag & Drop JSON File Target */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Option 1: Upload JSON File (.json)</span>
                  <span className="text-[11px] font-medium text-slate-400">Supports UTF-8 JSON files</span>
                </label>

                <div 
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="border-2 border-dashed border-violet-200 hover:border-violet-500 rounded-3xl p-6 text-center bg-violet-50/20 hover:bg-violet-50/60 transition-all cursor-pointer group"
                >
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                  
                  <div className="w-12 h-12 rounded-2xl bg-white text-violet-600 shadow-md flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <FileCode className="w-6 h-6" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">
                    {jsonFileName ? `Selected: ${jsonFileName}` : 'Click or Drag & Drop .json Question File'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Accepts NEET Mock Test JSON objects or questions arrays with (A, B, C, D) options and answers.
                  </p>

                  {isProcessingJson && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Parsing JSON format...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Raw JSON Text Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Option 2: Paste Raw JSON Text:</span>
                  </label>

                  {/* Sample Template Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">Load Template:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleJson('full')}
                      className="px-2.5 py-1 bg-violet-100 hover:bg-violet-200 text-violet-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Full Test Object
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleJson('array')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Questions Array
                    </button>
                    {jsonText && (
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const formatted = JSON.stringify(JSON.parse(jsonText), null, 2);
                            setJsonText(formatted);
                          } catch (e) {
                            alert('JSON is currently invalid, cannot beautify.');
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
                        title="Beautify / Format JSON indentation"
                      >
                        Format JSON
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={10}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (jsonValidationLog) setJsonValidationLog(null);
                  }}
                  placeholder='Paste JSON here... e.g. { "title": "NEET 2026 Test", "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 1, "explanation": "..." } ] }'
                  className="w-full p-4 text-xs font-mono bg-slate-950 text-emerald-400 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner"
                />

                {/* Import Settings Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    
                    {/* Import Mode Radio */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Import Mode:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={jsonImportMode === 'replace'}
                          onChange={() => setJsonImportMode('replace')}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-slate-700">Replace All ({questions.length})</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={jsonImportMode === 'append'}
                          onChange={() => setJsonImportMode('append')}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-slate-700">Append to Current</span>
                      </label>
                    </div>

                    {/* Apply Metadata Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 border-l border-slate-200 pl-4">
                      <input
                        type="checkbox"
                        checked={jsonApplyMetadata}
                        onChange={(e) => setJsonApplyMetadata(e.target.checked)}
                        className="rounded text-violet-600 focus:ring-violet-500"
                      />
                      <span>Auto-apply Title &amp; Subject from JSON</span>
                    </label>

                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setJsonText('');
                        setJsonFileName('');
                        setJsonValidationLog(null);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Clear
                    </button>

                    <button
                      id="builder-apply-json-btn"
                      type="button"
                      onClick={handleApplyJsonImport}
                      disabled={!jsonText.trim() || isProcessingJson}
                      className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply &amp; Generate Test</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* JSON Validation & Preview Banner */}
              {jsonValidationLog && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  jsonValidationLog.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-3">
                    {jsonValidationLog.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <p>{jsonValidationLog.message}</p>
                      {jsonValidationLog.metadata && jsonValidationLog.metadata.title && (
                        <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                          Metadata: Subject: <strong>{jsonValidationLog.metadata.subject || 'Biology'}</strong> • Duration: <strong>{jsonValidationLog.metadata.durationMinutes || 45} mins</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {jsonValidationLog.status === 'success' && (
                    <button
                      onClick={handleApplyJsonImport}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              )}

              {/* JSON Format Guide / Reference Table */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-violet-600" />
                  <span>Supported JSON Format Specification:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-[11px]">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-violet-700 block mb-1">`question`</strong>
                    <span>Text prompt of the question (String)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-violet-700 block mb-1">`options`</strong>
                    <span>Array of 4 strings or key-value object (A, B, C, D)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-violet-700 block mb-1">`correctAnswer`</strong>
                    <span>0, 1, 2, 3 or "A", "B", "C", "D" (or 1, 2, 3, 4)</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <strong className="text-violet-700 block mb-1">`explanation`</strong>
                    <span>NCERT theory and step-by-step reasoning</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* TAB 1: QUESTION EDITOR TABLE */}
        {activeTab === 'editor' && (
          <section className="space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">
                  {questions.length} Question{questions.length !== 1 ? 's' : ''} Ready
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500">
                  Marking: <strong className="text-slate-800">{hasNegativeMarking ? '+4 / -1' : '+4 / 0'}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFixQuestionsWithAi}
                    disabled={isFixingWithAi}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                    title="Automatically improve clarity, format options, and add NCERT Hinglish solutions using AI"
                  >
                    <Wand2 className={`w-4 h-4 ${isFixingWithAi ? 'animate-spin' : ''}`} />
                    <span>{isFixingWithAi ? 'AI Fixing...' : 'AI Auto-Fix & Enrich All'}</span>
                  </button>
                )}

                <button
                  id="builder-add-manual-btn"
                  onClick={handleOpenAddManual}
                  className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Manual MCQ</span>
                </button>

                <button
                  onClick={() => setActiveTab('json')}
                  className="px-3.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs rounded-xl border border-violet-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Braces className="w-4 h-4" />
                  <span>Import / Export JSON</span>
                </button>

                <button
                  onClick={() => setActiveTab('extractor')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileUp className="w-4 h-4" />
                  <span>PDF Extractor</span>
                </button>

                {questions.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all questions?')) {
                        setQuestions([]);
                      }
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Clear All Questions"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Editable Questions List Table */}
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div 
                    key={q.id || qIndex}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-violet-300 transition-all space-y-4"
                  >
                    
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-violet-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          Q{qIndex + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            MCQ Question Statement
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditManual(qIndex)}
                          className="p-1.5 text-slate-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                          title="Full Edit Modal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Editable Question Prompt */}
                    <div>
                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 text-slate-900"
                        placeholder="Enter question statement..."
                      />
                    </div>

                    {/* Editable Options Grid (A, B, C, D) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIndex) => {
                        const optLetter = String.fromCharCode(65 + optIndex);
                        const isCorrect = q.correctAnswer === optIndex;
                        return (
                          <div 
                            key={optIndex}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                              isCorrect 
                                ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' 
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleUpdateCorrectAnswer(qIndex, optIndex)}
                              className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-violet-100 hover:text-violet-800'
                              }`}
                              title={isCorrect ? 'Correct Answer' : 'Click to set as Correct Answer'}
                            >
                              {optLetter}
                            </button>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optLetter}`}
                              className="w-full px-2.5 py-1 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-800 font-medium"
                            />

                            {isCorrect && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md shrink-0">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation & Chapter */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">NCERT Explanation / Solution:</label>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateExplanation(qIndex, e.target.value)}
                          placeholder="Provide NCERT explanation..."
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-600 text-slate-700"
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">No questions added yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Upload a question paper PDF, paste raw text with Q1/(A)(B)(C)(D) patterns, or create questions manually.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('json')}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Braces className="w-4 h-4" />
                    <span>Import from JSON (File/Text)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('extractor')}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF to Auto-Extract</span>
                  </button>
                  <button
                    onClick={handleOpenAddManual}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Manually</span>
                  </button>
                  <button
                    onClick={handleLoadSample}
                    className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load 4 Sample MCQs</span>
                  </button>
                </div>
              </div>
            )}

          </section>
        )}

        {/* TAB 2: PDF & REGEX EXTRACTOR */}
        {activeTab === 'extractor' && (
          <section className="space-y-6">
            
            {/* Upload Box */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-violet-600" />
                    <span>Upload PDF or Word/Text Question Paper</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Our regex parsing engine automatically extracts questions, (A)(B)(C)(D) options, and answers.
                  </p>
                </div>
                <button
                  onClick={handleLoadSample}
                  className="px-3.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold rounded-xl border border-violet-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try Sample MCQs</span>
                </button>
              </div>

              {/* Drag & Drop File Target */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-violet-200 hover:border-violet-500 rounded-3xl p-8 text-center bg-violet-50/30 hover:bg-violet-50/70 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                
                <div className="w-14 h-14 rounded-2xl bg-white text-violet-600 shadow-md flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-slate-800">
                  {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Click or Drag & Drop Question Paper PDF'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports standard NEET / JEE Biology Question PDFs, previous year papers, and text mock sheets.
                </p>

                {isExtracting && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting MCQs with regex parser...</span>
                  </div>
                )}
              </div>

              {/* Extraction Feedback Log */}
              {extractionLog && (
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 ${
                  extractionLog.status === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : extractionLog.status === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {extractionLog.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <span className="flex-1">{extractionLog.message}</span>
                </div>
              )}

              {/* Raw Text Input & Manual Parse Option */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Or Paste Raw MCQ Text Directly:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Pattern: Q1. ... (A) ... (B) ... (C) ... (D) ... Answer: (B)
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your question text here or upload PDF above..."
                  className="w-full p-4 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 text-slate-800"
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setRawText('')}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Clear Text
                  </button>
                  <button
                    onClick={handleParseRawText}
                    disabled={!rawText.trim() || isExtracting}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run Regex MCQ Extractor</span>
                  </button>
                </div>
              </div>

            </div>

          </section>
        )}

        {/* TAB 3: LIVE STUDENT CBT PREVIEW */}
        {activeTab === 'preview' && (
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-bold rounded-md uppercase">
                      {category}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {testTitle || 'Untitled Mock Test'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Subject: <strong>{subject}</strong> • Duration: <strong>{durationMinutes} mins</strong> • Marking: <strong>{hasNegativeMarking ? '+4 / -1' : '+4 / 0'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Back to Editor</span>
                  </button>
                </div>
              </div>

              {/* Preview Cards */}
              {questions.length > 0 ? (
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctAnswer === optIdx;
                          return (
                            <div 
                              key={optIdx} 
                              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="pl-9 pt-2 text-xs text-slate-600 border-t border-slate-200/60">
                          <strong className="text-violet-700 font-semibold">Solution: </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No questions to preview yet.
                </div>
              )}
            </div>
          </section>
        )}

      </main>

      {/* Manual Add / Edit Question Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
            
            <div className="px-6 py-4 bg-gradient-to-r from-violet-800 to-indigo-800 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingQuestionIndex !== null ? `Edit Question Q${editingQuestionIndex + 1}` : 'Add New MCQ Manually'}
              </h3>
              <button
                onClick={() => setManualModalOpen(false)}
                className="p-1 text-violet-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualQuestion} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualForm.question}
                  onChange={(e) => setManualForm({ ...manualForm, question: e.target.value })}
                  placeholder="Enter clear NCERT question statement..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 text-slate-900"
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Options &amp; Correct Answer (Click letter to set correct) <span className="text-rose-500">*</span>
                </label>
                {manualForm.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrect = manualForm.correctAnswer === i;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setManualForm({ ...manualForm, correctAnswer: i })}
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          isCorrect
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-violet-100 hover:text-violet-800'
                        }`}
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...manualForm.options];
                          newOpts[i] = e.target.value;
                          setManualForm({ ...manualForm, options: newOpts });
                        }}
                        placeholder={`Option ${letter}`}
                        className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none ${
                          isCorrect ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-violet-600'
                        }`}
                      />
                      {isCorrect && (
                        <span className="text-[10px] font-extrabold text-emerald-700 px-2 py-1 bg-emerald-100 rounded-md shrink-0">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Explanation / NCERT Reference
                </label>
                <textarea
                  rows={2}
                  value={manualForm.explanation}
                  onChange={(e) => setManualForm({ ...manualForm, explanation: e.target.value })}
                  placeholder="Provide step-by-step solution or NCERT page reference..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-violet-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Question</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
export default CustomTestBuilder;
