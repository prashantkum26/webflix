import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  genre: {
    type: [String],
    required: [true, 'At least one genre is required'],
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Crime']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [10, 'Rating cannot be more than 10'],
    default: 0
  },
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
    type: String,
    trim: true
  }],
  director: {
    type: String,
    trim: true
  },
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
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
movieSchema.index({ title: 'text', description: 'text', cast: 'text' });

// Static method to get movies by category
movieSchema.statics.getByCategory = function(category) {
  const filter = {};
  
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
    default:
      if (this.schema.paths.genre.enumValues.includes(category)) {
        filter.genre = { $in: [category] };
      }
  }
  
  return this.find(filter).sort({ createdAt: -1 });
};

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;