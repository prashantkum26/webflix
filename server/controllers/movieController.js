import Movie from '../models/Movie.js';
import { uploadMovieFiles } from '../config/s3.js';

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { cast: { $in: [new RegExp(search, 'i')] } },
          { director: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Category filter
    if (category) {
      switch (category.toLowerCase()) {
        case 'featured':
          query.featured = true;
          break;
        case 'trending':
          query.trending = true;
          break;
        case 'toprated':
          query.topRated = true;
          break;
        default:
          // Check if it's a genre
          const validGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Crime'];
          if (validGenres.includes(category)) {
            query.genre = { $in: [category] };
          }
      }
    }
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Movie.countDocuments(query);
    
    res.json({
      success: true,
      count: movies.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: movies
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ 
      message: 'Server error fetching movies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get single movie
// @route   GET /api/movies/:id
// @access  Public
export const getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    // Increment view count
    movie.views += 1;
    await movie.save();
    
    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    console.error('Get movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error fetching movie',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Create new movie
// @route   POST /api/movies
// @access  Private/Admin
export const createMovie = async (req, res) => {
  try {
    const {
      title,
      description,
      thumbnail,
      videoUrl,
      genre,
      rating,
      year,
      duration,
      cast,
      director,
      featured,
      trending,
      topRated
    } = req.body;

    // Validation
    if (!title || !description || !thumbnail || !videoUrl || !genre || !year || !duration) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const movie = await Movie.create({
      title,
      description,
      thumbnail,
      videoUrl,
      genre,
      rating: rating || 0,
      year,
      duration,
      cast: cast || [],
      director: director || '',
      featured: featured || false,
      trending: trending || false,
      topRated: topRated || false
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie
    });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({ 
      message: 'Server error creating movie',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
export const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: movie
    });
  } catch (error) {
    console.error('Update movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error updating movie',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.status(500).json({ 
      message: 'Server error deleting movie',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get movies by category for homepage
// @route   GET /api/movies/categories
// @access  Public
export const getMovieCategories = async (req, res) => {
  try {
    const [featured, trending, topRated, action, comedy, drama] = await Promise.all([
      Movie.find({ featured: true }).limit(10),
      Movie.find({ trending: true }).limit(10),
      Movie.find({ topRated: true }).limit(10),
      Movie.find({ genre: { $in: ['Action'] } }).limit(10),
      Movie.find({ genre: { $in: ['Comedy'] } }).limit(10),
      Movie.find({ genre: { $in: ['Drama'] } }).limit(10)
    ]);

    res.json({
      success: true,
      data: {
        featured,
        trending,
        topRated,
        action,
        comedy,
        drama
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: 'Server error fetching movie categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Upload movie with files to S3
// @route   POST /api/movies/upload
// @access  Private/Admin
export const uploadMovie = async (req, res) => {
  try {
    // Use multer middleware for file uploads
    uploadMovieFiles.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ])(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }

      try {
        const {
          title,
          description,
          genre,
          rating,
          year,
          duration,
          cast,
          director,
          featured,
          trending,
          topRated
        } = req.body;

        // Validate required fields
        if (!title || !description || !genre || !year || !duration) {
          return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: title, description, genre, year, duration'
          });
        }

        // Check if files were uploaded
        if (!req.files || !req.files.video || !req.files.thumbnail) {
          return res.status(400).json({
            success: false,
            message: 'Both video and thumbnail files are required'
          });
        }

        const videoUrl = req.files.video[0].location;
        const thumbnail = req.files.thumbnail[0].location;

        const movie = new Movie({
          title,
          description,
          thumbnail,
          videoUrl,
          genre: Array.isArray(genre) ? genre : [genre],
          rating: rating || 0,
          year: parseInt(year),
          duration: parseInt(duration),
          cast: Array.isArray(cast) ? cast : (cast ? cast.split(',').map(c => c.trim()) : []),
          director: director || '',
          featured: featured === 'true',
          trending: trending === 'true',
          topRated: topRated === 'true'
        });

        const savedMovie = await movie.save();

        res.status(201).json({
          success: true,
          message: 'Movie uploaded successfully',
          data: savedMovie
        });
      } catch (error) {
        console.error('Error creating movie:', error);
        res.status(500).json({
          success: false,
          message: 'Server error while creating movie',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    });
  } catch (error) {
    console.error('Error uploading movie:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading movie',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
