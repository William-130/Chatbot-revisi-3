'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type AvatarState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface VideoAvatarProps {
  state: AvatarState;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitles?: boolean;
  currentText?: string;
  onVideoLoad?: () => void;
  onVideoError?: (error: string) => void;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-32 h-32', 
  lg: 'w-48 h-48',
  xl: 'w-56 h-56'
};

export function VideoAvatar({
  state = 'idle',
  className = '',
  size = 'lg',
  showSubtitles = false,
  currentText = '',
  onVideoLoad,
  onVideoError
}: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [subtitleText, setSubtitleText] = useState<string>('');

  // Video sources mapping
  const videoSources = {
    idle: '/avatars/idle.mp4',
    listening: '/avatars/listening.mp4', 
    speaking: '/avatars/speaking.mp4',
    thinking: '/avatars/thinking.mp4'
  };

  // Update video when state changes
  useEffect(() => {
    const newVideoSrc = videoSources[state];
    if (newVideoSrc !== currentVideo) {
      setCurrentVideo(newVideoSrc);
      setIsLoading(true);
      setError('');
    }
  }, [state, currentVideo]);

  // Handle video loading
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      video.play().catch(err => {
        console.warn('Video autoplay failed:', err);
        setError('Autoplay failed - click to start');
      });
      onVideoLoad?.();
    };

    const handleError = (e: Event) => {
      const errorMsg = `Failed to load ${state} video`;
      setError(errorMsg);
      setIsLoading(false);
      onVideoError?.(errorMsg);
    };

    const handleCanPlay = () => {
      video.play().catch(err => {
        console.warn('Video play failed:', err);
      });
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Load the video
    video.src = currentVideo;
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentVideo, state, onVideoLoad, onVideoError]);

  // Handle subtitle text for speaking state
  useEffect(() => {
    if (state === 'speaking' && currentText) {
      setSubtitleText(currentText);
    } else {
      setSubtitleText('');
    }
  }, [state, currentText]);

  // Handle click to play if autoplay failed
  const handleVideoClick = () => {
    if (videoRef.current && error.includes('Autoplay failed')) {
      videoRef.current.play().then(() => {
        setError('');
      }).catch(err => {
        console.error('Manual play failed:', err);
      });
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Main Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 shadow-2xl border-4 border-gray-600">
        
        {/* Animated Border Ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: state === 'listening' 
              ? ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 20px rgba(59, 130, 246, 0)']
              : state === 'speaking'
              ? ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 20px rgba(34, 197, 94, 0)']
              : state === 'thinking'
              ? ['0 0 0 0 rgba(168, 85, 247, 0.4)', '0 0 0 20px rgba(168, 85, 247, 0)']
              : '0 0 0 0 rgba(107, 114, 128, 0.2)'
          }}
          transition={{
            duration: 1.5,
            repeat: state !== 'idle' ? Infinity : 0,
            ease: 'easeOut'
          }}
        />

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover cursor-pointer"
          loop
          muted
          playsInline
          onClick={handleVideoClick}
          style={{
            filter: error ? 'grayscale(100%) brightness(0.5)' : 'none'
          }}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-full"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-70 rounded-full"
            >
              <div className="text-center p-2">
                <div className="text-white text-xs font-medium">
                  {error.includes('Autoplay failed') ? '▶️' : '❌'}
                </div>
                <div className="text-white text-xs mt-1">
                  {error.includes('Autoplay failed') ? 'Click to play' : 'Video error'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State Indicator */}
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-3 h-3 rounded-full ${
              state === 'idle' ? 'bg-gray-400' :
              state === 'listening' ? 'bg-blue-500' :
              state === 'speaking' ? 'bg-green-500' :
              state === 'thinking' ? 'bg-purple-500' : 'bg-gray-400'
            }`}
          />
        </div>
      </div>

      {/* Subtitles */}
      <AnimatePresence>
        {showSubtitles && subtitleText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-64 max-w-sm"
          >
            <div className="bg-black bg-opacity-80 text-white text-sm px-3 py-2 rounded-lg text-center backdrop-blur-sm border border-gray-600">
              <motion.div
                key={subtitleText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium"
              >
                {subtitleText}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State Label (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {state}
          </div>
        </div>
      )}
    </div>
  );
}
