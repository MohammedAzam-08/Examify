import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, UserRoundX, ArrowLeft } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Exam {
  id: string;
  title: string;
  enrolledStudents: Student[];
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const ExamStudents: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch exam details');
        const data = await response.json();
        setExam(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="text-center py-20 text-red-600 text-lg font-medium"
      >
        ❌ Error: {error}
      </motion.div>
    );
  }

  if (!exam) {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="text-center py-20 text-gray-500 text-lg"
      >
        No exam found.
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-4 sm:px-8 py-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          🧑‍🎓 Students Enrolled in <span className="text-blue-600">{exam.title}</span>
        </h1>
        <Link
          to="/instructor/exams"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Exams
        </Link>
      </div>

      {exam.enrolledStudents.length === 0 ? (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center bg-white border border-dashed border-gray-300 p-10 rounded-2xl shadow"
        >
          <UserRoundX className="text-gray-400 w-10 h-10 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No students are enrolled in this exam.</p>
        </motion.div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-600 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {exam.enrolledStudents.map((student) => (
                <motion.tr
                  key={student._id}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-blue-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{student.email}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default ExamStudents;
