export interface PodcastEpisode {
  id: string;
  start_date: string;
  end_date: string;
  summary: string;
  audio_url: string;
  created_at: string;
  title: string;
  episode_type: 'weekly' | 'daily';
}

export interface EpisodeSource {
  url: string;
  title: string;
  points: number;
  comments_count: number;
  created_at: string;
} 