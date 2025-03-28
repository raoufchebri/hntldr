import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addToAudience } from '@/lib/resend';

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
  formData.append('response', token);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();
  return outcome.success;
}

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();
    
    // Basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    if (!token) {
      return NextResponse.json(
        { message: 'Captcha token is required' },
        { status: 400 }
      );
    }

    const isValidToken = await verifyTurnstileToken(token);
    if (!isValidToken) {
      return NextResponse.json(
        { message: 'Invalid captcha token' },
        { status: 400 }
      );
    }

    // Insert new subscriber or update existing one
    const result = await query(
      `INSERT INTO subscribers (email, status) 
       VALUES ($1, 'active') 
       ON CONFLICT (email) 
       DO UPDATE SET 
         status = 'active',
         updated_at = CURRENT_TIMESTAMP
       RETURNING status, updated_at = created_at as is_new`,
      [email]
    );

    const { is_new } = result.rows[0];

    // Add or update contact in Resend audience
    await addToAudience(email);
    
    // Return appropriate message based on whether this was a new subscription or reactivation
    return NextResponse.json(
      { 
        message: is_new 
          ? 'Successfully subscribed to HNTLDR updates!' 
          : 'Your subscription has been reactivated!'
      },
      { status: is_new ? 201 : 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    
    return NextResponse.json(
      { message: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
} 