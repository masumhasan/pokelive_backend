import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: '', trim: true },
    contactNumber: { type: String, required: true, trim: true },
    streetAddress: { type: String, required: true, trim: true },
    apartment: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: 'United States', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = mongoose.model('Address', addressSchema);
