import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderId: { type: String, required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerName: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerName: { type: String, required: true },
    amount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, default: 5 },
    shippingFee: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ['Success', 'Processing', 'Cancelled'],
      default: 'Success',
      index: true,
    },
    stripeCode: { type: String, default: 'ch_mock_stripe' },
    paymentMethod: { type: String, default: 'Visa' },
    card: { type: String, default: '****4242' },
    expiry: { type: String, default: '12/28' },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
