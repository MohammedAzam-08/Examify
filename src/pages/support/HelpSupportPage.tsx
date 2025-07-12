import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  FileText, 
  Video, 
  Search,
  ChevronDown,
  ChevronRight,
  Mail
} from 'lucide-react';

const HelpSupportPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleToggleFaq = (id: string) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  const faqItems = [
    {
      id: 'faq-1',
      question: 'How do I reset my password?',
      answer: 'To reset your password, click on the "Forgot password" link on the login page. Enter your email address, and we\'ll send you a link to create a new password. The link will expire after 24 hours for security reasons.',
      category: 'account'
    },
    {
      id: 'faq-2',
      question: 'What should I do if my exam freezes?',
      answer: 'If your exam freezes, first try refreshing the page. Your progress is saved automatically. If the problem persists, contact your instructor immediately and take screenshots as evidence of the issue. You can also reach out to technical support with the exam ID and details of the problem.',
      category: 'exams'
    },
    {
      id: 'faq-3',
      question: 'How can I view my past exam results?',
      answer: 'You can view your past exam results by navigating to the "My Exams" section in your student dashboard. There, you\'ll find a list of all exams you\'ve taken, along with your scores and detailed feedback from your instructors.',
      category: 'exams'
    },
    {
      id: 'faq-4',
      question: 'Can I download study materials for offline use?',
      answer: 'Yes, most study materials can be downloaded for offline use. Look for the download icon next to each resource in the Study Resources section. Downloaded materials will remain available on your device even without an internet connection.',
      category: 'resources'
    },
    {
      id: 'faq-5',
      question: 'How do I submit a request for additional help?',
      answer: 'You can submit a request for additional help by using the "Contact Support" form at the bottom of this page. Please provide specific details about your issue so we can assist you more effectively. For urgent matters, you can also contact your instructor directly.',
      category: 'general'
    }
  ];

  const filteredFaqs = faqItems.filter(faq => {
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !activeCategory || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto py-8"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Help & Support</h1>
        <p className="text-slate-500 mt-1">Find answers to common questions and get assistance</p>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveCategory(activeCategory === '' ? '' : '')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeCategory === '' 
                ? 'bg-blue-100 border-blue-200 text-blue-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            } border shadow-sm`}
          >
            <HelpCircle size={24} className={activeCategory === '' ? 'text-blue-600' : 'text-slate-500'} />
            <span className="mt-2 font-medium">All Topics</span>
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'account' ? '' : 'account')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeCategory === 'account' 
                ? 'bg-blue-100 border-blue-200 text-blue-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            } border shadow-sm`}
          >
            <MessageCircle size={24} className={activeCategory === 'account' ? 'text-blue-600' : 'text-slate-500'} />
            <span className="mt-2 font-medium">Account</span>
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'exams' ? '' : 'exams')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeCategory === 'exams' 
                ? 'bg-blue-100 border-blue-200 text-blue-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            } border shadow-sm`}
          >
            <FileText size={24} className={activeCategory === 'exams' ? 'text-blue-600' : 'text-slate-500'} />
            <span className="mt-2 font-medium">Exams</span>
          </button>
          <button
            onClick={() => setActiveCategory(activeCategory === 'resources' ? '' : 'resources')}
            className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
              activeCategory === 'resources' 
                ? 'bg-blue-100 border-blue-200 text-blue-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            } border shadow-sm`}
          >
            <Book size={24} className={activeCategory === 'resources' ? 'text-blue-600' : 'text-slate-500'} />
            <span className="mt-2 font-medium">Resources</span>
          </button>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        <motion.div variants={itemVariants} className="w-full md:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-800">Frequently Asked Questions</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="px-6 py-4">
                    <button
                      onClick={() => handleToggleFaq(faq.id)}
                      className="flex justify-between items-center w-full text-left focus:outline-none"
                    >
                      <h3 className="text-base font-medium text-slate-800">{faq.question}</h3>
                      <span className="ml-2 flex-shrink-0">
                        {expandedFaq === faq.id ? (
                          <ChevronDown size={18} className="text-blue-600" />
                        ) : (
                          <ChevronRight size={18} className="text-slate-500" />
                        )}
                      </span>
                    </button>
                    {expandedFaq === faq.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 text-sm text-slate-600"
                      >
                        <p>{faq.answer}</p>
                      </motion.div>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <p className="text-slate-500">No matching FAQs found. Try a different search term or category.</p>
                </div>
              )}
            </div>
          </div>

          <motion.div 
            variants={itemVariants}
            className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Contact Support</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a subject</option>
                  <option value="technical">Technical Issue</option>
                  <option value="account">Account Access</option>
                  <option value="exam">Exam Problem</option>
                  <option value="billing">Billing Question</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Mail size={16} className="mr-2" />
                  Submit Ticket
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="w-full md:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden sticky top-6">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Help Resources</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <Video size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-slate-800">Video Tutorials</h3>
                  <p className="text-xs text-slate-500 mt-1">Learn through step-by-step video guides</p>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block">
                    View Tutorials
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <Book size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-slate-800">User Manual</h3>
                  <p className="text-xs text-slate-500 mt-1">Comprehensive guide to all platform features</p>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block">
                    Download PDF
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                  <MessageCircle size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-slate-800">Live Chat</h3>
                  <p className="text-xs text-slate-500 mt-1">Chat with our support team in real-time</p>
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block">
                    Start Chat
                  </button>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-800 mb-2">Contact Information</h3>
                <p className="text-xs text-slate-500">
                  Support hours: Monday-Friday, 9 AM - 5 PM EST
                </p>
                <p className="text-xs text-slate-700 mt-2">
                  Email: <a href="mailto:support@examify.com" className="text-blue-600 hover:text-blue-800">support@examify.com</a>
                </p>
                <p className="text-xs text-slate-700 mt-1">
                  Phone: <a href="tel:+11234567890" className="text-blue-600 hover:text-blue-800">+1 (123) 456-7890</a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HelpSupportPage;
