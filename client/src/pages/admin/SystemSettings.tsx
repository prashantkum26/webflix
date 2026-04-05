import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/admin/AdminNav';
import { settingsAPI } from '../../services/api';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    allowRegistrations: boolean;
    defaultUserRole: 'user' | 'moderator';
    maxUploadSize: number; // in MB
    supportedVideoFormats: string[];
  };
  security: {
    requireEmailVerification: boolean;
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    twoFactorAuth: boolean;
  };
  content: {
    autoPublish: boolean;
    moderationRequired: boolean;
    allowUserUploads: boolean;
    maxVideoLength: number; // in minutes
    thumbnailGeneration: boolean;
    videoQuality: string[];
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminNotifications: {
      newUser: boolean;
      newUpload: boolean;
      systemErrors: boolean;
    };
  };
  appearance: {
    primaryColor: string;
    theme: 'dark' | 'light' | 'auto';
    logoUrl: string;
    faviconUrl: string;
    customCSS: string;
  };
  integrations: {
    analytics: {
      enabled: boolean;
      googleAnalyticsId: string;
      trackUserActivity: boolean;
      retentionDays: number;
    };
    storage: {
      provider: 'local' | 'aws' | 'cloudinary';
      awsConfig?: {
        bucketName: string;
        region: string;
        accessKey: string;
      };
    };
    email: {
      provider: 'smtp' | 'sendgrid' | 'mailgun';
      smtpConfig?: {
        host: string;
        port: number;
        username: string;
        password: string;
      };
    };
  };
}

interface ValidationErrors {
  [key: string]: string | ValidationErrors;
}

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sectionChanges, setSectionChanges] = useState<Record<keyof SystemSettings, boolean>>({
    general: false,
    security: false,
    content: false,
    notifications: false,
    appearance: false,
    integrations: false,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'content' | 'notifications' | 'appearance' | 'integrations'>('general');

  const mockSettings: SystemSettings = {
    general: {
      siteName: 'WebFlix',
      siteDescription: 'Your premier streaming platform',
      maintenanceMode: false,
      allowRegistrations: true,
      defaultUserRole: 'user',
      maxUploadSize: 5000, // 5GB
      supportedVideoFormats: ['mp4', 'mov', 'avi', 'mkv'],
    },
    security: {
      requireEmailVerification: true,
      sessionTimeout: 1440, // 24 hours
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      twoFactorAuth: false,
    },
    content: {
      autoPublish: false,
      moderationRequired: true,
      allowUserUploads: false,
      maxVideoLength: 300, // 5 hours
      thumbnailGeneration: true,
      videoQuality: ['480p', '720p', '1080p'],
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      adminNotifications: {
        newUser: true,
        newUpload: true,
        systemErrors: true,
      },
    },
    appearance: {
      primaryColor: '#E50914',
      theme: 'dark',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      customCSS: '',
    },
    integrations: {
      analytics: {
        enabled: false,
        googleAnalyticsId: '',
        trackUserActivity: true,
        retentionDays: 365,
      },
      storage: {
        provider: 'local',
      },
      email: {
        provider: 'smtp',
      },
    },
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Check for unsaved changes per section
  useEffect(() => {
    if (originalSettings && settings) {
      const newSectionChanges = {
        general: JSON.stringify(originalSettings.general) !== JSON.stringify(settings.general),
        security: JSON.stringify(originalSettings.security) !== JSON.stringify(settings.security),
        content: JSON.stringify(originalSettings.content) !== JSON.stringify(settings.content),
        notifications: JSON.stringify(originalSettings.notifications) !== JSON.stringify(settings.notifications),
        appearance: JSON.stringify(originalSettings.appearance) !== JSON.stringify(settings.appearance),
        integrations: JSON.stringify(originalSettings.integrations) !== JSON.stringify(settings.integrations),
      };

      // Debug change detection
      Object.keys(newSectionChanges).forEach(section => {
        const hasChanges = newSectionChanges[section as keyof SystemSettings];
        if (hasChanges !== sectionChanges[section as keyof SystemSettings]) {
          console.log(`🔄 Section Change Detected: ${section.toUpperCase()} = ${hasChanges}`);
          if (hasChanges) {
            console.log(`📝 Original ${section}:`, JSON.stringify(originalSettings[section as keyof SystemSettings], null, 2));
            console.log(`✏️ Current ${section}:`, JSON.stringify(settings[section as keyof SystemSettings], null, 2));
          }
        }
      });

      setSectionChanges(newSectionChanges);
    }
  }, [settings, originalSettings, sectionChanges]);

  // Check if there are any unsaved changes
  const hasUnsavedChanges = Object.values(sectionChanges).some(changed => changed);

  // Apply appearance changes in real-time
  useEffect(() => {
    if (settings?.appearance?.primaryColor) {
      document.documentElement.style.setProperty('--netflix-red', settings.appearance.primaryColor);
    }
  }, [settings?.appearance?.primaryColor]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSystemSettings();
      const fetchedSettings = response.data || mockSettings;
      setSettings(fetchedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(fetchedSettings)));
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      // Use mock data as fallback
      setSettings(mockSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(mockSettings)));
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (settingsToValidate: SystemSettings | Partial<SystemSettings>, section?: keyof SystemSettings): ValidationErrors => {
    const errors: ValidationErrors = {};

    // General validations
    if ((!section || section === 'general') && settingsToValidate.general) {
      if (!settingsToValidate.general.siteName?.trim()) {
        errors.siteName = 'Site name is required';
      }

      if (settingsToValidate.general.maxUploadSize <= 0) {
        errors.maxUploadSize = 'Max upload size must be greater than 0';
      }
    }

    // Security validations
    if ((!section || section === 'security') && settingsToValidate.security) {
      if (settingsToValidate.security.sessionTimeout < 5) {
        errors.sessionTimeout = 'Session timeout must be at least 5 minutes';
      }

      if (settingsToValidate.security.maxLoginAttempts < 1) {
        errors.maxLoginAttempts = 'Max login attempts must be at least 1';
      }

      if (settingsToValidate.security.passwordMinLength < 4) {
        errors.passwordMinLength = 'Password minimum length must be at least 4';
      }
    }

    // Content validations
    if ((!section || section === 'content') && settingsToValidate.content) {
      if (settingsToValidate.content.maxVideoLength <= 0) {
        errors.maxVideoLength = 'Max video length must be greater than 0';
      }
    }

    // Appearance validations
    if ((!section || section === 'appearance') && settingsToValidate.appearance) {
      if (!settingsToValidate.appearance.primaryColor?.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
        errors.primaryColor = 'Primary color must be a valid hex color';
      }
    }

    // Integration validations
    if ((!section || section === 'integrations') && settingsToValidate.integrations) {
      if (settingsToValidate.integrations.analytics?.enabled && !settingsToValidate.integrations.analytics.googleAnalyticsId?.trim()) {
        errors.googleAnalyticsId = 'Google Analytics ID is required when analytics is enabled';
      }
    }

    return errors;
  };

  const handleSaveSection = async (section: keyof SystemSettings) => {
    if (!settings) return;
    
    const errors = validateSettings(settings, section);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setSaving(prev => ({ ...prev, [section]: true }));
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      
      // Save specific section
      const sectionData = { [section]: settings[section] };
      
      // Debug logging
      console.group(`💾 Saving ${section.toUpperCase()} Settings`);
      console.log('Section Data Being Sent:', JSON.stringify(sectionData, null, 2));
      console.log('Full Settings Before Save:', JSON.stringify(settings, null, 2));
      console.groupEnd();
      
      const response = await settingsAPI.updateSystemSettings(sectionData);
      
      // Debug response
      console.log(`✅ ${section} Settings Save Response:`, response);
      
      // Update original settings for this section
      setOriginalSettings(prev => ({
        ...prev!,
        [section]: JSON.parse(JSON.stringify(settings[section]))
      }));
      
      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(`❌ Error saving ${section} settings:`, err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || `Failed to save ${section} settings`);
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleSaveAll = async () => {
    if (!settings) return;
    
    const errors = validateSettings(settings);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before saving');
      return;
    }

    try {
      setSaving({ general: true, security: true, content: true, notifications: true, appearance: true, integrations: true });
      setError(null);
      setSuccess(null);
      setValidationErrors({});
      
      await settingsAPI.updateSystemSettings(settings);
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setSuccess('All settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving({});
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setValidationErrors({});
      setError(null);
    }
  };

  const handleBackup = async () => {
    if (!settings) return;
    
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `webflix-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccess('Settings backed up successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to backup settings');
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const restoredSettings = JSON.parse(event.target.result);
            
            // Validate restored settings structure
            if (restoredSettings.general && restoredSettings.security && restoredSettings.content) {
              setShowConfirmDialog({
                isOpen: true,
                title: 'Restore Settings',
                message: 'Are you sure you want to restore these settings? This will overwrite your current configuration.',
                onConfirm: () => {
                  setSettings(restoredSettings);
                  setSuccess('Settings restored successfully');
                  setTimeout(() => setSuccess(null), 3000);
                  setShowConfirmDialog({ ...showConfirmDialog, isOpen: false });
                },
              });
            } else {
              setError('Invalid settings file format');
            }
          } catch (err) {
            setError('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const updateSettings = useCallback((section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    // Handle critical settings with confirmation
    const criticalSettings = [
      { section: 'general', key: 'maintenanceMode', value: true },
      { section: 'security', key: 'twoFactorAuth', value: true },
      { section: 'general', key: 'allowRegistrations', value: false },
    ];

    const isCritical = criticalSettings.some(
      cs => cs.section === section && cs.key === key && cs.value === value
    );

    const updateFunction = () => {
      setSettings(prev => ({
        ...prev!,
        [section]: {
          ...prev![section],
          [key]: value,
        },
      }));

      // Clear validation error for this field
      if (validationErrors[key]) {
        const newErrors = { ...validationErrors };
        delete newErrors[key];
        setValidationErrors(newErrors);
      }
    };

    if (isCritical) {
      let message = '';
      if (section === 'general' && key === 'maintenanceMode' && value === true) {
        message = 'Enabling maintenance mode will make the site inaccessible to users. Are you sure?';
      } else if (section === 'security' && key === 'twoFactorAuth' && value === true) {
        message = 'Enabling 2FA will require all users to set up two-factor authentication. Continue?';
      } else if (section === 'general' && key === 'allowRegistrations' && value === false) {
        message = 'Disabling registrations will prevent new users from creating accounts. Continue?';
      }

      setShowConfirmDialog({
        isOpen: true,
        title: 'Confirm Critical Setting Change',
        message,
        onConfirm: () => {
          updateFunction();
          setShowConfirmDialog({ ...showConfirmDialog, isOpen: false });
        },
      });
    } else {
      updateFunction();
    }
  }, [settings, validationErrors, showConfirmDialog]);

  const updateNestedSettings = useCallback((section: keyof SystemSettings, nestedKey: string, key: string, value: any) => {
    if (!settings) return;
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [nestedKey]: {
          ...(prev![section] as any)[nestedKey],
          [key]: value,
        },
      },
    }));
  }, [settings]);

  // Handle beforeunload to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  if (!settings) return null;

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'content', name: 'Content', icon: '🎬' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'integrations', name: 'Integrations', icon: '🔗' },
  ] as const;

  return (
    <div className="min-h-screen bg-netflix-black">
      <AdminNav />
      
      <main className="pt-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
              <p className="text-gray-400">
                Configure system-wide settings and preferences
                {hasUnsavedChanges && (
                  <span className="ml-2 text-yellow-400">• Unsaved changes</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackup}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📥 Backup
              </button>
              
              <button
                onClick={handleRestore}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📤 Restore
              </button>
              
              {hasUnsavedChanges && (
                <button
                  onClick={handleReset}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={handleSaveAll}
                disabled={Object.values(saving).some(s => s) || !hasUnsavedChanges}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasUnsavedChanges && !Object.values(saving).some(s => s)
                    ? 'bg-netflix-red hover:bg-red-600 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {Object.values(saving).some(s => s) ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Settings Tabs */}
          <div className="bg-gray-900/50 rounded-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-gray-700">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-netflix-red bg-gray-800/50'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">General Settings</h3>
                      <p className="text-gray-400 text-sm">Basic site configuration and user settings</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('general')}
                      disabled={saving.general || !sectionChanges.general}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.general && !saving.general
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.general ? 'Saving...' : sectionChanges.general ? 'Save General' : 'No Changes'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Site Name *
                      </label>
                      <input
                        type="text"
                        value={settings?.general?.siteName || ''}
                        onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                        className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                          validationErrors.siteName 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-600 focus:border-netflix-red'
                        }`}
                      />
                      {validationErrors.siteName && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.siteName as string}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default User Role
                      </label>
                      <select
                        value={settings?.general?.defaultUserRole || 'user'}
                        onChange={(e) => updateSettings('general', 'defaultUserRole', e.target.value)}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings?.general?.siteDescription || ''}
                      onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                      rows={3}
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Upload Size (MB) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings?.general?.maxUploadSize || 0}
                        onChange={(e) => updateSettings('general', 'maxUploadSize', parseInt(e.target.value))}
                        className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                          validationErrors.maxUploadSize 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-600 focus:border-netflix-red'
                        }`}
                      />
                      {validationErrors.maxUploadSize && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.maxUploadSize as string}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium flex items-center">
                          🚧 Maintenance Mode
                          <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">CRITICAL</span>
                        </h4>
                        <p className="text-gray-400 text-sm">Temporarily disable the site for maintenance</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.general?.maintenanceMode || false}
                          onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">👥 Allow Registrations</h4>
                        <p className="text-gray-400 text-sm">Allow new users to create accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.general?.allowRegistrations || false}
                          onChange={(e) => updateSettings('general', 'allowRegistrations', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Security Settings</h3>
                      <p className="text-gray-400 text-sm">Authentication, authorization, and security policies</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('security')}
                      disabled={saving.security || !sectionChanges.security}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.security && !saving.security
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.security ? 'Saving...' : sectionChanges.security ? 'Save Security' : 'No Changes'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Session Timeout (minutes) *
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={settings?.security?.sessionTimeout || 0}
                        onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                        className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                          validationErrors.sessionTimeout 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-600 focus:border-netflix-red'
                        }`}
                      />
                      {validationErrors.sessionTimeout && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.sessionTimeout as string}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Login Attempts *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings?.security?.maxLoginAttempts || 0}
                        onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                          validationErrors.maxLoginAttempts 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-600 focus:border-netflix-red'
                        }`}
                      />
                      {validationErrors.maxLoginAttempts && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.maxLoginAttempts as string}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Password Length *
                      </label>
                      <input
                        type="number"
                        min="4"
                        value={settings?.security?.passwordMinLength || 0}
                        onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                        className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                          validationErrors.passwordMinLength 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-600 focus:border-netflix-red'
                        }`}
                      />
                      {validationErrors.passwordMinLength && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.passwordMinLength as string}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">📧 Require Email Verification</h4>
                        <p className="text-gray-400 text-sm">Users must verify their email before accessing the platform</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security?.requireEmailVerification || false}
                          onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">🔐 Require Strong Passwords</h4>
                        <p className="text-gray-400 text-sm">Passwords must contain uppercase, lowercase, numbers, and symbols</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security?.requireStrongPassword || false}
                          onChange={(e) => updateSettings('security', 'requireStrongPassword', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium flex items-center">
                          🔒 Two-Factor Authentication
                          <span className="ml-2 text-xs bg-orange-600 text-white px-2 py-1 rounded">CRITICAL</span>
                        </h4>
                        <p className="text-gray-400 text-sm">Enable 2FA for enhanced security</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security?.twoFactorAuth || false}
                          onChange={(e) => updateSettings('security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Settings */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Content Settings</h3>
                      <p className="text-gray-400 text-sm">Content management, moderation, and upload policies</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('content')}
                      disabled={saving.content || !sectionChanges.content}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.content && !saving.content
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.content ? 'Saving...' : sectionChanges.content ? 'Save Content' : 'No Changes'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Video Length (minutes) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings?.content?.maxVideoLength || 0}
                      onChange={(e) => updateSettings('content', 'maxVideoLength', parseInt(e.target.value))}
                      className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                        validationErrors.maxVideoLength 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-600 focus:border-netflix-red'
                      }`}
                    />
                    {validationErrors.maxVideoLength && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.maxVideoLength as string}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">🚀 Auto-Publish Content</h4>
                        <p className="text-gray-400 text-sm">Automatically publish uploaded content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.content?.autoPublish || false}
                          onChange={(e) => updateSettings('content', 'autoPublish', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">👮 Moderation Required</h4>
                        <p className="text-gray-400 text-sm">Require manual approval for all content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.content?.moderationRequired || false}
                          onChange={(e) => updateSettings('content', 'moderationRequired', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">📤 Allow User Uploads</h4>
                        <p className="text-gray-400 text-sm">Allow non-admin users to upload content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.content?.allowUserUploads || false}
                          onChange={(e) => updateSettings('content', 'allowUserUploads', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">🖼️ Auto-Generate Thumbnails</h4>
                        <p className="text-gray-400 text-sm">Automatically create video thumbnails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.content?.thumbnailGeneration || false}
                          onChange={(e) => updateSettings('content', 'thumbnailGeneration', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Notification Settings</h3>
                      <p className="text-gray-400 text-sm">Email alerts, push notifications, and admin notifications</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('notifications')}
                      disabled={saving.notifications || !sectionChanges.notifications}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.notifications && !saving.notifications
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.notifications ? 'Saving...' : sectionChanges.notifications ? 'Save Notifications' : 'No Changes'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">📧 Email Notifications</h4>
                        <p className="text-gray-400 text-sm">Enable email notifications system-wide</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.notifications?.emailNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="text-white font-medium">📱 Push Notifications</h4>
                        <p className="text-gray-400 text-sm">Enable push notifications for mobile apps</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.notifications?.pushNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'pushNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">🔔 Admin Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">👥 New User Registrations</h4>
                          <p className="text-gray-400 text-sm">Notify admins when new users register</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings?.notifications?.adminNotifications?.newUser || false}
                            onChange={(e) => updateNestedSettings('notifications', 'adminNotifications', 'newUser', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">📤 New Content Uploads</h4>
                          <p className="text-gray-400 text-sm">Notify admins when content is uploaded</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings?.notifications?.adminNotifications?.newUpload || false}
                            onChange={(e) => updateNestedSettings('notifications', 'adminNotifications', 'newUpload', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">⚠️ System Errors</h4>
                          <p className="text-gray-400 text-sm">Notify admins of critical system errors</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings?.notifications?.adminNotifications?.systemErrors || false}
                            onChange={(e) => updateNestedSettings('notifications', 'adminNotifications', 'systemErrors', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Appearance Settings</h3>
                      <p className="text-gray-400 text-sm">Theme customization, branding, and visual design</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('appearance')}
                      disabled={saving.appearance || !sectionChanges.appearance}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.appearance && !saving.appearance
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.appearance ? 'Saving...' : sectionChanges.appearance ? 'Save Appearance' : 'No Changes'}
                    </button>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-6">
                    <h4 className="text-blue-400 font-medium mb-2">🎨 Real-time Preview</h4>
                    <p className="text-blue-300 text-sm">
                      Changes to appearance settings are applied immediately for preview. 
                      Remember to save your changes to make them permanent.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Primary Color *
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={settings?.appearance?.primaryColor || '#E50914'}
                          onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                          className="w-12 h-10 rounded border border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings?.appearance?.primaryColor || '#E50914'}
                          onChange={(e) => updateSettings('appearance', 'primaryColor', e.target.value)}
                          className={`flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                            validationErrors.primaryColor 
                              ? 'border-red-500 focus:border-red-500' 
                              : 'border-gray-600 focus:border-netflix-red'
                          }`}
                        />
                      </div>
                      {validationErrors.primaryColor && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.primaryColor as string}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Preview:</span>
                        <div 
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: settings?.appearance?.primaryColor }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={settings?.appearance?.theme || 'dark'}
                        onChange={(e) => updateSettings('appearance', 'theme', e.target.value)}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                      >
                        <option value="dark">🌙 Dark</option>
                        <option value="light">☀️ Light</option>
                        <option value="auto">🔄 Auto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Logo URL
                      </label>
                      <input
                        type="url"
                        value={settings?.appearance?.logoUrl || ''}
                        onChange={(e) => updateSettings('appearance', 'logoUrl', e.target.value)}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Favicon URL
                      </label>
                      <input
                        type="url"
                        value={settings?.appearance?.faviconUrl || ''}
                        onChange={(e) => updateSettings('appearance', 'faviconUrl', e.target.value)}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Custom CSS
                    </label>
                    <textarea
                      value={settings?.appearance?.customCSS || ''}
                      onChange={(e) => updateSettings('appearance', 'customCSS', e.target.value)}
                      rows={8}
                      placeholder="/* Add your custom CSS here */&#10;.custom-class {&#10;  color: #ffffff;&#10;}"
                      className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red font-mono text-sm"
                    />
                    <p className="text-gray-400 text-sm mt-1">
                      Custom CSS will be applied site-wide. Use with caution.
                    </p>
                  </div>
                </div>
              )}

              {/* Integrations Settings */}
              {activeTab === 'integrations' && (
                <div className="space-y-8">
                  {/* Section Header with Save Button */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Integration Settings</h3>
                      <p className="text-gray-400 text-sm">Third-party services, analytics, storage, and email providers</p>
                    </div>
                    <button
                      onClick={() => handleSaveSection('integrations')}
                      disabled={saving.integrations || !sectionChanges.integrations}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        sectionChanges.integrations && !saving.integrations
                          ? 'bg-netflix-red hover:bg-red-600 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving.integrations ? 'Saving...' : sectionChanges.integrations ? 'Save Integrations' : 'No Changes'}
                    </button>
                  </div>

                  {/* Analytics */}
                  <div className="bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">📊 Analytics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="text-white font-medium">📈 Enable Analytics</h4>
                          <p className="text-gray-400 text-sm">Track user behavior and site performance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings?.integrations?.analytics?.enabled || false}
                            onChange={(e) => updateNestedSettings('integrations', 'analytics', 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                        </label>
                      </div>

                      {settings?.integrations?.analytics?.enabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Google Analytics ID *
                            </label>
                            <input
                              type="text"
                              value={settings?.integrations?.analytics?.googleAnalyticsId || ''}
                              onChange={(e) => updateNestedSettings('integrations', 'analytics', 'googleAnalyticsId', e.target.value)}
                              placeholder="G-XXXXXXXXXX"
                              className={`w-full bg-gray-800 text-white px-4 py-2 rounded-lg border focus:ring-1 focus:ring-netflix-red ${
                                validationErrors.googleAnalyticsId 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : 'border-gray-600 focus:border-netflix-red'
                              }`}
                            />
                            {validationErrors.googleAnalyticsId && (
                              <p className="text-red-400 text-sm mt-1">{validationErrors.googleAnalyticsId as string}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div>
                              <h4 className="text-white font-medium">🔍 Track User Activity</h4>
                              <p className="text-gray-400 text-sm">Monitor user behavior and interactions</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings?.integrations?.analytics?.trackUserActivity || false}
                                onChange={(e) => updateNestedSettings('integrations', 'analytics', 'trackUserActivity', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-netflix-red"></div>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Data Retention (days)
                            </label>
                            <input
                              type="number"
                              min="30"
                              max="1095"
                              value={settings?.integrations?.analytics?.retentionDays || 365}
                              onChange={(e) => updateNestedSettings('integrations', 'analytics', 'retentionDays', parseInt(e.target.value))}
                              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                            />
                            <p className="text-gray-400 text-sm mt-1">
                              How long to retain analytics data (30-1095 days)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Storage */}
                  <div className="bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">💾 Storage Provider</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Storage Provider
                        </label>
                        <select
                          value={settings?.integrations?.storage?.provider || 'local'}
                          onChange={(e) => updateNestedSettings('integrations', 'storage', 'provider', e.target.value)}
                          className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                        >
                          <option value="local">💻 Local Storage</option>
                          <option value="aws">☁️ Amazon S3</option>
                          <option value="cloudinary">🖼️ Cloudinary</option>
                        </select>
                      </div>

                      {settings?.integrations?.storage?.provider === 'aws' && (
                        <div className="mt-4 space-y-4 p-4 bg-gray-700/50 rounded-lg">
                          <h4 className="text-white font-medium">AWS S3 Configuration</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Bucket Name
                              </label>
                              <input
                                type="text"
                                value={settings?.integrations?.storage?.awsConfig?.bucketName || ''}
                                onChange={(e) => {
                                  const currentConfig = settings?.integrations?.storage?.awsConfig || {};
                                  updateNestedSettings('integrations', 'storage', 'awsConfig', {
                                    ...currentConfig,
                                    bucketName: e.target.value
                                  });
                                }}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                                placeholder="my-bucket-name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Region
                              </label>
                              <input
                                type="text"
                                value={settings?.integrations?.storage?.awsConfig?.region || ''}
                                onChange={(e) => {
                                  const currentConfig = settings?.integrations?.storage?.awsConfig || {};
                                  updateNestedSettings('integrations', 'storage', 'awsConfig', {
                                    ...currentConfig,
                                    region: e.target.value
                                  });
                                }}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                                placeholder="us-east-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="bg-gray-800/30 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-white mb-4">📧 Email Provider</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Provider
                        </label>
                        <select
                          value={settings?.integrations?.email?.provider || 'smtp'}
                          onChange={(e) => updateNestedSettings('integrations', 'email', 'provider', e.target.value)}
                          className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                        >
                          <option value="smtp">📨 SMTP</option>
                          <option value="sendgrid">🔷 SendGrid</option>
                          <option value="mailgun">🔶 Mailgun</option>
                        </select>
                      </div>

                      {settings?.integrations?.email?.provider === 'smtp' && (
                        <div className="mt-4 space-y-4 p-4 bg-gray-700/50 rounded-lg">
                          <h4 className="text-white font-medium">SMTP Configuration</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Host
                              </label>
                              <input
                                type="text"
                                value={settings?.integrations?.email?.smtpConfig?.host || ''}
                                onChange={(e) => {
                                  const currentConfig = settings?.integrations?.email?.smtpConfig || {};
                                  updateNestedSettings('integrations', 'email', 'smtpConfig', {
                                    ...currentConfig,
                                    host: e.target.value
                                  });
                                }}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                                placeholder="smtp.gmail.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Port
                              </label>
                              <input
                                type="number"
                                value={settings?.integrations?.email?.smtpConfig?.port || 587}
                                onChange={(e) => {
                                  const currentConfig = settings?.integrations?.email?.smtpConfig || {};
                                  updateNestedSettings('integrations', 'email', 'smtpConfig', {
                                    ...currentConfig,
                                    port: parseInt(e.target.value)
                                  });
                                }}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-netflix-red focus:ring-1 focus:ring-netflix-red"
                                placeholder="587"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-mx-4">
            <h3 className="text-xl font-bold text-white mb-4">{showConfirmDialog.title}</h3>
            <p className="text-gray-300 mb-6">{showConfirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog({ ...showConfirmDialog, isOpen: false })}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmDialog.onConfirm}
                className="px-4 py-2 bg-netflix-red hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;