import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  bulkUpdateMovies,
  bulkDeleteMovies
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(protect);
router.use(adminOnly);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// Content management routes
router.get('/movies', getAllMovies);
router.get('/movies/:movieId', getMovieById);
router.put('/movies/:movieId', updateMovie);
router.delete('/movies/:movieId', deleteMovie);

// Bulk operations
router.put('/movies/bulk-update', bulkUpdateMovies);
router.delete('/movies/bulk-delete', bulkDeleteMovies);

export default router;