'use client';

import { useRef, useState } from 'react';

interface AudioPlayerProps {
  src: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function AudioPlayer({ src, onPlay, onPause }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-100">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />
      <button
        onClick={togglePlayPause}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
} 