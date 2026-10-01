import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true },
    type: { type: String, enum: ['reset_password', 'verification'], default: 'reset_password' },
    expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
  },
  { timestamps: true }
);

export const Otp = mongoose.model('Otp', otpSchema);
