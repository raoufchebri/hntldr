'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { PodcastEpisode as PodcastEpisodeType } from '@/types';
import PixelAudioPlayer from './PixelAudioPlayer';

interface EpisodeDetailProps {
  episodeId?: string;
  isLatest?: boolean;
}

async function getEpisodeData(episodeId: string, isLatest: boolean) {
  const url = isLatest 
    ? '/api/episodes/latest'
    : `/api/episodes/${episodeId}`;
    
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch episode: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.episode;
}

export default function EpisodeDetail({ episodeId, isLatest = false }: EpisodeDetailProps) {
  const [episode, setEpisode] = useState<PodcastEpisodeType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hnLinks, setHnLinks] = useState<{ id: string; title: string }[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const hasTrackedLoad = useRef(false);
  const clickedHNLinks = useRef<Set<string>>(new Set());
  const hasTrackedBackToHome = useRef(false);

  useEffect(() => {
    async function loadEpisode() {
      try {
        if (!episodeId && !isLatest) return;
        
        const data = await getEpisodeData(episodeId || '', isLatest);
        setEpisode(data);

        // Fetch the signed URL for the audio file
        const audioKey = data.audio_url.split('/').pop();
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
          error: audioResponse.ok ? null : audioData.error
        });

        if (!audioResponse.ok) {
          throw new Error(`Failed to fetch audio URL: ${audioResponse.statusText}`);
        }

        setAudioUrl(audioData.url);
        
        // Extract HN story IDs from the summary
        if (data.summary) {
          const regex = /https:\/\/news\.ycombinator\.com\/item\?id=(\d+)/g;
          const matches = [...data.summary.matchAll(regex)];
          
          // Extract titles for each HN story
          const extractedLinks = matches.map((match, index) => {
            const id = match[1];
            // Try to extract title from the summary
            const titleRegex = new RegExp(`\\d+\\. ([^\\(]+)\\s*\\(`, 'g');
            const titleMatches = [...data.summary.matchAll(titleRegex)];
            const title = titleMatches[index] ? titleMatches[index][1].trim() : `Hacker News Story ${index + 1}`;
            
            return { id, title };
          });
          
          setHnLinks(extractedLinks);
        }

        if (!hasTrackedLoad.current) {    
          hasTrackedLoad.current = true;
        }
      } catch (err) {
        console.error('Error fetching episode:', err);
        setError('Failed to load podcast episode. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEpisode();
  }, [episodeId, isLatest]);

  const handleHNLinkClick = (storyId: string) => {
    if (!clickedHNLinks.current.has(storyId)) {
      clickedHNLinks.current.add(storyId);
    }
  };

  const handleBackToHome = () => {
    if (!hasTrackedBackToHome.current) {
      hasTrackedBackToHome.current = true;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="pixel-borders p-8 bg-primary">
          <div className="font-pixel text-xl text-primary animate-pixel-pulse">
            Loading episode...
          </div>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="pixel-box bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-pixel" role="alert">
        <strong className="font-pixel-bold">Error: </strong>
        <span className="block sm:inline">{error || 'Episode not found'}</span>
        <div className="mt-4">
          <Link href="/" onClick={handleBackToHome}>
            <div className="pixel-button bg-orange-500 text-white inline-block">
              BACK TO HOME
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Format dates for display
  const startDate = new Date(episode.start_date).toLocaleDateString();
  const endDate = new Date(episode.end_date).toLocaleDateString();
  const createdAt = new Date(episode.created_at).toLocaleDateString();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-pixel-bold text-primary">
          {isLatest ? 'Latest Episode' : `Episode #${episode.id}`}
          <span className="ml-2 text-xs font-pixel text-muted">(Unofficial)</span>
        </h1>
        <Link href="/" onClick={handleBackToHome}>
          <div className="pixel-button bg-orange-500 text-white">
            ALL EPISODES
          </div>
        </Link>
      </div>
      
      <div className="pixel-box bg-primary">
        <div className="mb-4">
          <p className="text-sm font-pixel text-muted">
            Coverage period: {startDate} - {endDate}
          </p>
          <p className="text-xs font-pixel text-muted mt-1">
            Created: {createdAt}
          </p>
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
        
        {hnLinks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-pixel-bold mb-2 text-primary">
              Featured Stories
            </h3>
            <div className="pixel-borders p-4 bg-muted">
              <ul className="space-y-2">
                {hnLinks.map((link, index) => (
                  <li key={index} className="font-pixel">
                    <a 
                      href={`https://news.ycombinator.com/item?id=${link.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline"
                      onClick={() => handleHNLinkClick(link.id)}
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className="prose max-w-none">
          <h3 className="text-lg font-pixel-bold mb-2 text-primary">Transcript</h3>
          <div className="whitespace-pre-wrap font-pixel text-primary bg-muted p-4 pixel-borders">
            {episode.summary}
          </div>
          <p className="text-xs font-pixel text-muted mt-4">
            Note: This is an unofficial summary of content from Hacker News. HNTLDR is not affiliated with Hacker News or Y Combinator.
          </p>
        </div>
      </div>
    </div>
  );
} 