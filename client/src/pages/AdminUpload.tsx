import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { uploadMovie } from '../services/api';

interface MovieFormData {
  title: string;
  description: string;
  genre: string;
  rating: number;
  year: number;
  duration: number;
  cast: string;
  director: string;
  featured: boolean;
  trending: boolean;
  topRated: boolean;
  video: FileList;
  thumbnail: FileList;
}

const AdminUpload: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<MovieFormData>();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const genres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ];

  const onSubmit = async (data: MovieFormData) => {
    try {
      setUploading(true);
      setMessage('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('genre', data.genre);
      formData.append('rating', data.rating.toString());
      formData.append('year', data.year.toString());
      formData.append('duration', data.duration.toString());
      formData.append('cast', data.cast);
      formData.append('director', data.director);
      formData.append('featured', data.featured.toString());
      formData.append('trending', data.trending.toString());
      formData.append('topRated', data.topRated.toString());
      formData.append('video', data.video[0]);
      formData.append('thumbnail', data.thumbnail[0]);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await uploadMovie(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.data.success) {
        setMessage('Movie uploaded successfully!');
        reset();
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Upload New Movie</h1>
            <p className="text-gray-400">Add a new movie to the WebFlix catalog</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('success') 
                ? 'bg-green-900 text-green-200' 
                : 'bg-red-900 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-netflix-red h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Movie Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="Enter movie title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Director
                </label>
                <input
                  type="text"
                  {...register('director')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="Enter director name"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                placeholder="Enter movie description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            {/* Movie Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Genre *
                </label>
                <select
                  {...register('genre', { required: 'Genre is required' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                >
                  <option value="">Select Genre</option>
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                {errors.genre && (
                  <p className="mt-1 text-sm text-red-400">{errors.genre.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register('rating', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Year *
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2030"
                  {...register('year', { 
                    required: 'Year is required',
                    valueAsNumber: true 
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="2024"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-400">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Duration (min) *
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('duration', { 
                    required: 'Duration is required',
                    valueAsNumber: true 
                  })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                  placeholder="120"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
                )}
              </div>
            </div>

            {/* Cast */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Cast (comma separated)
              </label>
              <input
                type="text"
                {...register('cast')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent"
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Movie Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  {...register('video', { required: 'Video file is required' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-netflix-red file:text-white hover:file:bg-red-600"
                />
                {errors.video && (
                  <p className="mt-1 text-sm text-red-400">{errors.video.message}</p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Thumbnail Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  {...register('thumbnail', { required: 'Thumbnail is required' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-netflix-red file:text-white hover:file:bg-red-600"
                />
                {errors.thumbnail && (
                  <p className="mt-1 text-sm text-red-400">{errors.thumbnail.message}</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-white text-sm font-medium mb-4">
                Categories
              </label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('featured')}
                    className="mr-2 h-4 w-4 text-netflix-red focus:ring-netflix-red border-gray-600 rounded"
                  />
                  <span className="text-white">Featured</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('trending')}
                    className="mr-2 h-4 w-4 text-netflix-red focus:ring-netflix-red border-gray-600 rounded"
                  />
                  <span className="text-white">Trending</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('topRated')}
                    className="mr-2 h-4 w-4 text-netflix-red focus:ring-netflix-red border-gray-600 rounded"
                  />
                  <span className="text-white">Top Rated</span>
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-netflix-red text-white py-3 px-6 rounded-md font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-netflix-red focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Movie'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-6 py-3 border border-gray-600 text-gray-400 rounded-md font-medium hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;