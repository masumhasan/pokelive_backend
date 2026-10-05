import { Order } from '../models/Order.js';
import { Transaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { Address } from '../models/Address.js';
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export async function calculateSummary({ subtotal = 0, shippingPartner = 'Royal Shipping' }) {
  const platformFee = 5.0;
  const shippingFee = 100.0;
  const totalAmount = Number((subtotal + platformFee + shippingFee).toFixed(2));
  return { subtotal, platformFee, shippingFee, totalAmount };
}

export async function createOrder(userId, { addressId, shippingAddressId, shippingPartner = 'Royal Shipping', paymentMethod = 'Visa', directItem }) {
  const buyer = await User.findById(userId).lean();
  if (!buyer) throw new NotFoundError('User not found.');

  const targetAddressId = addressId || shippingAddressId;
  let address;
  if (targetAddressId) {
    address = await Address.findOne({ _id: targetAddressId, user: userId }).lean();
  }
  if (!address) {
    address = await Address.findOne({ user: userId, isDefault: true }).lean() || await Address.findOne({ user: userId }).lean();
  }
  if (!address) throw new BadRequestError('Valid delivery address is required. Please add an address first.');

  // Determine items to order
  let itemsToOrder = [];
  if (directItem) {
    const product = await Product.findById(directItem.productId);
    if (!product) throw new NotFoundError('Product not found.');
    itemsToOrder.push({ product, quantity: directItem.quantity || 1, storeId: product.store });
  } else {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty.');
    itemsToOrder = cart.items.map((i) => ({ product: i.product, quantity: i.quantity, storeId: i.product.store }));
  }

  // 1. Concurrency Check: Atomically decrement stock
  const reservedProducts = [];
  try {
    for (const item of itemsToOrder) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product._id, quantity: { $gte: item.quantity }, status: { $ne: 'Archived' } },
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new BadRequestError(`Product "${item.product.title}" has insufficient stock or is unavailable.`);
      }
      reservedProducts.push({ product: updated, quantity: item.quantity });
    }
  } catch (error) {
    // Rollback any successfully decremented products on failure
    for (const res of reservedProducts) {
      await Product.findByIdAndUpdate(res.product._id, { $inc: { quantity: res.quantity } });
    }
    throw error;
  }

  // Group by store to create distinct orders
  const storeGroups = new Map();
  for (const item of itemsToOrder) {
    const sId = item.storeId.toString();
    if (!storeGroups.has(sId)) storeGroups.set(sId, []);
    storeGroups.get(sId).push(item);
  }

  const createdOrders = [];

  for (const [storeId, groupItems] of storeGroups.entries()) {
    const store = await Store.findById(storeId).populate('user');
    const orderItems = groupItems.map((g) => ({
      product: g.product._id,
      title: g.product.title,
      price: g.product.price,
      quantity: g.quantity,
      imageUrl: g.product.images?.[0] || '',
      description: g.product.description,
    }));

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const summary = await calculateSummary({ subtotal, shippingPartner });

    const orderId = `#PL-${Math.floor(1000 + Math.random() * 9000)}`;
    const txId = `#TX-pok-${Math.floor(10000 + Math.random() * 90000)}`;

    const order = await Order.create({
      orderId,
      buyer: buyer._id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
      seller: store?.user?._id || store?.user,
      sellerName: store?.storeName || 'Store',
      store: store._id,
      items: orderItems,
      shippingAddress: address,
      shippingPartner,
      subtotal: summary.subtotal,
      platformFee: summary.platformFee,
      shippingFee: summary.shippingFee,
      totalAmount: summary.totalAmount,
      status: 'Pending',
    });

    await Transaction.create({
      transactionId: txId,
      order: order._id,
      orderId: order.orderId,
      buyer: buyer._id,
      buyerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
      seller: store?.user?._id || store?.user,
      sellerName: store?.storeName || 'Store',
      amount: summary.totalAmount,
      subtotal: summary.subtotal,
      platformFee: summary.platformFee,
      shippingFee: summary.shippingFee,
      status: 'Success',
      paymentMethod,
    });

    // Update store balance and sales
    if (store) {
      store.balance += summary.subtotal;
      store.totalSales += 1;
      await store.save();
    }

    createdOrders.push(order);
  }

  // Clear cart if ordered from cart
  if (!directItem) {
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
  }

  return createdOrders;
}

export async function getActiveOrders(userId) {
  return Order.find({ buyer: userId, status: { $in: ['Pending', 'Processing', 'Shipped'] } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getOrderHistory(userId) {
  return Order.find({ buyer: userId, status: { $in: ['Delivered', 'Cancelled'] } })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getSellerOrders(userId, tab = 0) {
  const store = await Store.findOne({ user: userId });
  if (!store) throw new NotFoundError('Store not found.');

  const statusMap = {
    0: ['Pending', 'Processing'], // To Ship
    1: ['Shipped'],               // Shipped
    2: ['Delivered'],             // Completed
  };

  const allowedStatuses = statusMap[tab] || statusMap[0];
  return Order.find({ store: store._id, status: { $in: allowedStatuses } }).sort({ createdAt: -1 }).lean();
}

export async function updateSellerOrderStatus(userId, orderId, status) {
  const store = await Store.findOne({ user: userId });
  if (!store) throw new NotFoundError('Store not found.');

  const order = await Order.findOneAndUpdate(
    { _id: orderId, store: store._id },
    { $set: { status } },
    { new: true }
  ).lean();
  if (!order) throw new NotFoundError('Order not found.');
  return order;
}
