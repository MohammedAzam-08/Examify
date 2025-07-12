import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Check, Search, ArrowUpDown, CheckCircle, Clock, Eye, X } from 'lucide-react';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  fileId?: string;
  cloudinaryUrl?: string;
  storageType: 'gridfs' | 'cloudinary';
  textOnly?: boolean;
  fallbackReason?: string;
  examTitle?: string; // For when showing all submissions
  examId?: string; // For when showing all submissions
}

const SubmissionList: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [viewingPDF, setViewingPDF] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    try {
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      let apiUrl;
      if (examId) {
        // Fetch submissions for a specific exam
        apiUrl = `/api/submissions/exam/${examId}`;
      } else {
        // Fetch all submissions for the instructor
        apiUrl = `/api/submissions/instructor/all`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch submissions');
      }

      const data = await response.json();
      console.log('Fetched submissions:', data); // Debug log
      console.log('Number of submissions:', data.length);
      data.forEach((submission: Submission, index: number) => {
        console.log(`Submission ${index + 1}:`, {
          id: submission.id,
          studentName: submission.studentName,
          storageType: submission.storageType,
          cloudinaryUrl: submission.cloudinaryUrl ? 'Yes' : 'No',
          fileId: submission.fileId ? 'Yes' : 'No',
          textOnly: submission.textOnly
        });
      });
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch submissions');
    }
  }, [examId]);

  useEffect(() => {
    const loadSubmissions = async () => {
      await fetchSubmissions();
    };
    loadSubmissions();
  }, [fetchSubmissions]);

  const handleSubmitGrade = async (submissionId: string) => {
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          grade: parseInt(grade),
          feedback
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit grade');
      }

      // Refresh submissions list
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error submitting grade:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSubmission = async (submission: Submission, studentName: string) => {
    try {
      // For Cloudinary URLs, directly download from the URL
      if (submission.storageType === 'cloudinary' && submission.cloudinaryUrl) {
        const response = await fetch(submission.cloudinaryUrl);
        if (!response.ok) {
          throw new Error('Failed to download from Cloudinary');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${studentName}_submission.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } 
      // For GridFS files or fallback to server endpoint
      else if (submission.fileId) {
        const response = await fetch(`/api/submissions/file/${submission.fileId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to download submission');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${studentName}_submission.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
      else {
        throw new Error('No valid file source found');
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert('Failed to download submission. Please try again.');
    }
  };

  const viewPDF = async (submission: Submission) => {
    try {
      // For Cloudinary URLs, display directly from the URL
      if (submission.storageType === 'cloudinary' && submission.cloudinaryUrl) {
        // For Cloudinary URLs, we'll use the URL directly for iframe viewing
        setPdfUrl(submission.cloudinaryUrl);
        setViewingPDF(submission.id);
      }
      // For GridFS files or fallback to server endpoint
      else if (submission.fileId) {
        const response = await fetch(`/api/submissions/file/${submission.fileId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        setViewingPDF(submission.id);
      }
      else {
        throw new Error('No valid file source found');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF for viewing. Please try again.');
    }
  };

  const closePDFViewer = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setViewingPDF(null);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const filteredSubmissions = submissions
    .filter(submission => {
      const matchesSearch = submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           submission.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || submission.status === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'studentName') {
        return sortDirection === 'asc'
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      } else if (sortBy === 'submittedAt') {
        return sortDirection === 'asc'
          ? new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
          : new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (sortBy === 'grade') {
        const aGrade = a.status === 'graded' ? a.grade || 0 : 0;
        const bGrade = b.status === 'graded' ? b.grade || 0 : 0;
        return sortDirection === 'asc' ? aGrade - bGrade : bGrade - aGrade;
      }
      return 0;
    });

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
          <button
            onClick={() => fetchSubmissions()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg font-semibold text-gray-700 mb-4">No submissions found</div>
          <p className="text-gray-500">There are no submissions for this exam yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">
          {examId ? 'Exam Submissions' : 'All Submissions'}
        </h1>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm flex-1 max-w-md">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ml-2 flex-1 outline-none"
            />
          </div>
          
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border shadow-sm"
          >
            <option value="all">All Submissions</option>
            <option value="pending">Pending</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('studentName')}
              >
                <div className="flex items-center">
                  Student
                  <ArrowUpDown size={16} className="ml-1" />
                </div>
              </th>
              {!examId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exam
                </th>
              )}
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('submittedAt')}
              >
                <div className="flex items-center">
                  Submitted At
                  <ArrowUpDown size={16} className="ml-1" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{submission.studentName}</div>
                  <div className="text-sm text-gray-500">ID: {submission.studentId}</div>
                </td>
                {!examId && (
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{submission.examTitle || 'Unknown Exam'}</div>
                    {submission.examId && (
                      <div className="text-sm text-gray-500">ID: {submission.examId}</div>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(submission.submittedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status === 'graded' ? (
                      <><CheckCircle size={12} className="mr-1" /> Graded</>
                    ) : (
                      <><Clock size={12} className="mr-1" /> Pending</>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    submission.textOnly 
                      ? 'bg-red-100 text-red-800' 
                      : submission.storageType === 'cloudinary'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {submission.textOnly ? 'Text Only' : submission.storageType === 'cloudinary' ? 'PDF (Cloud)' : 'PDF (Local)'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {submission.grade !== undefined ? `${submission.grade}%` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  {!submission.textOnly && (submission.cloudinaryUrl || submission.fileId) && (
                    <>
                      <button
                        onClick={() => viewPDF(submission)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Submission"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => downloadSubmission(submission, submission.studentName)}
                        className="text-green-600 hover:text-green-800"
                        title="Download Submission"
                      >
                        <Download size={20} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedSubmission(submission.id)}
                    className={`text-purple-600 hover:text-purple-800 ${
                      submission.status === 'graded' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={submission.status === 'graded'}
                    title="Grade Submission"
                  >
                    <Check size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grade Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Grade Submission</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade (%)</label>
                <input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitGrade(selectedSubmission)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Grade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {viewingPDF && pdfUrl && <PDFViewer url={pdfUrl} onClose={closePDFViewer} />}
    </div>
  );
};

const PDFViewer = ({ url, onClose }: { url: string; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 h-[90vh] rounded-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Submission Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 w-full h-full">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionList;