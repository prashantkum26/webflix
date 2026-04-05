import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // General Settings
  general: {
    siteName: {
      type: String,
      default: 'WebFlix',
      required: true,
      trim: true
    },
    siteDescription: {
      type: String,
      default: 'Your premier streaming platform',
      trim: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    allowRegistrations: {
      type: Boolean,
      default: true
    },
    defaultUserRole: {
      type: String,
      enum: ['user', 'moderator'],
      default: 'user'
    },
    maxUploadSize: {
      type: Number,
      default: 5000, // MB
      min: [1, 'Max upload size must be at least 1MB']
    },
    supportedVideoFormats: [{
      type: String,
      default: ['mp4', 'mov', 'avi', 'mkv']
    }]
  },

  // Security Settings
  security: {
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 1440, // minutes (24 hours)
      min: [5, 'Session timeout cannot be less than 5 minutes']
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: [1, 'Must allow at least 1 login attempt'],
      max: [20, 'Cannot allow more than 20 login attempts']
    },
    passwordMinLength: {
      type: Number,
      default: 8,
      min: [4, 'Password minimum length must be at least 4']
    },
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  },

  // Content Settings
  content: {
    autoPublish: {
      type: Boolean,
      default: false
    },
    moderationRequired: {
      type: Boolean,
      default: true
    },
    allowUserUploads: {
      type: Boolean,
      default: false
    },
    maxVideoLength: {
      type: Number,
      default: 300, // minutes (5 hours)
      min: [1, 'Max video length must be at least 1 minute']
    },
    thumbnailGeneration: {
      type: Boolean,
      default: true
    },
    videoQuality: [{
      type: String,
      enum: ['480p', '720p', '1080p', '4K'],
      default: ['480p', '720p', '1080p']
    }]
  },

  // Notification Settings
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: false
    },
    adminNotifications: {
      newUser: {
        type: Boolean,
        default: true
      },
      newUpload: {
        type: Boolean,
        default: true
      },
      systemErrors: {
        type: Boolean,
        default: true
      }
    }
  },

  // Appearance Settings
  appearance: {
    primaryColor: {
      type: String,
      default: '#E50914',
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Primary color must be a valid hex color']
    },
    theme: {
      type: String,
      enum: ['dark', 'light', 'auto'],
      default: 'dark'
    },
    logoUrl: {
      type: String,
      default: '/logo.png'
    },
    faviconUrl: {
      type: String,
      default: '/favicon.ico'
    },
    customCSS: {
      type: String,
      default: ''
    }
  },

  // Integration Settings
  integrations: {
    analytics: {
      enabled: {
        type: Boolean,
        default: false
      },
      googleAnalyticsId: {
        type: String,
        default: ''
      },
      trackUserActivity: {
        type: Boolean,
        default: true
      },
      retentionDays: {
        type: Number,
        default: 365,
        min: [30, 'Analytics retention must be at least 30 days'],
        max: [1095, 'Analytics retention cannot exceed 3 years']
      }
    },
    storage: {
      provider: {
        type: String,
        enum: ['local', 'aws', 'cloudinary'],
        default: 'local'
      },
      awsConfig: {
        bucketName: {
          type: String,
          default: ''
        },
        region: {
          type: String,
          default: ''
        },
        accessKey: {
          type: String,
          default: ''
        }
      }
    },
    email: {
      provider: {
        type: String,
        enum: ['smtp', 'sendgrid', 'mailgun'],
        default: 'smtp'
      },
      smtpConfig: {
        host: {
          type: String,
          default: ''
        },
        port: {
          type: Number,
          default: 587
        },
        username: {
          type: String,
          default: ''
        },
        password: {
          type: String,
          default: ''
        }
      }
    }
  },

  // Last updated info
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Singleton pattern - only one settings document should exist
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(updates, userId) {
  const settings = await this.getSettings();
  
  // Debug logging for server-side
  console.log('📝 Settings Update Request:', JSON.stringify(updates, null, 2));
  console.log('🔍 Current Settings Before Update:', JSON.stringify(settings.toObject(), null, 2));
  
  // Handle nested updates properly
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // For nested objects, merge deeply
      if (settings[key]) {
        Object.assign(settings[key], value);
      } else {
        settings[key] = value;
      }
    } else {
      // For primitive values and arrays, direct assignment
      settings[key] = value;
    }
  }
  
  // Set last modified info
  settings.lastModifiedBy = userId;
  
  const savedSettings = await settings.save();
  
  console.log('✅ Settings Updated Successfully:', JSON.stringify(savedSettings.toObject(), null, 2));
  
  return savedSettings;
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;