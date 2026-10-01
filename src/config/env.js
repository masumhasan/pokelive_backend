import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || '*',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_TOKEN || 'default_secret_key_change_me',
  jwtExpiry: process.env.TOKEN_EXPIRY || '7d',
  streamApiKey: process.env.STREAM_API_KEY || '',
  streamSecretKey: process.env.STREAM_SECRET_KEY || '',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'eu-west-2',
  awsBucketName: (process.env.AWS_S3_BUCKET_NAME || '').trim(),
};

// ponytail: validate required environment variables at boot to fail fast
export function validateEnv() {
  const required = ['mongoUri', 'jwtSecret'];
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
