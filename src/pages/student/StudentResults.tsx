import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, Clock, TrendingUp, BookOpen, Eye, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../utils/apiClient';

interface ExamResult {
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
  status: string;
}

const StudentResults: React.FC = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'graded' | 'pending'>('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const submissions = await api.submissions.getMySubmissions();
        setResults(submissions);
      } catch (err) {
        console.error('Error fetching submissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'graded') return result.score !== null;
    if (filter === 'pending') return result.score === null;
    return true;
  });

  const gradedResults = results.filter(r => r.score !== null);
  const averageScore = gradedResults.length > 0 
    ? Math.round(gradedResults.reduce((sum, r) => sum + (r.score || 0), 0) / gradedResults.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number | null) => {
    if (score === null) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Results</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Award className="mr-3 text-blue-600" size={32} />
            My Results
          </h1>
          <p className="text-gray-600 mt-1">Track your exam performance and progress</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <BookOpen className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exams Completed</p>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Results</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All Results', count: results.length },
              { key: 'graded', label: 'Graded', count: gradedResults.length },
              { key: 'pending', label: 'Pending', count: results.filter(r => r.score === null).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'graded' | 'pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Results List */}
        <div className="divide-y divide-gray-200">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' ? 'You haven\'t completed any exams yet.' : `No ${filter} results found.`}
              </p>
            </div>
          ) : (
            filteredResults.map((result, index) => (
              <motion.div
                key={result._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{result.examId.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(result.score)}`}>
                        {result.score !== null ? 'graded' : 'pending'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <BookOpen size={16} className="mr-2" />
                        {result.examId.subject}
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2" />
                        {result.examId.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {new Date(result.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {result.score !== null && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Score:</span>
                        <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                          {result.score}/{result.maxScore} ({Math.round((result.score / result.maxScore) * 100)}%)
                        </span>
                      </div>
                    )}

                    {result.timeSpent > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Time Spent:</strong> {Math.round(result.timeSpent / 60)} minutes
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex items-center space-x-3">
                    {result.score !== null && (
                      <Link
                        to={`/student/exam/${result.examId._id}/review`}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={16} className="mr-1" />
                        Review
                      </Link>
                    )}
                    <ChevronRight className="text-gray-400" size={20} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentResults;
