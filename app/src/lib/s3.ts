import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not configured');
}

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function getAudioFileUrl(audioUrl: string): Promise<string> {
  // Extract bucket and key from the full S3 URL
  const url = new URL(audioUrl);
  const bucket = url.hostname.split('.')[0];
  const key = url.pathname.substring(1); // Remove leading slash

  console.log('Getting signed URL for:', {
    bucket,
    key,
    hasAwsKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
  });

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: 'audio/mpeg',
    ResponseContentDisposition: 'inline',
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    
    console.log('Generated signed URL:', {
      url: signedUrl.split('?')[0], // Log only the base URL for security
      hasQueryParams: signedUrl.includes('?'),
      timestamp: new Date().toISOString(),
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
} 