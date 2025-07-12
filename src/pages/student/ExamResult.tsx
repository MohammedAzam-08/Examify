import React from 'react';
import { useParams, Link } from 'react-router-dom';

// Mock exam results data (in a real app, fetch from API)
const mockExamResults = {
  '1': {
    title: 'Mathematics Midterm',
    subject: 'Mathematics',
    instructor: 'Dr. Smith',
    date: '2025-06-15T09:00:00',
    duration: 120,
    score: 92,
    status: 'completed',
    feedback: 'Great job! Keep up the good work.',
  },
  '2': {
    title: 'Physics Lab Test',
    subject: 'Physics',
    instructor: 'Prof. Johnson',
    date: '2025-06-18T14:00:00',
    duration: 90,
    score: 88,
    status: 'completed',
    feedback: 'Well done on the lab test.',
  },
  '3': {
    title: 'Chemistry Quiz',
    subject: 'Chemistry',
    instructor: 'Dr. Williams',
    date: '2025-06-01T15:30:00',
    duration: 45,
    score: 85,
    status: 'completed',
    feedback: 'Good understanding of the material.',
  },
  '4': {
    title: 'Biology Test',
    subject: 'Biology',
    instructor: 'Prof. Davis',
    date: '2025-05-28T10:15:00',
    duration: 60,
    score: null,
    status: 'completed',
    feedback: 'Pending review.',
  },
};

const ExamResult: React.FC = () => {
  const { examId } = useParams<{ examId?: string }>();
  const exam = examId ? mockExamResults[examId as keyof typeof mockExamResults] : null;

  if (!exam) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Exam Result Not Found</h2>
        <Link to="/student/exams" className="text-blue-600 hover:underline">
          Back to Exams
        </Link>
      </div>
    );
  }

  const examDate = new Date(exam.date);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Exam Result</h1>
      <h2 className="text-xl font-semibold">{exam.title}</h2>
      <p className="text-gray-600 mb-2">
        Subject: {exam.subject} | Instructor: {exam.instructor}
      </p>
      <p className="text-gray-600 mb-2">
        Date: {examDate.toLocaleDateString()} at {examDate.toLocaleTimeString()}
      </p>
      <p className="text-gray-600 mb-4">Duration: {exam.duration} minutes</p>

      <div className="mb-4">
        <span className="font-semibold">Status:</span> {exam.status}
      </div>

      <div className="mb-4">
        <span className="font-semibold">Score:</span>{' '}
        {exam.score !== null ? `${exam.score}%` : 'Pending'}
      </div>

      <div className="mb-4">
        <span className="font-semibold">Feedback:</span>
        <p className="mt-1">{exam.feedback}</p>
      </div>

      <Link
        to="/student/exams"
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Exams
      </Link>
    </div>
  );
};

export default ExamResult;
