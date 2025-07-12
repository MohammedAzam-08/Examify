import React from 'react';
import { ExamData } from '../../types/whiteboard';
import { Clock } from 'lucide-react';

interface ExamHeaderProps {
  exam: ExamData;
  currentPage: number;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  saved: boolean;
  handleSave: () => void;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  exam,
  currentPage,
  timeRemaining,
  formatTime,
  saved,
  handleSave
}) => {
  return (
    <>
      {/* Exam header - Fixed position */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{exam?.title}</h1>
            <p className="text-sm text-gray-600 mt-1">Page {currentPage}</p>
          </div>

          <div className="mt-3 sm:mt-0 flex items-center space-x-2">
            <div
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                timeRemaining < 300
                  ? 'bg-red-100 text-red-800'
                  : timeRemaining < 600
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              <Clock size={16} className="mr-1" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exam instructions */}
      <div className="bg-amber-50 border-b border-amber-200 p-4">
        <h2 className="text-sm font-medium text-amber-800">Instructions:</h2>
        <p className="text-sm text-amber-700 mt-1">{exam?.instructions}</p>
      </div>

      {/* Exam Questions - Collapsible */}
      <div className="bg-blue-50 border-b border-blue-200 p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-blue-800">Questions:</h2>
          <button 
            onClick={() => {
              const questions = document.getElementById('exam-questions-container');
              if (questions) {
                questions.classList.toggle('h-48');
                questions.classList.toggle('h-12');
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Toggle Questions
          </button>
        </div>
        <div id="exam-questions-container" className="h-48 overflow-y-auto space-y-4 pr-2 transition-all duration-300">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="text-base text-gray-800 flex-1 leading-relaxed">
                    <span className="font-semibold text-blue-700">Q{index + 1}.</span> {question.text}
                  </p>
                  <span className="text-sm text-blue-600 font-semibold ml-3 bg-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {question.points} pts
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg border border-blue-200 text-center">
              <p className="text-base text-blue-700 italic">No questions available for this exam.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamHeader;
