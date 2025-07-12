// Settings types
export interface GeneralSettings {
  language: 'english' | 'spanish' | 'french' | 'german' | 'japanese';
  displayName?: string;
}

export interface AppearanceSettings {
  theme: 'blue' | 'purple' | 'green' | 'orange' | 'gray' | 'white';
  displayMode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  examReminders: boolean;
  marketingCommunications: boolean;
}

export interface PrivacySettings {
  profileVisibility: boolean;
  twoFactorEnabled: boolean;
}

export interface UserSettings {
  _id: string;
  userId: string;
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileData {
  name?: string;
  email?: string;
  course?: string;
  semester?: number;
  password?: string;
  oldPassword?: string;
}

export interface PasswordUpdateData {
  oldPassword: string;
  newPassword: string;
}
