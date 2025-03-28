import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PodcastEpisode } from '@/types';

export async function GET() {
  try {
    // Query to get the latest podcast episode from either table
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
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No episodes found' },
        { status: 404 }
      );
    }

    const episode: PodcastEpisode = result.rows[0];
    
    return NextResponse.json({ episode }, { status: 200 });
  } catch (error) {
    console.error('Error fetching latest podcast episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest podcast episode' },
      { status: 500 }
    );
  }
} 