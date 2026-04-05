import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  myList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }],
  
  // User profile information
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'hi', 'ja', 'ko', 'zh']
  },
  
  // User preferences
  preferences: {
    // Playback settings
    autoplay: {
      type: Boolean,
      default: true
    },
    autoplayTrailers: {
      type: Boolean,
      default: true
    },
    previewOnHover: {
      type: Boolean,
      default: true
    },
    hoverDelay: {
      type: Number,
      default: 500,
      min: [100, 'Hover delay cannot be less than 100ms'],
      max: [5000, 'Hover delay cannot be more than 5000ms']
    },
    
    // Video quality preferences
    preferredVideoQuality: {
      type: String,
      enum: ['auto', '480p', '720p', '1080p', '4K'],
      default: 'auto'
    },
    dataUsageMode: {
      type: String,
      enum: ['low', 'medium', 'high', 'auto'],
      default: 'auto'
    },
    
    // Audio and subtitle preferences
    preferredAudioLanguage: {
      type: String,
      default: 'en'
    },
    preferredSubtitleLanguage: {
      type: String,
      default: null
    },
    subtitlesEnabled: {
      type: Boolean,
      default: false
    },
    
    // Notification preferences
    emailNotifications: {
      newReleases: {
        type: Boolean,
        default: true
      },
      recommendations: {
        type: Boolean,
        default: true
      },
      accountUpdates: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: false
      }
    },
    
    // Privacy settings
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    shareWatchHistory: {
      type: Boolean,
      default: false
    },
    allowRecommendations: {
      type: Boolean,
      default: true
    }
  },
  
  // Continue watching progress
  continueWatching: [{
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie'
    },
    watchTime: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      required: true
    },
    watchPercentage: {
      type: Number,
      default: 0
    },
    lastWatched: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User activity tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  
  // Admin and role management
  isAdmin: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage_users', 'manage_content', 'view_analytics']
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Check if user has admin privileges
userSchema.methods.hasAdminAccess = function() {
  return this.isAdmin || this.role === 'admin' || this.role === 'super_admin';
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  return this.permissions.includes(permission);
};

// Update continue watching progress
userSchema.methods.updateContinueWatching = function(movieId, watchTime, totalDuration) {
  const existingIndex = this.continueWatching.findIndex(item => 
    item.movie.toString() === movieId.toString()
  );
  
  const watchPercentage = Math.min((watchTime / totalDuration) * 100, 100);
  
  if (existingIndex > -1) {
    // Update existing entry
    this.continueWatching[existingIndex].watchTime = watchTime;
    this.continueWatching[existingIndex].totalDuration = totalDuration;
    this.continueWatching[existingIndex].watchPercentage = watchPercentage;
    this.continueWatching[existingIndex].lastWatched = new Date();
  } else {
    // Add new entry
    this.continueWatching.push({
      movie: movieId,
      watchTime,
      totalDuration,
      watchPercentage,
      lastWatched: new Date()
    });
  }
  
  // Keep only the most recent 50 items and remove completed ones (>95%)
  this.continueWatching = this.continueWatching
    .filter(item => item.watchPercentage < 95)
    .sort((a, b) => b.lastWatched - a.lastWatched)
    .slice(0, 50);
};

// Add or remove movie from user's list
userSchema.methods.toggleMyList = function(movieId) {
  const movieIndex = this.myList.findIndex(id => id.toString() === movieId.toString());
  
  if (movieIndex > -1) {
    // Remove from list
    this.myList.splice(movieIndex, 1);
    return false; // Removed
  } else {
    // Add to list
    this.myList.push(movieId);
    return true; // Added
  }
};

// Update user preferences
userSchema.methods.updatePreferences = function(newPreferences) {
  this.preferences = { ...this.preferences.toObject(), ...newPreferences };
};

// Static method to get users with admin access
userSchema.statics.getAdminUsers = function() {
  return this.find({
    $or: [
      { isAdmin: true },
      { role: { $in: ['admin', 'super_admin'] } }
    ]
  }).select('-password');
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        verifiedUsers: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        adminUsers: {
          $sum: { 
            $cond: [
              { $or: [
                { $eq: ['$isAdmin', true] },
                { $in: ['$role', ['admin', 'super_admin']] }
              ]},
              1, 
              0
            ]
          }
        }
      }
    }
  ]);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  return user;
};

const User = mongoose.model('User', userSchema);

export default User;