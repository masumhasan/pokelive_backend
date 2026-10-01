import { Stream } from '../models/Stream.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { createGetStreamSession, getStreamUserTokens } from '../integrations/getstream/getStreamClient.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

export async function getSelectableProducts(userId) {
  const store = await Store.findOne({ user: userId });
  if (!store) throw new NotFoundError('Store not found.');
  return Product.find({ seller: userId, status: 'Active' }).sort({ createdAt: -1 }).lean();
}

export async function createStream(userId, { title, category = 'Sneaker', coverImage, productIds = [] }) {
  const store = await Store.findOne({ user: userId });
  if (!store) throw new ForbiddenError('You must have an approved store to broadcast.');

  const sessionId = `stream_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Pre-create GetStream video call and chat channel
  await createGetStreamSession({
    sessionId,
    hostUserId: userId,
    title,
  });

  const stream = await Stream.create({
    seller: userId,
    store: store._id,
    title,
    category,
    coverImage: coverImage || store.coverImage || 'https://images.unsplash.com/photo-1552058544-f2b08422138a',
    featuredProducts: productIds,
    activePinnedProduct: productIds[0] || null,
    status: 'Active',
    callId: sessionId,
    channelId: sessionId,
  });

  store.liveStatus = 'Live Now';
  store.currentStreamId = stream._id;
  await store.save();

  const tokens = getStreamUserTokens(userId, 'host');

  return { stream, tokens, streamToken: tokens.videoToken, chatToken: tokens.chatToken };
}

export async function endStream(userId, streamId, io = null) {
  const stream = await Stream.findOne({ _id: streamId, seller: userId });
  if (!stream) throw new NotFoundError('Active stream not found or unauthorized.');

  stream.status = 'Ended';
  stream.endedAt = new Date();
  await stream.save();

  await Store.findByIdAndUpdate(stream.store, { $set: { liveStatus: 'Offline', currentStreamId: null } });

  if (io) {
    io.to(streamId.toString()).emit('stream:ended', { streamId });
  }

  return { message: 'Stream ended successfully.' };
}

export async function pinProduct(userId, streamId, productId, io = null) {
  const stream = await Stream.findOne({ _id: streamId, seller: userId });
  if (!stream) throw new NotFoundError('Stream not found or unauthorized.');

  const product = await Product.findById(productId);
  if (!product) throw new NotFoundError('Product not found.');

  stream.activePinnedProduct = product._id;
  await stream.save();

  if (io) {
    io.to(streamId.toString()).emit('stream:product_pinned', { streamId, product });
  }

  return stream;
}

export async function getActiveStreams({ category, search = '', page = 1, limit = 20 }) {
  const query = { status: 'Active' };
  if (category && category !== 'All') query.category = category;
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [streams, total] = await Promise.all([
    Stream.find(query)
      .populate('store', 'storeName sellerName avatar rating')
      .populate('activePinnedProduct')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Stream.countDocuments(query),
  ]);

  return { streams, total };
}

export async function joinStream(userId, streamId, io = null) {
  const stream = await Stream.findById(streamId)
    .populate('store', 'storeName sellerName avatar rating')
    .populate('featuredProducts')
    .populate('activePinnedProduct');

  if (!stream || stream.status === 'Ended') throw new NotFoundError('Livestream is not active.');

  stream.viewersCount += 1;
  await stream.save();

  if (io) {
    io.to(streamId.toString()).emit('stream:viewer_count', { streamId, viewersCount: stream.viewersCount });
  }

  const tokens = getStreamUserTokens(userId, 'user');
  return { stream, tokens, streamToken: tokens.videoToken, chatToken: tokens.chatToken };
}

export async function leaveStream(userId, streamId, io = null) {
  const stream = await Stream.findById(streamId);
  if (stream && stream.viewersCount > 0) {
    stream.viewersCount = Math.max(0, stream.viewersCount - 1);
    await stream.save();
    if (io) {
      io.to(streamId.toString()).emit('stream:viewer_count', { streamId, viewersCount: stream.viewersCount });
    }
  }
  return { message: 'Left stream.' };
}
