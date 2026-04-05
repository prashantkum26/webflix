import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsAPI } from '../services/api';

interface UserPreferences {
  autoplay: boolean;
  autoplayTrailers: boolean;
  previewOnHover: boolean;
  hoverDelay: number;
  preferredVideoQuality: 'auto' | '480p' | '720p' | '1080p' | '4K';
  dataUsageMode: 'low' | 'medium' | 'high' | 'auto';
  preferredAudioLanguage: string;
  preferredSubtitleLanguage?: string;
  subtitlesEnabled: boolean;
  emailNotifications: {
    newReleases: boolean;
    recommendations: boolean;
    accountUpdates: boolean;
    promotions: boolean;
  };
  profileVisibility: 'public' | 'private' | 'friends';
  shareWatchHistory: boolean;
  allowRecommendations: boolean;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    country: user?.country || '',
    language: user?.language || 'en'
  });
  
  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    autoplay: true,
    autoplayTrailers: true,
    previewOnHover: true,
    hoverDelay: 500,
    preferredVideoQuality: 'auto',
    dataUsageMode: 'auto',
    preferredAudioLanguage: 'en',
    preferredSubtitleLanguage: undefined,
    subtitlesEnabled: false,
    emailNotifications: {
      newReleases: true,
      recommendations: true,
      accountUpdates: true,
      promotions: false
    },
    profileVisibility: 'private',
    shareWatchHistory: false,
    allowRecommendations: true
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'playback' | 'privacy' | 'password'>('profile');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile and preferences
      const [profileResponse, preferencesResponse] = await Promise.all([
        settingsAPI.getUserProfile(),
        settingsAPI.getUserPreferences()
      ]);

      if (profileResponse.success) {
        const userData = profileResponse.data.user;
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          avatar: userData.avatar || '',
          country: userData.country || '',
          language: userData.language || 'en'
        });
      }

      if (preferencesResponse.success && preferencesResponse.data.preferences) {
        setPreferences({ ...preferences, ...preferencesResponse.data.preferences });
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingsAPI.updateUserProfile(profileData);
      
      if (response.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await settingsAPI.updateUserPreferences(preferences);
      
      if (response.success) {
        setSuccess('Preferences updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await settingsAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'playback', name: 'Playback', icon: '▶️' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'password', name: 'Password', icon: '🔑' }
  ];

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-gray-400">Manage your account preferences and settings</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-gray-900/50 rounded-lg mb-8">
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-netflix-red'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      placeholder="United States"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={profileData.language}
                      onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="hi">Hindi</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Playback Tab */}
            {activeTab === 'playback' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Autoplay</h3>
                      <p className="text-gray-400 text-sm">Automatically play next episode</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoplay}
                        onChange={(e) => setPreferences({ ...preferences, autoplay: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Autoplay Trailers</h3>
                      <p className="text-gray-400 text-sm">Play trailers while browsing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoplayTrailers}
                        onChange={(e) => setPreferences({ ...preferences, autoplayTrailers: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Preview on Hover</h3>
                      <p className="text-gray-400 text-sm">Show preview when hovering over content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.previewOnHover}
                        onChange={(e) => setPreferences({ ...preferences, previewOnHover: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Quality
                    </label>
                    <select
                      value={preferences.preferredVideoQuality}
                      onChange={(e) => setPreferences({ ...preferences, preferredVideoQuality: e.target.value as any })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                    >
                      <option value="auto">Auto</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p HD</option>
                      <option value="1080p">1080p Full HD</option>
                      <option value="4K">4K Ultra HD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesUpdate}
                    disabled={saving}
                    className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Share Watch History</h3>
                      <p className="text-gray-400 text-sm">Allow others to see what you're watching</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.shareWatchHistory}
                        onChange={(e) => setPreferences({ ...preferences, shareWatchHistory: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Allow Recommendations</h3>
                      <p className="text-gray-400 text-sm">Use viewing history for personalized recommendations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.allowRecommendations}
                        onChange={(e) => setPreferences({ ...preferences, allowRecommendations: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={preferences.profileVisibility}
                      onChange={(e) => setPreferences({ ...preferences, profileVisibility: e.target.value as any })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesUpdate}
                    disabled={saving}
                    className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-netflix-red hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;