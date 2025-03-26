import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { removeFromAudience } from '@/lib/resend';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Subscriber ID is required' },
        { status: 400 }
      );
    }

    // Check if subscriber exists and update their status
    const result = await query(
      'UPDATE subscribers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING email',
      ['inactive', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'Subscriber not found' },
        { status: 404 }
      );
    }

    const { email } = result.rows[0];

    // Remove from Resend audience
    await removeFromAudience(email);

    return NextResponse.json(
      { 
        message: 'Successfully unsubscribed',
        email
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    
    return NextResponse.json(
      { message: 'Failed to unsubscribe. Please try again later.' },
      { status: 500 }
    );
  }
} 