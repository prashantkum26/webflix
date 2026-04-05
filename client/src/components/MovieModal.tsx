import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '../types';

interface MovieModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

const MovieModal: React.FC<MovieModalProps> = ({ movie, isOpen, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePlay = () => {
    onClose();
    navigate(`/watch/${movie._id}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-80 backdrop-blur-sm overflow-y-auto py-8"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl mx-4 bg-netflix-black rounded-lg overflow-hidden animate-modal-enter my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Section */}
        <div className="relative h-64 md:h-96">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${movie.thumbnail || `https://via.placeholder.com/800x450/374151/e50914?text=${encodeURIComponent(movie.title)}`}')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent"></div>
          </div>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {movie.title}
            </h1>
            
            {/* Metadata */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
                {Math.floor((movie.rating || 0) * 10)}% Match
              </span>
              <span className="text-white font-semibold">{movie.year}</span>
              <span className="border border-gray-400 text-white px-2 py-1 text-sm rounded">HD</span>
              <span className="text-white">{movie.duration} min</span>
              {movie.genre && movie.genre.length > 0 && (
                <span className="text-gray-300">{movie.genre.join(', ')}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlay}
                className="bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </button>

              <button className="netflix-button p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              <button className="netflix-button p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>

              <button className="netflix-button p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Description */}
            <div className="md:col-span-2">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {movie.description}
              </p>
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <span className="text-gray-400 font-semibold">Cast: </span>
                  <span className="text-gray-300">{movie.cast.slice(0, 3).join(', ')}</span>
                  {movie.cast.length > 3 && <span className="text-gray-400">, and more</span>}
                </div>
              )}
              
              {movie.director && (
                <div>
                  <span className="text-gray-400 font-semibold">Director: </span>
                  <span className="text-gray-300">{movie.director}</span>
                </div>
              )}

              {movie.genre && movie.genre.length > 0 && (
                <div>
                  <span className="text-gray-400 font-semibold">Genres: </span>
                  <span className="text-gray-300">{movie.genre.join(', ')}</span>
                </div>
              )}

              <div>
                <span className="text-gray-400 font-semibold">Rating: </span>
                <span className="text-gray-300">★ {movie.rating || 'Not rated'}</span>
              </div>

              <div>
                <span className="text-gray-400 font-semibold">Duration: </span>
                <span className="text-gray-300">{movie.duration} minutes</span>
              </div>
            </div>
          </div>

          {/* Similar Movies Section */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-6">More Like This</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Placeholder for similar movies */}
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="bg-gray-800 aspect-video rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Similar Movie {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;