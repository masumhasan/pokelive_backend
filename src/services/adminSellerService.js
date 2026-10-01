import { SellerApplication } from '../models/SellerApplication.js';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export async function listSellerApprovals({ search = '', page = 1, limit = 10 }) {
  const query = { status: 'pending' };
  if (search) {
    query.$or = [
      { applicantName: { $regex: search, $options: 'i' } },
      { storeName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [approvals, total] = await Promise.all([
    SellerApplication.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    SellerApplication.countDocuments(query),
  ]);

  return { approvals, total };
}

export async function approveSellerApplication(applicationId, adminId) {
  const application = await SellerApplication.findById(applicationId);
  if (!application) throw new NotFoundError('Seller application not found.');
  if (application.status === 'approved') throw new BadRequestError('Application is already approved.');

  application.status = 'approved';
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  // Atomically update User seller status
  const user = await User.findById(application.user);
  if (user) {
    user.sellerStatus = 'approved';
    await user.save();
  }

  // Create or activate Store for this seller
  let store = await Store.findOne({ user: application.user });
  if (!store) {
    store = await Store.create({
      user: application.user,
      storeName: application.storeName,
      sellerName: application.applicantName,
      email: application.email,
      phone: application.phone,
      location: application.address,
      categories: application.categories,
      storeBio: application.shopDescription,
      coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000',
      avatar: user?.avatar || 'https://i.pravatar.cc/150?img=12',
    });
  } else {
    store.storeName = application.storeName;
    store.categories = application.categories;
    store.isBlocked = false;
    await store.save();
  }

  return { message: 'Seller application approved successfully.', store };
}

export async function rejectSellerApplication(applicationId, adminId, reason = '') {
  const application = await SellerApplication.findById(applicationId);
  if (!application) throw new NotFoundError('Seller application not found.');

  application.status = 'rejected';
  application.rejectionReason = reason;
  application.reviewedBy = adminId;
  application.reviewedAt = new Date();
  await application.save();

  const user = await User.findById(application.user);
  if (user) {
    user.sellerStatus = 'rejected';
    await user.save();
  }

  return { message: 'Seller application rejected.' };
}

export async function listSellers({ search = '', page = 1, limit = 10, isBlocked }) {
  const query = {};
  if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true' || isBlocked === true;
  if (search) {
    query.$or = [
      { storeName: { $regex: search, $options: 'i' } },
      { sellerName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [sellers, total] = await Promise.all([
    Store.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Store.countDocuments(query),
  ]);

  return { sellers, total };
}

export async function toggleBlockSeller(storeId) {
  const store = await Store.findById(storeId);
  if (!store) throw new NotFoundError('Store not found.');

  store.isBlocked = !store.isBlocked;
  await store.save();

  // Also block seller user from seller operations
  if (store.user) {
    await User.findByIdAndUpdate(store.user, { isBlocked: store.isBlocked });
  }

  return { id: store._id, isBlocked: store.isBlocked };
}
