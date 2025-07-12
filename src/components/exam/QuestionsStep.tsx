import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FileQuestion, Award } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  points: number;
}

interface QuestionsStepProps {
  questions: Question[];
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, field: keyof Question, value: string | number) => void;
  onRemoveQuestion: (id: string) => void;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion
}) => {
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
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100, transition: { duration: 0.3 } }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <motion.div
      className="p-8 bg-gradient-to-br from-green-50 to-emerald-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full mr-4">
            <FileQuestion className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Exam Questions</h2>
            <p className="text-gray-600">Create and manage your exam questions</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center text-sm">
              <Award className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="font-medium text-gray-700">Total Points: {totalPoints}</span>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={onAddQuestion}
            className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add a new question"
          >
            <Plus size={18} className="mr-2" />
            Add Question
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence>
        {questions.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileQuestion className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions added yet</h3>
            <p className="text-gray-500 mb-6">Your exam needs at least one question</p>
            <motion.button
              type="button"
              onClick={onAddQuestion}
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} className="mr-2" />
              Add Question
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                layout
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">Question {index + 1}</h3>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => onRemoveQuestion(question.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Text */}
                    <div className="lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) =>
                          onUpdateQuestion(question.id, 'text', e.target.value)
                        }
                        className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                        rows={4}
                        placeholder="Enter your question here..."
                      />
                    </div>

                    {/* Points */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Points
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100}
                          step={1}
                          value={question.points}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            onUpdateQuestion(
                              question.id,
                              'points',
                              isNaN(value) ? 0 : value
                            );
                          }}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          placeholder="10"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Award className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">1–100 points</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionsStep;
