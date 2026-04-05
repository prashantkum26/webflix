import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  loading = false
}) => {
  const getChangeColorClass = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') {
      return (
        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    }
    if (changeType === 'negative') {
      return (
        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-700 rounded w-20"></div>
            <div className="h-6 w-6 bg-gray-700 rounded"></div>
          </div>
          <div className="h-8 bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-6 hover:bg-gray-900/70 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2">{value}</p>
          {change && (
            <p className={`text-sm flex items-center ${getChangeColorClass()}`}>
              {change}
              {getChangeIcon()}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="text-netflix-red">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;