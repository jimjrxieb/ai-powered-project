import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, getUploadUrl } from '@/lib/s3';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/upload
 *
 * Upload a file to S3 (server-side)
 *
 * Body (FormData):
 *   - file: File to upload
 *   - type: "resume" | "document" (default: "document")
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user with Clerk (skip for testing if SKIP_AUTH_FOR_TESTING=true)
    let userId: string;

    if (process.env.SKIP_AUTH_FOR_TESTING === 'true') {
      // Development mode: use test user ID
      userId = 'test-user-123';
      console.log('⚠️  SKIP_AUTH_FOR_TESTING enabled - using test user ID');
    } else {
      // Production mode: require Clerk authentication
      const authResult = await auth();
      if (!authResult.userId) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }
      userId = authResult.userId;
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'document';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (optional but recommended)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Determine bucket based on type
    const bucket = type === 'resume' ? 'ai-powered-resumes' : 'ai-powered-documents';

    // Generate S3 key with timestamp for uniqueness
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${userId}/${timestamp}-${sanitizedFilename}`;

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(bucket, key, buffer, file.type);

    return NextResponse.json({
      success: true,
      ...result,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload?type=resume&filename=resume.pdf&contentType=application/pdf
 *
 * Get a presigned URL for client-side upload (direct browser → S3)
 *
 * Query params:
 *   - type: "resume" | "document" (default: "document")
 *   - filename: Name of file to upload
 *   - contentType: MIME type of file
 *
 * Returns presigned URL valid for 15 minutes
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (skip for testing if SKIP_AUTH_FOR_TESTING=true)
    let userId: string;

    if (process.env.SKIP_AUTH_FOR_TESTING === 'true') {
      // Development mode: use test user ID
      userId = 'test-user-123';
      console.log('⚠️  SKIP_AUTH_FOR_TESTING enabled - using test user ID');
    } else {
      // Production mode: require Clerk authentication
      const authResult = await auth();
      if (!authResult.userId) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }
      userId = authResult.userId;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'document';
    const filename = searchParams.get('filename') || 'file';
    const contentType = searchParams.get('contentType') || 'application/octet-stream';

    // Determine bucket
    const bucket = type === 'resume' ? 'ai-powered-resumes' : 'ai-powered-documents';

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${userId}/${timestamp}-${sanitizedFilename}`;

    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getUploadUrl(bucket, key, contentType, 900);

    return NextResponse.json({
      uploadUrl,
      bucket,
      key,
      expiresIn: 900 // seconds
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
