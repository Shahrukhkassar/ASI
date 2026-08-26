import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TestItem, TestResult, UserProfile } from '../types';
import { MOCK_TESTS } from '../data/mockTests';

// Retrieve environment variables safely across browser & SSR environments
const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) {
      return String(metaEnv[key]).trim();
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return String((process.env as any)[key]).trim();
    }
  } catch {
    // ignore
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

// Initialize Supabase Client if credentials are provided
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

// Local storage backup keys for resilient fallback
const LOCAL_TESTS_KEY = 'asi_custom_tests';
const LOCAL_RESULTS_KEY = 'asi_student_results';

/**
 * Fetch all tests from Supabase with graceful fallback to localStorage and MOCK_TESTS
 */
export async function fetchAllTests(): Promise<TestItem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted: TestItem[] = data.map((row: any) => ({
          id: String(row.id),
          title: row.title || 'NEET Biology Mock Test',
          category: row.category || 'NEET Full Syllabus',
          subject: row.subject || 'Biology',
          totalQuestions: Array.isArray(row.questions)
            ? row.questions.length
            : (row.total_questions || row.totalQuestions || 30),
          durationMinutes: row.duration_minutes || row.durationMinutes || 45,
          totalMarks: row.total_marks || row.totalMarks || (Array.isArray(row.questions) ? row.questions.length * 4 : 120),
          difficulty: row.difficulty || 'Medium',
          syllabus: Array.isArray(row.syllabus)
            ? row.syllabus
            : (row.syllabus ? [row.syllabus] : ['NEET Biology Syllabus']),
          description: row.description || 'Comprehensive NEET mock test.',
          attemptsCount: row.attempts_count || row.attemptsCount || 120,
          rating: row.rating || 4.9,
          isPopular: row.is_popular ?? false,
          isNew: row.is_new ?? false,
          questions: Array.isArray(row.questions) ? row.questions : [],
          created_at: row.created_at,
          isCustom: true
        }));

        // Cache locally for instant offline loading
        try {
          localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(formatted));
        } catch {
          // ignore storage quota
        }

        return formatted;
      }
    } catch (err) {
      console.warn('Supabase fetch error, using local fallback:', err);
    }
  }

  // Fallback to local storage + Mock Tests
  try {
    const localSaved = localStorage.getItem(LOCAL_TESTS_KEY);
    if (localSaved) {
      const parsed: TestItem[] = JSON.parse(localSaved);
      const existingIds = new Set(parsed.map(t => t.id));
      const combined = [...parsed, ...MOCK_TESTS.filter(t => !existingIds.has(t.id))];
      return combined;
    }
  } catch (e) {
    console.warn('Error loading tests from local storage:', e);
  }

  return MOCK_TESTS;
}

/**
 * Save or insert a test to Supabase with local storage mirror
 */
export async function saveTestToDb(test: TestItem): Promise<{ success: boolean; error?: string }> {
  // Always update local storage first for immediate zero-latency UI update
  try {
    const existing = localStorage.getItem(LOCAL_TESTS_KEY);
    let list: TestItem[] = existing ? JSON.parse(existing) : [];
    const idx = list.findIndex(t => t.id === test.id);
    if (idx !== -1) {
      list[idx] = test;
    } else {
      list.unshift(test);
    }
    localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local save error:', e);
  }

  if (supabase) {
    try {
      const payload = {
        id: test.id,
        title: test.title,
        category: test.category,
        subject: test.subject,
        duration_minutes: test.durationMinutes,
        total_marks: test.totalMarks,
        difficulty: test.difficulty,
        syllabus: test.syllabus,
        description: test.description,
        questions: test.questions,
        created_at: test.created_at || new Date().toISOString()
      };

      const { error } = await supabase
        .from('tests')
        .upsert([payload], { onConflict: 'id' });

      if (error) {
        console.warn('Supabase test insert warning:', error.message);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.warn('Supabase save exception:', err);
      return { success: false, error: err.message || 'Unknown save error' };
    }
  }

  return { success: true };
}

/**
 * Delete a test from Supabase and local storage
 */
export async function deleteTestFromDb(testId: string): Promise<{ success: boolean; error?: string }> {
  // Update local storage mirror
  try {
    const existing = localStorage.getItem(LOCAL_TESTS_KEY);
    if (existing) {
      let list: TestItem[] = JSON.parse(existing);
      list = list.filter(t => t.id !== testId);
      localStorage.setItem(LOCAL_TESTS_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Local delete error:', e);
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (error) {
        console.warn('Supabase delete error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (err: any) {
      console.warn('Supabase delete exception:', err);
      return { success: false, error: err.message || 'Unknown delete error' };
    }
  }

  return { success: true };
}

/**
 * Save a completed student test result
 */
export async function saveStudentResult(result: TestResult, user?: UserProfile | null): Promise<void> {
  const resultRecord: TestResult = {
    ...result,
    id: result.id || `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    studentEmail: result.studentEmail || user?.email || 'student@asi-institute.edu',
    studentName: result.studentName || user?.name || 'Student Candidate',
    submittedAt: result.submittedAt || new Date().toISOString()
  };

  // Local storage history
  try {
    const prevResults = localStorage.getItem(LOCAL_RESULTS_KEY);
    const list: TestResult[] = prevResults ? JSON.parse(prevResults) : [];
    list.unshift(resultRecord);
    localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignore
  }

  if (supabase) {
    try {
      await supabase.from('results').insert([{
        test_id: result.testId,
        test_title: result.testTitle,
        student_email: resultRecord.studentEmail,
        student_name: resultRecord.studentName,
        score: result.score,
        total_marks: result.totalMarks,
        accuracy: result.accuracy,
        time_spent_seconds: result.timeSpentSeconds,
        answers: result.answers,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn('Supabase result save error:', err);
    }
  }
}

/**
 * Fetch results for a student
 */
export async function fetchStudentResults(studentEmail?: string): Promise<TestResult[]> {
  if (supabase && studentEmail) {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('student_email', studentEmail)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((r: any) => ({
          id: String(r.id),
          testId: r.test_id,
          testTitle: r.test_title || 'NEET Test',
          studentEmail: r.student_email,
          studentName: r.student_name,
          totalQuestions: r.total_questions || 30,
          attempted: r.attempted || 0,
          correct: r.correct || 0,
          incorrect: r.incorrect || 0,
          unattempted: r.unattempted || 0,
          score: r.score,
          totalMarks: r.total_marks || 120,
          accuracy: r.accuracy || 0,
          timeSpentSeconds: r.time_spent_seconds || 120,
          answers: r.answers || {},
          submittedAt: r.created_at
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch results error:', err);
    }
  }

  // Fallback to local storage
  try {
    const saved = localStorage.getItem(LOCAL_RESULTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Subscribe to realtime test changes in Supabase
 */
export function subscribeToRealtimeTests(onUpdate: (tests: TestItem[]) => void): () => void {
  if (!supabase) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('public:tests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, async () => {
        try {
          const freshTests = await fetchAllTests();
          if (freshTests && freshTests.length > 0) {
            onUpdate(freshTests);
          }
        } catch (e) {
          console.warn('Error fetching fresh tests in realtime listener:', e);
        }
      })
      .subscribe();

    return () => {
      try {
        if (supabase && channel) {
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.warn('Error removing channel:', err);
      }
    };
  } catch (err) {
    console.warn('Realtime subscription exception:', err);
    return () => {};
  }
}
