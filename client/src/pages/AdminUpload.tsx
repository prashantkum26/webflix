import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { uploadMovie } from '../services/api';
import AdminNav from '../components/admin/AdminNav';

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
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const genres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
    'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ];

  const onSubmit = async (data: MovieFormData) => {
    try {
      setMessage('');
      setIsUploading(true);

      // Validate files
      if (!data.video?.[0] || !data.thumbnail?.[0]) {
        setMessage('Please select both video and thumbnail files');
        setIsUploading(false);
        return;
      }

      setMessage('Uploading movie...');

      // Prepare form data with all movie information and files
      const formData = new FormData();
      
      // Add movie data
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('genre', data.genre);
      formData.append('rating', data.rating.toString());
      formData.append('year', data.year.toString());
      formData.append('duration', data.duration.toString());
      formData.append('cast', JSON.stringify(data.cast.split(',').map(actor => actor.trim())));
      formData.append('director', data.director);
      formData.append('featured', data.featured.toString());
      formData.append('trending', data.trending.toString());
      formData.append('topRated', data.topRated.toString());
      
      // Add files
      formData.append('video', data.video[0]);
      formData.append('thumbnail', data.thumbnail[0]);

      // Upload movie with all data and files
      const response = await uploadMovie(formData);

      if (!response.data.success) {
        throw new Error('Failed to upload movie');
      }

      setMessage('Movie uploaded successfully!');
      reset();
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/admin/movies');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AdminNav />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">Upload New Movie</h1>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('success') || message.includes('successfully')
                ? 'bg-green-900 text-green-200' 
                : message.includes('Upload') || message.includes('files')
                ? 'bg-blue-900 text-blue-200'
                : 'bg-red-900 text-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span>{message}</span>
                <button
                  onClick={() => setMessage('')}
                  className="text-current hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Movie Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Movie Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter movie title"
                  disabled={isUploading}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                  Genre *
                </label>
                <select
                  {...register('genre', { required: 'Genre is required' })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isUploading}
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
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter movie description"
                disabled={isUploading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-300 mb-2">
                  Rating *
                </label>
                <input
                  {...register('rating', { 
                    required: 'Rating is required',
                    min: { value: 0, message: 'Rating must be at least 0' },
                    max: { value: 10, message: 'Rating must be at most 10' }
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0.0"
                  disabled={isUploading}
                />
                {errors.rating && (
                  <p className="mt-1 text-sm text-red-400">{errors.rating.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-300 mb-2">
                  Year *
                </label>
                <input
                  {...register('year', { 
                    required: 'Year is required',
                    min: { value: 1900, message: 'Year must be after 1900' },
                    max: { value: new Date().getFullYear() + 5, message: 'Year cannot be too far in the future' }
                  })}
                  type="number"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="2024"
                  disabled={isUploading}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-400">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  type="number"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="120"
                  disabled={isUploading}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-400">{errors.duration.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cast" className="block text-sm font-medium text-gray-300 mb-2">
                  Cast *
                </label>
                <input
                  {...register('cast', { required: 'Cast is required' })}
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Actor 1, Actor 2, Actor 3"
                  disabled={isUploading}
                />
                {errors.cast && (
                  <p className="mt-1 text-sm text-red-400">{errors.cast.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="director" className="block text-sm font-medium text-gray-300 mb-2">
                  Director *
                </label>
                <input
                  {...register('director', { required: 'Director is required' })}
                  type="text"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Director Name"
                  disabled={isUploading}
                />
                {errors.director && (
                  <p className="mt-1 text-sm text-red-400">{errors.director.message}</p>
                )}
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-300 mb-2">
                  Video File *
                </label>
                <input
                  {...register('video', { required: 'Video file is required' })}
                  type="file"
                  accept="video/*"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isUploading}
                />
                {errors.video && (
                  <p className="mt-1 text-sm text-red-400">{errors.video.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-300 mb-2">
                  Thumbnail Image *
                </label>
                <input
                  {...register('thumbnail', { required: 'Thumbnail is required' })}
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isUploading}
                />
                {errors.thumbnail && (
                  <p className="mt-1 text-sm text-red-400">{errors.thumbnail.message}</p>
                )}
              </div>
            </div>

            {/* Movie Flags */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-300">Movie Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    {...register('featured')}
                    type="checkbox"
                    className="mr-2 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    disabled={isUploading}
                  />
                  <span className="text-gray-300">Featured Movie</span>
                </label>

                <label className="flex items-center">
                  <input
                    {...register('trending')}
                    type="checkbox"
                    className="mr-2 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    disabled={isUploading}
                  />
                  <span className="text-gray-300">Trending</span>
                </label>

                <label className="flex items-center">
                  <input
                    {...register('topRated')}
                    type="checkbox"
                    className="mr-2 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                    disabled={isUploading}
                  />
                  <span className="text-gray-300">Top Rated</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isUploading}
                className={`px-8 py-3 rounded-md font-semibold transition-colors ${
                  isUploading
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload Movie'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;