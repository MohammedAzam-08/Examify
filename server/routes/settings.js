import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ userId: req.user._id });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await Settings.createDefaultSettings(req.user._id);
  }
  
  res.json(settings);
}));

// @route   PUT /api/settings/general
// @desc    Update general settings
// @access  Private
router.put('/general', protect, asyncHandler(async (req, res) => {
  const { language, displayName } = req.body;
  
  let settings = await Settings.findOne({ userId: req.user._id });
  
  if (!settings) {
    settings = await Settings.createDefaultSettings(req.user._id);
  }
  
  // Update settings
  if (language) settings.general.language = language;
  
  // If display name is provided, update both settings and user model
  if (displayName) {
    settings.general.displayName = displayName;
    
    // Update user's name in User model
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = displayName;
      await user.save();
    }
  }
  
  await settings.save();
  
  res.json({
    success: true,
    settings: settings.general
  });
}));

// @route   PUT /api/settings/appearance
// @desc    Update appearance settings
// @access  Private
router.put('/appearance', protect, asyncHandler(async (req, res) => {
  const { theme, displayMode, fontSize } = req.body;
  
  let settings = await Settings.findOne({ userId: req.user._id });
  
  if (!settings) {
    settings = await Settings.createDefaultSettings(req.user._id);
  }
  
  // Update settings
  // Validate theme explicitly to ensure all valid options are recognized
  if (theme) {
    const validThemes = ['blue', 'purple', 'green', 'orange', 'gray', 'white'];
    if (validThemes.includes(theme)) {
      settings.appearance.theme = theme;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid theme value. Valid options are: ${validThemes.join(', ')}` 
      });
    }
  }
  if (displayMode) settings.appearance.displayMode = displayMode;
  if (fontSize) settings.appearance.fontSize = fontSize;
  
  await settings.save();
  
  res.json({
    success: true,
    settings: settings.appearance
  });
}));

// @route   PUT /api/settings/notifications
// @desc    Update notification settings
// @access  Private
router.put('/notifications', protect, asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications, examReminders, marketingCommunications } = req.body;
  
  let settings = await Settings.findOne({ userId: req.user._id });
  
  if (!settings) {
    settings = await Settings.createDefaultSettings(req.user._id);
  }
  
  // Update settings
  if (typeof emailNotifications === 'boolean') settings.notifications.emailNotifications = emailNotifications;
  if (typeof pushNotifications === 'boolean') settings.notifications.pushNotifications = pushNotifications;
  if (typeof examReminders === 'boolean') settings.notifications.examReminders = examReminders;
  if (typeof marketingCommunications === 'boolean') settings.notifications.marketingCommunications = marketingCommunications;
  
  await settings.save();
  
  res.json({
    success: true,
    settings: settings.notifications
  });
}));

// @route   PUT /api/settings/privacy
// @desc    Update privacy settings
// @access  Private
router.put('/privacy', protect, asyncHandler(async (req, res) => {
  const { profileVisibility, twoFactorEnabled } = req.body;
  
  let settings = await Settings.findOne({ userId: req.user._id });
  
  if (!settings) {
    settings = await Settings.createDefaultSettings(req.user._id);
  }
  
  // Update settings
  if (typeof profileVisibility === 'boolean') settings.privacy.profileVisibility = profileVisibility;
  if (typeof twoFactorEnabled === 'boolean') settings.privacy.twoFactorEnabled = twoFactorEnabled;
  
  await settings.save();
  
  res.json({
    success: true,
    settings: settings.privacy
  });
}));

// @route   PUT /api/settings/password
// @desc    Update user password
// @access  Private
router.put('/password', protect, asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error('Both old and new passwords are required');
  }
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if old password matches
  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

export default router;
