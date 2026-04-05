import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import type { Movie } from '../types';

const MyList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date_added' | 'title' | 'year' | 'rating'>('date_added');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyList();
  }, []);

  const fetchMyList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getMyList();
      setMovies(response || []);
    } catch (err: any) {
      console.error('Error fetching my list:', err);
      setError(err.response?.data?.message || 'Failed to load your list');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (movieId: string) => {
    try {
      const result = await userAPI.toggleMyList(movieId);
      setMovies(result.data);
    } catch (err) {
      console.error('Error removing from list:', err);
    }
  };

  const handleWatchMovie = (movieId: string) => {
    navigate(`/watch/${movieId}`);
  };

  // Get unique genres for filter
  const genres = Array.from(new Set(movies.flatMap(movie => movie.genre)));

  // Filter and sort movies
  const filteredAndSortedMovies = movies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = filterGenre === 'all' || movie.genre.includes(filterGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return b.year - a.year;
        case 'rating':
          return b.rating - a.rating;
        case 'date_added':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black pt-20">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My List</h1>
          <p className="text-gray-400">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'} saved for later
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={fetchMyList}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {movies.length > 0 && (
          <>
            {/* Controls */}
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search your list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Genre Filter */}
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                >
                  <option value="all">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                >
                  <option value="date_added">Date Added</option>
                  <option value="title">Title</option>
                  <option value="year">Year</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Movies Grid */}
            {filteredAndSortedMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredAndSortedMovies.map((movie) => (
                  <div 
                    key={movie._id}
                    className="relative group cursor-pointer transform hover:scale-105 transition-all duration-300"
                  >
                    {/* Movie Poster */}
                    <div className="relative">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-full h-64 md:h-72 object-cover rounded-lg"
                        onClick={() => handleWatchMovie(movie._id)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                        }}
                      />
                      
                      {/* Remove Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromList(movie._id);
                        }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from My List"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <button
                          onClick={() => handleWatchMovie(movie._id)}
                          className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                        >
                          <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="mt-3">
                      <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{movie.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{movie.year}</span>
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span>{movie.rating}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{movie.genre.slice(0, 2).join(', ')}</span>
                        <span>{movie.duration}min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No movies found</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || filterGenre !== 'all' 
                    ? 'Try adjusting your search or filters.' 
                    : 'No movies match your criteria.'
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterGenre('all');
                  }}
                  className="text-netflix-red hover:text-red-400 text-sm underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {movies.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Your list is empty</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Start adding movies to your list to watch them later. Click the heart icon on any movie to add it here.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/')}
                className="bg-netflix-red hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Movies
              </button>
              <div className="text-sm text-gray-500">
                <p>💡 Tip: You can add movies to your list from the home page, search results, or movie details page.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyList;