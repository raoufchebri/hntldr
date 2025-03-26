import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PodcastEpisode } from '@/types';

export async function GET(
  request: NextRequest,
  {params}: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'Invalid episode ID' },
        { status: 400 }
      );
    }

    // Query to get a specific podcast episode by ID
    const result = await query(`
      SELECT id, start_date, end_date, summary, audio_url, created_at
      FROM hacker_news_summaries
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    const episode: PodcastEpisode = result.rows[0];
    
    return NextResponse.json({ episode }, { status: 200 });
  } catch (error) {
    console.error('Error fetching podcast episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast episode' },
      { status: 500 }
    );
  }
} 