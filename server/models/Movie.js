import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  synopsis: {
    type: String,
    maxlength: [500, 'Synopsis cannot exceed 500 characters']
  },
  
  // Media Files
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  trailer: {
    type: String // Trailer video URL
  },
  additionalImages: [{
    type: String // Additional promotional images
  }],
  
  // Content Classification
  genre: {
    type: [String],
    required: [true, 'At least one genre is required'],
    enum: ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Biography', 'History', 'Music', 'War', 'Western']
  },
  tags: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Ratings and Metrics
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [10, 'Rating cannot be more than 10'],
    default: 0
  },
  imdbRating: {
    type: Number,
    min: [0, 'IMDB Rating cannot be less than 0'],
    max: [10, 'IMDB Rating cannot be more than 10']
  },
  rottenTomatoesRating: {
    type: Number,
    min: [0, 'Rotten Tomatoes rating cannot be less than 0'],
    max: [100, 'Rotten Tomatoes rating cannot be more than 100']
  },
  
  // Production Details
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year cannot be less than 1900'],
    max: [new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  cast: [{
    name: String,
    character: String,
    image: String
  }],
  director: [{
    type: String,
    trim: true
  }],
  producer: [{
    type: String,
    trim: true
  }],
  writer: [{
    type: String,
    trim: true
  }],
  studio: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    trim: true,
    default: 'English'
  },
  subtitles: [{
    type: String // Available subtitle languages
  }],
  
  // Content Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'published', 'archived', 'rejected'],
    default: 'draft'
  },
  publishDate: {
    type: Date
  },
  scheduledPublishDate: {
    type: Date
  },
  
  // Content Flags
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  topRated: {
    type: Boolean,
    default: false
  },
  isOriginal: {
    type: Boolean,
    default: false
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  
  // Content Ratings
  contentRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'],
    default: 'NR'
  },
  contentWarnings: [{
    type: String,
    enum: ['violence', 'language', 'sexual_content', 'drug_use', 'smoking', 'drinking']
  }],
  
  // Analytics & Performance
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  watchTime: {
    total: { type: Number, default: 0 }, // Total minutes watched
    average: { type: Number, default: 0 }, // Average watch time per user
    completionRate: { type: Number, default: 0 } // Percentage who watch till end
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  
  // SEO & Metadata
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String,
    ogImage: String,
    structuredData: mongoose.Schema.Types.Mixed
  },
  
  // File Information
  fileInfo: {
    size: Number, // in bytes
    format: String,
    resolution: String,
    bitrate: String,
    codec: String,
    quality: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '1440p', '2160p'],
      default: '1080p'
    }
  },
  
  // Moderation & Review
  moderationNotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'needs_revision', 'comment']
    }
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    changeReason: String
  }],
  
  // User Relations
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Advanced Indexes for search functionality
movieSchema.index({ title: 'text', description: 'text', synopsis: 'text', tags: 'text' });
movieSchema.index({ status: 1, publishDate: -1 });
movieSchema.index({ genre: 1, rating: -1 });
movieSchema.index({ views: -1, createdAt: -1 });
movieSchema.index({ engagementScore: -1 });
movieSchema.index({ scheduledPublishDate: 1 });

// Virtual for engagement rate
movieSchema.virtual('engagementRate').get(function() {
  const totalInteractions = this.likes + this.dislikes;
  if (totalInteractions === 0) return 0;
  return (this.likes / totalInteractions) * 100;
});

// Virtual for average rating
movieSchema.virtual('averageRating').get(function() {
  const ratings = [this.rating, this.imdbRating, this.rottenTomatoesRating].filter(r => r > 0);
  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Pre-save middleware to update engagement score
movieSchema.pre('save', function(next) {
  if (this.views > 0) {
    const completionScore = this.watchTime.completionRate * 0.4;
    const interactionScore = (this.likes / (this.views + 1)) * 0.3;
    const ratingScore = (this.rating / 10) * 0.3;
    this.engagementScore = completionScore + interactionScore + ratingScore;
  }
  next();
});

// Instance method to create a new version
movieSchema.methods.createVersion = function(changeReason, modifiedBy) {
  const versionData = this.toObject();
  delete versionData._id;
  delete versionData.version;
  delete versionData.previousVersions;
  
  this.previousVersions.push({
    version: this.version,
    data: versionData,
    modifiedBy,
    changeReason,
    modifiedAt: new Date()
  });
  
  this.version += 1;
  this.lastModifiedBy = modifiedBy;
};

// Instance method to rollback to previous version
movieSchema.methods.rollbackToVersion = function(versionNumber, modifiedBy) {
  const targetVersion = this.previousVersions.find(v => v.version === versionNumber);
  if (!targetVersion) {
    throw new Error('Version not found');
  }
  
  // Create current version backup
  this.createVersion('Rollback operation', modifiedBy);
  
  // Apply target version data
  Object.assign(this, targetVersion.data);
  this.version = versionNumber;
  this.lastModifiedBy = modifiedBy;
};

// Static method to get movies by advanced filters
movieSchema.statics.getByAdvancedFilters = function(filters) {
  const query = {};
  
  // Status filter
  if (filters.status) {
    query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
  }
  
  // Genre filter
  if (filters.genre && filters.genre !== 'all') {
    query.genre = { $in: Array.isArray(filters.genre) ? filters.genre : [filters.genre] };
  }
  
  // Year range filter
  if (filters.yearFrom || filters.yearTo) {
    query.year = {};
    if (filters.yearFrom) query.year.$gte = filters.yearFrom;
    if (filters.yearTo) query.year.$lte = filters.yearTo;
  }
  
  // Rating range filter
  if (filters.ratingFrom || filters.ratingTo) {
    query.rating = {};
    if (filters.ratingFrom) query.rating.$gte = filters.ratingFrom;
    if (filters.ratingTo) query.rating.$lte = filters.ratingTo;
  }
  
  // Duration range filter
  if (filters.durationFrom || filters.durationTo) {
    query.duration = {};
    if (filters.durationFrom) query.duration.$gte = filters.durationFrom;
    if (filters.durationTo) query.duration.$lte = filters.durationTo;
  }
  
  // Content rating filter
  if (filters.contentRating) {
    query.contentRating = Array.isArray(filters.contentRating) 
      ? { $in: filters.contentRating } 
      : filters.contentRating;
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  // Featured content filter
  if (filters.featured === true) query.featured = true;
  if (filters.trending === true) query.trending = true;
  if (filters.topRated === true) query.topRated = true;
  if (filters.isOriginal === true) query.isOriginal = true;
  
  // Search across multiple fields
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { synopsis: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } },
      { 'cast.name': { $regex: filters.search, $options: 'i' } },
      { director: { $in: [new RegExp(filters.search, 'i')] } },
      { studio: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query);
};

// Static method to get content analytics
movieSchema.statics.getAnalytics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.dateFrom) {
    matchStage.createdAt = { $gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(filters.dateTo) };
  }
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalMovies: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likes' },
        totalDislikes: { $sum: '$dislikes' },
        avgRating: { $avg: '$rating' },
        avgEngagement: { $avg: '$engagementScore' },
        publishedMovies: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draftMovies: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        pendingMovies: {
          $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return analytics[0] || {};
};

// Static method to get trending content
movieSchema.statics.getTrending = function(limit = 20) {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return this.find({
    status: 'published',
    publishDate: { $gte: threeDaysAgo }
  })
  .sort({ engagementScore: -1, views: -1 })
  .limit(limit);
};

// Static method to get scheduled content
movieSchema.statics.getScheduledContent = function() {
  return this.find({
    status: 'approved',
    scheduledPublishDate: { $lte: new Date() }
  }).sort({ scheduledPublishDate: 1 });
};

// Static method for content moderation queue
movieSchema.statics.getModerationQueue = function() {
  return this.find({
    status: { $in: ['pending_review', 'needs_revision'] }
  })
  .populate('createdBy', 'name email')
  .populate('reviewedBy', 'name email')
  .sort({ createdAt: 1 });
};

// Static method to get movies by category (enhanced)
movieSchema.statics.getByCategory = function(category) {
  const filter = { status: 'published' };
  
  switch (category) {
    case 'featured':
      filter.featured = true;
      break;
    case 'trending':
      filter.trending = true;
      break;
    case 'toprated':
      filter.topRated = true;
      break;
    case 'originals':
      filter.isOriginal = true;
      break;
    case 'exclusives':
      filter.isExclusive = true;
      break;
    default:
      if (this.schema.paths.genre.enumValues.includes(category)) {
        filter.genre = { $in: [category] };
      }
  }
  
  return this.find(filter).sort({ createdAt: -1 });
};

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;