import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PodcastEpisode } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching episode with ID:', id);
    
    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!id || !uuidRegex.test(id)) {
      console.error('Invalid episode ID format:', id);
      return NextResponse.json(
        { error: 'Invalid episode ID format' },
        { status: 400 }
      );
    }

    // Query to get a specific podcast episode by ID from either table
    const result = await query(`
      (SELECT id, start_date, end_date, summary, audio_url, created_at, 
        SUBSTRING(title, 2, LENGTH(title) - 2) as title, 
        'weekly' as episode_type
      FROM summary_weekly
      WHERE id = $1)
      UNION ALL
      (SELECT id, start_date, end_date, summary, audio_url, created_at, 
        SUBSTRING(title, 2, LENGTH(title) - 2) as title, 
        'daily' as episode_type
      FROM summary_daily
      WHERE id = $1)
    `, [id]);

    console.log('Query result:', {
      rowCount: result.rows.length,
      firstRow: result.rows[0] ? { 
        id: result.rows[0].id,
        title: result.rows[0].title,
        type: result.rows[0].episode_type
      } : null
    });

    if (result.rows.length === 0) {
      console.error('Episode not found:', id);
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    const episode: PodcastEpisode = result.rows[0];
    
    // Fetch sources for this episode
    const sourcesResult = await query(`
      SELECT url, title, points, comments_count, created_at
      FROM summary_sources
      WHERE summary_id = $1 AND summary_type = $2
      ORDER BY points DESC
    `, [id, episode.episode_type]);

    const sources = sourcesResult.rows;
    
    return NextResponse.json({ episode, sources }, { status: 200 });
  } catch (error) {
    console.error('Error fetching podcast episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch podcast episode' },
      { status: 500 }
    );
  }
} 