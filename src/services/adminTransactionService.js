import { Transaction } from '../models/Transaction.js';
import { PayoutRequest } from '../models/PayoutRequest.js';
import { Store } from '../models/Store.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export async function listTransactions({ page = 1, limit = 10, search = '' }) {
  const query = {};
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { orderId: { $regex: search, $options: 'i' } },
      { buyerName: { $regex: search, $options: 'i' } },
      { sellerName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total, stats] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Transaction.countDocuments(query),
    Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
          platformCommission: { $sum: '$platformFee' },
        },
      },
    ]),
  ]);

  const pendingPayoutsCount = await PayoutRequest.countDocuments({ status: 'Pending' });

  return {
    items,
    total,
    stats: {
      totalVolume: stats[0]?.totalVolume || 0,
      platformCommission: stats[0]?.platformCommission || 0,
      pendingPayouts: pendingPayoutsCount,
    },
  };
}

export async function getTransactionDetails(id) {
  const tx = await Transaction.findById(id).populate('order').lean();
  if (!tx) throw new NotFoundError('Transaction not found.');
  return tx;
}

export async function listPayoutRequests({ page = 1, limit = 10 }) {
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    PayoutRequest.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    PayoutRequest.countDocuments(),
  ]);
  return { items, total };
}

export async function approvePayout(payoutId) {
  const payout = await PayoutRequest.findById(payoutId);
  if (!payout) throw new NotFoundError('Payout request not found.');
  if (payout.status !== 'Pending') throw new BadRequestError(`Payout is already ${payout.status}`);

  payout.status = 'Approved';
  payout.approvedAt = new Date();
  await payout.save();

  // Increment totalWithdrawn on store
  await Store.findByIdAndUpdate(payout.store, { $inc: { totalWithdrawn: payout.amount } });

  return payout;
}

export async function rejectPayout(payoutId) {
  const payout = await PayoutRequest.findById(payoutId);
  if (!payout) throw new NotFoundError('Payout request not found.');
  if (payout.status !== 'Pending') throw new BadRequestError(`Payout is already ${payout.status}`);

  payout.status = 'Rejected';
  payout.rejectedAt = new Date();
  await payout.save();

  // Refund balance back to store
  await Store.findByIdAndUpdate(payout.store, { $inc: { balance: payout.amount } });

  return payout;
}
