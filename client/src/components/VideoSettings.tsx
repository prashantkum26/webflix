import React, { useState, useRef, useEffect } from 'react';

interface VideoSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onQualityChange: (quality: string) => void;
  onSpeedChange: (speed: number) => void;
  currentQuality: string;
  currentSpeed: number;
}

const VideoSettings: React.FC<VideoSettingsProps> = ({
  isOpen,
  onClose,
  onQualityChange,
  onSpeedChange,
  currentQuality,
  currentSpeed
}) => {
  const [activeMenu, setActiveMenu] = useState<'main' | 'quality' | 'speed'>('main');
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveMenu('main');
    }
  }, [isOpen]);

  const qualityOptions = [
    { label: 'Auto', value: 'auto' },
    { label: '1080p', value: '1080p' },
    { label: '720p', value: '720p' },
    { label: '480p', value: '480p' },
    { label: '360p', value: '360p' }
  ];

  const speedOptions = [
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 }
  ];

  if (!isOpen) return null;

  const renderMainMenu = () => (
    <div className="space-y-1">
      <button
        onClick={() => setActiveMenu('quality')}
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <span>Quality</span>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">{currentQuality}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      
      <button
        onClick={() => setActiveMenu('speed')}
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <span>Playback Speed</span>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">{currentSpeed}x</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      <button
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between opacity-50 cursor-not-allowed"
        disabled
      >
        <span>Subtitles</span>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">Off</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      <button
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between opacity-50 cursor-not-allowed"
        disabled
      >
        <span>Audio</span>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">English</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  );

  const renderQualityMenu = () => (
    <div className="space-y-1">
      <button
        onClick={() => setActiveMenu('main')}
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center space-x-2 border-b border-gray-700 mb-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Quality</span>
      </button>
      
      {qualityOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onQualityChange(option.value);
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between ${
            currentQuality === option.value ? 'text-netflix-red' : ''
          }`}
        >
          <span>{option.label}</span>
          {currentQuality === option.value && (
            <svg className="w-4 h-4 text-netflix-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  const renderSpeedMenu = () => (
    <div className="space-y-1">
      <button
        onClick={() => setActiveMenu('main')}
        className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center space-x-2 border-b border-gray-700 mb-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Playback Speed</span>
      </button>
      
      {speedOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onSpeedChange(option.value);
            onClose();
          }}
          className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between ${
            currentSpeed === option.value ? 'text-netflix-red' : ''
          }`}
        >
          <span>{option.label}</span>
          {currentSpeed === option.value && (
            <svg className="w-4 h-4 text-netflix-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div
      ref={settingsRef}
      className="absolute bottom-16 right-6 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg min-w-64 shadow-2xl border border-gray-700 animate-fade-in-up"
    >
      <div className="py-2">
        {activeMenu === 'main' && renderMainMenu()}
        {activeMenu === 'quality' && renderQualityMenu()}
        {activeMenu === 'speed' && renderSpeedMenu()}
      </div>
    </div>
  );
};

export default VideoSettings;