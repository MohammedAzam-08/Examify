import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Bell, Shield, Globe, Moon, Sun, Monitor, Save, Palette, AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    settings, 
    loading, 
    error, 
    updateGeneralSettings, 
    updateAppearanceSettings, 
    updateNotificationSettings, 
    updatePrivacySettings
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Form state (initialized from context data)
  const [generalSettings, setGeneralSettings] = useState({
    displayName: user?.name || '',
    language: 'english'
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'blue',
    displayMode: 'light',
    fontSize: 'medium'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    examReminders: true,
    marketingCommunications: false
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    twoFactorEnabled: false
  });

  // Update local state when settings are loaded from context
  useEffect(() => {
    if (settings) {
      // Update general settings
      setGeneralSettings({
        displayName: settings.general.displayName || user?.name || '',
        language: settings.general.language
      });
      
      // Update appearance settings
      setAppearanceSettings({
        theme: settings.appearance.theme,
        displayMode: settings.appearance.displayMode,
        fontSize: settings.appearance.fontSize
      });
      
      // Update notification settings
      setNotificationSettings({
        emailNotifications: settings.notifications.emailNotifications,
        pushNotifications: settings.notifications.pushNotifications,
        examReminders: settings.notifications.examReminders,
        marketingCommunications: settings.notifications.marketingCommunications
      });
      
      // Update privacy settings
      setPrivacySettings({
        profileVisibility: settings.privacy.profileVisibility,
        twoFactorEnabled: settings.privacy.twoFactorEnabled
      });
    }
  }, [settings, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    
    try {
      switch (activeTab) {
        case 'general':
          await updateGeneralSettings({
            displayName: generalSettings.displayName,
            language: generalSettings.language as "english" | "spanish" | "french" | "german" | "japanese"
          });
          break;
        case 'appearance':
          await updateAppearanceSettings({
            theme: appearanceSettings.theme as "blue" | "purple" | "green" | "orange" | "gray",
            displayMode: appearanceSettings.displayMode as "light" | "dark" | "system",
            fontSize: appearanceSettings.fontSize as "small" | "medium" | "large"
          });
          break;
        case 'notifications':
          await updateNotificationSettings(notificationSettings);
          break;
        case 'privacy':
          await updatePrivacySettings(privacySettings);
          break;
      }
      
      // Show success message
      setSuccessMessage('Settings saved successfully!');
    } catch (error: unknown) {
      const err = error as Error;
      const errorMessage = err.message || 'Failed to save settings';
      setSaveError(errorMessage);
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto py-8"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and application settings</p>
        
        {/* Loading State */}
        {loading && (
          <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent mr-2"></div>
            Loading your settings...
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            {error}
          </div>
        )}
        
        {/* Save Error State */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertTriangle size={18} className="mr-2" />
            {saveError}
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <motion.div 
          variants={itemVariants}
          className="w-full md:w-64 bg-white p-4 rounded-lg shadow-sm border border-slate-200"
        >
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'general' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Globe size={18} className="mr-3" />
              General
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'appearance' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Palette size={18} className="mr-3" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bell size={18} className="mr-3" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                activeTab === 'privacy' 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Shield size={18} className="mr-3" />
              Privacy
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-slate-200"
        >
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">General Settings</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={generalSettings.displayName}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        displayName: e.target.value
                      })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      defaultValue={user?.email}
                      disabled
                      className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Contact support to change your email address</p>
                  </div>
                  
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-1">
                      Language
                    </label>
                    <select
                      id="language"
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        language: e.target.value as "english" | "spanish" | "french" | "german" | "japanese"
                      })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="english">English</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="japanese">Japanese</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Appearance Settings</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color Theme
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        {['blue', 'purple', 'green', 'orange', 'gray', 'white'].map((colorTheme) => (
                        <button
                          key={colorTheme}
                          type="button"
                          onClick={() => setAppearanceSettings({
                            ...appearanceSettings,
                            theme: colorTheme as "blue" | "purple" | "green" | "orange" | "gray" | "white"
                          })}
                          className={`w-10 h-10 rounded-full border-2 ${
                            appearanceSettings.theme === colorTheme ? 'border-slate-800 ring-2 ring-blue-400' : 'border-slate-300'
                          }`}
                          style={{ 
                            backgroundColor: 
                              colorTheme === 'blue' ? '#3b82f6' : 
                              colorTheme === 'purple' ? '#8b5cf6' : 
                              colorTheme === 'green' ? '#10b981' : 
                              colorTheme === 'orange' ? '#f97316' : 
                              colorTheme === 'white' ? '#ffffff' :
                              '#6b7280',
                            boxShadow: colorTheme === 'white' ? 'inset 0 0 0 1px rgba(0,0,0,0.3)' : 'none'
                          }}
                        />
                      ))}
                      </div>
                      <div className="text-sm text-slate-600">
                        Current theme: <span className="font-medium capitalize">{appearanceSettings.theme}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Display Mode
                    </label>
                    <div className="flex border border-slate-200 rounded-lg p-1 w-fit">
                      <button
                        type="button"
                        onClick={() => setAppearanceSettings({
                          ...appearanceSettings,
                          displayMode: "light"
                        })}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          appearanceSettings.displayMode === "light"
                            ? 'bg-blue-100 text-blue-800' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Sun size={18} className="mr-2" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppearanceSettings({
                          ...appearanceSettings,
                          displayMode: "dark"
                        })}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          appearanceSettings.displayMode === "dark"
                            ? 'bg-blue-100 text-blue-800' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Moon size={18} className="mr-2" />
                        Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppearanceSettings({
                          ...appearanceSettings,
                          displayMode: "system"
                        })}
                        className={`flex items-center px-4 py-2 rounded-md ${
                          appearanceSettings.displayMode === "system"
                            ? 'bg-blue-100 text-blue-800' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Monitor size={18} className="mr-2" />
                        System
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="fontSize" className="block text-sm font-medium text-slate-700 mb-1">
                      Font Size
                    </label>
                    <select
                      id="fontSize"
                      value={appearanceSettings.fontSize}
                      onChange={(e) => setAppearanceSettings({
                        ...appearanceSettings,
                        fontSize: e.target.value as "small" | "medium" | "large"
                      })}
                      className="w-full md:w-1/3 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Notification Settings</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Email Notifications</h3>
                      <p className="text-xs text-slate-500">Receive email updates about exam schedules and results</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: !notificationSettings.emailNotifications
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Push Notifications</h3>
                      <p className="text-xs text-slate-500">Receive in-app notifications about new exams and study materials</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: !notificationSettings.pushNotifications
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`${
                          notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Exam Reminders</h3>
                      <p className="text-xs text-slate-500">Receive reminders 24 hours before scheduled exams</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          examReminders: !notificationSettings.examReminders
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          notificationSettings.examReminders ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`${
                          notificationSettings.examReminders ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Marketing Communications</h3>
                      <p className="text-xs text-slate-500">Receive updates about new features and improvements</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          marketingCommunications: !notificationSettings.marketingCommunications
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          notificationSettings.marketingCommunications ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`${
                          notificationSettings.marketingCommunications ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-6">Privacy Settings</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Profile Visibility</h3>
                      <p className="text-xs text-slate-500">Allow instructors to see your profile information</p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setPrivacySettings({
                          ...privacySettings,
                          profileVisibility: !privacySettings.profileVisibility
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          privacySettings.profileVisibility ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`${
                          privacySettings.profileVisibility ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Two-Factor Authentication</h3>
                      <p className="text-xs text-slate-500">Enhance your account security with 2FA</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrivacySettings({
                        ...privacySettings,
                        twoFactorEnabled: !privacySettings.twoFactorEnabled
                      })}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {privacySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                    <p className="text-xs text-red-600 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Are you sure you want to request account deletion? This action cannot be undone and will permanently delete all your data."
                        );
                        
                        if (confirmed) {
                          // This would typically call an API endpoint to request account deletion
                          // For now we'll just show a confirmation message
                          setSuccessMessage("Account deletion request submitted. Our team will contact you shortly.");
                        }
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Request Account Deletion
                    </button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <Save size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
