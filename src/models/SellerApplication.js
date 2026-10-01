import mongoose from 'mongoose';

const sellerApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    idDocumentType: { type: String, default: 'National Id', trim: true },
    nidFront: { type: String, default: '' },
    nidBack: { type: String, default: '' },
    storeName: { type: String, required: true, trim: true },
    shopDescription: { type: String, default: '', trim: true },
    categories: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const SellerApplication = mongoose.model('SellerApplication', sellerApplicationSchema);
