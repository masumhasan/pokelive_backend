import { User } from '../models/User.js';
import { Address } from '../models/Address.js';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors.js';

export async function getProfile(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new NotFoundError('User not found.');
  const isApproved = user.sellerStatus === 'approved';
  return {
    ...user,
    isSeller: isApproved,
    isApprovedSeller: isApproved,
    showSellerBanner: !isApproved,
  };
}

export async function updateProfile(userId, updates) {
  const allowed = ['firstName', 'lastName', 'name', 'phone', 'avatar', 'city', 'address', 'gender', 'email'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined && updates[key] !== null) sanitized[key] = updates[key];
  }
  if (updates.contactNumber && !sanitized.phone) {
    sanitized.phone = updates.contactNumber;
  }
  if (updates.avatarUrl && !sanitized.avatar) {
    sanitized.avatar = updates.avatarUrl;
  }
  if (sanitized.firstName || sanitized.lastName) {
    const existing = await User.findById(userId).lean();
    sanitized.name = `${sanitized.firstName || existing?.firstName || ''} ${sanitized.lastName || existing?.lastName || ''}`.trim();
  }

  const updated = await User.findByIdAndUpdate(userId, { $set: sanitized }, { new: true }).lean();
  const isApproved = updated?.sellerStatus === 'approved';
  return {
    ...updated,
    isSeller: isApproved,
    isApprovedSeller: isApproved,
    showSellerBanner: !isApproved,
  };
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new NotFoundError('User not found.');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new UnauthorizedError('Current password does not match.');

  user.password = newPassword;
  await user.save();
  return { message: 'Password changed successfully.' };
}

// ─── Addresses ──────────────────────────────────────────────────────────────
export async function getAddresses(userId) {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
}

function normalizeAddress(data) {
  const norm = { ...data };
  if (!norm.firstName && norm.fullName) {
    const parts = norm.fullName.trim().split(' ');
    norm.firstName = parts[0] || 'User';
    norm.lastName = parts.slice(1).join(' ') || 'Name';
  }
  if (!norm.contactNumber && norm.phone) norm.contactNumber = norm.phone;
  if (!norm.streetAddress && norm.street) norm.streetAddress = norm.street;
  if (!norm.postalCode && norm.zipCode) norm.postalCode = norm.zipCode;
  return norm;
}

export async function createAddress(userId, data) {
  const normalized = normalizeAddress(data);
  if (normalized.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }
  const address = await Address.create({ ...normalized, user: userId });
  return address;
}

export async function updateAddress(userId, addressId, data) {
  if (data.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }
  const updated = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { $set: data },
    { new: true }
  ).lean();
  if (!updated) throw new NotFoundError('Address not found or unauthorized.');
  return updated;
}

export async function deleteAddress(userId, addressId) {
  const deleted = await Address.findOneAndDelete({ _id: addressId, user: userId }).lean();
  if (!deleted) throw new NotFoundError('Address not found or unauthorized.');
  return { message: 'Address removed successfully.' };
}

// ─── Admin User Operations ──────────────────────────────────────────────────
export async function adminListUsers({ search = '', page = 1, limit = 10, role, status }) {
  const query = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(query),
  ]);

  return { users, total };
}

export async function adminToggleBlockUser(userId) {
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found.');

  user.isBlocked = !user.isBlocked;
  user.status = user.isBlocked ? 'Inactive' : 'Active';
  await user.save();

  return { id: user._id, isBlocked: user.isBlocked, status: user.status };
}

export async function adminDeleteUser(userId) {
  const deleted = await User.findByIdAndDelete(userId).lean();
  if (!deleted) throw new NotFoundError('User not found.');
  return { message: 'User deleted successfully.' };
}
