import crypto from 'crypto';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { generateToken } from '../utils/token.js';
import { getStreamUserTokens } from '../integrations/getstream/getStreamClient.js';
import { ConflictError, UnauthorizedError, BadRequestError, ForbiddenError } from '../utils/errors.js';

export async function registerUser({ firstName, lastName, email, phone, password }) {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
  }

  const user = new User({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: 'User',
    sellerStatus: 'none',
  });
  await user.save();

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    sellerStatus: user.sellerStatus,
  });

  const stream = getStreamUserTokens(user._id, 'user');

  const safeUser = user.toObject();
  delete safeUser.password;
  safeUser.isSeller = false;
  safeUser.isApprovedSeller = false;
  safeUser.showSellerBanner = true;

  return { user: safeUser, token, stream };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  if (user.isBlocked) {
    throw new ForbiddenError('Your account has been suspended. Please contact support.');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken({
    id: user._id,
    email: user.email,
    role: user.role,
    sellerStatus: user.sellerStatus,
  });

  const streamRole = user.role === 'Admin' ? 'admin' : user.sellerStatus === 'approved' ? 'host' : 'user';
  const stream = getStreamUserTokens(user._id, streamRole);

  const safeUser = user.toObject();
  delete safeUser.password;
  const isApproved = user.sellerStatus === 'approved';
  safeUser.isSeller = isApproved;
  safeUser.isApprovedSeller = isApproved;
  safeUser.showSellerBanner = !isApproved;

  return { user: safeUser, token, stream };
}

export async function sendForgotPasswordOtp(email) {
  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw new BadRequestError('No account found with this email address.');
  }

  // Generate 6 digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove any previous OTPs for this email
  await Otp.deleteMany({ email, type: 'reset_password' });

  await Otp.create({
    email,
    otp: code,
    type: 'reset_password',
    expiresAt,
  });

  // ponytail: log OTP in development console for instant testability
  console.log(`[AUTH OTP] Password reset OTP for ${email}: ${code}`);

  return { message: 'OTP sent to your email.' };
}

export async function verifyOtp(email, otp) {
  const record = await Otp.findOne({ email, otp, type: 'reset_password' });
  if (!record) {
    throw new BadRequestError('Invalid or expired OTP code.');
  }
  return { valid: true };
}

export async function resetPassword({ email, otp, newPassword }) {
  const record = await Otp.findOne({ email, otp, type: 'reset_password' });
  if (!record) {
    throw new BadRequestError('Invalid or expired OTP code.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError('User account not found.');
  }

  user.password = newPassword;
  await user.save();

  await Otp.deleteMany({ email, type: 'reset_password' });

  return { message: 'Password has been reset successfully. Please log in.' };
}
