import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  TrendingUp,
  Award,
  ChevronRight,
  FileText,
  User
} from 'lucide-react';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  scheduledStart: string;
  duration: number;
  course: string;
  semester: number;
}

interface Submission {
  _id: string;
  examId: {
    _id: string;
    title: string;
    subject: string;
  };
  submittedAt: string;
  score: number | null;
  maxScore: number;
  status: 'submitted' | 'graded' | 'late';
}

interface DashboardStats {
  totalExams: number;
  completedExams: number;
  averageScore: number;
  upcomingExams: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    upcomingExams: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('Token length:', token ? token.length : 0);
        console.log('User:', user);

        // Fetch dashboard data including stats, upcoming exams and recent submissions
        console.log('Making API calls...');
        const [statsResponse, examsResponse, submissionsResponse] = await Promise.all([
          fetch('/api/exams/student/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/exams', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/submissions/my-submissions', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        console.log('API responses received');
        console.log('Stats response status:', statsResponse.status);
        console.log('Exams response status:', examsResponse.status);
        console.log('Submissions response status:', submissionsResponse.status);

        if (!statsResponse.ok) {
          console.warn('Failed to fetch stats, using fallback calculation');
        }

        if (!examsResponse.ok) {
          const errorText = await examsResponse.text();
          console.error('Exams API error:', errorText);
          throw new Error(`Failed to fetch exams: ${errorText}`);
        }

        if (!submissionsResponse.ok) {
          console.warn('Failed to fetch submissions, continuing without submission data');
        }

        const statsData = statsResponse.ok ? await statsResponse.json() : null;
        const examsData = await examsResponse.json();
        const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : [];

        console.log('Received data:');
        console.log('- Stats data:', statsData);
        console.log('- Exams data length:', examsData?.length);
        console.log('- Submissions data length:', submissionsData?.length);

        // Filter upcoming exams for stats calculation
        const now = new Date();
        const upcoming = examsData.filter((exam: Exam) => 
          new Date(exam.scheduledStart) > now
        );

        // Use stats from API if available, otherwise calculate from fetched data
        if (statsData) {
          setStats(statsData);
        } else {
          // Fallback calculation
          const gradedSubmissions = submissionsData.filter((s: Submission) => 
            s.status === 'graded' && s.score !== null
          );
          
          const avgScore = gradedSubmissions.length > 0 
            ? gradedSubmissions.reduce((sum: number, s: Submission) => 
                sum + ((s.score! / s.maxScore) * 100), 0
              ) / gradedSubmissions.length
            : 0;

          setStats({
            totalExams: examsData.length,
            completedExams: submissionsData.length,
            averageScore: Math.round(avgScore),
            upcomingExams: upcoming.length
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
                <p className="text-blue-100 text-lg">
                  Ready to continue your learning journey? Let's make today productive.
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.completedExams}</div>
                    <div className="text-sm text-blue-100">Exams Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.averageScore}%</div>
                    <div className="text-sm text-blue-100">Average Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedExams}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingExams}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/student/exams"
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">View All Exams</p>
                    <p className="text-sm text-gray-600">See your exam schedule</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>

                <Link
                  to="/student/study-resources"
                  className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Study Resources</p>
                    <p className="text-sm text-gray-600">Access study materials</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>

                <Link
                  to="/student/profile"
                  className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">My Profile</p>
                    <p className="text-sm text-gray-600">Update your information</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Keep Up the Great Work!</h2>
                <p className="text-green-100">
                  You've completed {stats.completedExams} exams with an average score of {stats.averageScore}%. 
                  {stats.averageScore >= 80 && " Excellent performance!"}
                  {stats.averageScore >= 70 && stats.averageScore < 80 && " Good job, keep improving!"}
                  {stats.averageScore < 70 && " Keep studying and you'll improve!"}
                </p>
              </div>
              <div className="hidden md:block">
                <Award className="w-16 h-16 text-green-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Section - Show when no exams */}
        {!loading && stats.totalExams === 0 && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Getting Started</h3>
                <p className="text-gray-600 mb-3">
                  Welcome to Examify! You haven't been enrolled in any exams yet. 
                  Your instructor will assign exams that will appear here.
                </p>
                <p className="text-sm text-gray-500">
                  In the meantime, you can explore study resources and update your profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;