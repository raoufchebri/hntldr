'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { PodcastEpisode as PodcastEpisodeType } from '@/types';

// Cache for episodes list
declare global {
  interface Window {
    _episodesListCache?: {
      episodes: PodcastEpisodeType[];
      timestamp: number;
    };
  }
}

// Cache expiration time (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

interface PodcastListProps {
  filter?: 'all' | 'weekly' | 'daily';
}

export default function PodcastList({ filter = 'all' }: PodcastListProps) {
  const [episodes, setEpisodes] = useState<PodcastEpisodeType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedLoad = useRef(false);
  const clickedEpisodes = useRef<Set<number>>(new Set());

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        // Check if we have a valid cached version in the global window object
        const now = Date.now();
        if (typeof window !== 'undefined' && 
            window._episodesListCache && 
            (now - window._episodesListCache.timestamp < CACHE_EXPIRATION)) {
          
          // Use cached data
          setEpisodes(filterEpisodes(window._episodesListCache.episodes));
          setLoading(false);
          
          // Only track the load once per session
          if (!hasTrackedLoad.current) {
            hasTrackedLoad.current = true;
          }
          
          return;
        }
        
        // Fetch from API if not cached or cache expired
        const response = await fetch('/api/episodes');
        
        if (!response.ok) {
          throw new Error('Failed to fetch episodes');
        }
        
        const data = await response.json();
        setEpisodes(filterEpisodes(data.episodes));
        
        // Only track the load once per session
        if (!hasTrackedLoad.current) {
          hasTrackedLoad.current = true;
        }
        
        // Cache the result in the global window object
        if (typeof window !== 'undefined') {
          window._episodesListCache = {
            episodes: data.episodes,
            timestamp: now
          };
        }
      } catch (err) {
        console.error('Error fetching episodes:', err);
        setError('Failed to load podcast episodes. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEpisodes();
  }, [filter]); // Add filter to dependencies

  const filterEpisodes = (allEpisodes: PodcastEpisodeType[]) => {
    if (filter === 'all') return allEpisodes;
    
    return allEpisodes.filter(episode => {
      const startDate = new Date(episode.start_date);
      const endDate = new Date(episode.end_date);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filter === 'weekly') {
        return daysDiff >= 7;
      } else {
        return daysDiff < 7;
      }
    });
  };

  const handleEpisodeClick = (episodeId: number) => {
    // Only track each episode click once per session
    if (!clickedEpisodes.current.has(episodeId)) {
      clickedEpisodes.current.add(episodeId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="pixel-borders p-8 bg-primary">
          <div className="font-pixel text-xl text-primary animate-pixel-pulse">
            Loading episodes...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pixel-box bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-pixel" role="alert">
        <strong className="font-pixel-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="pixel-box bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100 font-pixel" role="alert">
        <span className="block sm:inline">No podcast episodes found.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-pixel text-muted mb-4">
        All summaries are unofficial and not affiliated with Hacker News or Y Combinator.
      </p>
      {episodes.map((episode) => {
        // Format dates for display
        const startDate = new Date(episode.start_date).toLocaleDateString();
        const endDate = new Date(episode.end_date).toLocaleDateString();
        const createdAt = new Date(episode.created_at).toLocaleDateString();
        
        return (
          <Link 
            href={`/episode/${episode.id}`} 
            key={episode.id}
            onClick={() => handleEpisodeClick(episode.id)}
          >
            <div className="pixel-box bg-primary hover:bg-muted cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-pixel-bold text-primary">
                    HNTLDR Episode #{episode.id}
                    <span className="ml-2 text-xs font-pixel text-muted">(Unofficial)</span>
                  </h2>
                  <p className="text-sm font-pixel text-muted">
                    {startDate} - {endDate}
                  </p>
                </div>
                <div className="font-pixel text-sm text-orange-500">
                  Listen →
                </div>
              </div>
              <div className="mt-2 text-xs font-pixel text-muted">
                Created: {createdAt}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 