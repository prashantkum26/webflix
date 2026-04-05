import express from 'express';
import { 
  getMovies, 
  getMovie, 
  createMovie, 
  updateMovie, 
  deleteMovie,
  getMovieCategories,
  uploadMovie,
  getContentAnalytics,
  getModerationQueue,
  updateMovieStatus,
  bulkUpdateMovies,
  getMovieVersions,
  rollbackMovieVersion,
  getScheduledContent,
  processScheduledPublishing,
  getTrendingMovies,
  bulkDeleteMovies,
  testS3Delete
} from '../controllers/movieController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getMovies);
router.get('/categories', getMovieCategories);
router.get('/trending', getTrendingMovies);
router.get('/:id', getMovie);

// Protected admin routes - Analytics & Management
router.get('/admin/analytics', protect, admin, getContentAnalytics);
router.get('/admin/moderation-queue', protect, admin, getModerationQueue);
router.get('/admin/scheduled', protect, admin, getScheduledContent);
router.post('/admin/process-scheduled', protect, admin, processScheduledPublishing);

// Protected admin routes - CRUD Operations
router.post('/', protect, admin, createMovie);
router.post('/upload', protect, admin, uploadMovie);
router.put('/:id', protect, admin, updateMovie);

// Protected admin routes - Advanced Operations
router.put('/:id/status', protect, admin, updateMovieStatus);

// Protected admin routes - Version Control
router.get('/:id/versions', protect, admin, getMovieVersions);
router.put('/:id/rollback/:version', protect, admin, rollbackMovieVersion);

// Protected admin routes - Debug/Testing
router.post('/test-s3-delete', protect, admin, testS3Delete);

export default router;
