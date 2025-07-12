import { useState, useEffect, useCallback } from 'react';

export const useExamTimer = (
  examId: string, 
  initialDuration: number | undefined, 
  getStudentId: () => string, 
  onTimeExpired: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  
  useEffect(() => {
    if (!initialDuration) return;
    
    // Create a unique storage key for time remaining per student and exam
    const studentId = getStudentId();
    const timeStorageKey = `exam-${examId}-student-${studentId}-timeRemaining`;
    
    // Load saved timeRemaining from localStorage if available
    const savedTime = localStorage.getItem(timeStorageKey);
    if (savedTime !== null) {
      const parsedTime = parseInt(savedTime, 10);
      if (!isNaN(parsedTime) && parsedTime > 0) {
        setTimeRemaining(parsedTime);
      } else {
        setTimeRemaining(initialDuration * 60);
      }
    } else {
      setTimeRemaining(initialDuration * 60);
    }
  }, [examId, initialDuration, getStudentId]);

  // Setup timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    // Create a unique storage key for time remaining per student and exam
    const studentId = getStudentId();
    const timeStorageKey = `exam-${examId}-student-${studentId}-timeRemaining`;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          localStorage.removeItem(timeStorageKey);
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(timeStorageKey, newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, examId, onTimeExpired, getStudentId]);
  
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    formatTime
  };
};

export default useExamTimer;
