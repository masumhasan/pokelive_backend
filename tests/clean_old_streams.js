import { Stream } from '../src/models/Stream.js';
import { Store } from '../src/models/Store.js';
import { connectDB } from '../src/config/db.js';

async function clean() {
  await connectDB();
  const res = await Stream.updateMany(
    { status: 'Active' },
    { $set: { status: 'Ended', endedAt: new Date() } }
  );
  console.log('Cleaned up active streams:', res.modifiedCount);
  await Store.updateMany({}, { $set: { liveStatus: 'Offline', currentStreamId: null } });
  process.exit(0);
}

clean().catch(console.error);
