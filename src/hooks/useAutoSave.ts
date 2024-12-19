import { useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';

interface AutoSaveOptions {
  data: any;
  onSave: () => void;
  onError: (error: any) => void;
  saveInterval?: number;
  examId: string;
  questionId: string;
}

const useAutoSave = ({
  data,
  onSave,
  onError,
  saveInterval = 30000, // Default 30 seconds
  examId,
  questionId,
}: AutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedData = useRef<string>();

  const saveData = async () => {
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedData.current) {
      return;
    }

    try {
      await axios.post(`/api/answers/${examId}/questions/${questionId}`, {
        drawingData: currentData,
      });
      lastSavedData.current = currentData;
      onSave();
    } catch (error) {
      onError(error);
    }
  };

  useEffect(() => {
    timeoutRef.current = setInterval(saveData, saveInterval);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [data, saveInterval]);

  return {
    saveNow: saveData,
  };
};

export default useAutoSave;