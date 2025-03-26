import * as React from 'react';

interface EmailTemplateProps {
  episodeNumber?: string;
  episodeDate?: string;
  recipientEmail?: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  episodeNumber = 'Latest',
  episodeDate = new Date().toLocaleDateString(),
  recipientEmail,
}) => (
  <div style={{
    fontFamily: 'sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f8f8f8',
    color: '#333',
  }}>
    <div style={{
      textAlign: 'center',
      marginBottom: '30px',
    }}>
      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        margin: '0 0 5px',
        color: '#333',
        fontFamily: 'monospace',
      }}>HNTLDR</h1>
      <p style={{
        fontSize: '16px',
        margin: '0',
        color: '#666',
        fontFamily: 'monospace',
      }}>
        Hacker News Too Long; Didn&apos;t Read - Unofficial Audio Summaries
      </p>
    </div>

    <div style={{
      border: '3px dashed #333',
      padding: '20px',
      backgroundColor: '#fff',
      marginBottom: '20px',
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        margin: '0 0 15px',
        color: '#333',
        fontFamily: 'monospace',
        borderBottom: '2px dashed #333',
        paddingBottom: '10px',
      }}>
        Episode #{episodeNumber} - {episodeDate}
      </h2>
      
      <p style={{
        fontSize: '16px',
        margin: '0 0 20px',
        color: '#666',
        fontFamily: 'monospace',
      }}>
        A new episode of HNTLDR is now available! Click the button below to listen.
      </p>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href="https://hntldr.news/latest" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#f97316',
            color: 'white',
            textDecoration: 'none',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '16px',
            border: '3px solid #333',
            boxShadow: '3px 3px 0 #333',
          }}
        >
          ▶ PLAY LATEST EPISODE
        </a>
      </div>
    </div>
    
    <div style={{
      fontSize: '14px',
      color: '#999',
      textAlign: 'center',
      marginTop: '30px',
      fontFamily: 'monospace',
    }}>
      <p>
        <strong>DISCLAIMER:</strong> HNTLDR is an <strong>unofficial</strong> project and is <strong>not affiliated</strong> with Hacker News, Y Combinator, or any of their properties.
      </p>
      <p style={{ fontSize: '12px', marginTop: '10px' }}>
        You&apos;re receiving this email because you subscribed to HNTLDR updates.
        {recipientEmail && (
          <span> Sent to: {recipientEmail}</span>
        )}
      </p>
      <p style={{ fontSize: '12px', marginTop: '5px' }}>
        <a 
          href="[unsubscribe_url]" 
          style={{ color: '#666', textDecoration: 'underline' }}
        >
          Unsubscribe
        </a>
      </p>
    </div>
  </div>
); 