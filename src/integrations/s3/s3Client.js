import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { BadRequestError } from '../../utils/errors.js';

export const s3 = new S3Client({
  region: env.awsRegion,
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'video/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function createPresignedUploadUrl({ filename, fileType, folder = 'uploads' }) {
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new BadRequestError(`Unsupported file type: ${fileType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  const safeExt = fileType.split('/')[1] || 'jpg';
  const uniqueKey = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${safeExt}`;

  const command = new PutObjectCommand({
    Bucket: env.awsBucketName,
    Key: uniqueKey,
    ContentType: fileType,
  });

  // Presigned URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  const publicUrl = `https://${env.awsBucketName}.s3.${env.awsRegion}.amazonaws.com/${uniqueKey}`;

  return { uploadUrl, key: uniqueKey, publicUrl };
}
