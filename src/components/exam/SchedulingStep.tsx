import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react';

interface SchedulingStepProps {
  formData: {
    date: string;
    time: string;
    duration: number;
    course: string;
    semester: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const SchedulingStep: React.FC<SchedulingStepProps> = ({
  formData,
  onInputChange
}) => {
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
      className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center mb-8"
        variants={itemVariants}
      >
        <div className="p-3 bg-purple-100 rounded-full mr-4">
          <Calendar className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Schedule & Students</h2>
          <p className="text-gray-600">Set the timing and assign students to your exam</p>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Schedule Section */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Schedule Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={onInputChange}
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={onInputChange}
                    required
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={onInputChange}
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
                <option value={180}>180 minutes</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Auto Assignment Info Section */}
        <motion.div variants={itemVariants}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Student Assignment</h3>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2">
                    Automatic Assignment Enabled
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    Students will be automatically assigned based on their enrollment in:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-purple-800">Course:</span>
                      <span className="px-2 py-1 bg-white border border-purple-200 rounded text-purple-700">
                        {formData.course || 'Not selected'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-purple-800">Semester:</span>
                      <span className="px-2 py-1 bg-white border border-purple-200 rounded text-purple-700">
                        {formData.semester ? `${formData.semester} Semester` : 'Not selected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">ℹ</span>
                  </div>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <p>All students enrolled in the selected course and semester will automatically receive access to this exam when it's published.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SchedulingStep;
