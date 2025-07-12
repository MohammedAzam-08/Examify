import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  general: {
    language: {
      type: String,
      enum: ['english', 'spanish', 'french', 'german', 'japanese'],
      default: 'english',
    },
    displayName: {
      type: String,
    },
  },
  appearance: {
    theme: {
      type: String,
      enum: ['blue', 'purple', 'green', 'orange', 'gray', 'white'],
      default: 'blue',
    },
    displayMode: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    examReminders: {
      type: Boolean,
      default: true,
    },
    marketingCommunications: {
      type: Boolean,
      default: false,
    },
  },
  privacy: {
    profileVisibility: {
      type: Boolean,
      default: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  }
}, {
  timestamps: true,
});

// Create settings for new user
settingsSchema.statics.createDefaultSettings = async function(userId) {
  try {
    const settings = new this({
      userId,
      general: {
        language: 'english',
      },
      appearance: {
        theme: 'blue',
        displayMode: 'light',
        fontSize: 'medium',
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        examReminders: true,
        marketingCommunications: false,
      },
      privacy: {
        profileVisibility: true,
        twoFactorEnabled: false,
      }
    });
    
    return await settings.save();
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
