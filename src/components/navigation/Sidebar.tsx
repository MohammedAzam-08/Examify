import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookOpen, 
  PenTool, 
  FileText, 
  Home, 
  Users, 
  User, 
  GraduationCap,
  Settings,
  ClipboardCheck,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const location = useLocation();

  // Animation variants - more subtle for professional look
  const sidebarVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1,
      x: 0,
      transition: { 
        type: "tween" as const,
        duration: 0.3,
        ease: "easeOut" as const,
        staggerChildren: 0.05
      }
    }
  };

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="sidebar hidden md:flex flex-col w-72 bg-white shadow-md min-h-[calc(100vh-4rem)] border-r border-slate-200 overflow-hidden"
    >
      <div className="flex-1 py-6 px-4 flex flex-col relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-60 -mr-20 -mt-20 z-0"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-50 to-transparent rounded-full opacity-60 -ml-10 -mb-10 z-0"></div>
        
        <div className="mb-6 px-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            
          </motion.div>
        </div>
        <div className="space-y-2 relative z-10">
          {isStudent ? (
            <>
              <div className="mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="bg-gradient-to-r from-blue-50 to-transparent p-3 rounded-lg border-l-2 border-blue-500 mb-4"
                >
                  <h2 className="text-base font-semibold text-slate-900 flex items-center">
                    <span className="h-5 w-1.5 bg-blue-500 rounded-full mr-2 shadow-sm"></span>
                    Student Portal
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 ml-3.5">Access your learning resources</p>
                </motion.div>
              </div>
              
              {[
                { path: '/student', icon: <Home size={18} />, label: 'Dashboard', index: 0, exact: true },
                { path: '/student/exams', icon: <BookOpen size={18} />, label: 'My Exams', index: 1, exact: true },
                { path: '/student/study-resources', icon: <GraduationCap size={18} />, label: 'Study Resources', index: 2, exact: true },
                { path: '/student/results', icon: <Award size={18} />, label: 'Results', index: 3, exact: true },
                { path: '/student/profile', icon: <Users size={18} />, label: 'Profile', index: 4, exact: true },
                { path: '/settings', icon: <Settings size={18} />, label: 'Settings', index: 5, exact: true }
              ].map((item) => (
                <motion.div
                  key={item.path}
                  custom={item.index}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: { 
                        type: "spring",
                        stiffness: 100, 
                        damping: 12, 
                        delay: item.index * 0.05 
                      }
                    }
                  }}
                  className="mb-2"
                >
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-medium border-l-2 border-blue-500 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700 hover:pl-4 border-l-2 border-transparent'
                      }`
                    }
                    end={item.exact}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 transition-all duration-300 ${
                      (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                        ? 'text-white bg-gradient-to-br from-blue-500 to-blue-700 rounded-md shadow-sm transform scale-105' 
                        : 'text-slate-500 bg-slate-100 bg-opacity-60 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="transition-all duration-200">{item.label}</span>
                    {(item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)) && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="ml-auto h-2 w-2 rounded-full bg-blue-600"
                      ></motion.span>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <div className="mb-6">
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="bg-gradient-to-r from-blue-600/5 via-blue-100/20 to-transparent p-3 rounded-lg border-l-2 border-blue-600"
                >
                  <h2 className="text-base font-semibold text-slate-800 flex items-center">
                    <span className="h-5 w-1.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-2 shadow-sm"></span>
                    Instructor Portal
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 ml-3.5">Manage your educational content</p>
                </motion.div>
              </div>
              
              <div className="space-y-1">
                {[
                  { path: '/instructor', icon: <Home size={18} />, label: 'Dashboard', index: 0, exact: true },
                  { path: '/instructor/exams/create', icon: <PenTool size={18} />, label: 'Create Exam', index: 1, exact: true },
                  { path: '/instructor/exams', icon: <FileText size={18} />, label: 'My Exams', index: 2, exact: true },
                  { path: '/instructor/submissions', icon: <ClipboardCheck size={18} />, label: 'Grade Submissions', index: 3, exact: true },
                  { path: '/instructor/students', icon: <Users size={18} />, label: 'Students', index: 4, exact: true },
                  { path: '/instructor/study-materials', icon: <BookOpen size={18} />, label: 'Study Materials', index: 5, exact: true },
                  { path: '/instructor/profile', icon: <User size={18} />, label: 'Profile', index: 6, exact: true },
                  { path: '/settings', icon: <Settings size={18} />, label: 'Settings', index: 7, exact: true }
                ].map((item) => (
                  <motion.div
                    key={item.path}
                    custom={item.index}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { 
                          type: "spring",
                          stiffness: 100, 
                          damping: 12, 
                          delay: item.index * 0.05 
                        }
                      }
                    }}
                    className="mb-1.5"
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 font-medium border-l-2 border-blue-600 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700 hover:pl-4 border-l-2 border-transparent'
                        }`
                      }
                      end={item.exact}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 transition-all duration-300 ${
                        (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                          ? 'text-white bg-gradient-to-br from-blue-600 to-blue-700 rounded-md shadow-sm transform scale-105' 
                          : 'text-slate-500 bg-slate-100 bg-opacity-60 rounded-md group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}>
                        {item.icon}
                      </div>
                      <span className={`transition-all duration-200 ${
                        (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path))
                          ? 'font-medium' : ''
                      }`}>{item.label}</span>
                      
                      {(item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)) && (
                        <motion.span 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }}
                          className="ml-auto h-2 w-2 rounded-full bg-blue-600"
                        ></motion.span>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="py-4 px-6 border-t border-slate-100 mt-auto relative"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-gradient-to-r from-blue-200 to-transparent rounded-full mr-2"></div>
            <p className="text-xs font-medium text-slate-500">© 2025 Examify</p>
            <div className="w-4 h-0.5 bg-gradient-to-l from-blue-200 to-transparent rounded-full ml-2"></div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Help</span>
            <span>•</span>
            <span>Support</span>
            <span>•</span>
            <span>Privacy</span>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;