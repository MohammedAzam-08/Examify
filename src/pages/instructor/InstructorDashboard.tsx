import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PenTool, FileText, CheckCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExamStats {
  totalExams: number;
  upcomingExams: number;
  completedExams: number;
  totalStudents: number;
}

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    location.state?.success ? location.state.message || "Operation completed successfully!" : null
  );
  const [stats, setStats] = useState<ExamStats>({
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0,
    totalStudents: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch exam statistics
        const statsResponse = await fetch('/api/exams/instructor/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  // Add useEffect to auto-hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  return (
    <div className="space-y-8">
      {/* Success notification */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="bg-green-100 border border-green-200 text-green-800 rounded-lg p-4 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              <span>{showSuccessMessage}</span>
            </div>
            <button 
              onClick={() => setShowSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Prof. {user?.name}!</h1>
        <p>Manage your exams and track student progress efficiently.</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Total Exams</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalExams}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Active Students</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalStudents}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Upcoming Exams</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.upcomingExams}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/instructor/exams/create"
              className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <PenTool size={20} className="text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-blue-900">Create Exam</h3>
                <p className="text-sm text-blue-700">Set up a new exam</p>
              </div>
            </Link>
            
            <Link
              to="/instructor/exams"
              className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="bg-purple-100 p-3 rounded-full">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-purple-900">View Exams</h3>
                <p className="text-sm text-purple-700">Manage existing exams</p>
              </div>
            </Link>
            
            <Link
              to="/instructor/submissions"
              className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-green-900">Grade Submissions</h3>
                <p className="text-sm text-green-700">Review pending work</p>
              </div>
            </Link>
            
            <Link
              to="/instructor/students"
              className="flex items-center p-4 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
            >
              <div className="bg-orange-100 p-3 rounded-full">
                <Users size={20} className="text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-orange-900">Student Progress</h3>
                <p className="text-sm text-orange-700">Track performance</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;