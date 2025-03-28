import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PodcastEpisode } from '@/types';

export async function GET() {
  try {
    // Query to get all podcast episodes ordered by creation date (newest first)
    const result = await query(`
      SELECT id, start_date, end_date, summary, audio_url, created_at
      FROM hacker_news_summaries
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