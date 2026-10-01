import { Notification } from '../models/Notification.js';

export async function getUserNotifications(userId) {
  let list = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
  if (list.length === 0) {
    // Seed initial mock notifications for testing app experience
    list = await Notification.insertMany([
      {
        user: userId,
        title: 'Raffle Winner! 🏆',
        message: 'Congratulations! You won the Sneaker Head draw. Check your active orders to claim it.',
        type: 'raffle',
        isRead: false,
      },
      {
        user: userId,
        title: 'Seller Live Now 🔴',
        message: 'Sneaker Head is live streaming: "Rare Jordan 1s Drop & Auction!" Join now.',
        type: 'live',
        isRead: false,
      },
      {
        user: userId,
        title: 'Order Dispatched 📦',
        message: 'Your order #PL-1254 has been dispatched via Royal Mail. Track delivery status.',
        type: 'order',
        isRead: true,
      },
      {
        user: userId,
        title: 'Promo Code Added 🎟️',
        message: 'Use code POKELIVE10 for 10% off on your next purchase. Valid for 48 hours.',
        type: 'promo',
        isRead: true,
      },
    ]);
  }
  return list;
}

export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  return { message: 'All notifications marked as read.' };
}

export async function markRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true } },
    { new: true }
  ).lean();
  return notification;
}
