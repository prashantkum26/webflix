import User from '../models/User.js';
import Movie from '../models/Movie.js';

// @desc    Get user's movie list
// @route   GET /api/users/mylist
// @access  Private
export const getMyList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('myList');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user.myList
    });
  } catch (error) {
    console.error('Get my list error:', error);
    res.status(500).json({ 
      message: 'Server error fetching user list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Add movie to user's list
// @route   POST /api/users/mylist/:movieId
// @access  Private
export const addToMyList = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if movie is already in user's list
    if (user.myList.includes(movieId)) {
      return res.status(400).json({ message: 'Movie already in your list' });
    }
    
    // Add movie to user's list
    user.myList.push(movieId);
    await user.save();
    
    // Return updated list with populated movie data
    await user.populate('myList');
    
    res.json({
      success: true,
      message: 'Movie added to your list',
      data: user.myList
    });
  } catch (error) {
    console.error('Add to list error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error adding movie to list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Remove movie from user's list
// @route   DELETE /api/users/mylist/:movieId
// @access  Private
export const removeFromMyList = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    // Check if movie is in user's list
    if (!user.myList.includes(movieId)) {
      return res.status(400).json({ message: 'Movie not in your list' });
    }
    
    // Remove movie from user's list
    user.myList = user.myList.filter(id => id.toString() !== movieId);
    await user.save();
    
    // Return updated list with populated movie data
    await user.populate('myList');
    
    res.json({
      success: true,
      message: 'Movie removed from your list',
      data: user.myList
    });
  } catch (error) {
    console.error('Remove from list error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error removing movie from list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Toggle movie in user's list
// @route   PUT /api/users/mylist/:movieId
// @access  Private
export const toggleMyList = async (req, res) => {
  try {
    const { movieId } = req.params;
    
    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const user = await User.findById(req.user._id);
    
    let message;
    
    // Check if movie is already in user's list
    if (user.myList.includes(movieId)) {
      // Remove from list
      user.myList = user.myList.filter(id => id.toString() !== movieId);
      message = 'Movie removed from your list';
    } else {
      // Add to list
      user.myList.push(movieId);
      message = 'Movie added to your list';
    }
    
    await user.save();
    
    // Return updated list with populated movie data
    await user.populate('myList');
    
    res.json({
      success: true,
      message,
      isInList: user.myList.some(m => m._id.toString() === movieId),
      data: user.myList
    });
  } catch (error) {
    console.error('Toggle list error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error toggling movie in list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
    }
    
    if (name) {
      user.name = name.trim();
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};