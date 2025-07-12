import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useStudentIdentifier = () => {
  const { user } = useAuth();
  
  // Generate a consistent temporary ID for this instance to ensure unique whiteboard per student
  // This will be used if the user object is not available
  const tempUserId = `temp-user-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  
  // Helper function to get a consistent student ID even if user is not loaded
  const getStudentId = useCallback(() => {
    return user?.id || tempUserId;
  }, [user, tempUserId]);

  return {
    user,
    getStudentId
  };
};

export default useStudentIdentifier;
