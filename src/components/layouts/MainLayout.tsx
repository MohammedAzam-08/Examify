import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Sidebar from '../navigation/Sidebar';
import { motion } from 'framer-motion';

const MainLayout: React.FC = () => {
  // State for copy notification
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const location = useLocation();
  
  // Check if current path is the WhiteboardExam page
  const isWhiteboardExam = location.pathname.includes('/student/exam/') && !location.pathname.includes('/review');
  
  // Function to handle copying command to clipboard
  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCommand(null);
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full opacity-30 blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full opacity-20 blur-3xl -ml-48 -mb-48"></div>
      
      <Navbar />
      <div className="flex relative z-0">
        <Sidebar />
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 p-6 md:p-8"
        >
          <Outlet />
          
          {/* Enhanced Footer for main content area - hidden on WhiteboardExam page */}
          {!isWhiteboardExam && (
            <footer className="mt-16 pt-10 border-t border-slate-200">
            <div className="max-w-5xl mx-auto">
              {/* Footer top section - Grid with links */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10 px-4">
                {/* Column 1 - About */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">About Examify</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Our Mission</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Company</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Careers</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Partners</a></li>
                  </ul>
                </div>
                
                {/* Column 2 - Resources */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Resources</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Documentation</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Tutorials</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Webinars</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Blog</a></li>
                  </ul>
                </div>
                
                {/* Column 3 - Support */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Support</h3>
                  <ul className="space-y-2">
                    <li><a href="/help-support" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Help Center</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Contact Us</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Feedback</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">System Status</a></li>
                  </ul>
                </div>
                
                {/* Column 4 - Legal */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">Legal</h3>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Security</a></li>
                    <li><a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Compliance</a></li>
                  </ul>
                </div>
              </div>
              
              {/* Divider with logo */}
              <div className="flex justify-center items-center mb-6">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <div className="px-4 bg-slate-50">
                  <div className="flex flex-col items-center">
                    <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
                      Examify
                    </div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-700"></div>
                    </div>
                  </div>
                </div>
                <div className="w-full h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent"></div>
              </div>
              
              {/* Footer bottom - Copyright and social */}
              <div className="flex flex-col md:flex-row items-center justify-between text-center md:text-left px-4 pb-8">
                <div className="mb-4 md:mb-0">
                  <p className="text-xs text-slate-500">
                    Learning Management System - © 2025 Examify Learning Systems Inc. All Rights Reserved
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
          )}
        </motion.main>
      </div>
    </div>
  );
};

export default MainLayout;