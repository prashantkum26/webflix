import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieAPI } from '../services/api';
import type { Movie } from '../types';
import MovieModal from '../components/MovieModal';
import NetflixHoverPreview from '../components/NetflixHoverPreview';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<{
    featured: Movie[];
    trending: Movie[];
    topRated: Movie[];
    action: Movie[];
    comedy: Movie[];
    drama: Movie[];
  }>({
    featured: [],
    trending: [],
    topRated: [],
    action: [],
    comedy: [],
    drama: []
  });
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hoverMovie, setHoverMovie] = useState<Movie | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const hoverTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
  const fetchMovies = async () => {
    try {
      setLoading(true);
      // Fetch categorized movies
      const categories = await movieAPI.getCategories();
      setMovies(categories);
      
      // Also fetch all movies as fallback
      const allMoviesResponse = await movieAPI.getMovies();
      setAllMovies(allMoviesResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching movies:', error);
      // If categories fail, try to get all movies
      try {
        const allMoviesResponse = await movieAPI.getMovies();
        setAllMovies(allMoviesResponse.data || []);
      } catch (err) {
        console.error('Error fetching all movies:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchMovies();
}, []);

const handleMovieClick = (movie: Movie) => {
  // Direct play on click
  navigate(`/watch/${movie._id}`);
};

const handleInfoClick = (e: React.MouseEvent, movie: Movie) => {
  e.stopPropagation();
  setSelectedMovie(movie);
  setShowModal(true);
};

const handleCloseModal = () => {
  setShowModal(false);
  setSelectedMovie(null);
};

const handleMouseEnter = (movie: Movie, event: React.MouseEvent) => {
  const targetElement = event.currentTarget;
  
  // Clear any existing timer
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
  }
  
  // Set 500ms timer for preview modal
  hoverTimerRef.current = window.setTimeout(() => {
    // Calculate position right before showing modal to ensure accuracy
    const rect = targetElement.getBoundingClientRect();
    
    // Center the modal on the thumbnail
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Set position and show modal simultaneously
    setHoverPosition({ x, y });
    setHoverMovie(movie);
    setShowPreviewModal(true);
  }, 500);
};

const handleMouseLeave = () => {
  // Clear timer
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }
  
  // Add small delay before closing to allow mouse movement to modal
  hoverTimerRef.current = window.setTimeout(() => {
    setHoverMovie(null);
    setShowPreviewModal(false);
  }, 200);
};

const handleModalMouseEnter = () => {
  // Keep modal open when hovering over the modal itself
  // Clear any pending close timer
  if (hoverTimerRef.current) {
    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }
};

const handleModalMouseLeave = () => {
  // Close modal when leaving the modal area
  setHoverMovie(null);
  setShowPreviewModal(false);
};

  const renderMovieCards = (movieList: Movie[]) => {
    if (loading) {
      // Show 6 skeleton cards while loading
      return Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-gray-800 aspect-video rounded-lg animate-pulse"></div>
      ));
    }

    if (movieList.length === 0) {
      // Show empty state when no movies
      return (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400">No movies available in this category</p>
        </div>
      );
    }

    // Show only the actual movies, no repeating
    return movieList.map((movie) => (
      <div 
        key={movie._id} 
        className="movie-card group"
        onClick={() => handleMovieClick(movie)}
        onMouseEnter={(e) => handleMouseEnter(movie, e)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={movie.thumbnail || `https://via.placeholder.com/300x400/374151/e50914?text=${encodeURIComponent(movie.title || 'Movie')}`}
            alt={movie.title || 'Movie'}
            className="w-full aspect-video object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x400/374151/e50914?text=${encodeURIComponent(movie.title || 'Movie')}`;
            }}
          />
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-netflix-black pt-20">
      {/* Hero Banner */}
      <div className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex items-center h-full px-4 md:px-16">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-shadow">
              Welcome to WebFlix
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-6 text-shadow">
              Unlimited movies, TV shows and more. Watch anywhere. Cancel anytime.
            </p>
            <div className="flex space-x-4">
              <button className="play-button flex items-center space-x-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </button>
              <button className="info-button flex items-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>More Info</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 px-4 md:px-16 space-y-8">
        {/* Featured Movies */}
        <div className="bg-netflix-black/80 p-8 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Featured Movies</h2>
            {!loading && allMovies.length === 0 && (
              <a 
                href="/admin/upload" 
                className="bg-netflix-red text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
              >
                Upload First Movie
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderMovieCards(movies.featured.length > 0 ? movies.featured : allMovies)}
          </div>
        </div>

        {/* Trending Now */}
        <div className="bg-netflix-black/80 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderMovieCards(movies.trending.length > 0 ? movies.trending : allMovies)}
          </div>
        </div>

        {/* Top Rated */}
        <div className="bg-netflix-black/80 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-white mb-4">Top Rated</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {renderMovieCards(movies.topRated.length > 0 ? movies.topRated : allMovies)}
          </div>
        </div>

        {/* Show message if no movies at all */}
        {!loading && allMovies.length === 0 && Object.values(movies).every(arr => arr.length === 0) && (
          <div className="bg-netflix-black/80 p-12 rounded-lg text-center">
            <h3 className="text-xl font-bold text-white mb-4">No Movies Available</h3>
            <p className="text-gray-400 mb-6">Get started by uploading your first movie!</p>
            <a 
              href="/admin/upload" 
              className="bg-netflix-red text-white px-6 py-3 rounded-md font-medium hover:bg-red-600 transition-colors inline-block"
            >
              Upload Movie
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-netflix-black text-gray-400 py-16 px-4 md:px-16 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">WebFlix</h3>
              <p className="text-sm">
                Your ultimate destination for streaming entertainment.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Home</a></li>
                <li><a href="#" className="hover:text-white">Movies</a></li>
                <li><a href="#" className="hover:text-white">TV Shows</a></li>
                <li><a href="#" className="hover:text-white">My List</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 WebFlix. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={showModal}
          onClose={handleCloseModal}
        />
      )}

      {/* Netflix Hover Preview Modal */}
      {hoverMovie && (
        <NetflixHoverPreview
          movie={hoverMovie}
          position={hoverPosition}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
          onPlay={(e) => {
            e.stopPropagation();
            navigate(`/watch/${hoverMovie._id}`);
            setHoverMovie(null);
          }}
          onMoreInfo={(e) => {
            e.stopPropagation();
            handleInfoClick(e, hoverMovie);
            setHoverMovie(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;
