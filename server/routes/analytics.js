import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getAnalyticsOverview,
  getUserEngagementAnalytics,
  getRevenueAnalytics,
  getContentAnalytics,
  exportAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(protect);

// Analytics overview (admin only)
router.get('/overview', adminOnly, getAnalyticsOverview);

// User engagement analytics (admin only)
router.get('/engagement', adminOnly, getUserEngagementAnalytics);

// Revenue analytics (admin only)
router.get('/revenue', adminOnly, getRevenueAnalytics);

// Content analytics (admin only)
router.get('/content', adminOnly, getContentAnalytics);

// Export analytics data (admin only)
router.get('/export', adminOnly, exportAnalytics);

export default router;