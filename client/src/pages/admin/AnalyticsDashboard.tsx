import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import StatsCard from '../../components/admin/StatsCard';
import { analyticsAPI } from '../../services/api';

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueViewers: number;
    totalWatchTime: number;
    avgSessionTime: number;
    bounceRate: number;
    conversionRate: number;
  };
  userMetrics: {
    newUsers: number;
    returningUsers: number;
    activeUsers: number;
    churnRate: number;
  };
  contentMetrics: {
    topMovies: Array<{
      title: string;
      views: number;
      watchTime: number;
      rating: number;
      completionRate: number;
    }>;
    genrePerformance: Array<{
      genre: string;
      views: number;
      avgRating: number;
      watchTime: number;
    }>;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRecurring: number;
    averageRevenuePerUser: number;
    subscriptionGrowth: number;
  };
  geographicData: Array<{
    country: string;
    users: number;
    revenue: number;
    avgWatchTime: number;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'users' | 'revenue'>('views');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await analyticsAPI.getAnalytics({
        timeRange,
        includeGeographic: true,
        includeContent: true
      });
      
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range: string): string => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
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
              onClick={fetchAnalytics}
              className="mt-4 bg-netflix-red hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-netflix-black">
      <AdminNav />
      
      <main className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">
                Comprehensive insights into platform performance
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-gray-400 text-sm">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Views"
              value={formatNumber(analytics.overview.totalViews)}
              change={`${formatNumber(analytics.overview.uniqueViewers)} unique viewers`}
              changeType="neutral"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatsCard
              title="Watch Time"
              value={formatTime(analytics.overview.totalWatchTime)}
              change={`${formatTime(analytics.overview.avgSessionTime)} avg session`}
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Active Users"
              value={formatNumber(analytics.userMetrics.activeUsers)}
              change={`${formatPercentage(analytics.overview.bounceRate)} bounce rate`}
              changeType="negative"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Revenue"
              value={formatCurrency(analytics.revenueMetrics.totalRevenue)}
              change={`${formatPercentage(analytics.revenueMetrics.subscriptionGrowth)} growth`}
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Metrics */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">User Engagement</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">New Users</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(analytics.userMetrics.newUsers / (analytics.userMetrics.newUsers + analytics.userMetrics.returningUsers)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-16 text-right">
                      {formatNumber(analytics.userMetrics.newUsers)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Returning Users</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(analytics.userMetrics.returningUsers / (analytics.userMetrics.newUsers + analytics.userMetrics.returningUsers)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-16 text-right">
                      {formatNumber(analytics.userMetrics.returningUsers)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Churn Rate</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${analytics.userMetrics.churnRate}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-16 text-right">
                      {formatPercentage(analytics.userMetrics.churnRate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Conversion Rate</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-netflix-red h-2 rounded-full"
                        style={{ width: `${analytics.overview.conversionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-16 text-right">
                      {formatPercentage(analytics.overview.conversionRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Revenue Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {formatCurrency(analytics.revenueMetrics.monthlyRecurring)}
                  </div>
                  <p className="text-gray-400 text-sm">Monthly Recurring</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {formatCurrency(analytics.revenueMetrics.averageRevenuePerUser)}
                  </div>
                  <p className="text-gray-400 text-sm">ARPU</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {formatPercentage(analytics.revenueMetrics.subscriptionGrowth)}
                  </div>
                  <p className="text-gray-400 text-sm">Growth Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {formatNumber(analytics.userMetrics.activeUsers)}
                  </div>
                  <p className="text-gray-400 text-sm">Paying Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Movies */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Top Performing Movies</h3>
              <div className="space-y-4">
                {analytics.contentMetrics.topMovies.map((movie, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-netflix-red w-8">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{movie.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{formatNumber(movie.views)} views</span>
                        <span>{formatTime(movie.watchTime)} watch time</span>
                        <span>★{movie.rating}</span>
                        <span>{formatPercentage(movie.completionRate)} completion</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Genre Performance */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-6">Genre Performance</h3>
              <div className="space-y-4">
                {analytics.contentMetrics.genrePerformance.map((genre, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{genre.genre}</span>
                      <div className="text-sm text-gray-400">
                        {formatNumber(genre.views)} views • ★{genre.avgRating}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formatTime(genre.watchTime)}</div>
                      <div className="text-sm text-gray-400">watch time</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Geographic Data */}
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6">Geographic Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Avg Watch Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ARPU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {analytics.geographicData.map((country, index) => (
                    <tr key={index} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-white font-medium">{country.country}</td>
                      <td className="px-6 py-4 text-gray-300">{formatNumber(country.users)}</td>
                      <td className="px-6 py-4 text-gray-300">{formatCurrency(country.revenue)}</td>
                      <td className="px-6 py-4 text-gray-300">{formatTime(country.avgWatchTime)}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatCurrency(country.revenue / country.users)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gray-900/50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Export Data</h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-netflix-red hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                Export to PDF
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Export to Excel
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                Export to CSV
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;