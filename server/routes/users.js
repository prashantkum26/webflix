import express from 'express';
import {
  getMyList,
  addToMyList,
  removeFromMyList,
  toggleMyList,
  updateUserProfile
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.put('/profile', updateUserProfile);

// My List routes
router.get('/mylist', getMyList);
router.post('/mylist/:movieId', addToMyList);
router.delete('/mylist/:movieId', removeFromMyList);
router.put('/mylist/:movieId', toggleMyList);

export default router;