import express from 'express';
import { 
  getMovies, 
  getMovie, 
  createMovie, 
  updateMovie, 
  deleteMovie,
  getMovieCategories,
  uploadMovie
} from '../controllers/movieController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getMovies);
router.get('/categories', getMovieCategories);
router.get('/:id', getMovie);

// Protected admin routes
router.post('/', protect, admin, createMovie);
router.post('/upload', protect, admin, uploadMovie);
router.put('/:id', protect, admin, updateMovie);
router.delete('/:id', protect, admin, deleteMovie);

export default router;
