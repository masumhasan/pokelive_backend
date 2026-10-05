import { HeadBucketCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, createPresignedUploadUrl } from '../src/integrations/s3/s3Client.js';
import { env } from '../src/config/env.js';

async function verifyS3() {
  console.log('--- Testing AWS S3 Live Integration ---');
  console.log(`Region: ${env.awsRegion}`);
  console.log(`Bucket: ${env.awsBucketName}`);
  console.log(`Access Key ID: ${env.awsAccessKeyId ? env.awsAccessKeyId.substring(0, 8) + '...' : 'MISSING'}`);

  // 1. Verify Bucket Access
  console.log('\nStep 1: Checking bucket connectivity & permissions...');
  try {
    const headRes = await s3.send(new HeadBucketCommand({ Bucket: env.awsBucketName }));
    console.log('✓ Successfully connected to bucket. Bucket is accessible.');
  } catch (err) {
    console.error('✗ HeadBucket failed:', err.message);
    throw err;
  }

  // 2. Generate Presigned Upload URL
  console.log('\nStep 2: Generating presigned upload URL...');
  const presigned = await createPresignedUploadUrl({
    filename: 'test_image.png',
    fileType: 'image/png',
    folder: 'test-verification',
  });
  console.log('✓ Presigned URL generated successfully:');
  console.log('  Upload Key:', presigned.key);
  console.log('  Public URL:', presigned.publicUrl);
  console.log('  Upload URL:', presigned.uploadUrl.substring(0, 80) + '...');

  // 3. Upload a test buffer via the presigned URL
  console.log('\nStep 3: Performing test upload using presigned PUT URL...');
  const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'); // 1x1 transparent png
  
  const uploadRes = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/png',
    },
    body: testBuffer,
  });

  if (uploadRes.status !== 200) {
    const errText = await uploadRes.text();
    throw new Error(`Upload to S3 failed with status ${uploadRes.status}: ${errText}`);
  }
  console.log('✓ Test file uploaded successfully to S3 (HTTP 200 OK)');

  // 4. Verify object exists in bucket
  console.log('\nStep 4: Verifying uploaded object in S3...');
  const objectMeta = await s3.send(new HeadObjectCommand({
    Bucket: env.awsBucketName,
    Key: presigned.key,
  }));
  console.log('✓ Object verified in S3. ContentLength:', objectMeta.ContentLength, 'bytes, ContentType:', objectMeta.ContentType);

  // 5. Cleanup test object
  console.log('\nStep 5: Cleaning up test object from S3...');
  await s3.send(new DeleteObjectCommand({
    Bucket: env.awsBucketName,
    Key: presigned.key,
  }));
  console.log('✓ Test object deleted cleanly.');

  console.log('\n======================================================');
  console.log('AWS S3 IS FULLY CONNECTED, CONFIGURED, AND WORKING 100%!');
  console.log('======================================================');
}

verifyS3().catch((err) => {
  console.error('\n✗ AWS S3 verification failed:', err);
  process.exit(1);
});
