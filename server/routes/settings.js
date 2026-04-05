import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getSystemSettings,
  updateSystemSettings,
  getUserPreferences,
  updateUserPreferences,
  getUserProfile,
  updateUserProfile,
  changePassword,
  toggleMyList,
  getMyList,
  updateContinueWatching,
  getContinueWatching
} from '../controllers/settingsController.js';

const router = express.Router();

// Apply authentication to all settings routes
router.use(protect);

// System settings routes (admin only)
router.get('/system', getSystemSettings);
router.put('/system', adminOnly, updateSystemSettings);

// User preferences routes
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);

// User profile routes
router.get('/profile/:userId?', getUserProfile);
router.put('/profile/:userId?', updateUserProfile);

// Password management
router.put('/change-password', changePassword);

// My List management
router.get('/my-list', getMyList);
router.post('/my-list/:movieId', toggleMyList);
router.delete('/my-list/:movieId', toggleMyList);

// Continue watching management
router.get('/continue-watching', getContinueWatching);
router.put('/continue-watching', updateContinueWatching);

export default router;