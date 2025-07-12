import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  role: 'student' | 'instructor';
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  instructions: string | null;
  duration: number;
  scheduled_start: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
};

export type ExamEnrollment = {
  id: string;
  exam_id: string;
  student_id: string;
  created_at: string;
};

export type ExamSubmission = {
  id: string;
  exam_id: string;
  student_id: string;
  pdf_url: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};