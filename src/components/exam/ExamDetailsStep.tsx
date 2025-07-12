import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface ExamFormData {
  title: string;
  subject: string;
  course: string;
  semester: string;
  targetGroup: string;
  instructions: string;
}

interface ExamDetailsStepProps {
  formData: ExamFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ExamDetailsStep: React.FC<ExamDetailsStepProps> = ({ formData, onInputChange }) => {
  const courses = ['MCA', 'BCA', 'BSc'];
  const semesters = Array.from({ length: 8 }, (_, i) => (i + 1).toString());

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center mb-6"
        variants={itemVariants}
      >
        <div className="p-3 bg-blue-100 rounded-full mr-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Information</h2>
          <p className="text-gray-600">Provide basic details about your exam</p>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              required
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Mathematics Midterm Exam"
            />
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={onInputChange}
              required
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Mathematics, Physics, etc."
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label htmlFor="targetGroup" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Class/Group (Optional)
            </label>
            <input
              type="text"
              id="targetGroup"
              name="targetGroup"
              value={formData.targetGroup}
              onChange={onInputChange}
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Section A, Batch 2025"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <label htmlFor="course" className="block text-sm font-semibold text-gray-700 mb-2">
                Course
              </label>
              <select
                id="course"
                name="course"
                value={formData.course}
                onChange={onInputChange}
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <label htmlFor="semester" className="block text-sm font-semibold text-gray-700 mb-2">
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={formData.semester}
                onChange={onInputChange}
                required
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem}th Semester</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <label htmlFor="instructions" className="block text-sm font-semibold text-gray-700 mb-2">
              Exam Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={onInputChange}
              rows={6}
              className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Provide detailed instructions for students..."
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              These instructions will be displayed to students at the beginning of the exam.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ExamDetailsStep;
