import { NextRequest, NextResponse } from 'next/server';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getAudioFileUrl } from '@/lib/s3';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Add credential sanitization and logging
const sanitizeAndValidateCredentials = () => {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are missing');
  }

  // Check for and log any non-standard characters
  const invalidCharsRegex = /[^\x20-\x7E]/g; // Only allow printable ASCII
  
  const accessKeyHasInvalid = invalidCharsRegex.test(accessKeyId);
  const secretKeyHasInvalid = invalidCharsRegex.test(secretAccessKey);

  console.log('Credential validation:', {
    accessKeyLength: accessKeyId.length,
    secretKeyLength: secretAccessKey.length,
    accessKeyHasInvalid,
    secretKeyHasInvalid,
  });

  // Remove any whitespace or non-printable characters
  return {
    accessKeyId: accessKeyId.trim().replace(invalidCharsRegex, ''),
    secretAccessKey: secretAccessKey.trim().replace(invalidCharsRegex, '')
  };
};

// Update the S3Client initialization
const credentials = sanitizeAndValidateCredentials();
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: credentials,
  logger: console,
});

// Log the initial configuration
console.log('S3 Client Configuration:', {
  region: s3Client.config.region(),
  bucket: process.env.S3_BUCKET_NAME || 'hntldr-audio-232321419316',
  hasCredentials: !!accessKeyId && !!secretAccessKey,
});
export async function GET(
  _: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: Promise<any> }
) {
  try {
    const resolvedParams = await context.params;
    const key = decodeURIComponent(resolvedParams.key);
    console.log('API: Fetching audio URL for key:', key);

    // First, check if the object exists
    const bucket = process.env.S3_BUCKET_NAME;
    const headCommand = new HeadObjectCommand({
      Bucket: bucket,
      Key: decodeURIComponent(key),
    });

    try {
      await s3Client.send(headCommand);
      console.log('API: Object exists in S3');
    } catch (error) {
      console.error('API: Object does not exist in S3:', error);
      return NextResponse.json(
        { error: `Audio file ${key} not found in bucket ${bucket}` },
        { status: 404 }
      );
    }

    const signedUrl = await getAudioFileUrl(key);
    console.log('API: Generated signed URL:', signedUrl.substring(0, 100) + '...');

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    };

    return NextResponse.json({ url: signedUrl }, { headers });
  } catch (error) {
    console.error('API: Error getting signed URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get audio URL' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 