import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search, 
  HelpCircle, 
  User, 
  Settings, 
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Refs for dropdown menus
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close dropdowns if clicking outside of them
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node) &&
        profileMenuRef.current && 
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav animation variants
  const navVariants = {
    initial: { y: -10, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15
      } 
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: custom * 0.1, 
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    })
  };

  return (
    <motion.nav 
      initial="initial"
      animate="animate"
      variants={navVariants}
      className={`bg-white transition-all duration-200 z-10 relative ${
        scrolled ? 'shadow-md border-b border-slate-200' : 'shadow-sm'
      }`}
    >
      {/* Decorative accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-70"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-60 -ml-12 -mt-12 z-0"></div>
        
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center relative z-10">
              <Link 
                to={user?.role === 'student' ? '/student' : '/instructor'} 
                className="relative group"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative"
                >
                  <span className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-transparent rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></span>
                  <h1 className="text-2xl font-bold text-blue-800 tracking-tight relative">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
                      Examify
                      <span className="absolute -top-1 -right-2 w-2 h-2 bg-blue-500 rounded-full shadow-sm"></span>
                    </span>
                  </h1>
                </motion.div>
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
            {/* Search bar */}
            <motion.div 
              custom={0}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className="relative"
            >
              <div className="relative max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 hover:bg-white transition-all duration-200"
                />
              </div>
            </motion.div>
            
            {/* Notification bell */}
            <motion.div 
              custom={1}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className="relative"
              ref={notificationRef}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 rounded-full text-slate-500 hover:text-blue-700 hover:bg-blue-50 focus:outline-none transition-colors duration-200 relative"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 border border-slate-200 z-20"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <h3 className="text-sm font-medium text-slate-800">Notifications</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-4 py-2 hover:bg-slate-50 transition-colors duration-150">
                        <p className="text-xs font-medium text-blue-600">New Exam Available</p>
                        <p className="text-sm text-slate-600 mt-0.5">Midterm Assessment is now available.</p>
                        <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                      </div>
                      <div className="px-4 py-2 hover:bg-slate-50 transition-colors duration-150">
                        <p className="text-xs font-medium text-blue-600">Exam Results</p>
                        <p className="text-sm text-slate-600 mt-0.5">Your practice test results are ready.</p>
                        <p className="text-xs text-slate-400 mt-1">Yesterday</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2">
                      <button className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-150">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Help icon */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
            >
              <Link to="/help-support" className="p-2 rounded-full text-slate-500 hover:bg-blue-50 focus:outline-none transition-colors duration-200 inline-flex">
                <HelpCircle size={18} />
              </Link>
            </motion.div>
            
            {/* Profile menu */}
            <motion.div 
              custom={3}
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className="ml-1 relative"
              ref={profileMenuRef}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-1 rounded-md px-2 py-1.5 border border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all duration-200 focus:outline-none group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors duration-200">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors duration-200" />
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-slate-200 z-20"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-500">{user?.role?.toUpperCase()}</p>
                      <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'email@example.com'}</p>
                    </div>
                    
                    <Link to={user?.role === 'student' ? '/student/profile' : '/instructor/profile'} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150">
                      <User size={14} className="mr-2" />
                      Profile
                    </Link>
                    
                    <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150">
                      <Settings size={14} className="mr-2" />
                      Settings
                    </Link>
                    
                    <div className="border-t border-slate-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <LogOut size={14} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          
          <motion.div 
            custom={4}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="flex items-center sm:hidden"
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none transition-colors duration-200"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </motion.div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-slate-100"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="pt-2 pb-4 space-y-1 bg-white shadow-sm"
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>
                </div>
              </div>
              
              <Link 
                to={user?.role === 'student' ? '/student/profile' : '/instructor/profile'} 
                className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User size={16} className="mr-3 text-slate-500" />
                Profile
              </Link>
              
              <Link 
                to="/settings" 
                className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings size={16} className="mr-3 text-slate-500" />
                Settings
              </Link>
              
              <button
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Bell size={16} className="mr-3 text-slate-500" />
                Notifications
                <span className="ml-2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></span>
              </button>
              
              <Link
                to="/help-support"
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <HelpCircle size={16} className="mr-3 text-slate-500" />
                Help & Support
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100 mt-2"
              >
                <LogOut size={16} className="mr-3" />
                Logout
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Footer - enhanced version that appears when scrolled down */}
      <AnimatePresence>
        {scrolled && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute right-0 bottom-0 mr-4 transform translate-y-full hidden md:block z-10"
          >
            <div className="bg-white rounded-b-md shadow-sm border border-t-0 border-slate-200 overflow-hidden">
              <div className="flex items-center px-4 py-2 space-x-3">
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-light)' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary-hover)' }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-700">Examify LMS</span>
                  </div>
                  <div className="flex items-center mt-1 space-x-3">
                    <span className="text-[10px] text-slate-500">© 2025 Examify Learning Systems Inc.</span>
                    <div className="h-3 w-px bg-slate-200"></div>
                    <span className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">Privacy</span>
                    <span className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">Terms</span>
                    <span className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">Support</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-100 mx-1"></div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-full px-2 py-1 flex items-center">
                  <span className="text-[10px] text-blue-700 font-medium">v2.4.1</span>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-blue-500/20 via-blue-500 to-blue-500/20"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;