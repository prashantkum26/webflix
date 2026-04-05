import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { adminAPI } from '../../services/api';
import type { Movie } from '../../types';

interface ContentMovie extends Movie {
  status: 'published' | 'draft' | 'archived';
  uploadDate: string;
  fileSize?: number;
}

const ContentManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [movies, setMovies] = useState<ContentMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');

  const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];
  const years = Array.from({ length: 30 }, (_, i) => 2024 - i);

  useEffect(() => {
    fetchMovies();
  }, [currentPage, searchTerm, genreFilter, statusFilter, yearFilter]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getMovies({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        genre: genreFilter !== 'all' ? genreFilter : undefined,
        year: yearFilter !== 'all' ? yearFilter : undefined,
      });
      
      // Mock some additional properties for content management
      const moviesWithStatus = (response.data.movies || []).map((movie: Movie) => ({
        ...movie,
        status: Math.random() > 0.8 ? 'draft' : Math.random() > 0.1 ? 'published' : 'archived',
        uploadDate: new Date(movie.createdAt).toISOString(),
        fileSize: Math.floor(Math.random() * 5000000000), // Random file size
      }));
      
      setMovies(moviesWithStatus);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      setError(err.response?.data?.message || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleMovieUpdate = async (movieId: string, updates: Partial<ContentMovie>) => {
    try {
      await adminAPI.updateMovie(movieId, updates);
      fetchMovies(); // Refresh list
    } catch (err: any) {
      console.error('Error updating movie:', err);
      setError(err.response?.data?.message || 'Failed to update movie');
    }
  };

  const handleMovieDelete = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminAPI.deleteMovie(movieId);
      fetchMovies(); // Refresh list
    } catch (err: any) {
      console.error('Error deleting movie:', err);
      setError(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  const handleBulkAction = async () => {
    if (!selectedMovies.length || !bulkAction) return;
    
    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedMovies.length} selected movies?`)) {
      return;
    }
    
    try {
      switch (bulkAction) {
        case 'publish':
          await adminAPI.bulkUpdateMovies(selectedMovies, { status: 'published' });
          break;
        case 'draft':
          await adminAPI.bulkUpdateMovies(selectedMovies, { status: 'draft' });
          break;
        case 'archive':
          await adminAPI.bulkUpdateMovies(selectedMovies, { status: 'archived' });
          break;
        case 'feature':
          await adminAPI.bulkUpdateMovies(selectedMovies, { featured: true });
          break;
        case 'unfeature':
          await adminAPI.bulkUpdateMovies(selectedMovies, { featured: false });
          break;
        case 'delete':
          await adminAPI.bulkDeleteMovies(selectedMovies);
          break;
      }
      
      setSelectedMovies([]);
      setBulkAction('');
      fetchMovies();
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
      setError(err.response?.data?.message || 'Failed to perform bulk action');
    }
  };

  const toggleMovieSelection = (movieId: string) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedMovies(
      selectedMovies.length === movies.length 
        ? [] 
        : movies.map(movie => movie._id)
    );
  };

  const formatFileSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-600';
      case 'draft': return 'bg-yellow-600';
      case 'archived': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black">
      <AdminNav />
      
      <main className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Content Management</h1>
              <p className="text-gray-400">
                Manage your movie library and content
              </p>
            </div>
            
            <button
              onClick={() => navigate('/admin/upload')}
              className="bg-netflix-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upload New Movie
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
              <button 
                onClick={fetchMovies}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="all">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSearchTerm('');
                  setGenreFilter('all');
                  setStatusFilter('all');
                  setYearFilter('all');
                  setCurrentPage(1);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedMovies.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                <span className="text-white">{selectedMovies.length} movies selected</span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                >
                  <option value="">Choose Action</option>
                  <option value="publish">Publish</option>
                  <option value="draft">Move to Draft</option>
                  <option value="archive">Archive</option>
                  <option value="feature">Feature</option>
                  <option value="unfeature">Unfeature</option>
                  <option value="delete">Delete</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setSelectedMovies([])}
                  className="text-gray-400 hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Movies Grid/List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
            </div>
          ) : (
            <div className="bg-gray-900/50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedMovies.length === movies.length && movies.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-600 bg-gray-700 text-netflix-red focus:ring-netflix-red"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Movie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Genre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Upload Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {movies.map((movie) => (
                      <tr key={movie._id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedMovies.includes(movie._id)}
                            onChange={() => toggleMovieSelection(movie._id)}
                            className="rounded border-gray-600 bg-gray-700 text-netflix-red focus:ring-netflix-red"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={movie.thumbnail}
                              alt={movie.title}
                              className="w-16 h-24 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                              }}
                            />
                            <div>
                              <div className="text-white font-medium">{movie.title}</div>
                              <div className="text-gray-400 text-sm">
                                {movie.year} • {movie.duration}min
                              </div>
                              <div className="text-gray-500 text-xs">
                                {movie.fileSize && formatFileSize(movie.fileSize)}
                              </div>
                              {movie.featured && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-900 text-yellow-300 mt-1">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {movie.genre.slice(0, 2).map(g => (
                              <span key={g} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                                {g}
                              </span>
                            ))}
                            {movie.genre.length > 2 && (
                              <span className="text-gray-500 text-xs">+{movie.genre.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white capitalize ${getStatusBadgeColor(movie.status)}`}>
                            {movie.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="text-gray-300">{movie.rating}/10</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {movie.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {formatDate(movie.uploadDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/admin/movies/${movie._id}/edit`)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => navigate(`/watch/${movie._id}`)}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleMovieUpdate(movie._id, { 
                                status: movie.status === 'published' ? 'draft' : 'published' 
                              })}
                              className="text-yellow-400 hover:text-yellow-300 text-sm"
                            >
                              {movie.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleMovieDelete(movie._id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-800 px-6 py-3 flex items-center justify-between">
                  <div className="text-gray-400 text-sm">
                    Page {currentPage} of {totalPages} • {movies.length} movies
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && movies.length === 0 && (
            <div className="text-center py-12 bg-gray-900/50 rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No movies found</h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || genreFilter !== 'all' || statusFilter !== 'all' || yearFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start by uploading your first movie.'
                }
              </p>
              <button
                onClick={() => navigate('/admin/upload')}
                className="bg-netflix-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Upload Movie
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ContentManagement;