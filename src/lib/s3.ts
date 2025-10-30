import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from './aws-config';

/**
 * S3 Client for file uploads
 *
 * Usage:
 *   import { s3, uploadFile, getFileUrl, getUploadUrl } from '@/lib/s3';
 */

export const s3 = new S3Client(awsConfig);

/**
 * Upload a file to S3 (server-side)
 *
 * @param bucket - S3 bucket name
 * @param key - File path in bucket (e.g., "user-123/resume.pdf")
 * @param body - File content (Buffer, Uint8Array, or ReadableStream)
 * @param contentType - MIME type (e.g., "application/pdf")
 * @returns Object with bucket and key
 */
export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  }));

  return { bucket, key, url: `s3://${bucket}/${key}` };
}

/**
 * Generate a presigned URL for file download (temporary access)
 *
 * @param bucket - S3 bucket name
 * @param key - File path in bucket
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Presigned URL (valid for specified duration)
 */
export async function getFileUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600
) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generate a presigned URL for client-side upload (direct browser → S3)
 *
 * @param bucket - S3 bucket name
 * @param key - File path in bucket
 * @param contentType - MIME type (e.g., "application/pdf")
 * @param expiresIn - URL expiration in seconds (default: 15 minutes)
 * @returns Presigned URL for PUT request
 */
export async function getUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 900
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  return await getSignedUrl(s3, command, { expiresIn });
}

/**
 * List files in an S3 bucket (or prefix/folder)
 *
 * @param bucket - S3 bucket name
 * @param prefix - Optional folder prefix (e.g., "user-123/")
 * @returns Array of file objects
 */
export async function listFiles(bucket: string, prefix?: string) {
  const response = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix
  }));

  return response.Contents || [];
}

/**
 * Get file metadata without downloading
 *
 * @param bucket - S3 bucket name
 * @param key - File path in bucket
 * @returns File metadata (size, content-type, etc.)
 */
export async function getFileMetadata(bucket: string, key: string) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    metadata: response.Metadata
  };
}
