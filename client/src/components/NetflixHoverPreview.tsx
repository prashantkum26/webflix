import React, { useRef, useState } from 'react';
import type { Movie } from '../types';

interface NetflixHoverPreviewProps {
  movie: Movie;
  onPlay: (e: React.MouseEvent) => void;
  onMoreInfo: (e: React.MouseEvent) => void;
  position: { x: number; y: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const NetflixHoverPreview: React.FC<NetflixHoverPreviewProps> = ({
  movie,
  onPlay,
  onMoreInfo,
  position,
  onMouseEnter,
  onMouseLeave
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  // const watchProgress = Math.floor(Math.random() * 80) + 10; // Random progress for demo
  const totalDuration = movie.duration || 120;

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  return (
    <div 
         className="fixed bg-netflix-black rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-[100] w-80" 
         style={{ 
           top: `${position.y}px`, 
           left: `${position.x}px`, 
           transform: 'translate(-50%, -50%)',
           animation: 'none'
         }}
         onMouseEnter={onMouseEnter}
         onMouseLeave={onMouseLeave}
    >
      {/* Auto-playing Video Preview */}
      <div className="relative h-44">
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className="w-full h-full object-cover"
          poster={movie.thumbnail || `https://via.placeholder.com/400x180/374151/e50914?text=${encodeURIComponent(movie.title)}`}
        >
          <source src={movie.videoUrl || "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4"} type="video/mp4" />
          {/* Fallback image if video fails */}
          <img
            src={movie.thumbnail || `https://via.placeholder.com/400x180/374151/e50914?text=${encodeURIComponent(movie.title)}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        </video>
        
        {/* Dark overlay for better button visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        {/* Volume icon for preview - Clickable */}
        <button 
          onClick={toggleMute}
          className="absolute top-2 right-2 hover:scale-110 transition-transform"
        >
          <div className="bg-black bg-opacity-50 rounded-full p-1">
            {isMuted ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Large Play Button */}
            <button 
              onClick={onPlay}
              className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>

            {/* Add to My List */}
            <button className="bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors border-2 border-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {/* Like Button */}
            <button className="bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors border-2 border-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
            </button>
          </div>

          {/* More Info Button */}
          <button 
            onClick={onMoreInfo}
            className="bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 transition-colors border-2 border-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Episode/Movie Info */}
        <div className="mb-3">
          <h4 className="text-white font-semibold text-base mb-1">
            S1:E1 "{movie.title}"
          </h4>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            {/* <div className="flex-1 h-1 bg-gray-600 rounded-full">
              <div 
                className="h-full bg-netflix-red rounded-full"
                style={{ width: `${watchProgress}%` }}
              />
            </div>
            <span className="text-gray-300 text-xs">
              {Math.floor(totalDuration * (watchProgress / 100))} of {totalDuration}m
            </span> */}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-2 text-xs mb-2">
          <span className="bg-green-600 text-white px-2 py-1 rounded font-bold">
            {Math.floor((movie.rating || 0) * 10)}% Match
          </span>
          <span className="text-white">{movie.year}</span>
          <span className="border border-gray-400 text-gray-300 px-1 py-1 rounded">HD</span>
        </div>

        {/* Genres */}
        {movie.genre && movie.genre.length > 0 && (
          <div className="text-gray-300 text-xs">
            {movie.genre.slice(0, 3).join(' • ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default NetflixHoverPreview;