import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie is required'],
    index: true
  },
  
  // Viewing session details
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  watchTime: {
    type: Number,
    required: true,
    min: [0, 'Watch time cannot be negative']
  },
  totalDuration: {
    type: Number,
    required: true,
    min: [1, 'Total duration must be at least 1 second']
  },
  
  // Progress tracking
  watchPercentage: {
    type: Number,
    min: [0, 'Watch percentage cannot be negative'],
    max: [100, 'Watch percentage cannot exceed 100%']
  },
  completed: {
    type: Boolean,
    default: false
  },
  
  // User interaction data
  pauseCount: {
    type: Number,
    default: 0,
    min: [0, 'Pause count cannot be negative']
  },
  seekCount: {
    type: Number,
    default: 0,
    min: [0, 'Seek count cannot be negative']
  },
  volumeChanges: {
    type: Number,
    default: 0,
    min: [0, 'Volume changes cannot be negative']
  },
  
  // Quality and settings
  videoQuality: {
    type: String,
    enum: ['480p', '720p', '1080p', '4K', 'auto'],
    default: 'auto'
  },
  audioLanguage: {
    type: String,
    default: 'en'
  },
  subtitleLanguage: {
    type: String,
    default: null
  },
  
  // Device and platform info
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'tv', 'unknown'],
    default: 'unknown'
  },
  platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'smart_tv', 'unknown'],
    default: 'web'
  },
  userAgent: {
    type: String,
    default: ''
  },
  
  // Geographic data (optional)
  country: {
    type: String,
    default: null
  },
  region: {
    type: String,
    default: null
  },
  
  // Session metadata
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  
  // Engagement metrics
  engagement: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  rating: {
    type: Number,
    min: [1, 'Rating cannot be less than 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
watchHistorySchema.index({ user: 1, movie: 1 });
watchHistorySchema.index({ user: 1, createdAt: -1 });
watchHistorySchema.index({ movie: 1, createdAt: -1 });
watchHistorySchema.index({ createdAt: -1 });

// Calculate watch percentage before saving
watchHistorySchema.pre('save', function(next) {
  if (this.watchTime && this.totalDuration) {
    this.watchPercentage = Math.min((this.watchTime / this.totalDuration) * 100, 100);
    this.completed = this.watchPercentage >= 90; // Consider 90% as completed
  }
  
  // Calculate engagement based on watch percentage and interactions
  if (this.watchPercentage >= 80) {
    this.engagement = 'high';
  } else if (this.watchPercentage >= 30) {
    this.engagement = 'medium';
  } else {
    this.engagement = 'low';
  }
  
  next();
});

// Static methods for analytics
watchHistorySchema.statics.getUserWatchStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalWatchTime: { $sum: '$watchTime' },
        totalSessions: { $sum: 1 },
        avgWatchPercentage: { $avg: '$watchPercentage' },
        completedMovies: {
          $sum: { $cond: ['$completed', 1, 0] }
        }
      }
    }
  ]);
};

watchHistorySchema.statics.getMovieStats = function(movieId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        movie: new mongoose.Types.ObjectId(movieId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: 1 },
        uniqueViewers: { $addToSet: '$user' },
        avgWatchPercentage: { $avg: '$watchPercentage' },
        totalWatchTime: { $sum: '$watchTime' },
        completionRate: {
          $avg: { $cond: ['$completed', 1, 0] }
        }
      }
    },
    {
      $addFields: {
        uniqueViewers: { $size: '$uniqueViewers' }
      }
    }
  ]);
};

watchHistorySchema.statics.getTrendingMovies = function(days = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$movie',
        views: { $sum: 1 },
        uniqueViewers: { $addToSet: '$user' },
        avgWatchPercentage: { $avg: '$watchPercentage' },
        totalWatchTime: { $sum: '$watchTime' }
      }
    },
    {
      $addFields: {
        uniqueViewers: { $size: '$uniqueViewers' },
        trendingScore: {
          $add: [
            { $multiply: ['$views', 0.4] },
            { $multiply: ['$uniqueViewers', 0.4] },
            { $multiply: ['$avgWatchPercentage', 0.2] }
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: '_id',
        as: 'movie'
      }
    },
    {
      $unwind: '$movie'
    }
  ]);
};

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

export default WatchHistory;