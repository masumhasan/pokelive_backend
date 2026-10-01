import mongoose from 'mongoose';
import { hashPassword, comparePassword } from './userHelper.js';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    username: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['User', 'Admin'], default: 'User', index: true },
    sellerStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      index: true,
    },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    avatar: { type: String, default: '' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    city: { type: String, default: '' },
    country: { type: String, default: 'United States' },
    address: { type: String, default: '' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to hash password and compute name
userSchema.pre('save', async function () {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (!this.username && this.email) {
    this.username = this.email.split('@')[0] + Math.floor(Math.random() * 1000);
  }
  if (!this.isModified('password')) return;
  this.password = await hashPassword(this.password);
});

// Compare password instance method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return comparePassword(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
