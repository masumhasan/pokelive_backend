import { StreamChat } from 'stream-chat';
import { StreamClient } from '@stream-io/node-sdk';
import crypto from 'crypto';
import { env } from '../../config/env.js';

export const chatClient = StreamChat.getInstance(env.streamApiKey, env.streamSecretKey);
export const videoClient = new StreamClient(env.streamApiKey, env.streamSecretKey);

/**
 * Generate tokens for Stream Chat and Video with 1 hour validity
 */
export function getStreamUserTokens(userId, role = 'user') {
  const validitySeconds = 3600;
  const expiration = Math.floor(Date.now() / 1000) + validitySeconds;

  const chatToken = chatClient.createToken(String(userId), expiration);
  const videoToken = videoClient.createToken({
    user_id: String(userId),
    role: role === 'host' || role === 'admin' ? 'admin' : 'user',
    validity_in_seconds: validitySeconds,
  });

  return {
    apiKey: env.streamApiKey,
    chatToken,
    videoToken,
    expiresAt: expiration,
  };
}

/**
 * Create or get Livestream Call & matching Chat Channel on GetStream
 */
export async function createGetStreamSession({ sessionId, hostUserId, title }) {
  const callId = String(sessionId);

  // 1. Create Livestream Call
  const call = videoClient.video.call('livestream', callId);
  await call.getOrCreate({
    data: {
      created_by_id: String(hostUserId),
      custom: { title, sessionId: callId },
      members: [{ user_id: String(hostUserId), role: 'host' }],
    },
  });

  // 2. Create matching Livestream Chat Channel
  const channel = chatClient.channel('livestream', callId, {
    name: title,
    created_by_id: String(hostUserId),
    custom: { sessionId: callId },
  });
  await channel.create();

  return { callId, channelId: callId };
}

/**
 * Verify incoming webhook from GetStream
 */
export function verifyStreamWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !env.streamSecretKey) return false;
  const expectedSignature = crypto
    .createHmac('sha256', env.streamSecretKey)
    .update(rawBody)
    .digest('hex');
  return signatureHeader === expectedSignature;
}
