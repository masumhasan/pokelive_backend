import crypto from 'crypto';
import { User } from '../models/User.js';
import { SellerApplication } from '../models/SellerApplication.js';
import { Store } from '../models/Store.js';
import { SenderAddress } from '../models/SenderAddress.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function applyToBecomeSeller(userId, data) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found.');
  if (user.sellerStatus === 'approved') throw new BadRequestError('You are already an approved seller.');
  if (user.sellerStatus === 'pending') throw new BadRequestError('Your seller application is currently pending review.');

  const application = await SellerApplication.create({
    user: userId,
    applicantName: data.applicantName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Applicant',
    email: user.email,
    phone: data.phone || data.contactNumber || user.phone || '',
    address: typeof data.address === 'object' ? `${data.address.street || ''}, ${data.address.city || ''}` : (data.address || user.address || ''),
    idDocumentType: data.idDocumentType || 'National Id',
    nidFront: data.nidFront || '',
    nidBack: data.nidBack || '',
    storeName: data.storeName || data.businessName || `${user.firstName || 'User'}'s Store`,
    shopDescription: data.shopDescription || data.description || '',
    categories: data.categories || (data.category ? [data.category] : []),
  });

  user.sellerStatus = 'pending';
  await user.save();

  return application;
}

export async function getApplicationStatus(userId) {
  const user = await User.findById(userId).select('sellerStatus').lean();
  const application = await SellerApplication.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
  return { sellerStatus: user?.sellerStatus || 'none', application };
}

export async function getSellerHubSummary(userId) {
  const store = await Store.findOne({ user: userId }).lean();
  if (!store) throw new NotFoundError('Store not found for this seller.');

  return {
    storeName: store.storeName,
    avatar: store.avatar,
    rating: store.rating,
    reviewsCount: store.reviewsCount,
    activeProducts: store.activeProducts,
    ordersToShip: 0, // ponytail: populated as orders are processed
    balance: store.balance,
    totalWithdrawn: store.totalWithdrawn,
    liveStatus: store.liveStatus,
  };
}

export async function getStorefront(userId) {
  const store = await Store.findOne({ user: userId }).lean();
  if (!store) throw new NotFoundError('Store not found.');
  return store;
}

export async function updateStorefront(userId, data) {
  const allowed = ['storeName', 'storeBio', 'coverImage', 'avatar', 'categories'];
  const sanitized = {};
  for (const key of allowed) if (data[key] !== undefined) sanitized[key] = data[key];

  const store = await Store.findOneAndUpdate({ user: userId }, { $set: sanitized }, { new: true }).lean();
  if (!store) throw new NotFoundError('Store not found.');
  return store;
}

export async function getSenderAddress(userId) {
  const store = await Store.findOne({ user: userId }).lean();
  if (!store) throw new NotFoundError('Store not found.');
  const address = await SenderAddress.findOne({ store: store._id }).lean();
  return address || null;
}

export async function updateSenderAddress(userId, data) {
  const store = await Store.findOne({ user: userId }).lean();
  if (!store) throw new NotFoundError('Store not found.');

  const address = await SenderAddress.findOneAndUpdate(
    { store: store._id },
    { $set: { ...data, store: store._id } },
    { upsert: true, new: true }
  ).lean();
  return address;
}

export async function getSellerPayouts(userId) {
  const store = await Store.findOne({ user: userId }).lean();
  if (!store) throw new NotFoundError('Store not found.');
  const payouts = await PayoutRequest.find({ store: store._id }).sort({ createdAt: -1 }).lean();
  return { balance: store.balance, totalWithdrawn: store.totalWithdrawn, payouts };
}

export async function requestPayout(userId, { amount, bankName, bankAccount }) {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) throw new BadRequestError('Invalid payout amount.');

  const store = await Store.findOne({ user: userId });
  if (!store) throw new NotFoundError('Store not found.');
  if (store.balance < numAmount) throw new BadRequestError('Insufficient store balance.');

  store.balance -= numAmount;
  await store.save();

  const reqId = `#TX-pok-${Math.floor(10000 + Math.random() * 90000)}`;
  const payout = await PayoutRequest.create({
    store: store._id,
    requestId: reqId,
    sellerName: store.sellerName || store.storeName,
    amount: numAmount,
    bankName,
    bankAccount,
    status: 'Pending',
  });

  return payout;
}
