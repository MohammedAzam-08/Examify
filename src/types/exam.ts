export interface Exam {
  id: string;
  title: string;
  subject: string;
  instructions: string;
  date: string;
  duration: number;
  status: 'upcoming' | 'completed';
  instructorId?: string;
  score?: number | 'pending';
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  pdfUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor';
}