import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  instructor: {
    name: string;
  };
  scheduledStart: string;
  duration: number;
  status: 'upcoming' | 'in-progress' | 'completed';
  score?: number | string;
  hasSubmission?: boolean;
  submittedAt?: string;
}

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
const fetchExams = async () => {
  setLoading(true);
  setError(null);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/exams', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    const data = await response.json();
    console.log('Fetched exams:', data); // Debug log to check exam data

    // Check submission status for each exam
    const mappedExams = await Promise.all(data.map(async (exam: Exam) => {
      const startTime = new Date(exam.scheduledStart).getTime();
      const endTime = startTime + (exam.duration * 60 * 1000); // duration in minutes to milliseconds
      const currentTime = Date.now();
      
      let status: 'upcoming' | 'in-progress' | 'completed';
      if (currentTime < startTime) {
        status = 'upcoming';
      } else if (currentTime >= startTime && currentTime <= endTime) {
        status = 'in-progress';
      } else {
        status = 'completed';
      }

      // Check if student has submitted this exam
      let hasSubmission = false;
      let submittedAt = undefined;
      try {
        const submissionResponse = await fetch(`/api/submissions/check/${exam._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          hasSubmission = submissionData.hasSubmission;
          submittedAt = submissionData.submittedAt;
        }
      } catch {
        console.warn('Failed to check submission status for exam:', exam._id);
      }
      
      return {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        instructor: exam.instructor ? { name: exam.instructor.name } : { name: 'Unknown' },
        scheduledStart: exam.scheduledStart,
        duration: exam.duration,
        status,
        score: exam.score !== undefined ? exam.score : 'pending',
        hasSubmission,
        submittedAt,
      };
    }));

    setExams(mappedExams);
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'Error fetching exams');
  } finally {
    setLoading(false);
  }
};

    fetchExams();
  }, []);

  const filteredExams = exams.filter((exam: Exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = false;
    if (filter === 'all') {
      matchesFilter = true;
    } else if (filter === 'submitted') {
      matchesFilter = exam.hasSubmission === true;
    } else {
      matchesFilter = exam.status === filter;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-blue-600 font-medium">Fetching your exams...</p>
        <p className="text-gray-500 text-sm mt-1">Please wait while we load your exam schedule</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600 animate-fade-in">Error: {error}</div>;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <motion.h1
          className="text-3xl font-extrabold text-gray-800"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          📚 My Exams
        </motion.h1>

        <motion.div
          className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-blue-50"
              placeholder="Search exams..."
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full py-2 px-3 border border-blue-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Exams</option>
            <option value="upcoming">Upcoming</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="submitted">Submitted</option>
          </select>
        </motion.div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {filteredExams.length > 0 ? (
          <div className="divide-y divide-gray-200">
{filteredExams.map((exam, idx) => {
  const examDate = new Date(exam.scheduledStart);
  const isUpcoming = exam.status === 'upcoming';
  const isInProgress = exam.status === 'in-progress';
  const isToday = new Date().toDateString() === examDate.toDateString();

  console.log(`Exam ${exam._id}: status=${exam.status}, isUpcoming=${isUpcoming}, isInProgress=${isInProgress}, score=${exam.score}`);

  return (
    <motion.div
      key={exam._id}
      className="p-6 hover:bg-gray-50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{exam.title}</h2>
          <p className="text-sm text-gray-600">
            {exam.subject} • {exam.instructor.name}
          </p>

          <div className="mt-3 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>
                {examDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              <span>
                {examDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center">
              <span>{exam.duration} minutes</span>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end space-y-3">
          {isUpcoming ? (
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                isToday ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isToday ? 'Today' : 'Upcoming'}
            </div>
          ) : isInProgress ? (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              In Progress
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Completed
            </div>
          )}

          {/* Show submission status if exam has been submitted */}
          {exam.hasSubmission && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={14} className="mr-1" />
              Submitted
            </div>
          )}

          {exam.status === 'completed' && exam.score !== 'pending' && !exam.hasSubmission && (
            <div className="inline-flex items-center">
              <CheckCircle size={16} className="mr-1 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Score: {exam.score}%</span>
            </div>
          )}

          {exam.status === 'completed' && exam.score === 'pending' && !exam.hasSubmission && (
            <div className="inline-flex items-center">
              <AlertTriangle size={16} className="mr-1 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Pending Review</span>
            </div>
          )}

          {/* Action buttons based on exam status and submission */}
          {exam.hasSubmission ? (
            <Link
              to={`/student/exam/${exam._id}/review`}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md shadow-sm text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View Submission
            </Link>
          ) : (isUpcoming || isInProgress) ? (
            <Link
              to={`/student/exam/${exam._id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Attend Exam
            </Link>
          ) : exam.score === 'pending' ? (
            <Link
              to={`/student/exam/${exam._id}/review`}
              className="inline-flex items-center px-4 py-2 border border-yellow-400 text-sm font-medium rounded-md shadow-sm text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Review
            </Link>
          ) : (
            <Link
              to={`/student/exam/${exam._id}/result`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Exam
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
})}
          </div>
        ) : (
          <motion.div
            className="p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No exams found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? `No exams match "${searchTerm}"`
                : filter !== 'all'
                ? `You don't have any ${filter} exams`
                : "You don't have any exams yet"}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ExamList;
