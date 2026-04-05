import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import StatsCard from '../../components/admin/StatsCard';
import { adminAPI } from '../../services/api';

interface DashboardStats {
  overview: {
    totalUsers: number;
    totalMovies: number;
    activeSubscriptions: number;
    recentViews: number;
  };
  userStats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    adminUsers: number;
  };
  watchTimeStats: {
    totalWatchTime: number;
    avgWatchTime: number;
    totalSessions: number;
  };
  trendingMovies: Array<{
    movie: {
      title: string;
      thumbnail: string;
    };
    views: number;
    uniqueViewers: number;
    trendingScore: number;
  }>;
  genreStats: Array<{
    _id: string;
    count: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      // Handle the response structure properly
      setStats(response.data || response);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black">
        <AdminNav />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-netflix-black">
        <AdminNav />
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
            <h3 className="text-red-400 font-bold mb-2">Error</h3>
            <p className="text-gray-300">{error}</p>
            <button 
              onClick={fetchDashboardStats}
              className="mt-4 bg-netflix-red hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-netflix-black">
      <AdminNav />
      
      <main className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.name}. Here's what's happening with WebFlix today.
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={formatNumber(stats.overview.totalUsers)}
              change={`+${stats.userStats.activeUsers} active`}
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Total Movies"
              value={formatNumber(stats.overview.totalMovies)}
              change="Content library"
              changeType="neutral"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9z" />
                </svg>
              }
            />

            <StatsCard
              title="Active Subscriptions"
              value={formatNumber(stats.overview.activeSubscriptions)}
              change="Revenue generating"
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />

            <StatsCard
              title="Recent Views"
              value={formatNumber(stats.overview.recentViews)}
              change="Last 30 days"
              changeType="neutral"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Trending Movies */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Trending Movies</h3>
              <div className="space-y-4">
                {stats.trendingMovies.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-netflix-red w-8">
                      {index + 1}
                    </span>
                    <img
                      src={item.movie.thumbnail || '/placeholder-movie.jpg'}
                      alt={item.movie.title}
                      className="w-16 h-24 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{item.movie.title}</h4>
                      <p className="text-gray-400 text-sm">
                        {formatNumber(item.views)} views • {formatNumber(item.uniqueViewers)} viewers
                      </p>
                    </div>
                  </div>
                ))}
                {stats.trendingMovies.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No trending data available</p>
                )}
              </div>
            </div>

            {/* Genre Distribution */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Popular Genres</h3>
              <div className="space-y-4">
                {stats.genreStats.map((genre, index) => (
                  <div key={genre._id} className="flex items-center justify-between">
                    <span className="text-white">{genre._id}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-netflix-red h-2 rounded-full"
                          style={{
                            width: `${(genre.count / stats.genreStats[0]?.count * 100) || 0}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-400 text-sm w-8 text-right">
                        {genre.count}
                      </span>
                    </div>
                  </div>
                ))}
                {stats.genreStats.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No genre data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Watch Time Stats */}
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Viewing Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-netflix-red mb-2">
                  {formatWatchTime(stats.watchTimeStats.totalWatchTime)}
                </div>
                <p className="text-gray-400">Total Watch Time</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-netflix-red mb-2">
                  {formatWatchTime(stats.watchTimeStats.avgWatchTime)}
                </div>
                <p className="text-gray-400">Avg Session Time</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-netflix-red mb-2">
                  {formatNumber(stats.watchTimeStats.totalSessions)}
                </div>
                <p className="text-gray-400">Total Sessions</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900/50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/upload')}
                className="bg-netflix-red hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Upload Movie
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Manage Users
              </button>
              <button
                onClick={() => navigate('/admin/content')}
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Content Library
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;