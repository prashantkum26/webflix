import Movie from '../models/Movie.js';
import Category from '../models/Category.js';
import { uploadMovieFiles, deleteMovieFiles, deleteS3Files, deleteS3File } from '../config/s3.js';

// @desc    Get all movies with advanced filtering
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      status = 'published',
      genre,
      yearFrom,
      yearTo,
      ratingFrom,
      ratingTo,
      durationFrom,
      durationTo,
      contentRating,
      tags,
      featured,
      trending,
      topRated,
      isOriginal,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build advanced filter object
    const filters = {
      status: req.user?.role === 'admin' ? status : 'published', // Only admins can see non-published
      search,
      genre,
      yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
      yearTo: yearTo ? parseInt(yearTo) : undefined,
      ratingFrom: ratingFrom ? parseFloat(ratingFrom) : undefined,
      ratingTo: ratingTo ? parseFloat(ratingTo) : undefined,
      durationFrom: durationFrom ? parseInt(durationFrom) : undefined,
      durationTo: durationTo ? parseInt(durationTo) : undefined,
      contentRating,
      tags: tags ? tags.split(',') : undefined,
      featured: featured === 'true',
      trending: trending === 'true',
      topRated: topRated === 'true',
      isOriginal: isOriginal === 'true'
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Get filtered movies
    let movieQuery = Movie.getByAdvancedFilters(filters);
    
    // Apply sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    movieQuery = movieQuery.sort(sortObj);
    
    // Apply pagination
    const movies = await movieQuery
      .skip(skip)
      .limit(limitNum)
      .populate('categories', 'name slug color')
      .populate('createdBy', 'name email')
      .populate('reviewedBy', 'name email');
    
    // Get total count
    const totalQuery = Movie.getByAdvancedFilters(filters);
    const total = await totalQuery.countDocuments();
    
    res.json({
      success: true,
      count: movies.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      filters: filters,
      data: movies
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ 
      success: false,
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

// @desc    Delete movie with S3 cleanup
// @route   DELETE /api/movies/:id
// @access  Private/Admin
export const deleteMovie = async (req, res) => {
  console.log('🚨 ================== DELETE ROUTE CALLED ==================');
  console.log(`📝 Request Method: ${req.method}`);
  console.log(`📍 Request URL: ${req.originalUrl}`);
  console.log(`🆔 Movie ID from params: ${req.params.id}`);
  console.log(`👤 User: ${req.user ? req.user.name || req.user.email : 'Not authenticated'}`);
  
  try {
    console.log('🔍 Attempting to find movie in database...');
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      console.log('❌ Movie not found in database');
      return res.status(404).json({ 
        success: false,
        message: 'Movie not found' 
      });
    }

    console.log('✅ Movie found in database:');
    console.log(`  - Title: ${movie.title}`);
    console.log(`  - ID: ${movie._id}`);
    console.log(`  - Video URL: ${movie.videoUrl || 'Not set'}`);
    console.log(`  - Thumbnail: ${movie.thumbnail || 'Not set'}`);

    console.log(`🗑️ Starting deletion process for movie: ${movie.title}`);

    // Delete associated S3 files first
    console.log('📂 Calling deleteMovieFiles function...');
    const s3DeleteResult = await deleteMovieFiles(movie);
    
    console.log('📊 S3 delete result received:', s3DeleteResult);
    
    // Always delete from database, even if S3 cleanup fails
    console.log('🗄️ Deleting movie from database...');
    await Movie.findByIdAndDelete(req.params.id);

    console.log(`✅ Movie deleted from database: ${movie.title}`);
    console.log(`📁 S3 cleanup result:`, s3DeleteResult);

    // Prepare response based on S3 cleanup results
    let message = 'Movie deleted successfully';
    const responseData = {
      movieId: movie._id,
      title: movie.title,
      databaseDeleted: true,
      s3FilesDeleted: s3DeleteResult.deletedCount || 0,
      s3Errors: s3DeleteResult.errors || []
    };

    if (s3DeleteResult.errors && s3DeleteResult.errors.length > 0) {
      message += `, but some S3 files may not have been deleted`;
      console.warn('⚠️ S3 cleanup had errors:', s3DeleteResult.errors);
    } else if (s3DeleteResult.deletedCount > 0) {
      message += ` and ${s3DeleteResult.deletedCount} associated files cleaned up from S3`;
    }

    console.log('📤 Sending response to client...');
    console.log('🚨 ================== DELETE ROUTE END ==================');

    res.json({
      success: true,
      message,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Delete movie error:', error);
    console.error('❌ Error stack:', error.stack);
    console.log('🚨 ================== DELETE ROUTE END (ERROR) ==================');
    
    if (error.name === 'CastError') {
      return res.status(404).json({ 
        success: false,
        message: 'Movie not found' 
      });
    }
    res.status(500).json({ 
      success: false,
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

// @desc    Upload movie with files to S3 (Enhanced)
// @route   POST /api/movies/upload
// @access  Private/Admin
export const uploadMovie = async (req, res) => {
  try {
    // Use multer middleware for file uploads
    uploadMovieFiles.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
      { name: 'trailer', maxCount: 1 },
      { name: 'additionalImages', maxCount: 5 }
    ])(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }

      try {
        const movieData = req.body;
        
        // Validate required fields
        if (!movieData.title || !movieData.description || !movieData.genre || !movieData.year || !movieData.duration) {
          return res.status(400).json({
            success: false,
            message: 'Please provide all required fields: title, description, genre, year, duration'
          });
        }

        // Check if required files were uploaded
        if (!req.files || !req.files.video || !req.files.thumbnail) {
          return res.status(400).json({
            success: false,
            message: 'Both video and thumbnail files are required'
          });
        }

        // Process file URLs
        const videoUrl = req.files.video[0].location;
        const thumbnail = req.files.thumbnail[0].location;
        const trailer = req.files.trailer ? req.files.trailer[0].location : null;
        const additionalImages = req.files.additionalImages ? 
          req.files.additionalImages.map(file => file.location) : [];

        // Process cast data with debugging
        let cast = [];
        console.log('🎭 Processing cast data:');
        console.log('  - Type:', typeof movieData.cast);
        console.log('  - Value:', movieData.cast);
        
        if (movieData.cast) {
          try {
            // If it's a string, try to parse as JSON first
            if (typeof movieData.cast === 'string') {
              console.log('  - Attempting JSON parse of string...');
              const parsedCast = JSON.parse(movieData.cast);
              console.log('  - Parsed result:', parsedCast);
              console.log('  - Is array:', Array.isArray(parsedCast));
              
              if (Array.isArray(parsedCast)) {
                // Convert array of strings to array of objects
                cast = parsedCast.map(actor => {
                  if (typeof actor === 'string') {
                    return { name: actor.trim(), character: '', image: '' };
                  } else if (typeof actor === 'object' && actor.name) {
                    return actor;
                  }
                  return { name: String(actor).trim(), character: '', image: '' };
                });
              } else {
                cast = [];
              }
            } else if (Array.isArray(movieData.cast)) {
              console.log('  - Processing existing array...');
              cast = movieData.cast.map(actor => {
                if (typeof actor === 'string') {
                  return { name: actor.trim(), character: '', image: '' };
                } else if (typeof actor === 'object' && actor.name) {
                  return actor;
                }
                return { name: String(actor).trim(), character: '', image: '' };
              });
            } else {
              console.log('  - Invalid cast format, setting to empty array');
              cast = [];
            }
          } catch (error) {
            console.log('  - JSON parsing failed:', error.message);
            // If JSON parsing fails, treat as comma-separated string
            if (typeof movieData.cast === 'string') {
              console.log('  - Treating as comma-separated string...');
              cast = movieData.cast.split(',').map(c => ({ 
                name: c.trim(),
                character: '',
                image: '' 
              }));
            } else {
              cast = [];
            }
          }
        }
        
        console.log('  - Final cast result:', cast);

        const movie = new Movie({
          ...movieData,
          thumbnail,
          videoUrl,
          trailer,
          additionalImages,
          genre: Array.isArray(movieData.genre) ? movieData.genre : [movieData.genre],
          tags: movieData.tags ? 
            (Array.isArray(movieData.tags) ? movieData.tags : movieData.tags.split(',').map(t => t.trim())) 
            : [],
          cast,
          director: Array.isArray(movieData.director) ? movieData.director : 
            (movieData.director ? [movieData.director] : []),
          producer: movieData.producer ? 
            (Array.isArray(movieData.producer) ? movieData.producer : [movieData.producer]) 
            : [],
          writer: movieData.writer ? 
            (Array.isArray(movieData.writer) ? movieData.writer : [movieData.writer]) 
            : [],
          subtitles: movieData.subtitles ? 
            (Array.isArray(movieData.subtitles) ? movieData.subtitles : movieData.subtitles.split(',').map(s => s.trim())) 
            : [],
          createdBy: req.user.id,
          lastModifiedBy: req.user.id,
          status: movieData.publishNow === 'true' ? 'published' : 'draft',
          publishDate: movieData.publishNow === 'true' ? new Date() : null,
          scheduledPublishDate: movieData.scheduledDate ? new Date(movieData.scheduledDate) : null
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

// @desc    Get content analytics
// @route   GET /api/movies/analytics
// @access  Private/Admin
export const getContentAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const analytics = await Movie.getAnalytics({
      dateFrom,
      dateTo
    });
    
    // Get additional metrics
    const [
      topPerforming,
      recentlyAdded,
      genreStats,
      statusDistribution
    ] = await Promise.all([
      Movie.find({ status: 'published' })
        .sort({ engagementScore: -1, views: -1 })
        .limit(10)
        .select('title views likes engagementScore rating'),
      Movie.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt views'),
      Movie.aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$genre' },
        {
          $group: {
            _id: '$genre',
            count: { $sum: 1 },
            totalViews: { $sum: '$views' },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Movie.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: analytics,
        topPerforming,
        recentlyAdded,
        genreStats,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get moderation queue
// @route   GET /api/movies/moderation-queue
// @access  Private/Admin
export const getModerationQueue = async (req, res) => {
  try {
    const movies = await Movie.getModerationQueue();
    
    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching moderation queue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Update movie status (workflow)
// @route   PUT /api/movies/:id/status
// @access  Private/Admin
export const updateMovieStatus = async (req, res) => {
  try {
    const { status, moderationNote, reviewerAction } = req.body;
    const movieId = req.params.id;
    
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Create version before status change
    if (movie.status !== status) {
      movie.createVersion(`Status changed from ${movie.status} to ${status}`, req.user.id);
    }

    // Update status
    movie.status = status;
    movie.reviewedBy = req.user.id;
    movie.reviewDate = new Date();
    movie.lastModifiedBy = req.user.id;

    // Set publish date if publishing
    if (status === 'published' && !movie.publishDate) {
      movie.publishDate = new Date();
    }

    // Add moderation note
    if (moderationNote) {
      movie.moderationNotes.push({
        user: req.user.id,
        note: moderationNote,
        action: reviewerAction || 'comment'
      });
    }

    await movie.save();

    res.json({
      success: true,
      message: `Movie status updated to ${status}`,
      data: movie
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating movie status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Bulk update movies
// @route   PUT /api/movies/bulk-update
// @access  Private/Admin
export const bulkUpdateMovies = async (req, res) => {
  try {
    const { movieIds, updates } = req.body;
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movie IDs array is required'
      });
    }

    // Add lastModifiedBy to updates
    updates.lastModifiedBy = req.user.id;

    const result = await Movie.updateMany(
      { _id: { $in: movieIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} movies`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk update',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get movie versions
// @route   GET /api/movies/:id/versions
// @access  Private/Admin
export const getMovieVersions = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('previousVersions.modifiedBy', 'name email')
      .select('version previousVersions title');
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    res.json({
      success: true,
      data: {
        currentVersion: movie.version,
        title: movie.title,
        versions: movie.previousVersions
      }
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching movie versions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Rollback to previous version
// @route   PUT /api/movies/:id/rollback/:version
// @access  Private/Admin
export const rollbackMovieVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const { reason } = req.body;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    movie.rollbackToVersion(parseInt(version), req.user.id);
    await movie.save();

    res.json({
      success: true,
      message: `Movie rolled back to version ${version}`,
      data: movie
    });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error rolling back movie version',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get scheduled content
// @route   GET /api/movies/scheduled
// @access  Private/Admin
export const getScheduledContent = async (req, res) => {
  try {
    const scheduledMovies = await Movie.getScheduledContent();
    
    res.json({
      success: true,
      count: scheduledMovies.length,
      data: scheduledMovies
    });
  } catch (error) {
    console.error('Get scheduled content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduled content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Process scheduled publishing
// @route   POST /api/movies/process-scheduled
// @access  Private/Admin
export const processScheduledPublishing = async (req, res) => {
  try {
    const scheduledMovies = await Movie.getScheduledContent();
    
    const publishedMovies = [];
    for (const movie of scheduledMovies) {
      movie.status = 'published';
      movie.publishDate = new Date();
      movie.scheduledPublishDate = null;
      await movie.save();
      publishedMovies.push(movie);
    }

    res.json({
      success: true,
      message: `Published ${publishedMovies.length} scheduled movies`,
      data: publishedMovies
    });
  } catch (error) {
    console.error('Process scheduled publishing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing scheduled publishing',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get trending content
// @route   GET /api/movies/trending
// @access  Public
export const getTrendingMovies = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const trendingMovies = await Movie.getTrending(parseInt(limit));
    
    res.json({
      success: true,
      count: trendingMovies.length,
      data: trendingMovies
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending movies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Bulk delete movies with S3 cleanup
// @route   DELETE /api/movies/bulk-delete
// @access  Private/Admin
export const bulkDeleteMovies = async (req, res) => {
  try {
    const { movieIds } = req.body;
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Movie IDs array is required'
      });
    }

    console.log(`🗑️ Bulk deleting ${movieIds.length} movies with S3 cleanup`);

    // Fetch all movies to get their file URLs before deletion
    const moviesToDelete = await Movie.find({ _id: { $in: movieIds } });
    
    if (moviesToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No movies found to delete'
      });
    }

    // Collect all S3 file URLs from all movies
    const allFileUrls = [];
    const movieTitles = [];
    
    for (const movie of moviesToDelete) {
      movieTitles.push(movie.title);
      
      // Collect file URLs
      if (movie.videoUrl) allFileUrls.push(movie.videoUrl);
      if (movie.thumbnail) allFileUrls.push(movie.thumbnail);
      if (movie.trailer) allFileUrls.push(movie.trailer);
      
      if (movie.additionalImages && Array.isArray(movie.additionalImages)) {
        allFileUrls.push(...movie.additionalImages);
      }
      
      if (movie.seo?.ogImage) allFileUrls.push(movie.seo.ogImage);
      
      if (movie.cast && Array.isArray(movie.cast)) {
        movie.cast.forEach(castMember => {
          if (castMember.image) allFileUrls.push(castMember.image);
        });
      }
    }

    // Delete all S3 files
    let s3DeleteResult = { deletedCount: 0, errors: [] };
    if (allFileUrls.length > 0) {
      console.log(`📁 Deleting ${allFileUrls.length} S3 files for ${moviesToDelete.length} movies`);
      s3DeleteResult = await deleteS3Files(allFileUrls);
    }

    // Delete movies from database
    const dbDeleteResult = await Movie.deleteMany({ _id: { $in: movieIds } });

    console.log(`✅ Bulk delete completed: ${dbDeleteResult.deletedCount} movies deleted`);
    console.log(`📁 S3 cleanup result: ${s3DeleteResult.deletedCount} files deleted`);

    res.json({
      success: true,
      message: `Successfully deleted ${dbDeleteResult.deletedCount} movies and ${s3DeleteResult.deletedCount} associated files`,
      data: {
        moviesDeleted: dbDeleteResult.deletedCount,
        movieTitles: movieTitles.slice(0, 10), // Show first 10 titles to avoid huge response
        s3FilesDeleted: s3DeleteResult.deletedCount,
        s3Errors: s3DeleteResult.errors,
        totalFilesProcessed: allFileUrls.length
      }
    });
  } catch (error) {
    console.error('Bulk delete movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing bulk delete operation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Test S3 deletion functionality (Debug endpoint)
// @route   POST /api/movies/test-s3-delete
// @access  Private/Admin
export const testS3Delete = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required for testing'
      });
    }

    console.log('🧪 Testing S3 deletion for URL:', fileUrl);

    // Test the deletion function
    const result = await deleteS3File(fileUrl);

    res.json({
      success: true,
      message: 'S3 deletion test completed',
      data: {
        fileUrl,
        testResult: result,
        s3Config: {
          bucket: process.env.AWS_S3_BUCKET || 'Not configured',
          region: process.env.AWS_REGION || 'us-east-1',
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        }
      }
    });
  } catch (error) {
    console.error('S3 delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing S3 deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
