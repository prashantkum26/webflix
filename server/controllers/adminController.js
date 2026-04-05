import User from '../models/User.js';
import Movie from '../models/Movie.js';
import WatchHistory from '../models/WatchHistory.js';
import Subscription from '../models/Subscription.js';
import Settings from '../models/Settings.js';
import jwt from 'jsonwebtoken';

// Admin Dashboard Overview
export const getDashboardStats = async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    
    // Get user statistics
    const userStats = await User.getUserStats();
    
    // Get subscription statistics
    const subscriptionStats = await Subscription.getSubscriptionStats();
    
    // Get recent watch activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViews = await WatchHistory.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Get trending movies
    const trendingMovies = await WatchHistory.getTrendingMovies(7, 5);
    
    // Calculate total watch time (last 30 days)
    const watchTimeStats = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalWatchTime: { $sum: '$watchTime' },
          avgWatchTime: { $avg: '$watchTime' },
          totalSessions: { $sum: 1 }
        }
      }
    ]);
    
    // Get top genres
    const genreStats = await Movie.aggregate([
      { $unwind: '$genre' },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalMovies,
          activeSubscriptions,
          recentViews
        },
        userStats: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
          adminUsers: 0
        },
        subscriptionStats,
        watchTimeStats: watchTimeStats[0] || {
          totalWatchTime: 0,
          avgWatchTime: 0,
          totalSessions: 0
        },
        trendingMovies,
        genreStats
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    const users = await User.find(filter)
      .select('-password -verificationToken')
      .populate('myList', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -verificationToken')
      .populate('myList', 'title thumbnail')
      .populate('continueWatching.movie', 'title thumbnail duration');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's subscription
    const subscription = await Subscription.findOne({ user: userId });
    
    // Get user's watch history stats
    const watchStats = await WatchHistory.getUserWatchStats(userId, 30);
    
    res.json({
      success: true,
      data: {
        user,
        subscription,
        watchStats: watchStats[0] || null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Prevent updating sensitive fields through this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -verificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deleting super admins
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin users'
      });
    }
    
    // Delete related data
    await WatchHistory.deleteMany({ user: userId });
    await Subscription.deleteOne({ user: userId });
    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Content Management
export const getAllMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const genre = req.query.genre || '';
    const year = req.query.year || '';
    const featured = req.query.featured;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (genre) {
      filter.genre = { $in: [genre] };
    }
    
    if (year) {
      filter.year = parseInt(year);
    }
    
    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }
    
    const movies = await Movie.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalMovies = await Movie.countDocuments(filter);
    const totalPages = Math.ceil(totalMovies / limit);
    
    res.json({
      success: true,
      data: {
        movies,
        pagination: {
          currentPage: page,
          totalPages,
          totalMovies,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const movie = await Movie.findById(movieId);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    // Get movie statistics
    const movieStats = await WatchHistory.getMovieStats(movieId, 30);
    
    res.json({
      success: true,
      data: {
        movie,
        stats: movieStats[0] || null
      }
    });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movie details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const updates = req.body;
    
    // Prevent updating certain fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: { movie }
    });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating movie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const movie = await Movie.findByIdAndDelete(movieId);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    // Delete related watch history
    await WatchHistory.deleteMany({ movie: movieId });
    
    // Remove from user lists
    await User.updateMany(
      { myList: movieId },
      { $pull: { myList: movieId } }
    );
    
    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting movie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk operations
export const bulkUpdateMovies = async (req, res) => {
  try {
    const { movieIds, updates } = req.body;
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movie IDs array is required'
      });
    }
    
    // Prevent updating certain fields
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const result = await Movie.updateMany(
      { _id: { $in: movieIds } },
      updates,
      { runValidators: true }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} movies updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating movies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const bulkDeleteMovies = async (req, res) => {
  try {
    const { movieIds } = req.body;
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movie IDs array is required'
      });
    }
    
    // Delete movies
    const result = await Movie.deleteMany({ _id: { $in: movieIds } });
    
    // Delete related watch history
    await WatchHistory.deleteMany({ movie: { $in: movieIds } });
    
    // Remove from user lists
    await User.updateMany(
      { myList: { $in: movieIds } },
      { $pullAll: { myList: movieIds } }
    );
    
    res.json({
      success: true,
      message: `${result.deletedCount} movies deleted successfully`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting movies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};