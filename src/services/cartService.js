import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export async function getCart(userId) {
  let cart = await Cart.findOne({ user: userId })
    .populate({
      path: 'items.product',
      select: 'title price images quantity status description store',
    })
    .populate({
      path: 'items.store',
      select: 'storeName avatar',
    })
    .lean();

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    return { groups: [], totalItems: 0, subtotal: 0 };
  }

  // Filter out any items where product was deleted/archived
  const validItems = cart.items.filter((item) => item.product && item.product.status !== 'Archived');

  // Group items by store
  const storeMap = new Map();
  let subtotal = 0;
  let totalItems = 0;

  for (const item of validItems) {
    const storeId = item.store?._id?.toString() || 'unknown';
    const storeName = item.store?.storeName || 'Store';
    const itemSubtotal = (item.product.price || 0) * item.quantity;
    subtotal += itemSubtotal;
    totalItems += item.quantity;

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        storeId,
        storeName,
        shippingMethod: 'Royal Shipping',
        items: [],
      });
    }

    storeMap.get(storeId).items.push({
      _id: item._id,
      product: item.product,
      quantity: item.quantity,
      itemSubtotal,
    });
  }

  return {
    groups: Array.from(storeMap.values()),
    totalItems,
    subtotal,
  };
}

export async function addToCart(userId, { productId, quantity = 1 }) {
  const numQty = Math.max(1, Number(quantity));
  const product = await Product.findById(productId);
  if (!product || product.status === 'Archived') throw new NotFoundError('Product not found.');
  if (product.quantity < numQty) throw new BadRequestError('Insufficient product stock.');

  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });

  const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += numQty;
  } else {
    cart.items.push({ product: product._id, store: product.store, quantity: numQty });
  }

  await cart.save();
  return getCart(userId);
}

export async function updateCartItem(userId, itemId, quantity) {
  const numQty = Number(quantity);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError('Cart not found.');

  const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
  if (itemIndex === -1) throw new NotFoundError('Cart item not found.');

  if (numQty <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = numQty;
  }

  await cart.save();
  return getCart(userId);
}

export async function removeFromCart(userId, itemId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError('Cart not found.');

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();
  return getCart(userId);
}
