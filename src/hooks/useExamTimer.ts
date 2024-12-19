import { useState, useEffect, useCallback } from 'react';

interface ExamTimerOptions {
  duration: number; // in seconds
  onTimeUp: () => void;
}

const useExamTimer = ({ duration, onTimeUp }: ExamTimerOptions) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);

  const checkWarning = useCallback((time: number) => {
    if (time <= 300 && !isWarning) { // 5 minutes warning
      setIsWarning(true);
    }
  }, [isWarning]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        checkWarning(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp, checkWarning]);

  return {
    timeRemaining,
    isWarning,
    formattedTime: new Date(timeRemaining * 1000).toISOString().substr(11, 8),
  };
};

export default useExamTimer;