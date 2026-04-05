import Settings from '../models/Settings.js';
import User from '../models/User.js';

// Get system settings
export const getSystemSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      data: settings // Frontend expects settings directly in data
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update system settings
export const updateSystemSettings = async (req, res) => {
  try {
    const updates = req.body;
    const userId = req.user.id;
    
    // Validate that user has admin privileges
    if (!req.user.hasAdminAccess()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const settings = await Settings.updateSettings(updates, userId);
    
    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('preferences');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { preferences: user.preferences }
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user preferences
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update preferences using the model method
    user.updatePreferences(preferences);
    await user.save();
    
    res.json({
      success: true,
      message: 'User preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Check if user is requesting their own profile or has admin access
    if (userId !== req.user.id && !req.user.hasAdminAccess()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }
    
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
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const updates = req.body;
    
    // Check if user is updating their own profile or has admin access
    if (userId !== req.user.id && !req.user.hasAdminAccess()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.isAdmin;
    delete updates.role;
    delete updates.permissions;
    
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
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Toggle movie in user's list
export const toggleMyList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const added = user.toggleMyList(movieId);
    await user.save();
    
    res.json({
      success: true,
      message: added ? 'Movie added to your list' : 'Movie removed from your list',
      data: { 
        added,
        myList: user.myList
      }
    });
  } catch (error) {
    console.error('Toggle my list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating your list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's list
export const getMyList = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('myList', 'title description thumbnail videoUrl genre rating year duration cast director featured trending topRated views')
      .select('myList');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { movies: user.myList }
    });
  } catch (error) {
    console.error('Get my list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update continue watching progress
export const updateContinueWatching = async (req, res) => {
  try {
    const userId = req.user.id;
    const { movieId, watchTime, totalDuration } = req.body;
    
    if (!movieId || watchTime === undefined || !totalDuration) {
      return res.status(400).json({
        success: false,
        message: 'Movie ID, watch time, and total duration are required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.updateContinueWatching(movieId, watchTime, totalDuration);
    await user.save();
    
    res.json({
      success: true,
      message: 'Continue watching updated successfully',
      data: { continueWatching: user.continueWatching }
    });
  } catch (error) {
    console.error('Update continue watching error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating continue watching',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get continue watching list
export const getContinueWatching = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('continueWatching.movie', 'title thumbnail duration genre')
      .select('continueWatching');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Sort by last watched (most recent first)
    const continueWatching = user.continueWatching
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 20); // Limit to 20 most recent items
    
    res.json({
      success: true,
      data: { continueWatching }
    });
  } catch (error) {
    console.error('Get continue watching error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching continue watching list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};