import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown, Clock, CheckCircle, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  scheduledStart: string;
  duration: number;
  studentsEnrolled: number;
  status: 'upcoming' | 'in-progress' | 'completed';
}

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch('/api/exams', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setExams(data);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams
    .filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exam.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Calculate the actual status based on the current time
      const examDate = new Date(exam.scheduledStart);
      const currentTime = new Date();
      const examEnd = new Date(examDate.getTime() + exam.duration * 60 * 1000);
      const actualStatus: 'upcoming' | 'in-progress' | 'completed' =
        currentTime < examDate
          ? 'upcoming'
          : currentTime <= examEnd
          ? 'in-progress'
          : 'completed';
      
      const matchesFilter = filter === 'all' || actualStatus === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else {
        return sortDirection === 'asc'
          ? new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
          : new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime();
      }
    });

  const handleSort = (column: 'title' | 'date') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 px-4 sm:px-8 py-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📘 My Exams</h1>
        <Link
          to="/instructor/exams/create"
          className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white px-5 py-2 rounded-xl font-medium shadow hover:shadow-md"
        >
          + Create New Exam
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search exams..."
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="py-2 px-3 border border-gray-300 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Exams</option>
                <option value="upcoming">Upcoming</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {['title', 'date'].map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as 'title' | 'date')}
                      className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer transition hover:text-blue-600"
                    >
                      <div className="flex items-center">
                        {key === 'title' ? 'Exam Title' : 'Date'}
                        {sortBy === key && (
                          <ArrowUpDown
                            size={14}
                            className={`ml-1 transition-transform ${
                              sortDirection === 'asc' ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((exam) => {
                  const examDate = new Date(exam.scheduledStart);
                  const currentTime = new Date();
                  const examEnd = new Date(examDate.getTime() + exam.duration * 60 * 1000);
                  const status: 'upcoming' | 'in-progress' | 'completed' =
                    currentTime < examDate
                      ? 'upcoming'
                      : currentTime <= examEnd
                      ? 'in-progress'
                      : 'completed';

                  const statusColors = {
                    upcoming: 'bg-blue-100 text-blue-800',
                    'in-progress': 'bg-yellow-100 text-yellow-800',
                    completed: 'bg-green-100 text-green-800'
                  };

                  const statusIcon = {
                    upcoming: <Clock size={12} className="mr-1" />,
                    'in-progress': <Play size={12} className="mr-1" />,
                    completed: <CheckCircle size={12} className="mr-1" />
                  };

                  return (
                    <motion.tr
                      key={exam._id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{exam.title}</div>
                        <div className="text-gray-500">{exam.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {examDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-gray-500">
                          {examDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{exam.course}</div>
                        <div className="text-gray-500">{exam.semester}th Sem</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{exam.studentsEnrolled} enrolled</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
                        >
                          {statusIcon[status]} {status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/instructor/exams/${exam._id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          to={`/instructor/exams/${exam._id}/students`}
                          className="text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                          Students
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
                {filteredExams.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      No exams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExamList;
