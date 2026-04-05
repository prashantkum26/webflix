import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieAPI } from '../services/api';
import type { Movie } from '../types';
import NetflixVideoPlayer from '../components/NetflixVideoPlayer';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        setError('Movie ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const movieData = await movieAPI.getMovie(id);
        console.log(movieData.videoUrl)
        setMovie(movieData);
      } catch (error: any) {
        console.error('Error fetching movie:', error);
        setError(error.response?.data?.message || 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleGoBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mx-auto mb-4"></div>
          <p className="text-white">Loading movie...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4">Movie Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The movie you\'re looking for doesn\'t exist.'}</p>
          <button 
            onClick={handleGoBack}
            className="bg-netflix-red text-white px-6 py-3 rounded-md font-medium hover:bg-red-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black">
      {movie.videoUrl ? (
        <NetflixVideoPlayer
          src={movie.videoUrl}
          poster={movie.thumbnail}
          title={movie.title}
          onBack={handleGoBack}
        />
      ) : (
        <div className="w-full h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Video Not Available</h3>
            <p className="text-gray-400">This movie doesn't have a video file uploaded yet.</p>
            <button 
              onClick={handleGoBack}
              className="bg-netflix-red text-white px-6 py-3 rounded-md font-medium hover:bg-red-600 transition-colors mt-4"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;