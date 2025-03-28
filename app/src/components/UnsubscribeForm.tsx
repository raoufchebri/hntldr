'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UnsubscribeFormProps {
  subscriberId?: string;
}

export default function UnsubscribeForm({ subscriberId }: UnsubscribeFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!subscriberId) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. Please check your email and try again.');
      return;
    }

    const unsubscribe = async () => {
      try {
        setStatus('loading');
        const response = await fetch(`/api/unsubscribe?id=${subscriberId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to unsubscribe');
        }

        setEmail(data.email || '');
        setStatus('success');
        setMessage(data.message || 'You have been successfully unsubscribed.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to unsubscribe. Please try again.');
      }
    };

    unsubscribe();
  }, [subscriberId]);

  return (
    <div className="pixel-box bg-primary p-6">
      {status === 'loading' && (
        <div className="text-center">
          <p className="font-pixel text-primary animate-pulse">Processing your request...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center space-y-4">
          <p className="font-pixel text-primary">
            {email && `${email} has been`} successfully unsubscribed from HNTLDR updates.
          </p>
          <p className="font-pixel text-muted text-sm">
            Changed your mind?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-orange-500 hover:underline"
            >
              Subscribe again
            </button>
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center space-y-4">
          <p className="font-pixel text-red-500">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="pixel-button bg-orange-500 text-white"
          >
            RETURN HOME
          </button>
        </div>
      )}
    </div>
  );
} 