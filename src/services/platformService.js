import { Report } from '../models/Report.js';
import { PlatformSetting } from '../models/PlatformSetting.js';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export async function createReport(userId, { subject, message }) {
  const user = await User.findById(userId).lean();
  const reportId = `#REP-${Math.floor(1000 + Math.random() * 9000)}`;

  const report = await Report.create({
    reportId,
    user: userId,
    reporter: user ? `${user.firstName} ${user.lastName}`.trim() : 'User',
    title: subject,
    message,
    status: 'pending',
  });
  return report;
}

export async function listReports({ search = '', page = 1, limit = 10 }) {
  const query = {};
  if (search) {
    query.$or = [
      { reporter: { $regex: search, $options: 'i' } },
      { reportId: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [reports, total] = await Promise.all([
    Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Report.countDocuments(query),
  ]);

  return { reports, total };
}

export async function resolveReport(reportId) {
  const report = await Report.findByIdAndUpdate(reportId, { $set: { status: 'resolved', resolvedAt: new Date() } }, { new: true }).lean();
  if (!report) throw new NotFoundError('Report not found.');
  return report;
}

export async function dismissReport(reportId) {
  const report = await Report.findByIdAndUpdate(reportId, { $set: { status: 'dismissed' } }, { new: true }).lean();
  if (!report) throw new NotFoundError('Report not found.');
  return report;
}

export async function getLegalSettings() {
  const settings = await PlatformSetting.find().lean();
  const map = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  return map;
}

export async function updateLegalSetting(key, value) {
  return PlatformSetting.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true }).lean();
}

export async function getDashboardStats() {
  const [totalUsers, totalStores, totalOrders, volumeAgg] = await Promise.all([
    User.countDocuments({ role: 'User' }),
    Store.countDocuments(),
    Order.countDocuments(),
    Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);

  const totalRevenue = volumeAgg[0]?.total || 1000;

  const stats = [
    { value: `$${totalRevenue}`, label: 'Monthly Revenue' },
    { value: `${totalUsers}`, label: 'Total User' },
    { value: `$${totalRevenue}`, label: 'Total Sells' },
    { value: `${totalStores}`, label: 'Total Store' },
  ];

  const revenueData = [
    { month: 'Jan', value: 1000 },
    { month: 'Feb', value: 1400 },
    { month: 'Apr', value: 3600 },
    { month: 'May', value: 3800 },
    { month: 'Jun', value: 3500 },
    { month: 'Jul', value: 3700 },
    { month: 'Aug', value: 4800 },
    { month: 'Sep', value: 5000 },
    { month: 'Oct', value: 4600 },
    { month: 'Nov', value: 5100 },
    { month: 'Dec', value: 5200 },
  ];

  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
  const activities = recentOrders.map((o) => ({
    id: o._id,
    message: `Order ${o.orderId} placed for $${o.totalAmount}`,
    subject: `Store: ${o.sellerName}`,
    time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return { stats, revenueData, activities };
}

// ─── Admin Management ───────────────────────────────────────────────────────
export async function listAdmins({ search = '', page = 1, limit = 10 }) {
  const query = { role: 'Admin' };
  if (search) {
    query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [admins, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(query),
  ]);

  return { admins, total };
}

export async function createAdmin({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw new ConflictError('User with this email already exists.');

  const parts = name.split(' ');
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(' ') || 'Admin';

  const admin = await User.create({
    firstName,
    lastName,
    name,
    email,
    password,
    role: 'Admin',
    status: 'Active',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333333&color=fff&size=64`,
  });

  const safe = admin.toObject();
  delete safe.password;
  return safe;
}

export async function toggleBlockAdmin(adminId) {
  const admin = await User.findOne({ _id: adminId, role: 'Admin' });
  if (!admin) throw new NotFoundError('Admin not found.');

  admin.isBlocked = !admin.isBlocked;
  admin.status = admin.isBlocked ? 'Inactive' : 'Active';
  await admin.save();
  return { id: admin._id, status: admin.status, isBlocked: admin.isBlocked };
}

export async function deleteAdmin(adminId) {
  const deleted = await User.findOneAndDelete({ _id: adminId, role: 'Admin' });
  if (!deleted) throw new NotFoundError('Admin not found.');
  return { message: 'Admin removed successfully.' };
}
