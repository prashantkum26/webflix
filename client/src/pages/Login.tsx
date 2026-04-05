import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
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
      
      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black bg-opacity-75 p-16 rounded-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="text-netflix-red font-bold text-3xl">
              WEBFLIX
            </Link>
          </div>

          <h1 className="text-white text-3xl font-bold mb-8">Sign In</h1>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-400">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <a href="#" className="text-gray-400 hover:text-white">
                Need help?
              </a>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-gray-400 text-sm">
            New to WebFlix?{' '}
            <Link to="/register" className="text-white hover:underline font-medium">
              Sign up now
            </Link>
          </div>

          {/* Terms */}
          <div className="mt-4 text-xs text-gray-500">
            This page is protected by Google reCAPTCHA to ensure you're not a bot.{' '}
            <a href="#" className="text-blue-500 hover:underline">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;