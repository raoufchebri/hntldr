import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PodcastEpisode } from '@/types';

export async function GET() {
  try {
    // Query to get all podcast episodes from both tables ordered by end_date
    const result = await query(`
      (SELECT id, start_date, end_date, summary, audio_url, created_at, 
        SUBSTRING(title, 2, LENGTH(title) - 2) as title, 
        'weekly' as episode_type
      FROM summary_weekly)
      UNION ALL
      (SELECT id, start_date, end_date, summary, audio_url, created_at, 
        SUBSTRING(title, 2, LENGTH(title) - 2) as title, 
        'daily' as episode_type
      FROM summary_daily)
      ORDER BY end_date DESC
    `);

    const episodes: PodcastEpisode[] = result.rows;
    
    return NextResponse.json({ episodes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching podcast episodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast episodes' },
      { status: 500 }
    );
  }
} 