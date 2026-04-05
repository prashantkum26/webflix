import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true,
    index: true
  },
  
  // Plan details
  planType: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'trial'],
    required: [true, 'Plan type is required'],
    default: 'trial'
  },
  planName: {
    type: String,
    required: true
  },
  
  // Pricing
  monthlyPrice: {
    type: Number,
    required: true,
    min: [0, 'Monthly price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
  },
  
  // Status and dates
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'cancelled', 'expired'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true
  },
  
  // Trial information
  isTrialPeriod: {
    type: Boolean,
    default: false
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  hasUsedTrial: {
    type: Boolean,
    default: false
  },
  
  // Payment information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'free_trial'],
    default: 'free_trial'
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay', 'manual'],
    default: 'manual'
  },
  externalSubscriptionId: {
    type: String,
    default: null
  },
  
  // Plan features and limits
  features: {
    maxStreams: {
      type: Number,
      default: 1,
      min: [1, 'Must allow at least 1 stream']
    },
    hdEnabled: {
      type: Boolean,
      default: false
    },
    ultraHdEnabled: {
      type: Boolean,
      default: false
    },
    downloadsEnabled: {
      type: Boolean,
      default: false
    },
    maxDownloads: {
      type: Number,
      default: 0,
      min: [0, 'Max downloads cannot be negative']
    },
    adsEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Usage tracking
  usage: {
    streamsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Streams used cannot be negative']
    },
    downloadsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Downloads used cannot be negative']
    },
    bandwidthUsed: {
      type: Number,
      default: 0,
      min: [0, 'Bandwidth used cannot be negative']
    }
  },
  
  // Billing history references
  invoices: [{
    invoiceId: String,
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'pending'
    }
  }],
  
  // Auto-renewal settings
  autoRenewal: {
    type: Boolean,
    default: true
  },
  autoRenewalAttempts: {
    type: Number,
    default: 0,
    min: [0, 'Auto renewal attempts cannot be negative']
  },
  
  // Cancellation details
  cancellationDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    enum: ['user_request', 'payment_failure', 'violation', 'admin_action', 'expired'],
    default: null
  },
  cancellationNote: {
    type: String,
    default: null
  },
  
  // Grace period
  gracePeriodEnd: {
    type: Date,
    default: null
  },
  
  // Promotional codes and discounts
  promoCode: {
    type: String,
    default: null
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  discountEndDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ planType: 1 });
subscriptionSchema.index({ renewalDate: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for subscription age
subscriptionSchema.virtual('subscriptionAge').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const diffTime = now - start;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  return new Date() > this.endDate;
};

// Check if subscription is in trial period
subscriptionSchema.methods.isInTrial = function() {
  if (!this.isTrialPeriod || !this.trialEndDate) return false;
  return new Date() < this.trialEndDate;
};

// Check if user can stream based on current usage
subscriptionSchema.methods.canStream = function() {
  return this.status === 'active' && 
         !this.isExpired() && 
         this.usage.streamsUsed < this.features.maxStreams;
};

// Static method to get active subscriptions
subscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({
    status: 'active',
    endDate: { $gt: new Date() }
  }).populate('user', 'name email');
};

// Static method to get expiring subscriptions
subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $gte: new Date(), $lte: futureDate },
    autoRenewal: true
  }).populate('user', 'name email');
};

// Static method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$planType',
        count: { $sum: 1 },
        activeCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'active'] },
                { $gt: ['$endDate', new Date()] }
              ]},
              1,
              0
            ]
          }
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'active'] },
              '$monthlyPrice',
              0
            ]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware to handle subscription logic
subscriptionSchema.pre('save', async function(next) {
  // Set trial end date for trial subscriptions
  if (this.planType === 'trial' && !this.trialEndDate) {
    this.trialEndDate = new Date(this.startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days trial
    this.isTrialPeriod = true;
    this.endDate = this.trialEndDate;
  }
  
  // Set renewal date if not set
  if (!this.renewalDate) {
    this.renewalDate = new Date(this.endDate);
  }
  
  // Auto-expire if past end date
  if (new Date() > this.endDate && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;