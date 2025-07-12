import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, GraduationCap, Calendar, TrendingUp, Award, Clock, FileText, BarChart3, PieChart, Target, CheckCircle, XCircle, Star, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from 'recharts';

interface StudentData {
  _id: string;
  name: string;
  email: string;
  course: string;
  semester: number;
  enrolledAt: string;
}

interface ExamSubmission {
  _id: string;
  examId: {
    _id: string;
    title: string;
    subject: string;
    duration: number;
  };
  submittedAt: string;
  score: number | null;
  maxScore: number;
  timeSpent: number;
  status: 'submitted' | 'graded' | 'late';
}

interface ProgressStats {
  totalExams: number;
  submittedExams: number;
  averageScore: number;
  totalTimeSpent: number;
  completionRate: number;
  averageTimePerExam: number;
  highestScore: number;
  lowestScore: number;
  improvementTrend: number;
}

const StudentProgress: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'submissions'>('overview');

  useEffect(() => {
    const fetchStudentProgress = async () => {
      if (!studentId) {
        setError('Student ID is required');
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

        // Fetch student data and submissions in parallel for faster loading
        const [studentResponse, submissionsResponse] = await Promise.all([
          fetch(`/api/users/students/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`/api/submissions/student/${studentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!studentResponse.ok) {
          if (studentResponse.status === 404) {
            throw new Error('Student not found');
          } else if (studentResponse.status === 403) {
            throw new Error('Access denied');
          } else {
            throw new Error(`Failed to fetch student details (${studentResponse.status})`);
          }
        }

        if (!submissionsResponse.ok) {
          console.warn('Failed to fetch submissions, proceeding with empty data');
        }

        const studentData = await studentResponse.json();
        const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : [];

        setStudent(studentData);
        setSubmissions(submissionsData || []);

        // Calculate stats
        const gradedSubmissions = submissionsData.filter((s: ExamSubmission) => s.score !== null);
        const scores = gradedSubmissions.map((s: ExamSubmission) => (s.score! / s.maxScore) * 100);
        
        const calculatedStats: ProgressStats = {
          totalExams: submissionsData.length,
          submittedExams: submissionsData.filter((s: ExamSubmission) => s.status === 'submitted' || s.status === 'graded').length,
          averageScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
          totalTimeSpent: submissionsData.reduce((total: number, s: ExamSubmission) => total + (s.timeSpent || 0), 0),
          completionRate: submissionsData.length > 0 ? (submissionsData.filter((s: ExamSubmission) => s.status !== 'late').length / submissionsData.length) * 100 : 0,
          averageTimePerExam: submissionsData.length > 0 ? submissionsData.reduce((total: number, s: ExamSubmission) => total + (s.timeSpent || 0), 0) / submissionsData.length : 0,
          highestScore: scores.length > 0 ? Math.max(...scores) : 0,
          lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
          improvementTrend: scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0
        };

        setStats(calculatedStats);
      } catch (err) {
        console.error('Error fetching student progress:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProgress();
  }, [studentId, navigate]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Chart data preparation
  const performanceData = submissions
    .filter(s => s.score !== null)
    .map((submission, index) => ({
      exam: `Exam ${index + 1}`,
      score: ((submission.score! / submission.maxScore) * 100).toFixed(1),
      maxScore: 100,
      subject: submission.examId.subject,
      date: new Date(submission.submittedAt).toLocaleDateString()
    }));

  const subjectPerformance = submissions.reduce((acc, submission) => {
    if (submission.score !== null) {
      const subject = submission.examId.subject;
      if (!acc[subject]) {
        acc[subject] = { subject, totalScore: 0, maxScore: 0, count: 0 };
      }
      acc[subject].totalScore += submission.score;
      acc[subject].maxScore += submission.maxScore;
      acc[subject].count += 1;
    }
    return acc;
  }, {} as Record<string, { subject: string; totalScore: number; maxScore: number; count: number }>);

  const subjectData = Object.values(subjectPerformance).map((data) => ({
    subject: data.subject,
    percentage: ((data.totalScore / data.maxScore) * 100).toFixed(1),
    averageScore: (data.totalScore / data.count).toFixed(1),
    examsCount: data.count
  }));

  const timeSpentData = submissions.map((submission, index) => ({
    exam: `Exam ${index + 1}`,
    timeSpent: Math.round(submission.timeSpent / 60), // Convert to minutes
    duration: submission.examId.duration,
    efficiency: ((submission.timeSpent / (submission.examId.duration * 60)) * 100).toFixed(1)
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/instructor/students')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        className="container mx-auto px-4 py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-4 lg:mb-0">
              <button
                onClick={() => navigate('/instructor/students')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">
                    {student?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{student?.name}</h1>
                  <p className="text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {student?.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <div className="flex items-center text-blue-700">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <span className="font-medium">{student?.course}</span>
                </div>
                <p className="text-sm text-blue-600">{student?.semester}th Semester</p>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <div className="flex items-center text-green-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">Enrolled</span>
                </div>
                <p className="text-sm text-green-600">
                  {student?.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalExams || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-green-600">{stats?.averageScore.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.completionRate.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round((stats?.totalTimeSpent || 0) / 3600)}h
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'performance', label: 'Performance Analysis', icon: TrendingUp },
                { id: 'submissions', label: 'Exam History', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'performance' | 'submissions')}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
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
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Subject Performance */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                  Performance by Subject
                </h3>
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ subject, percentage }) => `${subject}: ${percentage}%`}
                      >
                        {subjectData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No exam data available
                  </div>
                )}
              </div>

              {/* Recent Performance Trend */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Score Trend
                </h3>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No exam data available
                  </div>
                )}
              </div>

              {/* Performance Insights */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700 font-medium">Highest Score</span>
                      <Star className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {stats?.highestScore.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-orange-700 font-medium">Lowest Score</span>
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-800">
                      {stats?.lowestScore.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Improvement</span>
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      {stats?.improvementTrend && stats.improvementTrend >= 0 ? '+' : ''}{stats?.improvementTrend?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Score Distribution */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    No exam data available
                  </div>
                )}
              </div>

              {/* Time Efficiency */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Management Analysis</h3>
                {timeSpentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={timeSpentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="exam" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="timeSpent" fill="#10B981" name="Time Spent (min)" />
                      <Bar dataKey="duration" fill="#F59E0B" name="Duration (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    No exam data available
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Exam History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {submissions.length > 0 ? (
                        submissions.map((submission) => (
                          <tr key={submission._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {submission.examId.title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {submission.examId.subject}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {submission.score !== null ? (
                                <div className="flex items-center">
                                  <span className="font-medium text-gray-900">
                                    {submission.score}/{submission.maxScore}
                                  </span>
                                  <span className="ml-2 text-sm text-gray-500">
                                    ({((submission.score / submission.maxScore) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not graded</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.round(submission.timeSpent / 60)} min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  submission.status === 'graded'
                                    ? 'bg-green-100 text-green-800'
                                    : submission.status === 'submitted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {submission.status === 'graded' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {submission.status === 'late' && <XCircle className="w-3 h-3 mr-1" />}
                                {submission.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No exam submissions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default StudentProgress;
