import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Save } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  isEdit?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onCancel,
  onSubmit,
  saving,
  isEdit = false
}) => {
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div 
      className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-between items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Left side - Previous/Cancel button */}
      <div>
        {currentStep > 1 ? (
          <motion.button
            type="button"
            onClick={onPrevious}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <ArrowLeft size={18} className="mr-2" />
            Previous
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm transition-all duration-200"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <X size={18} className="mr-2" />
            Cancel
          </motion.button>
        )}
      </div>

      {/* Center - Step indicator */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i + 1 <= currentStep 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                : 'bg-gray-300'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
        <span className="ml-3 text-sm text-gray-600 font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Right side - Next/Submit button */}
      <div>
        {currentStep < totalSteps ? (
          <motion.button
            type="button"
            onClick={onNext}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Next
            <ArrowRight size={18} className="ml-2" />
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            disabled={saving}
            onClick={onSubmit}
            className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            variants={buttonVariants}
            whileHover={!saving ? "hover" : {}}
            whileTap={!saving ? "tap" : {}}
          >
            {saving ? (
              <>
                <motion.div
                  className="w-4 h-4 mr-3 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                {isEdit ? 'Updating Exam...' : 'Creating Exam...'}
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {isEdit ? 'Update Exam' : 'Create Exam'}
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default NavigationButtons;
