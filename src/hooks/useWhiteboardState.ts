import { useState, useEffect, useRef, useCallback } from 'react';
import { LineElement, ShapeElement } from '../types/whiteboard';

export const useWhiteboardState = (examId: string, getStudentId: () => string) => {
  const [tool, setTool] = useState<'pen' | 'eraser' | 'line' | 'rectangle' | 'circle'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lines, setLines] = useState<LineElement[]>([]);
  const [shapes, setShapes] = useState<ShapeElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<{ [key: number]: { lines: LineElement[], shapes: ShapeElement[] } }>({ 1: { lines: [], shapes: [] } });
  const [saved, setSaved] = useState(true);
  
  // Using any here since we need to access the Konva Stage methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({
    width: 800,  // Default width
    height: 600, // Default height
  });
  
  // Initialize stage size
  useEffect(() => {
    const updateStageSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        // For height, use a minimum of 800px to ensure enough drawing space
        // but allow it to grow larger based on the container size
        const canvasHeight = Math.max(800, window.innerHeight * 0.8);
        
        setStageSize({
          width: clientWidth > 0 ? clientWidth - 2 : 800, // -2 for border
          height: canvasHeight,
        });
      }
    };

    // Initial size setup with a slight delay to ensure container is rendered
    const timer = setTimeout(updateStageSize, 100);

    // Set up window resize handler
    const handleResize = () => updateStageSize();

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Define saveToLocalStorage with useCallback
  const saveToLocalStorage = useCallback(() => {
    const updatedPages = { ...pages, [currentPage]: { lines: lines || [], shapes: shapes || [] } };
    
    // Create a unique storage key per student and exam
    const studentId = getStudentId();
    const storageKey = `exam-${examId}-student-${studentId}`;
    
    localStorage.setItem(storageKey, JSON.stringify({
      pages: updatedPages,
      currentPage,
      studentId: getStudentId(),
      timestamp: Date.now()
    }));
  }, [currentPage, examId, lines, pages, shapes, getStudentId]);
  
  // Auto-save to local storage every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (!saved) {
        saveToLocalStorage();
        setSaved(true);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [saved, saveToLocalStorage]);

  // Load from local storage on mount
  useEffect(() => {
    const studentId = getStudentId();
    const storageKey = `exam-${examId}-student-${studentId}`;
    
    const savedData = localStorage.getItem(storageKey);
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
  }, [examId, getStudentId]);
  
  const handleSave = () => {
    try {
      saveToLocalStorage();
      setSaved(true);
      // Show a brief confirmation message
      const savedMessage = document.createElement('div');
      savedMessage.style.position = 'fixed';
      savedMessage.style.bottom = '80px';
      savedMessage.style.left = '50%';
      savedMessage.style.transform = 'translateX(-50%)';
      savedMessage.style.padding = '10px 20px';
      savedMessage.style.background = 'rgba(0, 128, 0, 0.8)';
      savedMessage.style.color = 'white';
      savedMessage.style.borderRadius = '5px';
      savedMessage.style.zIndex = '9999';
      savedMessage.style.fontSize = '14px';
      savedMessage.textContent = 'Progress saved successfully!';
      document.body.appendChild(savedMessage);
      
      // Remove after 2 seconds
      setTimeout(() => {
        if (savedMessage.parentNode) {
          document.body.removeChild(savedMessage);
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress. Please try again.');
    }
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

  return {
    tool,
    setTool,
    currentColor,
    setCurrentColor,
    lines,
    setLines,
    shapes, 
    setShapes,
    isDrawing,
    setIsDrawing,
    startPos,
    setStartPos,
    currentPage,
    setCurrentPage,
    pages,
    setPages,
    saved,
    setSaved,
    stageRef,
    containerRef,
    stageSize,
    handleSave,
    saveToLocalStorage,
    changePage
  };
};

export default useWhiteboardState;
