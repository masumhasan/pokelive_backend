import mongoose from 'mongoose';

const senderAddressSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, unique: true, index: true },
    contactName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, default: 'United States', trim: true },
    useAddressForReturns: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SenderAddress = mongoose.model('SenderAddress', senderAddressSchema);
