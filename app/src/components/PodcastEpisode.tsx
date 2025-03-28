import React, { useState, useEffect } from 'react';
import { PodcastEpisode as PodcastEpisodeType } from '@/types';
import PixelAudioPlayer from './PixelAudioPlayer';

interface PodcastEpisodeProps {
  episode: PodcastEpisodeType;
}

export default function PodcastEpisode({ episode }: PodcastEpisodeProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudioUrl() {
      try {
        console.log('Fetching signed URL for:', episode.audio_url);
        const response = await fetch(`/api/audio/${encodeURIComponent(episode.audio_url)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Failed to fetch audio URL: ${response.statusText}`);
        }

        setAudioUrl(data.url);
      } catch (err) {
        console.error('Error fetching audio URL:', err);
        setError('Failed to load audio. Please try again later.');
      }
    }

    fetchAudioUrl();
  }, [episode.audio_url]);

  // Format dates for display
  const startDate = new Date(episode.start_date).toLocaleDateString();
  const endDate = new Date(episode.end_date).toLocaleDateString();
  const createdAt = new Date(episode.created_at).toLocaleDateString();

  return (
    <div className="pixel-box bg-white dark:bg-gray-800 mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-pixel-bold mb-2 text-gray-900 dark:text-gray-100">HNTLDR Episode</h2>
        <p className="text-sm font-pixel text-gray-500 dark:text-gray-400">
          {startDate} - {endDate} (Created: {createdAt})
        </p>
      </div>
      
      <div className="mb-6">
        {error ? (
          <div className="text-red-500 font-pixel">{error}</div>
        ) : audioUrl ? (
          <PixelAudioPlayer src={audioUrl} />
        ) : (
          <div className="text-gray-500 font-pixel">Loading audio...</div>
        )}
      </div>
      
      <div className="prose max-w-none">
        <h3 className="text-lg font-pixel-bold mb-2 text-gray-800 dark:text-gray-200">Transcript</h3>
        <div className="whitespace-pre-wrap font-pixel text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 pixel-borders">
          {episode.summary}
        </div>
      </div>
    </div>
  );
} 