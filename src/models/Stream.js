import mongoose from 'mongoose';

const streamSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true, index: true },
    coverImage: { type: String, default: '' },
    featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    activePinnedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    status: {
      type: String,
      enum: ['Active', 'Ended'],
      default: 'Active',
      index: true,
    },
    viewersCount: { type: Number, default: 0 },
    callId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Stream = mongoose.model('Stream', streamSchema);
