import Category from '../models/Category.js';
import Movie from '../models/Movie.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const { 
      includeInactive = false, 
      parentId,
      search,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      limit,
      tree = false
    } = req.query;
    
    let query = {};
    
    // Filter by active status
    if (!includeInactive || !req.user?.hasAdminAccess()) {
      query.isActive = true;
    }
    
    // Filter by parent category
    if (parentId) {
      query.parent = parentId === 'null' ? null : parentId;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tree === 'true') {
      // Return category tree structure
      const categoryTree = await Category.getCategoryTree();
      
      res.json({
        success: true,
        data: categoryTree
      });
    } else {
      // Return flat list of categories
      let categoryQuery = Category.find(query).populate('parent', 'name slug');
      
      // Apply sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      categoryQuery = categoryQuery.sort(sort);
      
      // Apply limit
      if (limit) {
        categoryQuery = categoryQuery.limit(parseInt(limit));
      }
      
      const categories = await categoryQuery;
      
      res.json({
        success: true,
        count: categories.length,
        data: categories
      });
    }
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug image color');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get category movies if requested
    if (req.query.includeMovies === 'true') {
      const movies = await Movie.find({
        categories: category._id,
        status: 'published'
      })
      .limit(parseInt(req.query.movieLimit) || 20)
      .select('title thumbnail rating year duration views');
      
      res.json({
        success: true,
        data: {
          ...category.toObject(),
          movies
        }
      });
    } else {
      res.json({
        success: true,
        data: category
      });
    }
  } catch (error) {
    console.error('Get category error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true 
    })
    .populate('parent', 'name slug')
    .populate('children', 'name slug image color');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const category = await Category.create(categoryData);
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has children
    if (category.children && category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that has subcategories. Please delete or move subcategories first.'
      });
    }
    
    // Check if category has movies
    const movieCount = await Movie.countDocuments({ categories: category._id });
    if (movieCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category that contains ${movieCount} movies. Please move or delete movies first.`
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get popular categories
// @route   GET /api/categories/popular
// @access  Public
export const getPopularCategories = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const categories = await Category.getPopularCategories(parseInt(limit));
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update category analytics
// @route   PUT /api/categories/:id/analytics
// @access  Private/Admin
export const updateCategoryAnalytics = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.updateAnalytics();
    
    res.json({
      success: true,
      message: 'Category analytics updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Bulk update categories
// @route   PUT /api/categories/bulk-update
// @access  Private/Admin
export const bulkUpdateCategories = async (req, res) => {
  try {
    const { categoryIds, updates } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category IDs array is required'
      });
    }
    
    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $set: updates }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} categories`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private/Admin
export const reorderCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body; // Array of { id, sortOrder }
    
    if (!categoryOrders || !Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Category orders array is required'
      });
    }
    
    // Update sort orders
    const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
      Category.findByIdAndUpdate(id, { sortOrder })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get movies by category
// @route   GET /api/categories/:id/movies
// @access  Public
export const getMoviesByCategory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const category = await Category.findById(req.params.id);
    if (!category || (!category.isActive && !req.user?.hasAdminAccess())) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const query = {
      categories: category._id,
      status: req.user?.hasAdminAccess() ? { $ne: null } : 'published'
    };
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [movies, total] = await Promise.all([
      Movie.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('categories', 'name slug color')
        .populate('createdBy', 'name email'),
      Movie.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      count: movies.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug
      },
      data: movies
    });
  } catch (error) {
    console.error('Get movies by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movies by category',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};