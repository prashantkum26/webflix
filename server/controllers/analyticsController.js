import WatchHistory from '../models/WatchHistory.js';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Subscription from '../models/Subscription.js';

// Get analytics overview
export const getAnalyticsOverview = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Total views and watch time
    const viewsAndWatchTime = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          totalWatchTime: { $sum: '$watchTime' },
          avgWatchTime: { $avg: '$watchTime' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      }
    ]);

    // Daily analytics for chart
    const dailyAnalytics = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          views: { $sum: 1 },
          watchTime: { $sum: '$watchTime' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $addFields: {
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top performing content
    const topContent = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$movie',
          views: { $sum: 1 },
          totalWatchTime: { $sum: '$watchTime' },
          uniqueViewers: { $addToSet: '$user' },
          avgWatchPercentage: { $avg: '$watchPercentage' }
        }
      },
      {
        $addFields: {
          uniqueViewers: { $size: '$uniqueViewers' }
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movie'
        }
      },
      {
        $unwind: '$movie'
      },
      {
        $project: {
          title: '$movie.title',
          thumbnail: '$movie.thumbnail',
          views: 1,
          totalWatchTime: 1,
          uniqueViewers: 1,
          avgWatchPercentage: 1
        }
      }
    ]);

    // Device and platform breakdown
    const deviceStats = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            deviceType: '$deviceType',
            platform: '$platform'
          },
          count: { $sum: 1 },
          watchTime: { $sum: '$watchTime' }
        }
      },
      {
        $group: {
          _id: '$_id.deviceType',
          totalCount: { $sum: '$count' },
          totalWatchTime: { $sum: '$watchTime' },
          platforms: {
            $push: {
              platform: '$_id.platform',
              count: '$count',
              watchTime: '$watchTime'
            }
          }
        }
      }
    ]);

    // Genre performance
    const genrePerformance = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'movie',
          foreignField: '_id',
          as: 'movieData'
        }
      },
      {
        $unwind: '$movieData'
      },
      {
        $unwind: '$movieData.genre'
      },
      {
        $group: {
          _id: '$movieData.genre',
          views: { $sum: 1 },
          totalWatchTime: { $sum: '$watchTime' },
          avgRating: { $avg: '$movieData.rating' }
        }
      },
      {
        $sort: { views: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: viewsAndWatchTime[0] || {
          totalViews: 0,
          totalWatchTime: 0,
          avgWatchTime: 0,
          uniqueUsers: 0
        },
        dailyAnalytics,
        topContent,
        deviceStats,
        genrePerformance
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user engagement analytics
export const getUserEngagementAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // User engagement levels
    const engagementStats = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$engagement',
          count: { $sum: 1 },
          avgWatchTime: { $avg: '$watchTime' }
        }
      }
    ]);

    // Completion rates
    const completionRates = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$watchPercentage', 10] }, then: '0-10%' },
                { case: { $lt: ['$watchPercentage', 25] }, then: '10-25%' },
                { case: { $lt: ['$watchPercentage', 50] }, then: '25-50%' },
                { case: { $lt: ['$watchPercentage', 75] }, then: '50-75%' },
                { case: { $lt: ['$watchPercentage', 90] }, then: '75-90%' }
              ],
              default: '90-100%'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User activity patterns (hourly)
    const hourlyActivity = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          sessions: { $sum: 1 },
          watchTime: { $sum: '$watchTime' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Most active users
    const topUsers = await WatchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalSessions: { $sum: 1 },
          totalWatchTime: { $sum: '$watchTime' },
          avgWatchPercentage: { $avg: '$watchPercentage' }
        }
      },
      {
        $sort: { totalWatchTime: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalSessions: 1,
          totalWatchTime: 1,
          avgWatchPercentage: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        engagementStats,
        completionRates,
        hourlyActivity,
        topUsers
      }
    });
  } catch (error) {
    console.error('User engagement analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user engagement analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get revenue and subscription analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Revenue by subscription type
    const revenueByPlan = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          revenue: { $sum: '$monthlyPrice' },
          avgPrice: { $avg: '$monthlyPrice' }
        }
      }
    ]);

    // Monthly recurring revenue trend
    const mrrTrend = await Subscription.aggregate([
      {
        $match: {
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt'
            }
          },
          newSubscriptions: { $sum: 1 },
          revenue: { $sum: '$monthlyPrice' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Subscription status breakdown
    const subscriptionStatus = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$monthlyPrice' }
        }
      }
    ]);

    // Churn analysis
    const churnAnalysis = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['cancelled', 'expired'] },
          cancellationDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$cancellationReason',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenueByPlan,
        mrrTrend,
        subscriptionStatus,
        churnAnalysis
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get content performance analytics
export const getContentAnalytics = async (req, res) => {
  try {
    const { days = 30, movieId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let matchQuery = { createdAt: { $gte: startDate } };
    if (movieId) {
      matchQuery.movie = new mongoose.Types.ObjectId(movieId);
    }

    // Content performance metrics
    const contentMetrics = await WatchHistory.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'movies',
          localField: 'movie',
          foreignField: '_id',
          as: 'movieData'
        }
      },
      {
        $unwind: '$movieData'
      },
      {
        $group: {
          _id: '$movie',
          title: { $first: '$movieData.title' },
          thumbnail: { $first: '$movieData.thumbnail' },
          genre: { $first: '$movieData.genre' },
          year: { $first: '$movieData.year' },
          duration: { $first: '$movieData.duration' },
          views: { $sum: 1 },
          uniqueViewers: { $addToSet: '$user' },
          totalWatchTime: { $sum: '$watchTime' },
          avgWatchPercentage: { $avg: '$watchPercentage' },
          completionRate: { $avg: { $cond: ['$completed', 1, 0] } },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $addFields: {
          uniqueViewers: { $size: '$uniqueViewers' },
          engagementScore: {
            $multiply: [
              { $add: ['$avgWatchPercentage', '$completionRate'] },
              0.5
            ]
          }
        }
      },
      {
        $sort: { views: -1 }
      }
    ]);

    // Watch drop-off analysis
    const dropOffAnalysis = await WatchHistory.aggregate([
      { $match: matchQuery },
      {
        $bucket: {
          groupBy: '$watchPercentage',
          boundaries: [0, 10, 25, 50, 75, 90, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgWatchTime: { $avg: '$watchTime' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        contentMetrics,
        dropOffAnalysis
      }
    });
  } catch (error) {
    console.error('Content analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export analytics data
export const exportAnalytics = async (req, res) => {
  try {
    const { type, format = 'json', days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let data = {};

    switch (type) {
      case 'overview':
        data = await getAnalyticsOverview(req, res);
        break;
      case 'users':
        data = await getUserEngagementAnalytics(req, res);
        break;
      case 'revenue':
        data = await getRevenueAnalytics(req, res);
        break;
      case 'content':
        data = await getContentAnalytics(req, res);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=webflix-${type}-analytics.csv`);
      return res.send(csv);
    }

    // Return JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=webflix-${type}-analytics.json`);
    res.json(data);
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  // Simple CSV conversion - can be enhanced based on needs
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}