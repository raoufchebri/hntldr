'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

export default function PodcastList({ filter: initialFilter = 'all' }: PodcastListProps) {
  const [episodes, setEpisodes] = useState<PodcastEpisodeType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [episodesPerPage] = useState(10);
  const hasTrackedLoad = useRef(false);
  const clickedEpisodes = useRef<Set<string>>(new Set());

  // Calculate pagination values
  const indexOfLastEpisode = currentPage * episodesPerPage;
  const indexOfFirstEpisode = indexOfLastEpisode - episodesPerPage;
  const totalPages = Math.ceil(episodes.length / episodesPerPage);

  // Get current episodes
  const getCurrentEpisodes = () => {
    return episodes.slice(indexOfFirstEpisode, indexOfLastEpisode);
  };

  // Handle page changes
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterEpisodes = useCallback((allEpisodes: PodcastEpisodeType[]) => {
    if (filter === 'all') return allEpisodes;
    return allEpisodes.filter(episode => episode.episode_type === filter);
  }, [filter]);

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
  }, [filter, filterEpisodes]); // Add filterEpisodes to dependencies

  const handleEpisodeClick = (episodeId: string) => {
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
      <div className="flex justify-between items-center mb-6">
        <p className="text-xs font-pixel text-muted">
          All summaries are unofficial and not affiliated with Hacker News or Y Combinator.
        </p>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`pixel-button ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-primary text-primary'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('weekly')}
            className={`pixel-button ${filter === 'weekly' ? 'bg-orange-500 text-white' : 'bg-primary text-primary'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setFilter('daily')}
            className={`pixel-button ${filter === 'daily' ? 'bg-orange-500 text-white' : 'bg-primary text-primary'}`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Episode List */}
      {getCurrentEpisodes().map((episode, index) => {
        // Format dates for display
        const startDate = new Date(episode.start_date).toLocaleDateString();
        const endDate = new Date(episode.end_date).toLocaleDateString();
        const createdAt = new Date(episode.created_at).toLocaleDateString();
        
        // Calculate episode number (total - current index)
        const episodeNumber = episodes.length - (indexOfFirstEpisode + index);
        
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
                    {episode.title}
                    <span className="ml-2 text-xs font-pixel text-muted">
                      (Episode #{episodeNumber} • {episode.episode_type})
                    </span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`pixel-button ${
              currentPage === 1 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-primary hover:bg-orange-500 hover:text-white'
            }`}
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`pixel-button ${
                  currentPage === pageNum
                    ? 'bg-orange-500 text-white'
                    : 'bg-primary hover:bg-orange-500 hover:text-white'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`pixel-button ${
              currentPage === totalPages
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primary hover:bg-orange-500 hover:text-white'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 