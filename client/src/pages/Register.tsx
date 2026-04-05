import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const { register: registerUser, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      await registerUser(data.name, data.email, data.password);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{
          backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/fc164b4b-f085-44ee-bb7f-ec7df8539eff/d23a1608-5568-4d97-9d2c-630566a3a838/US-en-20230814-popsignuptwoweeks-perspective_alpha_website_large.jpg')`
        }}
      />
      
      {/* Register Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black bg-opacity-75 p-16 rounded-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="text-netflix-red font-bold text-3xl">
              WEBFLIX
            </Link>
          </div>

          <h1 className="text-white text-3xl font-bold mb-8">Sign Up</h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Name cannot exceed 50 characters'
                  }
                })}
                type="text"
                placeholder="Full name"
                className={`w-full p-4 bg-netflix-gray text-white rounded border-0 focus:outline-none focus:ring-2 focus:ring-netflix-red ${
                  errors.name ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email'
                  }
                })}
                type="email"
                placeholder="Email address"
                className={`w-full p-4 bg-netflix-gray text-white rounded border-0 focus:outline-none focus:ring-2 focus:ring-netflix-red ${
                  errors.email ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type="password"
                placeholder="Password"
                className={`w-full p-4 bg-netflix-gray text-white rounded border-0 focus:outline-none focus:ring-2 focus:ring-netflix-red ${
                  errors.password ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => 
                    value === password || 'Passwords do not match'
                })}
                type="password"
                placeholder="Confirm password"
                className={`w-full p-4 bg-netflix-gray text-white rounded border-0 focus:outline-none focus:ring-2 focus:ring-netflix-red ${
                  errors.confirmPassword ? 'ring-2 ring-red-500' : ''
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-netflix-red text-white py-4 rounded font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Sign Up'
              )}
            </button>

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-500 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-500 hover:underline">
                Privacy Policy
              </a>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline font-medium">
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;