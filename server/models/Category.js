import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  image: {
    type: String // Category thumbnail/banner image
  },
  color: {
    type: String, // Hex color for category theming
    default: '#808080'
  },
  icon: {
    type: String // Icon class or URL for category
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  analytics: {
    movieCount: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    avgRating: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent: 1, sortOrder: 1 });

// Generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Update parent's children array
categorySchema.post('save', async function() {
  if (this.parent) {
    await this.constructor.findByIdAndUpdate(
      this.parent,
      { $addToSet: { children: this._id } }
    );
  }
});

// Virtual for full path
categorySchema.virtual('fullPath').get(function() {
  // This would need to be populated with parent data to work properly
  return this.name;
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .populate('children')
    .sort({ parent: 1, sortOrder: 1 });
  
  const categoryMap = new Map();
  const rootCategories = [];
  
  // First pass: create category map
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      ...cat.toObject(),
      children: []
    });
  });
  
  // Second pass: build tree
  categories.forEach(cat => {
    if (cat.parent) {
      const parent = categoryMap.get(cat.parent.toString());
      if (parent) {
        parent.children.push(categoryMap.get(cat._id.toString()));
      }
    } else {
      rootCategories.push(categoryMap.get(cat._id.toString()));
    }
  });
  
  return rootCategories;
};

// Static method to get popular categories
categorySchema.statics.getPopularCategories = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ 'analytics.totalViews': -1, 'analytics.movieCount': -1 })
    .limit(limit);
};

// Instance method to update analytics
categorySchema.methods.updateAnalytics = async function() {
  const Movie = mongoose.model('Movie');
  
  const analytics = await Movie.aggregate([
    { $match: { categories: this._id, status: 'published' } },
    {
      $group: {
        _id: null,
        movieCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  
  if (analytics[0]) {
    this.analytics = analytics[0];
    await this.save();
  }
};

const Category = mongoose.model('Category', categorySchema);

export default Category;