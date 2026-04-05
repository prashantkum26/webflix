import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { settingsAPI, movieAPI, userAPI } from '../services/api';
import type { Movie } from '../types';

interface UserStats {
  totalWatchTime: number;
  moviesWatched: number;
  favoriteGenre: string;
  accountAge: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [myList, setMyList] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<Movie[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data in parallel
      const [
        continueWatchingRes,
        myListRes,
        recommendationsRes,
        recentlyWatchedRes
      ] = await Promise.allSettled([
        settingsAPI.getContinueWatching(),
        userAPI.getMyList(),
        movieAPI.getMovies({ limit: 10 }), // Fetch some movies as recommendations
        settingsAPI.getContinueWatching() // Placeholder for recently watched
      ]);

      // Handle continue watching
      if (continueWatchingRes.status === 'fulfilled') {
        setContinueWatching(continueWatchingRes.value.data?.continueWatching || []);
      }

      // Handle my list
      if (myListRes.status === 'fulfilled') {
        setMyList(myListRes.value || []);
      }

      // Handle recommendations (using general movies for now)
      if (recommendationsRes.status === 'fulfilled') {
        setRecommendations(recommendationsRes.value.data?.slice(0, 6) || []);
      }

      // Mock user stats
      setUserStats({
        totalWatchTime: 1247, // minutes
        moviesWatched: 23,
        favoriteGenre: 'Action',
        accountAge: 'New Member' // Default for now since createdAt doesn't exist in User type
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountAge = (createdAt?: string): string => {
    if (!createdAt) return 'New';
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleWatchMovie = (movieId: string) => {
    navigate(`/watch/${movieId}`);
  };

  const handleToggleMyList = async (movieId: string) => {
    try {
      const result = await userAPI.toggleMyList(movieId);
      setMyList(result.data);
    } catch (err) {
      console.error('Error updating my list:', err);
    }
  };

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-400">
            Ready to continue your streaming journey?
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={fetchDashboardData}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-netflix-red mb-1">
              {formatWatchTime(userStats?.totalWatchTime || 0)}
            </div>
            <p className="text-gray-400 text-sm">Watch Time</p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-netflix-red mb-1">
              {userStats?.moviesWatched || 0}
            </div>
            <p className="text-gray-400 text-sm">Movies Watched</p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-netflix-red mb-1">
              {userStats?.favoriteGenre || 'None'}
            </div>
            <p className="text-gray-400 text-sm">Favorite Genre</p>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-netflix-red mb-1">
              {userStats?.accountAge || 'New'}
            </div>
            <p className="text-gray-400 text-sm">Member Since</p>
          </div>
        </div>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
              <button 
                onClick={() => navigate('/continue-watching')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {continueWatching.slice(0, 4).map((item, index) => (
                <div 
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => handleWatchMovie(item.movie._id)}
                >
                  <img
                    src={item.movie.thumbnail || '/placeholder-movie.jpg'}
                    alt={item.movie.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg">
                    <h3 className="text-white font-medium text-sm mb-1">{item.movie.title}</h3>
                    <div className="w-full bg-gray-600 rounded-full h-1 mb-2">
                      <div 
                        className="bg-netflix-red h-1 rounded-full" 
                        style={{ width: `${item.watchPercentage || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-300 text-xs">{item.watchPercentage || 0}% watched</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My List */}
        {myList.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My List</h2>
              <button 
                onClick={() => navigate('/my-list')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                View All ({myList.length})
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {myList.slice(0, 5).map((movie) => (
                <div 
                  key={movie._id}
                  className="relative group cursor-pointer transform hover:scale-105 transition-transform"
                >
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onClick={() => handleWatchMovie(movie._id)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMyList(movie._id);
                      }}
                      className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-white font-medium text-sm">{movie.title}</h3>
                    <p className="text-gray-300 text-xs">{movie.year} • {movie.genre.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommended for You */}
        {recommendations.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
              <button 
                onClick={() => navigate('/recommendations')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.map((movie) => (
                <div 
                  key={movie._id}
                  className="relative group cursor-pointer transform hover:scale-105 transition-transform"
                  onClick={() => handleWatchMovie(movie._id)}
                >
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <h3 className="text-white font-medium text-xs">{movie.title}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400 text-xs">★</span>
                      <span className="text-gray-300 text-xs ml-1">{movie.rating}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/my-list')}
              className="bg-gray-900/50 hover:bg-gray-800/50 p-6 rounded-lg text-center transition-colors group"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-netflix-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium">My List</h3>
              <p className="text-gray-400 text-sm mt-1">{myList.length} saved movies</p>
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-900/50 hover:bg-gray-800/50 p-6 rounded-lg text-center transition-colors group"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-netflix-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-white font-medium">Account Settings</h3>
              <p className="text-gray-400 text-sm mt-1">Manage preferences</p>
            </button>

            <button
              onClick={() => navigate('/downloads')}
              className="bg-gray-900/50 hover:bg-gray-800/50 p-6 rounded-lg text-center transition-colors group"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-netflix-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium">Downloads</h3>
              <p className="text-gray-400 text-sm mt-1">Watch offline</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;