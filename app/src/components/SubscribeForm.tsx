'use client';

import React, { useState } from 'react';
import { Turnstile } from 'next-turnstile';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    // Verify Turnstile token
    if (!token) {
      setStatus('error');
      setMessage('Please complete the captcha.');
      return;
    }
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      setStatus('success');
      setMessage(data.message || 'Successfully subscribed!');
      setEmail('');
      setToken(null);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        if (status === 'success') {
          setStatus('idle');
          setMessage('');
        }
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    }
  };
  
  return (
    <div className="pixel-box bg-primary">
      <h3 className="text-lg font-pixel-bold text-primary mb-3">Subscribe for Updates</h3>
      <p className="text-sm font-pixel text-muted mb-4">
        Get notified when new episodes are released.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-grow px-3 py-2 font-pixel text-primary bg-muted border-2 border-dashed border-primary focus:border-orange-500 outline-none"
            disabled={status === 'loading'}
            aria-label="Email address"
          />
          <button
            type="submit"
            className={`pixel-button ${status === 'loading' ? 'bg-gray-400' : 'bg-orange-500'} text-white`}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
          </button>
        </div>

        <div className="mt-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
            onVerify={(token: string) => setToken(token)}
            onError={() => {
              setStatus('error');
              setMessage('Failed to load captcha. Please try again.');
            }}
          />
        </div>
        
        {message && (
          <div className={`text-sm font-pixel ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
} 