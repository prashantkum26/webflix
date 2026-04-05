import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Movie } from '../types';

interface DownloadItem extends Movie {
  downloadId: string;
  status: 'downloading' | 'completed' | 'paused' | 'error';
  progress: number; // 0-100
  sizeBytes: number;
  downloadedBytes: number;
  downloadDate: string;
  expiryDate: string;
  quality: '480p' | '720p' | '1080p';
}

const Downloads: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    total: 0
  });
  const [downloadQuality, setDownloadQuality] = useState<'480p' | '720p' | '1080p'>('720p');
  const [autoDownload, setAutoDownload] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);

  useEffect(() => {
    fetchDownloads();
    fetchStorageInfo();
    loadSettings();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      // Mock data - in real app, this would be an API call
      const mockDownloads: DownloadItem[] = [
        {
          downloadId: '1',
          _id: '1',
          title: 'Avengers: Endgame',
          description: 'The culmination of 22 interconnected films...',
          thumbnail: 'https://example.com/avengers-endgame.jpg',
          videoUrl: 'https://example.com/avengers-endgame.mp4',
          genre: ['Action', 'Adventure', 'Sci-Fi'],
          rating: 8.4,
          year: 2019,
          duration: 181,
          cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo'],
          director: 'Russo Brothers',
          featured: true,
          trending: false,
          topRated: true,
          views: 1000000,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          status: 'completed',
          progress: 100,
          sizeBytes: 2500000000, // 2.5GB
          downloadedBytes: 2500000000,
          downloadDate: '2023-12-01',
          expiryDate: '2024-01-01',
          quality: '1080p'
        },
        {
          downloadId: '2',
          _id: '2',
          title: 'The Dark Knight',
          description: 'Batman faces the Joker...',
          thumbnail: 'https://example.com/dark-knight.jpg',
          videoUrl: 'https://example.com/dark-knight.mp4',
          genre: ['Action', 'Crime', 'Drama'],
          rating: 9.0,
          year: 2008,
          duration: 152,
          cast: ['Christian Bale', 'Heath Ledger'],
          director: 'Christopher Nolan',
          featured: true,
          trending: false,
          topRated: true,
          views: 800000,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          status: 'downloading',
          progress: 65,
          sizeBytes: 1800000000, // 1.8GB
          downloadedBytes: 1170000000,
          downloadDate: '2023-12-15',
          expiryDate: '2024-01-15',
          quality: '720p'
        }
      ];
      setDownloads(mockDownloads);
    } catch (err) {
      console.error('Error fetching downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageInfo = () => {
    // Mock storage info
    setStorageInfo({
      used: 4.3, // GB
      available: 27.7, // GB
      total: 32 // GB
    });
  };

  const loadSettings = () => {
    // Load user preferences from localStorage or API
    const savedQuality = localStorage.getItem('downloadQuality') as any;
    const savedAutoDownload = localStorage.getItem('autoDownload') === 'true';
    const savedWifiOnly = localStorage.getItem('wifiOnly') !== 'false';
    
    if (savedQuality) setDownloadQuality(savedQuality);
    setAutoDownload(savedAutoDownload);
    setWifiOnly(savedWifiOnly);
  };

  const saveSettings = () => {
    localStorage.setItem('downloadQuality', downloadQuality);
    localStorage.setItem('autoDownload', autoDownload.toString());
    localStorage.setItem('wifiOnly', wifiOnly.toString());
  };

  const handleDeleteDownload = (downloadId: string) => {
    setDownloads(prev => prev.filter(d => d.downloadId !== downloadId));
  };

  const handlePauseResume = (downloadId: string) => {
    setDownloads(prev => prev.map(d => 
      d.downloadId === downloadId 
        ? { ...d, status: d.status === 'downloading' ? 'paused' : 'downloading' }
        : d
    ));
  };

  const handleWatchOffline = (movieId: string) => {
    navigate(`/watch/${movieId}?offline=true`);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');

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
          <h1 className="text-4xl font-bold text-white mb-2">Downloads</h1>
          <p className="text-gray-400">
            Watch your favorite movies offline
          </p>
        </div>

        {/* Storage Info */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Storage</h3>
            <span className="text-gray-400 text-sm">
              {storageInfo.used.toFixed(1)} GB of {storageInfo.total} GB used
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-netflix-red h-3 rounded-full transition-all duration-500"
              style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{storageInfo.used.toFixed(1)} GB</div>
              <p className="text-gray-400 text-sm">Used</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{storageInfo.available.toFixed(1)} GB</div>
              <p className="text-gray-400 text-sm">Available</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{downloads.length}</div>
              <p className="text-gray-400 text-sm">Downloads</p>
            </div>
          </div>
        </div>

        {/* Download Settings */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Download Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Download Quality
              </label>
              <select
                value={downloadQuality}
                onChange={(e) => {
                  setDownloadQuality(e.target.value as any);
                  saveSettings();
                }}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
              >
                <option value="480p">Standard (480p) - Saves space</option>
                <option value="720p">High (720p) - Recommended</option>
                <option value="1080p">Full HD (1080p) - Best quality</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Wi-Fi Only</h4>
                <p className="text-gray-400 text-sm">Download only on Wi-Fi</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifiOnly}
                  onChange={(e) => {
                    setWifiOnly(e.target.checked);
                    saveSettings();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Smart Downloads</h4>
                <p className="text-gray-400 text-sm">Auto-download new episodes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDownload}
                  onChange={(e) => {
                    setAutoDownload(e.target.checked);
                    saveSettings();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Active Downloads */}
        {activeDownloads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Currently Downloading</h2>
            <div className="space-y-4">
              {activeDownloads.map((download) => (
                <div key={download.downloadId} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={download.thumbnail}
                      alt={download.title}
                      className="w-16 h-24 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                      }}
                    />
                    
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-1">{download.title}</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {download.quality} • {formatBytes(download.sizeBytes)}
                      </p>
                      
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-netflix-red h-2 rounded-full transition-all duration-300"
                            style={{ width: `${download.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-white text-sm font-medium">{download.progress}%</span>
                      </div>
                      
                      <p className="text-gray-500 text-xs">
                        {formatBytes(download.downloadedBytes)} of {formatBytes(download.sizeBytes)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePauseResume(download.downloadId)}
                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors"
                        title={download.status === 'downloading' ? 'Pause' : 'Resume'}
                      >
                        {download.status === 'downloading' ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDownload(download.downloadId)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                        title="Cancel Download"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloaded Movies */}
        {completedDownloads.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Downloaded ({completedDownloads.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {completedDownloads.map((download) => {
                const daysUntilExpiry = getDaysUntilExpiry(download.expiryDate);
                const isExpiringSoon = daysUntilExpiry <= 7;
                
                return (
                  <div key={download.downloadId} className="relative group">
                    <div className="relative">
                      <img
                        src={download.thumbnail}
                        alt={download.title}
                        className="w-full h-64 md:h-72 object-cover rounded-lg cursor-pointer"
                        onClick={() => handleWatchOffline(download._id)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                        }}
                      />
                      
                      {/* Expiry Warning */}
                      {isExpiringSoon && (
                        <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                          {daysUntilExpiry}d left
                        </div>
                      )}
                      
                      {/* Downloaded Badge */}
                      <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteDownload(download.downloadId)}
                        className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Download"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <button
                          onClick={() => handleWatchOffline(download._id)}
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
                      <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">{download.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{download.quality}</span>
                        <span>{formatBytes(download.sizeBytes)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Downloaded {formatDate(download.downloadDate)}</span>
                        {isExpiringSoon && (
                          <span className="text-yellow-400">Expires in {daysUntilExpiry}d</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State - Only show when no downloads exist at all */}
        {!loading && downloads.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No downloads yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Download movies and shows to watch them offline anytime, anywhere.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-netflix-red hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Movies
            </button>
            <div className="mt-6 text-sm text-gray-500">
              <p>💡 Look for the download icon on movie pages to start downloading.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Downloads;