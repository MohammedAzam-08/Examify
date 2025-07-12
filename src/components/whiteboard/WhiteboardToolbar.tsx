import React from 'react';
import { Pencil, Eraser, Minus, Square, Circle as CircleIcon, ArrowLeft, ArrowRight, Save, Check } from 'lucide-react';

interface ToolbarProps {
  tool: 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle';
  setTool: (tool: 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle') => void;
  currentPage: number;
  changePage: (page: number) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  colors: string[];
  saved: boolean;
  handleSave: () => void;
  submitting: boolean;
  handleSubmit: () => void;
}

const WhiteboardToolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  currentPage,
  changePage,
  currentColor,
  setCurrentColor,
  colors,
  saved,
  handleSave,
  submitting,
  handleSubmit
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 z-10">
      <div className="flex items-center justify-between mb-3">
        {/* Drawing Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-md focus:outline-none ${
              tool === 'pen' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Pen"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-md focus:outline-none ${
              tool === 'eraser' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
          
          {/* Shape Tools */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button
            onClick={() => setTool('line')}
            className={`p-2 rounded-md focus:outline-none ${
              tool === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Line"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-2 rounded-md focus:outline-none ${
              tool === 'rectangle' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Rectangle"
          >
            <Square size={20} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-md focus:outline-none ${
              tool === 'circle' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Circle"
          >
            <CircleIcon size={20} />
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm text-gray-600">Page {currentPage}</span>
          <button
            onClick={() => changePage(currentPage + 1)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Submit Button - Enhanced for better feedback */}
        <button
          onClick={() => {
            if (!submitting) {
              // Show immediate feedback
              const button = document.activeElement as HTMLElement;
              if (button) {
                // Flash the button to show it was clicked
                button.classList.add('bg-green-700');
                setTimeout(() => button.classList.remove('bg-green-700'), 200);
              }
              console.log('Submit button clicked, starting submission process...');
              handleSubmit();
            } else {
              console.log('Submission already in progress, ignoring click');
            }
          }}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed relative"
          style={{ minWidth: '130px' }}
        >
          {submitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Check size={16} className="mr-1" />
              Submit Exam
            </>
          )}
        </button>
      </div>

      {/* Color Palette */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-1 bg-gray-50 p-2 rounded-lg">
          <span className="text-xs text-gray-600 mr-2">Colors:</span>
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded border-2 focus:outline-none ${
                currentColor === color ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} className="mr-1" />
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default WhiteboardToolbar;
