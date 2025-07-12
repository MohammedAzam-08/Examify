import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, FileText, Calendar, Users, Award } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  points: number;
}

interface ReviewStepProps {
  formData: {
    title: string;
    subject: string;
    course: string;
    semester: string;
    targetGroup: string;
    instructions: string;
    date: string;
    time: string;
    duration: number;
    questions: Question[];
  };
  isEdit?: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  formData, 
  isEdit = false 
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

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center mb-8"
        variants={itemVariants}
      >
        <div className="p-3 bg-emerald-100 rounded-full mr-4">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Review Exam Details</h2>
          <p className="text-gray-600">Verify all information before {isEdit ? 'updating' : 'creating'} the exam</p>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Exam Information */}
        <motion.div variants={itemVariants}>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-emerald-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Exam Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Title</p>
                  <p className="text-base text-gray-900 font-medium">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subject</p>
                  <p className="text-base text-gray-900">{formData.subject}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Course</p>
                  <p className="text-base text-gray-900">{formData.course}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Semester</p>
                  <p className="text-base text-gray-900">{formData.semester}th Semester</p>
                </div>
              </div>
              
              {formData.targetGroup && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Target Group</p>
                  <p className="text-base text-gray-900">{formData.targetGroup}</p>
                </div>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Instructions</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 leading-relaxed">{formData.instructions}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Schedule & Stats */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Schedule */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-emerald-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Schedule</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Date</span>
                <span className="text-sm text-gray-900 font-medium">{formatDate(formData.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Time</span>
                <span className="text-sm text-gray-900 font-medium">{formatTime(formData.time)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Duration</span>
                <span className="text-sm text-gray-900 font-medium">{formData.duration} minutes</span>
              </div>
            </div>
          </div>

          {/* Questions Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Award className="w-5 h-5 text-emerald-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Questions Overview</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{formData.questions.length}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Assigned Students */}
      <motion.div variants={itemVariants}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-emerald-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Student Assignment</h3>
            </div>
            <span className="text-sm text-gray-600 bg-emerald-50 px-3 py-1 rounded-full">
              Auto-assigned
            </span>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-emerald-800 mb-2">
                  Automatic Assignment Active
                </h4>
                <p className="text-sm text-emerald-700 mb-3">
                  Students will be automatically assigned based on enrollment in:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-emerald-800">Course:</span>
                    <span className="px-2 py-1 bg-white border border-emerald-200 rounded text-emerald-700">
                      {formData.course}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-emerald-800">Semester:</span>
                    <span className="px-2 py-1 bg-white border border-emerald-200 rounded text-emerald-700">
                      {formData.semester} Semester
                    </span>
                  </div>
                </div>
                <p className="text-xs text-emerald-600 mt-3">
                  All enrolled students will automatically receive exam access when published.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Warning */}
      <motion.div variants={itemVariants}>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  Once {isEdit ? 'updated' : 'created'}, students will {isEdit ? 'see the updated information and' : ''} be able to access this exam at the scheduled time. 
                  {!isEdit && ' Make sure all details are correct before proceeding.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewStep;
