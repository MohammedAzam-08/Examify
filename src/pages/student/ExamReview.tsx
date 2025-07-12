import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trophy,
  Target,
  TrendingUp,
  FileText,
  Download,
  Eye,
  Award,
  BarChart3
} from 'lucide-react';

interface ExamData {
  _id: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  duration: number;
  scheduledStart: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  questions: Array<{
    id: string;
    question: string;
    points: number;
  }>;
  maxScore: number;
}

interface Submission {
  _id: string;
  examId: string;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  timeSpent: number;
  status: 'submitted' | 'graded' | 'late';
  answers?: Array<{
    questionId: string;
    answer: string;
    points?: number;
  }>;
  feedback?: string;
}

const ExamReview: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'feedback'>('overview');

  useEffect(() => {
    const fetchExamReview = async () => {
      if (!examId) {
        setError('Exam ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth/login');
          return;
        }

        // Fetch exam details and submission in parallel
        const [examResponse, submissionResponse] = await Promise.all([
          fetch(`/api/exams/${examId}?review=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/submissions/exam/${examId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!examResponse.ok) {
          throw new Error(`Failed to fetch exam: ${examResponse.status}`);
        }

        const examData = await examResponse.json();
        setExam(examData);

        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          setSubmission(submissionData);
        } else {
          console.warn('No submission found for this exam');
        }
      } catch (err) {
        console.error('Error fetching exam review:', err);
        setError(err instanceof Error ? err.message : 'Failed to load exam review');
      } finally {
        setLoading(false);
      }
    };

    fetchExamReview();
  }, [examId, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  // Calculate performance metrics
  const getPerformanceData = () => {
    if (!submission || submission.score === null) return null;

    const percentage = Math.round((submission.score / submission.maxScore) * 100);
    const timeEfficiency = submission.timeSpent / (exam?.duration ? exam.duration * 60 : 1);
    
    let grade = 'F';
    let gradeColor = 'text-red-600';
    let bgColor = 'bg-red-50';
    
    if (percentage >= 90) {
      grade = 'A+';
      gradeColor = 'text-green-600';
      bgColor = 'bg-green-50';
    } else if (percentage >= 85) {
      grade = 'A';
      gradeColor = 'text-green-600';
      bgColor = 'bg-green-50';
    } else if (percentage >= 80) {
      grade = 'B+';
      gradeColor = 'text-blue-600';
      bgColor = 'bg-blue-50';
    } else if (percentage >= 75) {
      grade = 'B';
      gradeColor = 'text-blue-600';
      bgColor = 'bg-blue-50';
    } else if (percentage >= 70) {
      grade = 'C+';
      gradeColor = 'text-yellow-600';
      bgColor = 'bg-yellow-50';
    } else if (percentage >= 65) {
      grade = 'C';
      gradeColor = 'text-yellow-600';
      bgColor = 'bg-yellow-50';
    } else if (percentage >= 60) {
      grade = 'D';
      gradeColor = 'text-orange-600';
      bgColor = 'bg-orange-50';
    }

    return {
      percentage,
      grade,
      gradeColor,
      bgColor,
      timeEfficiency: Math.round(timeEfficiency * 100)
    };
  };

  const performanceData = getPerformanceData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-600 text-lg">Loading exam review...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Review</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            onClick={() => navigate('/student/exams')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Exams
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-6">The requested exam could not be found.</p>
          <motion.button
            onClick={() => navigate('/student/exams')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Exams
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <motion.div
        className="container mx-auto px-4 py-6 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <motion.button
            onClick={() => navigate('/student/exams')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
            whileHover={{ x: -5 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Back to Exams
          </motion.button>
          
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <motion.h1 
                  className="text-3xl font-bold text-gray-900 mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {exam.title}
                </motion.h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {exam.subject}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {exam.instructor.name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(exam.scheduledStart).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {exam.duration} minutes
                  </div>
                </div>
              </div>
              
              {submission && performanceData && (
                <motion.div 
                  className={`${performanceData.bgColor} rounded-2xl p-6 min-w-[200px]`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${performanceData.gradeColor} mb-2`}>
                      {performanceData.grade}
                    </div>
                    <div className="text-2xl font-semibold text-gray-800 mb-1">
                      {performanceData.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {submission.score}/{submission.maxScore} points
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status Cards */}
        {submission && (
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{submission.status}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  {submission.status === 'graded' ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : submission.status === 'late' ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-orange-600" />
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Time Spent</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(submission.timeSpent / 60)} min
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </motion.div>

            {performanceData && (
              <motion.div 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-lg font-bold text-gray-900">
                      {performanceData.timeEfficiency}%
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'details', label: 'Exam Details', icon: FileText },
                { id: 'feedback', label: 'Feedback', icon: Award }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'details' | 'feedback')}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.id === 'overview' ? 'Overview' : tab.id === 'details' ? 'Details' : 'Feedback'}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {submission && performanceData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                    variants={cardVariants}
                    whileHover="hover"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                      Performance Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Final Score</span>
                        <span className="font-semibold text-lg">{submission.score}/{submission.maxScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Percentage</span>
                        <span className={`font-semibold text-lg ${performanceData.gradeColor}`}>
                          {performanceData.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Grade</span>
                        <span className={`font-bold text-2xl ${performanceData.gradeColor}`}>
                          {performanceData.grade}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${performanceData.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                    variants={cardVariants}
                    whileHover="hover"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Time Analysis
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Allocated</span>
                        <span className="font-semibold">{exam.duration} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Used</span>
                        <span className="font-semibold">{Math.round(submission.timeSpent / 60)} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Efficiency</span>
                        <span className="font-semibold">{performanceData.timeEfficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(performanceData.timeEfficiency, 100)}%` }}
                          transition={{ duration: 1, delay: 0.7 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <motion.div 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center"
                  variants={cardVariants}
                >
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submission Found</h3>
                  <p className="text-gray-600 mb-6">You haven't submitted this exam yet.</p>
                  <motion.button
                    onClick={() => navigate(`/student/exam/${examId}`)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Take Exam
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                variants={cardVariants}
                whileHover="hover"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Exam Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Course</label>
                      <p className="text-gray-900">{exam.course} - Semester {exam.semester}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Instructor</label>
                      <p className="text-gray-900">{exam.instructor.name}</p>
                      <p className="text-sm text-gray-500">{exam.instructor.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Total Questions</label>
                      <p className="text-gray-900">{exam.questions.length} questions</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Scheduled Date</label>
                      <p className="text-gray-900">
                        {new Date(exam.scheduledStart).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Duration</label>
                      <p className="text-gray-900">{exam.duration} minutes</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Maximum Score</label>
                      <p className="text-gray-900">{exam.maxScore} points</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                variants={cardVariants}
                whileHover="hover"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-600" />
                  Instructor Feedback
                </h3>
                {submission?.feedback ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-800">{submission.feedback}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No feedback available yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Feedback will appear here once your instructor reviews your submission
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
        >
          <motion.button
            onClick={() => navigate('/student/exams')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Exams
          </motion.button>
          
          {!submission && (
            <motion.button
              onClick={() => navigate(`/student/exam/${examId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Take Exam
            </motion.button>
          )}
          
          {submission && (
            <motion.button
              onClick={() => window.print()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ExamReview;
