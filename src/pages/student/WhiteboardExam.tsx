import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Rect, Circle } from 'react-konva';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, Eraser, Pencil, Save, Check, ArrowLeft, ArrowRight, Minus, Square, Circle as CircleIcon, Upload } from 'lucide-react';
import { uploadPDFBufferToCloudinary } from '../../utils/apiClient';
import Konva from 'konva';

interface LineElement {
  points: number[];
  tool: string;
  color: string;
  strokeWidth: number;
}

interface ShapeElement {
  id?: string;
  type: 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  color: string;
  strokeWidth: number;
}

interface ExamData {
  _id: string;
  title: string;
  instructions: string;
  duration: number;
  scheduledStart: string;
  questions: Array<{
    text: string;
    points: number;
  }>;
}

const WhiteboardExam: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Whiteboard state
  const [tool, setTool] = useState<'pen' | 'eraser' | 'line' | 'rectangle' | 'circle'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lines, setLines] = useState<LineElement[]>([]);
  const [shapes, setShapes] = useState<ShapeElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<{ [key: number]: { lines: LineElement[], shapes: ShapeElement[] } }>({ 1: { lines: [], shapes: [] } });
  const [saved, setSaved] = useState(true);

  // Color palette
  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#808080', // Gray
  ];

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>('');

  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({
    width: 800,  // Default width
    height: 600, // Default height
  });

  // Fetch exam data on mount
  useEffect(() => {
    const fetchExam = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/exams/${examId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          if (response.status === 409) {
            // Student has already submitted this exam
            const errorData = await response.json();
            setError(errorData.message || 'You have already submitted this exam');
            return;
          }
          throw new Error('Failed to fetch exam data');
        }
        
        const data = await response.json();
        setExam(data);

        // Load saved timeRemaining from localStorage if available
        const savedTime = localStorage.getItem(`exam-${examId}-timeRemaining`);
        if (savedTime !== null) {
          const parsedTime = parseInt(savedTime, 10);
          if (!isNaN(parsedTime) && parsedTime > 0) {
            setTimeRemaining(parsedTime);
          } else {
            setTimeRemaining(data.duration * 60);
          }
        } else {
          setTimeRemaining(data.duration * 60);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  // Initialize stage size
  useEffect(() => {
    const updateStageSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        // Make the whiteboard much larger to provide more writing space
        // Width matches container, height is much larger for scrolling
        setStageSize({
          width: clientWidth > 0 ? clientWidth - 20 : 800, // Subtract padding
          height: 1200, // Fixed large height for better writing experience
        });
      }
    };

    // Initial size setup with a slight delay to ensure container is rendered
    const timer = setTimeout(updateStageSize, 100);

    // Set up window resize handler (only update width, keep height fixed)
    const handleResize = () => updateStageSize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Setup timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          localStorage.removeItem(`exam-${examId}-timeRemaining`);
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(`exam-${examId}-timeRemaining`, newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  // Auto-save to local storage every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (!saved) {
        saveToLocalStorage();
        setSaved(true);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved, pages, currentPage]);

  // Load from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`exam-${examId}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setPages(parsedData.pages);
        setCurrentPage(parsedData.currentPage);
        const pageData = parsedData.pages[parsedData.currentPage] || { lines: [], shapes: [] };
        setLines(pageData.lines);
        setShapes(pageData.shapes);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [examId]);

  const saveToLocalStorage = () => {
    const updatedPages = { ...pages, [currentPage]: { lines: lines || [], shapes: shapes || [] } };
    localStorage.setItem(`exam-${examId}`, JSON.stringify({
      pages: updatedPages,
      currentPage,
    }));
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    setIsDrawing(true);
    setSaved(false);

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    
    setStartPos(pos);

    if (tool === 'pen' || tool === 'eraser') {
      const newLine: LineElement = {
        points: [pos.x, pos.y],
        tool,
        color: tool === 'pen' ? currentColor : '#ffffff',
        strokeWidth: tool === 'pen' ? 2 : 20,
      };
      setLines([...(lines || []), newLine]);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    if (tool === 'pen' || tool === 'eraser') {
      const lastLine = (lines || [])[lines ? lines.length - 1 : -1];
      if (lastLine) {
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        const updatedLines = [...(lines || []).slice(0, -1), lastLine];
        setLines(updatedLines);
      }
    } else if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      // For shapes, we'll update a temporary shape during dragging
      if (startPos) {
        const tempShapes = (shapes || []).filter(shape => shape.id !== 'temp');
        let newShape: ShapeElement;

        if (tool === 'line') {
          newShape = {
            id: 'temp',
            type: 'line',
            x: startPos.x,
            y: startPos.y,
            width: point.x - startPos.x,
            height: point.y - startPos.y,
            color: currentColor,
            strokeWidth: 2,
          };
        } else if (tool === 'rectangle') {
          newShape = {
            id: 'temp',
            type: 'rectangle',
            x: Math.min(startPos.x, point.x),
            y: Math.min(startPos.y, point.y),
            width: Math.abs(point.x - startPos.x),
            height: Math.abs(point.y - startPos.y),
            color: currentColor,
            strokeWidth: 2,
          };
        } else { // circle
          const radius = Math.sqrt(Math.pow(point.x - startPos.x, 2) + Math.pow(point.y - startPos.y, 2));
          newShape = {
            id: 'temp',
            type: 'circle',
            x: startPos.x,
            y: startPos.y,
            width: radius * 2,
            height: radius * 2,
            color: currentColor,
            strokeWidth: 2,
          };
        }

        setShapes([...tempShapes, newShape]);
      }
    }
  };

  const handleMouseUp = () => {
    if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
      // Finalize the shape by giving it a permanent ID
      const tempShape = (shapes || []).find(shape => shape.id === 'temp');
      if (tempShape) {
        const finalShape = {
          ...tempShape,
          id: `${tool}-${Date.now()}-${Math.random()}`,
        };
        const finalShapes = (shapes || []).filter(shape => shape.id !== 'temp').concat(finalShape);
        setShapes(finalShapes);
      }
    }
    
    setIsDrawing(false);
    setStartPos(null);
  };

  const changePage = (newPage: number) => {
    const updatedPages = { ...pages, [currentPage]: { lines: lines || [], shapes: shapes || [] } };
    setPages(updatedPages);
    setCurrentPage(newPage);
    const pageData = updatedPages[newPage] || { lines: [], shapes: [] };
    setLines(pageData.lines);
    setShapes(pageData.shapes);
    setSaved(false);
  };

  const handleSave = () => {
    saveToLocalStorage();
    setSaved(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmissionStatus('Creating PDF...');

    try {
      const updatedPages = { ...pages, [currentPage]: { lines: lines || [], shapes: shapes || [] } };
      setPages(updatedPages);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageCount = Object.keys(updatedPages).length;

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        setCurrentPage(pageNum);
        const pageData = updatedPages[pageNum] || { lines: [], shapes: [] };
        setLines(pageData.lines);
        setShapes(pageData.shapes);
        setSubmissionStatus(`Processing page ${pageNum} of ${pageCount}...`);
        await new Promise(resolve => setTimeout(resolve, 100));

        if (stageRef.current) {
          const uri = stageRef.current.toDataURL();
          const imgProps = pdf.getImageProperties(uri);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          if (pageNum > 1) {
            pdf.addPage();
          }

          pdf.addImage(uri, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
      }

      setSubmissionStatus('PDF created. Uploading to Cloudinary...');
      
      // Get PDF as binary data for upload
      const pdfBlob = pdf.output('blob');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      
      // Generate a meaningful filename
      const studentName = user?.name?.replace(/\s+/g, '_') || 'unknown';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${studentName}_exam_${examId}_${timestamp}.pdf`;
      
      try {
        // First try the modern Cloudinary approach
        const uploadResponse = await uploadPDFBufferToCloudinary(
          arrayBuffer,
          fileName,
          examId || '',
          {
            studentName: user?.name || 'unknown',
            submissionType: 'whiteboard',
            pageCount: pageCount
          }
        );
        
        console.log('PDF uploaded to Cloudinary:', uploadResponse);
        
        setSubmissionStatus('Upload successful! Finalizing submission...');
        
        // Submission is already recorded by the Cloudinary upload endpoint
        localStorage.removeItem(`exam-${examId}`);
        localStorage.removeItem(`exam-${examId}-timeRemaining`);
        navigate('/student', {
          state: { message: 'Exam submitted successfully!' }
        });
        return;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to legacy method:', cloudinaryError);
        setSubmissionStatus('Modern upload failed. Trying legacy method...');
        
        // Convert PDF to base64 with the correct prefix for legacy endpoint
        let pdfBase64 = pdf.output('datauristring');
  
        // Ensure pdfBase64 is correctly formatted
        if (!pdfBase64.startsWith('data:application/pdf;base64,')) {
          // Prepend the correct prefix if missing
          const base64Data = pdfBase64.split(',')[1]; // Get the base64 part
          pdfBase64 = `data:application/pdf;base64,${base64Data}`;
        }
  
        // Try the legacy submission endpoint as fallback
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            examId,
            studentName: user?.name,
            pdfData: pdfBase64
          })
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to submit exam: ${errorText}`);
        }
        
        setSubmissionStatus('Legacy submission successful!');
      }
      
      localStorage.removeItem(`exam-${examId}`);
      localStorage.removeItem(`exam-${examId}-timeRemaining`);
      navigate('/student', {
        state: { message: 'Exam submitted successfully!' }
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error submitting exam:', error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error('Error submitting exam:', error);
        alert('An unknown error occurred during exam submission.');
      }
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading exam...</div>;
  }

  if (error) {
    const isAlreadySubmitted = error.includes('already submitted');
    
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          {isAlreadySubmitted ? (
            <>
              <div className="mb-6">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Already Submitted</h2>
                <p className="text-gray-600">
                  You have already submitted this exam and cannot retake it.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/student/exams')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  View My Exams
                </button>
                <button
                  onClick={() => navigate(`/student/exam-review/${examId}`)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  View My Submission
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-600 mb-4">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error}</p>
              </div>
              <button
                onClick={() => navigate('/student/exams')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Back to Exams
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!exam) {
    return <div className="p-8 text-center">Exam not found</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Exam header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
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

            <button
              onClick={handleSave}
              disabled={saved}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} className="mr-1" />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Exam instructions */}
      <div className="bg-amber-50 border-b border-amber-200 p-4">
        <h2 className="text-sm font-medium text-amber-800">Instructions:</h2>
        <p className="text-sm text-amber-700 mt-1">{exam.instructions}</p>
      </div>

      {/* Exam Questions */}
      <div className="bg-blue-50 border-b border-blue-200 p-4 flex-shrink-0" style={{ maxHeight: '200px' }}>
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Questions:</h2>
        <div className="h-32 overflow-y-auto space-y-3 pr-2">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((question, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-800 flex-1 leading-relaxed">
                    <span className="font-semibold text-blue-700">Q{index + 1}.</span> {question.text}
                  </p>
                  <span className="text-xs text-blue-600 font-semibold ml-3 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                    {question.points} pts
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
              <p className="text-sm text-blue-700 italic">No questions available for this exam.</p>
            </div>
          )}
        </div>
      </div>

      {/* Whiteboard canvas with scrolling */}
      <div className="flex-1 overflow-auto bg-gray-50 border border-gray-200 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200" ref={containerRef}>
        <div className="p-2">
          {/* Scroll indicator */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 mb-2 text-center text-sm text-blue-700">
            📝 Writing Area - Scroll down for more space • Use mouse/touch to draw • Page {currentPage}
          </div>
          <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
          className="bg-white border"
          style={{ cursor: tool === 'pen' ? 'crosshair' : 'pointer' }}
        >
          <Layer>
            {(lines || []).map((line, i) => (
              <Line
                key={`line-${i}`}
                points={line.points}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            ))}
            {(shapes || []).map((shape, i) => {
              if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={`rect-${i}`}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width || 0}
                    height={shape.height || 0}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    fill="transparent"
                  />
                );
              } else if (shape.type === 'circle') {
                const radius = shape.width ? shape.width / 2 : 0;
                return (
                  <Circle
                    key={`circle-${i}`}
                    x={shape.x}
                    y={shape.y}
                    radius={radius}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    fill="transparent"
                  />
                );
              } else if (shape.type === 'line') {
                return (
                  <Line
                    key={`shape-line-${i}`}
                    points={[shape.x, shape.y, shape.x + (shape.width || 0), shape.y + (shape.height || 0)]}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    lineCap="round"
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
        {/* Bottom space indicator */}
        <div className="bg-gradient-to-b from-gray-100 to-gray-200 border-2 border-dashed border-gray-400 rounded-lg p-4 mt-2 text-center text-gray-600">
          <div className="text-lg">✨ More writing space below ✨</div>
          <div className="text-sm">Continue writing or add a new page using the toolbar</div>
        </div>
        </div>
      </div>

      {/* Bottom toolbar with drawing tools and navigation */}
      <div className="bg-white border-t border-gray-200 p-3">
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

          {/* Submit Button */}
          <div className="flex flex-col items-end space-y-2">
            {submissionStatus && (
              <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded-md flex items-center">
                <Upload size={14} className="mr-1 animate-pulse" />
                {submissionStatus}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                </>
              ) : (
                <>
                  <Check size={16} className="mr-1" />
                  Submit Exam
                </>
              )}
            </button>
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default WhiteboardExam;