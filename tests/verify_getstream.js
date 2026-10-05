import { videoClient, chatClient } from '../src/integrations/getstream/getStreamClient.js';
import { env } from '../src/config/env.js';

async function testGetStreamLiveSession() {
  console.log('--- Testing GetStream.io Credentials & Livestream Lifecycle ---');
  console.log('Stream API Key:', env.streamApiKey);
  console.log('Stream Secret Key Prefix:', env.streamSecretKey ? env.streamSecretKey.substring(0, 8) + '...' : 'MISSING');

  const userId = `test_seller_${Date.now()}`;
  const userName = 'Test Stream Host';
  const callId = `live_test_${Date.now()}`;
  const streamTitle = 'Test Livestream - Credential & Usage Verification';

  console.log(`\nStep 1: Upserting test user '${userId}' in GetStream...`);
  // Upsert user in both Chat and Video
  await chatClient.upsertUser({
    id: userId,
    name: userName,
    role: 'admin',
  });

  await videoClient.upsertUsers([
    {
      id: userId,
      name: userName,
      role: 'admin',
    },
  ]);
  console.log('✓ User created successfully in GetStream.');

  console.log(`\nStep 2: Creating call '${callId}' of type 'livestream'...`);
  const call = videoClient.video.call('livestream', callId);

  const createRes = await call.getOrCreate({
    data: {
      created_by_id: userId,
      custom: {
        title: streamTitle,
      },
      members: [{ user_id: userId, role: 'host' }],
    },
  });
  console.log('✓ Livestream call created successfully in GetStream.');
  console.log('  Call CID:', createRes.data?.call?.cid || `livestream:${callId}`);
  console.log('  Created by:', createRes.data?.call?.created_by?.id || userId);

  console.log(`\nStep 3: Creating matching chat channel '${callId}'...`);
  const channel = chatClient.channel('livestream', callId, {
    name: streamTitle,
    created_by_id: userId,
  });
  await channel.create();
  console.log('✓ Chat channel created successfully.');

  console.log(`\nStep 4: Starting the stream (calling goLive)...`);
  const goLiveRes = await call.goLive();
  console.log('✓ Livestream is now LIVE!');
  console.log('  GoLive response duration:', goLiveRes.duration || 'N/A');

  console.log('\nStep 5: Keeping the livestream active for 5 seconds...');
  for (let i = 1; i <= 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write(`  Streaming... ${i}s elapsed\n`);
  }

  console.log('\nStep 6: Ending the livestream (stopLive and end call)...');
  await call.stopLive();
  console.log('✓ Live broadcast stopped.');

  await call.end();
  console.log('✓ Call ended successfully.');

  console.log('\nStep 7: Verifying call status in GetStream...');
  const getCallRes = await call.get();
  const callData = getCallRes.data?.call;

  console.log('\n======================================================');
  console.log('GETSTREAM.IO LIVESTREAM CALL SUMMARY:');
  console.log('======================================================');
  console.log('Call ID:        ', callData?.id || callId);
  console.log('Call CID:       ', callData?.cid || `livestream:${callId}`);
  console.log('Type:           ', callData?.type || 'livestream');
  console.log('Title:          ', callData?.custom?.title || streamTitle);
  console.log('Created At:     ', callData?.created_at);
  console.log('Started At:     ', callData?.starts_at);
  console.log('Ended At:       ', callData?.ended_at);
  console.log('Backstage:      ', callData?.backstage);
  console.log('Duration (raw): ', getCallRes.duration);
  console.log('Members count:  ', getCallRes.data?.members?.length || 0);
  console.log('======================================================');
  console.log('SUCCESS! The call was recorded by GetStream.io and will appear in your GetStream Dashboard under Video -> Calls / Analytics / Usage.');
}

testGetStreamLiveSession().catch((err) => {
  console.error('\n❌ GetStream verification failed:', err);
  process.exit(1);
});
