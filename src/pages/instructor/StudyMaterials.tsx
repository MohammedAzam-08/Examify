import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Video, 
  FileText, 
  Layout, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Clock,
  Download,
  Search,
  Filter,
  Eye,
  AlertCircle
} from 'lucide-react';

interface StudyResource {
  _id: string;
  title: string;
  type: 'practice' | 'video' | 'guide' | 'flashcard';
  description: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  pages?: number;
  cards?: number;
  subject: string;
  course: string;
  semester: number;
  fileUrl?: string;
  videoUrl?: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  views: number;
  downloads: number;
}

const StudyMaterials: React.FC = () => {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<StudyResource | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'video' | 'guide' | 'flashcard'>('practice');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'practice' as 'practice' | 'video' | 'guide' | 'flashcard',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: '',
    pages: '',
    cards: '',
    subject: '',
    course: '',
    semester: '',
    content: '',
    videoUrl: '',
    isPublished: false
  });

  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
  }>>([]);

  useEffect(() => {
    fetchStudyResources();
  }, []);

  const fetchStudyResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-materials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setResources(data);
        console.log('Successfully loaded study materials:', data.length);
      } else {
        console.error('Failed to fetch study materials:', response.status, response.statusText);
        // If API doesn't exist yet, use mock data
        setResources([]);
      }
    } catch (error) {
      console.error('Study materials API error:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Debug log for form submission
      console.log('Submitting form data:', formData);
      
      // Validate that guide types have files
      if (formData.type === 'guide' && !file && !editingResource?.fileUrl) {
        setError('Study guides must include a file upload (PDF or document)');
        return;
      }
      
      // Validate that practice tests have questions if being published
      if (formData.type === 'practice' && formData.isPublished && questions.length === 0) {
        setError('Practice tests must have at least one question before publishing');
        return;
      }
      
      // Special debug for flashcards
      if (formData.type === 'flashcard') {
        console.log('Creating flashcard with content:', formData.content);
        console.log('Number of cards:', formData.cards);
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        return;
      }

      const formDataToSend = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        // Ensure the value is not null or undefined before calling toString()
        if (value !== null && value !== undefined) {
          console.log(`Adding form field: ${key} = ${value}`);
          formDataToSend.append(key, value.toString());
        } else {
          console.log(`Skipping null or undefined field: ${key}`);
        }
      });
      
      // Add questions for practice tests
      if (formData.type === 'practice' && questions.length > 0) {
        console.log('Adding questions:', questions.length);
        formDataToSend.append('questions', JSON.stringify(questions));
        
        // Calculate and add passing score (default: 70%)
        const passingScore = 70; // Default passing score
        formDataToSend.append('passingScore', passingScore.toString());
      }
      
      // Make sure content field is properly set for flashcards
      if (formData.type === 'flashcard' && formData.content) {
        console.log('Adding flashcard content:', formData.content);
        formDataToSend.set('content', formData.content);
      }
      
      if (file) {
        console.log('Adding file:', file.name, file.size, 'bytes');
        formDataToSend.append('file', file);
      }

      const url = editingResource 
        ? `/api/study-materials/${editingResource._id}` 
        : '/api/study-materials';
      
      const method = editingResource ? 'PUT' : 'POST';

      console.log('Submitting to:', url, 'with method:', method);
      console.log('Form data entries:', Array.from(formDataToSend.entries()));

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToSend
      });

      console.log('Response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Successfully created/updated study material:', result);
        setSuccessMessage(`Study material ${editingResource ? 'updated' : 'created'} successfully!`);
        await fetchStudyResources();
        resetForm();
        setShowCreateModal(false);
        setEditingResource(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Log the response body for debugging
        const responseText = await response.text();
        console.error('Error response body:', responseText);
        
        try {
          // Try to parse as JSON if possible
          const errorJson = JSON.parse(responseText);
          console.error('Parsed error JSON:', errorJson);
        } catch {
          console.error('Response is not valid JSON');
        }
        let errorMessage = `Failed to save resource: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.text();
          console.error('API Error:', response.status, response.statusText, errorData);
          
          // Try to parse as JSON to get a more specific error message
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch {
            // If not JSON, use the text as is if it's more informative
            if (errorData && errorData.length > 0 && errorData.length < 200) {
              errorMessage = errorData;
            }
          }
        } catch {
          console.error('Could not read error response body');
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save resource');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'practice',
      difficulty: 'Beginner',
      duration: '',
      pages: '',
      cards: '',
      subject: '',
      course: '',
      semester: '',
      content: '',
      videoUrl: '',
      isPublished: false
    });
    setFile(null);
    setQuestions([]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = async (resource: StudyResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      difficulty: resource.difficulty || 'Beginner',
      duration: resource.duration || '',
      pages: resource.pages?.toString() || '',
      cards: resource.cards?.toString() || '',
      subject: resource.subject,
      course: resource.course,
      semester: resource.semester.toString(),
      content: resource.content || '',
      videoUrl: resource.videoUrl || '',
      isPublished: resource.isPublished
    });
    
    // If this is a practice test, fetch the full details to get questions
    if (resource.type === 'practice') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/study-materials/${resource._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const fullResource = await response.json();
          // Load questions if they exist
          if (fullResource.questions && fullResource.questions.length > 0) {
            setQuestions(fullResource.questions);
          }
        }
      } catch (error) {
        console.error('Error fetching practice test details:', error);
      }
    }
    
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/study-materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setResources(prev => prev.filter(r => r._id !== id));
      } else {
        // Mock success for demo
        setResources(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      difficulty: 'easy',
      points: 10
    }]);
  };

  const updateQuestion = (index: number, field: string, value: string | number | string[]) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => 
      i === questionIndex 
        ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
        : q
    ));
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = resource.type === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || resource.subject === filterSubject;
    
    return matchesType && matchesSearch && matchesSubject;
  });

  const subjects = [...new Set(resources.map(r => r.subject))];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  return (
    <div className="space-y-8">
      <motion.div
        className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Study Materials Management</h1>
        <p>Create and manage learning resources for your students</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm">Practice Tests</p>
            <p className="font-bold">{resources.filter(r => r.type === 'practice').length}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <Video className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm">Video Tutorials</p>
            <p className="font-bold">{resources.filter(r => r.type === 'video').length}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <FileText className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm">Study Guides</p>
            <p className="font-bold">{resources.filter(r => r.type === 'guide').length}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <Layout className="w-6 h-6 mx-auto mb-1" />
            <p className="text-sm">Flashcards</p>
            <p className="font-bold">{resources.filter(r => r.type === 'flashcard').length}</p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-red-800">{error}</p>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          className="bg-green-50 border border-green-200 rounded-lg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-green-800">{successMessage}</p>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        className="bg-white rounded-lg shadow p-6"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'practice', label: 'Practice Tests', icon: BookOpen },
              { id: 'video', label: 'Video Tutorials', icon: Video },
              { id: 'guide', label: 'Study Guides', icon: FileText },
              { id: 'flashcard', label: 'Flashcards', icon: Layout }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'practice' | 'video' | 'guide' | 'flashcard')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </motion.button>
            ))}
          </div>
          
          <motion.button
            onClick={() => {
              setError(null);
              setSuccessMessage(null);
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </motion.button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <span className="ml-2 text-gray-600">Loading resources...</span>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredResources.map((resource) => (
                <motion.div
                  key={resource._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {resource.type === 'practice' && <BookOpen className="w-5 h-5 text-blue-600 mr-2" />}
                      {resource.type === 'video' && <Video className="w-5 h-5 text-red-600 mr-2" />}
                      {resource.type === 'guide' && <FileText className="w-5 h-5 text-green-600 mr-2" />}
                      {resource.type === 'flashcard' && <Layout className="w-5 h-5 text-purple-600 mr-2" />}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        resource.isPublished 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resource.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => handleEdit(resource)}
                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit3 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(resource._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Subject: {resource.subject}</span>
                      {resource.difficulty && (
                        <span className={`px-2 py-1 rounded-full ${
                          resource.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          resource.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {resource.difficulty}
                        </span>
                      )}
                    </div>
                    {resource.duration && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Duration: {resource.duration}
                      </div>
                    )}
                    {resource.pages && (
                      <div className="flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {resource.pages} pages
                      </div>
                    )}
                    {resource.cards && (
                      <div className="flex items-center">
                        <Layout className="w-3 h-3 mr-1" />
                        {resource.cards} cards
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {resource.views} views
                      </div>
                      <div className="flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {resource.downloads} downloads
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredResources.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterSubject !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first study resource to get started'
              }
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Resource
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingResource ? 'Edit Resource' : 'Create New Resource'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingResource(null);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'practice' | 'video' | 'guide' | 'flashcard' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="practice">Practice Test</option>
                        <option value="video">Video Tutorial</option>
                        <option value="guide">Study Guide</option>
                        <option value="flashcard">Flashcards</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Mathematics"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter resource title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Enter resource description"
                      required
                    />
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium mb-1">Course and Semester Specific Resources</p>
                        <p>
                          Study materials are shown only to students in the matching course and semester.
                          Enter these details carefully to ensure the right students can access your resources.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., BCA"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem.toString()}>{sem}</option>
                        ))}
                      </select>
                    </div>

                    {(formData.type === 'practice' || formData.type === 'guide') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty
                        </label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Type-specific fields */}
                  {formData.type === 'video' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., 15:30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}

                  {formData.type === 'guide' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Pages
                      </label>
                      <input
                        type="number"
                        value={formData.pages}
                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter number of pages"
                      />
                    </div>
                  )}

                  {formData.type === 'flashcard' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Cards
                      </label>
                      <input
                        type="number"
                        value={formData.cards}
                        onChange={(e) => setFormData({ ...formData, cards: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter number of cards"
                      />
                    </div>
                  )}

                  {formData.type === 'flashcard' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                        placeholder="Enter flashcard content..."
                      />
                    </div>
                  )}
                  
                  {formData.type === 'practice' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Test Questions
                        </label>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          + Add Question
                        </button>
                      </div>
                      
                      {questions.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">No questions yet. Click "Add Question" to create your first test question.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {questions.map((question, qIndex) => (
                            <div key={qIndex} className="border border-gray-200 rounded-lg p-4 relative">
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question {qIndex + 1}
                                </label>
                                <input
                                  type="text"
                                  value={question.question}
                                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  placeholder="Enter the question text"
                                />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Options
                                </label>
                                {question.options.map((opt, optIndex) => (
                                  <div key={optIndex} className="flex mb-2">
                                    <div className="flex items-center mr-3">
                                      <input
                                        type="radio"
                                        checked={question.correctAnswer === optIndex}
                                        onChange={() => updateQuestion(qIndex, 'correctAnswer', optIndex)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateQuestionOption(qIndex, optIndex, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                    />
                                  </div>
                                ))}
                                <div className="text-xs text-gray-500 mt-1">Select the radio button next to the correct answer</div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Explanation
                                  </label>
                                  <textarea
                                    value={question.explanation}
                                    onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Explanation for the correct answer"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Difficulty
                                  </label>
                                  <select
                                    value={question.difficulty}
                                    onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Points
                                  </label>
                                  <input
                                    type="number"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Points for this question"
                                    min="1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.type === 'practice' && questions.length > 0 && (
                        <div className="flex justify-center mt-4">
                          <button
                            type="button"
                            onClick={addQuestion}
                            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                          >
                            + Add Another Question
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.type === 'guide' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload File <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        accept=".pdf,.doc,.docx"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="text-red-500">Required:</span> Supported formats: PDF, DOC, DOCX
                      </p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                      Publish immediately (students can access this resource)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingResource(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingResource ? 'Update' : 'Create'} Resource
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyMaterials;
