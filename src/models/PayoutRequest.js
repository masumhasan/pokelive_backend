import mongoose from 'mongoose';

const payoutRequestSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    requestId: { type: String, required: true, unique: true, index: true },
    sellerName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    bankName: { type: String, required: true },
    bankAccount: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

export const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);
