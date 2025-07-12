import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Layout, 
  Clock,
  Download,
  Search,
  Filter,
  Play,
  Eye
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
  views: number;
  downloads: number;
  instructor: {
    name: string;
    email: string;
  };
}

const StudyResources: React.FC = () => {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'video' | 'guide' | 'flashcard'>('practice');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [userInfo, setUserInfo] = useState<{course?: string, semester?: number} | null>(null);

  useEffect(() => {
    // Get user info from local storage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserInfo({
        course: parsedUser.course,
        semester: parsedUser.semester
      });
    }
    
    fetchStudyResources();
  }, []);

  const fetchStudyResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setError('Please log in to view study resources.');
        return;
      }

      console.log('Fetching published study materials...');
      const response = await fetch('/api/study-materials/published', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched study materials:', data);
        setResources(data);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch study materials:', response.status, errorText);
        
        // For now, show empty resources when API fails
        setResources([]);
        setError('Unable to load study resources from server.');
      }
    } catch (err) {
      console.error('Error fetching study materials:', err);
      setError('Unable to load study resources. Please try again later.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceAction = async (resource: StudyResource) => {
    try {
      // Increment view count
      const token = localStorage.getItem('token');
      await fetch(`/api/study-materials/${resource._id}/view`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Handle different resource types
      if (resource.type === 'practice') {
        // Navigate to practice test page
        window.location.href = `/student/practice-test/${resource._id}`;
      } else if (resource.type === 'video') {
        if (resource.videoUrl) {
          window.open(resource.videoUrl, '_blank');
        } else {
          alert('Video URL not available');
        }
      } else if (resource.type === 'guide') {
        if (resource.fileUrl && !resource.fileUrl.includes('undefined')) {
          await handleDownload(resource);
        } else {
          alert('No file available for download. This study material may not have an attached file.');
        }
      } else if (resource.type === 'flashcard') {
        // Navigate to flashcard study mode
        window.location.href = `/student/flashcards/${resource._id}`;
      }
    } catch {
      console.error('Error handling resource action');
    }
  };

  const handleDownload = async (resource: StudyResource) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to download files');
        return;
      }

      console.log('Downloading file:', resource.fileUrl);
      
      const response = await fetch(resource.fileUrl!, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resource.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = resource.type === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || resource.subject === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || resource.difficulty === filterDifficulty;
    
    return matchesType && matchesSearch && matchesSubject && matchesDifficulty;
  });

  const subjects = [...new Set(resources.map(r => r.subject))];

  const getActionButton = (resource: StudyResource) => {
    const buttonClass = "w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center font-medium";
    
    switch (resource.type) {
      case 'practice':
        return (
          <motion.button
            onClick={() => handleResourceAction(resource)}
            className={buttonClass}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Start Test
          </motion.button>
        );
      case 'video':
        return (
          <motion.button
            onClick={() => handleResourceAction(resource)}
            className={buttonClass}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Play className="w-4 h-4 mr-2" />
            Watch Now
          </motion.button>
        );
      case 'guide': {
        const hasFile = resource.fileUrl && !resource.fileUrl.includes('undefined');
        return (
          <motion.button
            onClick={() => handleResourceAction(resource)}
            className={`w-full ${hasFile 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } px-4 py-2 rounded-lg transition-all flex items-center justify-center font-medium`}
            whileHover={hasFile ? { scale: 1.02 } : {}}
            whileTap={hasFile ? { scale: 0.98 } : {}}
            disabled={!hasFile}
          >
            <Download className="w-4 h-4 mr-2" />
            {hasFile ? 'Download PDF' : 'No File Available'}
          </motion.button>
        );
      }
      case 'flashcard':
        return (
          <motion.button
            onClick={() => handleResourceAction(resource)}
            className={buttonClass}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Layout className="w-4 h-4 mr-2" />
            Study Now
          </motion.button>
        );
      default:
        return null;
    }
  };

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

  return (
    <div className="space-y-8">
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Study Resources</h1>
        <p>Access practice tests, video tutorials, study guides, and flashcards</p>
        
        {/* Course and Semester Info */}
        {userInfo && userInfo.course && userInfo.semester && (
          <div className="mt-3 bg-white/10 rounded-lg p-3 flex items-center">
            <div className="mr-3 bg-white/20 rounded-full p-2">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Showing resources for <span className="font-bold">{userInfo.course}</span>, Semester <span className="font-bold">{userInfo.semester}</span>
              </p>
              <p className="text-xs opacity-80">Materials are filtered to match your course and semester</p>
            </div>
          </div>
        )}
        
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

      {/* Tabs and Controls */}
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
          <div className="flex gap-4">
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
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
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
            <span className="ml-2 text-gray-600">Fetching study materials...</span>
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
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -5 }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {resource.type === 'practice' && <BookOpen className="w-5 h-5 text-blue-600 mr-2" />}
                        {resource.type === 'video' && <Video className="w-5 h-5 text-red-600 mr-2" />}
                        {resource.type === 'guide' && <FileText className="w-5 h-5 text-green-600 mr-2" />}
                        {resource.type === 'flashcard' && <Layout className="w-5 h-5 text-purple-600 mr-2" />}
                        <span className="text-sm font-medium text-gray-600">{resource.subject}</span>
                      </div>
                      {resource.difficulty && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          resource.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                          resource.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {resource.difficulty}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>

                    <div className="space-y-2 text-xs text-gray-500 mb-4">
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
                        {resource.downloads > 0 && (
                          <div className="flex items-center">
                            <Download className="w-3 h-3 mr-1" />
                            {resource.downloads} downloads
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 pt-1">
                        By {resource.instructor.name}
                      </div>
                    </div>

                    {getActionButton(resource)}
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
              {searchTerm || filterSubject !== 'all' || filterDifficulty !== 'all'
                ? 'Try adjusting your search or filters'
                : userInfo && userInfo.course && userInfo.semester
                  ? `No study resources are available for ${userInfo.course}, Semester ${userInfo.semester}`
                  : 'No study resources are available at the moment'
              }
            </p>
            {userInfo && userInfo.course && userInfo.semester && (
              <div className="mt-2 text-sm text-gray-500">
                Resources are filtered based on your course and semester. <br />
                Contact your instructor if you need access to additional materials.
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudyResources;
