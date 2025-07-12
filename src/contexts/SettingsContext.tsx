import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/apiClient';
import { 
  UserSettings, 
  GeneralSettings, 
  AppearanceSettings, 
  NotificationSettings, 
  PrivacySettings,
  PasswordUpdateData
} from '../types/settings';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateGeneralSettings: (data: Partial<GeneralSettings>) => Promise<void>;
  updateAppearanceSettings: (data: Partial<AppearanceSettings>) => Promise<void>;
  updateNotificationSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  updatePrivacySettings: (data: Partial<PrivacySettings>) => Promise<void>;
  updatePassword: (data: PasswordUpdateData) => Promise<void>;
  applyTheme: (theme: string) => void;
  applyFontSize: (size: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Load settings when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const settingsData = await api.settings.getAll();
      setSettings(settingsData);
      
      // Apply settings to UI
      if (settingsData.appearance) {
        applyTheme(settingsData.appearance.theme);
        applyFontSize(settingsData.appearance.fontSize);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateGeneralSettings = async (data: Partial<GeneralSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.settings.updateGeneral(data);
      setSettings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          general: {
            ...prev.general,
            ...response.settings
          }
        };
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to update general settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAppearanceSettings = async (data: Partial<AppearanceSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.settings.updateAppearance(data);
      setSettings((prev) => {
        if (!prev) return null;
        const updatedSettings = {
          ...prev,
          appearance: {
            ...prev.appearance,
            ...response.settings
          }
        };
        
        // Apply theme and font size changes
        if (data.theme) {
          applyTheme(data.theme);
        }
        if (data.fontSize) {
          applyFontSize(data.fontSize);
        }
        
        return updatedSettings;
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to update appearance settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async (data: Partial<NotificationSettings>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.settings.updateNotifications(data);
      setSettings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            ...response.settings
          }
        };
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to update notification settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (data: Partial<PrivacySettings>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.settings.updatePrivacy(data);
      setSettings((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            ...response.settings
          }
        };
      });
    } catch (err) {
      setError((err as Error).message || 'Failed to update privacy settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (data: PasswordUpdateData) => {
    setLoading(true);
    setError(null);
    try {
      await api.settings.updatePassword(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to update password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Apply theme to document root
  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    const themeClasses = ['theme-blue', 'theme-purple', 'theme-green', 'theme-orange', 'theme-gray', 'theme-white'];
    themeClasses.forEach(cls => root.classList.remove(cls));
    
    // Add the selected theme class
    root.classList.add(`theme-${theme}`);
    
    // Store theme preference in localStorage for persistence
    localStorage.setItem('theme', theme);
  };

  // Apply font size to document root
  const applyFontSize = (size: string) => {
    const root = document.documentElement;
    
    // Remove all existing font size classes
    const fontSizeClasses = ['font-size-small', 'font-size-medium', 'font-size-large'];
    fontSizeClasses.forEach(cls => root.classList.remove(cls));
    
    // Add the selected font size class
    root.classList.add(`font-size-${size}`);
    
    // Store font size preference in localStorage for persistence
    localStorage.setItem('fontSize', size);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
        updateGeneralSettings,
        updateAppearanceSettings,
        updateNotificationSettings,
        updatePrivacySettings,
        updatePassword,
        applyTheme,
        applyFontSize
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
