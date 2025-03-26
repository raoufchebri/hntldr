'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PixelAudioPlayerProps {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function PixelAudioPlayer({ src, onPlay, onPause }: PixelAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastEventTimeRef = useRef<number>(0);
  const playPauseThreshold = 3000; // 3 seconds between play/pause events

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('PixelAudioPlayer: Setting up audio with source:', {
      src,
      currentSrc: audio.currentSrc,
    });

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log('PixelAudioPlayer: Audio metadata loaded:', {
        duration: audio.duration,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc,
      });
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleError = () => {
      setIsLoading(false);
      const errorMessage = audio.error?.message || 'Unknown error';
      setError(errorMessage);
      console.error('PixelAudioPlayer: Audio error:', {
        error: audio.error,
        code: audio.error?.code,
        message: errorMessage,
        currentSrc: audio.currentSrc,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src,
      });
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      console.log('PixelAudioPlayer: Audio can play:', {
        duration: audio.duration,
        readyState: audio.readyState,
        paused: audio.paused,
        currentSrc: audio.currentSrc,
      });
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      console.log('PixelAudioPlayer: Audio load started:', {
        currentSrc: audio.currentSrc,
        networkState: audio.networkState,
        src,
      });
    };

    const handleWaiting = () => {
      setIsLoading(true);
      console.log('PixelAudioPlayer: Audio waiting to load');
    };

    const handleStalled = () => {
      console.log('PixelAudioPlayer: Audio stalled:', {
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
    };

    // Events
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [src]);

  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTimeRef.current;

    try {
      setError(null);
      if (isPlaying) {
        audio.pause();
        console.log('PixelAudioPlayer: Audio paused');
        
        if (timeSinceLastEvent > playPauseThreshold && onPause) {
          onPause();
          lastEventTimeRef.current = now;
        }
      } else {
        setIsLoading(true);
        console.log('PixelAudioPlayer: Attempting to play audio...', {
          currentSrc: audio.currentSrc,
          readyState: audio.readyState,
          networkState: audio.networkState,
        });
        
        await audio.play();
        setIsLoading(false);
        console.log('PixelAudioPlayer: Audio playing');
        
        if (timeSinceLastEvent > playPauseThreshold && onPlay) {
          onPlay();
          lastEventTimeRef.current = now;
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setError(errorMessage);
      console.error('PixelAudioPlayer: Error toggling play state:', error);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  return (
    <div className="pixel-borders p-4 bg-muted">
      <audio ref={audioRef} preload="metadata">
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={togglePlay}
            disabled={isLoading}
            className={`pixel-button ${isLoading ? 'bg-gray-500' : 'bg-orange-500'} text-white w-20`}
          >
            {isLoading ? 'Loading...' : isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <div className="font-pixel text-primary">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {error && (
          <div className="text-red-500 font-pixel text-sm">
            Error: {error}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleTimeChange}
            className="w-full h-3 appearance-none bg-primary cursor-pointer"
            style={{ 
              backgroundSize: `${(currentTime / duration) * 100}% 100%`,
              backgroundImage: 'linear-gradient(to right, #f97316, #f97316)'
            }}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="font-pixel text-primary">🔈</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-3 appearance-none bg-primary cursor-pointer"
          />
          <span className="font-pixel text-primary">🔊</span>
        </div>
      </div>
    </div>
  );
} 