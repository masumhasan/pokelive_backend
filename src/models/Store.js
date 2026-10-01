import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    storeName: { type: String, required: true, trim: true },
    sellerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, default: '' },
    storeBio: { type: String, default: '', maxLength: 150 },
    coverImage: { type: String, default: '' },
    avatar: { type: String, default: '' },
    categories: [{ type: String }],
    activeProducts: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    stripeStatus: { type: String, enum: ['Connected', 'Disconnected'], default: 'Connected' },
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    dispatchLocation: { type: String, default: '' },
    liveStatus: { type: String, enum: ['Live Now', 'Offline'], default: 'Offline', index: true },
    currentStreamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    isBlocked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Store = mongoose.model('Store', storeSchema);
