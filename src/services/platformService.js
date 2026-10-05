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

const DEFAULT_TERMS = `These Terms and Conditions govern your use of PokéLive. By accessing or using our platform, you agree to be bound by these terms. PokéLive provides a marketplace for collectibles, live events, and community interactions.

1. Eligibility: You must be at least 18 years old to use PokéLive.

2. Account Responsibility: You are responsible for maintaining the confidentiality of your account credentials.

3. Prohibited Activities: Users may not engage in fraudulent listings, misrepresentation of items, or any activity that violates applicable laws.

4. Payments: All transactions are processed securely. PokéLive is not liable for payment failures caused by third-party processors.

5. Dispute Resolution: Any disputes will be resolved through binding arbitration in accordance with applicable law.

6. Modifications: PokéLive reserves the right to update these terms at any time with reasonable notice.`;

const DEFAULT_PRIVACY = `Your privacy is important to us. This Privacy Policy explains how PokéLive collects, uses, and protects your personal information.

1. Information We Collect: We collect personal information such as name, email, shipping address, and payment details when you register or make a purchase.

2. How We Use Your Information: We use your data to process orders, improve our platform, and communicate important updates.

3. Data Sharing: We do not sell your personal data. We may share information with trusted partners for payment processing and delivery services.

4. Cookies: We use cookies to enhance your browsing experience and analyze traffic patterns.

5. Data Security: We implement industry-standard security measures to protect your data.

6. Your Rights: You may request access to, correction, or deletion of your personal data at any time by contacting our support team.`;

export async function getLegalSettings() {
  const settings = await PlatformSetting.find().lean();
  const map = {
    terms_and_conditions: DEFAULT_TERMS,
    terms: DEFAULT_TERMS,
    privacy_policy: DEFAULT_PRIVACY,
    privacy: DEFAULT_PRIVACY,
    support_emails: 'support@pokelive.com, help@pokelive.com',
  };
  settings.forEach((s) => {
    map[s.key] = s.value;
    if (s.key === 'terms_and_conditions') map.terms = s.value;
    if (s.key === 'terms') map.terms_and_conditions = s.value;
    if (s.key === 'privacy_policy') map.privacy = s.value;
    if (s.key === 'privacy') map.privacy_policy = s.value;
  });
  return map;
}

export async function updateLegalSetting(key, value) {
  const setting = await PlatformSetting.findOneAndUpdate(
    { key },
    { $set: { value } },
    { upsert: true, new: true }
  ).lean();

  if (key === 'terms_and_conditions') {
    await PlatformSetting.findOneAndUpdate({ key: 'terms' }, { $set: { value } }, { upsert: true });
  } else if (key === 'terms') {
    await PlatformSetting.findOneAndUpdate({ key: 'terms_and_conditions' }, { $set: { value } }, { upsert: true });
  } else if (key === 'privacy_policy') {
    await PlatformSetting.findOneAndUpdate({ key: 'privacy' }, { $set: { value } }, { upsert: true });
  } else if (key === 'privacy') {
    await PlatformSetting.findOneAndUpdate({ key: 'privacy_policy' }, { $set: { value } }, { upsert: true });
  }

  return setting;
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
