'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { PodcastEpisode } from '@/types';
import PixelAudioPlayer from './PixelAudioPlayer';

// Use the same cache as EpisodeDetail to avoid duplicate requests
declare global {
  interface Window {
    _latestEpisodeCache?: {
      episode: PodcastEpisode;
      timestamp: number;
    };
  }
}

// Cache expiration time (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

export default function LatestEpisodePlayer() {
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const hasTrackedLoad = useRef(false);
  const hasTrackedViewDetails = useRef(false);

  useEffect(() => {
    async function fetchLatestEpisode() {
      try {
        // Check if we have a valid cached version in the global window object
        const now = Date.now();
        if (typeof window !== 'undefined' && 
            window._latestEpisodeCache && 
            (now - window._latestEpisodeCache.timestamp < CACHE_EXPIRATION)) {
          
          // Use cached data
          setEpisode(window._latestEpisodeCache.episode);
          
          // Fetch the signed URL for the audio file
          const audioKey = window._latestEpisodeCache.episode.audio_url.split('/').pop();
          if (!audioKey) {
            throw new Error('Invalid audio URL format');
          }
          console.log('Fetching signed URL for:', audioKey);
          
          const audioResponse = await fetch(`/api/audio/${encodeURIComponent(audioKey)}`);
          const audioData = await audioResponse.json();
          
          console.log('Received audio URL:', {
            success: audioResponse.ok,
            status: audioResponse.status,
            hasUrl: !!audioData.url,
          });

          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio URL: ${audioResponse.statusText}`);
          }

          setAudioUrl(audioData.url);
          setLoading(false);
          
          // Only track the load once per session
          if (!hasTrackedLoad.current) {
            hasTrackedLoad.current = true;
          }
          
          return;
        }
        
        // Fetch from API if not cached or cache expired
        const response = await fetch('/api/episodes/latest');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch latest episode: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEpisode(data.episode);
        
        // Fetch the signed URL for the audio file
        const audioKey = data.episode.audio_url.split('/').pop();
        if (!audioKey) {
          throw new Error('Invalid audio URL format');
        }
        console.log('Fetching signed URL for:', audioKey);
        
        const audioResponse = await fetch(`/api/audio/${encodeURIComponent(audioKey)}`);
        const audioData = await audioResponse.json();
        
        console.log('Received audio URL:', {
          success: audioResponse.ok,
          status: audioResponse.status,
          hasUrl: !!audioData.url,
        });

        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio URL: ${audioResponse.statusText}`);
        }

        setAudioUrl(audioData.url);
        
        // Only track the load once per session
        if (!hasTrackedLoad.current) {
          hasTrackedLoad.current = true;
        }
        
        // Cache the result in the global window object
        if (typeof window !== 'undefined') {
          window._latestEpisodeCache = {
            episode: data.episode,
            timestamp: now
          };
        }
      } catch (err) {
        console.error('Error in fetchLatestEpisode:', err);
        setError('Failed to load latest episode. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestEpisode();
  }, []);

  const handleViewDetails = () => {
    if (episode && !hasTrackedViewDetails.current) {
      hasTrackedViewDetails.current = true;
    }
  };

  if (loading) {
    return (
      <div className="pixel-borders p-4 bg-primary">
        <div className="font-pixel text-primary animate-pixel-pulse">
          Loading latest episode...
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="pixel-box bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-pixel" role="alert">
        <span className="block sm:inline">{error || 'Episode not found'}</span>
      </div>
    );
  }

  // Format dates for display
  const startDate = new Date(episode.start_date).toLocaleDateString();
  const endDate = new Date(episode.end_date).toLocaleDateString();

  return (
    <div className="pixel-box bg-primary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-pixel-bold text-primary">
            Latest Episode: #{episode.id}
            <span className="ml-2 text-xs font-pixel text-muted">(Unofficial)</span>
          </h3>
          <p className="text-sm font-pixel text-muted">
            {startDate} - {endDate}
          </p>
        </div>
        <Link href="/latest" onClick={handleViewDetails}>
          <div className="pixel-button bg-orange-500 text-white">
            VIEW DETAILS
          </div>
        </Link>
      </div>
      
      <div className="mb-6">
        {audioUrl && (
          <PixelAudioPlayer 
            src={audioUrl}
            onPlay={() => {}}
            onPause={() => {}}
          />
        )}
      </div>
    </div>
  );
} 