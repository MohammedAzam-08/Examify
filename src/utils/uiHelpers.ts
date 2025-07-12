export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Function to create a submission status UI element
export const createSubmissionStatusUI = () => {
  // Show a submission message to prevent user from thinking it's frozen
  const submissionStatus = document.createElement('div');
  submissionStatus.dataset.submissionStatus = 'true'; // Add data attribute for easier cleanup
  submissionStatus.style.position = 'fixed';
  submissionStatus.style.top = '50%';
  submissionStatus.style.left = '50%';
  submissionStatus.style.transform = 'translate(-50%, -50%)';
  submissionStatus.style.padding = '20px';
  submissionStatus.style.width = '400px';
  submissionStatus.style.maxWidth = '90vw';
  submissionStatus.style.background = 'rgba(0, 0, 0, 0.85)';
  submissionStatus.style.color = 'white';
  submissionStatus.style.borderRadius = '10px';
  submissionStatus.style.zIndex = '9999';
  submissionStatus.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
  submissionStatus.style.textAlign = 'center';
  submissionStatus.style.fontFamily = 'Arial, sans-serif';
  
  // Add a visual progress indicator
  const progressBar = document.createElement('div');
  progressBar.style.width = '100%';
  progressBar.style.height = '10px';
  progressBar.style.backgroundColor = '#222';
  progressBar.style.borderRadius = '5px';
  progressBar.style.marginTop = '15px';
  progressBar.style.overflow = 'hidden';
  
  const progressFill = document.createElement('div');
  progressFill.style.width = '0%';
  progressFill.style.height = '100%';
  progressFill.style.backgroundColor = '#4CAF50';
  progressFill.style.transition = 'width 0.5s ease';
  progressBar.appendChild(progressFill);
  
  // Set initial message
  submissionStatus.innerHTML = '<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Processing exam submission...</div><div>Please wait. This may take a moment.</div>';
  submissionStatus.appendChild(progressBar);
  document.body.appendChild(submissionStatus);
  
  // Return the submission status element and a function to update progress
  return {
    element: submissionStatus,
    updateProgress: (percent: number, message: string) => {
      progressFill.style.width = `${percent}%`;
      submissionStatus.innerHTML = `<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${message}</div><div>Please do not close this page.</div>`;
      submissionStatus.appendChild(progressBar);
    }
  };
};
